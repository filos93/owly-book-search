// =============================================================================
// STORAGE KEYS & CONSTANTS
// =============================================================================

const WISHLIST_KEY = 'owly_saved_books';
const PROFILE_KEY = 'owly_user_profile';

// =============================================================================
// INTERNAL HELPERS & DATA NORMALIZATION
// =============================================================================

/**
 * Normalizes any book input or legacy storage record into the unified internal shape.
 * Shape: { key: string, title: string, authors: string[] }
 * @param {Object|string} bookOrKey 
 * @returns {Object|null}
 */
function sanitizeBookEntry(bookOrKey) {
  if (!bookOrKey) return null;

  // Handle bare string key lookup
  if (typeof bookOrKey === 'string') {
    return { key: bookOrKey, title: 'Untitled', authors: ['Unknown Author'] };
  }

  const key = bookOrKey.key || bookOrKey.workKey;
  if (!key) return null;

  const title = typeof bookOrKey.title === 'string' ? bookOrKey.title : 'Untitled';

  let authors = ['Unknown Author'];
  if (Array.isArray(bookOrKey.authors)) {
    authors = bookOrKey.authors
      .map(a => (typeof a === 'string' ? a : a?.name))
      .filter(Boolean);
  } else if (typeof bookOrKey.authors === 'string' && bookOrKey.authors.trim()) {
    authors = bookOrKey.authors.split(',').map(a => a.trim()).filter(Boolean);
  }

  if (authors.length === 0) {
    authors = ['Unknown Author'];
  }

  return { key, title, authors };
}

/**
 * Helper to safely extract key string from a book or string key.
 */
function extractKey(bookOrKey) {
  if (!bookOrKey) return null;
  if (typeof bookOrKey === 'string') return bookOrKey;
  return bookOrKey.key || bookOrKey.workKey || null;
}

// =============================================================================
// WISHLIST / SAVED BOOKS MANAGER
// =============================================================================

/**
 * Retrieves saved books from localStorage, normalizing legacy items on read.
 * @returns {Array} Array of normalized book objects.
 */
export function getSavedBooks() {
  try {
    const data = localStorage.getItem(WISHLIST_KEY);
    const books = data ? JSON.parse(data) : [];
    return books.map(sanitizeBookEntry).filter(Boolean);
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
  const normalized = books.map(sanitizeBookEntry).filter(Boolean);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(normalized));
}

/**
 * Toggles a book in/out of the wishlist using standardized structure.
 * @param {Object} book - { key, title, authors }
 * @returns {boolean} True if saved, false if removed.
 */
export function toggleSaveBook(book) {
  const normalized = sanitizeBookEntry(book);
  if (!normalized) return false;

  const saved = getSavedBooks();
  const index = saved.findIndex(b => b.key === normalized.key);

  if (index > -1) {
    saved.splice(index, 1);
    saveBooks(saved);
    return false; // Removed
  } else {
    saved.push(normalized);
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
  return saved.some(b => b.key === targetKey);
}

// =============================================================================
// IMPORT / EXPORT BACKUP MANAGEMENT
// =============================================================================

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
 * Imports books from a JSON backup file, validates schema & types into canonical shape.
 * @param {File} file 
 * @param {Function} onSuccess 
 */
export function importWishlist(file, onSuccess) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedData = JSON.parse(event.target.result);

      if (!Array.isArray(importedData)) {
        alert('Invalid backup file format: Expected an array of books.');
        return;
      }

      // Sanitize and validate every imported entry into { key, title, authors: string[] }
      const sanitizedBooks = importedData
        .map(sanitizeBookEntry)
        .filter(Boolean);

      if (sanitizedBooks.length === 0 && importedData.length > 0) {
        alert('No valid book entries found in the backup file.');
        return;
      }

      saveBooks(sanitizedBooks);
      if (typeof onSuccess === 'function') onSuccess();
    } catch (err) {
      alert('Could not parse the backup file. Ensure it is a valid JSON file.');
    }
  };
  reader.readAsText(file);
}

// =============================================================================
// USER PROFILE & READ BOOKS MANAGER
// =============================================================================

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
  const normalized = sanitizeBookEntry(bookData);
  if (!normalized) return false;

  const profile = getUserProfile();
  if (!profile.readBooks) profile.readBooks = [];

  const existsIndex = profile.readBooks.findIndex(b => extractKey(b) === normalized.key);

  if (existsIndex > -1) {
    profile.readBooks.splice(existsIndex, 1);
  } else {
    profile.readBooks.push({
      ...normalized,
      readAt: new Date().toISOString()
    });
  }

  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return existsIndex === -1;
}