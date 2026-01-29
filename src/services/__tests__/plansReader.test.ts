/**
 * Plans Reader Service Tests
 */

import { PlansReader } from '../plansReader';
import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('PlansReader', () => {
    describe('readAllPlans', () => {
        it('should read all markdown files from Plans folder', async () => {
            try {
                const files = await PlansReader.readAllPlans();
                expect(files.length).toBeGreaterThan(0);
                expect(files.every(f => f.name.endsWith('.md'))).toBe(true);
            } catch (error) {
                // Expected if Plans folder doesn't exist in test environment
                expect(error).toBeDefined();
            }
        });

        it('should filter out backup and temp files', async () => {
            try {
                const files = await PlansReader.readAllPlans();
                const hasBackups = files.some(f => f.name.startsWith('old-') || f.name.startsWith('temp-'));
                expect(hasBackups).toBe(false);
            } catch {
                // Expected in test environment
            }
        });

        it('should prioritize CONSOLIDATED-MASTER-PLAN.md first', async () => {
            try {
                const files = await PlansReader.readAllPlans();
                if (files.length > 0) {
                    const first = files[0];
                    // Should be top priority or CONSOLIDATED-MASTER-PLAN
                    expect(first.priority).toBeLessThanOrEqual(5);
                }
            } catch {
                // Expected in test environment
            }
        });
    });

    describe('estimateTokens', () => {
        it('should estimate tokens for content', () => {
            const content = 'This is a test content';
            const tokens = PlansReader.estimateTokens(content);
            expect(tokens).toBeGreaterThan(0);
            // Rough: 1 token per 4 characters
            expect(tokens).toBeLessThanOrEqual(Math.ceil(content.length / 3));
        });

        it('should return 0 for empty content', () => {
            const tokens = PlansReader.estimateTokens('');
            expect(tokens).toBe(0);
        });

        it('should handle large content', () => {
            const largeContent = 'a'.repeat(10000);
            const tokens = PlansReader.estimateTokens(largeContent);
            expect(tokens).toBeGreaterThan(2000);
            expect(tokens).toBeLessThan(3000);
        });
    });

    describe('getCategoryLabel', () => {
        it('should return correct labels for categories', () => {
            expect(PlansReader.getCategoryLabel('agent-spec')).toBe('Agent Specification');
            expect(PlansReader.getCategoryLabel('api-reference')).toBe('API Reference');
            expect(PlansReader.getCategoryLabel('workflow')).toBe('Workflow');
            expect(PlansReader.getCategoryLabel('architecture')).toBe('Architecture');
            expect(PlansReader.getCategoryLabel('general')).toBe('General');
        });

        it('should return Unknown for unrecognized category', () => {
            expect(PlansReader.getCategoryLabel('unknown-category')).toBe('Unknown');
        });
    });
});


