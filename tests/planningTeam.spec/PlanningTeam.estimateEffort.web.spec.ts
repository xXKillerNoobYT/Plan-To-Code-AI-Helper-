// ./planningTeam.web.spec.ts
import { PlanningTeam } from '../../src/agents/planningTeam';

/** @aiContributed-2026-01-29 */
describe('PlanningTeam - estimateEffort', () => {
    let planningTeam: PlanningTeam;

    beforeEach(() => {
        planningTeam = new PlanningTeam();
    });

    /** @aiContributed-2026-01-29 */
    it('should return an estimate with hours and confidence as numbers', () => {
        const taskDescription = 'Implement user authentication';
        const result = planningTeam.estimateEffort(taskDescription);

        expect(result).toHaveProperty('hours');
        expect(result).toHaveProperty('confidence');
        expect(typeof result.hours).toBe('number');
        expect(typeof result.confidence).toBe('number');
    });

    /** @aiContributed-2026-01-29 */
    it('should return default values for an empty task description', () => {
        const taskDescription = '';
        const result = planningTeam.estimateEffort(taskDescription);

        expect(result).toEqual({ hours: 0, confidence: 0 });
    });

    /** @aiContributed-2026-01-29 */
    it('should handle a complex task description and return a valid estimate', () => {
        const taskDescription = 'Design and implement a scalable microservices architecture';
        const result = planningTeam.estimateEffort(taskDescription);

        expect(result).toHaveProperty('hours');
        expect(result).toHaveProperty('confidence');
        expect(typeof result.hours).toBe('number');
        expect(typeof result.confidence).toBe('number');
        expect(result.hours).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
    });
});