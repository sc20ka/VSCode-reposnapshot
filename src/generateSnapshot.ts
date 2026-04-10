import * as fs from 'fs';
import * as path from 'path';
import { StringDecoder } from 'string_decoder';

interface Config {
    includeMetadata: boolean;
    maxSnapshotLength: number;
}

function readFileSafely(filePath: string): string {
    let content = '';
    const CHUNK_SIZE = 65536; // 64 KB
    const buffer = Buffer.alloc(CHUNK_SIZE);
    let fd: number | null = null;
    const decoder = new StringDecoder('utf8');

    try {
        fd = fs.openSync(filePath, 'r');
        let bytesRead = 0;
        let position = 0;
        while ((bytesRead = fs.readSync(fd, buffer, 0, CHUNK_SIZE, position)) > 0) {
            position += bytesRead;
            const chunk = decoder.write(buffer.subarray(0, bytesRead));
            const invalidCharIdx = chunk.search(/[\uFFFD\x00]/);
            if (invalidCharIdx !== -1) {
                content += chunk.substring(0, invalidCharIdx);
                content += '\n... [Stopped reading due to binary/invalid characters]';
                return content;
            }
            content += chunk;
        }
        const lastChunk = decoder.end();
        const invalidCharIdx = lastChunk.search(/[\uFFFD\x00]/);
        if (invalidCharIdx !== -1) {
            content += lastChunk.substring(0, invalidCharIdx);
            content += '\n... [Stopped reading due to binary/invalid characters]';
            return content;
        }
        content += lastChunk;
    } finally {
        if (fd !== null) {
            try {
                fs.closeSync(fd);
            } catch (e) {}
        }
    }
    return content;
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
            output += readFileSafely(filePath) + '\n';
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