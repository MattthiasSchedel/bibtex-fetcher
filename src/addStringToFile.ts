import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';

export function addStringToFile(filename: string, content: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            reject(new Error('No workspace folder found.'));
            return;
        }

        const workspacePath = workspaceFolders[0].uri.fsPath;
        const filePath = path.resolve(workspacePath, filename);
        console.log(filePath);

        // Read the file content
        fs.readFile(filePath, { encoding: 'utf8' }, (error, fileContent) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    // File doesn't exist, create it
                    fs.writeFile(filePath, content, { encoding: 'utf8' }, (error2) => {
                        if (error2) {
                            reject(error2);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    reject(error);
                }
            } else {
                // Check if the content already exists in the file
                if (fileContent.includes(content)) {
                    reject(new Error('Citation already exists.'));
                    vscode.window.showErrorMessage('Citation already exists.');
                    return;
                }

                // Append the content to the file
                fs.appendFile(filePath, content, { encoding: 'utf8' }, (error3) => {
                    if (error3) {
                        reject(error3);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}
