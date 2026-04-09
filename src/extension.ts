import * as vscode from 'vscode';
import { SnapshotTreeProvider, SnapshotItem } from './snapshotTreeProvider';
import { ExtensionProvider, ExtensionItem } from './extensionProvider';
import { SettingsProvider } from './settingsProvider';
import { generateSnapshot } from './generateSnapshot';

export async function activate(context: vscode.ExtensionContext) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder open. Open a folder to use RepoSnapshot.');
        return;
    }

    console.log('RepoSnapshot: Activating with root', workspaceRoot);

    const provider = new SnapshotTreeProvider(workspaceRoot);
    await provider.initialize();
    const extProvider = new ExtensionProvider(workspaceRoot, provider);

    const filesView = vscode.window.createTreeView('repoSnapshot.files', {
        treeDataProvider: provider,
        showCollapseAll: true,
        manageCheckboxStateManually: true
    });

    const extensionsView = vscode.window.createTreeView('repoSnapshot.extensions', {
        treeDataProvider: extProvider,
        showCollapseAll: true,
        manageCheckboxStateManually: true
    });

    context.subscriptions.push(filesView);
    context.subscriptions.push(extensionsView);

    filesView.onDidChangeCheckboxState(async (e) => {
        for (const [item, state] of e.items) {
            const checked = state === vscode.TreeItemCheckboxState.Checked;
            await provider.updateSelection(item as SnapshotItem, checked);
        }
    });

    extensionsView.onDidChangeCheckboxState((e) => {
        for (const [item, state] of e.items) {
            const checked = state === vscode.TreeItemCheckboxState.Checked;
            extProvider.updateSelection(item as ExtensionItem, checked);
        }
    });

    const settingsProvider = new SettingsProvider(context.extensionUri, provider);
    vscode.window.registerWebviewViewProvider('repoSnapshot.settings', settingsProvider);

    context.subscriptions.push(vscode.commands.registerCommand('repoSnapshot.refresh', async () => {
        console.log('RepoSnapshot: Refresh');
        provider.refresh(undefined);
        await extProvider.refresh();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('repoSnapshot.openSettings', () => {
        vscode.commands.executeCommand('workbench.action.focusSideBar');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('repoSnapshot.generate', async () => {
        const selectedFiles = await provider.getSelectedFiles();
        const config = provider.config;
        const snapshot = generateSnapshot(selectedFiles, workspaceRoot, config);
        
        const action = await vscode.window.showInformationMessage(
            'RepoSnapshot generated!',
            'Copy to Clipboard',
            'Open in Editor',
            'Save to File'
        );

        if (action === 'Copy to Clipboard') {
            await vscode.env.clipboard.writeText(snapshot);
            vscode.window.showInformationMessage('Copied to clipboard!');
        } else if (action === 'Open in Editor') {
            const document = await vscode.workspace.openTextDocument({ content: snapshot, language: 'markdown' });
            await vscode.window.showTextDocument(document);
        } else if (action === 'Save to File') {
            const path = require('path');
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(path.join(workspaceRoot, 'repo-snapshot.md')),
                filters: { 'Markdown': ['md'], 'Text': ['txt'], 'All Files': ['*'] }
            });
            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(snapshot, 'utf8'));
                vscode.window.showInformationMessage(`Saved to ${uri.fsPath}`);
            }
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('repoSnapshot.toggleAutoAdd', () => {
        provider.toggleAutoAdd(!provider.config.autoAddNewFiles);
    }));

    console.log('RepoSnapshot: Activated successfully');
}

export function deactivate() {}