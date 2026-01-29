// ./verificationTeam.web.spec.ts
import { VerificationTeam } from '../src/agents/verificationTeam';

describe('VerificationTeam - generateVisualChecklist', () => {
    let verificationTeam: VerificationTeam;

    beforeEach(() => {
        verificationTeam = new VerificationTeam();
    });

    it('should return the correct checklist items', () => {
        const taskId = '12345';
        const checklist = verificationTeam.generateVisualChecklist(taskId);

        expect(checklist).toEqual([
            'Feature works as expected',
            'No visual regressions',
            'Error handling works',
            'Documentation updated',
        ]);
    });

    it('should generate checklist for different task IDs', () => {
        const taskId = '67890';

        const checklist = verificationTeam.generateVisualChecklist(taskId);

        expect(checklist).toBeDefined();
        expect(checklist.length).toBeGreaterThan(0);
    });
});