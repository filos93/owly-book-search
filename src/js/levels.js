// =============================================================================
// IMPORTS & CONSTANTS
// =============================================================================

import { jsPDF } from 'jspdf';
import { getUserProfile } from './storage.js';
import { initAssets } from './ui.js';

const MILESTONES = [
  { level: 1, title: 'Fledgling Reader', booksRequired: 0, badge: '🥚', desc: 'Welcome! Start reading your first book' },
  { level: 2, title: 'Page Turner', booksRequired: 2, badge: '📄', desc: 'Read 2 books' },
  { level: 3, title: 'Apprentice Reader', booksRequired: 5, badge: '📖', desc: 'Read 5 books' },
  { level: 4, title: 'Bookworm', booksRequired: 10, badge: '🐛', desc: 'Read 10 books' },
  { level: 5, title: 'Bibliophile', booksRequired: 20, badge: '📚', desc: 'Read 20 books' },
  { level: 6, title: 'Literary Scholar', booksRequired: 35, badge: '🎓', desc: 'Read 35 books' },
  { level: 7, title: 'Owly Legend', booksRequired: 50, badge: '👑', desc: 'Read 50 books' },
];

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

/**
 * Removes non-ASCII glyphs for Roboto PDF rendering while preserving Latin names.
 */
function cleanText(str) {
  if (!str) return '';
  return String(str)
    .replace(/[^\x20-\x7E]/g, '') // Strip unsupported non-Latin characters
    .trim();
}

/**
 * Cleans author list and prevents leading commas when foreign names are stripped.
 */
function formatAuthors(authors) {
  if (!Array.isArray(authors) || authors.length === 0) return 'Unknown Author';

  // Clean each author name and keep only those with readable Latin text
  const validAuthors = authors
    .map(cleanText)
    .filter(Boolean);

  if (validAuthors.length === 0) return 'Unknown Author';
  if (validAuthors.length <= 2) return validAuthors.join(', ');

  return `${validAuthors.slice(0, 2).join(', ')} et al.`;
}

// =============================================================================
// DOM INITIALIZATION & EVENT LISTENERS
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initAssets();

  const profile = getUserProfile();
  const rawBooks = profile.readBooks || [];

  // Deduplicate completed books
  const uniqueBooksMap = new Map();
  rawBooks.forEach(book => {
    if (book.key && !uniqueBooksMap.has(book.key)) {
      uniqueBooksMap.set(book.key, book);
    }
  });

  const completedBooks = Array.from(uniqueBooksMap.values());
  const totalRead = completedBooks.length;

  // Calculate Current Level
  let currentMilestone = MILESTONES[0];
  let nextMilestone = MILESTONES[1];

  for (let i = 0; i < MILESTONES.length; i++) {
    if (totalRead >= MILESTONES[i].booksRequired) {
      currentMilestone = MILESTONES[i];
      nextMilestone = MILESTONES[i + 1] || MILESTONES[i];
    }
  }

  // Update DOM elements
  const badgeEl = document.getElementById('current-badge');
  const titleEl = document.getElementById('current-level-title');
  const countEl = document.getElementById('total-read-count');
  const fillEl = document.getElementById('progress-bar-fill');
  const hintEl = document.getElementById('next-level-hint');
  const downloadBtn = document.getElementById('download-cert-btn');

  if (badgeEl) badgeEl.textContent = currentMilestone.badge;
  if (titleEl) titleEl.textContent = `${currentMilestone.title} (Level ${currentMilestone.level})`;
  if (countEl) countEl.textContent = `${totalRead} ${totalRead === 1 ? 'Book' : 'Books'} Completed`;

  // Handle Certificate Download
  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      try {
        await generateCertificate(currentMilestone, totalRead, completedBooks);
      } catch (err) {
        console.error('Certificate generation failed:', err);
      }
    });
  }

  // Progress Bar Calculation
  let progressPercent = 100;
  let booksNeeded = 0;

  if (currentMilestone.level !== nextMilestone.level) {
    const range = nextMilestone.booksRequired - currentMilestone.booksRequired;
    const progressInRange = totalRead - currentMilestone.booksRequired;
    progressPercent = Math.min(100, Math.max(0, Math.round((progressInRange / range) * 100)));
    booksNeeded = nextMilestone.booksRequired - totalRead;
  }

  if (fillEl) fillEl.style.width = `${progressPercent}%`;

  if (hintEl) {
    if (booksNeeded > 0) {
      hintEl.textContent = `Read ${booksNeeded} more ${booksNeeded === 1 ? 'book' : 'books'} to reach ${nextMilestone.title} (Level ${nextMilestone.level})!`;
    } else {
      hintEl.textContent = '🎉 You have unlocked all reading tiers!';
    }
  }

  // Render Milestone Roadmap
  const roadmapEl = document.getElementById('milestones-list');
  if (!roadmapEl) return;

  roadmapEl.innerHTML = '';

  MILESTONES.forEach(m => {
    const isUnlocked = totalRead >= m.booksRequired;
    const li = document.createElement('li');

    li.className = `level-card ${isUnlocked ? 'level-card--unlocked' : ''}`.trim();

    const badgeSpan = document.createElement('span');
    badgeSpan.className = 'level-card__badge';
    badgeSpan.textContent = isUnlocked ? m.badge : '🔒';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'level-card__content';

    const cardTitle = document.createElement('h4');
    cardTitle.className = 'level-card__title';
    cardTitle.textContent = `Level ${m.level}: ${m.title}`;

    const descEl = document.createElement('p');
    descEl.className = 'level-card__desc';
    descEl.textContent = m.desc;

    contentDiv.appendChild(cardTitle);
    contentDiv.appendChild(descEl);

    const statusSpan = document.createElement('span');
    statusSpan.className = 'level-card__status';
    statusSpan.textContent = isUnlocked ? '✓ Unlocked' : `${totalRead}/${m.booksRequired}`;

    li.appendChild(badgeSpan);
    li.appendChild(contentDiv);
    li.appendChild(statusSpan);

    roadmapEl.appendChild(li);
  });
});

