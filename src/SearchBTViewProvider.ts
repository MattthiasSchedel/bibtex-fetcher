import * as vscode from 'vscode';
import { fetchSemanticScholar } from './fetchSemanticScholar';
import { addStringToFile } from './addStringToFile';
import { fetchBibTeX } from './fetchBibTeX';
import { getLibraryFilePath, getBibKeyPattern, getNonce } from './utils';
import { getBibTexKey, replaceBibTexKey } from './bibtexUtils';
import { getHtmlForWebview } from './webviewContent';
import { Paper } from './paper';

type PaperDictionary = { [paperId: string]: Paper };

export class SearchBTViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'searchView';

	constructor(private readonly _extensionUri: vscode.Uri) { }

	private _view?: vscode.WebviewView;
	private _currentPapers: PaperDictionary = {};

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;
		webviewView.webview.options = this.getWebviewOptions(this._extensionUri);
		webviewView.webview.html = getHtmlForWebview(webviewView.webview, this._extensionUri);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'getBibTeX':
					{
						const paperId = data.message;
						this.handleGetBibTeX(paperId);
						break;
					}
				case 'debug': // Handle the debug message
					{
						console.log(`[WEBVIEW DEBUG]: ${data.message}`);
						break;
					}
				case 'searchPaper':
					{
						const paperTitle = data.message;
						this.handlePaperSearch(paperTitle);
						break;
					}
			}
		});

	}
	
	// Function to get webview options
	private getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
		return {
			enableScripts: true,
			localResourceRoots: [extensionUri],
		};
	}

	// Functions to handle webview messages
	private handlePaperSearch(paperTitle: string) {
		this._view?.webview.postMessage({ type: 'loading' });
		fetchSemanticScholar(paperTitle, 5).then(data => {

			console.log(data.data);
			// console.log(JSON.stringify(data.data));
			
			for (const paper of data.data) {
				this._currentPapers[paper.paperId] = new Paper(paper);
			}

			this._view?.webview.postMessage({ type: 'papers', message: data.data });
			this._view?.webview.postMessage({ type: 'stopLoading' });
		}).catch(err => {
			console.error(err);
			this._view?.webview.postMessage({ type: 'stopLoading' });
		});
	}

	private handleGetBibTeX(paperId: string) {
		this._view?.webview.postMessage({ type: 'loading' });
		fetchBibTeX(paperId).then(data => {
			const bibKeyPattern = getBibKeyPattern();
			let workingBibKey = false;
			let bibTex = data as string;
			let possibleKey = getBibTexKey(bibTex);
			// console.log(bibKeyPattern);
			// if the user wants to use a bib key pattern
			if(bibKeyPattern){
				// console.log(this._currentPapers[paperId].getBibTexKey(bibKeyPattern));
				const bibKey = this._currentPapers[paperId].getBibTexKey(bibKeyPattern);
				if(bibKey.success){
					bibTex = replaceBibTexKey(bibTex, bibKey.key);
					workingBibKey = true;
				}
			}
			console.log(possibleKey);
			// check if the key is 'None'
			if(!possibleKey && !workingBibKey){
				possibleKey = this._currentPapers[paperId].getBibTexKey('\\t(0)').key;
				console.log(possibleKey);
			} else {workingBibKey = true;}

			this._view?.webview.postMessage({ type: 'stopLoading' });
			if(workingBibKey){
				addStringToFile(getLibraryFilePath(), bibTex + '\n\n');
			}
			else{
				console.log(possibleKey);
				vscode.window.showErrorMessage('BibTeX has no key!', 'Add without key', 'Enter key manually')
					.then((choice) => {
						if (choice === 'Add without key') {
							addStringToFile(getLibraryFilePath(), data + '\n\n');
						} else if (choice === 'Enter key manually') {
							vscode.window.showInputBox({ prompt: 'Enter the BibTeX key', value: possibleKey})
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
			}
		}).catch(err => {
			console.error(err);
			this._view?.webview.postMessage({ type: 'stopLoading' });
		});
	}


	// Functions to handle vscode commands
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

	
}