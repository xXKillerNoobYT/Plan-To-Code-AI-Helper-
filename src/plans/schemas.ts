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
 * Validate plan structure with comprehensive checks
 */
export function validatePlan(plan: any): plan is PlanSchema {
    if (!plan || typeof plan !== 'object') {
        return false;
    }

    // Check version
    if (typeof plan.version !== 'string' || !plan.version.trim()) {
        return false;
    }

    // Check project
    if (!validateProjectInfo(plan.project)) {
        return false;
    }

    // Check phases
    if (!Array.isArray(plan.phases)) {
        return false;
    }
    if (!plan.phases.every((phase: any) => validatePhase(phase))) {
        return false;
    }

    // Check tasks
    if (!Array.isArray(plan.tasks)) {
        return false;
    }
    if (!plan.tasks.every((task: any) => validateTaskDefinition(task))) {
        return false;
    }

    // Check metadata
    if (!validateMetadata(plan.metadata)) {
        return false;
    }

    return true;
}

/**
 * Validate ProjectInfo structure
 */
function validateProjectInfo(project: any): project is ProjectInfo {
    if (!project || typeof project !== 'object') {
        return false;
    }

    if (typeof project.name !== 'string' || !project.name.trim()) {
        return false;
    }

    if (typeof project.description !== 'string') {
        return false;
    }

    if (typeof project.createdAt !== 'string' || !isValidISO8601(project.createdAt)) {
        return false;
    }

    if (typeof project.updatedAt !== 'string' || !isValidISO8601(project.updatedAt)) {
        return false;
    }

    // Optional repository field
    if (project.repository !== undefined && typeof project.repository !== 'string') {
        return false;
    }

    return true;
}

/**
 * Validate Phase structure
 */
function validatePhase(phase: any): phase is Phase {
    if (!phase || typeof phase !== 'object') {
        return false;
    }

    if (typeof phase.phaseId !== 'string' || !phase.phaseId.trim()) {
        return false;
    }

    if (typeof phase.name !== 'string' || !phase.name.trim()) {
        return false;
    }

    if (typeof phase.description !== 'string') {
        return false;
    }

    if (!['not-started', 'in-progress', 'completed'].includes(phase.status)) {
        return false;
    }

    if (!Array.isArray(phase.tasks)) {
        return false;
    }

    if (!phase.tasks.every((taskId: any) => typeof taskId === 'string')) {
        return false;
    }

    return true;
}

/**
 * Validate TaskDefinition structure
 */
function validateTaskDefinition(task: any): task is TaskDefinition {
    if (!task || typeof task !== 'object') {
        return false;
    }

    if (typeof task.taskId !== 'string' || !task.taskId.trim()) {
        return false;
    }

    if (typeof task.title !== 'string' || !task.title.trim()) {
        return false;
    }

    if (typeof task.description !== 'string') {
        return false;
    }

    if (typeof task.phase !== 'string' || !task.phase.trim()) {
        return false;
    }

    if (!['critical', 'high', 'medium', 'low'].includes(task.priority)) {
        return false;
    }

    if (!['pending', 'ready', 'in-progress', 'done', 'blocked'].includes(task.status)) {
        return false;
    }

    if (!Array.isArray(task.dependencies)) {
        return false;
    }

    if (!task.dependencies.every((depId: any) => typeof depId === 'string')) {
        return false;
    }

    // Optional fields validation
    if (task.assignee !== undefined && typeof task.assignee !== 'string') {
        return false;
    }

    if (task.estimatedHours !== undefined && typeof task.estimatedHours !== 'number') {
        return false;
    }

    if (task.actualHours !== undefined && typeof task.actualHours !== 'number') {
        return false;
    }

    if (task.tags !== undefined && !Array.isArray(task.tags)) {
        return false;
    }

    if (task.tags !== undefined && !task.tags.every((tag: any) => typeof tag === 'string')) {
        return false;
    }

    if (task.githubIssue !== undefined && typeof task.githubIssue !== 'number') {
        return false;
    }

    if (task.acceptanceCriteria !== undefined && !Array.isArray(task.acceptanceCriteria)) {
        return false;
    }

    if (
        task.acceptanceCriteria !== undefined &&
        !task.acceptanceCriteria.every((criterion: any) => typeof criterion === 'string')
    ) {
        return false;
    }

    return true;
}

/**
 * Validate Metadata structure
 */
function validateMetadata(metadata: any): metadata is Metadata {
    if (!metadata || typeof metadata !== 'object') {
        return false;
    }

    if (typeof metadata.totalTasks !== 'number' || metadata.totalTasks < 0) {
        return false;
    }

    if (typeof metadata.completedTasks !== 'number' || metadata.completedTasks < 0) {
        return false;
    }

    if (metadata.completedTasks > metadata.totalTasks) {
        return false;
    }

    if (
        typeof metadata.progressPercentage !== 'number' ||
        metadata.progressPercentage < 0 ||
        metadata.progressPercentage > 100
    ) {
        return false;
    }

    if (typeof metadata.lastModified !== 'string' || !isValidISO8601(metadata.lastModified)) {
        return false;
    }

    if (!Array.isArray(metadata.authors)) {
        return false;
    }

    if (!metadata.authors.every((author: any) => typeof author === 'string')) {
        return false;
    }

    return true;
}

/**
 * Helper function to validate ISO 8601 date strings
 */
function isValidISO8601(dateString: string): boolean {
    try {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    } catch {
        return false;
    }
}


