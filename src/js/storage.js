const WISHLIST_KEY = 'owly_saved_books';
const PROFILE_KEY = 'owly_user_profile';

/**
 * Safely extracts the key string from a book object or string key.
 */
function extractKey(bookOrKey) {
  if (!bookOrKey) return null;
  if (typeof bookOrKey === 'string') return bookOrKey;
  return bookOrKey.key || bookOrKey.workKey || null;
}

/**
 * Retrieves saved books from localStorage.
 * @returns {Array} Array of saved book objects.
 */
export function getSavedBooks() {
  try {
    const data = localStorage.getItem(WISHLIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error loading wishlist:', err);
    return [];
  }
}

/**
 * Saves or updates the books array in localStorage.
 * @param {Array} books 
 */
export function saveBooks(books) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(books));
}

/**
 * Toggles a book in/out of the wishlist.
 * @param {Object} book - { key, title, authors }
 * @returns {boolean} True if saved, false if removed.
 */
export function toggleSaveBook(book) {
  const targetKey = extractKey(book);
  if (!targetKey) return false;

  const saved = getSavedBooks();
  const index = saved.findIndex(b => extractKey(b) === targetKey);

  if (index > -1) {
    saved.splice(index, 1);
    saveBooks(saved);
    return false; // Removed
  } else {
    saved.push({
      key: targetKey,
      title: book.title || 'Untitled',
      authors: book.authors || 'Unknown Author'
    });
    saveBooks(saved);
    return true; // Added
  }
}

/**
 * Checks if a book key is in the wishlist.
 * @param {string|Object} bookOrKey 
 * @returns {boolean}
 */
export function isBookSaved(bookOrKey) {
  const targetKey = extractKey(bookOrKey);
  if (!targetKey) return false;

  const saved = getSavedBooks();
  return saved.some(b => extractKey(b) === targetKey);
}

/**
 * Downloads the saved books as a JSON file.
 */
export function exportWishlist() {
  const savedBooks = getSavedBooks();
  if (savedBooks.length === 0) {
    alert('No saved books to export!');
    return;
  }

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedBooks, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "owly-wishlist-backup.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export const exportWishlistJson = exportWishlist;

/**
 * Imports books from a JSON backup file and saves them to localStorage.
 * @param {File} file 
 * @param {Function} onSuccess 
 */
export function importWishlist(file, onSuccess) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedBooks = JSON.parse(event.target.result);
      if (Array.isArray(importedBooks)) {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(importedBooks));
        if (typeof onSuccess === 'function') onSuccess();
      } else {
        alert('Invalid backup file format.');
      }
    } catch (err) {
      alert('Could not parse the backup file.');
    }
  };
  reader.readAsText(file);
}

/**
 * Retrieves user profile or defaults to an empty profile structure.
 */
export function getUserProfile() {
  try {
    const profile = localStorage.getItem(PROFILE_KEY);
    const parsed = profile ? JSON.parse(profile) : {};
    return { readBooks: [], ...parsed };
  } catch (err) {
    return { readBooks: [] };
  }
}

/**
 * Checks if a book is marked as read.
 */
export function isBookRead(bookOrKey) {
  const targetKey = extractKey(bookOrKey);
  if (!targetKey) return false;

  const profile = getUserProfile();
  return (profile.readBooks || []).some(b => extractKey(b) === targetKey);
}

/**
 * Toggles a book between read and unread status.
 */
export function toggleReadBook(bookData) {
  const targetKey = extractKey(bookData);
  if (!targetKey) return false;

  const profile = getUserProfile();
  if (!profile.readBooks) profile.readBooks = [];

  const existsIndex = profile.readBooks.findIndex(b => extractKey(b) === targetKey);

  if (existsIndex > -1) {
    profile.readBooks.splice(existsIndex, 1);
  } else {
    profile.readBooks.push({
      key: targetKey,
      title: bookData.title || 'Untitled',
      authors: bookData.authors || 'Unknown Author',
      readAt: new Date().toISOString()
    });
  }

  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return existsIndex === -1;
}