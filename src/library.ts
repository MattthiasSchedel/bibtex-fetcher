import * as fsNode from 'fs';
import * as path from 'path';
import { parse, getKey } from './bibtex';

export interface FsLike {
	existsSync(p: string): boolean;
	readFileSync(p: string, enc: BufferEncoding): string;
	appendFileSync(p: string, data: string, enc: BufferEncoding): void;
	writeFileSync(p: string, data: string, enc: BufferEncoding): void;
}

export type AppendResult =
	| { status: 'added'; path: string }
	| { status: 'duplicate'; key: string; path: string };

export class Library {
	constructor(
		private readonly fs: FsLike,
		private readonly workspaceRoot: string | null
	) {}

	resolvePath(libraryFilePath: string): string {
		const ensured = path.extname(libraryFilePath)
			? libraryFilePath
			: `${libraryFilePath}.bib`;
		if (path.isAbsolute(ensured)) {
			return ensured;
		}
		if (!this.workspaceRoot) {
			throw new Error(
				'No workspace folder is open; cannot resolve relative library path.'
			);
		}
		return path.join(this.workspaceRoot, ensured);
	}

	append(libraryFilePath: string, entry: string): AppendResult {
		const file = this.resolvePath(libraryFilePath);
		const parent = path.dirname(file);
		if (!this.fs.existsSync(parent)) {
			throw new Error(`Parent folder does not exist: ${parent}`);
		}
		const text = entry.trimEnd() + '\n\n';

		if (!this.fs.existsSync(file)) {
			this.fs.writeFileSync(file, text, 'utf8');
			return { status: 'added', path: file };
		}

		const newKey = getKey(entry);
		if (newKey) {
			const existing = this.fs.readFileSync(file, 'utf8');
			const dup = parse(existing).find((e) => e.key === newKey);
			if (dup) {
				return { status: 'duplicate', key: newKey, path: file };
			}
		}
		this.fs.appendFileSync(file, text, 'utf8');
		return { status: 'added', path: file };
	}
}

export const nodeFs: FsLike = fsNode;
