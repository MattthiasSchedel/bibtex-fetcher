import * as assert from 'assert';
import * as path from 'path';
import { Library, FsLike } from '../../src/library';

function makeFs(initial: Record<string, string> = {}): FsLike & {
	files: Record<string, string>;
	dirs: Set<string>;
} {
	const files: Record<string, string> = { ...initial };
	const dirs = new Set<string>();
	dirs.add('/ws');
	dirs.add('/ws/sub');
	dirs.add('/abs');
	for (const p of Object.keys(files)) {
		dirs.add(path.dirname(p));
	}
	return {
		files,
		dirs,
		existsSync(p: string) {
			return Object.prototype.hasOwnProperty.call(files, p) || dirs.has(p);
		},
		readFileSync(p: string) {
			return files[p];
		},
		appendFileSync(p: string, data: string) {
			files[p] = (files[p] ?? '') + data;
		},
		writeFileSync(p: string, data: string) {
			files[p] = data;
		},
	};
}

suite('Library.resolvePath', () => {
	test('appends .bib when extension is missing', () => {
		const lib = new Library(makeFs(), '/ws');
		assert.strictEqual(lib.resolvePath('library'), '/ws/library.bib');
	});

	test('keeps explicit extension', () => {
		const lib = new Library(makeFs(), '/ws');
		assert.strictEqual(lib.resolvePath('refs.bib'), '/ws/refs.bib');
	});

	test('absolute path passes through', () => {
		const lib = new Library(makeFs(), '/ws');
		assert.strictEqual(lib.resolvePath('/abs/foo.bib'), '/abs/foo.bib');
	});

	test('throws when relative and no workspace', () => {
		const lib = new Library(makeFs(), null);
		assert.throws(() => lib.resolvePath('library'));
	});
});

suite('Library.append', () => {
	test('writes new file when missing', () => {
		const fs = makeFs();
		const lib = new Library(fs, '/ws');
		const r = lib.append('library', '@article{a, title={x}}');
		assert.strictEqual(r.status, 'added');
		assert.match(fs.files['/ws/library.bib'], /@article\{a/);
	});

	test('detects duplicate by key, not substring', () => {
		const fs = makeFs({
			'/ws/library.bib': '@article{a, title={original body}}\n',
		});
		const lib = new Library(fs, '/ws');
		const r = lib.append('library.bib', '@article{a, title={different body}}');
		assert.deepStrictEqual(r, {
			status: 'duplicate',
			key: 'a',
			path: '/ws/library.bib',
		});
	});

	test('appends when keys differ', () => {
		const fs = makeFs({ '/ws/library.bib': '@article{a, title={x}}\n' });
		const lib = new Library(fs, '/ws');
		const r = lib.append('library.bib', '@article{b, title={y}}');
		assert.strictEqual(r.status, 'added');
		assert.ok(fs.files['/ws/library.bib'].includes('@article{a'));
		assert.ok(fs.files['/ws/library.bib'].includes('@article{b'));
	});

	test('throws when parent folder missing', () => {
		const fs = makeFs();
		const lib = new Library(fs, '/ws');
		assert.throws(() => lib.append('missing/library', '@article{a}'));
	});
});
