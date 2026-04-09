import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SnapshotTreeProvider } from '../snapshotTreeProvider';  // Фикс: добавьте импорт!
import { generateSnapshot } from '../generateSnapshot';
import type { SnapshotItem } from '../snapshotTreeProvider';  // Для типизации mockItem

suite('RepoSnapshot Extension Test Suite', () => {
    const testWorkspaceRoot = path.join(__dirname, 'testWorkspace');

    suiteSetup(async () => {
        if (!fs.existsSync(testWorkspaceRoot)) {
            fs.mkdirSync(testWorkspaceRoot, { recursive: true });
            fs.writeFileSync(path.join(testWorkspaceRoot, '.gitignore'), 'node_modules\n*.log');
            fs.writeFileSync(path.join(testWorkspaceRoot, 'file1.ts'), 'content');
            fs.mkdirSync(path.join(testWorkspaceRoot, 'folder'), { recursive: true });
            fs.writeFileSync(path.join(testWorkspaceRoot, 'folder', 'file2.js'), 'content');
            fs.mkdirSync(path.join(testWorkspaceRoot, 'node_modules'), { recursive: true });
            fs.writeFileSync(path.join(testWorkspaceRoot, 'node_modules', 'ignored.js'), 'ignored');
        }
    });

    test('SnapshotTreeProvider: Load config and check defaults', async () => {
        const provider = new SnapshotTreeProvider(testWorkspaceRoot);
        await provider.initialize();
        assert.strictEqual(provider.config.autoAddNewFiles, true);
        assert.deepStrictEqual(provider.config.partialFolders[''], { excluded: ['.vscode'] });
    });

    test('SnapshotTreeProvider: isIgnored respects .gitignore', async () => {
        const provider = new SnapshotTreeProvider(testWorkspaceRoot);
        await provider.initialize();
        assert.strictEqual(provider.isIgnored('node_modules/ignored.js'), true);  // Теперь public
        assert.strictEqual(provider.isIgnored('file1.ts'), false);
    });

    test('SnapshotTreeProvider: getSelectedFiles filters correctly', async () => {
        const provider = new SnapshotTreeProvider(testWorkspaceRoot);
        await provider.initialize();
        provider.config.selectedExtensions = ['.ts', '.js'];
        const files = await provider.getSelectedFiles();
        assert.strictEqual(files.length, 2); // file1.ts и folder/file2.js
        assert.ok(files.some((f: string) => f.endsWith('file1.ts')));
        assert.ok(!files.some((f: string) => f.endsWith('ignored.js')));
    });

    test('SnapshotTreeProvider: updateSelection for file', async () => {
        const provider = new SnapshotTreeProvider(testWorkspaceRoot);
        await provider.initialize();
        // Mock item (упрощённо, с типом)
        const mockItem: Partial<SnapshotItem> = {
            label: 'file1.ts',
            relPath: 'file1.ts',
            resourceUri: vscode.Uri.file(path.join(testWorkspaceRoot, 'file1.ts'))
        };
        await provider.updateSelection(mockItem as SnapshotItem, false); // Uncheck
        assert.ok(provider.config.partialFolders[''].excluded.includes('file1.ts'));
        await provider.updateSelection(mockItem as SnapshotItem, true); // Check back
        assert.strictEqual(provider.config.partialFolders[''].excluded.includes('file1.ts'), false);
    });

    test('generateSnapshot: Basic output structure', () => {
        const files = [path.join(testWorkspaceRoot, 'file1.ts')];
        const config = { includeMetadata: true, maxSnapshotLength: 100000 };
        const snapshot = generateSnapshot(files, testWorkspaceRoot, config);
        assert.ok(snapshot.includes('=== RepoSnapshot utility ==='));
        assert.ok(snapshot.includes('Directory Structure'));
        assert.ok(snapshot.includes('Files:'));
        assert.ok(snapshot.includes('file1.ts'));
        assert.ok(snapshot.includes('content'));
    });

    test('generateSnapshot: Truncation for large output', () => {
        const largeContent = 'a'.repeat(100001);
        const largeFile = path.join(testWorkspaceRoot, 'large.txt');
        fs.writeFileSync(largeFile, largeContent);
        const config = { includeMetadata: false, maxSnapshotLength: 100000 };
        const snapshot = generateSnapshot([largeFile], testWorkspaceRoot, config);
        assert.ok(snapshot.includes('[Truncated]'));
        assert.ok(snapshot.length <= config.maxSnapshotLength + 20);  // Примерно
    });
});