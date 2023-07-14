import * as https from 'https';

export function fetchWebsite(url: string): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                // console.log("data:")
                // console.log(data)
                const bibtexEntry = createBibtexEntryFromWebsite(data, url);
                resolve(bibtexEntry);
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

function createBibtexEntryFromWebsite(html: string, url: string): string {
    const title = extractTitleFromHtml(html);
    const urldate = getCurrentDate(); // Replace with your logic to get the URL date

    // Create the BibTeX entry string
    const bibtexEntry = `@misc{,
    author = {},
    abstract = {},
    title = {${title}},
    url = {${url}},
    urldate = {${urldate}}
}`;

    return bibtexEntry;
}

function extractTitleFromHtml(html: string): string {
    // Extract title from <title> tag
    const titleRegex = /<title[^>]*>(.*?)<\/title>/i;
    const titleMatch = html.match(titleRegex);
    if (titleMatch && titleMatch.length > 1) {
        return titleMatch[1];
    }

    // Extract title from <h1> tag if <title> tag is not present
    const h1TitleRegex = /<h1[^>]*>(.*?)<\/h1>/i;
    const h1Match = html.match(h1TitleRegex);
    if (h1Match && h1Match.length > 1) {
        return h1Match[1];
    }

    return '';
}

function getCurrentDate(): string {
    // Implement your logic to get the current date in the desired format
    // You can use JavaScript Date object or date formatting libraries like moment.js
    const currentDate = new Date();
    return currentDate.toISOString().split('T')[0];
}
