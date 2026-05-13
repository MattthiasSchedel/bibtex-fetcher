export type Author = { name: string };

export type ApiPaper = {
	paperId: string;
	title: string | null;
	year: number | null;
	authors: Author[] | null;
	// eslint-disable-next-line @typescript-eslint/naming-convention
	externalIds: { DOI?: string | null } | null;
};

export type HostToWebview =
	| { type: 'papers'; papers: ApiPaper[] }
	| { type: 'error'; message: string }
	| { type: 'clearPaperList' }
	| { type: 'loading' }
	| { type: 'stopLoading' }
	| { type: 'searchForPaper'; query: string };

export type WebviewToHost =
	| { type: 'searchPaper'; query: string }
	| { type: 'getBibTeX'; paperId: string }
	| { type: 'debug'; message: string };
