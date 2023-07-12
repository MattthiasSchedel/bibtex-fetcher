import { fetchScholarArchive } from './fetchScholarArchive';
import { fetchDBLP } from './fetchDBLP';
import { addStringToFile } from './addStringToFile';
import * as vscode from 'vscode';

export function addCitation() {
    console.log('Add Citation button clicked!');
    const clipboardText = vscode.env.clipboard.readText();

    // Show progress notification while fetching the citation
    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Looking up BibTeX',
            cancellable: false
        },
        (progress) => {
            return new Promise<void>((resolve) => {
                clipboardText.then((text) => {
                    let progressTitle = 'DBLP';
                    let fetchFunction = fetchDBLP;

                    const updateProgress = (newTitle: string) => {
                        progress.report({ message: newTitle });
                        progressTitle = newTitle;
                    };

                    const fetchBibTeX = () => {
                        updateProgress(progressTitle);
                        fetchFunction(text)
                            .then((data) => {
                                if (data) {
                                    // Display fetched BibTeX and offer options to add or discard
                                    vscode.window
                                        .showInformationMessage(
                                            'BibTeX found: ' + getTitleFromBibTeX(data),
                                            // { modal: true },
                                            'Add to library.bib',
                                            'Discard'
                                        )
                                        .then((selectedOption) => {
                                            if (selectedOption === 'Add to library.bib') {
                                                // Add the data to a file
                                                const filename = 'library.bib';
                                                addStringToFile(filename, data + '\n\n')
                                                    .then(() => {
                                                        console.log('Data added to the file successfully.');
                                                        vscode.window.showInformationMessage('BibTeX added to library.bib.');
                                                        resolve(); // Resolve the promise
                                                        progress.report({}); // Empty object to make progress bar disappear
                                                    })
                                                    .catch((error) => {
                                                        console.error('Error adding data to the file:', error);
                                                        //vscode.window.showErrorMessage(error);
                                                        resolve(); // Resolve the promise
                                                        progress.report({}); // Empty object to make progress bar disappear
                                                    });
                                            } else {
                                                // Discard the fetched BibTeX
                                                console.log('BibTeX discarded.');
                                                vscode.window.showInformationMessage('BibTeX discarded.');
                                                resolve(); // Resolve the promise
                                                progress.report({}); // Empty object to make progress bar disappear
                                            }
                                        });
                                } else {
                                    // If DBLP search failed, try Scholar Archive
                                    if (fetchFunction === fetchDBLP) {
                                        fetchFunction = fetchScholarArchive;
                                        updateProgress('Scholar Archive');
                                        fetchBibTeX();
                                    } else {
                                        // No citation found
                                        console.log('No citation found.');
                                        vscode.window.showWarningMessage('No citation found.');
                                        resolve(); // Resolve the promise
                                        progress.report({}); // Empty object to make progress bar disappear
                                    }
                                }
                            })
                            .catch((error) => {
                                // Handle errors
                                console.error('Error fetching citation:', error);
                                vscode.window.showErrorMessage('Error fetching citation.');
                                resolve(); // Resolve the promise
                                progress.report({}); // Empty object to make progress bar disappear
                            });
                    };

                    fetchBibTeX();
                });
            });
        }
    );
}

function getTitleFromBibTeX(bibtexString: string) {
    const regex = /title\s*=\s*{([^}]*)}/i;
    const match = regex.exec(bibtexString);
    if (match && match.length > 1) {
        return match[1];
    }
    return null;
}
