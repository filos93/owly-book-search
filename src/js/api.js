// =============================================================================
// IMPORTS & HTTP CLIENT CONFIGURATION
// =============================================================================

import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://openlibrary.org',
  timeout: 10000,
});

// =============================================================================
// DATA NORMALIZATION HELPER
// =============================================================================

/**
 * Transforms raw Open Library work objects into a standardized internal shape.
 * Shape: { key: string, title: string, authors: string[] }
 * 
 * @param {Object} rawBook 
 * @returns {Object|null} Normalized book object or null if invalid
 */
export function normalizeBook(rawBook) {
  if (!rawBook || typeof rawBook !== 'object') return null;

  // 1. Standardize key (check key or workKey)
  const rawKey = rawBook.key || rawBook.workKey;
  const key = typeof rawKey === 'string' ? rawKey.trim() : '';
  
  // Scarta il libro se non ha un'ID/chiave univoca
  if (!key) return null;

  // 2. Standardize title
  const title = typeof rawBook.title === 'string' && rawBook.title.trim()
    ? rawBook.title.trim()
    : 'Untitled Book';

  // 3. Standardize authors into an array of strings
  // Gestisce sia `author_name` (Search API) sia `authors` (Works API)
  const rawAuthors = rawBook.authors || rawBook.author_name;
  let authors = [];

  if (Array.isArray(rawAuthors)) {
    authors = rawAuthors
      .map(a => (typeof a === 'string' ? a.trim() : a?.name?.trim()))
      .filter(Boolean);
  } else if (typeof rawAuthors === 'string' && rawAuthors.trim()) {
    authors = rawAuthors.split(',').map(a => a.trim()).filter(Boolean);
  }

  if (authors.length === 0) {
    authors = ['Unknown Author'];
  }

  return { key, title, authors };
}

// =============================================================================
// SEARCH & CATEGORY API SERVICES
// =============================================================================

/**
 * Searches books by category with pagination support and optional cancellation signal.
 * Features automatic boundary punctuation trimming and safe URL path encoding.
 * 
 * @param {string} category - Category or subject term to search
 * @param {number} limit - Number of items per request (default: 30)
 * @param {number} offset - Number of items to skip for pagination (default: 0)
 * @param {Object} [options] - Additional request options (e.g. { signal })
 * @returns {Promise<{books: Array, searchedCategory: string}>} Normalized books and cleaned search term
 */
export async function searchBooksByCategory(category, limit = 30, offset = 0, options = {}) {
  if (!category || !category.trim()) {
    throw new Error('Please enter a valid search category.');
  }

  // Clean boundary symbols only, preserving unicode letters like 'à' (\p{L} = letters, \p{N} = numbers)
  const cleanedCategory = category
    .trim()
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}\s]+|[^\p{L}\p{N}\s]+$/gu, '')
    .replace(/\s+/g, '_');

  if (!cleanedCategory) {
    return { books: [], searchedCategory: category.trim() };
  }

  // Perform exact query safely (e.g. "sciencà" -> /subjects/scienc%C3%A0.json)
  const books = await fetchSubject(cleanedCategory, limit, offset, options);

  return {
    books,
    searchedCategory: cleanedCategory.replace(/_/g, ' ')
  };
}

/**
 * Internal helper to execute the Open Library subject endpoint request safely.
 */
async function fetchSubject(formattedCategory, limit, offset, options) {
  try {
    const encodedCategory = encodeURIComponent(formattedCategory);
    
    const response = await apiClient.get(
      `/subjects/${encodedCategory}.json`,
      {
        params: { limit, offset },
        ...options
      }
    );

    if (!response.data || !Array.isArray(response.data.works)) {
      return [];
    }

    return response.data.works.map(normalizeBook).filter(Boolean);
  } catch (error) {
    if (axios.isCancel(error) || error.name === 'AbortError') {
      throw error;
    }

    // Treat 404 as an empty list to indicate no results found
    if (error.response && error.response.status === 404) {
      return [];
    }

    console.error('API Search Error:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please check your internet connection.');
    }
    throw new Error('Failed to fetch books. Please try again.');
  }
}

// =============================================================================
// BOOK DETAILS & DESCRIPTION API SERVICES
// =============================================================================

/**
 * Fetches the detailed description for a specific work.
 * @param {string} workKey - Open Library work ID or key
 * @returns {Promise<string>}
 */
export async function fetchBookDescription(workKey) {
  if (!workKey) {
    throw new Error('Invalid book key.');
  }

  const formattedKey = workKey.startsWith('/works/') ? workKey : `/works/${workKey}`;

  try {
    const response = await apiClient.get(`${formattedKey}.json`);
    const data = response.data;

    if (!data) return 'No description available for this title.';

    if (typeof data.description === 'string') {
      return data.description;
    } else if (data.description && data.description.value) {
      return data.description.value;
    }

    return 'No description available for this title.';
  } catch (error) {
    console.error('API Details Error:', error);
    throw new Error('Could not retrieve book details.');
  }
}