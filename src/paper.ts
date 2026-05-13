import type { ApiPaper } from './messages';

export type KeyResult =
	| { ok: true; key: string }
	| { ok: false; missing: string[] };

export class Paper {
	readonly paperId: string;
	readonly title: string | null;
	readonly year: number | null;
	readonly doi: string | null;
	readonly authors: string[] | null;

	constructor(data: ApiPaper) {
		this.paperId = data.paperId;
		this.title = data.title;
		this.year = data.year;
		this.doi = data.externalIds?.DOI ?? null;
		this.authors = data.authors?.map((a) => a.name) ?? null;
	}

	getKey(pattern: string): KeyResult {
		const missing = new Set<string>();
		const need = (field: string): string => {
			missing.add(field);
			return '';
		};

		let key = pattern;
		key = key.replace(/\\a\((\d+)\)/g, (_, nRaw) => {
			const n = parseInt(nRaw, 10);
			return this.firstAuthorsLastName(n) ?? need('authors');
		});
		key = key.replace(/\\Y/g, () =>
			this.year !== null && this.year !== undefined ? this.year.toString() : need('year')
		);
		key = key.replace(/\\y/g, () =>
			this.year !== null && this.year !== undefined ? this.year.toString().slice(-2) : need('year')
		);
		key = key.replace(/\\T\((\d+)\)/g, (_, nRaw) => {
			const n = parseInt(nRaw, 10);
			return this.shortTitle(n) ?? need('title');
		});
		key = key.replace(/\\t\((\d+)\)/g, (_, nRaw) => {
			const n = parseInt(nRaw, 10);
			return this.firstLetterTitle(n) ?? need('title');
		});
		key = key.replace(/\\D/g, () => this.doi ?? need('doi'));

		if (missing.size > 0) {
			return { ok: false, missing: Array.from(missing) };
		}
		return { ok: true, key };
	}

	private firstAuthorsLastName(n: number): string | null {
		if (!this.authors || this.authors.length === 0) {
			return null;
		}
		const list = n === 0 ? this.authors : this.authors.slice(0, n);
		return list
			.map((name) => name.trim().split(/\s+/).slice(-1)[0] ?? '')
			.join('');
	}

	private titleWords(n: number): string[] | null {
		if (!this.title) {
			return null;
		}
		const words = this.title.split(/\s+/).filter(Boolean);
		return n === 0 ? words : words.slice(0, n);
	}

	private shortTitle(n: number): string | null {
		const words = this.titleWords(n);
		if (!words) {
			return null;
		}
		return words.map((w) => w.replace(/[^a-zA-Z]/g, '')).join('');
	}

	private firstLetterTitle(n: number): string | null {
		const words = this.titleWords(n);
		if (!words) {
			return null;
		}
		return words
			.map((w) => w.replace(/[^a-zA-Z]/g, '').charAt(0))
			.join('');
	}
}
