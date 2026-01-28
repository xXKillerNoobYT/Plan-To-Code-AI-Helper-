/**
 * Programming Orchestrator - Dedicated Coding Director
 * 
 * This is the **sole job** of orchestrating and directing the Coding AI (GitHub Copilot)
 * based on Planning Team outputs. It has **strict separation** from Planning, Answering, 
 * and Verification teams.
 * 
 * Architecture Principles:
 * - Pulls pre-decomposed tasks from Planning Team queue
 * - Routes tasks to Coding AI with super-detailed prompts (under 3000 tokens)
 * - Monitors progress via MCP tools
 * - Routes clarifications to Answer Team
 * - Reports completion back to orchestration queue
 * - Enforces "one thing at a time" modular execution
 * 
 * References:
 * - Plans/COE-Master-Plan/02-Agent-Role-Definitions.md (Agent 1: Programming Orchestrator)
 * - Plans/MODULAR-EXECUTION-PHILOSOPHY.md (One-thing-at-a-time enforcement)
 * - Plans/COE-Master-Plan/05-MCP-API-Reference.md (MCP tool specifications)
 * - Plans/COE-Master-Plan/10-MCP-Error-Codes-Registry.md (Error codes)
 * 
 * @version 1.0.0
 * @author Copilot Orchestration Extension Team
 */

import { z } from 'zod';
import * as vscode from 'vscode';

// ============================================================================
// Logger Interface
// ============================================================================

/**
 * 📝 Logger Interface
 * Provides logging capabilities for the orchestrator
 */
interface ILogger {
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    debug(message: string, ...args: unknown[]): void;
}

// ============================================================================
// Type Definitions & Validation
// ============================================================================

/**
 * 🎯 Task Priority Enumeration
 * Strictly adheres to Copilot Orchestration Extension priority scheme
 */
export enum TaskPriority {
    P1 = 'P1',  // Critical launch blockers (HIGHEST)
    P2 = 'P2',  // High priority, important features
    P3 = 'P3',  // Medium priority, nice-to-have
}

/**
 * 🔄 Task Status Enumeration
 * Tracks task progression through execution lifecycle
 */
export enum TaskStatus {
    PENDING = 'pending',           // Waiting in queue
    READY = 'ready',               // All dependencies met
    IN_PROGRESS = 'in-progress',   // Currently being executed by Copilot
    COMPLETED = 'completed',       // Done, awaiting verification
    BLOCKED = 'blocked',           // Dependency failure or Copilot blocked
    FAILED = 'failed',             // Execution failed
}

/**
 * 🎁 Task Data Model (from Planning Team)
 * Represents a pre-decomposed, atomic task from the Planning Team
 */
export const TaskSchema = z.object({
    taskId: z.string().min(1, 'Task ID is required'),
    title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 chars'),
    description: z.string().min(10, 'Description must be at least 10 chars'),
    priority: z.nativeEnum(TaskPriority),
    status: z.nativeEnum(TaskStatus),
    dependencies: z.array(z.string()).default([]),
    blockedBy: z.array(z.string()).default([]),
    estimatedHours: z.number().positive().default(1),
    acceptanceCriteria: z.array(z.string()).min(1, 'Must have acceptance criteria'),
    relatedFiles: z.array(z.string()).optional(),
    designReferences: z.record(z.unknown()).optional(),
    contextBundle: z.string().optional(), // Pre-computed context (under 3000 tokens)
    fromPlanningTeam: z.boolean().default(true), // CRITICAL: Must come from Planning Team
    createdAt: z.date().optional(),
    assignedTo: z.string().optional(),
    metadata: z.object({
        ticketId: z.string().optional(),
        routedTeam: z.string().optional(),
        routingReason: z.string().optional(),
        routingConfidence: z.number().optional(),
        isEscalated: z.boolean().optional()
    }).optional() // Optional metadata for ticket-routed tasks
});

export type Task = z.infer<typeof TaskSchema>;

/**
 * � Persisted Task Format
 * Minimal task data for storage (excludes large fields like contextBundle)
 */
export interface PersistedTask {
    taskId: string;
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    dependencies: string[];
    blockedBy: string[];
    estimatedHours: number;
    acceptanceCriteria: string[];
    relatedFiles?: string[];
    assignedTo?: string;
    metadata?: {
        ticketId?: string;
        routedTeam?: string;
        routingReason?: string;
        routingConfidence?: number;
        isEscalated?: boolean;
    };
    createdAt: string;
}

/**
 * �📋 Routing Directive (sent to Coding AI/Copilot)
 * Super-detailed prompt for Copilot with task context bundled together
 */
export const RoutingDirectiveSchema = z.object({
    taskId: z.string(),
    title: z.string(),
    description: z.string(),
    acceptanceCriteria: z.array(z.string()),
    contextBundle: z.string(), // Pre-computed, token-limited context
    relatedFiles: z.array(z.string()),
    designReferences: z.record(z.unknown()).optional(),
    estimatedHours: z.number(),
    priority: z.nativeEnum(TaskPriority),
    promptVersion: z.literal('1.0').default('1.0'),
});

export type RoutingDirective = z.infer<typeof RoutingDirectiveSchema>;

/**
 * MCP Tool Response Schema
 * Standard response format for all MCP tool calls
 */
export const MCPToolResponseSchema = z.object({
    success: z.boolean(),
    data: z.unknown().optional(),
    error: z.object({
        code: z.string(),
        message: z.string(),
        severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
        retryable: z.boolean().default(false),
    }).optional(),
});

export type MCPToolResponse = z.infer<typeof MCPToolResponseSchema>;

/**
 * 🔐 MCP Error Codes (from Plan/COE-Master-Plan/10-MCP-Error-Codes-Registry.md)
 * Standardized error codes for orchestrator failures
 */
