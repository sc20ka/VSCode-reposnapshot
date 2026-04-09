import * as vscode from 'vscode';
import * as path from 'path';
import ignore from 'ignore';

export interface SnapshotItem extends vscode.TreeItem {
    relPath: string;
    resourceUri?: vscode.Uri;
}

interface Config {
    partialFolders: { [key: string]: { excluded: string[] } };
    autoAddNewFiles: boolean;
    forcedIncludes: string[];
    selectedExtensions: string[];
    excludedForRoot: string[];
    maxSnapshotLength: number;
    includeMetadata: boolean;
    ignoreGitignore: boolean;
}

export class SnapshotTreeProvider implements vscode.TreeDataProvider<SnapshotItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<SnapshotItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    config: Config = {
        partialFolders: {},
        autoAddNewFiles: true,
        forcedIncludes: [],
        selectedExtensions: [],
        excludedForRoot: [],
        maxSnapshotLength: 200000000,
        includeMetadata: true,
        ignoreGitignore: false
    };
    gitIgnore = ignore();
    configPath: string;
    workspaceRoot: string;
    private updateQueue: { item: SnapshotItem; checked: boolean }[] = [];
    private isProcessingQueue = false;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.configPath = path.posix.join(workspaceRoot, '.vscode', 'repo-snapshot.json');
    }

    public async initialize(): Promise<void> {
        await this.loadConfig();
        await this.loadGitIgnore();
        if (Object.keys(this.config.partialFolders).length === 0) {
            this.config.excludedForRoot = ['.vscode'];
            if (this.config.autoAddNewFiles) {
                this.config.partialFolders[''] = { excluded: this.config.excludedForRoot };
            }
            await this.saveConfig();
        } else if (this.config.autoAddNewFiles && !this.config.partialFolders['']) {
            this.config.partialFolders[''] = { excluded: this.config.excludedForRoot || [] };
            await this.saveConfig();
        }
    }

    refresh(item?: SnapshotItem): void {
        this._onDidChangeTreeData.fire(item);
    }

    getTreeItem(element: SnapshotItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: SnapshotItem): Promise<SnapshotItem[]> {
        if (!this.workspaceRoot) {return [];}
        const parentUri = element ? element.resourceUri! : vscode.Uri.file(this.workspaceRoot);
        const parentRelPath = element ? element.relPath : '';
        let children: [string, vscode.FileType][] = [];
        try {
            children = await vscode.workspace.fs.readDirectory(parentUri);
        } catch (error) {
            console.error(`Error reading directory ${parentUri?.fsPath}: `, error);
            return [];
        }
        const items: SnapshotItem[] = [];
        for (const [name, type] of children) {
            const relChildPath = path.posix.join(parentRelPath, name);
            if (!this.config.ignoreGitignore && this.isIgnored(relChildPath) && !this.config.forcedIncludes.includes(relChildPath)) {continue;}
            const uri = vscode.Uri.joinPath(parentUri, name);
            const state = type === vscode.FileType.Directory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
            const item = new vscode.TreeItem(name, state) as SnapshotItem;
            item.relPath = relChildPath;
            item.resourceUri = uri;
            if (uri) {
                item.command = { command: 'vscode.open', title: 'Open File', arguments: [uri] };
            }
            const isSel = this.isSelected(relChildPath);
            item.checkboxState = isSel ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
            if (type === vscode.FileType.Directory) {
                const data = this.config.partialFolders[relChildPath];
                item.description = (data && data.excluded.length > 0) ? '(partial)' : undefined;
            }
            items.push(item);
        }
        return items;
    }

    private async loadConfig(): Promise<void> {
        try {
            const configUri = vscode.Uri.file(this.configPath);
            const configData = await vscode.workspace.fs.readFile(configUri);
            const loaded = JSON.parse(configData.toString());
            this.config = {
                partialFolders: loaded.partialFolders || {},
                autoAddNewFiles: loaded.autoAddNewFiles !== undefined ? loaded.autoAddNewFiles : true,
                forcedIncludes: loaded.forcedIncludes || [],
                selectedExtensions: loaded.selectedExtensions || [],
                excludedForRoot: loaded.excludedForRoot || [],
                maxSnapshotLength: loaded.maxSnapshotLength || 200000000,
                includeMetadata: loaded.includeMetadata !== undefined ? loaded.includeMetadata : true,
                ignoreGitignore: loaded.ignoreGitignore || false
            };
        } catch (error: any) {
            if (error.code !== 'FileNotFound') {
                console.error(`Ошибка загрузки конфига: `, error);
            }
        }
    }

    async saveConfig(): Promise<void> {
        try {
            const configUri = vscode.Uri.file(this.configPath);
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(this.configPath)));
            await vscode.workspace.fs.writeFile(configUri, Buffer.from(JSON.stringify(this.config, null, 2)));
        } catch (error) {
            console.error(`Ошибка сохранения конфига: `, error);
        }
    }

    private async loadGitIgnore(): Promise<void> {
        const gitIgnorePath = path.posix.join(this.workspaceRoot, '.gitignore');
        try {
            const gitIgnoreUri = vscode.Uri.file(gitIgnorePath);
            const data = await vscode.workspace.fs.readFile(gitIgnoreUri);
            this.gitIgnore = ignore().add(data.toString());
        } catch (error: any) {
            if (error.code !== 'FileNotFound') {
                console.error(`Ошибка загрузки .gitignore: `, error);
            }
            this.gitIgnore = ignore();
        }
    }

    public isIgnored(relPath: string): boolean {
        return this.gitIgnore.ignores(relPath);
    }

    private isSelected(relPath: string): boolean {
        if (relPath === '') {return true;}
        if (this.config.forcedIncludes.some(inc => relPath === inc || relPath.startsWith(inc + '/'))) {return true;}
        const matchingFolders = Object.keys(this.config.partialFolders).filter(folder => {
            const prefix = folder ? folder + '/' : '';
            return relPath.startsWith(prefix);
        });
        if (matchingFolders.length === 0) {return false;}
        matchingFolders.sort((a, b) => b.length - a.length); // Deepest first
        const folder = matchingFolders[0];
        const prefix = folder ? folder + '/' : '';
        const localPath = relPath.substring(prefix.length);
        const data = this.config.partialFolders[folder];
        if (data.excluded.some(ex => localPath === ex || localPath.startsWith(ex + '/')) && !this.config.forcedIncludes.includes(relPath)) {return false;}
        return true;
    }

    async updateSelection(item: SnapshotItem, checked: boolean): Promise<void> {
        this.updateQueue.push({ item, checked });
        if (!this.isProcessingQueue) {
            this.isProcessingQueue = true;
            await this.processUpdateQueue();
            this.isProcessingQueue = false;
        }
    }

    private async processUpdateQueue(): Promise<void> {
        while (this.updateQueue.length > 0) {
            const { item, checked } = this.updateQueue.shift()!;
            const relPath = item.relPath;
            const currentSelected = this.isSelected(relPath);
            if (checked === currentSelected) {continue;}
            let parent = path.posix.dirname(relPath);
            if (parent === '.') {parent = '';}
            const baseName = path.posix.basename(relPath);
            const uri = vscode.Uri.file(path.posix.join(this.workspaceRoot, relPath));
            let stat: vscode.FileStat | undefined;
            try {
                stat = await vscode.workspace.fs.stat(uri);
            } catch (error) {
                console.error(`Error stat for ${relPath}: `, error);
                continue;
            }
            const isDir = stat.type === vscode.FileType.Directory;
            if (checked) {
                // Check upward with forcedIncludes
                const pathsToSelect: string[] = [];
                let current = relPath;
                while (current !== '' && !this.isSelected(current)) {
                    pathsToSelect.push(current);
                    current = path.posix.dirname(current) === '.' ? '' : path.posix.dirname(current);
                }
                const selectOrder = pathsToSelect.reverse();
                for (let i = 0; i < selectOrder.length; i++) {
                    const currentRel = selectOrder[i];
                    const currSpecific = i < selectOrder.length - 1 ? path.posix.basename(selectOrder[i + 1]) : undefined;
                    const currParent = path.posix.dirname(currentRel) === '.' ? '' : path.posix.dirname(currentRel);
                    const currBase = path.posix.basename(currentRel);
                    const currUri = vscode.Uri.file(path.posix.join(this.workspaceRoot, currentRel));
                    let currStat: vscode.FileStat | undefined;
                    try {
                        currStat = await vscode.workspace.fs.stat(currUri);
                    } catch (error) {
                        continue;
                    }
                    const currIsDir = currStat.type === vscode.FileType.Directory;
                    if (this.config.partialFolders[currParent]) {
                        this.config.partialFolders[currParent].excluded = this.config.partialFolders[currParent].excluded.filter(ex => !(ex === currBase || ex.startsWith(currBase + '/')));
                    }
                    if (!this.config.ignoreGitignore && this.isIgnored(currentRel) && !this.config.forcedIncludes.includes(currentRel)) {
                        this.config.forcedIncludes.push(currentRel);
                    }
                    if (currIsDir) {
                        if (!this.config.partialFolders[currentRel]) {
                            this.config.partialFolders[currentRel] = { excluded: [] };
                        }
                        if (currSpecific !== undefined) {
                            const dirUri = vscode.Uri.file(path.posix.join(this.workspaceRoot, currentRel));
                            let children: [string, vscode.FileType][] = [];
                            try {
                                children = await vscode.workspace.fs.readDirectory(dirUri);
                            } catch (error) {}
                            this.config.partialFolders[currentRel].excluded = children
                                .map(([name]) => name)
                                .filter(name => name !== currSpecific && !this.isSelected(path.posix.join(currentRel, name)));
                        } else {
                            this.config.partialFolders[currentRel].excluded = [];
                        }
                    }
                    const refreshParent = currParent;
                    const refreshUri = vscode.Uri.file(path.posix.join(this.workspaceRoot, refreshParent));
                    const refreshItem = new vscode.TreeItem(path.posix.basename(refreshParent) || 'root', vscode.TreeItemCollapsibleState.None) as SnapshotItem;
                    refreshItem.relPath = refreshParent;
                    refreshItem.resourceUri = refreshUri;
                    this.refresh(refreshItem);
                }
                
                // Check downward cleanup
                if (isDir) {
                    const keys = Object.keys(this.config.partialFolders);
                    for (const key of keys) {
                        if (key.startsWith(relPath + '/')) {
                            delete this.config.partialFolders[key];
                        }
                    }
                    this.config.forcedIncludes = this.config.forcedIncludes.filter(p => !(p.startsWith(relPath + '/')));
                }
                
            } else {
                // Uncheck downward
                this.config.forcedIncludes = this.config.forcedIncludes.filter(p => !(relPath === p || p.startsWith(relPath + '/')));
                
                if (!this.config.partialFolders[parent]) {
                    this.config.partialFolders[parent] = { excluded: [] };
                }
                this.config.partialFolders[parent].excluded.push(baseName);
                this.config.partialFolders[parent].excluded = [...new Set(this.config.partialFolders[parent].excluded)];
                
                if (isDir) {
                    const keys = Object.keys(this.config.partialFolders);
                    for (const key of keys) {
                        if (key === relPath || key.startsWith(relPath + '/')) {
                            delete this.config.partialFolders[key];
                        }
                    }
                }

                await this.checkAndUncheckIfAllExcluded(parent);
                const data = this.config.partialFolders[parent];
                if (data && data.excluded.length === 0) {
                    delete this.config.partialFolders[parent];
                }
                const refreshUri = vscode.Uri.file(path.posix.join(this.workspaceRoot, parent));
                const refreshItem = new vscode.TreeItem(path.posix.basename(parent) || 'root', vscode.TreeItemCollapsibleState.None) as SnapshotItem;
                refreshItem.relPath = parent;
                refreshItem.resourceUri = refreshUri;
                this.refresh(refreshItem);
            }
            await this.saveConfig();
        }
    }



    private async checkAndUncheckIfAllExcluded(parent: string): Promise<void> {
        let currentParent = parent;
        while (currentParent !== '') {
            const data = this.config.partialFolders[currentParent];
            if (!data) {break;}
            const parentUri = vscode.Uri.file(path.posix.join(this.workspaceRoot, currentParent));
            let children: [string, vscode.FileType][] = [];
            try {
                children = await vscode.workspace.fs.readDirectory(parentUri);
            } catch (error) {
                break;
            }
            const nonIgnoredChildren = children.filter(([name]) => {
                const childRel = path.posix.join(currentParent, name);
                return !(!this.config.ignoreGitignore && this.isIgnored(childRel) && !this.config.forcedIncludes.includes(childRel));
            });
            const existingExcluded = data.excluded.filter(ex => {
                const exParts = ex.split('/');
                const exBase = exParts[0];
                return nonIgnoredChildren.some(([name]) => name === exBase);
            });
            const hasPartialSubWithContent = nonIgnoredChildren.some(([name, type]) => {
                if (type !== vscode.FileType.Directory) {return false;}
                const subPath = path.posix.join(currentParent, name);
                const subData = this.config.partialFolders[subPath];
                return !!subData;
            });
            if (existingExcluded.length !== nonIgnoredChildren.length || hasPartialSubWithContent) {
                if (data.excluded.length === 0) {
                    delete this.config.partialFolders[currentParent];
                }
                break;
            }
            const grandParent = path.posix.dirname(currentParent) === '.' ? '' : path.posix.dirname(currentParent);
            const parentBase = path.posix.basename(currentParent);
            if (!this.config.partialFolders[grandParent]) {
                this.config.partialFolders[grandParent] = { excluded: [] };
            }
            this.config.partialFolders[grandParent].excluded.push(parentBase);
            this.config.partialFolders[grandParent].excluded = [...new Set(this.config.partialFolders[grandParent].excluded)];
            delete this.config.partialFolders[currentParent];
            currentParent = grandParent;
        }
        if (currentParent !== parent) {
            const gpUri = vscode.Uri.file(path.posix.join(this.workspaceRoot, currentParent));
            const gpItem = new vscode.TreeItem(path.posix.basename(currentParent) || 'root', vscode.TreeItemCollapsibleState.None) as SnapshotItem;
            gpItem.relPath = currentParent;
            gpItem.resourceUri = gpUri;
            this.refresh(gpItem);
        }
    }

    toggleAutoAdd(value: boolean): void {
        this.config.autoAddNewFiles = value;
        if (this.config.autoAddNewFiles) {
            this.config.partialFolders[''] = { excluded: this.config.excludedForRoot || [] };
        } else {
            this.config.excludedForRoot = this.config.partialFolders['']?.excluded || [];
            delete this.config.partialFolders[''];
        }
        this.saveConfig();
        this.refresh();
    }

    async getSelectedFiles(): Promise<string[]> {
        const selected: string[] = [];
        await this.collectSelectedFiles('', selected);
        if (this.config.selectedExtensions.length === 0) {
            return selected;
        }
        return selected.filter(f => {
            const ext = path.extname(f).toLowerCase();
            return this.config.selectedExtensions.includes(ext) || (ext === '' && this.config.selectedExtensions.includes(''));
        });
    }

    private async collectSelectedFiles(currentRelPath: string, selected: string[]): Promise<void> {
        if (!this.isSelected(currentRelPath)) {return;}
        const currentUri = vscode.Uri.file(path.posix.join(this.workspaceRoot, currentRelPath));
        let stat: vscode.FileStat | undefined;
        try {
            stat = await vscode.workspace.fs.stat(currentUri);
        } catch (error) {
            return;
        }
        if (stat.type === vscode.FileType.File) {
            selected.push(currentUri.fsPath);
            return;
        }
        let children: [string, vscode.FileType][] = [];
        try {
            children = await vscode.workspace.fs.readDirectory(currentUri);
        } catch (error) {
            return;
        }
        for (const [name, type] of children) {
            const childRelPath = path.posix.join(currentRelPath, name);
            if (!this.config.ignoreGitignore && this.isIgnored(childRelPath) && !this.config.forcedIncludes.includes(childRelPath)) {continue;}
            await this.collectSelectedFiles(childRelPath, selected);
        }
    }

    dispose(): void {
        this._onDidChangeTreeData.dispose();
    }
}