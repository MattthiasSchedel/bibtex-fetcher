import type { ApiPaper } from './messages';

const SEARCH_URL = 'https://api.semanticscholar.org/graph/v1/paper/search';
const PAPER_URL = 'https://api.semanticscholar.org/graph/v1/paper/';
const SEARCH_FIELDS = 'authors,title,year,externalIds';

const MAX_ATTEMPTS = 3;
const MAX_BACKOFF_MS = 4000;

export class SemanticScholarError extends Error {
	status?: number;

	constructor(message: string, readonly cause?: unknown) {
		super(message);
		this.name = 'SemanticScholarError';
	}
}

export class SemanticScholarClient {
	constructor(private readonly apiKey: string | null = null) {}

	async search(
		query: string,
		limit: number,
		signal?: AbortSignal
	): Promise<ApiPaper[]> {
		const url = new URL(SEARCH_URL);
		url.searchParams.set('query', query);
		url.searchParams.set('offset', '0');
		url.searchParams.set('limit', String(limit));
		url.searchParams.set('fields', SEARCH_FIELDS);

		const body = await this.fetchJson(url, signal);
		const data = (body as { data?: unknown }).data;
		if (!Array.isArray(data)) {
			return [];
		}
		return data.map(normalizePaper);
	}

	async getBibtex(
		paperId: string,
		signal?: AbortSignal
	): Promise<string | null> {
		const url = new URL(PAPER_URL + encodeURIComponent(paperId));
		url.searchParams.set('fields', 'citationStyles');
		const body = (await this.fetchJson(url, signal)) as {
			citationStyles?: { bibtex?: string };
		};
		return body.citationStyles?.bibtex ?? null;
	}

	private async fetchJson(url: URL, signal?: AbortSignal): Promise<unknown> {
		const headers: Record<string, string> = {};
		if (this.apiKey) {
			headers['x-api-key'] = this.apiKey;
		}

		let lastErr: SemanticScholarError | null = null;
		for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
			if (signal?.aborted) {
				throw makeAbortError();
			}

			let res: Response;
			try {
				res = await fetch(url, { signal, headers });
			} catch (err) {
				if ((err as { name?: string }).name === 'AbortError') {
					throw err;
				}
				lastErr = new SemanticScholarError('Network request failed', err);
				if (attempt < MAX_ATTEMPTS - 1) {
					await delay(500 * (attempt + 1), signal);
					continue;
				}
				throw lastErr;
			}

			if (res.ok) {
				try {
					return await res.json();
				} catch (err) {
					throw new SemanticScholarError('Failed to parse JSON response', err);
				}
			}

			const err = new SemanticScholarError(
				`Semantic Scholar returned ${res.status} ${res.statusText}`.trim()
			);
			err.status = res.status;

			const retryable = res.status === 429 || res.status === 503;
			if (!retryable || attempt === MAX_ATTEMPTS - 1) {
				throw err;
			}

			const retryAfterMs = parseRetryAfter(res.headers.get('retry-after'));
			const backoff =
				retryAfterMs ?? Math.min(1000 * Math.pow(2, attempt), MAX_BACKOFF_MS);
			await delay(backoff, signal);
			lastErr = err;
		}

		throw lastErr ?? new SemanticScholarError('Exhausted retries');
	}
}

function normalizePaper(raw: unknown): ApiPaper {
	const r = raw as {
		paperId?: string;
		title?: string | null;
		year?: number | null;
		authors?: Array<{ name?: string }> | null;
		// eslint-disable-next-line @typescript-eslint/naming-convention
		externalIds?: { DOI?: string | null } | null;
	};
	return {
		paperId: r.paperId ?? '',
		title: r.title ?? null,
		year: r.year ?? null,
		authors:
			r.authors?.map((a) => ({ name: a?.name ?? '' })).filter((a) => a.name) ??
			null,
		externalIds: r.externalIds ?? null,
	};
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(makeAbortError());
			return;
		}
		const timer = setTimeout(() => {
			signal?.removeEventListener('abort', onAbort);
			resolve();
		}, ms);
		const onAbort = (): void => {
			clearTimeout(timer);
			reject(makeAbortError());
		};
		signal?.addEventListener('abort', onAbort, { once: true });
	});
}

function parseRetryAfter(value: string | null): number | null {
	if (!value) {
		return null;
	}
	const seconds = Number(value);
	if (Number.isFinite(seconds) && seconds >= 0) {
		return Math.min(seconds * 1000, MAX_BACKOFF_MS);
	}
	const date = Date.parse(value);
	if (!Number.isNaN(date)) {
		return Math.max(0, Math.min(date - Date.now(), MAX_BACKOFF_MS));
	}
	return null;
}

function makeAbortError(): Error {
	const err = new Error('Aborted');
	err.name = 'AbortError';
	return err;
}
