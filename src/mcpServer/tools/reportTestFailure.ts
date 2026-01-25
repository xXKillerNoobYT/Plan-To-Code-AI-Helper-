/**
 * MCP Tool: reportTestFailure
 * Reports test failures and automatically creates investigation tasks
 * 
 * Purpose:
 * - Logs test failure information
 * - Analyzes root cause possibilities
 * - Creates investigation tasks when needed
 * - Routes critical failures for immediate attention
 * 
 * References:
 * - Plans/COE-Master-Plan/05-MCP-API-Reference.md (Tool 5: reportTestFailure)
 */

import { z } from 'zod';
import { Task, TaskQueue } from '../../tasks/queue';
import { MCPErrorCode, MCPProtocolError } from '../protocol';

// ============================================================================
// Request/Response Schemas (Zod Validation)
// ============================================================================

/**
 * Failure details schema
 */
export const FailureDetailsSchema = z.object({
    error: z.string().min(1),
    failingColor: z.unknown().optional(),
    expectedValue: z.unknown().optional(),
    actualValue: z.unknown().optional(),
    failedAssertion: z.string().optional(),
});

export type FailureDetails = z.infer<typeof FailureDetailsSchema>;

/**
 * Request schema for reportTestFailure
 */
export const ReportTestFailureRequestSchema = z.object({
    taskId: z.string().min(1),
    testName: z.string().min(1),
    testFile: z.string().min(1),
    failureDetails: FailureDetailsSchema,
    previousStatus: z.enum(['passing_before', 'never_passed', 'flaky']),
    context: z.string().optional(),
    causePossibility: z.array(z.string()).optional(),
    needsInvestigation: z.boolean(),
    actionNeeded: z.string().min(1),
});

export type ReportTestFailureRequest = z.infer<typeof ReportTestFailureRequestSchema>;

/**
 * Investigation task details
 */
export interface InvestigationTask {
    taskId: string;
    title: string;
    priority: 'critical';
    blocker: boolean;
    details: string;
    addedToQueue: boolean;
    position: string;
}

/**
 * Suspected root cause analysis
 */
export interface RootCauseAnalysis {
    likeliestCause: string;
    suggestedInvestigation: string[];
}

/**
 * Dashboard alert
 */
export interface DashboardAlert {
    type: 'critical';
    message: string;
    timestamp: string;
    requiresHumanAttention: boolean;
}

/**
 * Blocking task
 */
export interface BlockingTask {
    blockingTaskId: string;
    message: string;
}

/**
 * Response schema for reportTestFailure
 */
export interface ReportTestFailureResponse {
    success: boolean;
    testFailureId: string;
    testName: string;
    status: 'failure_logged';

    blockingTask?: BlockingTask;
    investigationTaskCreated?: InvestigationTask;
    suspectedRootCauseAnalysis?: RootCauseAnalysis;
    dashboardAlert?: DashboardAlert;
}

// ============================================================================
// Root Cause Analysis
// ============================================================================

/**
 * Analyze failure and suggest root causes
 */
function analyzeFailure(
    failureDetails: FailureDetails,
    context?: string,
    causePossibilities?: string[]
): RootCauseAnalysis {
    // Heuristics for root cause detection
    const errorText = failureDetails.error.toLowerCase();

    let likeliestCause = 'Unknown cause';
    let suggestedInvestigation: string[] = [];

    if (errorText.includes('undefined') || errorText.includes('null')) {
        likeliestCause = 'Null/undefined reference in component or test setup';
        suggestedInvestigation = [
            'Check test setup and fixture initialization',
            'Verify mock data is properly configured',
            'Check component props default values',
        ];
    } else if (errorText.includes('assertion') || errorText.includes('expected')) {
        likeliestCause = 'Logic error or incomplete implementation';
        suggestedInvestigation = [
            'Review expected vs actual values carefully',
            'Check recent code changes related to this test',
            'Run test in isolation to check for test dependencies',
        ];
    } else if (errorText.includes('timeout')) {
        likeliestCause = 'Async operation or timing issue';
        suggestedInvestigation = [
            'Check async/await implementation',
            'Look for race conditions or missing awaits',
            'Verify timeouts are appropriate for environment',
        ];
    } else if (errorText.includes('mock') || errorText.includes('spy')) {
        likeliestCause = 'Mock/stub configuration issue';
        suggestedInvestigation = [
            'Verify mocks are set up correctly',
            'Check mock return values',
            'Ensure mocks are reset between tests',
        ];
    } else if (errorText.includes('import') || errorText.includes('module')) {
        likeliestCause = 'Module import or dependency issue';
        suggestedInvestigation = [
            'Check import paths and module resolution',
            'Verify all dependencies are installed',
            'Look for circular dependencies',
        ];
    } else {
        likeliestCause = 'Test environment or configuration issue';
        suggestedInvestigation = [
            'Check test environment configuration',
            'Verify test isolation between test cases',
            'Check for global state mutations',
        ];
    }

    // Add user-provided possibilities
    if (causePossibilities && causePossibilities.length > 0) {
        suggestedInvestigation = [...causePossibilities, ...suggestedInvestigation];
    }

    return {
        likeliestCause,
        suggestedInvestigation: suggestedInvestigation.slice(0, 5), // Top 5 suggestions
    };
}

