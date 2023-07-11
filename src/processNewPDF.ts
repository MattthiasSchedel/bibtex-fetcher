import * as vscode from 'vscode';
import { PDFDocument } from 'pdf-lib';
import { fetchScholarArchive } from './fetchScholarArchive';
import { addStringToFile } from './addStringToFile';

export async function processNewPDF(filePath: string) {
	try {
		const pdfBytes = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
		const pdfDoc = await PDFDocument.load(pdfBytes);
	
		let author = pdfDoc.getAuthor();
		let title = pdfDoc.getTitle();

        title = undefined; // always ask to type in title

		if (title === undefined) {
			// Prompt the user to input the author and title
			const inputOptions: vscode.InputBoxOptions = {
				prompt: 'Enter the author for the PDF file',
				placeHolder: 'Author',
			};

			let userInput = await vscode.window.showInputBox(inputOptions);
			if (userInput) {
				author = userInput;

                // Prompt the user to input the author and title
                const inputOptions: vscode.InputBoxOptions = {
                    prompt: 'Enter the title for the PDF file',
                    placeHolder: 'Title',
			    };

                userInput = await vscode.window.showInputBox(inputOptions);
                if (userInput) {
                    title = userInput;
                } else {
                    // User canceled the input, return without further processing
                    return;
                }
			} else {
				// User canceled the input, return without further processing
				return;
			}


		}

		console.log('Author:', author);
		console.log('Title:', title);
		console.log('Created:', pdfDoc.getCreationDate());

		let query = author + ' ' + title;

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
		
		// Perform further actions with the extracted metadata
	} catch (error) {
		console.error('Error parsing PDF:', error);
	}
}
