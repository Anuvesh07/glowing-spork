# Movie & Book Search App

**Live Demo:** <a href="https://glowing-spork.netlify.app/" target="_blank">https://glowing-spork.netlify.app/</a>

A creative, interactive web application to search for movies (using OMDb API) and books (using Google Books API), built with jQuery and a modern, accessible UI.

## Features
- Search for movies or books by keyword
- Toggle between Movies and Books
- Display covers, titles, and details in a beautiful card layout
- Click any result or favorite to view full details in a centered modal with blurred background
- Download public domain books from Project Gutenberg (if available) in multiple formats (EPUB, PDF, TXT, etc.)
- Add/remove favorites, saved in localStorage
- Export and import your favorites as a JSON file
- Responsive, modern UI with animated backgrounds and card transitions
- Dark mode toggle for comfortable viewing
- Accessibility: ARIA labels, focus management, skip-to-content, keyboard navigation, and screen reader support

## Setup & Usage
1. **Clone or Download** this repository.
2. Open `index.html` in your web browser.
3. Enter a search term, select Movies or Books, and click Search.
4. Click any card to view details in a modal. For books, download links from Project Gutenberg will appear if available.
5. Click "Favorite" to save items, and manage your favorites in the sidebar. Click any favorite to view its details.
6. Use the Export/Import buttons in the Favorites section to back up or restore your favorites.
7. Use the dark mode toggle (🌙/☀️) to switch between light and dark themes.
8. Navigate with keyboard: Tab, Shift+Tab, and Escape (to close modals).

> **Note:**
> - The OMDb API uses a public demo key (`thewdb`). For extended use, [get your own free API key](http://www.omdbapi.com/apikey.aspx) and update it in `js/app.js`.
> - Google Books API does not require a key for basic searches.
> - Project Gutenberg downloads are provided via the [Gutendex API](https://gutendex.com/).

## Technologies Used
- HTML5, CSS3 (with modern animations and accessibility)
- jQuery
- OMDb API (for movies)
- Google Books API (for books)
- Gutendex API (for Project Gutenberg book downloads)

## Credits
- [OMDb API](http://www.omdbapi.com/)
- [Google Books API](https://developers.google.com/books/)
- [Gutendex API](https://gutendex.com/)

## Deployment

This site is deployed on Netlify: <a href="https://glowing-spork.netlify.app/" target="_blank">https://glowing-spork.netlify.app/</a>

To deploy your own version:
1. Push your code to a Git repository (GitHub, GitLab, etc.).
2. Connect your repository to Netlify.
3. Set the publish directory to `jqueary`.
4. No build command is required (static site).

---

Enjoy searching, discovering, and managing your favorite movies and books! 