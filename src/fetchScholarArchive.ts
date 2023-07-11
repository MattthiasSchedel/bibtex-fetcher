import * as https from 'https';

export function fetchScholarArchive(q: string): Promise<string | undefined> {
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