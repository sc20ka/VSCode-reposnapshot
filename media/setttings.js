(function() {
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
})();