// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { Console } from 'console';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "bibtex-manager" is now active!');


	// Register the file creation event listener
	let handleNewFile = vscode.workspace.onDidCreateFiles((event: vscode.FileCreateEvent) => {
		// Filter all files to just take PDFs into account
		const pdfFiles = event.files.filter(file => path.extname(file.fsPath) === '.pdf');
		
		// Process each PDF file
		pdfFiles.forEach(pdfFile => {
			const filePath = pdfFile.fsPath;
			// Perform any necessary actions for the new PDF file, such as generating the BibTeX citation key

			

			// and updating the data structure or tree view
			console.log("New PDF added:", filePath);
			vscode.window.showInformationMessage("New PDF added: " + filePath);
		});
	});
	
	context.subscriptions.push(handleNewFile);
}

// This method is called when your extension is deactivated
export function deactivate() {}