// =============================================================================
// ASSET & FONT HELPERS
// =============================================================================

/**
 * Loads Roboto font into jsPDF dynamically from CDN.
 */
async function loadUnicodeFont(doc) {
  try {
    const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf');
    const buffer = await response.arrayBuffer();
    
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    doc.addFileToVFS('Roboto-Regular.ttf', btoa(binary));
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
  } catch (err) {
    console.warn('Could not load Roboto font, falling back to Helvetica:', err);
    doc.setFont('helvetica');
  }
}

/**
 * Converts image path to Base64 data URL.
 */
async function getImageDataUrl(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// =============================================================================
// PDF CERTIFICATE GENERATOR
// =============================================================================

async function generateCertificate(milestone, count, books) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  await loadUnicodeFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Decorative Borders
  doc.setLineWidth(2);
  doc.setDrawColor(49, 162, 184);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  doc.setLineWidth(0.5);
  doc.setDrawColor(203, 213, 225);
  doc.rect(10.5, 10.5, pageWidth - 21, pageHeight - 21);

  // Load Logo
  const logoInfo = await getImageDataUrl('./img/logo.png');
  let startY = 36;

  if (logoInfo) {
    const logoHeight = 32;
    const logoWidth = logoHeight * logoInfo.aspectRatio;
    const logoX = (pageWidth - logoWidth) / 2;

    doc.addImage(logoInfo.dataUrl, 'PNG', logoX, 16, logoWidth, logoHeight);
    startY = 16 + logoHeight + 10;
  }

  // Header Title
  doc.setFontSize(26);
  doc.setTextColor(30, 41, 59);
  doc.text('OWLY READING CERTIFICATE', pageWidth / 2, startY, { align: 'center' });

  // Subtitle / Milestone Rank
  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139);
  doc.text('This certifies reading milestone achievement:', pageWidth / 2, startY + 10, { align: 'center' });

  doc.setFontSize(22);
  doc.setTextColor(49, 162, 184);
  doc.text(`${milestone.title} (Level ${milestone.level})`, pageWidth / 2, startY + 22, { align: 'center' });

  // Summary Stat
  doc.setFontSize(13);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Books Completed: ${count}`, pageWidth / 2, startY + 31, { align: 'center' });

  // Divider Line
  const lineY = startY + 37;
  doc.setDrawColor(226, 232, 240);
  doc.line(30, lineY, pageWidth - 30, lineY);

  // Completed Books List
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Completed Reading Log:', 30, lineY + 10);

  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);

  let yPosition = lineY + 17;
  if (!books || books.length === 0) {
    doc.text('• No books completed yet.', 35, yPosition);
  } else {
    const displayList = books.slice(0, 10);
    displayList.forEach((book, index) => {
      const cleanedTitle = cleanText(book.title);
      const title = cleanedTitle 
        ? (cleanedTitle.length > 50 ? cleanedTitle.substring(0, 47) + '...' : cleanedTitle)
        : 'Untitled Work';
        
      const authors = formatAuthors(book.authors);

      const lineText = `${index + 1}. "${title}" — ${authors}`;
      doc.text(lineText, 35, yPosition);
      yPosition += 6;
    });

    if (books.length > 10) {
      doc.text(`...and ${books.length - 10} more completed books.`, 35, yPosition + 1);
    }
  }

  // Footer Info
  const today = new Date().toLocaleDateString();
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Issued on: ${today}`, 30, pageHeight - 16);
  doc.text('Verified by Owly App', pageWidth - 30, pageHeight - 16, { align: 'right' });

  // Download PDF
  doc.save(`Owly-Certificate-Level-${milestone.level}.pdf`);
}