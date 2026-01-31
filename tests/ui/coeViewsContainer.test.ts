import fs from 'fs';
import path from 'path';
import { CompletedTasksTreeProvider } from '../../src/ui/completedTasksTreeProvider';
import { TicketDatabase } from '../../src/db/ticketsDb';

jest.mock('vscode');

describe('COE view container manifest', () => {
    it('registers COE view container and views', () => {
        const manifestPath = path.resolve(__dirname, '..', '..', 'package.json');
        const rawManifest = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(rawManifest) as {
            contributes?: {
                viewsContainers?: { activitybar?: Array<{ id: string }> };
                views?: Record<string, Array<{ id: string }>>;
            };
        };

        const activitybar = manifest.contributes?.viewsContainers?.activitybar ?? [];
        const coeContainer = activitybar.find((container) => container.id === 'coe-views');

        expect(coeContainer).toBeDefined();

        const coeViews = manifest.contributes?.views?.['coe-views'] ?? [];
        const viewIds = coeViews.map((view) => view.id);

        expect(viewIds).toEqual(expect.arrayContaining(['coe-task-queue', 'coe-completed-history']));
        expect(manifest.contributes?.views?.explorer).toBeUndefined();
    });
});

describe('CompletedTasksTreeProvider', () => {
    it('returns placeholder when no completed tasks exist', async () => {
        const ticketDb = TicketDatabase.getInstance();
        const provider = new CompletedTasksTreeProvider(ticketDb);

        jest.spyOn(ticketDb, 'getAllCompleted').mockResolvedValue([]);

        const items = await provider.getChildren();

        expect(items).toHaveLength(1);
        expect(items[0].label).toBe('No completed tasks yet');
    });
});
