import { fetchBooksBySubject, fetchBookDescription } from './api.js';
import { 
  initAssets, 
  setStatusMessage, 
  renderBooksList, 
  showBookDetailsModal, 
  hideModal 
} from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize static visual assets (Logo, Favicon, Background)
  initAssets();

  // 2. DOM Elements
  const searchBtn = document.getElementById('search-btn');
  const categoryInput = document.getElementById('category-input');
  const closeModalBtn = document.getElementById('close-modal');

  // 3. Event Listeners
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

  // 4. Search Handler
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

  // 5. Book Selection Handler
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