export enum MCPErrorCode {
    INVALID_STATE = 'INVALID_STATE',                    // No tasks ready
    INVALID_PARAM = 'INVALID_PARAM',                    // Bad input validation
    TOKEN_LIMIT_EXCEEDED = 'TOKEN_LIMIT_EXCEEDED',      // Context too large
    TIMEOUT = 'TIMEOUT',                                // Copilot unresponsive
    RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',          // Task not found
    DELEGATION_FAILED = 'DELEGATION_FAILED',            // Copilot handoff failed
    LOOP_DETECTED = 'LOOP_DETECTED',                    // Infinite blocking loop
    INTERNAL_ERROR = 'INTERNAL_ERROR',                  // Orchestrator internal error
}

// ============================================================================
// MCP Interface
// ============================================================================

/**
 * 🎯 MCP Tool Callable Interface
 * Defines contract for MCP tool invocation
 */
export interface MCPToolInterface {
    getNextTask(planId: string, filter?: string): Promise<MCPToolResponse>;
    reportTaskStatus(taskId: string, status: TaskStatus, output?: string): Promise<MCPToolResponse>;
    askQuestion(question: string, context: Record<string, unknown>): Promise<MCPToolResponse>;
    reportObservation(taskId: string, observation: string): Promise<MCPToolResponse>;
    reportVerificationResult(taskId: string, passed: boolean, details?: string): Promise<MCPToolResponse>;
}

/**
 * 🏗️ Mock MCP Tool Interface (for testing without real MCP server)
 */
export class MockMCPTools implements MCPToolInterface {
    async getNextTask(planId: string, filter?: string): Promise<MCPToolResponse> {
        return { success: true, data: null };
    }

    async reportTaskStatus(taskId: string, status: TaskStatus, output?: string): Promise<MCPToolResponse> {
        return { success: true, data: { taskId, status } };
    }

    async askQuestion(question: string, context: Record<string, unknown>): Promise<MCPToolResponse> {
        return { success: true, data: { answer: 'Mock response', context } };
    }

    async reportObservation(taskId: string, observation: string): Promise<MCPToolResponse> {
        return { success: true, data: { taskId, observation } };
    }

    async reportVerificationResult(taskId: string, passed: boolean, details?: string): Promise<MCPToolResponse> {
        return { success: true, data: { taskId, passed, details } };
    }
}

// ============================================================================
// Programming Orchestrator Class
// ============================================================================

/**
 * 🎭 Programming Orchestrator
 * 
 * **Sole Responsibility**: Orchestrate and direct the Coding AI (GitHub Copilot)
 * based on Planning Team outputs.
 * 
 * **What it does**:
 * - Pulls pre-decomposed tasks from Planning Team queue
 * - Prepares super-detailed prompts for Copilot (under 3000 tokens)
 * - Routes tasks to Coding AI with full context
 * - Monitors progress and detects blocks
 * - Routes clarifications to Answer Team via MCP
 * - Reports completion status back to orchestration queue
 * - Enforces strict "one thing at a time" execution
 * 
 * **What it does NOT do** (strict separation):
 * - ❌ Never generates plans (Planning Team's job)
 * - ❌ Never answers questions directly (Answer Team's job)
 * - ❌ Never verifies code quality (Verification Team's job)
 * - ❌ Never executes code itself
 */
export class ProgrammingOrchestrator {
    private taskQueue: Task[] = [];
    private currentTask: Task | null = null;
    private activeSessions: Map<string, boolean> = new Map(); // Track active Copilot sessions
    private mcpTools: MCPToolInterface;
    private logger: ILogger;
    private maxConcurrentSessions: number = 3;
    private isInitialized: boolean = false;
    private tokenLimitPerPrompt: number = 3000;
    private healthCheckInterval: number = 10000; // 10 seconds
    private escalationTimeout: number = 30000; // 30 seconds
    private treeDataProvider: any = null; // Reference to TreeView provider for auto-refresh
    private workspaceState?: vscode.Memento; // VS Code workspace state for persistence
    private saveDebounceTimer?: NodeJS.Timeout; // Debounce timer for saving
    private readonly STORAGE_KEY = 'coe.taskQueue';
    private readonly SAVE_DEBOUNCE_MS = 200;
    private readonly MAX_TASKS = 50;

    /**
     * 🏗️ Constructor
     * 
     * Initializes the Programming Orchestrator with MCP tools and logger
     * 
     * @param mcpTools - Interface to MCP tools for communication
     * @param logger - Logger instance for tracking operations
     */
    constructor(
        mcpTools: MCPToolInterface = new MockMCPTools(),
        logger?: ILogger,
    ) {
        this.mcpTools = mcpTools;
        this.logger = logger || new SimpleLogger('ProgrammingOrchestrator');
    }

    // ========================================================================
    // Lifecycle Management
    // ========================================================================

    /**
     * 🌲 Set TreeView data provider for auto-refresh
     * 
     * Links the TreeView provider to the orchestrator so it can be refreshed
     * automatically when the queue changes.
     * 
     * @param provider - TreeView data provider instance
     */
    setTreeDataProvider(provider: any): void {
        this.treeDataProvider = provider;
        console.log('✅ TreeView provider linked to ProgrammingOrchestrator');
    }

    /**
     * 🔔 Notify TreeView to refresh (internal helper)
     * 
     * Called after any queue modification to keep UI in sync.
     */
    private notifyTreeViewUpdate(): void {
        if (this.treeDataProvider?.refresh) {
            console.log('🌲 TreeView refreshed after queue change');
            this.treeDataProvider.refresh();
        }
    }

