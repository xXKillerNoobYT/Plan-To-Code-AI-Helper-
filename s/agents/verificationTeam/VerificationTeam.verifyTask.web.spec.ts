import { VerificationTeam } from '../../../src/agents/verificationTeam';

/** @aiContributed-2026-01-26 */
describe('VerificationTeam', () => {
  let verificationTeam: VerificationTeam;

  beforeEach(() => {
    verificationTeam = new VerificationTeam();
  });

  /** @aiContributed-2026-01-26 */
    it('should return passed as false and an empty issues array when verifyTask is called', async () => {
    const taskId = 'test-task-id';

    const result = await verificationTeam.verifyTask(taskId);

    expect(result).toEqual({
      passed: false,
      issues: [],
    });
  });

  /** @aiContributed-2026-01-26 */
    it('should log the correct message when verifyTask is called', async () => {
    const taskId = 'test-task-id';
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    await verificationTeam.verifyTask(taskId);

    expect(consoleLogSpy).toHaveBeenCalledWith(`Verification Team: Verifying task ${taskId}`);
    consoleLogSpy.mockRestore();
  });

  /** @aiContributed-2026-01-26 */
    it('should call runAutomatedChecks and include issues if checks fail', async () => {
    const taskId = 'test-task-id';
    const runAutomatedChecksSpy = jest
      .spyOn(verificationTeam, 'runAutomatedChecks')
      .mockResolvedValue(false);

    jest.spyOn(verificationTeam, 'verifyTask').mockImplementation(async (id: string) => {
      await verificationTeam.runAutomatedChecks(id);
      return { passed: false, issues: ['Automated checks failed'] };
    });

    const result = await verificationTeam.verifyTask(taskId);

    expect(runAutomatedChecksSpy).toHaveBeenCalledWith(taskId);
    expect(result.passed).toBe(false);
    expect(result.issues).toContain('Automated checks failed');
    runAutomatedChecksSpy.mockRestore();
  });

  /** @aiContributed-2026-01-26 */
    it('should include visual checklist issues if generateVisualChecklist returns items', async () => {
    const taskId = 'test-task-id';
    const visualChecklist = ['Missing documentation', 'UI inconsistency'];
    const generateVisualChecklistSpy = jest
      .spyOn(verificationTeam, 'generateVisualChecklist')
      .mockReturnValue(visualChecklist);

    jest.spyOn(verificationTeam, 'verifyTask').mockImplementation(async (id: string) => {
      const issues = verificationTeam.generateVisualChecklist(id);
      return { passed: false, issues };
    });

    const result = await verificationTeam.verifyTask(taskId);

    expect(generateVisualChecklistSpy).toHaveBeenCalledWith(taskId);
    expect(result.issues).toEqual(expect.arrayContaining(visualChecklist));
    generateVisualChecklistSpy.mockRestore();
  });
});