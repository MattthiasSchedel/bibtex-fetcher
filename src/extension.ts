// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { addCitation } from './addCitation';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "bibtex-manager" is now active!');

	// Register the addCitation command
	let addCitationCommand = vscode.commands.registerCommand('bibtex-manager.addCitation', () => {
		// Call your addCitation function here
		addCitation();
	});

	context.subscriptions.push(addCitationCommand);

	const addCitationButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	addCitationButton.text = "Add Citation";
	addCitationButton.tooltip = "Add Citation";
	addCitationButton.command = 'bibtex-manager.addCitation';
	addCitationButton.show();
}

// This method is called when your extension is deactivated
export function deactivate() {}

