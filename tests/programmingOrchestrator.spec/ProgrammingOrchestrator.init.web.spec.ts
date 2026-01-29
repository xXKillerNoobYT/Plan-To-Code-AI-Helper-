// ./programmingOrchestrator.web.spec.ts
import { ProgrammingOrchestrator, TaskStatus, TaskPriority } from '../../src/orchestrator/programmingOrchestrator';
import { ILogger } from '../../src/orchestrator/logger'; // Assuming ILogger is defined in logger.ts

/** @aiContributed-2026-01-28 */
describe('ProgrammingOrchestrator', () => {
    let orchestrator: ProgrammingOrchestrator;
    let mockLogger: ILogger;

    beforeEach(() => {
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        orchestrator = new ProgrammingOrchestrator(undefined, mockLogger);
    });

    /** @aiContributed-2026-01-28 */
    it('should initialize successfully with valid configuration', async () => {
        orchestrator['maxConcurrentSessions'] = 2;

        await expect(orchestrator.init()).resolves.not.toThrow();

        expect(mockLogger.info).toHaveBeenCalledWith('Programming Orchestrator: Initializing...');
        expect(mockLogger.info).toHaveBeenCalledWith('✅ Programming Orchestrator: Ready (one-thing-at-a-time enforced)');
        expect(orchestrator['taskQueue']).toEqual([]);
        expect(orchestrator['currentTask']).toBeNull();
        expect(orchestrator['activeSessions'].size).toBe(0);
        expect(orchestrator['isInitialized']).toBe(true);
    });

    /** @aiContributed-2026-01-28 */
    it('should throw an error if maxConcurrentSessions is less than 1', async () => {
        orchestrator['maxConcurrentSessions'] = 0;

        await expect(orchestrator.init()).rejects.toThrow('maxConcurrentSessions must be >= 1');

        expect(mockLogger.info).toHaveBeenCalledWith('Programming Orchestrator: Initializing...');
        expect(mockLogger.error).toHaveBeenCalledWith('❌ Failed to initialize Orchestrator:', expect.any(Error));
    });
});