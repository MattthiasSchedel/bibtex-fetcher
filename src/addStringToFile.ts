import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';

export function addStringToFile(filePath: string, content: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            reject(new Error('No workspace folder found.'));
            return;
        }

        const workspacePath = workspaceFolders[0].uri.fsPath;
        const resolvedFilePath = resolveFilePath(workspacePath, filePath);

        console.log(resolvedFilePath);

        // Check if the parent folder exists
        const parentFolder = path.dirname(resolvedFilePath);
        if (!fs.existsSync(parentFolder)) {
            const errorMessage = `The folder "${parentFolder}" does not exist.`;
            vscode.window.showErrorMessage(errorMessage);
            reject(new Error(errorMessage));
            return;
        }

        // Read the file content
        fs.readFile(resolvedFilePath, { encoding: 'utf8' }, (error, fileContent) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    // File doesn't exist, create it
                    fs.writeFile(resolvedFilePath, content, { encoding: 'utf8' }, (error2) => {
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
                fs.appendFile(resolvedFilePath, content, { encoding: 'utf8' }, (error3) => {
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

function resolveFilePath(workspacePath: string, filePath: string): string {
    // If the filePath doesn't have a file extension, add .bib
    if (!path.extname(filePath)) {
        filePath += '.bib';
    }

    // Join the filePath with the workspacePath to resolve the absolute file path
    const resolvedFilePath = path.join(workspacePath, filePath);

    return resolvedFilePath;
}
