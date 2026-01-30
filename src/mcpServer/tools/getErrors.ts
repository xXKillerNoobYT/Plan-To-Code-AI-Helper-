/**
 * MCP Tool: getErrors
 * Retrieves quality diagnostics (TypeScript errors, skipped tests, coverage warnings)
 * from .vscode/quality-diagnostics.json.
 *
 * Purpose:
 * - Expose quality gate diagnostics to MCP clients
 * - Provide a single structured response for error retrieval
 * - Handle missing/invalid diagnostics gracefully
 *
 * References:
 * - tests/__tests__/quality-gates.test.ts (diagnostics source)
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { MCPErrorCode, MCPProtocolError } from '../protocol';

// ============================================================================
// Request/Response Schemas (Zod Validation)
// ============================================================================

/**
 * Request schema for getErrors (no parameters)
 */
export const GetErrorsRequestSchema = z.object({}).strict();

export type GetErrorsRequest = z.infer<typeof GetErrorsRequestSchema>;

const TypeScriptErrorSchema = z.object({
    file: z.string(),
    line: z.number(),
    column: z.number(),
    code: z.string(),
    message: z.string(),
});

const SkippedTestSchema = z.object({
    file: z.string(),
    line: z.number(),
    pattern: z.string(),
    match: z.string(),
});

const UnderCoverageFileSchema = z.object({
    file: z.string(),
    coverage: z.number(),
});

const QualityDiagnosticsSchema = z.object({
    typeScriptErrors: z.array(TypeScriptErrorSchema).optional(),
    skippedTests: z.array(SkippedTestSchema).optional(),
    underCoverageFiles: z.array(UnderCoverageFileSchema).optional(),
    timestamp: z.string().optional(),
}).passthrough();

export type TypeScriptError = z.infer<typeof TypeScriptErrorSchema>;
export type SkippedTest = z.infer<typeof SkippedTestSchema>;
export type UnderCoverageFile = z.infer<typeof UnderCoverageFileSchema>;

export interface GetErrorsResponse {
    success: boolean;
    source: 'quality-diagnostics' | 'none' | 'invalid';
    timestamp: string | null;
    typeScriptErrors: TypeScriptError[];
    skippedTests: SkippedTest[];
    underCoverageFiles: UnderCoverageFile[];
}

// ============================================================================
// Tool Implementation
// ============================================================================

/**
 * Get errors from quality diagnostics file.
 */
export async function getErrors(params?: GetErrorsRequest): Promise<GetErrorsResponse> {
    try {
        GetErrorsRequestSchema.parse(params ?? {});
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new MCPProtocolError(
                MCPErrorCode.INVALID_PARAMS,
                `Invalid parameters: ${error.errors.map((e) => e.message).join(', ')}`,
                { zodErrors: error.errors }
            );
        }
        throw error;
    }

    const diagnosticsPath = path.join(process.cwd(), '.vscode', 'quality-diagnostics.json');

    if (!fs.existsSync(diagnosticsPath)) {
        return {
            success: true,
            source: 'none',
            timestamp: null,
            typeScriptErrors: [],
            skippedTests: [],
            underCoverageFiles: [],
        };
    }

    try {
        const rawDiagnostics = fs.readFileSync(diagnosticsPath, 'utf-8');
        const parsed = JSON.parse(rawDiagnostics);
        const validated = QualityDiagnosticsSchema.safeParse(parsed);

        if (!validated.success) {
            return {
                success: true,
                source: 'invalid',
                timestamp: null,
                typeScriptErrors: [],
                skippedTests: [],
                underCoverageFiles: [],
            };
        }

        return {
            success: true,
            source: 'quality-diagnostics',
            timestamp: validated.data.timestamp ?? null,
            typeScriptErrors: validated.data.typeScriptErrors ?? [],
            skippedTests: validated.data.skippedTests ?? [],
            underCoverageFiles: validated.data.underCoverageFiles ?? [],
        };
    } catch (error) {
        return {
            success: true,
            source: 'invalid',
            timestamp: null,
            typeScriptErrors: [],
            skippedTests: [],
            underCoverageFiles: [],
        };
    }
}
