/**
 * MCP Tool: askQuestion
 * Routes questions to Answer Team for context-aware responses from plan and codebase
 * 
 * Purpose:
 * - Provides answers from plan.json and documentation
 * - Returns confidence-scored responses with evidence
 * - Includes implementation guidance and examples
 * - Surfaces related design decisions
 * 
 * References:
 * - Plans/COE-Master-Plan/05-MCP-API-Reference.md (Tool 3: askQuestion)
 */

import { z } from 'zod';
import { MCPErrorCode, MCPProtocolError } from '../protocol';

// ============================================================================
// Request/Response Schemas (Zod Validation)
// ============================================================================

/**
 * Request schema for askQuestion
 */
export const AskQuestionRequestSchema = z.object({
    question: z.string().min(1, 'Question cannot be empty'),
    context: z.string().optional(),
    currentTaskId: z.string().optional(),
    searchInPlan: z.string().optional(),
    includeRelatedDecisions: z.boolean().optional(),
});

export type AskQuestionRequest = z.infer<typeof AskQuestionRequestSchema>;

/**
 * Evidence from plan or codebase
 */
export interface Evidence {
    source: string;
    planVersion: string;
    section: string;
    exactQuote?: string;
    lineNumbers?: number[];
}

/**
 * Implementation guidance
 */
export interface Guidance {
    implementation?: string;
    animation?: string;
    accessibility?: string;
    examples?: Record<string, string>;
}

/**
 * Related decision structure
 */
export interface Decision {
    id: string;
    title: string;
    decision: string;
    rationale: string;
}

/**
 * Response schema for askQuestion
 */
export interface AskQuestionResponse {
    success: boolean;
    question: string;
    answerFromPlan?: string;
    confidence: number; // 0.0 - 1.0

    evidence?: Evidence;
    guidance?: Guidance;
    relatedDesignChoices?: string[];
    relatedDecisions?: Decision[];
    uncertainty?: string; // Explanation if confidence < 0.7
}

// ============================================================================
// Question Analysis
// ============================================================================

/**
 * Analyze question and extract key topics
 */
function extractTopics(question: string): string[] {
    const lowercaseQuestion = question.toLowerCase();
    const topics: string[] = [];

    // Common topics
    const topicPatterns = {
        'responsive': /responsive|mobile|tablet|desktop|breakpoint/i,
        'accessibility': /accessibility|a11y|wcag|aria|screen reader/i,
        'animation': /animation|transition|motion|animate/i,
        'styling': /color|style|css|theme|font|typography/i,
        'navigation': /navigation|nav|sidebar|menu|routing/i,
        'state': /state|data|store|redux|context/i,
        'testing': /test|testing|jest|spec|coverage/i,
        'performance': /performance|optimize|speed|lazy|cache/i,
    };

    for (const [topic, pattern] of Object.entries(topicPatterns)) {
        if (pattern.test(lowercaseQuestion)) {
            topics.push(topic);
        }
    }

    return topics;
}

// ============================================================================
// Answer Generation (Mock Implementation)
// ============================================================================

/**
 * Generate answer from plan (simplified mock implementation)
 * 
 * TODO: In production, this would:
 * 1. Parse plan.json from workspace
 * 2. Search design choices, decisions, and requirements
 * 3. Use vector search or fuzzy matching
 * 4. Extract relevant sections
 * 5. Build contextualized answer
 */
