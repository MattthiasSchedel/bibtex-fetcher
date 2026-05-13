import * as assert from 'assert';
import { resolveKey } from '../../src/resolveKey';
import { Paper } from '../../src/paper';
import type { ApiPaper } from '../../src/messages';

const apiPaper: ApiPaper = {
	paperId: 'p',
	title: 'Hello World',
	year: 2024,
	authors: [{ name: 'Jane Doe' }],
	externalIds: { DOI: '10.1/abc' },
};

suite('resolveKey', () => {
	test('uses pattern when it resolves and rewrites the entry header', () => {
		const r = resolveKey({
			rawBibtex: '@article{None, title={x}}',
			paper: new Paper(apiPaper),
			pattern: '\\a(1)\\y',
		});
		assert.strictEqual(r.source, 'pattern');
		assert.strictEqual(r.key, 'Doe24');
		assert.match(r.bibtex, /@article\{Doe24,/);
	});

	test('falls back to upstream key when no pattern enabled', () => {
		const r = resolveKey({
			rawBibtex: '@article{existing, title={x}}',
			paper: new Paper(apiPaper),
			pattern: null,
		});
		assert.strictEqual(r.source, 'upstream');
		assert.strictEqual(r.key, 'existing');
		assert.match(r.bibtex, /@article\{existing/);
	});

	test('falls back to upstream when pattern misses', () => {
		const r = resolveKey({
			rawBibtex: '@article{existing, title={x}}',
			paper: new Paper({ ...apiPaper, authors: null }),
			pattern: '\\a(1)\\y',
		});
		assert.strictEqual(r.source, 'upstream');
		assert.strictEqual(r.key, 'existing');
	});

	test('returns none with a suggestion when both pattern and upstream are missing', () => {
		const r = resolveKey({
			rawBibtex: '@article{None, title={x}}',
			paper: new Paper({ ...apiPaper, authors: null }),
			pattern: '\\a(1)\\y',
		});
		assert.strictEqual(r.source, 'none');
		assert.strictEqual(r.key, null);
		assert.strictEqual(r.suggested, 'HW');
	});
});
