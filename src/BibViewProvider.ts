import * as vscode from 'vscode';
import { parseBibFiles } from './bibParser';
import { Entry } from './entry';

export class BibViewProvider implements vscode.TreeDataProvider<Entry> {
	private _onDidChangeTreeData: vscode.EventEmitter<Entry | null> = new vscode.EventEmitter<Entry | null>();
	readonly onDidChangeTreeData: vscode.Event<Entry | null> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string | undefined) { }

	refresh(): void {
		this._onDidChangeTreeData.fire(null);
	}

	getTreeItem(element: Entry): vscode.TreeItem {
		return element;
	}

	getChildren(element?: Entry): Thenable<Entry[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage("No .bib file in workspace");
			return Promise.resolve([]);
		}

		return Promise.resolve(parseBibFiles(this.workspaceRoot));
	}
}
