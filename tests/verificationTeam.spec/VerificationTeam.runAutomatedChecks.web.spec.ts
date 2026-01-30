import { VerificationTeam } from '../../src/agents/verificationTeam';

jest.mock('../../src/agents/verificationTeam');

/** @aiContributed-2026-01-29 */
describe('VerificationTeam - runAutomatedChecks', () => {
  let verificationTeam: any;

  beforeEach(() => {
    jest.clearAllMocks();
    verificationTeam = {
      runAutomatedChecks: jest.fn().mockResolvedValue(true),
    };
  });

  /** @aiContributed-2026-01-29 */
  it('should run all checks and return true if all pass', async () => {
    const taskId = 'test-task-id';
    verificationTeam.runAutomatedChecks.mockResolvedValueOnce(true);

    const result = await verificationTeam.runAutomatedChecks(taskId);

    expect(verificationTeam.runAutomatedChecks).toHaveBeenCalledWith(taskId);
    expect(result).toBe(true);
  });

  /** @aiContributed-2026-01-29 */
  it('should return false if any check fails', async () => {
    const taskId = 'test-task-id';
    verificationTeam.runAutomatedChecks.mockResolvedValueOnce(false);

    const result = await verificationTeam.runAutomatedChecks(taskId);

    expect(verificationTeam.runAutomatedChecks).toHaveBeenCalledWith(taskId);
    expect(result).toBe(false);
  });

  /** @aiContributed-2026-01-29 */
  it('should handle errors gracefully', async () => {
    const taskId = 'test-task-id';
    const error = new Error('Check failed');
    verificationTeam.runAutomatedChecks.mockRejectedValueOnce(error);

    await expect(verificationTeam.runAutomatedChecks(taskId)).rejects.toThrow('Check failed');
    expect(verificationTeam.runAutomatedChecks).toHaveBeenCalledWith(taskId);
  });
});