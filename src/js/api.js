// =============================================================================
// IMPORTS & HTTP CLIENT CONFIGURATION
// =============================================================================

import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://openlibrary.org',
  timeout: 10000,
});

// =============================================================================
// SEARCH & CATEGORY API SERVICES
// =============================================================================

/**
 * Searches books by category with pagination support.
 * @param {string} category 
 * @param {number} limit - Number of items per request (default: 30)
 * @param {number} offset - Number of items to skip for pagination (default: 0)
 * @returns {Promise<Array>}
 */
export async function searchBooksByCategory(category, limit = 30, offset = 0) {
  if (!category || !category.trim()) {
    throw new Error('Please enter a valid search category.');
  }

  const formattedCategory = category.trim().toLowerCase().replace(/\s+/g, '_');

  try {
    const response = await apiClient.get(
      `/subjects/${formattedCategory}.json?limit=${limit}&offset=${offset}`
    );

    if (!response.data || !response.data.works) {
      return [];
    }

    return response.data.works;
  } catch (error) {
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