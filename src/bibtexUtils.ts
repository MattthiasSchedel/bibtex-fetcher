export function parseBibTeXEntry(bibtexEntry: string): Record<string, string> {
	const result: Record<string, string> = {};
	const lines = bibtexEntry.split('\n');
  
	// Remove the first and last line (@Article{..., }).
	lines.shift();
	lines.pop();
  
	// Process each line.
	lines.forEach(line => {
	  	// Split the line into key and value.
		const match = line.match(/^\s*(\w+)\s*=\s*\{(.*)\},?$/);
		if (match) {
			const key = match[1];
			const value = match[2];
			result[key] = value;
	  	}
	});
  
	return result;
}

export function getBibTexKey(bibtexEntry: string): string | undefined {
	const match = bibtexEntry.match(/^\s*@(\w+)\s*\{(.+),/);
	if (match) {
		if (match[2] === "None") {
			return undefined;
		}
		return match[2];
	}
	return undefined;
}

export function replaceBibTexKey(bibtexEntry: string, key: string): string {
	const match = bibtexEntry.match(/^\s*@(\w+)\s*\{(.+),/);
	if (match) {
		return bibtexEntry.replace(match[2], key);
	}
	return bibtexEntry;
}