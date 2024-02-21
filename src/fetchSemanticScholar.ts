import * as https from 'https';

export function fetchSemanticScholar(q: string, n: number = 3): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        // Prepare URL request
        const url = new URL('https://api.semanticscholar.org/graph/v1/paper/search');
        url.searchParams.append('query', q);
        url.searchParams.append('offset', '0');
        url.searchParams.append('limit', `${n}`);
        url.searchParams.append('fields', 'authors,title,year,journal,externalIds');

        // Make request
        https.get(url.toString(), (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    // console.log(data);
                    const jsonResponse = JSON.parse(data);
                    resolve(jsonResponse);
                } catch (e) {
                    reject(new Error('Failed to parse JSON response.'));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}
