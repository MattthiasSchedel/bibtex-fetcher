import * as vscode from 'vscode';

export class Logger {
	private readonly channel: vscode.OutputChannel;

	constructor(name = 'BibTeX Manager') {
		this.channel = vscode.window.createOutputChannel(name);
	}

	info(msg: string): void {
		this.channel.appendLine(`[info] ${msg}`);
	}

	warn(msg: string): void {
		this.channel.appendLine(`[warn] ${msg}`);
	}

	error(msg: string, err?: unknown): void {
		const detail =
			err instanceof Error
				? `${err.message}${err.stack ? '\n' + err.stack : ''}`
				: err !== null && err !== undefined
					? String(err)
					: '';
		this.channel.appendLine(`[error] ${msg}${detail ? '\n' + detail : ''}`);
	}

	dispose(): void {
		this.channel.dispose();
	}
}
