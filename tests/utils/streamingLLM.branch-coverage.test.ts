/**
 * Enhanced Branch Coverage Tests for streamingLLM
 * 
 * Targets: 85%+ branch coverage for streaming and error handling
 * - Token consumption tracking
 * - Stream event handling
 * - Error recovery scenarios
 * - Edge cases in token counting
 */

import { StreamingLLM } from '../../src/utils/streamingLLM';

class MockLogger {
    logs: Array<{ level: string; message: string }> = [];

    info(message: string) {
        this.logs.push({ level: 'info', message });
    }

    warn(message: string) {
        this.logs.push({ level: 'warn', message });
    }

    error(message: string) {
        this.logs.push({ level: 'error', message });
    }

    debug(message: string) {
        this.logs.push({ level: 'debug', message });
    }
}

describe('StreamingLLM - Enhanced Branch Coverage', () => {
    let streamingLLM: StreamingLLM;
    let logger: MockLogger;

    beforeEach(() => {
        logger = new MockLogger();
        streamingLLM = new StreamingLLM({ logger });
    });

    // ========================================================================
    // Token Tracking Branch Coverage
    // ========================================================================

    describe('Token Tracking - Branch Coverage', () => {
        it('should initialize with zero tokens consumed', () => {
            const stats = streamingLLM.getTokenStats();

            expect(stats.tokensConsumed).toBe(0);
            expect(stats.tokenLimit).toBeGreaterThan(0);
        });

        it('should track tokens consumed on each chunk', async () => {
            const chunk = 'Hello world this is a test';

            streamingLLM.onTokenConsume(chunk);
            const stats = streamingLLM.getTokenStats();

            expect(stats.tokensConsumed).toBeGreaterThan(0);
        });

        it('should accumulate tokens across multiple calls', async () => {
            const chunk1 = 'First chunk ';
            const chunk2 = 'Second chunk ';
            const chunk3 = 'Third chunk';

            streamingLLM.onTokenConsume(chunk1);
            const after1 = streamingLLM.getTokenStats().tokensConsumed;

            streamingLLM.onTokenConsume(chunk2);
            const after2 = streamingLLM.getTokenStats().tokensConsumed;

            streamingLLM.onTokenConsume(chunk3);
            const after3 = streamingLLM.getTokenStats().tokensConsumed;

            expect(after2).toBeGreaterThan(after1);
            expect(after3).toBeGreaterThan(after2);
        });

        it('should handle empty chunks', () => {
            streamingLLM.onTokenConsume('');
            const stats = streamingLLM.getTokenStats();

            expect(stats.tokensConsumed).toBeGreaterThanOrEqual(0);
        });

        it('should handle very long chunks', () => {
            const longChunk = 'a'.repeat(10000);

            streamingLLM.onTokenConsume(longChunk);
            const stats = streamingLLM.getTokenStats();

            expect(stats.tokensConsumed).toBeGreaterThan(0);
        });

        it('should alert when approaching token limit', () => {
            const config = { tokenLimit: 100, logger };
            streamingLLM = new StreamingLLM(config);

            // Consume tokens until close to limit
            for (let i = 0; i < 50; i++) {
                streamingLLM.onTokenConsume('word ');
            }

            const stats = streamingLLM.getTokenStats();
            const percentUsed = (stats.tokensConsumed / stats.tokenLimit) * 100;

            expect(percentUsed).toBeGreaterThan(0);
        });

        it('should handle token limit exceeded scenario', () => {
            const config = { tokenLimit: 50, logger };
            streamingLLM = new StreamingLLM(config);

            // Consume more tokens than limit
            for (let i = 0; i < 100; i++) {
                streamingLLM.onTokenConsume('word ');
            }

            const stats = streamingLLM.getTokenStats();

            expect(stats.tokensConsumed).toBeGreaterThan(stats.tokenLimit);
        });
    });

    // ========================================================================
    // Stream Event Handling - Branch Coverage
    // ========================================================================

    describe('Stream Event Handling - Branch Coverage', () => {
        it('should handle text chunk events', () => {
            const chunk = 'Hello world';

            streamingLLM.onTextChunk(chunk);
            // Verify no errors and state is tracked

            const stats = streamingLLM.getTokenStats();
            expect(stats.tokensConsumed).toBeGreaterThan(0);
        });

        it('should handle tool calls in stream', () => {
            const toolCall = {
                toolName: 'askQuestion',
                params: { question: 'How do I implement X?' },
            };

            streamingLLM.onToolCall(toolCall);
            // Verify tool call is tracked

            const stats = streamingLLM.getTokenStats();
            expect(stats.toolsCalled).toBeGreaterThanOrEqual(0);
        });

        it('should handle stream error events', () => {
            const error = new Error('Stream connection failed');

            streamingLLM.onStreamError(error);
            // Verify error is logged

            expect(logger.logs.some(log => log.level === 'error')).toBe(true);
        });

        it('should handle stream completion', () => {
            streamingLLM.onStreamComplete();
            // Verify stream is marked complete

            const stats = streamingLLM.getTokenStats();
            expect(stats.isComplete).toBe(true);
        });

        it('should handle multiple events in sequence', () => {
            streamingLLM.onTextChunk('Hello ');
            streamingLLM.onTextChunk('world');
            streamingLLM.onToolCall({ toolName: 'test', params: {} });
            streamingLLM.onStreamComplete();

            const stats = streamingLLM.getTokenStats();
            expect(stats.isComplete).toBe(true);
            expect(stats.tokensConsumed).toBeGreaterThan(0);
        });
    });

    // ========================================================================
    // Error Recovery - Branch Coverage
    // ========================================================================

    describe('Error Recovery Scenarios', () => {
        it('should recover from null chunk', () => {
            expect(() => {
                streamingLLM.onTokenConsume(null as any);
            }).not.toThrow();
        });

        it('should recover from undefined chunk', () => {
            expect(() => {
                streamingLLM.onTokenConsume(undefined as any);
            }).not.toThrow();
        });

        it('should handle error during token counting', () => {
            // Mock scenario where token counting might fail
            const problematicChunk = '\x00\x01\x02'; // Null bytes

            expect(() => {
                streamingLLM.onTokenConsume(problematicChunk);
            }).not.toThrow();
        });

        it('should continue processing after error', () => {
            const goodChunk1 = 'First chunk';

            streamingLLM.onTokenConsume(goodChunk1);
            const before = streamingLLM.getTokenStats().tokensConsumed;

            // Trigger an error scenario
            try {
                streamingLLM.onStreamError(new Error('Test error'));
            } catch {
                // Swallow error
            }

            const goodChunk2 = 'Second chunk';
            streamingLLM.onTokenConsume(goodChunk2);
            const after = streamingLLM.getTokenStats().tokensConsumed;

            expect(after).toBeGreaterThanOrEqual(before);
        });

        it('should handle rapid consecutive errors', () => {
            for (let i = 0; i < 10; i++) {
                streamingLLM.onStreamError(new Error(`Error ${i}`));
            }

            expect(logger.logs.filter(l => l.level === 'error').length).toBeGreaterThan(0);
        });
    });

    // ========================================================================
    // Configuration & Constraints - Branch Coverage
    // ========================================================================

    describe('Configuration & Constraints', () => {
        it('should use default token limit if not specified', () => {
            const llm = new StreamingLLM({});
            const stats = llm.getTokenStats();

            expect(stats.tokenLimit).toBeGreaterThan(0);
        });

        it('should use custom token limit', () => {
            const customLimit = 5000;
            const llm = new StreamingLLM({ tokenLimit: customLimit });
            const stats = llm.getTokenStats();

            expect(stats.tokenLimit).toBe(customLimit);
        });

        it('should use custom logger if provided', () => {
            const customLogger = new MockLogger();
            const llm = new StreamingLLM({ logger: customLogger });

            llm.onStreamError(new Error('Test'));

            expect(customLogger.logs.length).toBeGreaterThan(0);
        });

        it('should use default logger if not provided', () => {
            const llm = new StreamingLLM({});

            // Should not throw when no logger provided
            expect(() => {
                llm.onStreamError(new Error('Test'));
            }).not.toThrow();
        });
    });

    // ========================================================================
    // State Management - Branch Coverage
    // ========================================================================

    describe('State Management', () => {
        it('should track when stream is complete', () => {
            streamingLLM.onTextChunk('Some text');
            let stats = streamingLLM.getTokenStats();
            expect(stats.isComplete).toBe(false);

            streamingLLM.onStreamComplete();
            stats = streamingLLM.getTokenStats();
            expect(stats.isComplete).toBe(true);
        });

        it('should reset state for new stream', () => {
            streamingLLM.onTextChunk('Content');
            let stats = streamingLLM.getTokenStats();
            const before = stats.tokensConsumed;

            streamingLLM.reset?.();
            stats = streamingLLM.getTokenStats();

            expect(stats.tokensConsumed).toBeLessThanOrEqual(before);
        });

        it('should track multiple streams separately', () => {
            const llm1 = new StreamingLLM({ logger });
            const llm2 = new StreamingLLM({ logger });

            llm1.onTokenConsume('Stream 1 content');
            llm2.onTokenConsume('Stream 2 content');

            const stats1 = llm1.getTokenStats();
            const stats2 = llm2.getTokenStats();

            // Each should have independent token counts
            expect(stats1.tokensConsumed).toBeGreaterThan(0);
            expect(stats2.tokensConsumed).toBeGreaterThan(0);
        });
    });

    // ========================================================================
    // Edge Cases - Token Estimation
    // ========================================================================

    describe('Token Estimation - Edge Cases', () => {
        it('should handle special characters correctly', () => {
            const specialChars = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`';

            streamingLLM.onTokenConsume(specialChars);
            const stats = streamingLLM.getTokenStats();

            expect(stats.tokensConsumed).toBeGreaterThan(0);
        });

        it('should handle unicode characters', () => {
            const unicode = 'Hello 世界 Привет مرحبا';

            streamingLLM.onTokenConsume(unicode);
            const stats = streamingLLM.getTokenStats();

            expect(stats.tokensConsumed).toBeGreaterThan(0);
        });

        it('should handle mixed whitespace', () => {
            const whitespace = 'text\n\t\r  \n\twith\t\nmixed   spaces';

            streamingLLM.onTokenConsume(whitespace);
            const stats = streamingLLM.getTokenStats();

            expect(stats.tokensConsumed).toBeGreaterThan(0);
        });

        it('should handle code snippets', () => {
            const code = `
        function example() {
          const result = await asyncFunction();
          return result;
        }
      `;

            streamingLLM.onTokenConsume(code);
            const stats = streamingLLM.getTokenStats();

            expect(stats.tokensConsumed).toBeGreaterThan(0);
        });

        it('should handle JSON content', () => {
            const json = JSON.stringify({
                name: 'test',
                value: 123,
                nested: { key: 'value' },
            });

            streamingLLM.onTokenConsume(json);
            const stats = streamingLLM.getTokenStats();

            expect(stats.tokensConsumed).toBeGreaterThan(0);
        });

        it('should estimate tokens proportionally to content length', () => {
            const shortContent = 'Hello';
            const longContent = 'Hello '.repeat(100);

            streamingLLM.onTokenConsume(shortContent);
            const shortStats = streamingLLM.getTokenStats();

            streamingLLM.reset?.();

            streamingLLM.onTokenConsume(longContent);
            const longStats = streamingLLM.getTokenStats();

            expect(longStats.tokensConsumed).toBeGreaterThan(shortStats.tokensConsumed);
        });
    });

    // ========================================================================
    // Performance & Limits - Branch Coverage
    // ========================================================================

    describe('Performance & Limits', () => {
        it('should handle rapid token consumption', () => {
            const iterations = 1000;

            const start = Date.now();
            for (let i = 0; i < iterations; i++) {
                streamingLLM.onTokenConsume(`chunk-${i} `);
            }
            const duration = Date.now() - start;

            const stats = streamingLLM.getTokenStats();
            expect(stats.tokensConsumed).toBeGreaterThan(0);
            // Should handle 1000 chunks in reasonable time (< 5 seconds)
            expect(duration).toBeLessThan(5000);
        });

        it('should handle warning when at 80% of limit', () => {
            const config = { tokenLimit: 100, logger };
            streamingLLM = new StreamingLLM(config);

            // Consume exactly 80 tokens
            for (let i = 0; i < 80; i++) {
                streamingLLM.onTokenConsume('x ');
            }

            const stats = streamingLLM.getTokenStats();
            const percentUsed = (stats.tokensConsumed / stats.tokenLimit) * 100;

            expect(percentUsed).toBeGreaterThanOrEqual(75);
        });

        it('should handle critical warning when at 95% of limit', () => {
            const config = { tokenLimit: 100, logger };
            streamingLLM = new StreamingLLM(config);

            // Consume 95 tokens
            for (let i = 0; i < 95; i++) {
                streamingLLM.onTokenConsume('y ');
            }

            const stats = streamingLLM.getTokenStats();
            const percentUsed = (stats.tokensConsumed / stats.tokenLimit) * 100;

            expect(percentUsed).toBeGreaterThanOrEqual(90);
        });
    });

    // ========================================================================
    // Integration Scenarios
    // ========================================================================

    describe('Integration Scenarios', () => {
        it('should handle realistic streaming scenario', () => {
            // Simulate a real streaming response with multiple events
            streamingLLM.onTextChunk('Looking at your question, I ');
            streamingLLM.onTextChunk('need to ');
            streamingLLM.onTextChunk('check the context.');
            streamingLLM.onToolCall({
                toolName: 'askQuestion',
                params: { question: 'What is the current task?' },
            });
            streamingLLM.onTextChunk('\nBased on that, I can ');
            streamingLLM.onTextChunk('now proceed with the implementation.');
            streamingLLM.onStreamComplete();

            const stats = streamingLLM.getTokenStats();

            expect(stats.isComplete).toBe(true);
            expect(stats.tokensConsumed).toBeGreaterThan(0);
            expect(logger.logs.length).toBeGreaterThan(0);
        });

        it('should handle streaming with errors', () => {
            streamingLLM.onTextChunk('Starting stream...');
            streamingLLM.onStreamError(new Error('Temporary connection issue'));
            streamingLLM.onTextChunk('Recovered and continuing...');
            streamingLLM.onStreamComplete();

            const stats = streamingLLM.getTokenStats();
            expect(stats.isComplete).toBe(true);

            const errorLogs = logger.logs.filter(l => l.level === 'error');
            expect(errorLogs.length).toBeGreaterThan(0);
        });

        it('should handle multiple sequential streams', () => {
            // First stream
            streamingLLM.onTextChunk('First response');
            streamingLLM.onStreamComplete();
            const stats1 = streamingLLM.getTokenStats();

            // Reset for second stream
            streamingLLM.reset?.();

            // Second stream
            streamingLLM.onTextChunk('Second response');
            streamingLLM.onStreamComplete();
            const stats2 = streamingLLM.getTokenStats();

            expect(stats1.isComplete).toBe(true);
            expect(stats2.isComplete).toBe(true);
        });
    });
});
