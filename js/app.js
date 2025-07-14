$(document).ready(function() {
    let currentPage = 1;
    let currentQuery = '';
    let currentType = 'movie';
    let isLoading = false;
    let lastResults = [];
    let googleBooksStartIndex = 0;

    // Helper: Show loading
    function showLoading() {
        $('#results-list').html('<div class="loading">Loading...</div>');
    }

    // Helper: Show error
    function showError(msg) {
        $('#results-list').html('<div class="error">' + msg + '</div>');
    }

    // Search button click handler
    $('#search-btn').on('click', function() {
        startSearch();
    });

    // Enter key triggers search
    $('#search-input').on('keypress', function(e) {
        if (e.which === 13) startSearch();
    });

    // Change type resets results
    $('#search-type').on('change', function() {
        $('#results-list').empty();
        $('#load-more-btn').hide();
    });

    // Load more button click handler
    $('#load-more-btn').on('click', function() {
        if (currentType === 'movie') {
            currentPage++;
        } else {
            googleBooksStartIndex += 20;
        }
        search(currentQuery, currentType, true);
    });

    function startSearch() {
        currentQuery = $('#search-input').val().trim();
        currentType = $('#search-type').val();
        currentPage = 1;
        googleBooksStartIndex = 0;
        if (!currentQuery) {
            showError('Please enter a search term.');
            return;
        }
        search(currentQuery, currentType, false);
    }

    function search(query, type, append) {
        if (isLoading) return;
        isLoading = true;
        if (!append) {
            showLoading();
            lastResults = [];
        }
        $('#load-more-btn').hide();
        if (type === 'movie') {
            // OMDb API
            // Demo key: 'thewdb' (for testing, limited)
            const apiKey = 'thewdb';
            $.ajax({
                url: `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(query)}&page=${currentPage}`,
                method: 'GET',
                success: function(data) {
                    isLoading = false;
                    if (data.Response === 'True') {
                        lastResults = append ? lastResults.concat(data.Search) : data.Search;
                        renderResults(lastResults, type);
                        // OMDb returns up to 10 per page, so show load more if totalResults > current
                        if (parseInt(data.totalResults) > lastResults.length) {
                            $('#load-more-btn').show();
                        }
                    } else {
                        showError(data.Error || 'No results found.');
                    }
                },
                error: function() {
                    isLoading = false;
                    showError('Error fetching data.');
                }
            });
        } else {
            // Google Books API
            $.ajax({
                url: `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&startIndex=${googleBooksStartIndex}&maxResults=20`,
                method: 'GET',
                success: function(data) {
                    isLoading = false;
                    if (data.items && data.items.length > 0) {
                        lastResults = append ? lastResults.concat(data.items) : data.items;
                        renderResults(lastResults, type);
                        if (data.totalItems > lastResults.length) {
                            $('#load-more-btn').show();
                        }
                    } else {
                        showError('No results found.');
                    }
                },
                error: function() {
                    isLoading = false;
                    showError('Error fetching data.');
                }
            });
        }
    }

    // Render results using jQuery templating
    function renderResults(items, type) {
        $('#results-list').empty();
        if (!items || items.length === 0) {
            $('#results-list').html('<div class="no-results">No results found.</div>');
            return;
        }
        items.forEach(function(item) {
            let html = '';
            if (type === 'movie') {
                html = `<div class="result-card">
                    <img src="${item.Poster !== 'N/A' ? item.Poster : 'https://via.placeholder.com/150x220?text=No+Image'}" alt="${item.Title}" class="cover">
                    <div class="info">
                        <h3>${item.Title}</h3>
                        <p><strong>Year:</strong> ${item.Year}</p>
                        <button class="fav-btn" data-id="${item.imdbID}" data-type="movie">&#9734; Favorite</button>
                    </div>
                </div>`;
            } else {
                const volume = item.volumeInfo;
                html = `<div class="result-card">
                    <img src="${volume.imageLinks && volume.imageLinks.thumbnail ? volume.imageLinks.thumbnail : 'https://via.placeholder.com/150x220?text=No+Image'}" alt="${volume.title}" class="cover">
                    <div class="info">
                        <h3>${volume.title}</h3>
                        <p><strong>Authors:</strong> ${(volume.authors || []).join(', ')}</p>
                        <p><strong>Published:</strong> ${volume.publishedDate || 'N/A'}</p>
                        <button class="fav-btn" data-id="${item.id}" data-type="book">&#9734; Favorite</button>
                    </div>
                </div>`;
            }
            $('#results-list').append(html);
        });
    }

    // Stub: Render favorites
    function renderFavorites() {
        // TODO: Render favorites from localStorage
        $('#favorites-list').empty();
    }

    // Initial render of favorites
    renderFavorites();
}); 