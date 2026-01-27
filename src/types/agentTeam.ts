/**
 * 🤖 Agent Team Type Definitions
 * 
 * Defines the available agent teams in the COE system
 * for routing tickets and coordinating work.
 */

/**
 * Agent team types used for routing tickets
 */
export enum AgentTeamType {
    /**
     * Planning Team - Decomposes complex work into tasks
     * Use for: Project planning, task breakdown, effort estimation
     */
    Planning = 'planning',

    /**
     * Answer Team - Provides context-aware Q&A
     * Use for: Human clarifications, documentation questions, context searches
     */
    Answer = 'answer',

    /**
     * Verification Team - Tests and validates completed work
     * Use for: Code review, test execution, quality checks
     */
    Verification = 'verification',

    /**
     * Research Team - Investigates unknowns and explores solutions
     * Use for: Technology research, design exploration, problem analysis
     */
    Research = 'research',

    /**
     * Escalate - Route to human or Programming Orchestrator
     * Use for: Unknown cases, ambiguous requests, complex decisions
     */
    Escalate = 'escalate'
}

/**
 * Type guard to check if a string is a valid AgentTeamType
 */
export function isValidAgentTeamType(value: string): value is AgentTeamType {
    return Object.values(AgentTeamType).includes(value as AgentTeamType);
}
