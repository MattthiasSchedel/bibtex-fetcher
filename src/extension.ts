import * as vscode from 'vscode';
import { SearchView } from './view';
import { Library, nodeFs } from './library';
import { Logger } from './logger';

const CMD_ADD = 'bibtex-manager.addCitation';
const CMD_CLEAR = 'bibtex-manager.clearSearchList';

export function activate(context: vscode.ExtensionContext): void {
	const logger = new Logger();
	context.subscriptions.push({ dispose: () => logger.dispose() });

	const workspaceRoot =
		vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null;
	const library = new Library(nodeFs, workspaceRoot);
	const provider = new SearchView(context.extensionUri, library, logger);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SearchView.viewType, provider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(CMD_CLEAR, () => provider.clearPapers())
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(CMD_ADD, async () => {
			const text = (await vscode.env.clipboard.readText()).trim();
			if (!text) {
				vscode.window.showInformationMessage(
					'Clipboard is empty. Copy a paper title and try again.'
				);
				return;
			}
			await vscode.commands.executeCommand(
				'workbench.view.extension.bibViewer'
			);
			await vscode.commands.executeCommand('searchView.focus');
			provider.queueSearch(text);
		})
	);

	const statusBar = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Left
	);
	statusBar.text = '$(book) Add Citation';
	statusBar.tooltip = 'Search clipboard text on Semantic Scholar and add the BibTeX';
	statusBar.command = CMD_ADD;
	statusBar.show();
	context.subscriptions.push(statusBar);
}

export function deactivate(): void {
	// Subscriptions are disposed by VS Code.
}
