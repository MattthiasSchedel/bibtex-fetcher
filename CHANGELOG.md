# Changelog

## 4.0.0

Ground-up refactor for robustness and maintainability.

### Breaking
- Settings are now namespaced. Update your `settings.json`:
  - `libraryFilePath` → `bibtexManager.libraryFilePath`
  - `useBibKeyPattern` → `bibtexManager.bibKey.usePattern`
  - `bibKeyPattern` → `bibtexManager.bibKey.pattern`
- Command IDs renamed:
  - `clearSearchList` → `bibtex-manager.clearSearchList`
  - `bibtex-manager.addCitation` is now declared and available from the command palette.

### Fixed
- DOI is no longer truncated to the publisher prefix in the `\D` pattern.
- BibTeX key pattern `n` now supports multi-digit values (e.g. `\a(12)`); previously capped at single digit.
- Key replacement only rewrites the entry header, never matching strings inside the body.
- BibTeX parser is brace-balanced and handles multi-line values, nested braces, and comments.
- Duplicate detection compares entry keys instead of doing a substring match.
- Status-bar "Add Citation" now opens the BibTeX view automatically if it has not been opened yet.
- Searches now cancel in-flight requests when a new one is started.
- Errors surface in the panel and in the new "BibTeX Manager" output channel instead of being silently logged.

### Internal
- Replaced raw `https.get` wrappers with a typed `SemanticScholarClient` using global `fetch` and `AbortSignal`.
- Webview now built from TypeScript via webpack, sharing message types with the extension host.
- Pure modules (`bibtex`, `paper`, `library`, `resolveKey`) covered by mocha unit tests.

## 3.x and earlier

See git history.
