/**
 * MCP Tool: getNextTask
 * Retrieves the next available task from the queue with full context
 * 
 * Purpose:
 * - Returns highest priority task (critical → high → medium → low)
 * - Includes super-detailed prompt with design references
 * - Provides file contexts and acceptance criteria
 * - Filters by status (excludes 'done' and 'blocked')
 * 
 * References:
 * - Plans/COE-Master-Plan/05-MCP-API-Reference.md (Request/Response schema)
 */

import { z } from 'zod';
import { Task, TaskQueue } from '../../tasks/queue';
import { MCPErrorCode, MCPProtocolError } from '../protocol';

// ============================================================================
// Request/Response Schemas (Zod Validation)
// ============================================================================

/**
 * Request schema for getNextTask
 */
export const GetNextTaskRequestSchema = z.object({
    filter: z.enum(['ready', 'blocked', 'all']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    includeContext: z.boolean().optional(),
    includeDetailedPrompt: z.boolean().optional(),
    includeRelatedFiles: z.boolean().optional(),
}).strict();

export type GetNextTaskRequest = z.infer<typeof GetNextTaskRequestSchema>;

/**
 * Super-detailed prompt structure
 */
export interface SuperDetailedPrompt {
    description: string;
    context: string;
    requirements: string[];
    designReferences?: {
        fromPlan?: string;
        colorPalette?: Record<string, unknown>;
        typography?: Record<string, unknown>;
        accessibilityNotes?: string;
        [key: string]: unknown;
    };
    files?: {
        readFrom: string[];
        writeTo: string[];
        referencedIn: string[];
    };
    acceptanceCriteria: string[];
    estimatedHours: number;
    complexityLevel: 'easy' | 'medium' | 'hard' | 'expert';
    skillsRequired: string[];
}

/**
 * Task preview for queue
 */
export interface TaskPreview {
    id: string;
    title: string;
    priority: string;
}

/**
 * Enhanced task with super-detailed prompt
 */
export interface EnhancedTask extends Task {
    superDetailedPrompt?: SuperDetailedPrompt;
    planReference?: {
        planId: string;
        version: string;
        affectedSections: string[];
    };
}

/**
 * Response schema for getNextTask
 */
export interface GetNextTaskResponse {
    success: boolean;
    task: EnhancedTask | null;
    queueLength: number;
    nextTasksPreview: TaskPreview[];
}

// ============================================================================
// Priority Ordering
// ============================================================================

/**
 * Priority weights for sorting (higher = more important)
 */
const PRIORITY_WEIGHTS: Record<Task['priority'], number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
};

/**
 * Sort tasks by priority (critical first, then high, medium, low)
 */
function sortByPriority(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
        const weightA = PRIORITY_WEIGHTS[a.priority] || 0;
        const weightB = PRIORITY_WEIGHTS[b.priority] || 0;

        // Higher weight = higher priority = comes first
        if (weightA !== weightB) {
            return weightB - weightA;
        }

        // Tie-breaker: earlier created date first
        return a.createdAt.getTime() - b.createdAt.getTime();
    });
}

// ============================================================================
// Super-Detailed Prompt Generation
// ============================================================================

/**
 * Generate super-detailed prompt for a task
 * Provides extensive context for AI agents to execute the task correctly
 */
function generateSuperDetailedPrompt(task: Task): SuperDetailedPrompt {
    // Extract complexity from task description or default to 'medium'
    const complexityLevel: SuperDetailedPrompt['complexityLevel'] =
        task.description.toLowerCase().includes('complex') ? 'hard' :
            task.description.toLowerCase().includes('simple') ? 'easy' :
                'medium';

    return {
        description: task.description,
        context: `This task is part of the COE project. Priority: ${task.priority.toUpperCase()}. ` +
            `Current status: ${task.status}. ` +
            (task.dependencies.length > 0
                ? `Depends on ${task.dependencies.length} task(s). `
                : 'No dependencies. '),

        requirements: [
            'Follow TypeScript best practices',
            'Write comprehensive unit tests (≥80% coverage)',
            'Use Zod for input validation',
            'Follow modular execution philosophy (atomic tasks)',
        ],

        designReferences: {
            fromPlan: 'Plans/COE-Master-Plan/',
            accessibilityNotes: 'Ensure WCAG AA compliance for all UI components',
        },

        files: {
            readFrom: ['PRD.md', 'Plans/CONSOLIDATED-MASTER-PLAN.md'],
            writeTo: [], // Task-specific, would be enhanced with actual task metadata
            referencedIn: [],
        },

        acceptanceCriteria: [
            'Implementation matches specification',
            'All tests pass',
            'Code passes ESLint checks',
            'TypeScript compilation succeeds with no errors',
        ],

        estimatedHours: 2, // Default estimate, should come from task metadata
        complexityLevel,
        skillsRequired: ['TypeScript', 'VS Code Extension Development'],
    };
}

