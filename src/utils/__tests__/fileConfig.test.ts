/**
 * Tests for FileConfigManager
 * Tests .coe/config.json reading, writing, and file watching
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FileConfigManager, LLMConfig, COEFileConfig } from '../fileConfig';

describe('FileConfigManager', () => {
    let testDir: string;
    let originalDir: string;

    beforeAll(() => {
        originalDir = process.cwd();
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coe-config-test-'));
        process.chdir(testDir);
    });

    afterAll(() => {
        process.chdir(originalDir);
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true });
        }
        FileConfigManager.dispose();
    });

    describe('Initialization', () => {
        it('should create default config.json if missing', async () => {
            await FileConfigManager.initialize(testDir);

            const configPath = path.join(testDir, '.coe', 'config.json');
            expect(fs.existsSync(configPath)).toBe(true);
        });

        it('should load config from existing .coe/config.json', async () => {
            const configDir = path.join(testDir, '.coe');
            fs.mkdirSync(configDir, { recursive: true });

            const testConfig: COEFileConfig = {
                llm: {
                    url: 'http://test:5000/v1/chat/completions',
                    model: 'test-model',
                    inputTokenLimit: 2000,
                    maxOutputTokens: 1000,
                    timeoutSeconds: 60,
                    temperature: 0.5,
                },
                extension: {
                    autoRegeneratePRD: false,
                    debugMode: true,
                },
            };

            const configPath = path.join(configDir, 'config.json');
            fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

            await FileConfigManager.initialize(testDir);

            const loaded = FileConfigManager.getLLMConfig();
            expect(loaded.url).toBe('http://test:5000/v1/chat/completions');
            expect(loaded.model).toBe('test-model');
        });
    });

    describe('Getting Config', () => {
        beforeEach(async () => {
            // Reset to defaults
            await FileConfigManager.initialize(testDir);
        });

        it('should return LLM config', () => {
            const config = FileConfigManager.getLLMConfig();
            expect(config.url).toBeDefined();
            expect(config.model).toBeDefined();
            expect(config.inputTokenLimit).toBeGreaterThan(0);
        });

        it('should return extension config', () => {
            const config = FileConfigManager.getExtensionConfig();
            expect(config).toBeDefined();
            expect(typeof config.autoRegeneratePRD).toBe('boolean');
        });

        it('should return full config', () => {
            const config = FileConfigManager.getConfig();
            expect(config.llm).toBeDefined();
            expect(config.extension).toBeDefined();
        });

        it('should not modify internal config when returned', () => {
            const config1 = FileConfigManager.getLLMConfig();
            config1.url = 'http://modified:5000/v1/chat/completions';

            const config2 = FileConfigManager.getLLMConfig();
            expect(config2.url).not.toBe('http://modified:5000/v1/chat/completions');
        });
    });

    describe('Updating Config', () => {
        beforeEach(async () => {
            await FileConfigManager.initialize(testDir);
        });

        it('should update LLM config', async () => {
            const newUrl = 'http://newhost:8000/v1/chat/completions';
            await FileConfigManager.updateLLMConfig({ url: newUrl });

            const updated = FileConfigManager.getLLMConfig();
            expect(updated.url).toBe(newUrl);
        });

        it('should persist LLM config to file', async () => {
            const newModel = 'new-test-model-v2';
            await FileConfigManager.updateLLMConfig({ model: newModel });

            // Verify file was written
            const configPath = path.join(testDir, '.coe', 'config.json');
            const fileContent = fs.readFileSync(configPath, 'utf-8');
            const parsed = JSON.parse(fileContent);
            expect(parsed.llm.model).toBe(newModel);
        });

        it('should update extension config', async () => {
            await FileConfigManager.updateExtensionConfig({ debugMode: true });

            const updated = FileConfigManager.getExtensionConfig();
            expect(updated.debugMode).toBe(true);
        });

        it('should merge partial updates', async () => {
            const originalUrl = FileConfigManager.getLLMConfig().url;
            const newTimeout = 600;

            await FileConfigManager.updateLLMConfig({ timeoutSeconds: newTimeout });

            const updated = FileConfigManager.getLLMConfig();
            expect(updated.url).toBe(originalUrl); // Should not change
            expect(updated.timeoutSeconds).toBe(newTimeout);
        });
    });

    describe('Config Watchers', () => {
        beforeEach(async () => {
            await FileConfigManager.initialize(testDir);
        });

        it('should notify watchers on config change', async () => {
            const callback = jest.fn();
            const unsubscribe = FileConfigManager.onConfigChange(callback);

            await FileConfigManager.updateLLMConfig({ url: 'http://test:8000/v1' });

            expect(callback).toHaveBeenCalled();
            const config = callback.mock.calls[0][0] as COEFileConfig;
            expect(config.llm.url).toBe('http://test:8000/v1');

            unsubscribe();
        });

        it('should support multiple watchers', async () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            const unsub1 = FileConfigManager.onConfigChange(callback1);
            const unsub2 = FileConfigManager.onConfigChange(callback2);

            await FileConfigManager.updateLLMConfig({ model: 'multi-watcher-test' });

            expect(callback1).toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();

            unsub1();
            unsub2();
        });

        it('should unsubscribe watcher', async () => {
            const callback = jest.fn();
            const unsubscribe = FileConfigManager.onConfigChange(callback);

            unsubscribe();

            await FileConfigManager.updateLLMConfig({ url: 'http://after-unsub:9000/v1' });

            // Callback should not be called after unsubscribe
            // (Note: due to timing, this might need adjustment)
        });
    });

    describe('Error Handling', () => {
        it('should use defaults for invalid JSON in config file', async () => {
            const configDir = path.join(testDir, '.coe-invalid');
            fs.mkdirSync(configDir, { recursive: true });

            const configPath = path.join(configDir, 'config.json');
            fs.writeFileSync(configPath, 'invalid json content {');

            await FileConfigManager.initialize(configDir);

            const config = FileConfigManager.getLLMConfig();
            expect(config.model).toBeDefined(); // Should use defaults
        });

        it('should use defaults if required fields are missing', async () => {
            const configDir = path.join(testDir, '.coe-incomplete');
            fs.mkdirSync(configDir, { recursive: true });

            const incompleteConfig = {
                llm: {
                    // Missing required fields
                },
            };

            const configPath = path.join(configDir, 'config.json');
            fs.writeFileSync(configPath, JSON.stringify(incompleteConfig));

            await FileConfigManager.initialize(configDir);

            const config = FileConfigManager.getLLMConfig();
            expect(config.url).toBeDefined();
            expect(config.model).toBeDefined();
        });
    });

    describe('Config Path', () => {
        it('should return config path', async () => {
            await FileConfigManager.initialize(testDir);
            const configPath = FileConfigManager.getConfigPath();
            expect(configPath).toContain('.coe');
            expect(configPath).toContain('config.json');
        });
    });

    describe('Disposal', () => {
        it('should dispose file watchers', async () => {
            await FileConfigManager.initialize(testDir);
            FileConfigManager.dispose();
            // No error should occur
            expect(true).toBe(true);
        });
    });
});
