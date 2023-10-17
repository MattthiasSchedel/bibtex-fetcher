import * as vscode from 'vscode';

export class Entry extends vscode.TreeItem {
    constructor(
        public readonly title: string,
        public readonly key: string,
        public readonly filePath: string,    // Add file path
        public readonly line: number,        // Add line number
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(title, collapsibleState);
        this.command = {                     // Add command to open the file and reveal the line
            command: 'vscode.open',
            arguments: [vscode.Uri.file(filePath), { selection: new vscode.Range(line, 0, line, 0) }],
            title: 'Open Entry'
        };
    }
}
