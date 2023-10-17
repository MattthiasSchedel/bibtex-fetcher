import * as https from 'https';

export function fetchBibTeX(paperId: string): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve, reject) => {
        // Prepare URL request
        const url = new URL(`https://api.semanticscholar.org/graph/v1/paper/${paperId}`);
        url.searchParams.append('fields', 'citationStyles');

        // Make request
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    if (jsonData.citationStyles && jsonData.citationStyles.bibtex) {
                        resolve(jsonData.citationStyles.bibtex);
                    } else {
                        resolve(undefined);
                    }
                } catch (error) {
                    reject(`Failed to parse response: ${error}`);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}