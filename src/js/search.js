// =============================================================================
// IMPORTS
// =============================================================================

import { searchBooksByCategory, fetchBookDescription } from './api.js';
import { 
  initAssets, 
  setStatusMessage, 
  renderBooksList, 
  toggleLoadMoreButton,
  showBookDetailsModal, 
  hideModal 
} from './ui.js';

// =============================================================================
// APPLICATION INITIALIZATION & EVENT BINDINGS
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initAssets();

  const searchBtn = document.getElementById('search-btn');
  const categoryInput = document.getElementById('category-input');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const closeModalBtn = document.getElementById('close-modal');
  const modal = document.getElementById('details-modal');
  const chipButtons = document.querySelectorAll('.chip-btn');

  // Pagination & Async Request State
  const LIMIT = 30;
  let currentOffset = 0;
  let currentCategory = '';
  let displayCategory = ''; // Stores the cleaned/normalized category returned by the API
  let totalLoaded = 0;
  let isLoading = false;
  let activeSearchController = null; // AbortController for stopping ongoing fetch requests

  // Chip Legend Integration
  chipButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedCategory = button.getAttribute('data-category');
      if (!selectedCategory) return;

      if (categoryInput) {
        const cleanLabel = button.textContent.replace(/^[^\w\s]+/, '').trim();
        categoryInput.value = cleanLabel;
      }

      handleSearch();
    });
  });

  // Event Listeners
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

  // =============================================================================
  // EVENT HANDLERS & SEARCH CONTROLLER
  // =============================================================================
  
  /**
   * Fresh Search Handler
   */
  async function handleSearch() {
    const rawInput = categoryInput ? categoryInput.value.trim() : '';

    if (!rawInput) {
      setStatusMessage('Please enter a category name (e.g. science, history, fantasy).');
      return;
    }

    // Stop any ongoing search request before starting a new one
    if (activeSearchController) {
      activeSearchController.abort();
    }
    activeSearchController = new AbortController();

    // Reset pagination state
    currentCategory = rawInput;
    currentOffset = 0;
    totalLoaded = 0;
    isLoading = true;

    renderBooksList([], null, false);
    toggleLoadMoreButton(false);
    setStatusMessage(`Searching for "${rawInput}" books, please wait...`);

    try {
      // Destructure response to get books array and the actual cleaned category
      const { books, searchedCategory } = await searchBooksByCategory(
        currentCategory, 
        LIMIT, 
        currentOffset, 
        { signal: activeSearchController.signal }
      );

      displayCategory = searchedCategory || rawInput;

      if (!books || books.length === 0) {
        setStatusMessage(`No books found for "${displayCategory}". Check your spelling or try another category!`);
        return;
      }

      totalLoaded += books.length;
      setStatusMessage(`Showing ${totalLoaded} books in "${displayCategory}":`);
      renderBooksList(books, handleViewDetails, false);

      toggleLoadMoreButton(books.length === LIMIT);
    } catch (error) {
      // Ignore abort errors, but log and display other errors
      if (error.name === 'AbortError' || error.message?.includes('canceled')) {
        return;
      }
      console.error('Search failed:', error);
      setStatusMessage(error.message || 'Failed to fetch books. Please try again.');
    } finally {
      isLoading = false;
    }
  }

  /**
   * Load More Pagination Handler - Manages offset and button state atomically.
   */
  async function handleLoadMore() {
    // UI stop if a loading is already in progress or if the button is disabled
    if (isLoading || (loadMoreBtn && loadMoreBtn.disabled)) return;

    isLoading = true;

    if (loadMoreBtn) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Loading...';
    }

    const nextOffset = currentOffset + LIMIT;
    setStatusMessage(`Loading more "${displayCategory}" books...`);

    try {
      const { books: newBooks } = await searchBooksByCategory(
        currentCategory, 
        LIMIT, 
        nextOffset, 
        { signal: activeSearchController?.signal }
      );

      if (!newBooks || newBooks.length === 0) {
        setStatusMessage(`All available books for "${displayCategory}" have been loaded.`);
        toggleLoadMoreButton(false);
        return;
      }

      // only update the offset and totalLoaded if new books were successfully fetched
      currentOffset = nextOffset;
      totalLoaded += newBooks.length;

      setStatusMessage(`Showing ${totalLoaded} books in "${displayCategory}":`);
      renderBooksList(newBooks, handleViewDetails, true);

      toggleLoadMoreButton(newBooks.length === LIMIT);
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('canceled')) {
        return;
      }
      console.error('Load more failed:', error);
      setStatusMessage('Could not load more books. Please try again.');
    } finally {
      // reset loading state and re-enable the button regardless of success or failure
      isLoading = false;
      if (loadMoreBtn) {
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Load More Books';
      }
    }
  }

  /**
   * Modal Details Handler
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