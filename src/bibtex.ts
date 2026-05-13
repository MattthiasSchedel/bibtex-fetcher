export type BibEntry = {
	type: string;
	key: string;
	raw: string;
};

const HEADER_RE = /^@(\w+)\s*\{\s*([^,\s}]+)\s*,/;

export function parse(source: string): BibEntry[] {
	const entries: BibEntry[] = [];
	let i = 0;

	while (i < source.length) {
		while (i < source.length && source[i] !== '@') {
			i++;
		}
		if (i >= source.length) {
			break;
		}

		const start = i;
		i++;

		let typeEnd = i;
		while (typeEnd < source.length && /[a-zA-Z]/.test(source[typeEnd])) {
			typeEnd++;
		}
		const type = source.slice(i, typeEnd);
		if (!type) {
			i = typeEnd + 1;
			continue;
		}
		i = typeEnd;

		while (i < source.length && /\s/.test(source[i])) {
			i++;
		}
		if (source[i] !== '{') {
			continue;
		}
		i++;

		let depth = 1;
		let inQuotes = false;
		while (i < source.length && depth > 0) {
			const ch = source[i];
			if (ch === '\\' && i + 1 < source.length) {
				i += 2;
				continue;
			}
			if (inQuotes) {
				if (ch === '"') {
					inQuotes = false;
				}
			} else if (ch === '"') {
				inQuotes = true;
			} else if (ch === '{') {
				depth++;
			} else if (ch === '}') {
				depth--;
			}
			i++;
		}

		const raw = source.slice(start, i);
		const headerMatch = raw.match(HEADER_RE);
		const key = headerMatch ? headerMatch[2] : '';
		entries.push({ type: type.toLowerCase(), key, raw });
	}

	return entries;
}

export function getKey(entryRaw: string): string | null {
	const m = entryRaw.match(HEADER_RE);
	if (!m) {
		return null;
	}
	const key = m[2];
	if (!key || key === 'None') {
		return null;
	}
	return key;
}

export function replaceKey(entryRaw: string, newKey: string): string {
	const m = entryRaw.match(/^(@\w+\s*\{\s*)([^,\s}]+)(\s*,)/);
	if (!m) {
		return entryRaw;
	}
	const prefix = m[1];
	const suffix = m[3];
	const rest = entryRaw.slice(m[0].length);
	return prefix + newKey + suffix + rest;
}
