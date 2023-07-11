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
                if (data.length > 0){
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