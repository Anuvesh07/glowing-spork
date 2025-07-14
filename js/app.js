$(document).ready(function() {
    let currentPage = 1;
    let currentQuery = '';
    let currentType = 'movie';
    let isLoading = false;
    let lastResults = [];
    let googleBooksStartIndex = 0;

    // --- FAVORITES LOGIC ---
    function getFavorites() {
        return JSON.parse(localStorage.getItem('favorites') || '[]');
    }
    function saveFavorites(favs) {
        localStorage.setItem('favorites', JSON.stringify(favs));
    }
    function isFavorited(id, type) {
        return getFavorites().some(f => f.id === id && f.type === type);
    }
    function addFavorite(item, type) {
        let favs = getFavorites();
        if (!isFavorited(item.id, type)) {
            favs.push({ ...item, type });
            saveFavorites(favs);
        }
    }
    function removeFavorite(id, type) {
        let favs = getFavorites();
        favs = favs.filter(f => !(f.id === id && f.type === type));
        saveFavorites(favs);
    }

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

    // Delegate favorite button click in results
    $('#results-list').on('click', '.fav-btn', function() {
        const id = $(this).data('id');
        const type = $(this).data('type');
        if (isFavorited(id, type)) {
            removeFavorite(id, type);
        } else {
            // Find the item in lastResults
            let item;
            if (type === 'movie') {
                item = lastResults.find(m => m.imdbID === id);
                if (item) addFavorite({
                    id: item.imdbID,
                    title: item.Title,
                    year: item.Year,
                    poster: item.Poster
                }, 'movie');
            } else {
                item = lastResults.find(b => b.id === id);
                if (item) {
                    const v = item.volumeInfo;
                    addFavorite({
                        id: item.id,
                        title: v.title,
                        authors: v.authors,
                        published: v.publishedDate,
                        poster: v.imageLinks && v.imageLinks.thumbnail
                    }, 'book');
                }
            }
        }
        renderResults(lastResults, currentType);
        renderFavorites();
    });

    // Remove favorite from sidebar
    $('#favorites-list').on('click', '.remove-fav-btn', function() {
        const id = $(this).data('id');
        const type = $(this).data('type');
        removeFavorite(id, type);
        renderResults(lastResults, currentType);
        renderFavorites();
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
            const apiKey = 'thewdb';
            $.ajax({
                url: `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(query)}&page=${currentPage}`,
                method: 'GET',
                success: function(data) {
                    isLoading = false;
                    if (data.Response === 'True') {
                        lastResults = append ? lastResults.concat(data.Search) : data.Search;
                        renderResults(lastResults, type);
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
            let isFav = false;
            if (type === 'movie') {
                isFav = isFavorited(item.imdbID, 'movie');
                html = `<div class="result-card">
                    <img src="${item.Poster !== 'N/A' ? item.Poster : 'https://via.placeholder.com/150x220?text=No+Image'}" alt="${item.Title}" class="cover">
                    <div class="info">
                        <h3>${item.Title}</h3>
                        <p><strong>Year:</strong> ${item.Year}</p>
                        <button class="fav-btn${isFav ? ' active' : ''}" data-id="${item.imdbID}" data-type="movie">${isFav ? '&#9733; Favorited' : '&#9734; Favorite'}</button>
                    </div>
                </div>`;
            } else {
                const volume = item.volumeInfo;
                isFav = isFavorited(item.id, 'book');
                html = `<div class="result-card">
                    <img src="${volume.imageLinks && volume.imageLinks.thumbnail ? volume.imageLinks.thumbnail : 'https://via.placeholder.com/150x220?text=No+Image'}" alt="${volume.title}" class="cover">
                    <div class="info">
                        <h3>${volume.title}</h3>
                        <p><strong>Authors:</strong> ${(volume.authors || []).join(', ')}</p>
                        <p><strong>Published:</strong> ${volume.publishedDate || 'N/A'}</p>
                        <button class="fav-btn${isFav ? ' active' : ''}" data-id="${item.id}" data-type="book">${isFav ? '&#9733; Favorited' : '&#9734; Favorite'}</button>
                    </div>
                </div>`;
            }
            $('#results-list').append(html);
        });
    }

    // Render favorites in sidebar
    function renderFavorites() {
        const favs = getFavorites();
        $('#favorites-list').empty();
        if (!favs.length) {
            $('#favorites-list').html('<div class="no-favs">No favorites yet.</div>');
            return;
        }
        favs.forEach(function(fav) {
            let html = `<div class="fav-card">
                <img src="${fav.poster && fav.poster !== 'N/A' ? fav.poster : 'https://via.placeholder.com/50x70?text=No+Image'}" alt="${fav.title}" class="fav-cover">
                <div class="fav-info">
                    <h4>${fav.title}</h4>
                    ${fav.type === 'movie' ? `<p><strong>Year:</strong> ${fav.year}</p>` : `<p><strong>Authors:</strong> ${(fav.authors || []).join(', ')}</p><p><strong>Published:</strong> ${fav.published || 'N/A'}</p>`}
                    <button class="remove-fav-btn" data-id="${fav.id}" data-type="${fav.type}">Remove</button>
                </div>
            </div>`;
            $('#favorites-list').append(html);
        });
    }

    // Initial render of favorites
    renderFavorites();
}); 