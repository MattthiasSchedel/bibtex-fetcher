import * as vscode from 'vscode';

export interface ResolvedConfig {
	libraryFilePath: string;
	useBibKeyPattern: boolean;
	bibKeyPattern: string;
	semanticScholarApiKey: string | null;
}

export function readConfig(): ResolvedConfig {
	const c = vscode.workspace.getConfiguration('bibtexManager');
	const apiKey = c.get<string>('semanticScholar.apiKey', '').trim();
	return {
		libraryFilePath: c.get<string>('libraryFilePath', 'library'),
		useBibKeyPattern: c.get<boolean>('bibKey.usePattern', false),
		bibKeyPattern: c.get<string>('bibKey.pattern', '\\a(1)\\y'),
		semanticScholarApiKey: apiKey === '' ? null : apiKey,
	};
}

export function patternIfEnabled(c: ResolvedConfig): string | null {
	return c.useBibKeyPattern ? c.bibKeyPattern : null;
}
