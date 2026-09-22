import { searchBooksByCategory, fetchBookDescription } from './api.js';
import { 
  initAssets, 
  setStatusMessage, 
  renderBooksList, 
  toggleLoadMoreButton,
  showBookDetailsModal, 
  hideModal 
} from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  initAssets();

  const searchBtn = document.getElementById('search-btn');
  const categoryInput = document.getElementById('category-input');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const closeModalBtn = document.getElementById('close-modal');
  const modal = document.getElementById('details-modal');
  const chipButtons = document.querySelectorAll('.chip-btn');

  // Pagination state
  const LIMIT = 30;
  let currentOffset = 0;
  let currentCategory = '';
  let totalLoaded = 0;

  // 1. Chip Legend Integration
  chipButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedCategory = button.getAttribute('data-category');
      if (!selectedCategory) return;

      if (categoryInput) {
        // Strip emojis to populate input field with clean text (e.g. "📖 Fiction" -> "Fiction")
        const cleanLabel = button.textContent.replace(/^[^\w\s]+/, '').trim();
        categoryInput.value = cleanLabel;
      }

      // Triggers handleSearch(), using status text inside the card
      handleSearch();
    });
  });

  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }

  if (categoryInput) {
    categoryInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSearch();
      }
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', handleLoadMore);
  }

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

  /**
   * Fresh Search Handler
   */
  async function handleSearch() {
    const category = categoryInput ? categoryInput.value.trim() : '';

    if (!category) {
      setStatusMessage('Please enter a category name (e.g. science, history, fantasy).');
      return;
    }

    // Reset pagination state
    currentCategory = category;
    currentOffset = 0;
    totalLoaded = 0;

    renderBooksList([], null, false);
    toggleLoadMoreButton(false);

    // Status text displays inside the category card
    setStatusMessage(`Searching for "${category}" books, please wait...`);

    try {
      const books = await searchBooksByCategory(currentCategory, LIMIT, currentOffset);

      if (!books || books.length === 0) {
        setStatusMessage(`No books found for "${category}". Try another category!`);
        return;
      }

      totalLoaded += books.length;
      setStatusMessage(`Showing ${totalLoaded} books in "${category}":`);
      renderBooksList(books, handleViewDetails, false);

      toggleLoadMoreButton(books.length === LIMIT);
    } catch (error) {
      console.error('Search failed:', error);
      setStatusMessage(error.message || 'Failed to fetch books. Please try again.');
    }
  }

  /**
   * Load More Handler
   */
  async function handleLoadMore() {
    currentOffset += LIMIT;
    setStatusMessage(`Loading more "${currentCategory}" books...`);

    try {
      const newBooks = await searchBooksByCategory(currentCategory, LIMIT, currentOffset);

      if (!newBooks || newBooks.length === 0) {
        setStatusMessage(`All available books for "${currentCategory}" have been loaded.`);
        toggleLoadMoreButton(false);
        return;
      }

      totalLoaded += newBooks.length;
      setStatusMessage(`Showing ${totalLoaded} books in "${currentCategory}":`);
      
      // Append new items to existing grid
      renderBooksList(newBooks, handleViewDetails, true);

      toggleLoadMoreButton(newBooks.length === LIMIT);
    } catch (error) {
      console.error('Load more failed:', error);
      setStatusMessage('Could not load more books. Please try again.');
    }
  }

  /**
   * Modal Description Handler
   */
  async function handleViewDetails(workKey, title, authors) {
    setStatusMessage('Fetching book description...');

    try {
      const description = await fetchBookDescription(workKey);
      setStatusMessage('');
      showBookDetailsModal(title, authors, description);
    } catch (error) {
      console.error('Fetch description failed:', error);
      setStatusMessage('Could not load description for this book.');
    }
  }
});