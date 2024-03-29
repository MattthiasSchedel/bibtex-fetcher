import * as vscode from 'vscode';
import { fetchSemanticScholar } from './fetchSemanticScholar';
import { addStringToFile } from './addStringToFile';
import { fetchBibTeX } from './fetchBibTeX';

export class SearchBTViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'searchView';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'getBibTeX':
					{
						webviewView.webview.postMessage({ type: 'loading' });
						const paperId = data.message;
						console.log(paperId);
						fetchBibTeX(paperId).then(data => {
							
							const bibKeyPattern = getBibKeyPattern();
							let bibKey;
							if (bibKeyPattern){
								bibKey = getBibTexKey(data as string);
								if (!bibKey){
									webviewView.webview.postMessage({ type: 'stopLoading' });
									vscode.window.showErrorMessage('BibTeX has no key!', 'Add without key', 'Enter key manually')
										.then((choice) => {
											if (choice === 'Add without key') {
												addStringToFile(getLibraryFilePath(), data + '\n\n');
											} else if (choice === 'Enter key manually') {
												vscode.window.showInputBox({ prompt: 'Enter the BibTeX key' })
													.then((key) => {
														if (key) {
															// Handle the entered key logic here
															console.log('Entered key:', key);
															const newData = replaceBibTexKey(data as string, key);
															addStringToFile(getLibraryFilePath(), newData + '\n\n');
														}
													});
											}
										});
									return;
								}
							}
							addStringToFile(getLibraryFilePath(), data + '\n\n');
							webviewView.webview.postMessage({ type: 'stopLoading' });
						}).catch(err => {
							console.error(err);
							webviewView.webview.postMessage({ type: 'stopLoading' });
						});
						break;
					}
				case 'debug': // Handle the debug message
					{
						console.log(`[WEBVIEW DEBUG]: ${data.message}`);
						break;
					}
				case 'searchPaper':
					{
						webviewView.webview.postMessage({ type: 'loading' });
						const paperTitle = data.message;
						// console.log(paperTitle);
						fetchSemanticScholar(paperTitle, 5).then(data => {
							console.log(data);
							webviewView.webview.postMessage({ type: 'papers', message: data.data });
							webviewView.webview.postMessage({ type: 'stopLoading' });
						}).catch(err => {
							console.error(err);
							webviewView.webview.postMessage({ type: 'stopLoading' });
						});

						// console.log("Request ended");
						break;
					}
			}
		});

	}

	public clearPapers() {
		if (this._view) {
			this._view.webview.postMessage({ type: 'clearPaperList' });
		}
	}

	public searchForPaper(){
		const clipboardText = vscode.env.clipboard.readText();
		clipboardText.then((text) => {
			if (this._view) {
				if(!this._view.visible){
					vscode.commands.executeCommand('workbench.view.extension.bibViewer');

					vscode.commands.executeCommand(`searchView.focus`);
				}
				console.log(text);
				this._view.webview.postMessage({ type: 'searchForPaper', message: text });
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Search BibTeX</title>
			</head>
			<body>
				<form id="paperSearchForm">
					<label for="paperTitle">Enter the name of a scientific paper:</label>
					<input type="text" id="paperTitle" name="paperTitle" required>
					<button type="submit">Search</button>
				</form>
				<div id="loading"></div>
				<div id="paperList"></div>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}


export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function getLibraryFilePath() {
    // Retrieve the library file path from the settings
    const config = vscode.workspace.getConfiguration();
    const filePath = config.get('libraryFilePath');
    return filePath as string;
}

function getBibKeyPattern() {
	// Retrieve the bib key pattern from the settings
	const config = vscode.workspace.getConfiguration();
	const usePattern = config.get('useBibKeyPattern');
	if (!usePattern) {
		return undefined;
	}
	else {
		const pattern = config.get('bibKeyPattern');
		return pattern as string;
	}
}

function parseBibTeXEntry(bibtexEntry: string): Record<string, string> {
	const result: Record<string, string> = {};
	const lines = bibtexEntry.split('\n');
  
	// Remove the first and last line (@Article{..., }).
	lines.shift();
	lines.pop();
  
	// Process each line.
	lines.forEach(line => {
	  	// Split the line into key and value.
		const match = line.match(/^\s*(\w+)\s*=\s*\{(.*)\},?$/);
		if (match) {
			const key = match[1];
			const value = match[2];
			result[key] = value;
	  	}
	});
  
	return result;
}

function getBibTexKey(bibtexEntry: string): string | undefined {
	const match = bibtexEntry.match(/^\s*@(\w+)\s*\{(.+),/);
	if (match) {
		if (match[2] === "None") {
			return undefined;
		}
		return match[2];
	}
	return undefined;
}

function replaceBibTexKey(bibtexEntry: string, key: string): string {
	const match = bibtexEntry.match(/^\s*@(\w+)\s*\{(.+),/);
	if (match) {
		return bibtexEntry.replace(match[2], key);
	}
	return bibtexEntry;
}