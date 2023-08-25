import { fetchScholarArchive } from './fetchScholarArchive';
import { fetchDBLP } from './fetchDBLP';
import { fetchWebsite } from './fetchWebsite';
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
                        updateProgress(progressTitle)
                        fetchFunction(text)
                            .then((data) => {
                                if (data) {
                                    // Display fetched BibTeX and offer options to add or discard
                                    const filename = getLibraryFilePath();
                                    const buttonLabel = `Add to ${filename}`;
                                    vscode.window
                                        .showInformationMessage(
                                            'BibTeX found: ' + getTitleFromBibTeX(data),
                                            // { modal: true },
                                            buttonLabel,
                                            'Discard'
                                        )
                                        .then((selectedOption) => {
                                            if (selectedOption === buttonLabel) {
                                                // Add the data to a file
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
                                } else 
                                {
                                    // No citation found
                                    console.log('No citation found.');
                                    vscode.window.showWarningMessage('No citation found.');
                                    resolve(); // Resolve the promise
                                    progress.report({}); // Empty object to make progress bar disappear
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

                    let citationSource = getCitationSource();
                    console.log(citationSource);
                    // Check if the clipboard text is a link
                    if (isLink(text)) {
                        // Call fetchWebsite instead of fetchDBLP or fetchScholarArchive
                        fetchFunction = fetchWebsite;
                        updateProgress('Website');
                    }
                    else if(citationSource == 'DBLP'){
                        fetchFunction = fetchDBLP;
                        updateProgress('DBLP');
                        console.log("dblp selected");
                    }
                    else if(citationSource == 'Scholar Archive'){
                        fetchFunction = fetchScholarArchive;
                        updateProgress('Scholar Archive');
                        console.log("sa selected");
                    }


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

function isLink(text: string) {
    // Implement your logic to check if the text is a link
    // For example, you can use regular expressions to match common link patterns
    const linkRegex = /^(https?:\/\/)?[\w.-]+\.[a-zA-Z]{2,}(\/\S*)?$/;
    return linkRegex.test(text);
}

function getLibraryFilePath() {
    // Retrieve the library file path from the settings
    const config = vscode.workspace.getConfiguration();
    const filePath = config.get('yourExtension.libraryFilePath');
    return filePath as string;
}

function getCitationSource() {
    // Retrieve the library file path from the settings
    const config = vscode.workspace.getConfiguration();
    const filePath = config.get('yourExtension.citationSource');
    return filePath;
}
