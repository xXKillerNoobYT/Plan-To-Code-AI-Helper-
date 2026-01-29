// ./verificationTeam.web.spec.ts
import { VerificationTeam } from '../../src/agents/verificationTeam';
import * as unitTestModule from '../../src/agents/unitTestModule';
import * as integrationTestModule from '../../src/agents/integrationTestModule';
import * as linterModule from '../../src/agents/linterModule';
import * as coverageModule from '../../src/agents/coverageModule';

jest.mock('../../src/agents/unitTestModule', () => ({
    ...jest.requireActual('../../src/agents/unitTestModule'),
    runUnitTests: jest.fn(),
}));

jest.mock('../../src/agents/integrationTestModule', () => ({
    ...jest.requireActual('../../src/agents/integrationTestModule'),
    runIntegrationTests: jest.fn(),
}));

jest.mock('../../src/agents/linterModule', () => ({
    ...jest.requireActual('../../src/agents/linterModule'),
    runLinters: jest.fn(),
}));

jest.mock('../../src/agents/coverageModule', () => ({
    ...jest.requireActual('../../src/agents/coverageModule'),
    checkCodeCoverage: jest.fn(),
}));

/** @aiContributed-2026-01-29 */
describe('VerificationTeam - runAutomatedChecks', () => {
  let verificationTeam: VerificationTeam;

  beforeEach(() => {
    verificationTeam = new VerificationTeam();
  });

  /** @aiContributed-2026-01-29 */
    it('should run all checks and return true if all pass', async () => {
    jest.spyOn(unitTestModule, 'runUnitTests').mockResolvedValue(true);
    jest.spyOn(integrationTestModule, 'runIntegrationTests').mockResolvedValue(true);
    jest.spyOn(linterModule, 'runLinters').mockResolvedValue(true);
    jest.spyOn(coverageModule, 'checkCodeCoverage').mockResolvedValue(true);

    const taskId = 'test-task-id';
    const result = await verificationTeam.runAutomatedChecks(taskId);

    expect(unitTestModule.runUnitTests).toHaveBeenCalledWith(taskId);
    expect(integrationTestModule.runIntegrationTests).toHaveBeenCalledWith(taskId);
    expect(linterModule.runLinters).toHaveBeenCalledWith(taskId);
    expect(coverageModule.checkCodeCoverage).toHaveBeenCalledWith(taskId);
    expect(result).toBe(true);
  });

  /** @aiContributed-2026-01-29 */
    it('should return false if any check fails', async () => {
    jest.spyOn(unitTestModule, 'runUnitTests').mockResolvedValue(true);
    jest.spyOn(integrationTestModule, 'runIntegrationTests').mockResolvedValue(false);
    jest.spyOn(linterModule, 'runLinters').mockResolvedValue(true);
    jest.spyOn(coverageModule, 'checkCodeCoverage').mockResolvedValue(true);

    const taskId = 'test-task-id';
    const result = await verificationTeam.runAutomatedChecks(taskId);

    expect(unitTestModule.runUnitTests).toHaveBeenCalledWith(taskId);
    expect(integrationTestModule.runIntegrationTests).toHaveBeenCalledWith(taskId);
    expect(linterModule.runLinters).toHaveBeenCalledWith(taskId);
    expect(coverageModule.checkCodeCoverage).toHaveBeenCalledWith(taskId);
    expect(result).toBe(false);
  });
});