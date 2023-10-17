import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { Entry } from './entry';

export function parseBibFiles(workspaceRoot: string): Entry[] {
    const bibPattern = path.join(workspaceRoot, '**/*.bib');
    let entries: Entry[] = [];

    const bibFiles = glob.sync(bibPattern);

    for (const bibFilePath of bibFiles) {
        const content = fs.readFileSync(bibFilePath, 'utf8');
        const lines = content.split('\n');  // Split the file content into lines
        
        const regex = /@.+?\{(.+?),.+? title\s*=\s*\{(.+?)\}/gs;
        let match;
        while ((match = regex.exec(content)) !== null) {
            const line = content.substring(0, match.index).split('\n').length - 1;  // Calculate the line number
            entries.push(new Entry(match[2], match[1], bibFilePath, line, vscode.TreeItemCollapsibleState.None));
            // console.log(match[2], match[1], line);
        }
    }
    return entries;
}
