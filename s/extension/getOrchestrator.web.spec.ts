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

/** @aiContributed-2026-01-26 */
describe('getOrchestrator', () => {
    let originalProgrammingOrchestrator: ProgrammingOrchestrator | null;

    beforeAll(() => {
        originalProgrammingOrchestrator = (global as { programmingOrchestrator?: ProgrammingOrchestrator | null }).programmingOrchestrator || null;
    });

    afterAll(() => {
        (global as { programmingOrchestrator?: ProgrammingOrchestrator | null }).programmingOrchestrator = originalProgrammingOrchestrator;
    });

    /** @aiContributed-2026-01-26 */
    it('should return null if the orchestrator is not initialized', () => {
        (global as { programmingOrchestrator?: ProgrammingOrchestrator | null }).programmingOrchestrator = null;
        const orchestrator = getOrchestrator();
        expect(orchestrator).toBeNull();
    });

    /* it('should return the initialized orchestrator instance', () => {
            const mockOrchestrator = new ProgrammingOrchestrator();
            (global as { programmingOrchestrator?: ProgrammingOrchestrator | null }).programmingOrchestrator = mockOrchestrator;

            const orchestrator = getOrchestrator();
            expect(orchestrator).toEqual(mockOrchestrator);
        }); */
});