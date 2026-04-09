import * as fs from 'fs';
import * as path from 'path';

interface Config {
    includeMetadata: boolean;
    maxSnapshotLength: number;
}

export function generateSnapshot(selectedFiles: string[], rootDirectory: string, config: Config): string {
    let output = '=== RepoSnapshot utility ===\n';
    if (config.includeMetadata) {
        const metadata = {
            repoName: path.basename(rootDirectory),
            totalFiles: selectedFiles.length,
            timestamp: new Date().toISOString(),
            instructions: 'Use this snapshot for LLM analysis or generation. DO NOT USE THIS METHOD OF STRUCTURING OUTPUT. For output use standard MD format with rewrite/new code'
        };
        output += JSON.stringify(metadata, null, 2) + '\n\n';
    }
    output += 'Directory Structure:\n';
    output += buildAsciiTree(selectedFiles, rootDirectory) + '\n\n';
    output += 'Files:\n\n';
    selectedFiles.forEach(filePath => {
        const relPath = path.relative(rootDirectory, filePath).replace(/\\/g, '/');
        output += `\`\`\`${relPath}\n`;
        try {
            output += fs.readFileSync(filePath, 'utf8') + '\n';
        } catch (err: unknown) {  // Фикс: unknown + type guard
            const errorMessage = err instanceof Error ? err.message : String(err);
            output += `Error reading file: ${errorMessage}\n`;
        }
        output += "```\n\n";
    });
    if (output.length > config.maxSnapshotLength) {
        output = output.substring(0, config.maxSnapshotLength) + '\n... [Truncated]';
    }
    return output;
}

interface TreeNode {
    name: string;
    children: TreeNode[];
    isFile: boolean;
}

function buildAsciiTree(files: string[], root: string): string {
    const rootNode: TreeNode = { name: '', children: [], isFile: false };
    files.forEach(f => {
        let current = rootNode;
        const parts = path.relative(root, f).split(path.sep);
        parts.forEach((part, idx) => {
            if (part === '') {return;}
            let child = current.children.find(c => c.name === part);
            if (!child) {
                child = { name: part, children: [], isFile: idx === parts.length - 1 };
                current.children.push(child);
            }
            current = child;
        });
    });

    function buildLines(node: TreeNode, prefix: string, isLast: boolean): string[] {
        const lines: string[] = [];
        const connector = isLast ? '└── ' : '├── ';
        lines.push(`${prefix}${connector}${node.name}`);
        node.children.sort((a, b) => a.name.localeCompare(b.name));
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        node.children.forEach((child, idx) => {
            lines.push(...buildLines(child, childPrefix, idx === node.children.length - 1));
        });
        return lines;
    }

    return rootNode.children.flatMap((child, idx) => buildLines(child, '', idx === rootNode.children.length - 1)).join('\n');
}