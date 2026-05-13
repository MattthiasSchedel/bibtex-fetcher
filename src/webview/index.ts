import type { ApiPaper, HostToWebview, WebviewToHost } from '../messages';
import { el, getRequired } from './dom';

declare function acquireVsCodeApi(): {
	postMessage(message: WebviewToHost): void;
};

const vscode = acquireVsCodeApi();
const paperListElem = getRequired<HTMLDivElement>('paperList');
const loadingElem = getRequired<HTMLDivElement>('loading');
const errorBanner = getRequired<HTMLDivElement>('errorBanner');
const searchForm = getRequired<HTMLFormElement>('paperSearchForm');
const titleInput = getRequired<HTMLInputElement>('paperTitle');

function clearPaperList(): void {
	paperListElem.textContent = '';
}

function showLoading(): void {
	loadingElem.innerHTML = '';
	const bar = el('div', { className: 'progress-bar' });
	bar.appendChild(el('div', { className: 'progress-bar-value' }));
	loadingElem.appendChild(bar);
}

function hideLoading(): void {
	loadingElem.textContent = '';
}

function showError(message: string): void {
	errorBanner.textContent = message;
	errorBanner.hidden = false;
}

function clearError(): void {
	errorBanner.textContent = '';
	errorBanner.hidden = true;
}

function authorsLine(paper: ApiPaper): string {
	return (paper.authors ?? []).map((a) => a.name).join(', ');
}

function renderPapers(papers: ApiPaper[]): void {
	clearPaperList();
	if (papers.length === 0) {
		paperListElem.appendChild(
			el('div', { className: 'empty', text: 'No papers found.' })
		);
		return;
	}

	const ul = el('ul', { className: 'list' });
	for (const paper of papers) {
		const li = document.createElement('li');
		const entry = el('div', { className: 'paper-entry' });
		entry.appendChild(
			el('div', { className: 'paper-title', text: paper.title ?? '(no title)' })
		);
		entry.appendChild(
			el('div', { className: 'paper-authors', text: authorsLine(paper) })
		);
		const button = el('button', {
			className: 'bibtex-button',
			text: 'Get BibTeX',
		});
		button.type = 'button';
		button.addEventListener('click', (e) => {
			e.stopPropagation();
			vscode.postMessage({ type: 'getBibTeX', paperId: paper.paperId });
		});
		entry.appendChild(button);
		li.appendChild(entry);
		ul.appendChild(li);
	}
	paperListElem.appendChild(ul);
}

function submitSearch(query: string): void {
	clearError();
	clearPaperList();
	vscode.postMessage({ type: 'searchPaper', query });
}

searchForm.addEventListener('submit', (e) => {
	e.preventDefault();
	submitSearch(titleInput.value);
});

window.addEventListener('message', (event: MessageEvent<HostToWebview>) => {
	const msg = event.data;
	switch (msg.type) {
		case 'papers':
			renderPapers(msg.papers);
			return;
		case 'error':
			renderPapers([]);
			showError(msg.message);
			return;
		case 'clearPaperList':
			clearPaperList();
			clearError();
			return;
		case 'loading':
			showLoading();
			return;
		case 'stopLoading':
			hideLoading();
			return;
		case 'searchForPaper':
			titleInput.value = msg.query;
			submitSearch(msg.query);
			return;
	}
});
