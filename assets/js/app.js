/**
 * Jay Libraries - Main Application
 * Homepage and shared functionality
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // HOME PAGE
  // ═══════════════════════════════════════════════════════════
  
  async function initHomePage() {
    const books = await JayLibraries.getBooks();
    const categories = await JayLibraries.getCategories();

    if (!books || !categories) {
      console.error('Failed to load data');
      return;
    }

    renderFeaturedBooks(books);
    renderPopularCategories(categories, books);
    renderRecentlyAdded(books);
    updateStats(books, categories);
    initFavoriteButtons();
  }

  function renderFeaturedBooks(books) {
    const container = document.getElementById('featured-books');
    if (!container) return;

    const featured = books.filter(book => book.featured).slice(0, 4);
    
    container.innerHTML = featured.map(book => `
      <article class="featured-card">
        <div class="featured-card-image">
          ${book.cover 
            ? `<img src="${book.cover}" alt="${book.title}" loading="lazy">`
            : `<div class="book-card-placeholder">${JayLibraries.getIcon('book-open')}</div>`
          }
        </div>
        <div class="featured-card-content">
          <span class="featured-card-badge">
            ${JayLibraries.getIcon('star-filled')}
            Featured
          </span>
          <h3 class="featured-card-title">${book.title}</h3>
          <p class="featured-card-author">by ${book.author}</p>
          <p class="featured-card-description">${book.description}</p>
          <a href="book.html?id=${book.id}" class="btn btn-secondary btn-sm featured-card-action">
            View Details
            ${JayLibraries.getIcon('arrow-right')}
          </a>
        </div>
      </article>
    `).join('');
  }

  function renderPopularCategories(categories, books) {
    const container = document.getElementById('popular-categories');
    if (!container) return;

    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      count: books.filter(book => book.category === cat.name).length
    })).sort((a, b) => b.count - a.count).slice(0, 6);

    container.innerHTML = categoriesWithCount.map(cat => 
      JayLibraries.createCategoryCard(cat, cat.count)
    ).join('');
  }

  function renderRecentlyAdded(books) {
    const container = document.getElementById('recent-books');
    if (!container) return;

    const recent = JayLibraries.sortBooks(books, 'dateAdded', 'desc').slice(0, 8);
    
    container.innerHTML = recent.map(book => 
      JayLibraries.createBookCard(book)
    ).join('');
  }

  function updateStats(books, categories) {
    const totalBooks = document.getElementById('stat-books');
    const totalCategories = document.getElementById('stat-categories');
    const totalAuthors = document.getElementById('stat-authors');

    if (totalBooks) {
      animateCounter(totalBooks, books.length);
    }
    if (totalCategories) {
      animateCounter(totalCategories, categories.length);
    }
    if (totalAuthors) {
      const uniqueAuthors = new Set(books.map(b => b.author)).size;
      animateCounter(totalAuthors, uniqueAuthors);
    }
  }

  function animateCounter(element, target) {
    const duration = 1500;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * easeProgress);
      
      element.textContent = current.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target.toLocaleString();
      }
    }

    requestAnimationFrame(update);
  }

  function initFavoriteButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="toggle-favorite"]');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        
        const bookId = btn.dataset.bookId;
        const isFavorite = JayLibraries.toggleFavorite(bookId);
        
        btn.classList.toggle('active', isFavorite);
        btn.innerHTML = JayLibraries.getIcon(isFavorite ? 'heart-filled' : 'heart');
        btn.setAttribute('aria-label', `${isFavorite ? 'Remove from' : 'Add to'} favorites`);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // SEARCH MODAL
  // ═══════════════════════════════════════════════════════════
  
  async function initSearchModal() {
    const searchInput = document.querySelector('.search-modal-input');
    const resultsContainer = document.getElementById('search-results');
    
    if (!searchInput || !resultsContainer) return;

    const books = await JayLibraries.getBooks();
    if (!books) return;

    const performSearch = JayLibraries.debounce((query) => {
      if (!query || query.trim().length < 2) {
        renderSearchSuggestions(resultsContainer);
        return;
      }

      const results = JayLibraries.searchBooks(books, query);
      renderSearchResults(resultsContainer, results, query);
    }, 200);

    searchInput.addEventListener('input', (e) => {
      performSearch(e.target.value);
    });

    // Initial state
    renderSearchSuggestions(resultsContainer);
  }

  function renderSearchResults(container, results, query) {
    if (results.length === 0) {
      container.innerHTML = `
        <div class="search-empty">
          <div class="search-empty-icon">${JayLibraries.getIcon('search')}</div>
          <h3 class="search-empty-title">No results found</h3>
          <p class="search-empty-description">
            We couldn't find anything matching "${query}". Try different keywords.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="search-results">
        ${results.slice(0, 10).map(book => `
          <a href="book.html?id=${book.id}" class="search-result-item">
            <div class="search-result-icon">
              ${JayLibraries.getIcon('book')}
            </div>
            <div class="search-result-content">
              <div class="search-result-title">
                ${JayLibraries.highlightMatch(book.title, query)}
              </div>
              <div class="search-result-meta">
                ${book.author} • ${book.category} • ${book.year}
              </div>
            </div>
            <div class="search-result-arrow">
              ${JayLibraries.getIcon('chevron-right')}
            </div>
          </a>
        `).join('')}
      </div>
      ${results.length > 10 ? `
        <div class="text-center mt-4">
          <a href="library.html?search=${encodeURIComponent(query)}" class="btn btn-secondary">
            View all ${results.length} results
          </a>
        </div>
      ` : ''}
    `;
  }

  function renderSearchSuggestions(container) {
    const suggestions = ['Philosophy', 'Programming', 'Design', 'Business', 'Self-Development'];
    
    container.innerHTML = `
      <div class="search-suggestions">
        <h4 class="search-suggestions-title">Popular Searches</h4>
        <div class="search-suggestions-list">
          ${suggestions.map(term => `
            <button class="search-suggestion-tag" data-search="${term}">
              ${term}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.search-suggestion-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        const searchInput = document.querySelector('.search-modal-input');
        if (searchInput) {
          searchInput.value = btn.dataset.search;
          searchInput.dispatchEvent(new Event('input'));
        }
