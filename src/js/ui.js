// =============================================================================
// IMPORTS
// =============================================================================

import { toggleSaveBook, isBookSaved } from './storage.js';

// =============================================================================
// ASSET INITIALIZATION & BADGES
// =============================================================================

/**
 * Initializes static site assets (favicon, logo) and updates navigation indicators.
 */
export function initAssets() {
  let favicon = document.querySelector("link[rel~='icon']");
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }
  favicon.href = 'img/favicon.png';

  const logoEl = document.querySelector('.app-logo');
  if (logoEl) {
    logoEl.src = 'img/logo.png';
  }

  updateWishlistBadge();
}

/**
 * Updates the navigation badge count across all pages.
 */
export function updateWishlistBadge() {
  const badgeEl = document.getElementById('wishlist-badge');
  const navLinkEl = document.getElementById('wishlist-nav-link');

  // Option A: Hide badge element completely if it exists
  if (badgeEl) {
    badgeEl.style.display = 'none';
  }

  // Option B: Ensure nav link text stays clean ("Saved Books")
  if (navLinkEl) {
    navLinkEl.textContent = 'Saved Books';
  }
}

export function setStatusMessage(message) {
  const statusEl = document.getElementById('status-message');
  if (statusEl) {
    statusEl.textContent = message;
  }
}

// =============================================================================
// COMPONENT RENDERING (BOOKS LIST & BUTTONS)
// =============================================================================

/**
 * Renders or appends books to the list view.
 * @param {Array} books 
 * @param {Function} onBookClickCallback 
 * @param {boolean} append - If true, appends new cards instead of resetting list
 */
export function renderBooksList(books, onBookClickCallback, append = false) {
  const listEl = document.getElementById('books-list');
  if (!listEl) return;

  if (!append) {
    listEl.innerHTML = '';
  }

  if (!books || books.length === 0) return;

  books.forEach(book => {
    const li = document.createElement('li');
    li.className = 'book-card';

    const authorText = book.authors.join(', ');
    const saved = isBookSaved(book.key);

    // Container for details (title + authors)
    const detailsContainer = document.createElement('div');
    
    const titleEl = document.createElement('div');
    titleEl.className = 'book-title';
    titleEl.textContent = book.title;

    const authorsEl = document.createElement('div');
    authorsEl.className = 'book-authors';
    authorsEl.textContent = authorText;

    detailsContainer.appendChild(titleEl);
    detailsContainer.appendChild(authorsEl);

    // Container for actions/buttons
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'card-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = `save-btn ${saved ? 'saved' : ''}`;
    saveBtn.textContent = saved ? '★ Saved' : '☆ Save';

    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isNowSaved = toggleSaveBook(book);
      saveBtn.textContent = isNowSaved ? '★ Saved' : '☆ Save';
      saveBtn.classList.toggle('saved', isNowSaved);
      updateWishlistBadge();
    });

    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'details-btn';
    detailsBtn.textContent = 'View Details';

    detailsBtn.addEventListener('click', () => {
      onBookClickCallback(book.key, book.title, authorText);
    });

    actionsContainer.appendChild(saveBtn);
    actionsContainer.appendChild(detailsBtn);

    li.appendChild(detailsContainer);
    li.appendChild(actionsContainer);
    
    listEl.appendChild(li);
  });
}

/**
 * Toggles visibility of the Load More button.
 * @param {boolean} show 
 */
export function toggleLoadMoreButton(show) {
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    if (show) {
      loadMoreBtn.classList.remove('hidden');
    } else {
      loadMoreBtn.classList.add('hidden');
    }
  }
}

// =============================================================================
// MODAL CONTROLLER
// =============================================================================

/**
 * Populates and displays the book details modal dialog.
 * @param {string} title 
 * @param {string} authors 
 * @param {string} description 
 */
export function showBookDetailsModal(title, authors, description) {
  const modalTitle = document.getElementById('modal-title');
  const modalAuthors = document.getElementById('modal-authors');
  const modalDesc = document.getElementById('modal-description');
  const modal = document.getElementById('details-modal');

  if (modalTitle) modalTitle.textContent = title;
  if (modalAuthors) modalAuthors.textContent = `Authors: ${authors}`;
  if (modalDesc) modalDesc.textContent = description;
  if (modal) modal.classList.remove('hidden');
}

export function hideModal() {
  const modal = document.getElementById('details-modal');
  if (modal) modal.classList.add('hidden');
}