    /**
     * 💾 Initialize persistence with workspace state
     * 
     * Loads persisted tasks from previous session. Call this during
     * extension activation to restore task queue.
     * 
     * @param workspaceState - VS Code workspace state for persistence
     */
    async initializeWithPersistence(workspaceState: vscode.Memento): Promise<void> {
        this.workspaceState = workspaceState;
        await this.loadPersistedTasks();
        console.log('✅ ProgrammingOrchestrator initialized with persistence');
    }

    /**
     * 📦 Load persisted tasks from workspace state
     * 
     * @private
     */
    private async loadPersistedTasks(): Promise<void> {
        if (!this.workspaceState) {
            console.warn('⚠️ No workspace state available, skipping task load');
            return;
        }

        try {
            const persistedData = this.workspaceState.get<any[]>(this.STORAGE_KEY);

            if (!persistedData || !Array.isArray(persistedData)) {
                console.log('📦 No persisted tasks found, starting fresh');
                return;
            }

            // Filter to only load active tasks (ready/inProgress/blocked)
            const activeTasks = persistedData.filter(t =>
                ['ready', 'in-progress', 'blocked'].includes(t.status)
            );

            // Restore tasks to queue with proper Date conversion
            this.taskQueue = activeTasks.map(t => {
                // Convert string dates back to Date objects
                let createdAt: Date;

                if (t.createdAt) {
                    const parsed = new Date(t.createdAt);
                    if (isNaN(parsed.getTime())) {
                        console.warn(`⚠️ Invalid date for task "${t.title}", using current time`);
                        createdAt = new Date();
                    } else {
                        createdAt = parsed;
                    }
                } else {
                    createdAt = new Date();
                }

                return {
                    ...t,
                    taskId: t.taskId || t.id, // Handle both formats
                    fromPlanningTeam: true, // Mark as valid
                    createdAt // Ensure Date object, not string
                };
            }) as Task[];

            console.log(`📦 Loaded and converted ${activeTasks.length} tasks with Date objects (filtered from ${persistedData.length} total)`);

            // Log loaded tasks with validation
            activeTasks.forEach((task, idx) => {
                const loadedTask = this.taskQueue[idx];
                console.log(`   - ${task.taskId || task.id}: ${task.title} (${task.status}, ${task.priority})`);

                // Verify Date conversion
                if (!(loadedTask.createdAt instanceof Date) || isNaN(loadedTask.createdAt.getTime())) {
                    console.error(`   ❌ Date conversion failed for task ${loadedTask.taskId}`);
                }
            });

            // Trigger UI refresh
            this.notifyTreeViewUpdate();
        } catch (error) {
            console.error('❌ Failed to load persisted tasks:', error);
            console.log('   Starting with empty queue');
            this.taskQueue = [];
        }
    }

    /**
     * Save current task queue to workspace state (debounced)
     * 
     * Persists tasks so they survive extension reloads.
     * Only saves essential data (excludes large contextBundles).
     * Debounced to avoid excessive writes.
     * 
     * @private
     */
    private async saveTaskQueue(): Promise<void> {
        // Clear existing debounce timer
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }

