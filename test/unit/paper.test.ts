import * as assert from 'assert';
import { Paper } from '../../src/paper';
import type { ApiPaper } from '../../src/messages';

function make(overrides: Partial<ApiPaper> = {}): Paper {
	const base: ApiPaper = {
		paperId: 'p1',
		title: 'Hello World of BibTeX',
		year: 2020,
		authors: [
			{ name: 'Jane Doe' },
			{ name: 'John Smith' },
			{ name: 'Foo Bar' },
		],
		externalIds: { DOI: '10.14722/ndss.2022.23156' },
		...overrides,
	};
	return new Paper(base);
}

suite('Paper.getKey', () => {
	test('\\D preserves the full DOI (regression: was truncated to publisher prefix)', () => {
		const r = make().getKey('\\D');
		assert.ok(r.ok);
		assert.strictEqual(r.key, '10.14722/ndss.2022.23156');
	});

	test('\\a(2) joins first two last names', () => {
		const r = make().getKey('\\a(2)');
		assert.ok(r.ok && r.key === 'DoeSmith');
	});

	test('\\a(0) joins all last names', () => {
		const r = make().getKey('\\a(0)');
		assert.ok(r.ok && r.key === 'DoeSmithBar');
	});

	test('multi-digit n is supported (regression: was capped at single digit)', () => {
		const authors = Array.from({ length: 12 }, (_, i) => ({
			name: `Author Last${i}`,
		}));
		const r = make({ authors }).getKey('\\a(12)');
		const expected = Array.from({ length: 12 }, (_, i) => `Last${i}`).join('');
		assert.ok(r.ok && r.key === expected);
	});

	test('\\y returns two-digit year', () => {
		const r = make().getKey('\\y');
		assert.ok(r.ok && r.key === '20');
	});

	test('\\T(0) concatenates all alphabetical title words', () => {
		const r = make().getKey('\\T(0)');
		assert.ok(r.ok && r.key === 'HelloWorldofBibTeX');
	});

	test('\\t(0) takes first letter of each title word', () => {
		const r = make({ title: 'Hello World' }).getKey('\\t(0)');
		assert.ok(r.ok && r.key === 'HW');
	});

	test('combined pattern', () => {
		const r = make().getKey('\\a(1)\\y');
		assert.ok(r.ok && r.key === 'Doe20');
	});

	test('returns ok:false with missing list when fields are absent', () => {
		const r = make({ authors: null, year: null }).getKey('\\a(1)\\y');
		assert.ok(!r.ok);
		assert.deepStrictEqual(r.missing.sort(), ['authors', 'year']);
	});

	test('missing DOI is reported', () => {
		const r = make({ externalIds: { DOI: null } }).getKey('\\D');
		assert.ok(!r.ok && r.missing.includes('doi'));
	});
});
