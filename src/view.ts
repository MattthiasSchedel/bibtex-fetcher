import * as vscode from 'vscode';
import type { HostToWebview, WebviewToHost } from './messages';
import { Paper } from './paper';
import { Library } from './library';
import { SemanticScholarClient } from './semanticScholar';
import { readConfig, patternIfEnabled } from './config';
import { resolveKey } from './resolveKey';
import { replaceKey } from './bibtex';
import { Logger } from './logger';

const SEARCH_LIMIT = 5;

export class SearchView implements vscode.WebviewViewProvider {
	static readonly viewType = 'searchView';

	private view: vscode.WebviewView | undefined;
	private pendingSearch: string | null = null;
	private readonly papers = new Map<string, Paper>();
	private searchController: AbortController | null = null;
	private bibtexController: AbortController | null = null;

	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly library: Library,
		private readonly logger: Logger
	) {}

	resolveWebviewView(view: vscode.WebviewView): void {
		this.view = view;
		view.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri],
		};
		view.webview.html = this.renderHtml(view.webview);
		view.webview.onDidReceiveMessage((msg: WebviewToHost) =>
			this.onMessage(msg)
		);
		view.onDidDispose(() => {
			this.view = undefined;
			this.abortAll();
		});

		if (this.pendingSearch) {
			this.post({ type: 'searchForPaper', query: this.pendingSearch });
			this.pendingSearch = null;
		}
	}

	queueSearch(query: string): void {
		if (this.view) {
			this.post({ type: 'searchForPaper', query });
		} else {
			this.pendingSearch = query;
		}
	}

	clearPapers(): void {
		this.papers.clear();
		this.post({ type: 'clearPaperList' });
	}

	private onMessage(msg: WebviewToHost): void {
		switch (msg.type) {
			case 'searchPaper':
				this.handleSearch(msg.query);
				return;
			case 'getBibTeX':
				this.handleGetBibTeX(msg.paperId);
				return;
			case 'debug':
				this.logger.info(`[webview] ${msg.message}`);
				return;
		}
	}

	private async handleSearch(query: string): Promise<void> {
		const trimmed = query.trim();
		if (!trimmed) {
			return;
		}
		this.searchController?.abort();
		const controller = new AbortController();
		this.searchController = controller;

		this.post({ type: 'loading' });
		try {
			const client = new SemanticScholarClient(
				readConfig().semanticScholarApiKey
			);
			const papers = await client.search(
				trimmed,
				SEARCH_LIMIT,
				controller.signal
			);
			if (controller.signal.aborted) {
				return;
			}
			this.papers.clear();
			for (const p of papers) {
				this.papers.set(p.paperId, new Paper(p));
			}
			this.post({ type: 'papers', papers });
		} catch (err) {
			if (this.isAbort(err)) {
				return;
			}
			this.logger.error('Search failed', err);
			this.post({ type: 'error', message: searchErrorMessage(err) });
		} finally {
			if (this.searchController === controller) {
				this.searchController = null;
			}
			this.post({ type: 'stopLoading' });
		}
	}

	private async handleGetBibTeX(paperId: string): Promise<void> {
		const paper = this.papers.get(paperId);
		if (!paper) {
			this.logger.warn(`Unknown paperId requested: ${paperId}`);
			return;
		}
		this.bibtexController?.abort();
		const controller = new AbortController();
		this.bibtexController = controller;

		this.post({ type: 'loading' });
		try {
			const config = readConfig();
			const client = new SemanticScholarClient(config.semanticScholarApiKey);
			const raw = await client.getBibtex(paperId, controller.signal);
			if (controller.signal.aborted) {
				return;
			}
			if (!raw) {
				vscode.window.showErrorMessage('No BibTeX available for this paper.');
				return;
			}

			const resolved = resolveKey({
				rawBibtex: raw,
				paper,
				pattern: patternIfEnabled(config),
			});

			if (resolved.key) {
				await this.writeEntry(config.libraryFilePath, resolved.bibtex);
				return;
			}

			const choice = await vscode.window.showErrorMessage(
				'BibTeX has no key.',
				'Add without key',
				'Enter key manually'
			);
			if (choice === 'Add without key') {
				await this.writeEntry(config.libraryFilePath, resolved.bibtex);
			} else if (choice === 'Enter key manually') {
				const key = await vscode.window.showInputBox({
					prompt: 'Enter the BibTeX key',
					value: resolved.suggested ?? '',
				});
				if (key) {
					await this.writeEntry(
						config.libraryFilePath,
						replaceKey(resolved.bibtex, key)
					);
				}
			}
		} catch (err) {
			if (this.isAbort(err)) {
				return;
			}
			this.logger.error('Fetching BibTeX failed', err);
			vscode.window.showErrorMessage(bibtexErrorMessage(err));
		} finally {
			if (this.bibtexController === controller) {
				this.bibtexController = null;
			}
			this.post({ type: 'stopLoading' });
		}
	}

	private async writeEntry(libraryPath: string, entry: string): Promise<void> {
		try {
			const result = this.library.append(libraryPath, entry);
			if (result.status === 'duplicate') {
				vscode.window.showInformationMessage(
					`Entry "${result.key}" already exists in ${result.path}.`
				);
			}
		} catch (err) {
			this.logger.error('Writing library file failed', err);
			vscode.window.showErrorMessage(
				err instanceof Error ? err.message : 'Failed to write library file.'
			);
		}
	}

	private abortAll(): void {
		this.searchController?.abort();
		this.bibtexController?.abort();
		this.searchController = null;
		this.bibtexController = null;
	}

	private isAbort(err: unknown): boolean {
		return (err as { name?: string } | null)?.name === 'AbortError';
	}

	private post(msg: HostToWebview): void {
		this.view?.webview.postMessage(msg);
	}

	private renderHtml(webview: vscode.Webview): string {
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'out', 'webview.js')
		);
		const resetUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'media', 'reset.css')
		);
		const vscodeUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'media', 'vscode.css')
		);
		const mainUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'media', 'main.css')
		);
		const nonce = makeNonce();

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link href="${resetUri}" rel="stylesheet">
	<link href="${vscodeUri}" rel="stylesheet">
	<link href="${mainUri}" rel="stylesheet">
	<title>Search BibTeX</title>
</head>
<body>
	<form id="paperSearchForm">
		<label for="paperTitle">Enter the name of a scientific paper:</label>
		<input type="text" id="paperTitle" name="paperTitle" required>
		<button type="submit">Search</button>
	</form>
	<div id="loading"></div>
	<div id="errorBanner" hidden></div>
	<div id="paperList"></div>
	<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
	}
}

const RATE_LIMIT_HINT =
	'Semantic Scholar is rate-limiting requests. Wait a moment and try again, or set bibtexManager.semanticScholar.apiKey in settings (request a key at https://www.semanticscholar.org/product/api#api-key).';

function statusOf(err: unknown): number | undefined {
	return (err as { status?: number } | null)?.status;
}

function searchErrorMessage(err: unknown): string {
	return statusOf(err) === 429
		? RATE_LIMIT_HINT
		: 'Search failed. See output channel.';
}

function bibtexErrorMessage(err: unknown): string {
	return statusOf(err) === 429
		? RATE_LIMIT_HINT
		: 'Could not fetch BibTeX. See BibTeX Manager output channel.';
}

function makeNonce(): string {
	const possible =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let text = '';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
