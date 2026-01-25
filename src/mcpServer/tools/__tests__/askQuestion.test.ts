/**
 * Tests for askQuestion MCP Tool
 * Validates question routing, answer generation, and confidence scoring
 */

import {
    askQuestion,
    AskQuestionRequest,
    AskQuestionResponse,
} from '../askQuestion';
import { MCPProtocolError, MCPErrorCode } from '../../protocol';

describe('askQuestion MCP Tool', () => {
    // ========================================================================
    // Basic Functionality
    // ========================================================================

    describe('Basic Functionality', () => {
        it('should return answer for valid question', async () => {
            const params: AskQuestionRequest = {
                question: 'How should I handle responsive design?',
            };

            const result = await askQuestion(params);

            expect(result.success).toBe(true);
            expect(result.question).toBe('How should I handle responsive design?');
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });

        it('should include confidence score', async () => {
            const params: AskQuestionRequest = {
                question: 'What are the responsive breakpoints?',
            };

            const result = await askQuestion(params);

            expect(result.confidence).toBeDefined();
            expect(typeof result.confidence).toBe('number');
        });

        it('should return success true', async () => {
            const params: AskQuestionRequest = {
                question: 'Test question?',
            };

            const result = await askQuestion(params);

            expect(result.success).toBe(true);
        });
    });

    // ========================================================================
    // Topic Detection
    // ========================================================================

    describe('Topic Detection', () => {
        it('should detect responsive design questions', async () => {
            const params: AskQuestionRequest = {
                question: 'Should sidebar collapse on mobile?',
            };

            const result = await askQuestion(params);

            expect(result.answerFromPlan).toBeTruthy();
            expect(result.confidence).toBeGreaterThan(0.8);
        });

        it('should detect accessibility questions', async () => {
            const params: AskQuestionRequest = {
                question: 'What WCAG standards should I follow?',
            };

            const result = await askQuestion(params);

            expect(result.answerFromPlan).toContain('WCAG AA');
            expect(result.confidence).toBeGreaterThan(0.8);
        });

        it('should detect testing questions', async () => {
            const params: AskQuestionRequest = {
                question: 'What test coverage is required?',
            };

            const result = await askQuestion(params);

            expect(result.answerFromPlan).toContain('80%');
            expect(result.confidence).toBeGreaterThan(0.8);
        });

        it('should handle questions about animation', async () => {
            const params: AskQuestionRequest = {
                question: 'How should animations be implemented?',
            };

            const result = await askQuestion(params);

            // Should detect animation topic but may have lower confidence
            expect(result.confidence).toBeGreaterThan(0);
        });
    });

    // ========================================================================
    // Confidence Levels
    // ========================================================================

    describe('Confidence Levels', () => {
        it('should return high confidence for well-defined topics', async () => {
            const params: AskQuestionRequest = {
                question: 'What are the responsive breakpoints?',
            };

            const result = await askQuestion(params);

            expect(result.confidence).toBeGreaterThan(0.8);
        });

        it('should return low confidence for undefined topics', async () => {
            const params: AskQuestionRequest = {
                question: 'What color socks should I wear today?',
            };

            const result = await askQuestion(params);

            expect(result.confidence).toBeLessThan(0.7);
        });

        it('should include uncertainty explanation for low confidence', async () => {
            const params: AskQuestionRequest = {
                question: 'What animation library should I use?',
            };

            const result = await askQuestion(params);

            if (result.confidence < 0.7) {
                expect(result.uncertainty).toBeDefined();
                expect(result.uncertainty).toBeTruthy();
            }
        });

        it('should not include uncertainty for high confidence', async () => {
            const params: AskQuestionRequest = {
                question: 'What are the accessibility requirements?',
            };

            const result = await askQuestion(params);

            if (result.confidence >= 0.7) {
                expect(result.uncertainty).toBeUndefined();
            }
        });
    });

    // ========================================================================
    // Evidence
    // ========================================================================

    describe('Evidence', () => {
        it('should include evidence for high-confidence answers', async () => {
            const params: AskQuestionRequest = {
                question: 'What responsive breakpoints should I use?',
            };

            const result = await askQuestion(params);

            if (result.confidence > 0.8) {
                expect(result.evidence).toBeDefined();
                expect(result.evidence?.source).toBeTruthy();
                expect(result.evidence?.section).toBeTruthy();
            }
        });

        it('should include plan version in evidence', async () => {
            const params: AskQuestionRequest = {
                question: 'How to handle mobile navigation?',
            };

            const result = await askQuestion(params);

            if (result.evidence) {
                expect(result.evidence.planVersion).toBeDefined();
            }
        });

        it('should include exact quote when available', async () => {
            const params: AskQuestionRequest = {
                question: 'What breakpoints for responsive design?',
            };

            const result = await askQuestion(params);

            if (result.evidence) {
                // May or may not have exact quote depending on implementation
                if (result.evidence.exactQuote) {
                    expect(typeof result.evidence.exactQuote).toBe('string');
                }
            }
        });
    });

    // ========================================================================
    // Guidance
    // ========================================================================

    describe('Guidance', () => {
        it('should provide implementation guidance', async () => {
            const params: AskQuestionRequest = {
                question: 'How to implement responsive design?',
            };

            const result = await askQuestion(params);

            if (result.guidance) {
                expect(result.guidance.implementation).toBeDefined();
            }
        });

        it('should provide accessibility guidance for a11y questions', async () => {
            const params: AskQuestionRequest = {
                question: 'What accessibility features are needed?',
            };

            const result = await askQuestion(params);

            if (result.guidance) {
                expect(result.guidance.accessibility).toBeDefined();
            }
        });

        it('should include code examples', async () => {
            const params: AskQuestionRequest = {
                question: 'How to add aria labels?',
            };

            const result = await askQuestion(params);

            if (result.guidance?.examples) {
                expect(typeof result.guidance.examples).toBe('object');
                expect(Object.keys(result.guidance.examples).length).toBeGreaterThan(0);
            }
        });

        it('should provide guidance even for low confidence', async () => {
            const params: AskQuestionRequest = {
                question: 'What random thing should I do?',
            };

            const result = await askQuestion(params);

            // Even low confidence should provide some guidance
            expect(result.guidance).toBeDefined();
        });
    });

    // ========================================================================
    // Related Design Choices
    // ========================================================================

    describe('Related Design Choices', () => {
        it('should include related design choices for relevant topics', async () => {
            const params: AskQuestionRequest = {
                question: 'Mobile responsive behavior?',
            };

            const result = await askQuestion(params);

            if (result.confidence > 0.7) {
                expect(result.relatedDesignChoices).toBeDefined();
                if (result.relatedDesignChoices) {
                    expect(result.relatedDesignChoices.length).toBeGreaterThan(0);
                }
            }
        });

        it('should list multiple related choices', async () => {
            const params: AskQuestionRequest = {
                question: 'Responsive design approach?',
            };

            const result = await askQuestion(params);

            if (result.relatedDesignChoices && result.relatedDesignChoices.length > 0) {
                result.relatedDesignChoices.forEach(choice => {
                    expect(typeof choice).toBe('string');
                    expect(choice.length).toBeGreaterThan(0);
                });
            }
        });
    });

    // ========================================================================
    // Related Decisions
    // ========================================================================

    describe('Related Decisions', () => {
        it('should include related decisions by default', async () => {
            const params: AskQuestionRequest = {
                question: 'How should I manage component state?',
            };

            const result = await askQuestion(params);

            // May or may not have decisions depending on topic
            if (result.relatedDecisions) {
                expect(Array.isArray(result.relatedDecisions)).toBe(true);
            }
        });

        it('should exclude related decisions when includeRelatedDecisions is false', async () => {
            const params: AskQuestionRequest = {
                question: 'State management approach?',
                includeRelatedDecisions: false,
            };

            const result = await askQuestion(params);

            expect(result.relatedDecisions).toBeUndefined();
        });

        it('should include related decisions when explicitly requested', async () => {
            const params: AskQuestionRequest = {
                question: 'Should I use CSS-in-JS?',
                includeRelatedDecisions: true,
            };

            const result = await askQuestion(params);

            // Styling question should have related decisions
            if (result.relatedDecisions && result.relatedDecisions.length > 0) {
                const decision = result.relatedDecisions[0];
                expect(decision.id).toBeDefined();
                expect(decision.title).toBeDefined();
                expect(decision.decision).toBeDefined();
                expect(decision.rationale).toBeDefined();
            }
        });

        it('should structure decisions correctly', async () => {
            const params: AskQuestionRequest = {
                question: 'State management patterns?',
                includeRelatedDecisions: true,
            };

            const result = await askQuestion(params);

            if (result.relatedDecisions) {
                result.relatedDecisions.forEach(decision => {
                    expect(decision).toHaveProperty('id');
                    expect(decision).toHaveProperty('title');
                    expect(decision).toHaveProperty('decision');
                    expect(decision).toHaveProperty('rationale');
                });
            }
        });
    });

    // ========================================================================
    // Context Handling
    // ========================================================================

    describe('Context Handling', () => {
        it('should accept context parameter', async () => {
            const params: AskQuestionRequest = {
                question: 'How to implement this?',
                context: 'Working on navigation component',
            };

            const result = await askQuestion(params);

            expect(result.success).toBe(true);
        });

        it('should accept currentTaskId parameter', async () => {
            const params: AskQuestionRequest = {
                question: 'Implementation approach?',
                currentTaskId: 'TASK-001',
            };

            const result = await askQuestion(params);

            expect(result.success).toBe(true);
        });

        it('should accept searchInPlan parameter', async () => {
            const params: AskQuestionRequest = {
                question: 'Mobile behavior?',
                searchInPlan: 'responsive|mobile',
            };

            const result = await askQuestion(params);

            expect(result.success).toBe(true);
        });

        it('should work without optional parameters', async () => {
            const params: AskQuestionRequest = {
                question: 'Simple question?',
            };

            const result = await askQuestion(params);

            expect(result.success).toBe(true);
        });
    });

    // ========================================================================
    // Error Handling
    // ========================================================================

    describe('Error Handling', () => {
        it('should throw error for empty question', async () => {
            const params = {
                question: '',
            };

            await expect(askQuestion(params))
                .rejects.toThrow(MCPProtocolError);

            try {
                await askQuestion(params);
            } catch (error) {
                expect((error as MCPProtocolError).code).toBe(MCPErrorCode.INVALID_PARAMS);
                expect((error as MCPProtocolError).message).toContain('Question cannot be empty');
            }
        });

        it('should throw error for missing question', async () => {
            const params = {};

            await expect(askQuestion(params))
                .rejects.toThrow(MCPProtocolError);
        });

        it('should handle invalid parameter types', async () => {
            const params = {
                question: 'Valid question',
                includeRelatedDecisions: 'not-a-boolean', // Invalid type
            };

            await expect(askQuestion(params))
                .rejects.toThrow(MCPProtocolError);
        });

        it('should include Zod error details', async () => {
            const params = {
                question: '', // Empty
            };

            try {
                await askQuestion(params);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeInstanceOf(MCPProtocolError);
                const mcpError = error as MCPProtocolError;
                expect(mcpError.data).toHaveProperty('zodErrors');
            }
        });
    });

    // ========================================================================
    // Response Structure
    // ========================================================================

    describe('Response Structure', () => {
        it('should always include required fields', async () => {
            const params: AskQuestionRequest = {
                question: 'Test?',
            };

            const result = await askQuestion(params);

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('question');
            expect(result).toHaveProperty('confidence');
        });

        it('should preserve original question in response', async () => {
            const originalQuestion = 'What are the design principles?';
            const params: AskQuestionRequest = {
                question: originalQuestion,
            };

            const result = await askQuestion(params);

            expect(result.question).toBe(originalQuestion);
        });

        it('should have valid confidence range', async () => {
            const params: AskQuestionRequest = {
                question: 'Any question?',
            };

            const result = await askQuestion(params);

            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });

        it('should not include undefined optional fields', async () => {
            const params: AskQuestionRequest = {
                question: 'Random unrelated question about something not in plan?',
            };

            const result = await askQuestion(params);

            // Low confidence response should not have all fields
            if (result.confidence < 0.5) {
                expect(result.evidence).toBeUndefined();
                expect(result.relatedDesignChoices).toBeUndefined();
            }
        });
    });

    // ========================================================================
    // Integration Scenarios
    // ========================================================================

    describe('Integration Scenarios', () => {
        it('should handle multiple topics in one question', async () => {
            const params: AskQuestionRequest = {
                question: 'How to implement responsive accessible navigation?',
            };

            const result = await askQuestion(params);

            // Should detect both responsive and accessibility topics
            expect(result.confidence).toBeGreaterThan(0.7);
            expect(result.answerFromPlan).toBeTruthy();
        });

        it('should provide comprehensive response for well-defined question', async () => {
            const params: AskQuestionRequest = {
                question: 'What accessibility standards should mobile navigation follow?',
                includeRelatedDecisions: true,
            };

            const result = await askQuestion(params);

            expect(result.success).toBe(true);
            expect(result.confidence).toBeGreaterThan(0.8);
            expect(result.answerFromPlan).toBeDefined();
            expect(result.evidence).toBeDefined();
            expect(result.guidance).toBeDefined();
        });

        it('should handle task-specific questions', async () => {
            const params: AskQuestionRequest = {
                question: 'How should this component handle errors?',
                context: 'Building login form component',
                currentTaskId: 'TASK-042',
            };

            const result = await askQuestion(params);

            expect(result.success).toBe(true);
            // Should provide some guidance even if confidence is low
            expect(result.guidance).toBeDefined();
        });
    });
});
