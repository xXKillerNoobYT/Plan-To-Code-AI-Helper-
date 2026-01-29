/**
 * MCP Protocol Handler
 * Implements JSON-RPC 2.0 over stdio transport
 * 
 * Architecture: Provides core protocol types, validation, and message handling
 * for Model Context Protocol (MCP) communication with AI agents.
 * 
 * References:
 * - Plans/COE-Master-Plan/05-MCP-API-Reference.md (JSON-RPC 2.0 spec)
 * - RFC: https://www.jsonrpc.org/specification
 */

import { z } from 'zod';

// ============================================================================
// JSON-RPC 2.0 Type Definitions
// ============================================================================

/**
 * JSON-RPC 2.0 Request Schema
 * Validates incoming MCP requests from AI agents
 */
export const MCPRequestSchema = z.object({
    jsonrpc: z.literal('2.0'),
    method: z.string().min(1),
    params: z.record(z.unknown()).optional(),
    id: z.union([z.string(), z.number()]),
});

export type MCPRequest = z.infer<typeof MCPRequestSchema>;

/**
 * JSON-RPC 2.0 Response Schema
 */
export const MCPResponseSchema = z.object({
    jsonrpc: z.literal('2.0'),
    result: z.unknown().optional(),
    error: z.object({
        code: z.number(),
        message: z.string(),
        data: z.unknown().optional(),
    }).optional(),
    id: z.union([z.string(), z.number()]),
});

export type MCPResponse = z.infer<typeof MCPResponseSchema>;

/**
 * MCP Error Codes (aligned with JSON-RPC 2.0 + MCP extensions)
 * Reference: Plans/COE-Master-Plan/10-MCP-Error-Codes-Registry.md
 */
export enum MCPErrorCode {
    // JSON-RPC 2.0 Standard Errors
    PARSE_ERROR = -32700,
    INVALID_REQUEST = -32600,
    METHOD_NOT_FOUND = -32601,
    INVALID_PARAMS = -32602,
    INTERNAL_ERROR = -32603,

    // MCP-Specific Errors (400-599 range)
    INVALID_FILTER = 400,
    TASK_NOT_FOUND = 404,
    TASK_ALREADY_IN_PROGRESS = 409,
    INTERNAL_SERVER_ERROR = 500,
    TASK_QUEUE_UNAVAILABLE = 503,
}

// ============================================================================
// Protocol Validation Functions
// ============================================================================

/**
 * Validate incoming JSON-RPC 2.0 request
 * @throws {z.ZodError} if validation fails
 */
export function validateRequest(data: unknown): MCPRequest {
    try {
        return MCPRequestSchema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new MCPProtocolError(
                MCPErrorCode.INVALID_REQUEST,
                `Invalid JSON-RPC request: ${error.errors.map(e => e.message).join(', ')}`,
                { zodErrors: error.errors }
            );
        }
        throw error;
    }
}

/**
 * Custom error class for MCP protocol errors
 */
export class MCPProtocolError extends Error {
    constructor(
        public readonly code: MCPErrorCode,
        message: string,
        public readonly data?: unknown
    ) {
        super(message);
        this.name = 'MCPProtocolError';
    }
}

// ============================================================================
// Response Builder Functions
// ============================================================================

/**
 * Create a success response (JSON-RPC 2.0 compliant)
 */
export function createSuccessResponse(result: unknown, id: string | number): MCPResponse {
    return {
        jsonrpc: '2.0',
        result,
        id
    };
}

/**
 * Create an error response (JSON-RPC 2.0 compliant)
 */
export function createErrorResponse(
    code: MCPErrorCode,
    message: string,
    id: string | number,
    data?: unknown
): MCPResponse {
    return {
        jsonrpc: '2.0',
        error: { code, message, data },
        id
    };
}

/**
 * Convert MCPProtocolError to error response
 */
export function errorToResponse(error: MCPProtocolError | Error, id: string | number): MCPResponse {
    if (error instanceof MCPProtocolError) {
        return createErrorResponse(error.code, error.message, id, error.data);
    }

    // Generic error handling
    return createErrorResponse(
        MCPErrorCode.INTERNAL_ERROR,
        error.message || 'Internal server error',
        id
    );
}

// ============================================================================
// Stdio Transport (Basic Implementation)
// ============================================================================

/**
 * Parse newline-delimited JSON from stdin
 * Note: This is a basic implementation. Production version would include buffering.
 */
export function parseStdioMessage(rawMessage: string): MCPRequest {
    try {
        const parsed = JSON.parse(rawMessage);
        return validateRequest(parsed);
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new MCPProtocolError(
                MCPErrorCode.PARSE_ERROR,
                'Invalid JSON in request'
            );
        }
        throw error;
    }
}

/**
 * Format response for stdio output (newline-delimited JSON)
 */
export function formatStdioResponse(response: MCPResponse): string {
    return JSON.stringify(response) + '\n';
}


