import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	test('extension activates', async () => {
		const ext = vscode.extensions.getExtension('matthiasschedel.bibtex-manager');
		assert.ok(ext, 'extension is installed');
		await ext!.activate();
		assert.ok(ext!.isActive, 'extension is active');
	});
});