// ============================================================================
// Investigation Task Creation
// ============================================================================

/**
 * Create investigation task for test failure
 */
function createInvestigationTask(
    testName: string,
    failureDetails: FailureDetails,
    originalTaskId: string,
    taskQueue: TaskQueue
): InvestigationTask {
    const investigationTaskId = `INVESTIGATE-${originalTaskId}-${Date.now()}`;

    const title = `Investigate: Test failure in ${testName}`;
    const details = `Failed test: ${testName}\nError: ${failureDetails.error}\nAction needed: Investigate and fix test failure`;

    // Create new task in queue
    const investigationTask: Task = {
        taskId: investigationTaskId,
        title,
        description: details,
        priority: 'critical',
        status: 'pending',
        dependencies: [originalTaskId],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    taskQueue.addTask(investigationTask);

    return {
        taskId: investigationTaskId,
        title,
        priority: 'critical',
        blocker: true,
        details,
        addedToQueue: true,
        position: 'immediate (highest priority)',
    };
}

// ============================================================================
// Blocking Task Detection
// ============================================================================

/**
 * Check if current task blocks other tasks
 */
function detectBlockingTask(taskId: string, taskQueue: TaskQueue): BlockingTask | undefined {
    const allTasks = taskQueue.getAllTasks();

    // Find tasks that depend on this task
    const blockedTasks = allTasks.filter(task =>
        task.dependencies.includes(taskId) &&
        task.status !== 'done'
    );

    if (blockedTasks.length > 0) {
        return {
            blockingTaskId: blockedTasks[0].taskId,
            message: `Test failure is blocking ${blockedTasks.length} task(s): ${blockedTasks.map(t => t.title).join(', ')}`,
        };
    }

    return undefined;
}

// ============================================================================
// Main Tool Implementation
// ============================================================================

/**
 * reportTestFailure MCP Tool
 * 
 * Logs test failures and creates investigation tasks.
 * 
 * @param params - Request parameters (testName, failure details, etc.)
 * @param taskQueue - Task queue instance
 * @returns ReportTestFailureResponse with investigation task details
 */
export async function reportTestFailure(
    params: Record<string, unknown>,
    taskQueue: TaskQueue
): Promise<ReportTestFailureResponse> {
    // Validate request parameters
    let validatedParams: ReportTestFailureRequest;
    try {
        validatedParams = ReportTestFailureRequestSchema.parse(params);
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

    // Find the task
    const task = taskQueue.getAllTasks().find(t => t.taskId === validatedParams.taskId);
    if (!task) {
        throw new MCPProtocolError(
            MCPErrorCode.TASK_NOT_FOUND,
            `Task ${validatedParams.taskId} not found`,
            { taskId: validatedParams.taskId }
        );
    }

    // Generate test failure ID
    const testFailureId = `FAIL-${validatedParams.taskId}-${Date.now()}`;

    // Analyze failure and root causes
    const rootCauseAnalysis = analyzeFailure(
        validatedParams.failureDetails,
        validatedParams.context,
        validatedParams.causePossibility
    );

    // Detect if this failure blocks other tasks
    const blockingTask = detectBlockingTask(validatedParams.taskId, taskQueue);

    // Create investigation task if needed
    let investigationTask: InvestigationTask | undefined;
    if (validatedParams.needsInvestigation) {
        investigationTask = createInvestigationTask(
            validatedParams.testName,
            validatedParams.failureDetails,
            validatedParams.taskId,
            taskQueue
        );
    }

    // Create dashboard alert for critical failures
    const dashboardAlert: DashboardAlert = {
        type: 'critical',
        message: `Test failure in ${validatedParams.testName}: ${validatedParams.failureDetails.error}`,
        timestamp: new Date().toISOString(),
        requiresHumanAttention: validatedParams.previousStatus === 'passing_before' || blockingTask !== undefined,
    };

    // Build response
    const response: ReportTestFailureResponse = {
        success: true,
        testFailureId,
        testName: validatedParams.testName,
        status: 'failure_logged',
        suspectedRootCauseAnalysis: rootCauseAnalysis,
        dashboardAlert,
    };

    if (blockingTask) {
        response.blockingTask = blockingTask;
    }

    if (investigationTask) {
        response.investigationTaskCreated = investigationTask;
    }

    return response;
}
