RepoSnapshot README
RepoSnapshot is a Visual Studio Code extension that generates a comprehensive snapshot of a repository for input into large language models (LLMs). It provides a unified view of the repository's code, metadata, and directory structure as a single text string or file. Ported from a C# WPF application, RepoSnapshot offers an intuitive interface for selecting files and directories, respecting .gitignore rules with override options, and formatting output for LLM analysis.
Features

Sidebar Interface: Access RepoSnapshot via a dedicated sidebar icon in VS Code, featuring two views:
Files View: A tree view of the repository's directory structure with checkboxes to select/deselect files and folders.
Extensions View: A collapsible list of file extensions with associated files, sorted with priority for programming languages (e.g., .py, .js, .ts).


File and Folder Selection:
Select entire folders or individual files with checkboxes.
Automatically respects .gitignore exclusions, with options to force-include ignored files.
Auto-add new files option (configurable via toggle).


Configuration Persistence: Selection preferences are saved in .vscode/repo-snapshot.json, including:
Fully included folders.
Partially included folders with excluded files.
Forced inclusions for .gitignore-ignored files.
Selected file extensions.


Snapshot Generation:
Generates a structured output (copied to clipboard) containing:
JSON metadata (repository name, file count, timestamp).
ASCII tree representation of the directory structure.
Content of selected files.


Output is truncated if it exceeds 100,000 characters to prevent excessive size.


Localization Support: Supports English, Russian, and Chinese (planned, not fully implemented).
Save to File: Option to save the snapshot to a file (planned feature).



Tip: Check out the Extension Guidelines for tips on creating engaging screenshots or animations to showcase RepoSnapshot in action.

Requirements

Visual Studio Code: Version 1.60.0 or higher.
Node.js: Required for development and testing (included in VS Code).
Workspace: A valid VS Code workspace with a root folder containing the repository.
Optional: A .gitignore file in the repository root for automatic exclusion of ignored files.

No additional dependencies are required for end-users. For development, install the following:

npm install to set up the project.
vsce for packaging the extension (npm install -g @vscode/vsce).

Extension Settings
This extension contributes the following settings (stored in .vscode/repo-snapshot.json):

fullFolders: Array of folder paths to include entirely in the snapshot.
partialFolders: Object mapping folder paths to arrays of excluded files.
autoAddNewFiles: Boolean to enable/disable automatic inclusion of new files (default: true).
forcedIncludes: Array of file paths to include despite .gitignore rules.
selectedExtensions: Array of file extensions to include in the snapshot (e.g., [".py", ".js"]).
excludedForRoot: Array of paths excluded from the root when autoAddNewFiles is enabled.

These settings are managed via the extension's UI and automatically persisted.
Known Issues

Checkbox Persistence: In some cases, unchecking a file or folder may not persist correctly due to the autoAddNewFiles setting overriding selections. Workaround: Toggle autoAddNewFiles off to manually control selections.
Empty Extensions View: The Extensions view may appear empty if no files are selected or if all files are ignored by .gitignore. Ensure files are selected in the Files view and check console logs for debugging.
Directory Uncheck: Unchecking a directory may not fully exclude its contents in the snapshot due to parent folder selection logic. Fixed in the latest update (see Release Notes).
Localization: Full support for Russian and Chinese is under development.
File Output: Saving snapshots to a file is not yet implemented.
