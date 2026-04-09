import * as vscode from 'vscode';
import * as path from 'path';
import { SnapshotTreeProvider } from './snapshotTreeProvider';  // Добавьте этот импорт!

export interface ExtensionItem extends vscode.TreeItem {
    ext: string;
    isSubFile: boolean;
}

export class ExtensionProvider implements vscode.TreeDataProvider<ExtensionItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<ExtensionItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private extensions = new Map<string, string[]>();
    private selected = new Set<string>();
    private workspaceRoot: string;
    private mainProvider: SnapshotTreeProvider;

    constructor(workspaceRoot: string, mainProvider: SnapshotTreeProvider) {
        this.workspaceRoot = workspaceRoot;
        this.mainProvider = mainProvider;
        this.selected = new Set(mainProvider.config.selectedExtensions || []);
    }

    async refresh(): Promise<void> {
        await this.scanExtensions();
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: ExtensionItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ExtensionItem): Promise<ExtensionItem[]> {
        if (!element) {
            if (this.extensions.size === 0) {
                await this.scanExtensions();
            }
            const priorityOrder = ['.c', '.cpp', '.h', '.hpp', '.cs', '.py', '.js', '.ts', '.java', '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.html', '.css', '.xml', '.json', '.yaml', '.yml', '.md', '.sh', '.bat', '.ps1', '.vhd', '.vhdl', '.v', '.sv'];
            const exts = Array.from(this.extensions.keys()).sort((a, b) => {
                const ia = priorityOrder.indexOf(a);
                const ib = priorityOrder.indexOf(b);
                if (ia === -1 && ib === -1) {return a.localeCompare(b);}
                if (ia === -1) {return 1;}
                if (ib === -1) {return -1;}
                return ia - ib;
            });
            return exts.map(ext => {
                const label = ext || '(no extension)';
                const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed) as ExtensionItem;
                item.ext = ext;
                item.isSubFile = false;
                item.checkboxState = this.selected.has(ext) ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
                return item;
            });
        } else if (!element.isSubFile) {
            const files = this.extensions.get(element.ext) || [];
            return files.map(f => {
                const rel = path.relative(this.workspaceRoot, f).replace(/\\/g, '/');
                const item = new vscode.TreeItem(rel, vscode.TreeItemCollapsibleState.None) as ExtensionItem;
                item.ext = '';
                item.isSubFile = true;
                return item;
            });
        }
        return [];
    }

    private async scanExtensions(): Promise<void> {
        this.extensions.clear();
        const files = await this.mainProvider.getSelectedFiles();
        files.forEach((f: string) => {  // Фикс: тип string для f
            const ext = path.extname(f).toLowerCase();
            if (!this.extensions.has(ext)) {this.extensions.set(ext, []);}
            this.extensions.get(ext)!.push(f);
        });
        if (this.selected.size === 0 && this.extensions.size > 0) {
            for (const ext of this.extensions.keys()) {
                this.selected.add(ext);
            }
            this.mainProvider.config.selectedExtensions = Array.from(this.selected);
            this.mainProvider.saveConfig();
        }
    }

    updateSelection(item: ExtensionItem, checked: boolean): void {
        if (item.isSubFile) {return;}
        if (checked) {
            this.selected.add(item.ext);
        } else {
            this.selected.delete(item.ext);
        }
        this.mainProvider.config.selectedExtensions = Array.from(this.selected);
        this.mainProvider.saveConfig();
        this._onDidChangeTreeData.fire(undefined);
    }
}