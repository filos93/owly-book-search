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

document.addEventListener('DOMContentLoaded', () => {
  initAssets();

  const profile = getUserProfile();
  const rawBooks = profile.readBooks || [];

  // Deduplicate and pull full completed book details
  const uniqueBooksMap = new Map();
  rawBooks.forEach(b => {
    const key = typeof b === 'string' ? b : (b?.key || b?.workKey);
    if (key && !uniqueBooksMap.has(key)) {
      uniqueBooksMap.set(key, b);
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
    downloadBtn.addEventListener('click', () => {
      generateCertificate(currentMilestone, totalRead, completedBooks);
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

    li.style.cssText = `
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      margin-bottom: 0.75rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: ${isUnlocked ? '#ffffff' : '#f8fafc'};
      opacity: ${isUnlocked ? '1' : '0.65'};
    `;

    li.innerHTML = `
      <span style="font-size: 2rem;">${isUnlocked ? m.badge : '🔒'}</span>
      <div style="flex-grow: 1;">
        <h4 style="margin: 0 0 2px 0;">Level ${m.level}: ${m.title}</h4>
        <p style="margin: 0; font-size: 0.85rem; color: #64748b;">${m.desc}</p>
      </div>
      <span style="font-weight: 600; color: #31a2b8;">
        ${isUnlocked ? '✓ Unlocked' : `${totalRead}/${m.booksRequired}`}
      </span>
    `;

    roadmapEl.appendChild(li);
  });
});

/**
 * Helper to convert and clean up an image from public/ into a transparent Base64 string.
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

/**
 * Helper to convert and clean up an image from public/ into a transparent Base64 string.
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

/**
 * Generates a PDF certificate with an accurately scaled, high-res logo.
 */
async function generateCertificate(milestone, count, books) {
  // Safe resolution across NPM module imports and window globals
  let PDFConstructor;
  if (typeof jsPDF !== 'undefined') {
    PDFConstructor = jsPDF;
  } else if (window.jspdf && window.jspdf.jsPDF) {
    PDFConstructor = window.jspdf.jsPDF;
  } else if (window.jsPDF) {
    PDFConstructor = window.jsPDF;
  } else {
    console.error('jsPDF library is not loaded.');
    return;
  }

  const doc = new PDFConstructor({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Decorative Borders
  doc.setLineWidth(2);
  doc.setDrawColor(49, 162, 184); // Owly cyan
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  doc.setLineWidth(0.5);
  doc.setDrawColor(203, 213, 225);
  doc.rect(10.5, 10.5, pageWidth - 21, pageHeight - 21);

  // 2. Load Logo from public/img/logo.png
  const logoInfo = await getImageDataUrl('/img/logo.png');
  let startY = 36;

  if (logoInfo) {
    const logoHeight = 28;
    const logoWidth = logoHeight * logoInfo.aspectRatio;
    const logoX = (pageWidth - logoWidth) / 2;

    doc.addImage(logoInfo.dataUrl, 'PNG', logoX, 15, logoWidth, logoHeight);
    startY = 15 + logoHeight + 10;
  }

  // 3. Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(30, 41, 59);
  doc.text('OWLY READING CERTIFICATE', pageWidth / 2, startY, { align: 'center' });

  // Subtitle / Milestone Rank
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('This certifies reading milestone achievement:', pageWidth / 2, startY + 8, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(49, 162, 184);
  const milestoneTitle = milestone?.title || 'Bookworm';
  const milestoneLevel = milestone?.level || 1;
  doc.text(`${milestoneTitle} (Level ${milestoneLevel})`, pageWidth / 2, startY + 18, { align: 'center' });

  // Summary Stat
  doc.setFontSize(12);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Books Completed: ${count || 0}`, pageWidth / 2, startY + 25, { align: 'center' });

  // Divider Line
  const lineY = startY + 31;
  doc.setDrawColor(226, 232, 240);
  doc.line(30, lineY, pageWidth - 30, lineY);

  // 4. Completed Books List
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Completed Reading Log:', 30, lineY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);

  let yPosition = lineY + 14;
  if (!books || books.length === 0) {
    doc.text('• No books completed yet.', 35, yPosition);
  } else {
    const displayList = books.slice(0, 10);
    displayList.forEach((book, index) => {
      const title = book.title || 'Untitled Book';
      const authors = typeof book.authors === 'string' ? book.authors : 'Unknown Author';
      doc.text(`${index + 1}. "${title}" — ${authors}`, 35, yPosition);
      yPosition += 5.5;
    });

    if (books.length > 10) {
      doc.text(`...and ${books.length - 10} more completed books.`, 35, yPosition + 1);
    }
  }

  // 5. Footer Info
  const today = new Date().toLocaleDateString();
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Issued on: ${today}`, 30, pageHeight - 16);
  doc.text('Verified by Owly App', pageWidth - 30, pageHeight - 16, { align: 'right' });

  // 6. Download PDF
  doc.save(`Owly-Certificate-Level-${milestoneLevel}.pdf`);
}