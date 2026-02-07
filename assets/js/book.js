/**
 * Jay Libraries - Book Detail Page
 */

(function() {
  'use strict';

  async function initBookPage() {
    const container = document.getElementById('book-detail');
    if (!container) return;

    const bookId = JayLibraries.getUrlParam('id');
    
    if (!bookId) {
      showError(container, 'No book ID provided');
      return;
    }

    // Show loading state
    container.innerHTML = `
      <div class="book-detail-container">
        <div class="skeleton" style="aspect-ratio: 3/4; border-radius: var(--radius-xl);"></div>
        <div>
          <div class="skeleton skeleton-text" style="width: 30%; margin-bottom: 1rem;"></div>
          <div class="skeleton skeleton-text" style="width: 80%; height: 3rem; margin-bottom: 1rem;"></div>
          <div class="skeleton skeleton-text" style="width: 40%; margin-bottom: 2rem;"></div>
          <div class="skeleton" style="height: 100px; margin-bottom: 1rem;"></div>
          <div class="skeleton" style="height: 200px;"></div>
        </div>
      </div>
    `;

    const books = await JayLibraries.getBooks();
    const book = books?.find(b => b.id === bookId);

    if (!book) {
      showError(container, 'Book not found');
      return;
    }

    // Update page title
    document.title = `${book.title} - Jay Libraries`;

    // Render book details
    renderBookDetail(container, book);

    // Render related books
    const relatedBooks = books
      .filter(b => b.id !== book.id && b.category === book.category)
      .slice(0, 4);
    
    if (relatedBooks.length > 0) {
      renderRelatedBooks(relatedBooks);
    }

    // Initialize favorite button
    initFavoriteButton();
  }

  function showError(container, message) {
    container.innerHTML = `
      <div class="favorites-empty">
        <div class="favorites-empty-icon">
          ${JayLibraries.getIcon('info')}
        </div>
        <h2 class="favorites-empty-title">${message}</h2>
        <p class="favorites-empty-description">
          The book you're looking for might have been removed or doesn't exist.
        </p>
        <a href="library.html" class="btn btn-primary">
          Browse Library
        </a>
      </div>
    `;
  }

  function renderBookDetail(container, book) {
    const isFav = JayLibraries.isFavorite(book.id);

    container.innerHTML = `
      <div class="book-detail-container">
        <!-- Cover -->
        <div class="book-detail-cover">
          <div class="book-detail-cover-image">
            ${book.cover 
              ? `<img src="${book.cover}" alt="${book.title}">`
              : `<div class="book-detail-cover-placeholder">
                  ${JayLibraries.getIcon('book-open')}
                 </div>`
            }
          </div>
          <span class="book-detail-cover-format">${book.format}</span>
        </div>

        <!-- Info -->
        <div class="book-detail-info">
          <!-- Breadcrumb -->
          <nav class="book-detail-breadcrumb" aria-label="Breadcrumb">
            <a href="index.html">Home</a>
            ${JayLibraries.getIcon('chevron-right')}
            <a href="library.html">Library</a>
            ${JayLibraries.getIcon('chevron-right')}
            <a href="library.html?category=${encodeURIComponent(book.category)}">${book.category}</a>
            ${JayLibraries.getIcon('chevron-right')}
            <span>${book.title}</span>
          </nav>

          <!-- Category -->
          <span class="book-detail-category">
            ${JayLibraries.getIcon('book')}
            ${book.category}
          </span>

          <!-- Title -->
          <h1 class="book-detail-title">${book.title}</h1>

          <!-- Author -->
          <p class="book-detail-author">
            by <a href="library.html?author=${encodeURIComponent(book.author)}">${book.author}</a>
          </p>

          <!-- Divider -->
          <div class="book-detail-divider"></div>

          <!-- Description -->
          <p class="book-detail-description">${book.description}</p>

          <!-- Metadata -->
          <div class="book-detail-meta">
            <div class="book-detail-meta-item">
              <span class="book-detail-meta-label">Year</span>
              <span class="book-detail-meta-value">${book.year}</span>
            </div>
            <div class="book-detail-meta-item">
              <span class="book-detail-meta-label">Pages</span>
              <span class="book-detail-meta-value">${book.pages || 'N/A'}</span>
            </div>
            <div class="book-detail-meta-item">
              <span class="book-detail-meta-label">Format</span>
              <span class="book-detail-meta-value">${book.format}</span>
            </div>
            <div class="book-detail-meta-item">
              <span class="book-detail-meta-label">Language</span>
              <span class="book-detail-meta-value">${book.language || 'English'}</span>
            </div>
          </div>

          <!-- Tags -->
          ${book.tags && book.tags.length > 0 ? `
            <div class="book-detail-tags">
              ${book.tags.map(tag => `
                <a href="library.html?search=${encodeURIComponent(tag)}" class="book-detail-tag">
                  #${tag}
                </a>
              `).join('')}
            </div>
          ` : ''}

          <!-- Actions -->
          <div class="book-detail-actions">
            <a href="${book.file}" class="btn btn-primary btn-lg" download>
              ${JayLibraries.getIcon('download')}
              Download ${book.format}
            </a>
            <button class="btn btn-secondary btn-lg ${isFav ? 'active' : ''}" 
                    id="book-favorite-btn"
                    data-book-id="${book.id}">
              ${JayLibraries.getIcon(isFav ? 'heart-filled' : 'heart')}
              ${isFav ? 'Saved' : 'Save'}
            </button>
            <button class="btn btn-secondary btn-lg" id="share-btn">
              ${JayLibraries.getIcon('external-link')}
              Share
            </button>
          </div>
        </div>
      </div>
    `;

    // Share button
    const shareBtn = document.getElementById('share-btn');
    shareBtn?.addEventListener('click', async () => {
      const shareData = {
        title: book.title,
        text: `Check out "${book.title}" by ${book.author} on Jay Libraries`,
        url: window.location.href
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(window.location.href);
          JayLibraries.showToast('Link copied to clipboard!', 'check');
        }
      } catch (err) {
        console.error('Share failed:', err);
      }
    });
  }

  function renderRelatedBooks(books) {
    const section = document.getElementById('related-books');
    if (!section) return;

    section.innerHTML = `
      <div class="related-section">
        <div class="section-header section-header-left">
          <span class="section-badge">
            ${JayLibraries.getIcon('sparkles')}
            You might also like
          </span>
          <h2 class="section-title">Related Books</h2>
          <div class="section-divider"></div>
        </div>
        <div class="books-grid">
          ${books.map(book => JayLibraries.createBookCard(book)).join('')}
        </div>
      </div>
    `;

    // Initialize favorite buttons for related books
    initFavoriteButton();
  }

  function initFavoriteButton() {
    document.querySelectorAll('[data-action="toggle-favorite"], #book-favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        
        const bookId = btn.dataset.bookId;
        const isFavorite = JayLibraries.toggleFavorite(bookId);
        
        btn.classList.toggle('active', isFavorite);
        
        if (btn.id === 'book-favorite-btn') {
          btn.innerHTML = `
            ${JayLibraries.getIcon(isFavorite ? 'heart-filled' : 'heart')}
            ${isFavorite ? 'Saved' : 'Save'}
          `;
        } else {
          btn.innerHTML = JayLibraries.getIcon(isFavorite ? 'heart-filled' : 'heart');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initBookPage);

})();
