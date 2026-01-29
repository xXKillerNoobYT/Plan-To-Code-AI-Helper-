// ./skippedTestsProvider.web.spec.ts
import { SkippedTestsDiagnosticProvider } from '../../src/diagnostics/skippedTestsProvider';
import * as fs from 'fs';
import * as vscode from 'vscode';

jest.mock('fs');
jest.mock('vscode');

/** @aiContributed-2026-01-28 */
describe('SkippedTestsDiagnosticProvider', () => {
  let provider: SkippedTestsDiagnosticProvider;
  let mockDiagnosticCollection: vscode.DiagnosticCollection;

  beforeEach(() => {
    mockDiagnosticCollection = {
      set: jest.fn(),
    } as unknown as vscode.DiagnosticCollection;

    jest.spyOn(vscode.languages, 'createDiagnosticCollection').mockReturnValue(mockDiagnosticCollection);
    provider = new SkippedTestsDiagnosticProvider();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** @aiContributed-2026-01-28 */
  describe('updateFileSync', () => {
    /** @aiContributed-2026-01-28 */
    it('should read file content, scan for skipped tests, and set diagnostics', () => {
      const mockUri = { fsPath: '/path/to/file' } as vscode.Uri;
      const mockContent = 'test content';
      const mockDiagnostics = [{ message: 'Skipped test' }] as vscode.Diagnostic[];

      jest.spyOn(fs, 'readFileSync').mockReturnValue(mockContent);
      jest
        .spyOn(provider as unknown as { scanForSkippedTests: (content: string, uri: vscode.Uri) => vscode.Diagnostic[] }, 'scanForSkippedTests')
        .mockReturnValue(mockDiagnostics);

      (provider as unknown as { updateFileSync: (uri: vscode.Uri) => void }).updateFileSync(mockUri);

      expect(fs.readFileSync).toHaveBeenCalledWith(mockUri.fsPath, 'utf-8');
      expect(
        (provider as unknown as { scanForSkippedTests: (content: string, uri: vscode.Uri) => vscode.Diagnostic[] }).scanForSkippedTests
      ).toHaveBeenCalledWith(mockContent, mockUri);
      expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(mockUri, mockDiagnostics);
    });

    /** @aiContributed-2026-01-28 */
    it('should handle errors gracefully when file reading fails', () => {
      const mockUri = { fsPath: '/path/to/file' } as vscode.Uri;

      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('File read error');
      });

      (provider as unknown as { updateFileSync: (uri: vscode.Uri) => void }).updateFileSync(mockUri);

      expect(fs.readFileSync).toHaveBeenCalledWith(mockUri.fsPath, 'utf-8');
      expect(mockDiagnosticCollection.set).not.toHaveBeenCalled();
    });
  });
});