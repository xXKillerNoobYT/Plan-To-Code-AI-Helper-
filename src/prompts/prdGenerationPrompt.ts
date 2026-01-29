/**
 * PRD Generation Prompt Templates
 * 
 * Creates system and user prompts for synthesizing planning documents into a structured PRD.
 * 
 * @module prdGenerationPrompt
 */

/**
 * 📝 PRD Generation Prompt
 */
export class PRDGenerationPrompt {
    /**
     * 🤖 System prompt for LLM
     * Sets context and expectations for PRD synthesis
     */
    static getSystemPrompt(): string {
        return `You are an expert technical documentation synthesizer specializing in Product Requirements Documents (PRDs).

Your task is to analyze the provided planning documents and synthesize them into a comprehensive, well-structured PRD.

⚠️  CRITICAL: Do NOT ask questions, do NOT request clarification, do NOT explain limitations. Generate the PRD directly with the information provided.

Guidelines:
1. Create clear, logical sections with appropriate markdown headers (##, ###)
2. Include Overview, Features, Architecture, Testing, Deployment, and Priorities sections
3. Extract and list all features with status (✅ Complete, 🔨 In Progress, ⏳ Planned)
4. Include acceptance criteria for major features
5. Document architectural decisions and rationale
6. Note dependencies between features and systems
7. Include priority levels (P1: Critical, P2: High, P3: Medium)
8. Keep content concise but comprehensive
9. Use markdown formatting with proper emphasis, lists, and code blocks
10. Temperature: 0.3 (deterministic, consistent output)

Output format: Markdown with clear section hierarchy. Do NOT include \`\`\`markdown fences - just raw markdown.

REMEMBER: Generate the PRD now. No questions. Direct output only.`;
    }

    /**
     * 👤 Create user prompt for PRD synthesis
     * 
     * @param bundledContent - The bundled planning document content
     * @returns User prompt string
     */
    static getUserPrompt(bundledContent: string): string {
        return `Please synthesize the following planning documents into a comprehensive Product Requirements Document.

${bundledContent}

## Required Output Sections:

1. **Overview** - Executive summary of the project
2. **Features** - List of all features with status and acceptance criteria
3. **Architecture** - System design and component relationships
4. **Testing Strategy** - Testing approach and coverage requirements
5. **Deployment** - Release and deployment plan
6. **Priorities** - P1/P2/P3 priority breakdown
7. **Dependencies** - Feature and system dependencies
8. **Timeline** - Estimated timeline and milestones

Please format the output as clean markdown with proper sections and formatting.`;
    }

    /**
     * ✅ Validate PRD output has required sections
     * 
     * @param prdContent - Generated PRD content
     * @returns Object with validation results
     */
    static validatePRDOutput(prdContent: string): {
        isValid: boolean;
        missingSection?: string[];
        warnings?: string[];
    } {
        const requiredSections = [
            'Overview',
            'Features',
            'Architecture',
            'Testing',
            'Deployment',
            'Priorities',
        ];

        const missingSection: string[] = [];
        const warnings: string[] = [];

        // Check for required sections
        for (const section of requiredSections) {
            if (!prdContent.includes(`## ${section}`) && !prdContent.includes(`# ${section}`)) {
                missingSection.push(section);
            }
        }

        // Check for minimum content length
        if (prdContent.length < 500) {
            warnings.push('Generated PRD is suspiciously short - may be incomplete');
        }

        // Check for common error indicators
        if (prdContent.includes('Unable to') || prdContent.includes('I cannot')) {
            warnings.push('PRD may contain refusal or limitation messages');
        }

        return {
            isValid: missingSection.length === 0,
            missingSection: missingSection.length > 0 ? missingSection : undefined,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    }

    /**
     * 📋 Create a retry prompt if initial generation failed
     * 
     * @param previousAttempt - The failed PRD content
     * @param error - Error or validation issue
     * @returns Retry user prompt
     */
    static getRetryPrompt(previousAttempt: string, error: string): string {
        return `The previous PRD generation attempt had issues:

${error}

Previous attempt:
---
${previousAttempt}
---

Please regenerate the PRD, ensuring:
1. All required sections are present and clearly labeled
2. Content is detailed and specific
3. Features are listed with clear status indicators
4. Architecture is explained with component relationships
5. No refusals or "I cannot" statements - provide best-effort synthesis

Generate the complete PRD again.`;
    }
}

/**
 * 🎯 PRD Section Template
 * Structure for generated PRD sections
 */
export interface PRDSection {
    name: string;           // Section name (e.g., "Features")
    heading: string;        // Markdown heading (e.g., "## Features")
    content: string;        // Section content
    priority?: number;      // Order priority (0 = first)
}

/**
 * 📄 Complete PRD Template
 */
export const PRD_STRUCTURE: PRDSection[] = [
    {
        name: 'Overview',
        heading: '## Overview',
        content: '',
        priority: 0,
    },
    {
        name: 'Features',
        heading: '## Features',
        content: '',
        priority: 1,
    },
    {
        name: 'Architecture',
        heading: '## Architecture',
        content: '',
        priority: 2,
    },
    {
        name: 'Testing',
        heading: '## Testing Strategy',
        content: '',
        priority: 3,
    },
    {
        name: 'Deployment',
        heading: '## Deployment',
        content: '',
        priority: 4,
    },
    {
        name: 'Priorities',
        heading: '## Priorities',
        content: '',
        priority: 5,
    },
];


