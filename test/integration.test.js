import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderBooksList } from '../src/js/ui.js';
import { getSavedBooks } from '../src/js/storage.js';

describe('UI & Storage Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    // Setup required DOM elements used by renderBooksList and updateWishlistBadge
    document.body.innerHTML = `
      <ul id="books-list"></ul>
      <div id="wishlist-badge"></div>
      <a id="wishlist-nav-link"></a>
    `;
  });

  it('should render books into #books-list and save to storage when clicking save button', () => {
    const booksData = [
      {
        key: '/works/OL999W',
        title: "Charlotte's Web",
        authors: [{ name: 'E.B. White' }]
      }
    ];

    const mockCallback = vi.fn();

    // Render using your actual function name from ui.js
    renderBooksList(booksData, mockCallback);

    const listEl = document.getElementById('books-list');
    expect(listEl.children.length).toBe(1);

    const saveBtn = listEl.querySelector('.save-btn');
    expect(saveBtn).not.toBeNull();
    expect(saveBtn.textContent).toContain('☆ Save');

    // Simulate clicking the save button
    saveBtn.click();

    // Verify button state updated
    expect(saveBtn.textContent).toContain('★ Saved');

    // Verify state persisted into localStorage via storage module
    const savedBooks = getSavedBooks();
    expect(savedBooks).toHaveLength(1);
    expect(savedBooks[0].key).toBe('/works/OL999W');
  });

  it('should trigger modal callback when clicking details button', () => {
    const booksData = [
      {
        key: '/works/OL123W',
        title: 'Owly Adventures',
        authors: [{ name: 'Test Author' }]
      }
    ];

    const mockCallback = vi.fn();
    renderBooksList(booksData, mockCallback);

    const detailsBtn = document.querySelector('.details-btn');
    detailsBtn.click();

    expect(mockCallback).toHaveBeenCalledWith('/works/OL123W', 'Owly Adventures', 'Test Author');
  });
});