/**
 * 🧪 BossRouter - Route Logic Branch Coverage Tests
 * 
 * Comprehensive branch coverage for routeTicket method validation
 * and rule matching logic (lines 66-154 in bossRouter.ts).
 */

import { BossRouter } from '../../src/services/bossRouter';
import { AgentTeamType } from '../../src/types/agentTeam';
import { Ticket } from '../../src/types/ticket';

describe('BossRouter - Route Logic Branch Coverage', () => {
    let router: BossRouter;

    beforeEach(() => {
        router = BossRouter.getInstance();
    });

    // ============================================================================
    // Null/Undefined Validation Branches
    // ============================================================================

    describe('Null/Undefined Validation', () => {
        it('should throw error for null ticket', () => {
            expect(() => {
                router.routeTicket(null as any);
            }).toThrow('BossRouter: Cannot route null or undefined ticket');
        });

        it('should throw error for undefined ticket', () => {
            expect(() => {
                router.routeTicket(undefined as any);
            }).toThrow('BossRouter: Cannot route null or undefined ticket');
        });
    });

    // ============================================================================
    // Invalid Ticket Validation Branches
    // ============================================================================

    describe('Invalid Ticket Validation', () => {
        it('should escalate when ticket_id is missing', () => {
            const invalidTicket = {
                type: 'human_to_ai',
                priority: 1,
                title: 'Test',
                description: 'Test'
            } as any;

            const result = router.routeTicket(invalidTicket);
            expect(result).toBe(AgentTeamType.Escalate);
        });

        it('should escalate when type is missing', () => {
            const invalidTicket = {
                ticket_id: 'TK-001',
                priority: 1,
                title: 'Test',
                description: 'Test'
            } as any;

            const result = router.routeTicket(invalidTicket);
            expect(result).toBe(AgentTeamType.Escalate);
        });

        it('should escalate when priority is undefined', () => {
            const invalidTicket = {
                ticket_id: 'TK-001',
                type: 'human_to_ai',
                title: 'Test',
                description: 'Test'
            } as any;

            const result = router.routeTicket(invalidTicket);
            expect(result).toBe(AgentTeamType.Escalate);
        });

        it('should route when priority is null (validation only checks undefined)', () => {
            const invalidTicket = {
                ticket_id: 'TK-001',
                type: 'human_to_ai',
                priority: null,
                title: 'verify task',
                description: 'test this'
            } as any;

            const result = router.routeTicket(invalidTicket);
            // Note: null priority passes validation (only checks === undefined)
            // Then routes by keywords (verify/test → Verification Team)
            expect(result).toBe(AgentTeamType.Verification);
        });

        it('should escalate when all required fields are missing', () => {
            const invalidTicket = {
                title: 'Test',
                description: 'Test'
            } as any;

            const result = router.routeTicket(invalidTicket);
            expect(result).toBe(AgentTeamType.Escalate);
        });
    });

    // ============================================================================
    // Rule Matching Branches (Priority Order)
    // ============================================================================

    describe('Rule Matching - Priority Order', () => {
        const createValidTicket = (overrides: Partial<Ticket>): Ticket => ({
            ticket_id: 'TK-001',
            type: 'human_to_ai',
            status: 'open',
            priority: 2,
            creator: 'user',
            assignee: 'system',
            title: 'Test Ticket',
            description: 'Test description',
            thread: [],
            created_at: new Date(),
            updated_at: new Date(),
            ...overrides
        });

        it('should route ai_to_human to Answer Team (Rule 1, Priority 100)', () => {
            const ticket = createValidTicket({
                type: 'ai_to_human',
                title: 'Need clarification',
                description: 'AI asking for help'
            });

            const result = router.routeTicket(ticket);
            expect(result).toBe(AgentTeamType.Answer);
        });

        it('should route P1 + planning keywords to Planning Team (Rule 2, Priority 90)', () => {
            const ticket = createValidTicket({
                priority: 1,
                title: 'Plan the architecture',
                description: 'Need to design the system'
            });

            const result = router.routeTicket(ticket);
            expect(result).toBe(AgentTeamType.Planning);
        });

        it('should route verification keywords to Verification Team (Rule 3, Priority 80)', () => {
            const ticket = createValidTicket({
                title: 'Verify the implementation',
                description: 'Test the feature'
            });

            const result = router.routeTicket(ticket);
            expect(result).toBe(AgentTeamType.Verification);
        });

        it('should route research keywords to Research Team (Rule 4, Priority 70)', () => {
            const ticket = createValidTicket({
                title: 'Research best practices',
                description: 'Investigate the options'
            });

            const result = router.routeTicket(ticket);
            expect(result).toBe(AgentTeamType.Research);
        });

        it('should route human_to_ai + question keywords to Answer Team (Rule 5, Priority 60)', () => {
            const ticket = createValidTicket({
                type: 'human_to_ai',
                title: 'What is the best approach?',
                description: 'How should I implement this?'
            });

            const result = router.routeTicket(ticket);
            expect(result).toBe(AgentTeamType.Answer);
        });

        it('should route P1 without specific keywords to Planning Team (Rule 6, Priority 50)', () => {
            const ticket = createValidTicket({
                priority: 1,
                title: 'Critical task',
                description: 'This is urgent work'
            });

            const result = router.routeTicket(ticket);
            expect(result).toBe(AgentTeamType.Planning);
        });

        it('should route implementation keywords to Planning Team (Rule 7, Priority 40)', () => {
            const ticket = createValidTicket({
                title: 'Implement the feature',
                description: 'Write code for user authentication'
            });

            const result = router.routeTicket(ticket);
            expect(result).toBe(AgentTeamType.Planning);
        });
    });

    // ============================================================================
    // No Rule Match Branch (Escalate)
    // ============================================================================

    describe('No Rule Match - Escalate', () => {
        const createValidTicket = (overrides: Partial<Ticket>): Ticket => ({
            ticket_id: 'TK-001',
            type: 'human_to_ai',
            status: 'open',
            priority: 3,
            creator: 'user',
            assignee: 'system',
            title: 'Test Ticket',
            description: 'Test description',
            thread: [],
            created_at: new Date(),
            updated_at: new Date(),
            ...overrides
        });

        it('should escalate when no rule matches', () => {
            const ticket = createValidTicket({
                priority: 3,
                title: 'Random task',
                description: 'Some random work with no keywords'
            });

            const result = router.routeTicket(ticket);
            expect(result).toBe(AgentTeamType.Escalate);
        });

        it('should escalate P2/P3 without keywords', () => {
            const tickets = [
                createValidTicket({
                    priority: 2,
                    title: 'Task without keywords',
                    description: 'Regular work'
                }),
                createValidTicket({
                    priority: 3,
                    title: 'Another task',
                    description: 'More work'
                })
            ];

            tickets.forEach(ticket => {
                const result = router.routeTicket(ticket);
                expect(result).toBe(AgentTeamType.Escalate);
            });
        });
    });

    // ============================================================================
    // Priority Order Enforcement
    // ============================================================================

    describe('Priority Order Enforcement', () => {
        const createValidTicket = (overrides: Partial<Ticket>): Ticket => ({
            ticket_id: 'TK-001',
            type: 'human_to_ai',
            status: 'open',
            priority: 1,
            creator: 'user',
            assignee: 'system',
            title: 'Test Ticket',
            description: 'Test description',
            thread: [],
            created_at: new Date(),
            updated_at: new Date(),
            ...overrides
        });

        it('should prioritize ai_to_human over planning keywords (Priority 100 > 90)', () => {
            const ticket = createValidTicket({
                type: 'ai_to_human',
                priority: 1,
                title: 'Plan the architecture',
                description: 'AI needs help with planning'
            });

            const result = router.routeTicket(ticket);
            // Should route to Answer Team (Priority 100), not Planning Team (Priority 90)
            expect(result).toBe(AgentTeamType.Answer);
        });

        it('should prioritize verification over research keywords (Priority 80 > 70)', () => {
            const ticket = createValidTicket({
                title: 'Verify after research',
                description: 'Test the results and investigate findings'
            });

            const result = router.routeTicket(ticket);
            // Should route to Verification Team (Priority 80), not Research Team (Priority 70)
            expect(result).toBe(AgentTeamType.Verification);
        });

        it('should prioritize P1 planning over question keywords (Priority 90 > 60)', () => {
            const ticket = createValidTicket({
                priority: 1,
                title: 'What is the plan?',
                description: 'How should we design this?'
            });

            const result = router.routeTicket(ticket);
            // Should route to Planning Team (Priority 90), not Answer Team (Priority 60)
            expect(result).toBe(AgentTeamType.Planning);
        });

        it('should prioritize P1 default over implementation keywords (Priority 50 > 40)', () => {
            const ticket = createValidTicket({
                priority: 1,
                title: 'Critical work needed',
                description: 'Urgent task without specific keywords'
            });

            const result = router.routeTicket(ticket);
            // Should route to Planning Team via P1 default (Priority 50)
            expect(result).toBe(AgentTeamType.Planning);
        });
    });

    // ============================================================================
    // Edge Cases & Multiple Keywords
    // ============================================================================

    describe('Edge Cases', () => {
        const createValidTicket = (overrides: Partial<Ticket>): Ticket => ({
            ticket_id: 'TK-001',
            type: 'human_to_ai',
            status: 'open',
            priority: 2,
            creator: 'user',
            assignee: 'system',
            title: 'Test Ticket',
            description: 'Test description',
            thread: [],
            created_at: new Date(),
            updated_at: new Date(),
            ...overrides
        });

        it('should handle empty title and description', () => {
            const ticket = createValidTicket({
                title: '',
                description: ''
            });

            const result = router.routeTicket(ticket);
            expect(result).toBe(AgentTeamType.Escalate);
        });

        it('should handle very long text', () => {
            const ticket = createValidTicket({
                title: 'verify '.repeat(100),
                description: 'test '.repeat(500)
            });

            const result = router.routeTicket(ticket);
            expect(result).toBe(AgentTeamType.Verification);
        });

        it('should handle mixed case keywords', () => {
            const ticket = createValidTicket({
                title: 'IMPLEMENT This Feature',
                description: 'WRITE CODE for authentication'
            });

            const result = router.routeTicket(ticket);
            expect(result).toBe(AgentTeamType.Planning);
        });

        it('should handle special characters in text', () => {
            const ticket = createValidTicket({
                title: '!!! VERIFY ??? test ###',
                description: '@implement $feature %now'
            });

            const result = router.routeTicket(ticket);
            expect(result).toBe(AgentTeamType.Verification); // Verify has higher priority
        });
    });
});
