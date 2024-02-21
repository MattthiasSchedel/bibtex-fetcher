import * as vscode from 'vscode';

export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export function getLibraryFilePath() {
    // Retrieve the library file path from the settings
    const config = vscode.workspace.getConfiguration();
    const filePath = config.get('libraryFilePath');
    return filePath as string;
}

export function getBibKeyPattern() {
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