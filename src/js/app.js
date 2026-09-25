// =============================================================================
// IMPORTS
// =============================================================================

import { fetchBooksBySubject, fetchBookDescription } from './api.js';
import { 
  initAssets, 
  setStatusMessage, 
  renderBooksList, 
  showBookDetailsModal, 
  hideModal 
} from './ui.js';

// =============================================================================
// APPLICATION INITIALIZATION & DOM EVENTS
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initAssets();

  const searchBtn = document.getElementById('search-btn');
  const categoryInput = document.getElementById('category-input');
  const closeModalBtn = document.getElementById('close-modal');

  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }

  if (categoryInput) {
    categoryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', hideModal);
  }

  // =============================================================================
  // EVENT HANDLERS & SEARCH CONTROLLER
  // =============================================================================
  
  async function handleSearch() {
    if (!categoryInput) return;

    const category = categoryInput.value.trim();
    if (!category) {
      setStatusMessage('Please enter a subject before searching.');
      return;
    }

    setStatusMessage('Loading books...');
    try {
      const books = await fetchBooksBySubject(category);
      setStatusMessage('');
      renderBooksList(books, handleBookSelect);
    } catch (error) {
      setStatusMessage(error.message || 'An error occurred while fetching books.');
    }
  }

  /**
   * Fetches detailed information for a selected book and opens the modal viewport.
   * @param {string} workKey 
   * @param {string} title 
   * @param {string} authors 
   */
  async function handleBookSelect(workKey, title, authors) {
    setStatusMessage('Loading description...');
    try {
      const description = await fetchBookDescription(workKey);
      setStatusMessage('');
      showBookDetailsModal(title, authors, description);
    } catch (error) {
      setStatusMessage(error.message || 'An error occurred while fetching the description.');
    }
  }
});