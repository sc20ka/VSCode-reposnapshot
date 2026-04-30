import * as vscode from 'vscode';

export class SettingsProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;
    private _provider: any;  // SnapshotTreeProvider

    constructor(_extensionUri: vscode.Uri, _provider: any) {
        this._extensionUri = _extensionUri;
        this._provider = _provider;
    }

    public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void | Thenable<void> {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'toggleAutoAdd':
                    this._provider.toggleAutoAdd(message.value);
                    return;
                case 'setMaxLength':
                    const newLength = parseInt(message.value, 10);
                    if (!isNaN(newLength) && newLength > 0) {
                        this._provider.config.maxSnapshotLength = newLength;
                        this._provider.saveConfig();
                        this.update();  // Обновляем UI сразу после сохранения
                        console.log('Max length updated to:', newLength);  // Лог для дебага в Extension Host
                    } else {
                        console.error('Invalid max length value:', message.value);  // Лог ошибки
                    }
                    return;
                case 'toggleMetadata':
                    this._provider.config.includeMetadata = message.value;
                    this._provider.saveConfig();
                    return;
                case 'toggleIgnoreGitignore':
                    this._provider.config.ignoreGitignore = message.value;
                    this._provider.saveConfig();
                    this._provider.refresh();
                    return;
            }
        });
        this.update();
    }

    private update(): void {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'updateSettings',
                autoAddNewFiles: this._provider.config.autoAddNewFiles,
                maxSnapshotLength: this._provider.config.maxSnapshotLength,
                includeMetadata: this._provider.config.includeMetadata,
                ignoreGitignore: this._provider.config.ignoreGitignore
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Settings</title>
    </head>
    <body>
        <h1>Repo Snapshot Settings</h1>
        <label>
        <input type="checkbox" id="autoAdd"> Auto Add New Files
        </label><br>
        <label>
        Max Snapshot Length: <input type="number" id="maxLength" value="200000000">
        </label><br>
        <label>
        <input type="checkbox" id="includeMetadata" checked> Include Metadata
        </label><br>
        <label>
        <input type="checkbox" id="ignoreGitignore"> Ignore .gitignore
        </label><br>
        <script>
          const vscode = acquireVsCodeApi();
            const autoAdd = document.getElementById('autoAdd');
            const maxLength = document.getElementById('maxLength');
            const includeMetadata = document.getElementById('includeMetadata');
            const ignoreGitignore = document.getElementById('ignoreGitignore');

            console.log('Settings JS loaded:', { autoAdd: !!autoAdd, maxLength: !!maxLength, includeMetadata: !!includeMetadata, ignoreGitignore: !!ignoreGitignore });

            autoAdd.addEventListener('change', () => {
                console.log('Event: Toggle autoAdd to', autoAdd.checked);
                vscode.postMessage({ command: 'toggleAutoAdd', value: autoAdd.checked });
            });

            maxLength.addEventListener('input', () => {  // Добавил 'input' для реального времени, + 'change'
                console.log('Event: Max length input to', maxLength.value);
            });
            maxLength.addEventListener('change', () => {
                console.log('Event: Max length changed to', maxLength.value);
                vscode.postMessage({ command: 'setMaxLength', value: maxLength.value });
            });

            includeMetadata.addEventListener('change', () => {
                console.log('Event: Toggle metadata to', includeMetadata.checked);
                vscode.postMessage({ command: 'toggleMetadata', value: includeMetadata.checked });
            });

            ignoreGitignore.addEventListener('change', () => {
                console.log('Event: Toggle ignoreGitignore to', ignoreGitignore.checked);
                vscode.postMessage({ command: 'toggleIgnoreGitignore', value: ignoreGitignore.checked });
            });

            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'updateSettings') {
                console.log('Event: Received updateSettings', message);
                autoAdd.checked = message.autoAddNewFiles;
                maxLength.value = message.maxSnapshotLength;
                includeMetadata.checked = message.includeMetadata;
                ignoreGitignore.checked = message.ignoreGitignore;
                }
            });
        </script>
    </body>
    </html>`;
    }
}