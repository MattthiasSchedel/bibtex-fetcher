import * as vscode from 'vscode';
import { SearchBTViewProvider } from './SearchBTViewProvider';
// import { BibViewProvider } from './BibViewProvider';


export function activate(context: vscode.ExtensionContext) {
    // console.log("Activating tree view");
    // let bibViewProvider = new BibViewProvider(vscode.workspace.rootPath);
    // vscode.window.registerTreeDataProvider('bibView', bibViewProvider);
    // vscode.workspace.onDidChangeTextDocument(e => bibViewProvider.refresh());

    const provider = new SearchBTViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SearchBTViewProvider.viewType, provider));


	context.subscriptions.push(
		vscode.commands.registerCommand('clearSearchList', () => {
			provider.clearPapers();
		}));

	// Register the addCitation command
	let addCitationCommand = vscode.commands.registerCommand('bibtex-manager.addCitation', () => {
		// Call your addCitation function here
		provider.searchForPaper();
	});

	context.subscriptions.push(addCitationCommand);

	const addCitationButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	addCitationButton.text = "Add Citation";
	addCitationButton.tooltip = "Add Citation";
	addCitationButton.command = 'bibtex-manager.addCitation';
	addCitationButton.show();
}

export function deactivate() {}


