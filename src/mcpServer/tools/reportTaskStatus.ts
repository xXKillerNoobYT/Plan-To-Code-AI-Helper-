/**
 * MCP Tool: reportTaskStatus (reportTaskDone)
 * Reports task completion with rich status details, testing results, and observations
 * 
 * Purpose:
 * - Updates task status (done/failed/blocked/partial)
 * - Triggers verification workflows
 * - Creates follow-up tasks
 * - Updates GitHub Issues if synced
 * - Returns dashboard statistics
 * 
 * References:
 * - Plans/COE-Master-Plan/05-MCP-API-Reference.md (Tool 2: reportTaskDone)
 */

import { z } from 'zod';
import { Task, TaskQueue } from '../../tasks/queue';
import { MCPErrorCode, MCPProtocolError } from '../protocol';

// ============================================================================
// Request/Response Schemas (Zod Validation)
// ============================================================================

/**
 * Status details for partial/blocked/failed tasks
 */
export const StatusDetailsSchema = z.object({
    progressPercent: z.number().min(0).max(100).optional(),
    blockedReason: z.string().optional(),
    failureReason: z.string().optional(),
    partiallyDone: z.string().optional(),
});

export type StatusDetails = z.infer<typeof StatusDetailsSchema>;

/**
 * Testing results schema
 */
export const TestingSchema = z.object({
    testsAdded: z.boolean(),
    testFileCreated: z.string().optional(),
    testsPassed: z.boolean(),
    testsFailed: z.number().min(0),
    testCoveragePercent: z.number().min(0).max(100).optional(),
    failedTestNames: z.array(z.string()).optional(),
    accessibilityTestsPassed: z.boolean().optional(),
});

export type Testing = z.infer<typeof TestingSchema>;

/**
 * Acceptance criteria verification status
 */
export const AcceptanceCriteriaItemSchema = z.object({
    text: z.string(),
    status: z.enum(['passed', 'failed', 'not-applicable']),
});

export type AcceptanceCriteriaItem = z.infer<typeof AcceptanceCriteriaItemSchema>;

/**
 * Follow-up task schema
 */
export const FollowUpTaskSchema = z.object({
    title: z.string().min(1).max(200),
    why: z.string().min(1),
    estimatedHours: z.number().min(0).optional(),
});

export type FollowUpTask = z.infer<typeof FollowUpTaskSchema>;

/**
 * Request schema for reportTaskStatus
 */
export const ReportTaskStatusRequestSchema = z.object({
    taskId: z.string().min(1),
    status: z.enum(['done', 'failed', 'blocked', 'partial']),

    statusDetails: StatusDetailsSchema.optional(),
    implementationNotes: z.string().optional(),
    filesModified: z.array(z.string()).optional(),
    testing: TestingSchema.optional(),
    acceptanceCriteriaVerification: z.record(z.string(), AcceptanceCriteriaItemSchema).optional(),
    followUpTasks: z.array(FollowUpTaskSchema).optional(),
    observations: z.array(z.string()).optional(),
});

export type ReportTaskStatusRequest = z.infer<typeof ReportTaskStatusRequestSchema>;

/**
 * Verification task created by system
 */
export interface VerificationTask {
    taskId: string;
    title: string;
    why: string;
    automationLevel: 'automated' | 'semi-automated' | 'manual';
}

/**
 * Processed observation
 */
export interface ProcessedObservation {
    observationId: string;
    observation: string;
    status: 'noted' | 'action-required' | 'follow-up-created';
    suggestedFollowUp?: string;
}

/**
 * Next task preview
 */
export interface NextTaskPreview {
    title: string;
    priority: string;
}

/**
 * Dashboard statistics
 */
export interface DashboardUpdate {
    completedCount: number;
    totalCount: number;
    percentComplete: number;
    blockedCount: number;
    verificationPendingCount: number;
}

/**
 * Response schema for reportTaskStatus
 */
export interface ReportTaskStatusResponse {
    success: boolean;
    taskId: string;
    status: string;
    message: string;

    verificationTaskCreated?: VerificationTask;
    observationsProcessed?: ProcessedObservation[];
    nextTaskId?: string;
    nextTaskPreview?: NextTaskPreview;
    dashboardUpdate?: DashboardUpdate;
}

