import * as assert from 'assert';
import { parse, getKey, replaceKey } from '../../src/bibtex';

suite('bibtex.parse', () => {
	test('parses a single entry', () => {
		const src = '@article{foo2020, title = {Hello}, year = {2020}}';
		const entries = parse(src);
		assert.strictEqual(entries.length, 1);
		assert.strictEqual(entries[0].type, 'article');
		assert.strictEqual(entries[0].key, 'foo2020');
	});

	test('parses multiple entries', () => {
		const src = `@article{a, title={x}}\n@inproceedings{b, title={y}}`;
		const entries = parse(src);
		assert.strictEqual(entries.length, 2);
		assert.deepStrictEqual(
			entries.map((e) => e.key),
			['a', 'b']
		);
	});

	test('handles nested braces and multi-line values', () => {
		const src =
			'@article{foo,\n  title = {Hello {World}},\n  abstract = {Line1\nLine2}\n}';
		const entries = parse(src);
		assert.strictEqual(entries.length, 1);
		assert.strictEqual(entries[0].key, 'foo');
	});

	test('handles entries separated by junk text', () => {
		const src = `% comment\n@article{a, title={x}}\nsome stray text\n@book{b, title={y}}\n`;
		const entries = parse(src);
		assert.deepStrictEqual(
			entries.map((e) => e.key),
			['a', 'b']
		);
	});
});

suite('bibtex.getKey', () => {
	test('extracts key', () => {
		assert.strictEqual(getKey('@article{foo, title={x}}'), 'foo');
	});

	test('returns null for "None" placeholder', () => {
		assert.strictEqual(getKey('@article{None, title={x}}'), null);
	});

	test('returns null when header is malformed', () => {
		assert.strictEqual(getKey('not a bibtex entry'), null);
	});
});

suite('bibtex.replaceKey', () => {
	test('replaces key in header', () => {
		const out = replaceKey('@article{old, title={hi}}', 'newKey');
		assert.strictEqual(getKey(out), 'newKey');
	});

	test('does not touch body when key string collides with body text', () => {
		const src = '@article{old, title={the word old appears here}}';
		const out = replaceKey(src, 'newKey');
		assert.strictEqual(getKey(out), 'newKey');
		assert.ok(
			out.includes('old appears here'),
			'body occurrence of "old" must be preserved'
		);
	});

	test('returns input unchanged when header is missing', () => {
		assert.strictEqual(replaceKey('garbage', 'k'), 'garbage');
	});
});
