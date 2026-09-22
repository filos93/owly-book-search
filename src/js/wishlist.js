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

      // Safely determine book key and author string formatting
      const bookKey = book.key || book.workKey;
      const authorText = Array.isArray(book.authors) 
        ? book.authors.map(a => (typeof a === 'object' ? a.name : a)).join(', ')
        : (book.authors || 'Unknown Author');

      // Check read status using key object or string
      const read = isBookRead(bookKey);

      li.innerHTML = `
        <div>
          <div class="book-title ${read ? 'read-title' : ''}">
            ${book.title} ${read ? '✓' : ''}
          </div>
          <div class="book-authors">${authorText}</div>
        </div>
        <div class="card-actions">
          <button class="read-btn ${read ? 'completed' : ''}">
            ${read ? '✓ Completed' : 'Mark as Read'}
          </button>
          <button class="remove-btn">Remove</button>
          <button class="details-btn">View Details</button>
        </div>
      `;

      // Read Toggle Handler inside renderWishlist loop
      const readBtn = li.querySelector('.read-btn');
      readBtn.addEventListener('click', () => {
        const isNowCompleted = toggleReadBook({
          key: book.key || book.workKey,
          title: book.title,
          authors: book.authors
        });

        // Re-render Wishlist UI immediately
        renderWishlist();
      });

      // 2. Remove from Wishlist handler
      const removeBtn = li.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => {
        toggleSaveBook({
          key: bookKey,
          title: book.title,
          authors: authorText
        });
        renderWishlist();
        updateWishlistBadge();
      });

      // 3. View Details handler
      const detailsBtn = li.querySelector('.details-btn');
      detailsBtn.addEventListener('click', async () => {
        setStatusMessage('Loading description...');
        try {
          const desc = await fetchBookDescription(bookKey);
          setStatusMessage('');
          showBookDetailsModal(book.title, authorText, desc);
        } catch (error) {
          setStatusMessage(error.message || 'Failed to load details.');
        }
      });

      container.appendChild(li);
    });
  }
});