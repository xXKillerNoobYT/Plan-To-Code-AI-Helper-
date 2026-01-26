import { getOrchestrator } from '../../src/extension';
import { ProgrammingOrchestrator } from '../../src/orchestrator/programmingOrchestrator';

jest.mock('../../src/orchestrator/programmingOrchestrator', () => {
    return {
        ...jest.requireActual('../../src/orchestrator/programmingOrchestrator'),
        ProgrammingOrchestrator: jest.fn().mockImplementation(() => ({
            init: jest.fn(),
            shutdown: jest.fn(),
        })),
    };
});

/** @aiContributed-2026-01-24 */
describe('getOrchestrator', () => {
    let originalProgrammingOrchestrator: ProgrammingOrchestrator | null;

    beforeAll(() => {
        originalProgrammingOrchestrator = (global as { programmingOrchestrator?: ProgrammingOrchestrator }).programmingOrchestrator || null;
    });

    afterAll(() => {
        (global as { programmingOrchestrator?: ProgrammingOrchestrator }).programmingOrchestrator = originalProgrammingOrchestrator;
    });

    /** @aiContributed-2026-01-24 */
    it('should return null if the orchestrator is not initialized', () => {
        (global as { programmingOrchestrator?: ProgrammingOrchestrator }).programmingOrchestrator = null;
        const orchestrator = getOrchestrator();
        expect(orchestrator).toBeNull();
    });

    /* it('should return the initialized orchestrator instance', async () => {
            const mockOrchestrator = new ProgrammingOrchestrator();
            (mockOrchestrator.init as jest.Mock).mockResolvedValueOnce(undefined);

            await mockOrchestrator.init();
            (global as { programmingOrchestrator?: ProgrammingOrchestrator }).programmingOrchestrator = mockOrchestrator;

            const orchestrator = getOrchestrator();
            expect(orchestrator).toEqual(mockOrchestrator); // Updated to use toEqual for deep comparison
        }); */
});