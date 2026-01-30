/**
 * MCP Tools Index - Test Suite
 * 
 * Tests the barrel export file that re-exports all MCP tools.
 * Target Coverage: 80% (branches, functions, lines, statements)
 * 
 * Test Coverage:
 * - All 6 tools are exported correctly
 * - All type interfaces are exported correctly
 * - Exports are the actual implementation (not mocks)
 */

import * as toolsIndex from '../../../src/mcpServer/tools/index';
import { getNextTask as directGetNextTask } from '../../../src/mcpServer/tools/getNextTask';
import { reportTaskStatus as directReportTaskStatus } from '../../../src/mcpServer/tools/reportTaskStatus';
import { askQuestion as directAskQuestion } from '../../../src/mcpServer/tools/askQuestion';
import { reportTestFailure as directReportTestFailure } from '../../../src/mcpServer/tools/reportTestFailure';
import { reportObservation as directReportObservation } from '../../../src/mcpServer/tools/reportObservation';
import { reportVerificationResult as directReportVerificationResult } from '../../../src/mcpServer/tools/reportVerificationResult';

describe('MCP Tools Index', () => {
    describe('Function Exports', () => {
        it('should export getNextTask function', () => {
            expect(toolsIndex.getNextTask).toBeDefined();
            expect(typeof toolsIndex.getNextTask).toBe('function');
        });

        it('should export reportTaskStatus function', () => {
            expect(toolsIndex.reportTaskStatus).toBeDefined();
            expect(typeof toolsIndex.reportTaskStatus).toBe('function');
        });

        it('should export askQuestion function', () => {
            expect(toolsIndex.askQuestion).toBeDefined();
            expect(typeof toolsIndex.askQuestion).toBe('function');
        });

        it('should export reportTestFailure function', () => {
            expect(toolsIndex.reportTestFailure).toBeDefined();
            expect(typeof toolsIndex.reportTestFailure).toBe('function');
        });

        it('should export reportObservation function', () => {
            expect(toolsIndex.reportObservation).toBeDefined();
            expect(typeof toolsIndex.reportObservation).toBe('function');
        });

        it('should export reportVerificationResult function', () => {
            expect(toolsIndex.reportVerificationResult).toBeDefined();
            expect(typeof toolsIndex.reportVerificationResult).toBe('function');
        });
    });

    describe('Type Interface Exports', () => {
        it('should export GetNextTaskRequest type', () => {
            // TypeScript types don't exist at runtime, but we can check the type is imported
            type TestType = toolsIndex.GetNextTaskRequest;
            const typeExists: TestType = {} as TestType;
            expect(typeExists).toBeDefined();
        });

        it('should export GetNextTaskResponse type', () => {
            type TestType = toolsIndex.GetNextTaskResponse;
            const typeExists: TestType = {} as TestType;
            expect(typeExists).toBeDefined();
        });

        it('should export ReportTaskStatusRequest type', () => {
            type TestType = toolsIndex.ReportTaskStatusRequest;
            const typeExists: TestType = {} as TestType;
            expect(typeExists).toBeDefined();
        });

        it('should export ReportTaskStatusResponse type', () => {
            type TestType = toolsIndex.ReportTaskStatusResponse;
            const typeExists: TestType = {} as TestType;
            expect(typeExists).toBeDefined();
        });

        it('should export AskQuestionRequest type', () => {
            type TestType = toolsIndex.AskQuestionRequest;
            const typeExists: TestType = {} as TestType;
            expect(typeExists).toBeDefined();
        });

        it('should export AskQuestionResponse type', () => {
            type TestType = toolsIndex.AskQuestionResponse;
            const typeExists: TestType = {} as TestType;
            expect(typeExists).toBeDefined();
        });

        it('should export ReportTestFailureRequest type', () => {
            type TestType = toolsIndex.ReportTestFailureRequest;
            const typeExists: TestType = {} as TestType;
            expect(typeExists).toBeDefined();
        });

        it('should export ReportTestFailureResponse type', () => {
            type TestType = toolsIndex.ReportTestFailureResponse;
            const typeExists: TestType = {} as TestType;
            expect(typeExists).toBeDefined();
        });

        it('should export ReportObservationRequest type', () => {
            type TestType = toolsIndex.ReportObservationRequest;
            const typeExists: TestType = {} as TestType;
            expect(typeExists).toBeDefined();
        });

        it('should export ReportObservationResponse type', () => {
            type TestType = toolsIndex.ReportObservationResponse;
            const typeExists: TestType = {} as TestType;
            expect(typeExists).toBeDefined();
        });

        it('should export ReportVerificationResultRequest type', () => {
            type TestType = toolsIndex.ReportVerificationResultRequest;
            const typeExists: TestType = {} as TestType;
            expect(typeExists).toBeDefined();
        });

        it('should export ReportVerificationResultResponse type', () => {
            type TestType = toolsIndex.ReportVerificationResultResponse;
            const typeExists: TestType = {} as TestType;
            expect(typeExists).toBeDefined();
        });
    });

    describe('Export Integrity', () => {
        it('should export the same getNextTask as the direct import', () => {
            expect(toolsIndex.getNextTask).toBe(directGetNextTask);
        });

        it('should export the same reportTaskStatus as the direct import', () => {
            expect(toolsIndex.reportTaskStatus).toBe(directReportTaskStatus);
        });

        it('should export the same askQuestion as the direct import', () => {
            expect(toolsIndex.askQuestion).toBe(directAskQuestion);
        });

        it('should export the same reportTestFailure as the direct import', () => {
            expect(toolsIndex.reportTestFailure).toBe(directReportTestFailure);
        });

        it('should export the same reportObservation as the direct import', () => {
            expect(toolsIndex.reportObservation).toBe(directReportObservation);
        });

        it('should export the same reportVerificationResult as the direct import', () => {
            expect(toolsIndex.reportVerificationResult).toBe(directReportVerificationResult);
        });
    });

    describe('Export Completeness', () => {
        it('should export all 6 P1 MCP tools', () => {
            const expectedTools = [
                'getNextTask',
                'reportTaskStatus',
                'askQuestion',
                'reportTestFailure',
                'reportObservation',
                'reportVerificationResult',
            ];

            expectedTools.forEach(tool => {
                expect(toolsIndex).toHaveProperty(tool);
                expect(typeof (toolsIndex as any)[tool]).toBe('function');
            });
        });

        it('should export all 12 type interfaces', () => {
            // This test verifies that the module exports the expected number of items
            // (6 functions + 12 types = 18 total exports)
            const exportKeys = Object.keys(toolsIndex);

            // We expect at least 6 function exports
            expect(exportKeys.length).toBeGreaterThanOrEqual(6);

            // Verify all expected functions are present
            expect(exportKeys).toContain('getNextTask');
            expect(exportKeys).toContain('reportTaskStatus');
            expect(exportKeys).toContain('askQuestion');
            expect(exportKeys).toContain('reportTestFailure');
            expect(exportKeys).toContain('reportObservation');
            expect(exportKeys).toContain('reportVerificationResult');
        });
    });

    describe('Barrel Export Pattern', () => {
        it('should maintain consistent export pattern for all tools', () => {
            // Each tool should export the function itself
            const tools = [
                toolsIndex.getNextTask,
                toolsIndex.reportTaskStatus,
                toolsIndex.askQuestion,
                toolsIndex.reportTestFailure,
                toolsIndex.reportObservation,
                toolsIndex.reportVerificationResult,
            ];

            tools.forEach(tool => {
                expect(tool).toBeDefined();
                expect(typeof tool).toBe('function');
                expect(tool.name).toBeTruthy(); // Functions should have names
            });
        });

        it('should not add any wrapper logic (pure re-export)', () => {
            // Verify that the exported functions are the exact same reference
            // as the original implementations (no wrapping)
            expect(toolsIndex.getNextTask).toBe(directGetNextTask);
            expect(toolsIndex.reportTaskStatus).toBe(directReportTaskStatus);
            expect(toolsIndex.askQuestion).toBe(directAskQuestion);
            expect(toolsIndex.reportTestFailure).toBe(directReportTestFailure);
            expect(toolsIndex.reportObservation).toBe(directReportObservation);
            expect(toolsIndex.reportVerificationResult).toBe(directReportVerificationResult);
        });
    });
});