        // Debounce save operation
        this.saveDebounceTimer = setTimeout(async () => {
            if (!this.workspaceState) {
                console.warn('⚠️ No workspace state available, cannot save tasks');
                return;
            }

            try {
                // Convert tasks to minimal persisted format
                const persistedTasks: PersistedTask[] = this.taskQueue.map((task: Task) => ({
                    taskId: task.taskId,
                    title: task.title,
                    description: task.description,
                    priority: task.priority,
                    status: task.status,
                    dependencies: task.dependencies || [],
                    blockedBy: task.blockedBy || [],
                    estimatedHours: task.estimatedHours,
                    acceptanceCriteria: task.acceptanceCriteria,
                    relatedFiles: task.relatedFiles,
                    assignedTo: task.assignedTo,
                    createdAt: task.createdAt?.toISOString() || new Date().toISOString(),
                    // Include metadata if present (for ticket-routed tasks)
                    metadata: task.metadata ? {
                        ticketId: task.metadata.ticketId,
                        routedTeam: task.metadata.routedTeam,
                        routingReason: task.metadata.routingReason,
                        routingConfidence: task.metadata.routingConfidence,
                        isEscalated: task.metadata.isEscalated
                    } : undefined
                }));

                // Enforce max task limit (keep most recent 50)
                const tasksToSave = persistedTasks.slice(-this.MAX_TASKS);

                if (persistedTasks.length > this.MAX_TASKS) {
                    console.warn(`⚠️ Task queue exceeded max size (${persistedTasks.length}), trimming to ${this.MAX_TASKS}`);
                }

                await this.workspaceState.update(this.STORAGE_KEY, tasksToSave);

                console.log(`💾 Queue saved to storage (${tasksToSave.length} tasks)`);
            } catch (error) {
                console.error('❌ Failed to save task queue:', error);

                // If storage quota exceeded, trim completed tasks and retry
                if (error instanceof Error && error.message.includes('quota')) {
                    console.log('   Storage quota exceeded, trimming completed tasks...');
                    const activeTasks = this.taskQueue.filter((t: Task) => t.status !== 'completed');
                    this.taskQueue = activeTasks;

                    // Retry save with trimmed data
                    setTimeout(() => this.saveTaskQueue(), 100);
                }
            }
        }, this.SAVE_DEBOUNCE_MS);
    }

    /**
     * 🚀 Initialize the Orchestrator
     * 
     * Sets up the orchestrator, validates configuration, and prepares for task execution.
     * Must be called before any task routing.
     * 
     * **Enforces**: One-thing-at-a-time principle by ensuring single current task
     * 
     * @throws Error if initialization fails
     */
    async init(): Promise<void> {
        try {
            this.logger.info('Programming Orchestrator: Initializing...');

            // Validate configuration
            if (this.maxConcurrentSessions < 1) {
                throw new Error('maxConcurrentSessions must be >= 1');
            }

            // Initialize empty task queue
            this.taskQueue = [];
            this.currentTask = null;
            this.activeSessions.clear();

            this.isInitialized = true;

            this.logger.info('✅ Programming Orchestrator: Ready (one-thing-at-a-time enforced)');
        } catch (error) {
            this.logger.error('❌ Failed to initialize Orchestrator:', error);
            throw error;
        }
    }

    /**
     * 🛑 Shutdown the Orchestrator
     * 
     * Gracefully shuts down the orchestrator, cleaning up active sessions
     * and saving state.
     */
    async shutdown(): Promise<void> {
        try {
            this.logger.info('Programming Orchestrator: Shutting down...');

            // Cancel all active sessions
            for (const [sessionId, _] of this.activeSessions) {
                this.logger.info(`Cancelling session: ${sessionId}`);
                this.activeSessions.delete(sessionId);
            }

            // Clear queue
            this.taskQueue = [];
            this.currentTask = null;
            this.isInitialized = false;

            this.logger.info('✅ Programming Orchestrator: Shutdown complete');
        } catch (error) {
            this.logger.error('❌ Error during shutdown:', error);
        }
    }

    // ========================================================================
    // Task Queue Management
    // ========================================================================

    /**
     * 📋 Add task to the queue
     * 
     * Adds a pre-decomposed task from Planning Team to the orchestrator's queue.
     * Tasks are validated and inserted in priority order (P1 > P2 > P3).
     * 
     * **Enforces**: Planning Team output only (verifies fromPlanningTeam flag)
     * **Prevents**: Duplicate tasks for the same ticket (if task has ticketId metadata)
     * 
     * @param task - Task to add (must be from Planning Team)
     * @throws Error if task is invalid or not from Planning Team
     */
    async addTask(task: Task): Promise<void> {
        // Prevent duplicate tasks for tickets (with fallback to title+priority check)
        if (task.metadata?.ticketId) {
            const exists = await this.hasTaskForTicket(
                task.metadata.ticketId,
                { title: task.title, priority: task.priority }
            );
            if (exists) {
                console.warn(`⚠️ Task already exists for ticket ${task.metadata.ticketId}, skipping duplicate`);
                console.log(`   Task title: "${task.title}", Priority: ${task.priority}`);
                return;
            }
        }

        // Enforce max task limit
        if (this.taskQueue.length >= this.MAX_TASKS) {
            console.warn(`⚠️ Task queue at capacity (${this.MAX_TASKS}), removing oldest completed task`);
            const completedIndex = this.taskQueue.findIndex((t: Task) => t.status === 'completed');
            if (completedIndex >= 0) {
                this.taskQueue.splice(completedIndex, 1);
            } else {
                console.error('❌ Cannot add task: queue full and no completed tasks to remove');
                return;
            }
        }

        // Add to queue
        this.taskQueue.push(task);

        console.log(`📋 Task added to queue: ${task.taskId} (Priority: ${task.priority}, Status: ${task.status})`);
        if (task.metadata?.ticketId) {
            console.log(`   Linked to ticket: ${task.metadata.ticketId} (Team: ${task.metadata.routedTeam})`);
        }

        // Save to storage and trigger UI refresh
        await this.saveTaskQueue();
        this.notifyTreeViewUpdate();
    }

    /**
     * 🔄 Get next task from queue
     * 
     * Pulls the highest priority task from the queue that is ready for execution.
     * Returns null if no tasks are ready.
     * 
     * **Priority Order**: P1 > P2 > P3 > (next ready task)
     * 
     * @returns Next ready task or null if queue empty
     * @throws Error with INVALID_STATE if queue is empty
     */
    getNextTask(): Task | null {
        try {
            // Filter ready tasks (no blockers, all dependencies met)
            const readyTasks = this.getReadyTasks();

            if (readyTasks.length === 0) {
                this.logger.warn('⚠️ No ready tasks in queue');
                return null;
            }

            // Return highest priority task (P1 first)
            const nextTask = readyTasks[0];
            this.logger.info(`🎯 Next task: ${nextTask.taskId} (${nextTask.priority})`);

            return nextTask;
        } catch (error) {
            this.logger.error('❌ Error getting next task:', error);
            throw error;
        }
    }

    /**
     * 📋 Get all ready tasks sorted by priority
     * @returns Ready tasks ordered by priority (P1 → P2 → P3)
     */
    getReadyTasks(): Task[] {
        console.log(`🔍 getReadyTasks() called - Total queue size: ${this.taskQueue.length}`);

        const readyTasks = this.taskQueue.filter((t) => {
            const isReady = t.status === TaskStatus.READY;
            const notBlocked = !t.blockedBy || t.blockedBy.length === 0;
            const dependenciesMet = this.areDependenciesMet(t);

            if (!isReady) {
                console.log(`  ❌ Task ${t.taskId} (${t.title}): status=${t.status} (not READY)`);
            } else if (!notBlocked) {
                console.log(`  ⛔ Task ${t.taskId} (${t.title}): blocked by ${t.blockedBy?.join(', ')}`);
            } else if (!dependenciesMet) {
                console.log(`  🔗 Task ${t.taskId} (${t.title}): dependencies not met`);
            } else {
                console.log(`  ✅ Task ${t.taskId} (${t.title}): READY (priority: ${t.priority})`);
            }

            return isReady && notBlocked && dependenciesMet;
        });

        const priorityRank: Record<TaskPriority, number> = {
            [TaskPriority.P1]: 1,
            [TaskPriority.P2]: 2,
            [TaskPriority.P3]: 3,
        };

        const sorted = readyTasks.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

        console.log(`📊 getReadyTasks() returning ${sorted.length} tasks`);

        return sorted;
    }

    /**
     * 🗑️ Clear all tasks from the queue
     */
    clearQueue(): void {
        this.taskQueue = [];
        this.currentTask = null;
        // Save to storage
        this.saveTaskQueue();
        // Notify TreeView to refresh
        this.notifyTreeViewUpdate();
    }

    /**
     * ♻️ Replace the entire queue with new tasks
     * @param tasks New tasks to set
     */
    setTasks(tasks: Task[]): void {
        this.clearQueue();
        tasks.forEach((task) => this.addTask(task));
        // notifyTreeViewUpdate already called by clearQueue and addTask
    }

    /**
     * 🔎 Find a task by id
     * @param taskId Task identifier
     * @returns Task if found, otherwise undefined
     */
    getTaskById(taskId: string): Task | undefined {
        return this.taskQueue.find((t) => t.taskId === taskId);
    }

    /**
     * 🎟️ Get queue status
     * 
     * Returns current queue statistics for monitoring
     * 
     * @returns Queue statistics
     */
    getQueueStatus(): {
        totalTasks: number;
        byPriority: Record<string, number>;
        byStatus: Record<string, number>;
        currentTask: Task | null;
        activeSessions: number;
    } {
        const stats = {
            totalTasks: this.taskQueue.length,
            byPriority: {
                P1: this.taskQueue.filter((t) => t.priority === TaskPriority.P1).length,
                P2: this.taskQueue.filter((t) => t.priority === TaskPriority.P2).length,
                P3: this.taskQueue.filter((t) => t.priority === TaskPriority.P3).length,
            },
            byStatus: {
                pending: this.taskQueue.filter((t) => t.status === TaskStatus.PENDING).length,
                ready: this.taskQueue.filter((t) => t.status === TaskStatus.READY).length,
                inProgress: this.taskQueue.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
                completed: this.taskQueue.filter((t) => t.status === TaskStatus.COMPLETED).length,
                blocked: this.taskQueue.filter((t) => t.status === TaskStatus.BLOCKED).length,
                failed: this.taskQueue.filter((t) => t.status === TaskStatus.FAILED).length,
            },
            currentTask: this.currentTask,
            activeSessions: this.activeSessions.size,
        };

        return stats;
    }

    /**
     * 🔄 Check if orchestrator is busy processing a task
     * 
     * Returns true if a task is currently in progress
     * 
     * @returns boolean True if actively processing a task
     */
    isBusy(): boolean {
        return this.currentTask !== null && this.currentTask.status === TaskStatus.IN_PROGRESS;
    }

    /**
     * 🎫 Check if task already exists for a given ticket ID
     * 
     * Prevents duplicate tasks from being created for the same ticket.
     * Useful for ticket routing to avoid double-queueing.
     * 
     * Uses two-level duplicate detection:
     * 1. Primary: Exact ticketId match in metadata
     * 2. Fallback: title + priority match (if ticket data provided)
     * 
     * @param ticketId - Ticket ID to check
     * @param ticket - Optional ticket object for fallback title/priority matching
     * @returns Promise<boolean> True if a task already exists for this ticket
     */
    async hasTaskForTicket(ticketId: string, ticket?: { title: string; priority: string }): Promise<boolean> {
        if (!this.taskQueue || !Array.isArray(this.taskQueue)) {
            console.warn('⚠️ Queue not initialized when checking for duplicate ticket');
            return false;
        }

        // Primary check: exact ticketId match in metadata
        const existingTask = this.taskQueue.find((task: Task) =>
            task.metadata?.ticketId === ticketId
        );

        if (existingTask) {
            console.log(`🔍 Found duplicate task by ticketId: ${ticketId}`);
            return true;
        }

        // Fallback check: if ticket provided, check title + priority match
        if (ticket) {
            const hasSimilarMatch = this.taskQueue.some((task: Task) =>
                task.title === ticket.title && task.priority === ticket.priority
            );

            if (hasSimilarMatch) {
                console.log(`🔍 Found duplicate task by title+priority match for ticket: ${ticketId}`);
                return true;
            }
        }

        return false;
    }

    /**
     * 📊 Get count of ready tasks
     * 
     * Useful for monitoring queue status and UI updates
     * 
     * @returns number Count of tasks with status READY
     */
    getReadyTasksCount(): number {
        return this.taskQueue.filter((t) => t.status === TaskStatus.READY).length;
    }

    /**
     * 📊 Get count of in-progress tasks
     * 
     * @returns number Count of tasks with status IN_PROGRESS
     */
    getInProgressTasksCount(): number {
        return this.taskQueue.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    }

    /**
     * 📊 Get all tasks
     * 
     * @returns Task[] All tasks in queue
     */
    getAllTasks(): Task[] {
        return this.taskQueue;
    }

    /**
     * 📊 Get ready tasks count
     * 
     * Returns count of tasks with READY status for status bar display.
     * 
     * @returns number Count of ready tasks
     */
    getReadyCount(): number {
        if (!this.taskQueue || !Array.isArray(this.taskQueue)) {
            return 0;
        }
        return this.taskQueue.filter((t: Task) => t.status === TaskStatus.READY).length;
    }

    /**
     * 💾 Save queue to workspace state
     * 
     * Persists tasks across VS Code reloads.
     * Only saves essential fields to stay under storage limits.
     * 
     * @param workspaceState VS Code workspace state
     * @returns Promise<void>
     */
    async saveToStorage(workspaceState: vscode.Memento): Promise<void> {
        if (!this.taskQueue || !Array.isArray(this.taskQueue)) {
            return;
        }

        // Only persist first 50 tasks with minimal data
        const simplifiedTasks: PersistedTask[] = this.taskQueue.slice(0, this.MAX_TASKS).map((task: Task) => ({
            taskId: task.taskId,
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: task.status,
            dependencies: task.dependencies || [],
            blockedBy: task.blockedBy || [],
            estimatedHours: task.estimatedHours,
            acceptanceCriteria: task.acceptanceCriteria,
            relatedFiles: task.relatedFiles,
            assignedTo: task.assignedTo,
            metadata: task.metadata,
            createdAt: task.createdAt?.toISOString() || new Date().toISOString(),
        }));

        try {
            await workspaceState.update(this.STORAGE_KEY, simplifiedTasks);
            this.logger.info(`💾 Saved ${simplifiedTasks.length} tasks to storage`);
        } catch (error) {
            this.logger.error(`Failed to save task queue: ${error}`);
        }
    }

    /**
     * 📂 Load queue from workspace state
     * 
     * Restores persisted tasks on extension activation.
     * 
     * @param workspaceState VS Code workspace state
     * @returns Promise<void>
     */
    async loadFromStorage(workspaceState: vscode.Memento): Promise<void> {
        try {
            const stored = workspaceState.get<PersistedTask[]>(this.STORAGE_KEY);

            if (!stored || !Array.isArray(stored)) {
                this.logger.info('📂 No persisted tasks found, starting fresh');
                this.taskQueue = [];
                return;
            }

            // Convert stored data back to Task objects with proper Date handling
            this.taskQueue = stored.map((item: PersistedTask) => {
                let createdAt: Date;

                if (item.createdAt) {
                    const parsed = new Date(item.createdAt);
                    if (isNaN(parsed.getTime())) {
                        this.logger.warn(`Invalid date for task "${item.title}", using current time`);
                        createdAt = new Date();
                    } else {
                        createdAt = parsed;
                    }
                } else {
                    createdAt = new Date();
                }

                return {
                    ...item,
                    createdAt,
                    fromPlanningTeam: true,
                } as Task;
            });

            this.logger.info(`📂 Loaded and converted ${this.taskQueue.length} tasks from storage with Date objects`);
            this.notifyTreeViewUpdate();
        } catch (error) {
            this.logger.error(`Failed to load task queue: ${error}`);
            this.taskQueue = [];
        }
    }

    // ========================================================================
    // Task Routing (Handoff to Coding AI)
    // ========================================================================

    /**
     * 🚀 Route task to Coding AI (Copilot)
     * 
     * Prepares a super-detailed prompt for the given task and hands it off
     * to GitHub Copilot. Enforces "one thing at a time" by allowing only
     * one concurrent task at a time.
     * 
     * **Process**:
     * 1. Validates task is atomic and from Planning Team
     * 2. Generates super-detailed prompt (under 3000 tokens)
     * 3. Reports task status as IN_PROGRESS via MCP
     * 4. Returns routing directive for Copilot
     * 
     * **Enforces**:
     * - One task at a time (no parallel execution in Orchestrator)
     * - Task comes from Planning Team
     * - Prompt under 3000 tokens
     * - All dependencies met
     * 
     * @param task - Task to route to Copilot
     * @returns Routing directive with super-detailed prompt
     * @throws Error if validation fails or task invalid
     */
    async routeTask(task: Task): Promise<RoutingDirective> {
        try {
            // Validate task
            const validatedTask = TaskSchema.parse(task);

            // CRITICAL: Verify task from Planning Team
            if (!validatedTask.fromPlanningTeam) {
                throw new Error('Task must be from Planning Team');
            }

            // CRITICAL: Enforce one-thing-at-a-time
            if (this.currentTask !== null && this.currentTask.taskId !== validatedTask.taskId) {
                throw new Error(
                    `Cannot route new task while already executing: ${this.currentTask.taskId}. ` +
                    'One thing at a time!',
                );
            }

            // Check concurrent session limit
            if (this.activeSessions.size >= this.maxConcurrentSessions) {
                throw new Error(
                    `Max concurrent sessions (${this.maxConcurrentSessions}) reached`,
                );
            }

            // Find task in queue
            const queuedTask = this.taskQueue.find((t) => t.taskId === validatedTask.taskId);
            if (!queuedTask) {
                throw new Error(
                    `Task not found in queue: ${validatedTask.taskId}. ` +
                    'Task must be added to queue before routing.',
                );
            }

            // Check all dependencies are met
            if (!this.areDependenciesMet(queuedTask)) {
                throw new Error(
                    `Cannot route task: unmet dependencies: ${queuedTask.dependencies.join(', ')} `,
                );
            }

            // Generate super-detailed prompt (under 3000 tokens)
            const prompt = this.generateSuperDetailedPrompt(queuedTask);

            // Validate prompt token count (rough estimate)
            const promptTokens = this.estimateTokens(prompt);
            if (promptTokens > this.tokenLimitPerPrompt) {
                this.logger.warn(
                    `⚠️ Prompt exceeds token limit: ${promptTokens} > ${this.tokenLimitPerPrompt}. ` +
                    'Breaking down further.',
                );
            }

            // Create routing directive
            const directive: RoutingDirective = {
                taskId: queuedTask.taskId,
                title: queuedTask.title,
                description: queuedTask.description,
                acceptanceCriteria: queuedTask.acceptanceCriteria,
                contextBundle: prompt,
                relatedFiles: queuedTask.relatedFiles || [],
                designReferences: queuedTask.designReferences,
                estimatedHours: queuedTask.estimatedHours,
                priority: queuedTask.priority,
                promptVersion: '1.0',
            };

            // Validate directive
            const validatedDirective = RoutingDirectiveSchema.parse(directive);

            // Update task status in queue to IN_PROGRESS
            queuedTask.status = TaskStatus.IN_PROGRESS;

            // Report task status as IN_PROGRESS via MCP
            const sessionId = this.generateSessionId(queuedTask.taskId);
            await this.mcpTools.reportTaskStatus(
                queuedTask.taskId,
                TaskStatus.IN_PROGRESS,
            );

            // Track active session
            this.activeSessions.set(sessionId, true);
            this.currentTask = queuedTask;

            this.logger.info(
                `✅ Task routed to Copilot (${sessionId}): ` +
                `${queuedTask.title} [${promptTokens} tokens]`,
            );

            return validatedDirective;
        } catch (error) {
            this.logger.error('❌ Failed to route task:', error);
            throw error;
        }
    }

    /**
     * ✅ Handle task completion
     * 
     * Called when Coding AI reports that a task is complete. Updates task status,
     * closes the session, and reports back to the orchestration queue.
     * 
     * **Process**:
     * 1. Validates task completion
     * 2. Updates task status to COMPLETED
     * 3. Reports completion via MCP
     * 4. Closes Copilot session
     * 5. Frees up for next task
     * 
     * @param taskId - ID of completed task
     * @param output - Optional output/summary from Copilot
     * @throws Error if task not found or already complete
     */
    async onTaskComplete(taskId: string, output?: string): Promise<void> {
        try {
            // Find task
            const task = this.taskQueue.find((t) => t.taskId === taskId);
            if (!task) {
                throw new Error(`Task not found: ${taskId}`);
            }

            // Verify task is in progress
            if (task.status !== TaskStatus.IN_PROGRESS) {
                throw new Error(
                    `Cannot complete task not in progress. Current status: ${task.status}`,
                );
            }

            // Update task status
            task.status = TaskStatus.COMPLETED;

            // Report completion via MCP
            await this.mcpTools.reportTaskStatus(
                taskId,
                TaskStatus.COMPLETED,
                output,
            );

            // Close session
            const sessionId = this.generateSessionId(taskId);
            this.activeSessions.delete(sessionId);

            // Clear current task if it's this one
            if (this.currentTask?.taskId === taskId) {
                this.currentTask = null;
            }

            this.logger.info(`✅ Task completed: ${taskId}`);
        } catch (error) {
            this.logger.error('❌ Error handling task completion:', error);
            throw error;
        }
    }

    /**
     * 🚫 Handle task failure
     * 
     * Called when Coding AI reports a task failure. Updates task status,
     * logs failure details, and opens for retry.
     * 
     * @param taskId - ID of failed task
     * @param reason - Reason for failure
     * @throws Error if task not found
     */
    async onTaskFailed(taskId: string, reason: string): Promise<void> {
        try {
            // Find task
            const task = this.taskQueue.find((t) => t.taskId === taskId);
            if (!task) {
                throw new Error(`Task not found: ${taskId}`);
            }

            // Update task status
            task.status = TaskStatus.FAILED;

            // Report failure via MCP
            await this.mcpTools.reportObservation(taskId, `Task failed: ${reason}`);

            // Close session
            const sessionId = this.generateSessionId(taskId);
            this.activeSessions.delete(sessionId);

            // Clear current task if it's this one
            if (this.currentTask?.taskId === taskId) {
                this.currentTask = null;
            }

            this.logger.error(`❌ Task failed: ${taskId}: ${reason}`);
        } catch (error) {
            this.logger.error('❌ Error handling task failure:', error);
            throw error;
        }
    }

    /**
     * 🤔 Handle task block
     * 
     * Called when Coding AI is blocked and needs clarification. Routes
     * the question to Answer Team via MCP.
     * 
     * @param taskId - ID of blocked task
     * @param blockReason - Reason for block / question to Answer Team
     * @throws Error if task not found or not in progress
     */
    async onTaskBlocked(taskId: string, blockReason: string): Promise<string> {
        try {
            // Find task
            const task = this.taskQueue.find((t) => t.taskId === taskId);
            if (!task) {
                throw new Error(`Task not found: ${taskId}`);
            }

            // Update status to BLOCKED
            task.status = TaskStatus.BLOCKED;
            task.blockedBy = [blockReason]; // Store block reason

            this.logger.warn(`⚠️ Task blocked: ${taskId}: ${blockReason}`);

            // Route to Answer Team via MCP askQuestion
            const response = await this.mcpTools.askQuestion(blockReason, {
                taskId,
                currentTask: task,
                blockReason,
            });

            if (!response.success) {
                throw new Error(`Answer Team failed to respond: ${response.error?.message}`);
            }

            const answer = (response.data as Record<string, unknown>)?.answer as string || 'No answer';

            this.logger.info(`✅ Answer Team response received: ${answer}`);

            // Report observation
            await this.mcpTools.reportObservation(
                taskId,
                `Blocked: ${blockReason}. Answer Team response: ${answer}`,
            );

            return answer;
        } catch (error) {
            this.logger.error('❌ Error handling task block:', error);
            throw error;
        }
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /**
     * 🧮 Estimate token count for a prompt
     * 
     * Simple token estimation: roughly 1 token per 4 characters
     * This is a rough estimate; for production use tiktoken or similar.
     * 
     * @param text - Text to estimate
     * @returns Estimated token count
     */
    private estimateTokens(text: string): number {
        // Rough estimate: ~1 token per 4 characters
        return Math.ceil(text.length / 4);
    }

    /**
     * 📝 Generate super-detailed prompt for Copilot
     * 
     * Creates a comprehensive, context-rich prompt under 3000 tokens
     * that gives Copilot everything it needs to complete the task.
     * 
     * **Structure**:
     * - Task description and context
     * - Acceptance criteria (clear success conditions)
     * - Related files and code context
     * - Design system references (colors, typography, accessibility)
     * - Estimated effort and complexity
     * 
     * @param task - Task to generate prompt for
     * @returns Super-detailed prompt string (under 3000 tokens)
     */
    private generateSuperDetailedPrompt(task: Task): string {
        const lines: string[] = [];

        lines.push('='.repeat(70));
        lines.push(`🎯 TASK: ${task.title}`);
        lines.push('='.repeat(70));
        lines.push('');

        // 1. Task Description
        lines.push('📝 DESCRIPTION:');
        lines.push(task.description);
        lines.push('');

        // 2. Acceptance Criteria
        lines.push('✅ ACCEPTANCE CRITERIA:');
        task.acceptanceCriteria.forEach((criterion, i) => {
            lines.push(`  ${i + 1}. ${criterion}`);
        });
        lines.push('');

        // 3. Related Files
        if (task.relatedFiles && task.relatedFiles.length > 0) {
            lines.push('📄 RELATED FILES:');
            task.relatedFiles.forEach((file) => {
                lines.push(`  - ${file}`);
            });
            lines.push('');
        }

        // 4. Design References
        if (task.designReferences && Object.keys(task.designReferences).length > 0) {
            lines.push('🎨 DESIGN REFERENCES:');
            for (const [key, value] of Object.entries(task.designReferences)) {
                lines.push(`  ${key}: ${JSON.stringify(value, null, 2)}`);
            }
            lines.push('');
        }

        // 5. Priority and Estimation
        lines.push('⏱️ EFFORT & PRIORITY:');
        lines.push(`  Priority: ${task.priority}`);
        lines.push(`  Estimated Hours: ${task.estimatedHours}`);
        lines.push('');

        // 6. Dependencies
        if (task.dependencies && task.dependencies.length > 0) {
            lines.push('🔗 DEPENDENCIES:');
            task.dependencies.forEach((dep) => {
                lines.push(`  - ${dep}`);
            });
            lines.push('');
        }

        // 7. Context Bundle (if provided)
        if (task.contextBundle) {
            lines.push('💡 CONTEXT:');
            lines.push(task.contextBundle);
            lines.push('');
        }

        // 8. Instructions
        lines.push('🚀 INSTRUCTIONS:');
        lines.push('  1. Read this entire prompt');
        lines.push('  2. Ensure all acceptance criteria are clear');
        lines.push('  3. Ask questions via askQuestion MCP tool if anything is unclear');
        lines.push('  4. Implement the task following acceptance criteria strictly');
        lines.push('  5. Report status via reportTaskStatus when complete');
        lines.push('');

        lines.push('='.repeat(70));

        const prompt = lines.join('\n');

        // Warn if exceeds limit
        const tokens = this.estimateTokens(prompt);
        if (tokens > this.tokenLimitPerPrompt) {
            this.logger.warn(
                `⚠️ Prompt exceeds limit: ${tokens} > ${this.tokenLimitPerPrompt}. ` +
                'Consider breaking task further.',
            );
        }

        return prompt;
    }

    /**
     * ✔️ Check if all dependencies are met for a task
     * 
     * @param task - Task to check
     * @returns true if all dependencies are completed
     */
    private areDependenciesMet(task: Task): boolean {
        if (!task.dependencies || task.dependencies.length === 0) {
            return true;
        }

        return task.dependencies.every((depId) => {
            const depTask = this.taskQueue.find((t) => t.taskId === depId);
            return depTask && depTask.status === TaskStatus.COMPLETED;
        });
    }

    /**
     * 🎟️ Insert task by priority order (P1, P2, P3)
     * 
     * @param task - Task to insert
     */
    private insertByPriority(task: Task): void {
        const priorityOrder: Record<string, number> = {
            [TaskPriority.P1]: 0,
            [TaskPriority.P2]: 1,
            [TaskPriority.P3]: 2,
        };

        let inserted = false;
        for (let i = 0; i < this.taskQueue.length; i++) {
            const queuePriority = priorityOrder[this.taskQueue[i].priority];
            const taskPriority = priorityOrder[task.priority];

            if (taskPriority < queuePriority) {
                this.taskQueue.splice(i, 0, task);
                inserted = true;
                break;
            }
        }

        if (!inserted) {
            this.taskQueue.push(task);
        }
    }

    /**
     * 🆔 Generate a unique session ID for a task
     * 
     * @param taskId - Task ID
     * @returns Session ID
     */
    private generateSessionId(taskId: string): string {
        return `session-${taskId}-${Date.now()}`;
    }
}

/**
 * Default logger (simple console wrapper)
 * Can be replaced with Winston, Bunyan, or other logging library
 */
export class SimpleLogger implements ILogger {
    constructor(private name: string) { }

    info(message: string, ...args: unknown[]): void {
        console.log(`[${this.name}] ℹ️ ${message}`, ...args);
    }

    warn(message: string, ...args: unknown[]): void {
        console.warn(`[${this.name}] ⚠️ ${message}`, ...args);
    }

    error(message: string, ...args: unknown[]): void {
        // Safely serialize error objects to avoid circular reference issues
        const safeArgs = args.map(arg => {
            if (arg instanceof Error) {
                return { name: arg.name, message: arg.message, stack: arg.stack };
            }
            return arg;
        });
        console.error(`[${this.name}] ❌ ${message}`, ...safeArgs);
    }

    debug(message: string, ...args: unknown[]): void {
        console.debug(`[${this.name}] 🐛 ${message}`, ...args);
    }
}

// ============================================================================
// Exports
// ============================================================================

// All types, classes, and enums are exported via their declarations above
