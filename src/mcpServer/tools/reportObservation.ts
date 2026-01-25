/**
 * MCP Tool: reportObservation
 * Reports discoveries, issues, or new work identified during task execution
 * 
 * Purpose:
 * - Logs observations with severity and type classification
 * - Creates new tasks when observations require action
 * - Generates dashboard alerts for critical findings
 * - Tracks observation history
 * 
 * References:
 * - Plans/COE-Master-Plan/05-MCP-API-Reference.md (Tool 4: reportObservation)
 */

import { z } from 'zod';
import { Task, TaskQueue } from '../../tasks/queue';
import { MCPErrorCode, MCPProtocolError } from '../protocol';

// ============================================================================
// Request/Response Schemas (Zod Validation)
// ============================================================================

/**
 * Observation details schema
 */
export const ObservationDetailsSchema = z.object({
    what: z.string().min(1),
    why: z.string().min(1),
    impact: z.string().min(1),
    suggestedAction: z.string().min(1),
});

export type ObservationDetails = z.infer<typeof ObservationDetailsSchema>;

/**
 * New task details schema
 */
export const NewTaskDetailsSchema = z.object({
    title: z.string().min(1).max(200),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    estimatedHours: z.number().min(0),
});

export type NewTaskDetails = z.infer<typeof NewTaskDetailsSchema>;

/**
 * Request schema for reportObservation
 */
export const ReportObservationRequestSchema = z.object({
    taskId: z.string().min(1),
    observation: z.string().min(1),
    type: z.enum(['discovery', 'issue', 'improvement', 'dependency', 'test-failure', 'architecture-concern']),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    details: ObservationDetailsSchema.optional(),
    relatedToTask: z.string().optional(),
    createNewTask: z.boolean().optional(),
    newTaskDetails: NewTaskDetailsSchema.optional(),
    attachedFiles: z.array(z.string()).optional(),
    references: z.array(z.string()).optional(),
});

export type ReportObservationRequest = z.infer<typeof ReportObservationRequestSchema>;

/**
 * New task created from observation
 */
export interface NewTaskCreated {
    taskId: string;
    title: string;
    priority: string;
    addedToQueue: boolean;
    position: string;
}

/**
 * Dashboard alert
 */
export interface DashboardAlert {
    message: string;
    timestamp: string;
    visible: boolean;
}

/**
 * Response schema for reportObservation
 */
export interface ReportObservationResponse {
    success: boolean;
    observationId: string;
    observation: string;
    type: string;
    severity: string;
    status: 'logged' | 'task-created';
    newTaskCreated?: NewTaskCreated;
    dashboardAlert?: DashboardAlert;
}

// ============================================================================
// Observation ID Generation
// ============================================================================

/**
 * Generate unique observation ID
 */
function generateObservationId(taskId: string): string {
    return `OBS-${taskId}-${Date.now()}`;
}

// ============================================================================
// Task Creation from Observation
// ============================================================================

/**
 * Create task from observation if requested
 */
function createTaskFromObservation(
    observation: string,
    newTaskDetails: NewTaskDetails,
    originalTaskId: string,
    taskQueue: TaskQueue
): NewTaskCreated {
    const newTaskId = `TASK-${Date.now()}`;

    // Create new task
    const task: Task = {
        taskId: newTaskId,
        title: newTaskDetails.title,
        description: `Created from observation: ${observation}`,
        priority: newTaskDetails.priority,
        status: 'pending',
        dependencies: [originalTaskId],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    taskQueue.addTask(task);

    // Determine position based on priority
    let position = 'after current task dependencies';
    if (newTaskDetails.priority === 'critical') {
        position = 'immediate (highest priority)';
    } else if (newTaskDetails.priority === 'high') {
        position = 'next after critical tasks';
    }

    return {
        taskId: newTaskId,
        title: newTaskDetails.title,
        priority: newTaskDetails.priority,
        addedToQueue: true,
        position,
    };
}

// ============================================================================
// Dashboard Alert Generation
// ============================================================================

/**
 * Generate dashboard alert if needed
 */
function generateDashboardAlert(
    observation: string,
    type: ReportObservationRequest['type'],
    severity: ReportObservationRequest['severity']
): DashboardAlert | undefined {
    // Critical and high severity observations get alerts
    if (severity === 'critical' || severity === 'high') {
        return {
            message: `${type.toUpperCase()}: ${observation}`,
            timestamp: new Date().toISOString(),
            visible: true,
        };
    }

    // Architecture concerns always get alerts
    if (type === 'architecture-concern') {
        return {
            message: `Architecture Concern: ${observation}`,
            timestamp: new Date().toISOString(),
            visible: true,
        };
    }

    return undefined;
}

// ============================================================================
// Main Tool Implementation
// ============================================================================

/**
 * reportObservation MCP Tool
 * 
 * Logs observations discovered during task execution.
 * 
 * @param params - Request parameters (observation, type, severity, etc.)
 * @param taskQueue - Task queue instance
 * @returns ReportObservationResponse with observation details
 */
export async function reportObservation(
    params: Record<string, unknown>,
    taskQueue: TaskQueue
): Promise<ReportObservationResponse> {
    // Validate request parameters
    let validatedParams: ReportObservationRequest;
    try {
        validatedParams = ReportObservationRequestSchema.parse(params);
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

    // Generate observation ID
    const observationId = generateObservationId(validatedParams.taskId);

    // Create new task if requested
    let newTaskCreated: NewTaskCreated | undefined;
    let status: ReportObservationResponse['status'] = 'logged';

    if (validatedParams.createNewTask && validatedParams.newTaskDetails) {
        newTaskCreated = createTaskFromObservation(
            validatedParams.observation,
            validatedParams.newTaskDetails,
            validatedParams.taskId,
            taskQueue
        );
        status = 'task-created';
    }

    // Generate dashboard alert if needed
    const dashboardAlert = generateDashboardAlert(
        validatedParams.observation,
        validatedParams.type,
        validatedParams.severity
    );

    // Build response
    const response: ReportObservationResponse = {
        success: true,
        observationId,
        observation: validatedParams.observation,
        type: validatedParams.type,
        severity: validatedParams.severity,
        status,
    };

    if (newTaskCreated) {
        response.newTaskCreated = newTaskCreated;
    }

    if (dashboardAlert) {
        response.dashboardAlert = dashboardAlert;
    }

    return response;
}
