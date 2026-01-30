/**
 * 🧪 Comprehensive Tests for Agent Team Type Definitions
 *
 * Tests AgentTeamType enum and type guard validation
 * Target Coverage: 80%+ (branches, functions, lines, statements)
 */

import { AgentTeamType, isValidAgentTeamType } from '../agentTeam';

describe('AgentTeamType', () => {
    describe('Enum Values', () => {
        it('should have Planning team type', () => {
            expect(AgentTeamType.Planning).toBe('planning');
        });

        it('should have Answer team type', () => {
            expect(AgentTeamType.Answer).toBe('answer');
        });

        it('should have Verification team type', () => {
            expect(AgentTeamType.Verification).toBe('verification');
        });

        it('should have Research team type', () => {
            expect(AgentTeamType.Research).toBe('research');
        });

        it('should have Escalate team type', () => {
            expect(AgentTeamType.Escalate).toBe('escalate');
        });

        it('should have exactly 5 team types', () => {
            const teamTypes = Object.values(AgentTeamType);
            expect(teamTypes).toHaveLength(5);
        });

        it('should contain all expected team types', () => {
            const teamTypes = Object.values(AgentTeamType);
            expect(teamTypes).toEqual(
                expect.arrayContaining([
                    'planning',
                    'answer',
                    'verification',
                    'research',
                    'escalate',
                ])
            );
        });
    });

    describe('isValidAgentTeamType', () => {
        describe('Valid Team Types', () => {
            it('should return true for "planning"', () => {
                expect(isValidAgentTeamType('planning')).toBe(true);
            });

            it('should return true for "answer"', () => {
                expect(isValidAgentTeamType('answer')).toBe(true);
            });

            it('should return true for "verification"', () => {
                expect(isValidAgentTeamType('verification')).toBe(true);
            });

            it('should return true for "research"', () => {
                expect(isValidAgentTeamType('research')).toBe(true);
            });

            it('should return true for "escalate"', () => {
                expect(isValidAgentTeamType('escalate')).toBe(true);
            });

            it('should return true for AgentTeamType enum values', () => {
                expect(isValidAgentTeamType(AgentTeamType.Planning)).toBe(true);
                expect(isValidAgentTeamType(AgentTeamType.Answer)).toBe(true);
                expect(isValidAgentTeamType(AgentTeamType.Verification)).toBe(true);
                expect(isValidAgentTeamType(AgentTeamType.Research)).toBe(true);
                expect(isValidAgentTeamType(AgentTeamType.Escalate)).toBe(true);
            });
        });

        describe('Invalid Team Types', () => {
            it('should return false for empty string', () => {
                expect(isValidAgentTeamType('')).toBe(false);
            });

            it('should return false for undefined team type', () => {
                expect(isValidAgentTeamType('undefined')).toBe(false);
            });

            it('should return false for random string', () => {
                expect(isValidAgentTeamType('random')).toBe(false);
            });

            it('should return false for uppercase valid team type', () => {
                expect(isValidAgentTeamType('PLANNING')).toBe(false);
            });

            it('should return false for mixed case valid team type', () => {
                expect(isValidAgentTeamType('Planning')).toBe(false);
            });

            it('should return false for team type with whitespace', () => {
                expect(isValidAgentTeamType(' planning ')).toBe(false);
            });

            it('should return false for team type with extra characters', () => {
                expect(isValidAgentTeamType('planning-team')).toBe(false);
            });

            it('should return false for numeric string', () => {
                expect(isValidAgentTeamType('123')).toBe(false);
            });

            it('should return false for team type with special characters', () => {
                expect(isValidAgentTeamType('plan@ning')).toBe(false);
            });

            it('should return false for similar but invalid team type', () => {
                expect(isValidAgentTeamType('planing')).toBe(false); // Missing 'n'
            });
        });

        describe('Edge Cases', () => {
            it('should handle null-like strings', () => {
                expect(isValidAgentTeamType('null')).toBe(false);
            });

            it('should handle boolean-like strings', () => {
                expect(isValidAgentTeamType('true')).toBe(false);
                expect(isValidAgentTeamType('false')).toBe(false);
            });

            it('should handle object-like strings', () => {
                expect(isValidAgentTeamType('[object Object]')).toBe(false);
            });

            it('should be case-sensitive', () => {
                expect(isValidAgentTeamType('answer')).toBe(true);
                expect(isValidAgentTeamType('Answer')).toBe(false);
                expect(isValidAgentTeamType('ANSWER')).toBe(false);
            });
        });

        describe('Type Guard Behavior', () => {
            it('should narrow type when used in conditional', () => {
                const value: string = 'planning';

                if (isValidAgentTeamType(value)) {
                    // TypeScript should narrow the type here
                    const teamType: AgentTeamType = value;
                    expect(teamType).toBe('planning');
                } else {
                    fail('Should have been valid');
                }
            });

            it('should work with Object.values comparison', () => {
                const allTeamTypes = Object.values(AgentTeamType);

                allTeamTypes.forEach((teamType) => {
                    expect(isValidAgentTeamType(teamType)).toBe(true);
                });
            });

            it('should validate against complete enum set', () => {
                const validTypes = [
                    AgentTeamType.Planning,
                    AgentTeamType.Answer,
                    AgentTeamType.Verification,
                    AgentTeamType.Research,
                    AgentTeamType.Escalate,
                ];

                validTypes.forEach((type) => {
                    expect(isValidAgentTeamType(type)).toBe(true);
                });
            });
        });
    });

    describe('Integration Tests', () => {
        it('should work in routing logic pattern', () => {
            const userInput = 'planning';

            if (isValidAgentTeamType(userInput)) {
                const team = userInput as AgentTeamType;
                expect(team).toBe(AgentTeamType.Planning);
            } else {
                fail('Should have validated successfully');
            }
        });

        it('should reject invalid input in routing pattern', () => {
            const userInput = 'invalid-team';

            if (isValidAgentTeamType(userInput)) {
                fail('Should not have validated');
            } else {
                expect(true).toBe(true); // Expected path
            }
        });

        it('should validate all enum members', () => {
            const enumKeys = Object.keys(AgentTeamType);
            const enumValues = Object.values(AgentTeamType);

            // Each enum value should be valid
            enumValues.forEach((value) => {
                expect(isValidAgentTeamType(value)).toBe(true);
            });

            // Enum should have expected number of members
            expect(enumKeys).toHaveLength(5);
            expect(enumValues).toHaveLength(5);
        });

        it('should maintain enum integrity', () => {
            // Verify enum hasn't been accidentally modified
            expect(AgentTeamType.Planning).toBe('planning');
            expect(AgentTeamType.Answer).toBe('answer');
            expect(AgentTeamType.Verification).toBe('verification');
            expect(AgentTeamType.Research).toBe('research');
            expect(AgentTeamType.Escalate).toBe('escalate');
        });
    });

    describe('Performance and Consistency', () => {
        it('should consistently validate same input', () => {
            const input = 'planning';

            expect(isValidAgentTeamType(input)).toBe(true);
            expect(isValidAgentTeamType(input)).toBe(true);
            expect(isValidAgentTeamType(input)).toBe(true);
        });

        it('should handle rapid validation calls', () => {
            const inputs = ['planning', 'answer', 'invalid', 'verification'];

            inputs.forEach((input) => {
                const isValid = isValidAgentTeamType(input);
                expect(typeof isValid).toBe('boolean');
            });
        });

        it('should validate all team types efficiently', () => {
            const allTypes = Object.values(AgentTeamType);
            const results = allTypes.map((type) => isValidAgentTeamType(type));

            expect(results.every((result) => result === true)).toBe(true);
        });
    });
});
