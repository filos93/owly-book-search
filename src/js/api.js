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
 * @param {Object} rawBook 
 * @returns {Object|null} Normalized book object { key, title, authors }
 */
function normalizeBook(rawBook) {
  if (!rawBook) return null;

  // Standardize key
  const key = rawBook.key || rawBook.workKey || '';

  // Standardize title
  const title = rawBook.title || 'Untitled Book';

  // Standardize authors into an array of strings
  let authors = [];
  if (Array.isArray(rawBook.authors)) {
    authors = rawBook.authors
      .map(a => (typeof a === 'string' ? a : a?.name))
      .filter(Boolean);
  } else if (typeof rawBook.authors === 'string' && rawBook.authors.trim()) {
    authors = [rawBook.authors.trim()];
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