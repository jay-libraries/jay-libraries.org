/**
 * Jay Libraries - Library Page
 * Full library with filtering, sorting, and pagination
 */

(function() {
  'use strict';

  // State
  let allBooks = [];
  let filteredBooks = [];
  let currentPage = 1;
  let itemsPerPage = 12;
  let currentView = 'grid';
  let currentFilters = {
    category: '',
    author: '',
    year: '',
    format: '',
    search: ''
  };
  let currentSort = {
    by: 'dateAdded',
    order: 'desc'
  };

  // ═══════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════
  
  async function initLibrary() {
    const booksGrid = document.getElementById('books-grid');
    if (!booksGrid) return;

    // Show skeleton loaders
    showSkeletons(booksGrid);

    // Fetch data
    allBooks = await JayLibraries.getBooks();
    const categories = await JayLibraries.getCategories();

    if (!allBooks) {
      showError(booksGrid, 'Failed to load books. Please try again.');
      return;
    }

    // Parse URL params for initial filters
    parseUrlParams();

    // Initialize filters
    initFilterDropdowns(categories);
    initSearchFilter();
    initViewToggle();
    initSortDropdown();

    // Apply filters and render
    applyFilters();

    // Listen for favorites updates
    window.addEventListener('favoritesUpdated', () => {
      renderBooks();
    });
  }

  function parseUrlParams() {
    const params = JayLibraries.getUrlParams();
    
    currentFilters.category = params.get('category') || '';
    currentFilters.author = params.get('author') || '';
    currentFilters.year = params.get('year') || '';
    currentFilters.format = params.get('format') || '';
    currentFilters.search = params.get('search') || '';
    
    currentPage = parseInt(params.get('page')) || 1;
  }

  // ═══════════════════════════════════════════════════════════
  // SKELETON LOADERS
  // ═══════════════════════════════════════════════════════════
  
  function showSkeletons(container) {
    container.innerHTML = Array(8).fill(0).map(() => 
      JayLibraries.createSkeletonCard()
    ).join('');
  }

  function showError(container, message) {
    container.innerHTML = `
      <div class="col-span-full text-center p-8">
        <div class="text-gray-500 mb-4">${JayLibraries.getIcon('info')}</div>
        <p class="text-gray-400">${message}</p>
        <button onclick="location.reload()" class="btn btn-secondary mt-4">
          Try Again
        </button>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════
  // FILTERS
  // ═══════════════════════════════════════════════════════════
  
  function initFilterDropdowns(categories) {
    // Category filter
    const categoryDropdown = document.getElementById('filter-category');
    if (categoryDropdown) {
      const options = categories.map(cat => cat.name);
      setupDropdown(categoryDropdown, 'Category', options, currentFilters.category, (value) => {
        currentFilters.category = value;
        currentPage = 1;
        applyFilters();
      });
    }

    // Author filter
    const authorDropdown = document.getElementById('filter-author');
    if (authorDropdown) {
      const authors = JayLibraries.getUniqueValues(allBooks, 'author');
      setupDropdown(authorDropdown, 'Author', authors, currentFilters.author, (value) => {
        currentFilters.author = value;
        currentPage = 1;
        applyFilters();
      });
    }

    // Year filter
    const yearDropdown = document.getElementById('filter-year');
    if (yearDropdown) {
      const years = JayLibraries.getUniqueValues(allBooks, 'year').sort((a, b) => b - a);
      setupDropdown(yearDropdown, 'Year', years.map(String), currentFilters.year, (value) => {
        currentFilters.year = value;
        currentPage = 1;
        applyFilters();
      });
    }

    // Format filter
    const formatDropdown = document.getElementById('filter-format');
    if (formatDropdown) {
      const formats = JayLibraries.getUniqueValues(allBooks, 'format');
      setupDropdown(formatDropdown, 'Format', formats, currentFilters.format, (value) => {
        currentFilters.format = value;
        currentPage = 1;
        applyFilters();
      });
    }
  }

  function setupDropdown(container, label, options, currentValue, onChange) {
    const isOpen = false;
    const displayValue = currentValue || `All ${label}s`;

    container.innerHTML = `
      <div class="filter-dropdown" data-filter="${label.toLowerCase()}">
        <button class="filter-dropdown-trigger ${currentValue ? 'active' : ''}" aria-expanded="false">
          <span>${displayValue}</span>
          ${JayLibraries.getIcon('chevron-down')}
        </button>
        <div class="filter-dropdown-menu">
          <button class="filter-dropdown-option ${!currentValue ? 'selected' : ''}" data-value="">
            All ${label}s
          </button>
          ${options.map(opt => `
            <button class="filter-dropdown-option ${currentValue === opt ? 'selected' : ''}" data-value="${opt}">
              ${opt}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    const dropdown = container.querySelector('.filter-dropdown');
    const trigger = container.querySelector('.filter-dropdown-trigger');
    const menu = container.querySelector('.filter-dropdown-menu');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCurrentlyOpen = dropdown.classList.contains('open');
      
      // Close all dropdowns
      document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('open'));
      
      if (!isCurrentlyOpen) {
        dropdown.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    menu.querySelectorAll('.filter-dropdown-option').forEach(option => {
      option.addEventListener('click', () => {
        const value = option.dataset.value;
        
        // Update UI
        menu.querySelectorAll('.filter-dropdown-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        trigger.querySelector('span').textContent = value || `All ${label}s`;
        trigger.classList.toggle('active', !!value);
        
        // Close dropdown
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        
        // Callback
        onChange(value);
      });
    });

    // Close on outside click
    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function initSearchFilter() {
    const searchInput = document.getElementById('library-search');
    if (!searchInput) return;

    // Set initial value from URL
    if (currentFilters.search) {
      searchInput.value = currentFilters.search;
    }

    const handleSearch = JayLibraries.debounce((value) => {
      currentFilters.search = value;
      currentPage = 1;
      applyFilters();
    }, 300);

    searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });
  }

  function initSortDropdown() {
    const sortDropdown = document.getElementById('sort-dropdown');
    if (!sortDropdown) return;

    const sortOptions = [
      { value: 'dateAdded-desc', label: 'Recently Added' },
      { value: 'dateAdded-asc', label: 'Oldest First' },
      { value: 'title-asc', label: 'Title (A-Z)' },
      { value: 'title-desc', label: 'Title (Z-A)' },
      { value: 'author-asc', label: 'Author (A-Z)' },
      { value: 'year-desc', label: 'Year (Newest)' },
      { value: 'year-asc', label: 'Year (Oldest)' }
    ];

    const currentSortValue = `${currentSort.by}-${currentSort.order}`;
    const currentLabel = sortOptions.find(o => o.value === currentSortValue)?.label || 'Recently Added';

    sortDropdown.innerHTML = `
      <div class="filter-dropdown">
        <button class="filter-dropdown-trigger" aria-expanded="false">
          <span>${currentLabel}</span>
          ${JayLibraries.getIcon('chevron-down')}
        </button>
        <div class="filter-dropdown-menu">
          ${sortOptions.map(opt => `
            <button class="filter-dropdown-option ${opt.value === currentSortValue ? 'selected' : ''}" data-value="${opt.value}">
              ${opt.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    const dropdown = sortDropdown.querySelector('.filter-dropdown');
    const trigger = sortDropdown.querySelector('.filter-dropdown-trigger');
    const menu = sortDropdown.querySelector('.filter-dropdown-menu');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    menu.querySelectorAll('.filter-dropdown-option').forEach(option => {
      option.addEventListener('click', () => {
        const [by, order] = option.dataset.value.split('-');
        currentSort = { by, order };
        
        menu.querySelectorAll('.filter-dropdown-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        trigger.querySelector('span').textContent = option.textContent;
        dropdown.classList.remove('open');
        
        applyFilters();
      });
    });

    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

  // ═══════════════════════════════════════════════════════════
  // VIEW TOGGLE
  // ═══════════════════════════════════════════════════════════
  
  function initViewToggle() {
    const viewToggle = document.getElementById('view-toggle');
    if (!viewToggle) return;

    viewToggle.innerHTML = `
      <button class="view-toggle-btn ${currentView === 'grid' ? 'active' : ''}" 
              data-view="grid" aria-label="Grid view">
        ${JayLibraries.getIcon('grid')}
      </button>
      <button class="view-toggle-btn ${currentView === 'list' ? 'active' : ''}" 
              data-view="list" aria-label="List view">
        ${JayLibraries.getIcon('list')}
      </button>
    `;

    viewToggle.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentView = btn.dataset.view;
        viewToggle.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderBooks();
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // FILTER APPLICATION
  // ═══════════════════════════════════════════════════════════
  
  function applyFilters() {
    // Start with all books
    let books = [...allBooks];

    // Apply search
    if (currentFilters.search) {
      books = JayLibraries.searchBooks(books, currentFilters.search);
    }

    // Apply category filter
    if (currentFilters.category) {
      books = books.filter(b => b.category === currentFilters.category);
    }

    // Apply author filter
    if (currentFilters.author) {
      books = books.filter(b => b.author === currentFilters.author);
    }

    // Apply year filter
    if (currentFilters.year) {
      books = books.filter(b => b.year === parseInt(currentFilters.year));
    }

    // Apply format filter
    if (currentFilters.format) {
      books = books.filter(b => b.format === currentFilters.format);
    }

    // Apply sort
    books = JayLibraries.sortBooks(books, currentSort.by, currentSort.order);

    filteredBooks = books;

    // Update URL
    updateUrl();

    // Render
    renderBooks();
    renderActiveFilters();
    renderResultCount();
  }

  function updateUrl() {
    const params = {};
    if (currentFilters.category) params.category = currentFilters.category;
    if (currentFilters.author) params.author = currentFilters.author;
    if (currentFilters.year) params.year = currentFilters.year;
    if (currentFilters.format) params.format = currentFilters.format;
    if (currentFilters.search) params.search = currentFilters.search;
    if (currentPage > 1) params.page = currentPage;
    
    JayLibraries.updateUrlParams(params);
  }

  function renderActiveFilters() {
    const container = document.getElementById('active-filters');
    if (!container) return;

    const activeFilters = Object.entries(currentFilters)
      .filter(([key, value]) => value && key !== 'search')
      .map(([key, value]) => ({ key, value }));

    if (activeFilters.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="active-filters">
        ${activeFilters.map(({ key, value }) => `
          <span class="active-filter-tag">
            ${key}: ${value}
            <button data-filter="${key}" aria-label="Remove ${key} filter">
              ${JayLibraries.getIcon('x')}
            </button>
          </span>
        `).join('')}
        <button class="btn btn-ghost btn-sm" id="clear-all-filters">
          Clear All
        </button>
      </div>
    `;

    // Remove individual filter
    container.querySelectorAll('.active-filter-tag button').forEach(btn => {
      btn.addEventListener('click', () => {
        const filterKey = btn.dataset.filter;
        currentFilters[filterKey] = '';
        currentPage = 1;
        applyFilters();
        
        // Reset dropdown UI
        const dropdown = document.querySelector(`[data-filter="${filterKey}"]`);
        if (dropdown) {
          dropdown.querySelector('.filter-dropdown-trigger span').textContent = `All ${filterKey}s`;
          dropdown.querySelector('.filter-dropdown-trigger').classList.remove('active');
          dropdown.querySelectorAll('.filter-dropdown-option').forEach(o => o.classList.remove('selected'));
          dropdown.querySelector('.filter-dropdown-option').classList.add('selected');
        }
      });
    });

    // Clear all filters
    document.getElementById('clear-all-filters')?.addEventListener('click', () => {
      currentFilters = { category: '', author: '', year: '', format: '', search: '' };
      currentPage = 1;
      
      // Reset search input
      const searchInput = document.getElementById('library-search');
      if (searchInput) searchInput.value = '';
      
      // Reset all dropdowns
      document.querySelectorAll('.filter-dropdown').forEach(dropdown => {
        const trigger = dropdown.querySelector('.filter-dropdown-trigger');
        if (trigger) {
          const label = dropdown.dataset.filter;
          trigger.querySelector('span').textContent = `All ${label}s`;
          trigger.classList.remove('active');
        }
        dropdown.querySelectorAll('.filter-dropdown-option').forEach((o, i) => {
          o.classList.toggle('selected', i === 0);
        });
      });
      
      applyFilters();
    });
  }

  function renderResultCount() {
    const countEl = document.getElementById('result-count');
    if (!countEl) return;

    const total = filteredBooks.length;
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, total);

    if (total === 0) {
      countEl.textContent = 'No books found';
    } else {
      countEl.textContent = `Showing ${start}-${end} of ${total} books`;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // RENDERING
  // ═══════════════════════════════════════════════════════════
  
  function renderBooks() {
    const container = document.getElementById('books-grid');
    if (!container) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const booksToShow = filteredBooks.slice(startIndex, endIndex);

    if (booksToShow.length === 0) {
      container.innerHTML = `
        <div class="col-span-full">
          <div class="favorites-empty">
            <div class="favorites-empty-icon">
              ${JayLibraries.getIcon('book')}
            </div>
            <h3 class="favorites-empty-title">No books found</h3>
            <p class="favorites-empty-description">
              Try adjusting your filters or search terms to find what you're looking for.
            </p>
            <button class="btn btn-primary" onclick="location.href='library.html'">
              View All Books
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Update grid/list class
    container.className = currentView === 'grid' ? 'books-grid' : 'books-list';

    if (currentView === 'grid') {
      container.innerHTML = booksToShow.map(book => 
        JayLibraries.createBookCard(book, { highlightQuery: currentFilters.search })
      ).join('');
    } else {
      container.innerHTML = booksToShow.map(book => createListItem(book)).join('');
    }

    renderPagination();
    initFavoriteButtons();
  }

  function createListItem(book) {
    const isFav = JayLibraries.isFavorite(book.id);
    
    return `
      <article class="book-list-item">
        <div class="book-list-image">
          ${book.cover 
            ? `<img src="${book.cover}" alt="${book.title}" loading="lazy">`
            : `<div class="book-card-placeholder">${JayLibraries.getIcon('book-open')}</div>`
          }
        </div>
        <div class="book-list-content">
          <div class="book-list-header">
            <span class="book-card-category">${book.category}</span>
            <span class="book-card-format">${book.format}</span>
          </div>
          <h3 class="book-list-title">
            <a href="book.html?id=${book.id}">${book.title}</a>
          </h3>
          <p class="book-list-author">by ${book.author}</p>
          <p class="book-list-description">${book.description}</p>
          <div class="book-list-meta">
            <span>${JayLibraries.getIcon('calendar')} ${book.year}</span>
            <span>${JayLibraries.getIcon('file-text')} ${book.pages || 'N/A'} pages</span>
            <span>${JayLibraries.getIcon('globe')} ${book.language || 'English'}</span>
          </div>
        </div>
        <div class="book-list-actions">
          <button class="btn btn-icon ${isFav ? 'active' : ''}" 
                  data-action="toggle-favorite" 
                  data-book-id="${book.id}"
                  aria-label="${isFav ? 'Remove from' : 'Add to'} favorites">
            ${JayLibraries.getIcon(isFav ? 'heart-filled' : 'heart')}
          </button>
          <a href="book.html?id=${book.id}" class="btn btn-secondary">View</a>
          <a href="${book.file}" class="btn btn-primary" download>
            ${JayLibraries.getIcon('download')}
            Download
          </a>
        </div>
      </article>
    `;
  }

  // ═══════════════════════════════════════════════════════════
  // PAGINATION
  // ═══════════════════════════════════════════════════════════
  
  function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;

    const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
    
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const pages = getPaginationRange(currentPage, totalPages);

    container.innerHTML = `
      <nav class="pagination" aria-label="Pagination">
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
          ${JayLibraries.getIcon('arrow-left')}
        </button>
        
        ${pages.map(page => {
          if (page === '...') {
            return `<span class="pagination-ellipsis">...</span>`;
          }
          return `
            <button class="pagination-btn ${page === currentPage ? 'active' : ''}" data-page="${page}">
              ${page}
            </button>
          `;
        }).join('')}
        
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
          ${JayLibraries.getIcon('arrow-right')}
        </button>
      </nav>
    `;

    container.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        currentPage = parseInt(btn.dataset.page);
        applyFilters();
        
        // Scroll to top of grid
        document.getElementById('books-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function getPaginationRange(current, total) {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    let prev;
    for (const i of range) {
      if (prev) {
        if (i - prev === 2) {
          rangeWithDots.push(prev + 1);
        } else if (i - prev !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  }

  // ═══════════════════════════════════════════════════════════
  // FAVORITES
  // ═══════════════════════════════════════════════════════════
  
  function initFavoriteButtons() {
    document.querySelectorAll('[data-action="toggle-favorite"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const bookId = btn.dataset.bookId;
        const isFavorite = JayLibraries.toggleFavorite(bookId);
        
        // Update all buttons for this book
        document.querySelectorAll(`[data-action="toggle-favorite"][data-book-id="${bookId}"]`).forEach(b => {
          b.classList.toggle('active', isFavorite);
          b.innerHTML = JayLibraries.getIcon(isFavorite ? 'heart-filled' : 'heart');
          b.setAttribute('aria-label', `${isFavorite ? 'Remove from' : 'Add to'} favorites`);
        });
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // INITIALIZE
  // ═══════════════════════════════════════════════════════════
  
  document.addEventListener('DOMContentLoaded', initLibrary);

})();
