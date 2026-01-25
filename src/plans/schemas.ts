/**
 * Plan Schemas
 * TypeScript interfaces for plan.json structure
 */

export interface PlanSchema {
    version: string;
    project: ProjectInfo;
    phases: Phase[];
    tasks: TaskDefinition[];
    metadata: Metadata;
}

export interface ProjectInfo {
    name: string;
    description: string;
    repository?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Phase {
    phaseId: string;
    name: string;
    description: string;
    status: 'not-started' | 'in-progress' | 'completed';
    tasks: string[]; // Task IDs
}

export interface TaskDefinition {
    taskId: string;
    title: string;
    description: string;
    phase: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'pending' | 'ready' | 'in-progress' | 'done' | 'blocked';
    dependencies: string[];
    assignee?: string;
    estimatedHours?: number;
    actualHours?: number;
    tags?: string[];
    githubIssue?: number;
    acceptanceCriteria?: string[];
}

export interface Metadata {
    totalTasks: number;
    completedTasks: number;
    progressPercentage: number;
    lastModified: string;
    authors: string[];
}

/**
 * Validate plan structure
 */
export function validatePlan(plan: any): plan is PlanSchema {
    // TODO: Implement comprehensive validation
    return (
        plan &&
        typeof plan.version === 'string' &&
        typeof plan.project === 'object' &&
        Array.isArray(plan.phases) &&
        Array.isArray(plan.tasks)
    );
}
