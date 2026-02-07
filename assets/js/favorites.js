/**
 * Jay Libraries - Favorites Page
 */

(function() {
  'use strict';

  async function initFavoritesPage() {
    const container = document.getElementById('favorites-grid');
    if (!container) return;

    const favorites = JayLibraries.getFavorites();
    
    if (favorites.length === 0) {
      renderEmptyState(container);
      return;
    }

    // Show loading
    container.innerHTML = Array(favorites.length).fill(0)
      .map(() => JayLibraries.createSkeletonCard())
      .join('');

    const allBooks = await JayLibraries.getBooks();
    if (!allBooks) {
      container.innerHTML = '<p class="text-center text-muted">Failed to load books.</p>';
      return;
    }

    const favoriteBooks = allBooks.filter(book => favorites.includes(book.id));
    
    if (favoriteBooks.length === 0) {
      renderEmptyState(container);
      return;
    }

    renderFavorites(container, favoriteBooks);
    updateCount(favoriteBooks.length);

    // Listen for favorites updates
    window.addEventListener('favoritesUpdated', async () => {
      const newFavorites = JayLibraries.getFavorites();
      const newFavoriteBooks = allBooks.filter(book => newFavorites.includes(book.id));
      
      if (newFavoriteBooks.length === 0) {
        renderEmptyState(container);
        updateCount(0);
      } else {
        renderFavorites(container, newFavoriteBooks);
        updateCount(newFavoriteBooks.length);
      }
    });
  }

  function renderEmptyState(container) {
    container.innerHTML = `
      <div class="favorites-empty">
        <div class="favorites-empty-icon">
          ${JayLibraries.getIcon('heart')}
        </div>
        <h2 class="favorites-empty-title">No favorites yet</h2>
        <p class="favorites-empty-description">
          Start building your personal library by saving books you love. 
          Click the heart icon on any book to add it here.
        </p>
        <a href="library.html" class="btn btn-primary">
          ${JayLibraries.getIcon('library')}
          Explore Library
        </a>
      </div>
    `;
  }

  function renderFavorites(container, books) {
    container.className = 'books-grid';
    container.innerHTML = books.map(book => JayLibraries.createBookCard(book)).join('');
    
    // Initialize favorite buttons
    container.querySelectorAll('[data-action="toggle-favorite"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const bookId = btn.dataset.bookId;
        JayLibraries.toggleFavorite(bookId);
      });
    });
  }

  function updateCount(count) {
    const countEl = document.getElementById('favorites-count');
    if (countEl) {
      countEl.textContent = `${count} ${count === 1 ? 'book' : 'books'} saved`;
    }
  }

  document.addEventListener('DOMContentLoaded', initFavoritesPage);

})();
