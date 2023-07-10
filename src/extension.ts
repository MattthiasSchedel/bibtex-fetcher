// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "bibtex-manager" is now active!');


	// Register the file creation event listener
	let handleNewFile = vscode.workspace.onDidCreateFiles((event: vscode.FileCreateEvent) => {
		// Filter all files to just take PDFs into account
		const pdfFiles = event.files.filter(file => path.extname(file.fsPath) === '.pdf');
		
		// Process each PDF file
		pdfFiles.forEach(pdfFile => {
			const filePath = pdfFile.fsPath;
			// Perform any necessary actions for the new PDF file, such as generating the BibTeX citation key

			

			// and updating the data structure or tree view
			processNewPDF(filePath);
		});
	});
	
	context.subscriptions.push(handleNewFile);
}

// This method is called when your extension is deactivated
export function deactivate() {}

async function processNewPDF(filePath: string) {
	try {
		const pdfBytes = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
		const pdfDoc = await PDFDocument.load(pdfBytes);
	
		if (pdfDoc.getTitle() !== undefined){
			console.log('Author:', pdfDoc.getAuthor());
			console.log('Title:', pdfDoc.getTitle());
			console.log('Created:', pdfDoc.getCreationDate());

			let query = pdfDoc.getAuthor() + ' ' + pdfDoc.getTitle();

			fetchScholarArchive(query)
				.then((data) => {
					if (data) {
						// Process the fetched data
						console.log(data);

						// Add the data to a file
						const filename = 'library.bib';
						addStringToFile(filename, data + '\n\n')
							.then(() => {
								console.log('Data added to the file successfully.');
							})
							.catch((error) => {
								console.error('Error adding data to the file:', error);
							});
					} else {
						// No citation found
						console.log('No citation found.');
					}
				})
				.catch((error) => {
					// Handle errors
					console.error('Error fetching citation:', error);
				});
		}
		
		
		// Perform further actions with the extracted metadata
	} catch (error) {
	  	console.error('Error parsing PDF:', error);
	}
}

import * as https from 'https';

function fetchScholarArchive(q: string): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve, reject) => {
        // Prepare URL request
        const url = new URL('https://scholar.archive.org/search');
        url.searchParams.append('q', q);
        url.searchParams.append('limit', '1');

        // Make request
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const citeJsonLink = findFirstLink(data);
                if (citeJsonLink) {
                    https.get(citeJsonLink, (res2) => {
                        let data2 = '';
                        res2.on('data', (chunk2) => {
                            data2 += chunk2;
                        });
                        res2.on('end', () => {
                            resolve(data2);
                        });
                    }).on('error', (error2) => {
                        reject(error2);
                    });
                } else {
                    resolve(undefined);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

function findFirstLink(html: string): string | undefined {
    const pattern = /https:\/\/fatcat\.wiki\/release\/([^/]+)\.bib/;

    const match = html.match(pattern);
    if (match) {
        return match[0];
    }

    return undefined;
}

import * as fs from 'fs';

function addStringToFile(filename: string, content: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			reject(new Error('No workspace folder found.'));
			return;
		}

		const workspacePath = workspaceFolders[0].uri.fsPath;
		const filePath = path.resolve(workspacePath, filename);
		console.log(filePath);
        fs.appendFile(filePath, content, { encoding: 'utf8' }, (error) => {
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
                resolve();
            }
        });
    });
}