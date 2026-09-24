<img width="400" height="400" alt="logo" src="https://github.com/user-attachments/assets/530b85ea-e582-4bd4-a6df-54c8f51c1824" />

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
├── docs/                   
│    ├── integration-test-results-screenshot.png
│    └── unit-test-results-screenshot.png
├── public/
│    └── img/                  # Static assets (logos, default covers, icons)
│         ├── bg.jpg
│         ├── favicon.png
│         └── logo.png
├── index.html                 # Home landing page
├── search.html                # Search interface
├── wishlist.html              # Saved books overview plus download
├── levels.html                # Journey & certificate generator
├── package.json               # Project dependencies and npm scripts
├── vite.config.js             # Vite & Vitest configuration
├── src/
│    ├── css/                  # Global & component styles
│    │     └── style.css
│    └── js/                   # Application modules
│         ├── app.js           # Core entry & routing
│         ├── api.js           # Open Library API requests
│         ├── ui.js            # DOM rendering & event bindings
│         ├── storage.js       # LocalStorage manager
│         ├── home.js          # Homepage logic
│         ├── search.js        # Search page logic
│         ├── wishlist.js      # Wishlist page logic
│         └── levels.js        # Progress & certificate logic
└── test/
│   ├── api.test.js            # API unit tests (Axios mocking)
│   └── integration.test.js    # UI & Storage integration tests (JSDOM)

```

---

## 📸 App Preview & Visual Highlights

**Home**

<img width="400" height="200" alt="owly-home-screenshot" src="https://github.com/user-attachments/assets/dca8dc81-f467-45a3-b08d-7af12d4c671b" />

**Library Search**

<img width="400" height="200" alt="owly-search-tool-screenshot" src="https://github.com/user-attachments/assets/7fa31908-7947-4704-9790-68524345ccee" />

**Saved books**

<img width="400" height="200" alt="owly-saved-books-screenshot" src="https://github.com/user-attachments/assets/59e7c69a-7be0-430a-afdd-aa2717a16965" />

**Book Journey**

<img width="400" height="200" alt="owly-book-journey-screenshot" src="https://github.com/user-attachments/assets/96ea74ca-bf65-4548-beaf-3eaa9fc1c92d" />

---

## 🎥 Live Demo

LINK

---

## 🏆 Conclusions

Owly demonstrates how a standard book search interface can be elevated into an engaging literacy journey through lightweight architecture, dynamic storage sync, and client-side document generation. The project successfully bridges core ES6 JavaScript patterns with user-centered design, delivering an application that is both technically resilient and highly accessible for young readers.

---

## 👨‍💻 Author

Developed with ❤️ by Filippo La Greca

---

## 📄 License
This project is licensed under the MIT License. See the LICENSE file for details.
