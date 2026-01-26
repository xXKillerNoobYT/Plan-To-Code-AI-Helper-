/**
 * PRD Generation Prompt Tests
 */

import { PRDGenerationPrompt } from '../prdGenerationPrompt';

describe('PRDGenerationPrompt', () => {
    describe('getSystemPrompt', () => {
        it('should return a system prompt', () => {
            const prompt = PRDGenerationPrompt.getSystemPrompt();
            expect(prompt).toBeDefined();
            expect(prompt.length).toBeGreaterThan(100);
        });

        it('should include key instructions', () => {
            const prompt = PRDGenerationPrompt.getSystemPrompt();
            expect(prompt).toContain('technical documentation');
            expect(prompt).toContain('Product Requirements');
        });

        it('should mention temperature 0.3', () => {
            const prompt = PRDGenerationPrompt.getSystemPrompt();
            expect(prompt).toContain('0.3');
        });
    });

    describe('getUserPrompt', () => {
        it('should create a user prompt with bundled content', () => {
            const bundledContent = 'Sample planning document content';
            const prompt = PRDGenerationPrompt.getUserPrompt(bundledContent);

            expect(prompt).toBeDefined();
            expect(prompt).toContain(bundledContent);
            expect(prompt).toContain('synthesize');
        });

        it('should include required output sections', () => {
            const bundledContent = 'Sample content';
            const prompt = PRDGenerationPrompt.getUserPrompt(bundledContent);

            expect(prompt).toContain('Overview');
            expect(prompt).toContain('Features');
            expect(prompt).toContain('Architecture');
            expect(prompt).toContain('Testing');
        });

        it('should handle empty bundled content', () => {
            const prompt = PRDGenerationPrompt.getUserPrompt('');

            expect(prompt).toBeDefined();
            expect(prompt.length).toBeGreaterThan(100);
        });
    });

    describe('validatePRDOutput', () => {
        it('should validate successful PRD', () => {
            const prdContent = `
## Overview
This is the project overview.

## Features
List of features here.

## Architecture
Architecture documentation.

## Testing
Our testing strategy.

## Deployment
Deployment plan.

## Priorities
Priority levels.
`;

            const validation = PRDGenerationPrompt.validatePRDOutput(prdContent);

            expect(validation.isValid).toBe(true);
            expect(validation.missingSection).toBeUndefined();
        });

        it('should detect missing sections', () => {
            const prdContent = `
## Overview
This is the project overview.

## Features
List of features here.
`;

            const validation = PRDGenerationPrompt.validatePRDOutput(prdContent);

            expect(validation.isValid).toBe(false);
            expect(validation.missingSection).toBeDefined();
            expect(validation.missingSection).toContain('Architecture');
        });

        it('should warn on short content', () => {
            const prdContent = `
## Overview
Short content.

## Features
More content.
`;

            const validation = PRDGenerationPrompt.validatePRDOutput(prdContent);

            expect(validation.warnings).toBeDefined();
        });

        it('should detect refusal patterns', () => {
            const prdContent = `
## Overview
I cannot synthesize this content.

## Features
Unable to proceed.
`;

            const validation = PRDGenerationPrompt.validatePRDOutput(prdContent);

            expect(validation.warnings).toBeDefined();
            expect(validation.warnings?.some(w => w.includes('refusal'))).toBe(true);
        });
    });

    describe('getRetryPrompt', () => {
        it('should create a retry prompt with error context', () => {
            const previousAttempt = 'Incomplete PRD';
            const error = 'Missing Features section';
            const prompt = PRDGenerationPrompt.getRetryPrompt(previousAttempt, error);

            expect(prompt).toContain(previousAttempt);
            expect(prompt).toContain(error);
            expect(prompt).toContain('regenerate');
        });

        it('should reference previous attempt', () => {
            const previousAttempt = 'Some content that failed';
            const error = 'Some error';
            const prompt = PRDGenerationPrompt.getRetryPrompt(previousAttempt, error);

            expect(prompt).toContain('previous');
        });
    });
});
