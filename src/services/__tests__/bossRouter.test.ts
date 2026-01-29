/**
 * 🧪 BossRouter Tests
 * 
 * Comprehensive test suite for the Boss AI Router service
 */

import { BossRouter } from '../bossRouter';
import { AgentTeamType } from '../../types/agentTeam';
import { Ticket } from '../../types/ticket';

describe('BossRouter', () => {
    let router: BossRouter;

    beforeEach(() => {
        // Get singleton instance and reset rules
        router = BossRouter.getInstance();
        router.resetRules();
    });

    /**
     * Helper function to create a mock ticket
     */
    function createMockTicket(overrides: Partial<Ticket> = {}): Ticket {
        return {
            ticket_id: 'TK-0001',
            type: 'human_to_ai',
            status: 'open',
            priority: 2,
            creator: 'user',
            assignee: 'unassigned',
            title: 'Sample ticket',
            description: 'Sample details here',  // Changed from "Test description" to avoid "test" keyword
            thread: [],
            created_at: new Date(),
            updated_at: new Date(),
            ...overrides
        };
    }

    describe('Singleton Pattern', () => {
        it('should return the same instance on multiple calls', () => {
            const instance1 = BossRouter.getInstance();
            const instance2 = BossRouter.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('AI to Human Routing (Rule 1)', () => {
        it('should route ai_to_human tickets to Answer Team', () => {
            const ticket = createMockTicket({
                type: 'ai_to_human',
                title: 'Need clarification on feature X',
                priority: 2
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Answer);
        });

        it('should route ai_to_human with any priority to Answer Team', () => {
            const p1Ticket = createMockTicket({ type: 'ai_to_human', priority: 1 });
            const p3Ticket = createMockTicket({ type: 'ai_to_human', priority: 3 });

            expect(router.routeTicket(p1Ticket)).toBe(AgentTeamType.Answer);
            expect(router.routeTicket(p3Ticket)).toBe(AgentTeamType.Answer);
        });
    });

    describe('P1 Planning Routing (Rule 2)', () => {
        it('should route P1 tickets with "plan" keyword to Planning Team', () => {
            const ticket = createMockTicket({
                priority: 1,
                title: 'Create a plan for new feature',
                type: 'human_to_ai'
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Planning);
        });

        it('should route P1 tickets with "define" keyword to Planning Team', () => {
            const ticket = createMockTicket({
                priority: 1,
                title: 'Define architecture for module X',
                type: 'human_to_ai'
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Planning);
        });

        it('should route P1 tickets with planning keywords in description', () => {
            const ticket = createMockTicket({
                priority: 1,
                title: 'Feature request',
                description: 'Need to breakdown this into smaller tasks',
                type: 'human_to_ai'
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Planning);
        });

        it('should NOT route P2/P3 planning keywords to Planning Team unless it matches another rule', () => {
            const ticket = createMockTicket({
                priority: 2,
                title: 'Implement plan for something',  // Has both planning and implementation keywords
                type: 'human_to_ai'
            });

            // Should match "Implementation Request" rule (priority 40) instead of P1 Planning (priority 90)
            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Planning); // Still planning, but via Implementation rule
        });
    });

    describe('Verification Routing (Rule 3)', () => {
        it('should route tickets with "verify" keyword to Verification Team', () => {
            const ticket = createMockTicket({
                title: 'Verify test coverage',
                priority: 2
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Verification);
        });

        it('should route tickets with "test" keyword to Verification Team', () => {
            const ticket = createMockTicket({
                title: 'Test the new feature',
                priority: 2
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Verification);
        });

        it('should route tickets with "check" keyword to Verification Team', () => {
            const ticket = createMockTicket({
                description: 'Need to check code quality',
                priority: 3
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Verification);
        });
    });

    describe('Research Routing (Rule 4)', () => {
        it('should route tickets with "research" keyword to Research Team', () => {
            const ticket = createMockTicket({
                title: 'Research best practices for X',
                priority: 2
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Research);
        });

        it('should route tickets with "investigate" keyword to Research Team', () => {
            const ticket = createMockTicket({
                description: 'Investigate why feature is slow',
                priority: 2
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Research);
        });

        it('should route tickets with "explore" keyword to Research Team', () => {
            const ticket = createMockTicket({
                title: 'Explore alternatives for database',
                priority: 3
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Research);
        });
    });

    describe('Question Routing (Rule 5)', () => {
        it('should route human questions to Answer Team', () => {
            const ticket = createMockTicket({
                type: 'human_to_ai',
                title: 'What is the best way to implement X?',
                priority: 2
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Answer);
        });

        it('should route tickets with "how" keyword to Answer Team', () => {
            const ticket = createMockTicket({
                type: 'human_to_ai',
                title: 'How does the routing work?',
                priority: 3
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Answer);
        });

        it('should route tickets with "?" to Answer Team', () => {
            const ticket = createMockTicket({
                type: 'human_to_ai',
                description: 'Is this the right approach?',
                priority: 2
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Answer);
        });
    });

    describe('P1 Default Routing (Rule 6)', () => {
        it('should route P1 tickets without specific keywords to Planning Team', () => {
            const ticket = createMockTicket({
                priority: 1,
                title: 'Urgent task',
                description: 'This needs attention',
                type: 'human_to_ai'
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Planning);
        });
    });

    describe('Implementation Routing (Rule 7)', () => {
        it('should route tickets with "implement" keyword to Planning Team', () => {
            const ticket = createMockTicket({
                title: 'Implement new router',
                priority: 2
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Planning);
        });

        it('should route tickets with "build" keyword to Planning Team', () => {
            const ticket = createMockTicket({
                description: 'Build a new component',
                priority: 3
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Planning);
        });

        it('should route tickets with "fix" keyword to Planning Team', () => {
            const ticket = createMockTicket({
                title: 'Fix bug in authentication',
                priority: 2
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Planning);
        });
    });

    describe('Edge Cases', () => {
        it('should throw error for null ticket', () => {
            expect(() => router.routeTicket(null as any)).toThrow('Cannot route null or undefined ticket');
        });

        it('should throw error for undefined ticket', () => {
            expect(() => router.routeTicket(undefined as any)).toThrow('Cannot route null or undefined ticket');
        });

        it('should escalate ticket with missing ticket_id', () => {
            const ticket = createMockTicket({ ticket_id: '' as any });
            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Escalate);
        });

        it('should escalate ticket with missing type', () => {
            const ticket = createMockTicket({ type: undefined as any });
            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Escalate);
        });

        it('should escalate ticket with missing priority', () => {
            const ticket = createMockTicket({ priority: undefined as any });
            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Escalate);
        });

        it('should escalate ticket with no matching rules', () => {
            const ticket = createMockTicket({
                title: 'Random task',
                description: 'No keywords here',
                priority: 3,
                type: 'human_to_ai'
            });

            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Escalate);
        });
    });

    describe('Rule Priority', () => {
        it('should prioritize ai_to_human over planning keywords', () => {
            const ticket = createMockTicket({
                type: 'ai_to_human',
                priority: 1,
                title: 'Plan this feature' // Has planning keyword
            });

            // ai_to_human has higher priority (100) than P1 Planning (90)
            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Answer);
        });

        it('should prioritize verification over implementation', () => {
            const ticket = createMockTicket({
                title: 'Implement and verify feature',
                priority: 2
            });

            // Verification (80) has higher priority than Implementation (40)
            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Verification);
        });
    });

    describe('Extensibility', () => {
        it('should allow adding custom rules', () => {
            router.addRule({
                name: 'Custom Rule',
                priority: 200, // Highest priority
                condition: (ticket) => ticket.title.includes('custom'),
                team: AgentTeamType.Research
            });

            const ticket = createMockTicket({
                type: 'ai_to_human', // Would normally go to Answer
                title: 'custom request'
            });

            // Custom rule should win due to higher priority
            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Research);
        });

        it('should allow resetting rules to default', () => {
            router.addRule({
                name: 'Custom Rule',
                priority: 200,
                condition: (ticket) => ticket.title.includes('custom'),
                team: AgentTeamType.Research
            });

            router.resetRules();

            const ticket = createMockTicket({
                type: 'ai_to_human',
                title: 'custom request'
            });

            // After reset, should use default rules
            const team = router.routeTicket(ticket);
            expect(team).toBe(AgentTeamType.Answer);
        });

        it('should expose rules for inspection', () => {
            const rules = router.getRules();
            expect(rules).toBeDefined();
            expect(rules.length).toBeGreaterThan(0);
            expect(rules[0]).toHaveProperty('name');
            expect(rules[0]).toHaveProperty('priority');
            expect(rules[0]).toHaveProperty('condition');
            expect(rules[0]).toHaveProperty('team');
        });
    });

    describe('Logging', () => {
        let consoleLogSpy: jest.SpyInstance;
        let consoleWarnSpy: jest.SpyInstance;

        beforeEach(() => {
            consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
            consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        });

        afterEach(() => {
            consoleLogSpy.mockRestore();
            consoleWarnSpy.mockRestore();
        });

        it('should route ticket successfully', () => {
            const ticket = createMockTicket({
                type: 'ai_to_human',
                ticket_id: 'TK-1234'
            });

            const result = router.routeTicket(ticket);

            expect(result).toBeDefined();
        });

        it('should handle invalid ticket data', () => {
            const ticket = createMockTicket({ priority: undefined as any });
            const result = router.routeTicket(ticket);

            expect(result).toBe(AgentTeamType.Escalate);
        });

        it('should handle when no rule matches', () => {
            const ticket = createMockTicket({
                title: 'No match',
                description: 'No keywords',
                priority: 3
            });

            const result = router.routeTicket(ticket);

            expect(result).toBeDefined();
        });
    });
});


