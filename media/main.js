//@ts-check

/**
 * This script handles interactions within the webview of a VS Code extension
 * that enables users to search for academic papers.
 */
(function() {
    /**
     * Acquire the VS Code API for webview interactions.
     * @type {any}
     */
    const vscode = acquireVsCodeApi();
  
    // Cached DOM elements
    const paperListElem = document.getElementById('paperList');
    const loadingElem = document.getElementById('loading');
  
    /**
     * Clears the displayed list of papers.
     */
    function clearPaperList() {
      paperListElem.innerHTML = '';
    }
  
    /**
     * Displays a loading bar to indicate a search is in progress.
     */
    function displayLoadingBar() {
      loadingElem.innerHTML = '<div class="progress-bar"><div class="progress-bar-value"></div></div>';
    }
  
    /**
     * Stops and hides the loading bar.
     */
    function stopLoading() {
      loadingElem.innerHTML = '';
    }
  
    /**
     * Displays the list of papers. If no papers are provided, a message is shown.
     * @param {Array} papers - Array of paper objects to display.
     */
    function displayPaperList(papers) {
      clearPaperList();
  
      if (!papers) {
        paperListElem.textContent = 'No papers found.';
        return;
      }
  
      const ul = document.createElement('ul');
      ul.className = 'list';
  
      papers.forEach(paper => {
        const li = document.createElement('li');
        const paperDiv = document.createElement('div');
        paperDiv.className = 'paper-entry';
  
        const title = document.createElement('div');
        title.className = 'paper-title';
        title.textContent = paper.title;
        title.style.fontWeight = 'bold';
  
        const authorsDiv = document.createElement('div');
        authorsDiv.className = 'paper-authors';
        authorsDiv.textContent = paper.authors.map(author => author.name).join(', ');
  
        const bibtexButton = document.createElement('button');
        bibtexButton.className = 'bibtex-button';
        bibtexButton.textContent = 'Get BibTeX';
        bibtexButton.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent any parent event handlers from being executed
            vscode.postMessage({ type: 'getBibTeX', message: paper.paperId });
        });

  
        paperDiv.appendChild(title);
        paperDiv.appendChild(authorsDiv);
        paperDiv.appendChild(bibtexButton);

        li.appendChild(paperDiv);
        ul.appendChild(li);
      });
  
      paperListElem.appendChild(ul);
    }

    function searchForPaper(title){
      
      // Step 1: Set the value of the paperTitle input
      const paperTitleInput = document.getElementById('paperTitle');
      paperTitleInput.value = title;
  
      // Step 2: Submit the form
      vscode.postMessage({ type: 'searchPaper', message: title});
      
      
    }
  
    document.getElementById('paperSearchForm').addEventListener('submit', function(e) {
      e.preventDefault();
      clearPaperList();
      vscode.postMessage({ type: 'searchPaper', message: document.getElementById('paperTitle').value });
    });
  
    // Handle messages sent from the extension to the webview.
    window.addEventListener('message', event => {
      const message = event.data;
  
      switch (message.type) {
        case 'papers':
          displayPaperList(message.message);
          break;
        case 'error':
          displayPaperList(null);
          break;
        case 'clearPaperList':
          clearPaperList();
          break;
        case 'loading':
          displayLoadingBar();
          break;
        case 'stopLoading':
          stopLoading();
          break;
        case 'searchForPaper':
          searchForPaper(message.message);
          break;

      }
    });
  })();
  