import { Paper } from './paper';
import { getKey, replaceKey } from './bibtex';

export type ResolvedKey = {
	bibtex: string;
	key: string | null;
	source: 'pattern' | 'upstream' | 'none';
	suggested: string | null;
};

export function resolveKey(opts: {
	rawBibtex: string;
	paper: Paper;
	pattern: string | null;
}): ResolvedKey {
	const { rawBibtex, paper, pattern } = opts;

	if (pattern) {
		const result = paper.getKey(pattern);
		if (result.ok) {
			return {
				bibtex: replaceKey(rawBibtex, result.key),
				key: result.key,
				source: 'pattern',
				suggested: null,
			};
		}
	}

	const upstream = getKey(rawBibtex);
	if (upstream) {
		return {
			bibtex: rawBibtex,
			key: upstream,
			source: 'upstream',
			suggested: null,
		};
	}

	const fallback = paper.getKey('\\t(0)');
	return {
		bibtex: rawBibtex,
		key: null,
		source: 'none',
		suggested: fallback.ok ? fallback.key : null,
	};
}
