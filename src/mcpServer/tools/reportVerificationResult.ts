/**
 * MCP Tool: reportVerificationResult
 * Reports results of verification/testing tasks
 * 
 * Purpose:
 * - Records verification task outcomes
 * - Updates original task status based on verification
 * - Creates follow-up tasks for failed verifications
 * - Clears blockers when verification passes
 * 
 * References:
 * - Plans/COE-Master-Plan/05-MCP-API-Reference.md (Tool 6: reportVerificationResult)
 */

import { z } from 'zod';
import { Task, TaskQueue } from '../../tasks/queue';
import { MCPErrorCode, MCPProtocolError } from '../protocol';

// ============================================================================
// Request/Response Schemas (Zod Validation)
// ============================================================================

/**
 * Checklist item schema
 */
export const ChecklistItemSchema = z.object({
    item: z.string().min(1),
    status: z.enum(['passed', 'failed', 'skipped']),
    note: z.string().optional(),
});

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

/**
 * Failed item schema
 */
export const FailedItemSchema = z.object({
    item: z.string().min(1),
    issue: z.string().min(1),
    why: z.string().min(1),
});

export type FailedItem = z.infer<typeof FailedItemSchema>;

/**
 * Verification schema
 */
export const VerificationSchema = z.object({
    checklist: z.array(ChecklistItemSchema),
    failedItems: z.array(FailedItemSchema).optional(),
    summary: z.string().min(1),
});

export type Verification = z.infer<typeof VerificationSchema>;

/**
 * Request schema for reportVerificationResult
 */
export const ReportVerificationResultRequestSchema = z.object({
    verificationTaskId: z.string().min(1),
    originalTaskId: z.string().min(1),
    verificationStatus: z.enum(['passed', 'failed', 'partial', 'needs-manual-review']),
    verification: VerificationSchema,
    originalTaskStatus: z.enum(['done', 'done_but_incomplete', 'needs_rework']),
    suggestedActions: z.array(z.string()).optional(),
});

export type ReportVerificationResultRequest = z.infer<typeof ReportVerificationResultRequestSchema>;

/**
 * Issue found during verification
 */
export interface IssueFound {
    issueId: string;
    title: string;
    relatedComponents: string[];
    severity: string;
}

/**
 * Follow-up task created
 */
export interface FollowUpTask {
    taskId: string;
    title: string;
    relatedTo: string;
    priority: string;
}

/**
 * Dashboard update
 */
export interface DashboardUpdate {
    message: string;
    issuesCount: number;
    followUpTasksCount: number;
}

/**
 * Response schema for reportVerificationResult
 */
export interface ReportVerificationResultResponse {
    success: boolean;
    verificationTaskId: string;
    verificationStatus: string;
    originalTaskStatus: string;
    message: string;
    issuesFound?: IssueFound[];
    followUpTasksCreated?: FollowUpTask[];
    originalTaskMarked: string;
    blockerCleared: boolean;
    dashboardUpdate?: DashboardUpdate;
}

// ============================================================================
// Issue Detection
// ============================================================================

/**
 * Detect issues from failed checklist items
 */
function detectIssues(
    failedItems: FailedItem[] | undefined,
    verificationStatus: string
): IssueFound[] {
    if (!failedItems || failedItems.length === 0) {
        return [];
    }

    return failedItems.map((item, index) => {
        // Determine severity based on verification status
        let severity = 'medium';
        if (verificationStatus === 'failed') {
            severity = 'high';
        } else if (verificationStatus === 'partial') {
            severity = 'medium';
        }

        return {
            issueId: `ISSUE-${Date.now()}-${index}`,
            title: item.item,
            relatedComponents: [item.item],
            severity,
        };
    });
}

// ============================================================================
// Follow-Up Task Creation
// ============================================================================

/**
 * Create follow-up tasks for failed verifications
 */
