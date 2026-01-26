/**
 * Context Bundler Service
 * 
 * Bundles plan files into a context string respecting token limits.
 * Prioritizes key files and truncates if needed.
 * 
 * @module contextBundler
 */

import { PlansReader, PlanFile } from './plansReader';

/**
 * 📊 Bundling Result
 */
export interface BundleResult {
    prompt: string;                          // Bundled context string
    includedFiles: string[];                 // File names that were included
    truncatedFiles: string[];                // File names that were truncated
    excludedFiles: string[];                 // File names that were excluded (overflow)
    totalTokens: number;                     // Total tokens in bundled content
    warning?: string;                        // Warning message if truncation occurred
}

/**
 * 🔗 Context Bundler Service
 * Bundles plan files with token-aware truncation
 */
export class ContextBundler {
    /**
     * 📦 Bundle plan files with token limit
     * 
     * Priority order:
     * 1. CONSOLIDATED-MASTER-PLAN.md (full)
     * 2. Agent specs and API references
     * 3. Other files in priority order
     * 4. Truncate last file if needed to fit limit
     * 
     * @param planFiles - Array of plan files to bundle
     * @param tokenLimit - Maximum tokens allowed (default 4000)
     * @returns Bundling result with warnings
     */
    static bundle(planFiles: PlanFile[], tokenLimit: number = 4000): BundleResult {
        const headerTokens = PlansReader.estimateTokens(
            'You are a technical documentation synthesizer. Your task is to create a comprehensive Product Requirements Document (PRD) from the following planning documents.\n'
        );

        const footerTokens = PlansReader.estimateTokens(
            '\nPlease generate a structured PRD with clear sections. Ensure all features are captured.'
        );

        const budgetedTokens = tokenLimit - headerTokens - footerTokens;
        const includedFiles: string[] = [];
        const truncatedFiles: string[] = [];
        const excludedFiles: string[] = [];
        let currentTokens = 0;
        let bundleContent = '';

        for (const file of planFiles) {
            const filePrefix = `\n<!-- File: ${file.relativeDir}/${file.name} (${file.size} bytes) -->\n`;
            const fileSeparator = '\n---\n';
            const fileTokens = PlansReader.estimateTokens(filePrefix + file.content + fileSeparator);

            // Check if we can fit this file (or at least partial)
            if (currentTokens + fileTokens <= budgetedTokens) {
                // Full file fits
                bundleContent += filePrefix + file.content + fileSeparator;
                currentTokens += fileTokens;
                includedFiles.push(`${file.relativeDir}/${file.name}`);
            } else if (currentTokens < budgetedTokens * 0.9) {
                // We have some room - try to fit partial file
                const remainingTokens = budgetedTokens - currentTokens - 100; // Reserve 100 tokens for separator
                const maxContentTokens = remainingTokens * 4; // Convert back to approximate characters

                if (maxContentTokens > 200) {
                    // Truncate this file to fit
                    const truncatedContent = file.content.substring(0, maxContentTokens) + '\n... [truncated for token limit]';
                    bundleContent += filePrefix + truncatedContent + fileSeparator;
                    currentTokens += PlansReader.estimateTokens(filePrefix + truncatedContent + fileSeparator);
                    truncatedFiles.push(`${file.relativeDir}/${file.name}`);
                } else {
                    // Not enough room even for partial - skip
                    excludedFiles.push(`${file.relativeDir}/${file.name}`);
                }
            } else {
                // No room left
                excludedFiles.push(`${file.relativeDir}/${file.name}`);
            }
        }

        // Create warning if files were excluded
        let warning: string | undefined;
        if (truncatedFiles.length > 0 || excludedFiles.length > 0) {
            warning = `Token limit exceeded. ${truncatedFiles.length} files truncated, ${excludedFiles.length} files excluded.`;
        }

        return {
            prompt: bundleContent,
            includedFiles,
            truncatedFiles,
            excludedFiles,
            totalTokens: currentTokens + headerTokens + footerTokens,
            warning,
        };
    }

    /**
     * 📝 Format bundle information for logging
     * 
     * @param result - Bundle result
     * @returns Formatted string for display
     */
    static formatBundleInfo(result: BundleResult): string {
        const lines: string[] = [
            '📦 Context Bundle Summary',
            `   Total tokens: ${result.totalTokens}`,
            `   Included files: ${result.includedFiles.length}`,
            `   Truncated files: ${result.truncatedFiles.length}`,
            `   Excluded files: ${result.excludedFiles.length}`,
        ];

        if (result.truncatedFiles.length > 0) {
            lines.push('   Truncated:');
            result.truncatedFiles.forEach(f => lines.push(`     - ${f}`));
        }

        if (result.excludedFiles.length > 0) {
            lines.push('   Excluded:');
            result.excludedFiles.forEach(f => lines.push(`     - ${f}`));
        }

        if (result.warning) {
            lines.push(`   ⚠️  ${result.warning}`);
        }

        return lines.join('\n');
    }
}
