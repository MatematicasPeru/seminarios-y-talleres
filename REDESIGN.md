# September 2026 redesign

Replace the repository's `docs` folder with this complete `docs` folder. Keep GitHub Pages set to the existing branch and `/docs`. The PDF filenames and note URLs are unchanged. Upload `docs/assets/pdfjs` too: it contains the reader's engine, worker, font data and license.

The full-page photo remains `docs/hero-peru.jpeg`. Adjust the opacity numbers in `body::before` in `docs/theme.css` to change the photo's visibility: smaller numbers reveal more of it.

Content uses Monaco when installed, then Lucida Console or Liberation Mono. Monaco is not bundled. Headings use Georgia with a Times fallback. The warm brown/ivory palette and serif headings are an approximation of the requested reference: its exact rendered font and colour values could not be verified.

The PDF reader includes continuous scroll, page entry, outline navigation (or page links when no outline exists), 80–200% page zoom, fit controls constrained to that range, fullscreen, keyboard navigation, downloads and an Open PDF link. On narrow screens an 80% page can be wider than the viewport; horizontal scrolling remains available. Open PDF uses the browser's viewer for text selection, search, printing or annotations where supported. The embedded canvas reader does not save handwriting or annotations. PDF.js 5.6.205 is included locally with its Apache license. A modern browser is needed; direct PDF links remain available if the engine fails.

The PDFs and Dessins mathematical content are unchanged. This is a presentation update, not a content completeness or mathematical audit. Dessins continues to use its existing external MathJax script.

The homepage has a compact four-statement daily rotation, using the visitor's local date and restarting cyclically. It updates while the page stays open. The supplied `theorems.js` archive is preserved, but not used: it contains titles rather than full statements. This rotation is not a complete extraction of every theorem in the PDFs.

Verification: all three PDFs were opened by PDF.js, all page dimensions checked, and first pages rendered at 80%, 100%, and 200%. Local URLs, JavaScript syntax, PDF hashes and preservation of Dessins content were checked. Live browser visual inspection could not run in the available environment.
