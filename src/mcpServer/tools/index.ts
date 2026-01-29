/**
 * MCP Tools - Index
 * 
 * This file exports all MCP tools from their individual modules.
 * Each tool is implemented in its own file in the tools/ directory.
 */

export { getNextTask, GetNextTaskRequest, GetNextTaskResponse } from './getNextTask';
export { reportTaskStatus, ReportTaskStatusRequest, ReportTaskStatusResponse } from './reportTaskStatus';
export { askQuestion, AskQuestionRequest, AskQuestionResponse } from './askQuestion';
export { reportTestFailure, ReportTestFailureRequest, ReportTestFailureResponse } from './reportTestFailure';
export { reportObservation, ReportObservationRequest, ReportObservationResponse } from './reportObservation';
export { reportVerificationResult, ReportVerificationResultRequest, ReportVerificationResultResponse } from './reportVerificationResult';

// All 6 P1 MCP tools exported! Complete! 🎉


