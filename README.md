# Movie & Book Search 🎬📚

**Try it live:** https://glowing-spork.netlify.app/

A tiny weekend project that grew into my go-to place for “what should I watch or read next?”  
Search movies (via OMDb) and books (via Google Books) in one spot, save the good ones, and download free classics when they’re in the public domain.

## What you can do

- Type once, flip the “Movies / Books” switch, hit Enter → instant cover cards  
- Tap any card → full details pop up in a slick modal  
- Heart your favorites → they stick around in the sidebar (even after you close the tab)  
- Export / import your favorites as a tiny JSON file (perfect for backups)  
- Download EPUB, PDF, or TXT straight from Project Gutenberg when a book is free  
- Toggle dark mode when your eyes beg for mercy  
- Works with keyboard only (Tab, Shift+Tab, Esc to close modals)

## How to run it

1. Clone or grab the zip  
2. Double-click `index.html`  
3. Start searching

> The demo uses a shared OMDb key. If you hit the daily limit, grab your own free key at [omdbapi.com](http://www.omdbapi.com/apikey.aspx) and paste it into `js/app.js`.

## Stack (because someone always asks)

HTML5 + CSS3, jQuery, OMDb API, Google Books API, Gutendex.

That’s it—happy hunting!