// ============================================================================
// Status Mapping
// ============================================================================

/**
 * Map reportTaskStatus status to Task queue status
 */
function mapToTaskQueueStatus(status: ReportTaskStatusRequest['status']): Task['status'] {
    switch (status) {
        case 'done':
            return 'done';
        case 'failed':
        case 'partial':
            return 'in-progress'; // Keep in progress for failed/partial
        case 'blocked':
            return 'blocked';
        default:
            return 'in-progress';
    }
}

// ============================================================================
// Verification Task Creation
// ============================================================================

/**
 * Determine if a verification task should be created
 * Creates verification task for 'done' status with tests passed
 */
function shouldCreateVerificationTask(
    status: ReportTaskStatusRequest['status'],
    testing?: Testing
): boolean {
    // Only create verification for completed tasks
    if (status !== 'done') {
        return false;
    }

    // Don't create if tests failed
    if (testing && !testing.testsPassed) {
        return false;
    }

    return true;
}

/**
 * Create a verification task for completed work
 */
function createVerificationTask(task: Task, taskQueue: TaskQueue): VerificationTask {
    const verificationTaskId = `VERIFY-${task.taskId}`;

    // Determine automation level based on task complexity
    const automationLevel: VerificationTask['automationLevel'] =
        task.priority === 'critical' ? 'manual' :
            task.priority === 'high' ? 'semi-automated' :
                'automated';

    // Create verification task in queue
    const verificationTask: Task = {
        taskId: verificationTaskId,
        title: `Verify: ${task.title}`,
        description: `Verification task for ${task.taskId}: ${task.title}`,
        priority: task.priority,
        status: 'pending',
        dependencies: [task.taskId],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    taskQueue.addTask(verificationTask);

    return {
        taskId: verificationTaskId,
        title: `Verify: ${task.title}`,
        why: `Ensure ${task.title} works as expected in production environment`,
        automationLevel,
    };
}

// ============================================================================
// Observation Processing
// ============================================================================

/**
 * Process observations and determine follow-up actions
 */
function processObservations(observations: string[]): ProcessedObservation[] {
    return observations.map((observation, index) => {
        const observationId = `OBS-${Date.now()}-${index}`;

        // Determine if observation requires action
        // Check for critical issues first (bugs, problems)
        const hasCriticalIssue =
            observation.toLowerCase().includes('bug') ||
            observation.toLowerCase().includes('issue') ||
            observation.toLowerCase().includes('problem');

        // Check for follow-up keywords
        const needsFollowUp =
            observation.toLowerCase().includes('need') ||
            observation.toLowerCase().includes('should') ||
            observation.toLowerCase().includes('todo');

        // "error" keyword is less critical if it's just mentioning error handling
        const hasErrorMention = observation.toLowerCase().includes('error');

        let status: ProcessedObservation['status'] = 'noted';
        let suggestedFollowUp: string | undefined;

        // Priority: follow-up > critical issues > error mentions
        if (needsFollowUp) {
            status = 'follow-up-created';
            suggestedFollowUp = `Create task: ${observation}`;
        } else if (hasCriticalIssue || hasErrorMention) {
            status = 'action-required';
            suggestedFollowUp = `Investigate and fix: ${observation}`;
        }

        return {
            observationId,
            observation,
            status,
            suggestedFollowUp,
        };
    });
}

// ============================================================================
// Follow-Up Task Creation
// ============================================================================

/**
 * Create follow-up tasks in the queue
 */
function createFollowUpTasks(
    followUpTasks: FollowUpTask[],
    originalTask: Task,
    taskQueue: TaskQueue
): void {
    followUpTasks.forEach((followUp, index) => {
        const followUpTaskId = `${originalTask.taskId}-FOLLOWUP-${index + 1}`;

        const newTask: Task = {
            taskId: followUpTaskId,
            title: followUp.title,
            description: `Follow-up from ${originalTask.taskId}: ${followUp.why}`,
            priority: originalTask.priority === 'critical' ? 'high' : 'medium',
            status: 'pending',
            dependencies: [originalTask.taskId],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        taskQueue.addTask(newTask);
    });
}

// ============================================================================
// Dashboard Statistics
// ============================================================================

/**
 * Calculate dashboard statistics
 */
function calculateDashboardUpdate(taskQueue: TaskQueue): DashboardUpdate {
    const allTasks = taskQueue.getAllTasks();
    const stats = taskQueue.getStats();

    const completedCount = stats.done;
    const totalCount = allTasks.length;
    const percentComplete = totalCount > 0
        ? Math.round((completedCount / totalCount) * 100 * 10) / 10
        : 0;

    // Count tasks pending verification (tasks with status 'done' but not verified)
    const verificationPendingCount = allTasks.filter(t =>
        t.title.startsWith('Verify:') && t.status === 'pending'
    ).length;

    return {
        completedCount,
        totalCount,
        percentComplete,
        blockedCount: stats.blocked,
        verificationPendingCount,
    };
}

// ============================================================================
// Get Next Task
// ============================================================================

/**
 * Get the next available task for preview
 */
function getNextAvailableTask(taskQueue: TaskQueue, excludeTaskId: string): {
    taskId: string;
    preview: NextTaskPreview;
} | null {
    const allTasks = taskQueue.getAllTasks();

    // Find next ready task (not the current one)
    const nextTask = allTasks.find(t =>
        t.taskId !== excludeTaskId &&
        (t.status === 'ready' || t.status === 'pending') &&
        !t.title.startsWith('Verify:')
    );

    if (!nextTask) {
        return null;
    }

    return {
        taskId: nextTask.taskId,
        preview: {
            title: nextTask.title,
            priority: nextTask.priority,
        },
    };
}

// ============================================================================
// Main Tool Implementation
// ============================================================================

/**
 * reportTaskStatus MCP Tool
 * 
 * Updates task status and processes completion details.
 * 
 * @param params - Request parameters (taskId, status, testing, etc.)
 * @param taskQueue - Task queue instance
 * @returns ReportTaskStatusResponse with verification tasks and dashboard update
 */
export async function reportTaskStatus(
    params: Record<string, unknown>,
    taskQueue: TaskQueue
): Promise<ReportTaskStatusResponse> {
    // Validate request parameters
    let validatedParams: ReportTaskStatusRequest;
    try {
        validatedParams = ReportTaskStatusRequestSchema.parse(params);
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

    // Check if task is already done
    if (task.status === 'done' && validatedParams.status === 'done') {
        throw new MCPProtocolError(
            MCPErrorCode.TASK_ALREADY_IN_PROGRESS,
            `Task ${validatedParams.taskId} is already marked as done`,
            { taskId: validatedParams.taskId, currentStatus: task.status }
        );
    }

    // Update task status in queue
    const newStatus = mapToTaskQueueStatus(validatedParams.status);
    taskQueue.updateTaskStatus(validatedParams.taskId, newStatus);

    // Process verification (for completed tasks)
    let verificationTask: VerificationTask | undefined;
    if (shouldCreateVerificationTask(validatedParams.status, validatedParams.testing)) {
        verificationTask = createVerificationTask(task, taskQueue);
    }

    // Process observations
    let observationsProcessed: ProcessedObservation[] | undefined;
    if (validatedParams.observations && validatedParams.observations.length > 0) {
        observationsProcessed = processObservations(validatedParams.observations);
    }

    // Create follow-up tasks
    if (validatedParams.followUpTasks && validatedParams.followUpTasks.length > 0) {
        createFollowUpTasks(validatedParams.followUpTasks, task, taskQueue);
    }

    // Get next task
    const nextTask = getNextAvailableTask(taskQueue, validatedParams.taskId);

    // Calculate dashboard update
    const dashboardUpdate = calculateDashboardUpdate(taskQueue);

    // Build success message
    const stats = taskQueue.getStats();
    const message = `Task marked ${validatedParams.status}. ` +
        `${stats.pending} ready tasks, ${stats.blocked} blocked` +
        (verificationTask ? `, 1 verification task created` : '');

    return {
        success: true,
        taskId: validatedParams.taskId,
        status: validatedParams.status,
        message,
        verificationTaskCreated: verificationTask,
        observationsProcessed,
        nextTaskId: nextTask?.taskId,
        nextTaskPreview: nextTask?.preview,
        dashboardUpdate,
    };
}
