
export class Paper {
    paperId: string;
    title: string | null;
    year: number | null;
    doi: string | null;
    authors: string[] | null;

    constructor(paperData: any) {
        this.paperId =  paperData.paperId;
        this.title = paperData.title;
        this.year = paperData.year;
        // the doi looks like this "10.14722/ndss.2022.23156" but should only be "10.14722"
        const dirtyDoi = paperData.externalIds.DOI;
        this.doi = dirtyDoi ? dirtyDoi.split('/')[0] : dirtyDoi;
        let authorData = paperData.authors;
        // console.log(authorData);
        if (authorData){
            this.authors = [];
            for (const author of authorData) {
                this.authors.push(author.name);
            }
        } else { this.authors = null; }
    }

    private getFirstAuthorsLastName(n = 1) {
        if (this.authors) {
            let lastNames;
            // If n is 0, use all authors' last names; otherwise, take the last name of the first n authors
            if (n === 0) {
                lastNames = this.authors.map(fullName => fullName.split(' ').slice(-1)[0]);
            } else {
                lastNames = this.authors.slice(0, n).map(fullName => fullName.split(' ').slice(-1)[0]);
            }
            return lastNames.join('');
        } else {
            return null;
        }
    }
    

    private getShortYear(){
        if (this.year){
            return this.year.toString().slice(-2);
        }
        else {
            return null;
        }
    }

    private getFirstLetterTitle(n = 1) {
        if (this.title) {
            let words;
            // If n is 0, use all words; otherwise, take the first n words
            if (n === 0) {
                words = this.title.split(' ');
            } else {
                words = this.title.split(' ').slice(0, n);
            }
            let shortTitle = words.map(word => word.replace(/[^a-zA-Z]/g, '')
                .charAt(0)).join('');
            return shortTitle;
        } else {
            return null;
        }
    }
    
    

    private getShortTitle(n = 1) {
        if (this.title) {
            let words;
            // If n is 0, use all words; otherwise, take the first n words
            if (n === 0) {
                words = this.title.split(' ');
            } else {
                words = this.title.split(' ').slice(0, n);
            }
            // Filter each word to remove non-alphabetical characters and then join
            let shortTitle = words.map(word => word.replace(/[^a-zA-Z]/g, '')).join('');
            return shortTitle;
        } else {
            return null;
        }
    }
    
    

    getBibTexKey(bibKeyPattern: string): { success: boolean, key: string } {
        // | Pattern | Description                                                   |
        // |---------|---------------------------------------------------------------|
        // | `\a(n)`  | The last names of the first n authors.                        |
        // | `\Y`     | The full year.                                                |
        // | `\y`     | The last two digits of the year.                              |
        // | `\T(n)`  | The first n words of a title.                                 |
        // | `\t(n)`  | Only the beginning letters of the first n words in the title. |
        // | `\D`     | DOI.                                                          |
        let success = true;
        let key = bibKeyPattern;
        key = key.replace(/\\a\((\d)\)/g, (match, n) => this.getFirstAuthorsLastName(parseInt(n)) || '\!ERROR!');
        key = key.replace(/\\Y/g, this.year?.toString() || '\!ERROR!');
        key = key.replace(/\\y/g, this.getShortYear() || '\!ERROR!');
        key = key.replace(/\\T\((\d)\)/g, (match, n) => this.getShortTitle(parseInt(n)) || '\!ERROR!');
        key = key.replace(/\\t\((\d)\)/g, (match, n) => this.getFirstLetterTitle(parseInt(n)) || '\!ERROR!');
        key = key.replace(/\\D/g, this.doi || '\!ERROR!');
        // If there are still any backslashes, it means that the pattern is invalid
        if (key.includes('\!ERROR!')) {
            success = false;
            // remove the error markers
            key = key.replace(/\!ERROR!/g, '')
        }
        return { success, key };
    }
}