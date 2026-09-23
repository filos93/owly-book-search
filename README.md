# Owly — Interactive Book Search & Reading Tracker

Owly is a high-performance web application designed for early childhood literacy. Built with pure Vanilla JavaScript and Vite, it allows users to search children's
literature via Open Library, maintain a local reading wishlist, track milestones, and generate downloadable PDF reading certificates.

---

## ⚡ Key Features

* **Category & Keyword Search:** Real-time search across thousands of children's book subjects.
* **Persistent Wishlist:** Bookmark titles locally using browser `localStorage` synchronization.
* **Reading Milestones:** Interactive progress tracking with `jsPDF` certificate exports.
* **Modal Details:** Deep-dive book info with asynchronous description loading and author metadata.
* **Zero-Framework Architecture:** Lightweight Vanilla JS ES6 modules for maximum rendering speed and zero runtime overhead.

---

## 🛠 Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6 Modules)
* **Build Tool:** Vite
* **HTTP Client:** Axios
* **Testing Suite:** Vitest + `jsdom`
* **PDF Engine:** jsPDF

---

## 📁 Project Architecture

```
owly-book-search/
├── index.html               # Home landing page
├── search.html              # Search interface
├── wishlist.html            # Saved books overview
├── levels.html              # Journey & certificate generator
├── vite.config.js           # Vite & Vitest configuration
├── src/
│   ├── css/                 # Global & component styles
│   └── js/                  # Application modules
│       ├── app.js           # Core entry & routing
│       ├── api.js           # Open Library API requests
│       ├── ui.js            # DOM rendering & event bindings
│       ├── storage.js       # LocalStorage manager
│       ├── home.js          # Homepage logic
│       ├── search.js        # Search page logic
│       ├── wishlist.js      # Wishlist page logic
│       └── levels.js        # Progress & certificate logic
└── test/
├── api.test.js          # API unit tests (Axios mocking)
└── integration.test.js  # UI & Storage integration tests (JSDOM)
```

---

## 📸 App Preview & Visual Highlights

**Home**
public/img/home-screenshot.png

**Library Search**
**Saved books**
**Book Journey**

---

## 📄 License
Distributed under the MIT License.
