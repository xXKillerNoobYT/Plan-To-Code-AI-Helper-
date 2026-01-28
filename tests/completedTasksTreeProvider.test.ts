/**
 * 🧪 Completed Tasks Tree Provider Tests
 * 
 * Tests for CompletedTasksTreeProvider getChildren(), refresh, and error handling.
 */

import { CompletedTasksTreeProvider } from '../src/ui/completedTasksTreeProvider';
import { TicketDatabase } from '../src/db/ticketsDb';

describe('CompletedTasksTreeProvider', () => {
    let ticketDb: TicketDatabase;
    let provider: CompletedTasksTreeProvider;

    beforeEach(() => {
        ticketDb = TicketDatabase.getInstance();
        provider = new CompletedTasksTreeProvider(ticketDb);
    });

    describe('getChildren()', () => {
        it('should return completed tasks from database', async () => {
            // Mock getAllCompleted to return test data
            const mockTasks = [
                {
                    task_id: 'task-1',
                    title: 'Completed Task 1',
                    status: 'completed',
                    priority: 1,
                    completed_at: new Date().toISOString(),
                    created_at: new Date().toISOString()
                },
                {
                    task_id: 'task-2',
                    title: 'Completed Task 2',
                    status: 'completed',
                    priority: 2,
                    completed_at: new Date(Date.now() - 3600000).toISOString(), // 1h ago
                    created_at: new Date().toISOString()
                }
            ];

            jest.spyOn(ticketDb, 'getAllCompleted').mockResolvedValue(mockTasks);

            const items = await provider.getChildren();

            // Should return 2 items from mock data
            expect(items.length).toBe(2);
            expect(items[0].contextValue).toBe('completedTask');
            expect(items[1].contextValue).toBe('completedTask');
            // Check labels contain task titles
            expect(items[0].label?.toString()).toContain('Completed Task 1');
            expect(items[1].label?.toString()).toContain('Completed Task 2');
        });

        it('should show placeholder when history is empty', async () => {
            // Mock empty history
            jest.spyOn(ticketDb, 'getAllCompleted').mockResolvedValue([]);

            const items = await provider.getChildren();

            expect(items.length).toBe(1);
            expect(items[0].contextValue).toBe('placeholder');
            expect(items[0].label).toBe('No completed tasks yet');
        });

        it('should show error placeholder on DB error', async () => {
            // Mock database error
            jest.spyOn(ticketDb, 'getAllCompleted').mockRejectedValue(new Error('DB connection failed'));

            // Spy on console.error to suppress error output in tests
            jest.spyOn(console, 'error').mockImplementation(() => { });

            const items = await provider.getChildren();

            expect(items.length).toBe(1);
            expect(items[0].contextValue).toBe('placeholder');
            expect(items[0].label).toBe('⚠️ Error loading history');
        });

        it('should apply retention filter when configured', async () => {
            const mockTasks = [
                {
                    task_id: 'recent-task',
                    title: 'Recent Task',
                    status: 'completed',
                    priority: 1,
                    completed_at: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), // 50h ago
                    created_at: new Date().toISOString()
                }
            ];

            const spy = jest.spyOn(ticketDb, 'getAllCompleted').mockResolvedValue(mockTasks);

            // Set retention to 168 hours (7 days)
            provider.updateRetention(168);
            await provider.getChildren();

            // Verify filter was applied (convert 168h to days = 7 days)
            expect(spy).toHaveBeenCalledWith({ minDaysAgo: 7 });
        });

        it('should not apply filter when retention is 0 (unlimited)', async () => {
            const mockTasks: any[] = [];
            const spy = jest.spyOn(ticketDb, 'getAllCompleted').mockResolvedValue(mockTasks);

            // Set retention to 0 (unlimited)
            provider.updateRetention(0);
            await provider.getChildren();

            // Verify no minDaysAgo filter
            expect(spy).toHaveBeenCalledWith({});
        });

        it('should format time ago correctly', async () => {
            const now = Date.now();
            const mockTasks = [
                {
                    task_id: 'task-minutes',
                    title: 'Task Minutes Ago',
                    status: 'completed',
                    priority: 1,
                    completed_at: new Date(now - 30 * 60 * 1000).toISOString(), // 30 min ago
                    created_at: new Date().toISOString()
                },
                {
                    task_id: 'task-hours',
                    title: 'Task Hours Ago',
                    status: 'completed',
                    priority: 1,
                    completed_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(), // 5h ago
                    created_at: new Date().toISOString()
                },
                {
                    task_id: 'task-days',
                    title: 'Task Days Ago',
                    status: 'completed',
                    priority: 1,
                    completed_at: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3d ago
                    created_at: new Date().toISOString()
                }
            ];

            jest.spyOn(ticketDb, 'getAllCompleted').mockResolvedValue(mockTasks);

            const items = await provider.getChildren();

            // Verify description is set and contains time ago format
            expect(items[0].description).toBeDefined();
            expect(items[1].description).toBeDefined();
            expect(items[2].description).toBeDefined();
            expect(items[0].description?.toString()).toMatch(/\d+m ago/); // minutes
            expect(items[1].description?.toString()).toMatch(/\d+h ago/); // hours
            expect(items[2].description?.toString()).toMatch(/\d+d ago/); // days
        });
    });

    describe('refresh()', () => {
        it('should trigger tree refresh event', () => {
            const firespy = jest.spyOn(provider['_onDidChangeTreeData'], 'fire');

            provider.refresh();

            expect(firespy).toHaveBeenCalled();
        });

        it('should update tree data when updateRetention() is called', () => {
            const fireSpy = jest.spyOn(provider['_onDidChangeTreeData'], 'fire');

            provider.updateRetention(72); // 3 days

            expect(fireSpy).toHaveBeenCalled();
        });
    });

    describe('getTreeItem()', () => {
        it('should return the same tree item passed in', async () => {
            const mockTasks = [{
                task_id: 'test',
                title: 'Test',
                status: 'completed',
                priority: 1,
                completed_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            }];

            jest.spyOn(ticketDb, 'getAllCompleted').mockResolvedValue(mockTasks);

            const items = await provider.getChildren();
            const treeItem = provider.getTreeItem(items[0]);

            expect(treeItem).toBe(items[0]);
        });
    });
});
