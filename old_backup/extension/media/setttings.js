(function() {
  const vscode = acquireVsCodeApi();
  const autoAdd = document.getElementById('autoAdd');
  const maxLength = document.getElementById('maxLength');
  const includeMetadata = document.getElementById('includeMetadata');
  const ignoreGitignore = document.getElementById('ignoreGitignore');

  autoAdd.addEventListener('change', () => vscode.postMessage({ command: 'toggleAutoAdd', value: autoAdd.checked }));
  maxLength.addEventListener('change', () => vscode.postMessage({ command: 'setMaxLength', value: maxLength.value }));
  includeMetadata.addEventListener('change', () => vscode.postMessage({ command: 'toggleMetadata', value: includeMetadata.checked }));
  ignoreGitignore.addEventListener('change', () => vscode.postMessage({ command: 'toggleIgnoreGitignore', value: ignoreGitignore.checked }));

  window.addEventListener('message', event => {
    const message = event.data;
    if (message.command === 'updateSettings') {
      autoAdd.checked = message.autoAddNewFiles;
      maxLength.value = message.maxSnapshotLength;
      includeMetadata.checked = message.includeMetadata;
      ignoreGitignore.checked = message.ignoreGitignore;
    }
  });
}());