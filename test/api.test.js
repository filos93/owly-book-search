import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { searchBooksByCategory, fetchBookDescription } from '../src/js/api.js';

// Mock axios module completely
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe('API Module Unit Tests', () => {
  let axiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    axiosInstance = axios.create();
  });

  describe('searchBooksByCategory', () => {
    it('should format category query and return works array', async () => {
      const mockWorks = [
        { key: '/works/OL1M', title: 'Owl Adventures' }
      ];

      axiosInstance.get.mockResolvedValueOnce({
        data: { works: mockWorks }
      });

      const results = await searchBooksByCategory(' Science Fiction ', 10, 0);

      expect(axiosInstance.get).toHaveBeenCalledWith('/subjects/science_fiction.json?limit=10&offset=0');
      expect(results).toEqual(mockWorks);
    });

    it('should throw an error if category is empty', async () => {
      await expect(searchBooksByCategory('   ')).rejects.toThrow('Please enter a valid search category.');
    });

    it('should return empty array if no works field is present', async () => {
      axiosInstance.get.mockResolvedValueOnce({ data: {} });

      const results = await searchBooksByCategory('fantasy');
      expect(results).toEqual([]);
    });
  });

  describe('fetchBookDescription', () => {
    it('should handle string description and format workKey if missing prefix', async () => {
      axiosInstance.get.mockResolvedValueOnce({
        data: { description: 'A great story about an owl.' }
      });

      const description = await fetchBookDescription('OL123W');

      expect(axiosInstance.get).toHaveBeenCalledWith('/works/OL123W.json');
      expect(description).toBe('A great story about an owl.');
    });

    it('should handle nested description object ({ value: "..." })', async () => {
      axiosInstance.get.mockResolvedValueOnce({
        data: { description: { value: 'Nested description text.' } }
      });

      const description = await fetchBookDescription('/works/OL123W');

      expect(description).toBe('Nested description text.');
    });

    it('should return fallback message if description is missing', async () => {
      axiosInstance.get.mockResolvedValueOnce({ data: {} });

      const description = await fetchBookDescription('OL123W');

      expect(description).toBe('No description available for this title.');
    });
  });
});