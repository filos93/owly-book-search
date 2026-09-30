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
 * Shape: { key: string, title: string, authors: string[], savedAt: string }
 * @param {Object|string} bookOrKey 
 * @returns {Object|null}
 */
function sanitizeBookEntry(bookOrKey) {
  if (!bookOrKey) return null;

  // Handle bare string key lookup
  if (typeof bookOrKey === 'string') {
    const trimmedKey = bookOrKey.trim();
    if (!trimmedKey) return null;
    return { 
      key: trimmedKey, 
      title: 'Untitled', 
      authors: ['Unknown Author'],
      savedAt: new Date(0).toISOString()
    };
  }

  // Ensure key is a valid non-empty string
  const rawKey = bookOrKey.key || bookOrKey.workKey;
  const key = typeof rawKey === 'string' ? rawKey.trim() : (typeof rawKey === 'number' ? String(rawKey) : '');
  if (!key) return null;

  // Ensure title is a string
  const title = typeof bookOrKey.title === 'string' && bookOrKey.title.trim() 
    ? bookOrKey.title.trim() 
    : 'Untitled';

  // Parse and normalize authors array
  let authors = ['Unknown Author'];
  if (Array.isArray(bookOrKey.authors)) {
    authors = bookOrKey.authors
      .map(a => (typeof a === 'string' ? a.trim() : a?.name?.trim()))
      .filter(Boolean);
  } else if (typeof bookOrKey.authors === 'string' && bookOrKey.authors.trim()) {
    authors = bookOrKey.authors.split(',').map(a => a.trim()).filter(Boolean);
  }

  if (authors.length === 0) {
    authors = ['Unknown Author'];
  }

  // Preserve existing timestamp, fallback to ISO now or epoch 0
  const savedAt = typeof bookOrKey.savedAt === 'string' 
    ? bookOrKey.savedAt 
    : new Date(0).toISOString();

  return { key, title, authors, savedAt };
}

/**
 * Helper to safely extract key string from a book or string key.
 */
function extractKey(bookOrKey) {
  if (!bookOrKey) return null;
  if (typeof bookOrKey === 'string') return bookOrKey.trim() || null;
  const key = bookOrKey.key || bookOrKey.workKey;
  return typeof key === 'string' ? key.trim() : null;
}

// =============================================================================
// WISHLIST / SAVED BOOKS MANAGER
// =============================================================================

/**
 * Retrieves saved books from localStorage, normalized and sorted newest to oldest.
 * @returns {Array} Array of normalized book objects.
 */
export function getSavedBooks() {
  try {
    const data = localStorage.getItem(WISHLIST_KEY);
    const books = data ? JSON.parse(data) : [];
    
    const normalized = books.map(sanitizeBookEntry).filter(Boolean);

    // Sort descending: newest timestamp first
    return normalized.sort((a, b) => {
      const timeA = new Date(a.savedAt).getTime();
      const timeB = new Date(b.savedAt).getTime();
      return timeB - timeA;
    });
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

  // Read raw storage array without sorting
  const data = localStorage.getItem(WISHLIST_KEY);
  const raw = data ? JSON.parse(data) : [];
  const saved = raw.map(sanitizeBookEntry).filter(Boolean);

  const index = saved.findIndex(b => b.key === normalized.key);

  if (index > -1) {
    saved.splice(index, 1);
    saveBooks(saved);
    return false; // Removed
  } else {
    // Add current ISO timestamp on save
    saved.push({
      ...normalized,
      savedAt: new Date().toISOString()
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
  return saved.some(b => b.key === targetKey);
}

// =============================================================================
// IMPORT / EXPORT BACKUP MANAGEMENT
// =============================================================================

/**
 * Downloads the saved books as a JSON backup file.
 * Uses Blobs for memory efficiency and supports metadata wrapping.
 * 
 * @throws {Error} If no saved books exist to export.
 */
export function exportWishlist() {
  const savedBooks = getSavedBooks();
  if (!savedBooks || savedBooks.length === 0) {
    throw new Error('No saved books to export!');
  }

  // Backup wrapper con metadati (perfettamente compatibile con la tua importWishlist)
  const backupData = {
    exportedAt: new Date().toISOString(),
    books: savedBooks
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = 'owly-wishlist-backup.json';
  
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  
  // Cleanup per evitare memory leak
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}

export const exportWishlistJson = exportWishlist;

/**
 * Imports books from a JSON backup file, validates schema into canonical shape,
 * and merges with existing localStorage data by default.
 * 
 * @param {File} file 
 * @param {Object} [options] 
 * @param {boolean} [options.merge=true] - If true, merges with existing list. If false, overwrites.
 * @returns {Promise<Array>} Resolves with final updated books array or rejects with Error.
 */
export function importWishlist(file, { merge = true } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided for import.'));
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const rawJson = JSON.parse(event.target.result);

        const importedData = Array.isArray(rawJson) 
          ? rawJson 
          : (rawJson && Array.isArray(rawJson.books) ? rawJson.books : null);

        if (!importedData) {
          return reject(new Error('Invalid backup file format: Expected a JSON array or a valid backup object with "books".'));
        }

        const sanitizedImported = importedData
          .map(sanitizeBookEntry)
          .filter(Boolean);

        if (sanitizedImported.length === 0 && importedData.length > 0) {
          return reject(new Error('No valid book entries found in the backup file.'));
        }

        let finalBooks = [];

        if (merge) {
          const existingBooks = getSavedBooks();
          const bookMap = new Map();

          existingBooks.forEach((book) => {
            if (book && book.key) bookMap.set(book.key, book);
          });

          sanitizedImported.forEach((book) => {
            if (book && book.key) bookMap.set(book.key, book);
          });

          finalBooks = Array.from(bookMap.values());
        } else {
          finalBooks = sanitizedImported;
        }

        saveBooks(finalBooks);
        resolve(finalBooks);
      } catch (err) {
        reject(new Error('Could not parse backup file. Ensure it is a valid JSON file.'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read backup file.'));
    reader.readAsText(file);
  });
}

// =============================================================================
// USER PROFILE & READ BOOKS MANAGER
// =============================================================================

/**
 * Retrieves user profile or defaults to an empty profile structure.
 * Normalizes readBooks entries into canonical { key, title, authors: string[] } shape.
 */
export function getUserProfile() {
  try {
    const profile = localStorage.getItem(PROFILE_KEY);
    const parsed = profile ? JSON.parse(profile) : {};
    const rawReadBooks = Array.isArray(parsed.readBooks) ? parsed.readBooks : [];

    const readBooks = rawReadBooks
      .map(entry => {
        const sanitized = sanitizeBookEntry(entry);
        if (!sanitized) return null;
        return {
          ...sanitized,
          readAt: entry.readAt || new Date().toISOString()
        };
      })
      .filter(Boolean);

    return { ...parsed, readBooks };
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