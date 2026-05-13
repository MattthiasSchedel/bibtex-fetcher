import * as path from 'path';
import Mocha from 'mocha';
import glob = require('glob');

export function run(): Promise<void> {
	const mocha = new Mocha({ ui: 'tdd', color: true });
	const testsRoot = path.resolve(__dirname, '..');

	return new Promise((resolve, reject) => {
		glob('**/*.test.js', { cwd: testsRoot }, (err, files) => {
			if (err) {
				reject(err);
				return;
			}
			files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));
			try {
				mocha.run((failures) => {
					if (failures > 0) {
						reject(new Error(`${failures} tests failed.`));
					} else {
						resolve();
					}
				});
			} catch (e) {
				reject(e);
			}
		});
	});
}
