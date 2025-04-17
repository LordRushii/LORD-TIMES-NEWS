const API_KEY = 'YOUR_NEWS_API_KEY'; // Replace with your actual API key 
const BASE_URL = 'https://newsapi.org/v2/everything';

const newsGrid = document.querySelector('.news-grid');
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');
const navLinks = document.querySelectorAll('.nav-links a');
const hamburger = document.querySelector('.hamburger');
const navLinksContainer = document.querySelector('.nav-links');
const loaderContainer = document.querySelector('.loader-container');
const sortSelect = document.getElementById('sort-by');
const resultsCount = document.getElementById('results-count');
const searchQueryDisplay = document.getElementById('search-query');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const currentPageBtn = document.getElementById('current-page');
const themeToggleBtn = document.getElementById('theme-toggle');
const rootElement = document.documentElement;

let currentQuery = 'india';
let currentPage = 1;
let totalResults = 0;
let currentSort = 'publishedAt';
const ITEMS_PER_PAGE = 6;

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return new Date(dateString).toLocaleString('en-US', options);
}

function extractKeywords(text) {
    if (!text) return [];
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const commonWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at']);
    return [...new Set(words.filter(word => !commonWords.has(word)))].slice(0, 3);
}

function createNewsCard(article) {
    const card = document.createElement('div');
    card.className = 'news-card';

    const keywords = extractKeywords(article.title + ' ' + (article.description || ''));
    const keywordTags = keywords.map(keyword => 
        `<span class="category-tag">${keyword}</span>`
    ).join('');

    const imageUrl = article.urlToImage || `https://placehold.co/400x200?text=No+Image`;

    card.innerHTML = `
        <img src="${imageUrl}" alt="${article.title}" onerror="this.src='https://placehold.co/400x200?text=No+Image'">
        <div class="news-content">
            <span class="news-source">${article.source.name} · ${formatDate(article.publishedAt)}</span>
            <h2>${article.title}</h2>
            <div class="category-tags">${keywordTags}</div>
            <p>${article.description || 'No description available'}</p>
            <a href="${article.url}" target="_blank" class="read-more-btn" onclick="event.stopPropagation()">Read More</a>
        </div>
    `;

    card.addEventListener('click', (e) => {
        if (!e.target.closest('.read-more-btn')) {
            window.open(article.url, '_blank');
        }
    });

    card.classList.add('animate-in');

    return card;
}

function toggleLoader(show) {
    loaderContainer.style.display = show ? 'flex' : 'none';
    newsGrid.style.display = show ? 'none' : 'grid';
}

function updatePagination() {
    const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    currentPageBtn.textContent = `${currentPage} / ${totalPages}`;
}

async function fetchNews(query, page = 1) {
    try {
        toggleLoader(true);
        searchQueryDisplay.textContent = query;

        // Construct the URL for our Vercel Serverless Function
        // Pass necessary parameters as query string values
        const apiUrl = `/api/news?q=${encodeURIComponent(query)}&page=${page}&sortBy=${currentSort}&pageSize=${ITEMS_PER_PAGE}`;

        // Fetch from our own API endpoint
        const response = await fetch(apiUrl);
        const data = await response.json(); // Assuming our function always returns JSON

        // Check if the response from our API endpoint is ok AND if the 'status' inside the data is 'ok'
        // (Our serverless function might return an error structure like { error: 'message' })
        if (response.ok && data.status === 'ok') {
            totalResults = data.totalResults;
            resultsCount.textContent = totalResults;

            newsGrid.innerHTML = '';

            if (data.articles.length === 0) {
                newsGrid.innerHTML = `<div class="error-message">No results found for "${query}".</div>`;
            } else {
                data.articles.forEach(article => {
                    const card = createNewsCard(article);
                    newsGrid.appendChild(card);
                });
            }

            updatePagination();
        } else {
            // Throw an error based on the message from our serverless function or a default one
            throw new Error(data.error || data.message || 'Failed to fetch news');
        }
    } catch (error) {
        console.error('Error fetching news:', error);
        // Display the error message received from the serverless function or the fetch operation
        newsGrid.innerHTML = `<div class="error-message">${error.message}. Please try again later.</div>`;
        // Reset results info on error
        totalResults = 0;
        resultsCount.textContent = 0;
        updatePagination(); // Update pagination to reflect zero results/error state
    } finally {
        toggleLoader(false);
    }
}

function setTheme(theme) {
    if (theme === 'dark') {
        rootElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('newsAppTheme', 'dark');
    } else {
        rootElement.removeAttribute('data-theme');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('newsAppTheme', 'light');
    }
}

function toggleTheme() {
    const currentTheme = rootElement.getAttribute('data-theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        currentQuery = query;
        currentPage = 1;
        fetchNews(query);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            currentQuery = query;
            currentPage = 1;
            fetchNews(query);
        }
    }
});

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const category = link.textContent.toLowerCase();
        currentQuery = category;
        currentPage = 1;
        searchInput.value = category;
        fetchNews(category);
        
        navLinksContainer.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    fetchNews(currentQuery, currentPage);
});

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchNews(currentQuery, currentPage);
    }
});

nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
    if (currentPage < totalPages) {
        currentPage++;
        fetchNews(currentQuery, currentPage);
    }
});

themeToggleBtn.addEventListener('click', toggleTheme);

hamburger.addEventListener('click', () => {
    navLinksContainer.classList.toggle('active');
    hamburger.classList.toggle('active');
});

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('newsAppTheme') || 'light';
    setTheme(savedTheme);
    
    fetchNews(currentQuery);
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
