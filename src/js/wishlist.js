// =============================================================================
// IMPORTS
// =============================================================================

import { fetchBookDescription } from './api.js';
import { 
  getSavedBooks, 
  toggleSaveBook, 
  isBookRead, 
  toggleReadBook, 
  exportWishlistJson, 
  importWishlist 
} from './storage.js';

import { 
  initAssets, 
  setStatusMessage, 
  showBookDetailsModal, 
  hideModal, 
  updateWishlistBadge 
} from './ui.js';

// =============================================================================
// APPLICATION INITIALIZATION & EVENT BINDINGS
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initAssets();

  const container = document.getElementById('wishlist-container');
  const closeModalBtn = document.getElementById('close-modal');
  const modal = document.getElementById('details-modal');
  const exportBtn = document.getElementById('export-btn');
  const importInput = document.getElementById('import-file');

  // Modal handlers
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', hideModal);
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        hideModal();
      }
    });
  }

  // Handle Export Click
  if (exportBtn) {
    exportBtn.addEventListener('click', exportWishlistJson);
  }

  // Handle Import File Selection
  if (importInput) {
    importInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        importWishlist(file, () => {
          renderWishlist();
          updateWishlistBadge();
          alert('Wishlist imported successfully!');
        });
      }
    });
  }

  renderWishlist();

  // =============================================================================
  // COMPONENT RENDERING & CARD ACTIONS
  // =============================================================================

  /**
   * Renders the user's saved books grid view with read/remove/details action handlers.
   */
  function renderWishlist() {
    if (!container) return;
    const books = getSavedBooks();
    container.innerHTML = '';

    if (!books || books.length === 0) {
      setStatusMessage('Your wishlist is empty. Explore categories to save books!');
      return;
    }

    setStatusMessage('');

    books.forEach(book => {
      const li = document.createElement('li');
      li.className = 'book-card';

      // Simplified
      const authorText = book.authors.join(', ');
      const read = isBookRead(book.Key);

      // Info Container
      const infoDiv = document.createElement('div');

      const titleDiv = document.createElement('div');
      titleDiv.className = `book-title ${read ? 'read-title' : ''}`;
      titleDiv.textContent = `${book.title || 'Untitled'} ${read ? '✓' : ''}`;

      const authorDiv = document.createElement('div');
      authorDiv.className = 'book-authors';
      authorDiv.textContent = authorText;

      infoDiv.appendChild(titleDiv);
      infoDiv.appendChild(authorDiv);

      // Actions Container
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'card-actions';

      const readBtn = document.createElement('button');
      readBtn.className = `read-btn ${read ? 'completed' : ''}`;
      readBtn.textContent = read ? '✓ Completed' : 'Mark as Read';

      // Simplified
      readBtn.addEventListener('click', () => {
        toggleReadBook(book);
        renderWishlist();
      });

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = 'Remove';

      // Simplified
      removeBtn.addEventListener('click', () => {
        toggleSaveBook(book);
        renderWishlist();
        updateWishlistBadge();
      });

      const detailsBtn = document.createElement('button');
      detailsBtn.className = 'details-btn';
      detailsBtn.textContent = 'View Details';

      detailsBtn.addEventListener('click', async () => {
        setStatusMessage('Loading description...');
        try {
          const desc = await fetchBookDescription(book.key);
          setStatusMessage('');
          showBookDetailsModal(book.title, authorText, desc);
        } catch (error) {
          setStatusMessage(error.message || 'Failed to load details.');
        }
      });

      actionsDiv.appendChild(readBtn);
      actionsDiv.appendChild(removeBtn);
      actionsDiv.appendChild(detailsBtn);

      li.appendChild(infoDiv);
      li.appendChild(actionsDiv);

      container.appendChild(li);
    });
  }
});