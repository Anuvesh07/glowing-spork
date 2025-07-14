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

    // Modal logic
    function showModal(contentHtml) {
        $('#modal-body').html(contentHtml);
        $('#modal-overlay').fadeIn(150).css('display', 'flex');
        setTimeout(function() { $('#modal-close').focus(); }, 100);
    }
    function hideModal() {
        $('#modal-overlay').fadeOut(120);
    }
    $('#modal-close, #modal-overlay').on('click', function(e) {
        if (e.target === this) hideModal();
    });
    // Keyboard accessibility: close modal with Escape key
    $(document).on('keydown', function(e) {
        if ($('#modal-overlay').is(':visible') && (e.key === 'Escape' || e.keyCode === 27)) {
            hideModal();
        }
    });

    // Show more details on card click
    $('#results-list').on('click', '.result-card', function(e) {
        // Prevent modal opening when clicking favorite button
        if ($(e.target).hasClass('fav-btn')) return;
        const idx = $(this).index();
        const item = lastResults[idx];
        let html = '';
        if (currentType === 'movie') {
            // Show loading in modal
            showModal('<div class="loading">Loading details...</div>');
            // Fetch full details from OMDb
            const apiKey = 'thewdb';
            $.ajax({
                url: `https://www.omdbapi.com/?apikey=${apiKey}&i=${item.imdbID}&plot=full`,
                method: 'GET',
                success: function(data) {
                    if (data.Response === 'True') {
                        html = `<h2>${data.Title}</h2>
                            <img src="${data.Poster !== 'N/A' ? data.Poster : 'https://via.placeholder.com/150x220?text=No+Image'}" alt="${data.Title}" style="width:120px;height:180px;object-fit:cover;border-radius:6px;box-shadow:0 1px 6px #0001;margin-bottom:10px;">
                            <p><strong>Year:</strong> ${data.Year}</p>
                            <p><strong>Rated:</strong> ${data.Rated}</p>
                            <p><strong>Released:</strong> ${data.Released}</p>
                            <p><strong>Genre:</strong> ${data.Genre}</p>
                            <p><strong>Director:</strong> ${data.Director}</p>
                            <p><strong>Actors:</strong> ${data.Actors}</p>
                            <p><strong>Plot:</strong> ${data.Plot}</p>
                            <p><strong>IMDB Rating:</strong> ${data.imdbRating}</p>
                            <p><strong>IMDB ID:</strong> ${data.imdbID}</p>`;
                    } else {
                        html = `<div class='error'>Could not fetch details. Please try again later.</div>`;
                    }
                    showModal(html);
                },
                error: function() {
                    showModal('<div class="error">Error fetching details. Please try again later.</div>');
                }
            });
        } else {
            const v = item.volumeInfo;
            html = `<h2>${v.title}</h2>
                <img src="${v.imageLinks && v.imageLinks.thumbnail ? v.imageLinks.thumbnail : 'https://via.placeholder.com/150x220?text=No+Image'}" alt="${v.title}" style="width:120px;height:180px;object-fit:cover;border-radius:6px;box-shadow:0 1px 6px #0001;margin-bottom:10px;">
                <p><strong>Authors:</strong> ${(v.authors || []).join(', ')}</p>
                <p><strong>Published:</strong> ${v.publishedDate || 'N/A'}</p>
                <p><strong>Publisher:</strong> ${v.publisher || 'N/A'}</p>
                <p><strong>Page Count:</strong> ${v.pageCount || 'N/A'}</p>
                <p><strong>Description:</strong> ${v.description ? v.description.substring(0, 400) + (v.description.length > 400 ? '...' : '') : 'N/A'}</p>`;
            showModal(html);
        }
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

    // Sort/filter controls event handlers
    $('#sort-select, #filter-covers').on('change', function() {
        renderResults(lastResults, currentType);
    });

    // Helper: get sorted/filtered items
    function getSortedFilteredItems(items, type) {
        let filtered = items.slice();
        // Filter: only with covers
        if ($('#filter-covers').is(':checked')) {
            if (type === 'movie') {
                filtered = filtered.filter(item => item.Poster && item.Poster !== 'N/A');
            } else {
                filtered = filtered.filter(item => item.volumeInfo && item.volumeInfo.imageLinks && item.volumeInfo.imageLinks.thumbnail);
            }
        }
        // Sort
        const sortVal = $('#sort-select').val();
        if (sortVal === 'az') {
            filtered.sort((a, b) => {
                const tA = type === 'movie' ? a.Title : (a.volumeInfo.title || '');
                const tB = type === 'movie' ? b.Title : (b.volumeInfo.title || '');
                return tA.localeCompare(tB);
            });
        } else if (sortVal === 'year-new') {
            filtered.sort((a, b) => {
                const yA = type === 'movie' ? parseInt(a.Year) : parseInt((a.volumeInfo.publishedDate || '').slice(0,4));
                const yB = type === 'movie' ? parseInt(b.Year) : parseInt((b.volumeInfo.publishedDate || '').slice(0,4));
                return (yB || 0) - (yA || 0);
            });
        } else if (sortVal === 'year-old') {
            filtered.sort((a, b) => {
                const yA = type === 'movie' ? parseInt(a.Year) : parseInt((a.volumeInfo.publishedDate || '').slice(0,4));
                const yB = type === 'movie' ? parseInt(b.Year) : parseInt((b.volumeInfo.publishedDate || '').slice(0,4));
                return (yA || 0) - (yB || 0);
            });
        }
        return filtered;
    }

    // Update renderResults to use getSortedFilteredItems
    function renderResults(items, type) {
        $('#results-list').empty();
        if (!items || items.length === 0) {
            $('#results-list').html('<div class="no-results">No results found.</div>');
            return;
        }
        const sortedFiltered = getSortedFilteredItems(items, type);
        if (!sortedFiltered.length) {
            $('#results-list').html('<div class="no-results">No results match your filter.</div>');
            return;
        }
        sortedFiltered.forEach(function(item) {
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

    // Hide the Load More button (infinite scroll replaces it)
    $('#load-more-btn').hide();

    // Infinite scroll logic
    let canLoadMore = true;
    $('#results-section').on('scroll', function() {
        const $this = $(this);
        if (!canLoadMore || isLoading) return;
        // Check if near bottom (within 120px)
        if ($this[0].scrollHeight - $this.scrollTop() - $this.outerHeight() < 120) {
            // Only load if more results are available
            if ((currentType === 'movie' && lastResults.length % 10 === 0) || (currentType === 'book' && lastResults.length % 20 === 0)) {
                canLoadMore = false;
                if (currentType === 'movie') {
                    currentPage++;
                } else {
                    googleBooksStartIndex += 20;
                }
                search(currentQuery, currentType, true);
                setTimeout(() => { canLoadMore = true; }, 800); // debounce
            }
        }
    });

    // Also trigger infinite scroll on window scroll for mobile/small screens
    $(window).on('scroll', function() {
        if (!$('#results-section').is(':visible')) return;
        if (!canLoadMore || isLoading) return;
        const $results = $('#results-section');
        const rect = $results[0].getBoundingClientRect();
        if (rect.bottom - window.innerHeight < 120) {
            if ((currentType === 'movie' && lastResults.length % 10 === 0) || (currentType === 'book' && lastResults.length % 20 === 0)) {
                canLoadMore = false;
                if (currentType === 'movie') {
                    currentPage++;
                } else {
                    googleBooksStartIndex += 20;
                }
                search(currentQuery, currentType, true);
                setTimeout(() => { canLoadMore = true; }, 800);
            }
        }
    });

    // Initial render of favorites
    renderFavorites();

    // Export favorites as JSON
    $('#export-favorites-btn').on('click', function() {
        const favs = getFavorites();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(favs, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute('href', dataStr);
        dlAnchor.setAttribute('download', 'favorites.json');
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        document.body.removeChild(dlAnchor);
    });
}); 