/**
 * 🎯 Boss AI Router
 * 
 * Routes incoming tickets to the correct agent team based on type,
 * priority, and content. Uses simple rule-based logic for fast,
 * reliable routing without LLM calls.
 * 
 * @example
 * const router = BossRouter.getInstance();
 * const team = router.routeTicket(ticket);
 * // team = AgentTeamType.Answer for ai_to_human tickets
 */

import { AgentTeamType } from '../types/agentTeam';
import { Ticket } from '../types/ticket';

/**
 * Routing rule definition
 */
interface RoutingRule {
    name: string;
    condition: (ticket: Ticket) => boolean;
    team: AgentTeamType;
    priority: number; // Higher number = higher priority (checked first)
}

/**
 * Boss AI Router - Routes tickets to agent teams
 * 
 * Singleton service that determines which agent team should handle
 * each ticket based on configurable rules. Stateless and thread-safe.
 */
export class BossRouter {
    private static instance: BossRouter;
    private rules: RoutingRule[];

    /**
     * Private constructor (singleton pattern)
     */
    private constructor() {
        this.rules = this.initializeRules();
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): BossRouter {
        if (!BossRouter.instance) {
            BossRouter.instance = new BossRouter();
        }
        return BossRouter.instance;
    }

    /**
     * Initialize routing rules (in priority order)
     * 
     * Rules are checked in descending priority order.
     * First matching rule wins.
     */
    private initializeRules(): RoutingRule[] {
        return [
            // Rule 1: AI asking human for clarification → Answer Team
            {
                name: 'AI to Human Clarification',
                priority: 100,
                condition: (ticket) => ticket.type === 'ai_to_human',
                team: AgentTeamType.Answer
            },

            // Rule 2: P1 tickets with planning keywords → Planning Team
            {
                name: 'P1 Planning Request',
                priority: 90,
                condition: (ticket) =>
                    ticket.priority === 1 &&
                    this.containsPlanningKeywords(ticket.title + ' ' + ticket.description),
                team: AgentTeamType.Planning
            },

            // Rule 3: Verification/testing keywords → Verification Team
            {
                name: 'Verification Request',
                priority: 80,
                condition: (ticket) =>
                    this.containsVerificationKeywords(ticket.title + ' ' + ticket.description),
                team: AgentTeamType.Verification
            },

            // Rule 4: Research/investigation keywords → Research Team
            {
                name: 'Research Request',
                priority: 70,
                condition: (ticket) =>
                    this.containsResearchKeywords(ticket.title + ' ' + ticket.description),
                team: AgentTeamType.Research
            },

            // Rule 5: General questions from human → Answer Team
            {
                name: 'Human Question',
                priority: 60,
                condition: (ticket) =>
                    ticket.type === 'human_to_ai' &&
                    this.containsQuestionKeywords(ticket.title + ' ' + ticket.description),
                team: AgentTeamType.Answer
            },

            // Rule 6: P1 tickets without specific keywords → Planning Team (high priority work)
            {
                name: 'P1 Default to Planning',
                priority: 50,
                condition: (ticket) => ticket.priority === 1,
                team: AgentTeamType.Planning
            },

            // Rule 7: Implementation/coding requests → Planning Team
            {
                name: 'Implementation Request',
                priority: 40,
                condition: (ticket) =>
                    this.containsImplementationKeywords(ticket.title + ' ' + ticket.description),
                team: AgentTeamType.Planning
            }
        ];
    }

    /**
     * Route a ticket to the appropriate agent team
     * 
     * @param ticket The ticket to route
     * @returns The agent team that should handle this ticket
     * @throws Error if ticket is null/undefined or invalid
     */
    public routeTicket(ticket: Ticket): AgentTeamType {
        // Validation
        if (!ticket) {
            throw new Error('BossRouter: Cannot route null or undefined ticket');
        }

        if (!ticket.ticket_id || !ticket.type || ticket.priority === undefined) {
            console.warn(`BossRouter: Invalid ticket data`, {
                ticket_id: ticket.ticket_id,
                type: ticket.type,
                priority: ticket.priority
            });
            return AgentTeamType.Escalate;
        }

        // Check rules in priority order (create a sorted copy to avoid mutation)
        const sortedRules = [...this.rules].sort((a, b) => b.priority - a.priority);

        for (const rule of sortedRules) {
            if (rule.condition(ticket)) {
                console.log(`🎯 Routing ticket ${ticket.ticket_id} → ${rule.team} (Rule: ${rule.name})`);
                return rule.team;
            }
        }

        // No rule matched - escalate for human decision
        console.warn(`⚠️  No routing rule matched for ticket ${ticket.ticket_id}, escalating`);
        return AgentTeamType.Escalate;
    }

    /**
     * Check if text contains planning keywords
     */
    private containsPlanningKeywords(text: string): boolean {
        const keywords = [
            'plan', 'define', 'design', 'architect', 'breakdown',
            'decompose', 'estimate', 'roadmap', 'strategy', 'outline'
        ];
        return this.containsKeywords(text, keywords);
    }

    /**
     * Check if text contains verification keywords
     */
    private containsVerificationKeywords(text: string): boolean {
        const keywords = [
            'verify', 'test', 'check', 'validate', 'review',
            'audit', 'inspect', 'confirm', 'quality', 'coverage'
        ];
        return this.containsKeywords(text, keywords);
    }

    /**
     * Check if text contains research keywords
     */
    private containsResearchKeywords(text: string): boolean {
        const keywords = [
            'research', 'investigate', 'explore', 'analyze', 'study',
            'feasibility', 'compare', 'evaluate', 'assess', 'options'
        ];
        return this.containsKeywords(text, keywords);
    }

    /**
     * Check if text contains question keywords
     */
    private containsQuestionKeywords(text: string): boolean {
        const keywords = [
            'what', 'why', 'how', 'when', 'where', 'who',
            'explain', 'clarify', 'help', 'question', '?'
        ];
        return this.containsKeywords(text, keywords);
    }

    /**
     * Check if text contains implementation keywords
     */
    private containsImplementationKeywords(text: string): boolean {
        const keywords = [
            'implement', 'code', 'develop', 'build', 'create',
            'add', 'fix', 'update', 'refactor', 'feature'
        ];
        return this.containsKeywords(text, keywords);
    }

    /**
     * Helper method to check if text contains any of the given keywords
     * Uses word boundary matching to avoid false positives
     */
    private containsKeywords(text: string, keywords: string[]): boolean {
        const lowerText = text.toLowerCase();
        const matched = keywords.find(keyword => {
            // Escape special regex characters
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Use word boundary regex for more precise matching (except for "?" which is standalone)
            if (keyword === '?') {
                return lowerText.includes('?');
            }
            const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
            return regex.test(lowerText);
        });

        if (matched) {
            //console.log(`[DEBUG] Matched keyword "${matched}" in text: "${text.substring(0, 50)}..."`);
        }

        return matched !== undefined;
    }

    /**
     * Get all routing rules (for testing/debugging)
     */
    public getRules(): ReadonlyArray<Readonly<RoutingRule>> {
        return this.rules;
    }

    /**
     * Add a custom routing rule (for extensibility)
     * 
     * @param rule The routing rule to add
     */
    public addRule(rule: RoutingRule): void {
        this.rules.push(rule);
        console.log(`BossRouter: Added custom rule "${rule.name}" with priority ${rule.priority}`);
    }

    /**
     * Reset rules to default (for testing)
     */
    public resetRules(): void {
        this.rules = this.initializeRules();
    }
}