// ============================================================================
// Task Filtering
// ============================================================================

/**
 * Filter tasks based on request parameters
 */
function filterTasks(
    tasks: Task[],
    filter?: GetNextTaskRequest['filter'],
    priorityFilter?: GetNextTaskRequest['priority']
): Task[] {
    let filtered = tasks;

    // Apply status filter
    switch (filter) {
        case 'ready':
            filtered = filtered.filter(t => t.status === 'ready');
            break;
        case 'blocked':
            filtered = filtered.filter(t => t.status === 'blocked');
            break;
        case 'all':
            // Don't filter by status
            break;
        default:
            // Default: exclude done and blocked
            filtered = filtered.filter(t =>
                t.status !== 'done' && t.status !== 'blocked'
            );
    }

    // Apply priority filter
    if (priorityFilter) {
        filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    return filtered;
}

// ============================================================================
// Main Tool Implementation
// ============================================================================

/**
 * getNextTask MCP Tool
 * 
 * Returns the highest priority task from the queue with super-detailed prompt.
 * 
 * @param params - Request parameters (filter, priority, etc.)
 * @param taskQueue - Task queue instance
 * @returns GetNextTaskResponse with task or null if queue is empty
 */
export async function getNextTask(
    params: Record<string, unknown>,
    taskQueue: TaskQueue
): Promise<GetNextTaskResponse> {
    // Validate request parameters
    let validatedParams: GetNextTaskRequest;
    try {
        validatedParams = GetNextTaskRequestSchema.parse(params);
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

    // Get all tasks from queue
    const allTasks = taskQueue.getAllTasks();

    if (!Array.isArray(allTasks)) {
        throw new MCPProtocolError(
            MCPErrorCode.INTERNAL_ERROR,
            'Task queue returned invalid task list',
            { receivedType: typeof allTasks }
        );
    }

    // Apply filters
    const filteredTasks = filterTasks(
        allTasks,
        validatedParams.filter,
        validatedParams.priority
    );

    // Sort by priority (highest first)
    const sortedTasks = sortByPriority(filteredTasks);

    // Get next task (highest priority)
    const nextTask = sortedTasks.length > 0 ? sortedTasks[0] : null;

    // Enhance task with super-detailed prompt if requested
    let enhancedTask: EnhancedTask | null = null;
    if (nextTask) {
        enhancedTask = { ...nextTask };

        // Default: include detailed prompt unless explicitly set to false
        if (validatedParams.includeDetailedPrompt !== false) {
            enhancedTask.superDetailedPrompt = generateSuperDetailedPrompt(nextTask);
        }

        // Default: include context unless explicitly set to false
        if (validatedParams.includeContext !== false) {
            enhancedTask.planReference = {
                planId: 'coe-project',
                version: '1.0.0',
                affectedSections: ['MCP Server', 'Task Management'],
            };
        }
    }

    // Generate next tasks preview (top 3 after current)
    const nextTasksPreview: TaskPreview[] = sortedTasks
        .slice(1, 4) // Skip first (current task), get next 3
        .map(t => ({
            id: t.taskId,
            title: t.title,
            priority: t.priority,
        }));

    // Return response
    return {
        success: true,
        task: enhancedTask,
        queueLength: filteredTasks.length,
        nextTasksPreview,
    };
}


