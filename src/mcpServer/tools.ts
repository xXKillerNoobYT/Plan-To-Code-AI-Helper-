/**
 * MCP Tools Implementation (DEPRECATED)
 * 
 * ⚠️ This file is deprecated. Individual tools are now implemented in src/mcpServer/tools/
 * 
 * Use the following imports instead:
 * - import { getNextTask } from './tools/getNextTask';
 * - import { reportTaskStatus } from './tools/reportTaskStatus';
 * 
 * Or use the index:
 * - import { getNextTask, reportTaskStatus } from './tools';
 */

// This file is kept for backwards compatibility but is no longer used.
// All tool implementations have been moved to individual files in tools/ directory.

/**
 * @deprecated Use import { getNextTask } from './tools/getNextTask' instead
 */
export async function getNextTask(_params: any): Promise<any> {
    throw new Error('This function is deprecated. Import from ./tools/getNextTask instead.');
}

/**
 * @deprecated Use import { reportTaskStatus } from './tools/reportTaskStatus' instead
 */
export async function reportTaskDone(_params: any): Promise<any> {
    throw new Error('This function is deprecated. Import from ./tools/reportTaskStatus instead.');
}

/**
 * @deprecated Tool not yet implemented
 */
export async function askQuestion(_params: any): Promise<any> {
    throw new Error('askQuestion tool not yet implemented. Coming soon!');
}