function generateAnswerFromPlan(
    question: string,
    context?: string,
    searchTerm?: string
): {
    answer?: string;
    confidence: number;
    evidence?: Evidence;
    guidance?: Guidance;
    relatedChoices?: string[];
    uncertainty?: string;
} {
    const topics = extractTopics(question);

    // Mock responses based on detected topics
    // In production, this would search actual plan.json

    if (topics.includes('responsive')) {
        return {
            answer: 'Based on the design system, use responsive breakpoints: Mobile (0-767px), Tablet (768-1023px), Desktop (1024px+). Components should collapse or stack on mobile.',
            confidence: 0.95,
            evidence: {
                source: 'PRD.md / Design System',
                planVersion: '1.0.0',
                section: 'Design Choices > Responsive Behavior',
                exactQuote: 'Use mobile-first approach with breakpoints at 768px and 1024px',
            },
            guidance: {
                implementation: 'Use CSS media queries with mobile-first approach: @media (min-width: 768px) for tablet, @media (min-width: 1024px) for desktop',
                examples: {
                    'mediaQuery': '@media (max-width: 767px) { /* Mobile styles */ }',
                },
            },
            relatedChoices: [
                'Breakpoints: Mobile 0-767px, Tablet 768-1023px, Desktop 1024px+',
                'Mobile-first design approach',
            ],
        };
    }

    if (topics.includes('accessibility')) {
        return {
            answer: 'All UI components must meet WCAG AA standards (minimum 4.5:1 contrast ratio). Include aria-labels, keyboard navigation, and screen reader support.',
            confidence: 0.92,
            evidence: {
                source: 'PRD.md / Accessibility Requirements',
                planVersion: '1.0.0',
                section: 'Non-Functional Requirements > Accessibility',
            },
            guidance: {
                accessibility: 'Use semantic HTML, add ARIA attributes where needed, ensure keyboard navigation works, test with screen readers',
                examples: {
                    'ariaLabel': '<button aria-label="Close menu">X</button>',
                    'keyboardNav': 'onKeyDown={(e) => e.key === "Enter" && handleClick()}',
                },
            },
            relatedChoices: [
                'WCAG AA compliance required',
                'Keyboard navigation support',
                'Screen reader compatibility',
            ],
        };
    }

    if (topics.includes('testing')) {
        return {
            answer: 'Maintain ≥80% test coverage for all new code (≥90% for critical components). Use Jest for unit tests and integration tests.',
            confidence: 0.88,
            evidence: {
                source: 'PRD.md / Testing Standards',
                planVersion: '1.0.0',
                section: 'Quality Standards > Testing',
            },
            guidance: {
                implementation: 'Write tests before marking tasks complete. Cover happy path, edge cases, and error scenarios.',
                examples: {
                    'testStructure': 'describe("Component", () => { it("should render", () => {...}); });',
                },
            },
            relatedChoices: [
                'Test coverage: ≥80% (≥90% for P1 tasks)',
                'Jest for unit/integration tests',
            ],
        };
    }

    // Default low-confidence response
    return {
        confidence: 0.35,
        uncertainty: `The plan doesn't specifically address "${question}". This may need to be decided based on project requirements or team preferences. Consider checking existing codebase patterns or consulting with the team.`,
        guidance: {
            implementation: 'Review existing implementations in the codebase for similar patterns, or propose a solution based on best practices.',
        },
    };
}

/**
 * Find related decisions based on topics
 */
function findRelatedDecisions(topics: string[]): Decision[] {
    // Mock implementation
    // In production, would search actual decisions from plan.json

    const decisions: Decision[] = [];

    if (topics.includes('styling') || topics.includes('animation')) {
        decisions.push({
            id: 'DEC-001',
            title: 'Use CSS-in-JS vs Traditional CSS',
            decision: 'Use CSS Modules for component styling',
            rationale: 'Provides scoping without runtime overhead, compatible with existing tooling',
        });
    }

    if (topics.includes('state')) {
        decisions.push({
            id: 'DEC-002',
            title: 'State Management Approach',
            decision: 'Use React Context for global state, local state for components',
            rationale: 'Simpler than Redux for current requirements, can migrate later if needed',
        });
    }

    return decisions;
}

// ============================================================================
// Main Tool Implementation
// ============================================================================

/**
 * askQuestion MCP Tool
 * 
 * Routes questions to Answer Team and returns context-aware responses.
 * 
 * @param params - Request parameters (question, context, etc.)
 * @returns AskQuestionResponse with answer and confidence level
 */
export async function askQuestion(
    params: Record<string, unknown>
): Promise<AskQuestionResponse> {
    // Validate request parameters
    let validatedParams: AskQuestionRequest;
    try {
        validatedParams = AskQuestionRequestSchema.parse(params);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new MCPProtocolError(
                MCPErrorCode.INVALID_PARAMS,
                `Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`,
                { zodErrors: error.errors }
            );
        }
        throw error;
    }

    // Extract topics from question
    const topics = extractTopics(validatedParams.question);

    // Generate answer from plan
    const answerData = generateAnswerFromPlan(
        validatedParams.question,
        validatedParams.context,
        validatedParams.searchInPlan
    );

    // Find related decisions if requested
    let relatedDecisions: Decision[] | undefined;
    if (validatedParams.includeRelatedDecisions !== false) {
        relatedDecisions = findRelatedDecisions(topics);
        if (relatedDecisions.length === 0) {
            relatedDecisions = undefined; // Don't include empty array
        }
    }

    // Build response
    const response: AskQuestionResponse = {
        success: true,
        question: validatedParams.question,
        confidence: answerData.confidence,
    };

    // Add answer if confidence is reasonable
    if (answerData.answer) {
        response.answerFromPlan = answerData.answer;
    }

    // Add evidence if available
    if (answerData.evidence) {
        response.evidence = answerData.evidence;
    }

    // Add guidance
    if (answerData.guidance) {
        response.guidance = answerData.guidance;
    }

    // Add related design choices
    if (answerData.relatedChoices && answerData.relatedChoices.length > 0) {
        response.relatedDesignChoices = answerData.relatedChoices;
    }

    // Add related decisions
    if (relatedDecisions) {
        response.relatedDecisions = relatedDecisions;
    }

    // Add uncertainty explanation for low confidence
    if (answerData.confidence < 0.7) {
        response.uncertainty = answerData.uncertainty ||
            'The answer has low confidence. Additional context or clarification may be needed.';
    }

    return response;
}
