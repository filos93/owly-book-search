import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { fetchBooksBySubject, fetchBookDescription } from '../src/js/api.js';

vi.mock('axios');

describe('API Service Test', () => {
  it('fetchBooksBySubject dovrebbe restituire un array di libri', async () => {
    const dummyWorks = [{ title: "Alice's Adventures in Wonderland", key: "/works/OL8193508W" }];
    axios.get.mockResolvedValueOnce({ data: { works: dummyWorks } });

    const result = await fetchBooksBySubject('fantasy');
    expect(result).toEqual(dummyWorks);
    expect(axios.get).toHaveBeenCalledWith('https://openlibrary.org/subjects/fantasy.json');
  });

  it('fetchBookDescription dovrebbe estrarre la stringa di descrizione', async () => {
    const dummyDesc = "A famous book.";
    axios.get.mockResolvedValueOnce({ data: { description: dummyDesc } });

    const result = await fetchBookDescription('/works/OL8193508W');
    expect(result).toBe(dummyDesc);
  });
});