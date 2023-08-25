import * as https from 'https';

export function fetchDBLP(q: string){
    return new Promise<string | undefined>((resolve, reject) => {
        // Prepare URL request
        const url = new URL('https://dblp.org/search/publ/api');
        url.searchParams.append('q', q);
        url.searchParams.append('format', 'bibtex');

        // Make request
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (data.length > 0 && getTitleFromBibTeX !== null){
                    resolve(data);
                }
                else{
                    resolve(undefined);
                }
                
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

function getTitleFromBibTeX(bibtexString: string) {
    const regex = /title\s*=\s*{([^}]*)}/i;
    const match = regex.exec(bibtexString);
    if (match && match.length > 1) {
        return match[1];
    }
    return null;
}