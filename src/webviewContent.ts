import * as vscode from 'vscode';
import { getNonce } from './utils';

export function getHtmlForWebview(webview: vscode.Webview , extensionUri: vscode.Uri) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.js'));

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.css'));

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">

            <!--
                Use a content security policy to only allow loading styles from our extension directory,
                and only allow scripts that have a specific nonce.
                (See the 'webview-sample' extension sample for img-src content security policy examples)
            -->
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <link href="${styleResetUri}" rel="stylesheet">
            <link href="${styleVSCodeUri}" rel="stylesheet">
            <link href="${styleMainUri}" rel="stylesheet">

            <title>Search BibTeX</title>
        </head>
        <body>
            <form id="paperSearchForm">
                <label for="paperTitle">Enter the name of a scientific paper:</label>
                <input type="text" id="paperTitle" name="paperTitle" required>
                <button type="submit">Search</button>
            </form>
            <div id="loading"></div>
            <div id="paperList"></div>

            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
}