function createFollowUpTasks(
    failedItems: FailedItem[] | undefined,
    originalTaskId: string,
    taskQueue: TaskQueue
): FollowUpTask[] {
    if (!failedItems || failedItems.length === 0) {
        return [];
    }

    const followUpTasks: FollowUpTask[] = [];

    failedItems.forEach((item, index) => {
        const taskId = `FOLLOWUP-${originalTaskId}-${Date.now()}-${index}`;
        const title = `Fix: ${item.item}`;

        // Create task in queue
        const task: Task = {
            taskId,
            title,
            description: `Fix verification failure: ${item.issue}. Reason: ${item.why}`,
            priority: 'high',
            status: 'pending',
            dependencies: [originalTaskId],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        taskQueue.addTask(task);

        followUpTasks.push({
            taskId,
            title,
            relatedTo: originalTaskId,
            priority: 'high',
        });
    });

    return followUpTasks;
}

// ============================================================================
// Task Status Updates
// ============================================================================

/**
 * Update original task status based on verification
 */
function updateOriginalTaskStatus(
    originalTaskId: string,
    originalTaskStatus: ReportVerificationResultRequest['originalTaskStatus'],
    taskQueue: TaskQueue
): void {
    // Map status to queue status
    let queueStatus: Task['status'] = 'done';

    if (originalTaskStatus === 'needs_rework') {
        queueStatus = 'in-progress';
    } else {
        queueStatus = 'done';
    }

    taskQueue.updateTaskStatus(originalTaskId, queueStatus);
}

/**
 * Mark verification task as complete
 */
function markVerificationTaskComplete(
    verificationTaskId: string,
    taskQueue: TaskQueue
): void {
    taskQueue.updateTaskStatus(verificationTaskId, 'done');
}

// ============================================================================
// Blocker Clearance
// ============================================================================

/**
 * Check if verification clears blockers
 */
function checkBlockerCleared(
    originalTaskId: string,
    verificationStatus: string,
    taskQueue: TaskQueue
): boolean {
    if (verificationStatus !== 'passed') {
        return false;
    }

    // Check if any tasks were blocked by this task
    const allTasks = taskQueue.getAllTasks();
    const blockedTasks = allTasks.filter(t =>
        t.dependencies.includes(originalTaskId) &&
        t.status === 'pending'
    );

    return blockedTasks.length > 0;
}

// ============================================================================
// Main Tool Implementation
// ============================================================================

/**
 * reportVerificationResult MCP Tool
 * 
 * Reports verification task results and updates task statuses.
 * 
 * @param params - Request parameters (verification details, status, etc.)
 * @param taskQueue - Task queue instance
 * @returns ReportVerificationResultResponse with verification details
 */
export async function reportVerificationResult(
    params: Record<string, unknown>,
    taskQueue: TaskQueue
): Promise<ReportVerificationResultResponse> {
    // Validate request parameters
    let validatedParams: ReportVerificationResultRequest;
    try {
        validatedParams = ReportVerificationResultRequestSchema.parse(params);
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

    // Find the verification task
    const verificationTask = taskQueue.getAllTasks().find(
        t => t.taskId === validatedParams.verificationTaskId
    );
    if (!verificationTask) {
        throw new MCPProtocolError(
            MCPErrorCode.TASK_NOT_FOUND,
            `Verification task ${validatedParams.verificationTaskId} not found`,
            { taskId: validatedParams.verificationTaskId }
        );
    }

    // Find the original task
    const originalTask = taskQueue.getAllTasks().find(
        t => t.taskId === validatedParams.originalTaskId
    );
    if (!originalTask) {
        throw new MCPProtocolError(
            MCPErrorCode.TASK_NOT_FOUND,
            `Original task ${validatedParams.originalTaskId} not found`,
            { taskId: validatedParams.originalTaskId }
        );
    }

    // Detect issues from failed items
    const issuesFound = detectIssues(
        validatedParams.verification.failedItems,
        validatedParams.verificationStatus
    );

    // Create follow-up tasks for failures
    const followUpTasksCreated = createFollowUpTasks(
        validatedParams.verification.failedItems,
        validatedParams.originalTaskId,
        taskQueue
    );

    // Update original task status
    updateOriginalTaskStatus(
        validatedParams.originalTaskId,
        validatedParams.originalTaskStatus,
        taskQueue
    );

    // Mark verification task as complete
    markVerificationTaskComplete(validatedParams.verificationTaskId, taskQueue);

    // Check if verification cleared any blockers
    const blockerCleared = checkBlockerCleared(
        validatedParams.originalTaskId,
        validatedParams.verificationStatus,
        taskQueue
    );

    // Build message
    const passedCount = validatedParams.verification.checklist.filter(
        i => i.status === 'passed'
    ).length;
    const totalCount = validatedParams.verification.checklist.length;

    const message = `Verification ${validatedParams.verificationStatus}: ${passedCount}/${totalCount} checks passed. ` +
        `Original task marked as ${validatedParams.originalTaskStatus}.`;

    // Build dashboard update
    let dashboardUpdate: DashboardUpdate | undefined;
    if (issuesFound.length > 0 || followUpTasksCreated.length > 0) {
        dashboardUpdate = {
            message: `Verification completed: ${issuesFound.length} issues found, ${followUpTasksCreated.length} follow-up tasks created`,
            issuesCount: issuesFound.length,
            followUpTasksCount: followUpTasksCreated.length,
        };
    }

    // Build response
    const response: ReportVerificationResultResponse = {
        success: true,
        verificationTaskId: validatedParams.verificationTaskId,
        verificationStatus: validatedParams.verificationStatus,
        originalTaskStatus: validatedParams.originalTaskStatus,
        message,
        originalTaskMarked: validatedParams.originalTaskStatus,
        blockerCleared,
    };

    if (issuesFound.length > 0) {
        response.issuesFound = issuesFound;
    }

    if (followUpTasksCreated.length > 0) {
        response.followUpTasksCreated = followUpTasksCreated;
    }

    if (dashboardUpdate) {
        response.dashboardUpdate = dashboardUpdate;
    }

    return response;
}


