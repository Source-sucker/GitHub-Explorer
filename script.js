// ==================== DOM ELEMENTS ====================
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const reposContainer = document.getElementById('reposContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const languageFilter = document.getElementById('languageFilter');
const sortFilter = document.getElementById('sortFilter');
const favoritesBtn = document.getElementById('favoritesBtn');

// ==================== STATE ====================
let allRepositories = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let isViewingFavorites = false;

// ==================== LOCAL STORAGE FUNCTIONS ====================

// Save favorites to local storage
function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Add repository to favorites
function addToFavorites(repo) {
    const exists = favorites.some(fav => fav.id === repo.id);
    if (!exists) {
        favorites.push(repo);
        saveFavorites();
    }
}

// Remove repository from favorites
function removeFromFavorites(repoId) {
    favorites = favorites.filter(fav => fav.id !== repoId);
    saveFavorites();
}

// Check if repository is favorited
function isFavorited(repoId) {
    return favorites.some(fav => fav.id === repoId);
}

// ==================== UI FUNCTIONS ====================

// Show loading message
function showLoading() {
    loadingSpinner.classList.add('show');
    reposContainer.innerHTML = '';
}

// Hide loading message
function hideLoading() {
    loadingSpinner.classList.remove('show');
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

// Hide error message
function hideError() {
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
}

// ==================== API FUNCTIONS ====================

// Fetch repositories from GitHub API using Fetch API
async function fetchRepositories(searchTerm, sortBy = 'stars') {
    try {
        showLoading();
        hideError();

        // GitHub API URL with search parameters
        const url = `https://api.github.com/search/repositories?q=${searchTerm}&sort=${sortBy}&order=desc&per_page=12`;

        // Fetch data using Fetch API
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch repositories');
        }

        // Parse JSON response
        const data = await response.json();

        hideLoading();

        // Return repositories
        return data.items;
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        showError('Error: ' + error.message);
        return [];
    }
}

// ==================== FILTER & SORT FUNCTIONS ====================

// Filter repositories by language
function filterByLanguage(repos, language) {
    if (!language) {
        return repos;
    }
    return repos.filter(repo => repo.language && repo.language.toLowerCase() === language.toLowerCase());
}

// Get sorted repositories based on sort option
function getSortedRepositories(repos, sortBy) {
    const sorted = [...repos];
    
    if (sortBy === 'stars') {
        sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
    } else if (sortBy === 'forks') {
        sorted.sort((a, b) => b.forks_count - a.forks_count);
    } else if (sortBy === 'updated') {
        sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }
    
    return sorted;
}

// ==================== DOM RENDERING ====================

// Create a repository card with favorite button
function createRepoCard(repo) {
    const card = document.createElement('div');
    const isFav = isFavorited(repo.id);
    card.className = `repo-card ${isFav ? 'favorite' : ''}`;
    card.dataset.repoId = repo.id;
    
    card.innerHTML = `
        <div class="repo-header">
            <a href="${repo.html_url}" target="_blank" class="repo-name">${repo.name}</a>
            <button class="star-btn" data-repo-id="${repo.id}">${isFav ? '❤️' : '🤍'}</button>
        </div>
        <div class="repo-description">${repo.description || 'No description'}</div>
        <div class="repo-info">
            <span>⭐ ${repo.stargazers_count}</span>
            <span>🍴 ${repo.forks_count}</span>
        </div>
        ${repo.language ? `<div class="repo-language">${repo.language}</div>` : ''}
    `;
    
    // Add event listener to favorite button
    const starBtn = card.querySelector('.star-btn');
    starBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleFavoritesClick(repo, starBtn, card);
    });
    
    return card;
}

// Handle favorite button click
function handleFavoritesClick(repo, btn, card) {
    if (isFavorited(repo.id)) {
        removeFromFavorites(repo.id);
        btn.textContent = '🤍';
        card.classList.remove('favorite');
    } else {
        addToFavorites(repo);
        btn.textContent = '❤️';
        card.classList.add('favorite');
    }
}

// Display repositories
function displayRepositories(repos) {
    reposContainer.innerHTML = '';
    
    if (repos.length === 0) {
        reposContainer.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No repositories found</p>';
        return;
    }

    repos.forEach(repo => {
        const card = createRepoCard(repo);
        reposContainer.appendChild(card);
    });
}

// ==================== EVENT HANDLERS ====================

// Handle search
async function handleSearch() {
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        showError('Please enter a search term');
        return;
    }

    isViewingFavorites = false;
    const repos = await fetchRepositories(searchTerm, 'stars');
    allRepositories = repos;
    applyFiltersAndSort();
}

// Handle filter and sort changes
function handleFilterChange() {
    if (isViewingFavorites) {
        displayFavorites();
    } else {
        applyFiltersAndSort();
    }
}

// Apply filters and sort to repositories
function applyFiltersAndSort() {
    let filtered = allRepositories;
    
    // Filter by language
    const selectedLanguage = languageFilter.value;
    filtered = filterByLanguage(filtered, selectedLanguage);
    
    // Sort repositories
    const sortBy = sortFilter.value;
    filtered = getSortedRepositories(filtered, sortBy);
    
    displayRepositories(filtered);
}

// Display favorite repositories
function displayFavorites() {
    isViewingFavorites = true;
    
    let filtered = favorites;
    
    // Filter favorites by language
    const selectedLanguage = languageFilter.value;
    filtered = filterByLanguage(filtered, selectedLanguage);
    
    // Sort favorites
    const sortBy = sortFilter.value;
    filtered = getSortedRepositories(filtered, sortBy);
    
    displayRepositories(filtered);
    
    if (filtered.length === 0) {
        reposContainer.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No favorite repositories saved yet</p>';
    }
}

// Handle view favorites button
function handleViewFavorites() {
    if (isViewingFavorites) {
        isViewingFavorites = false;
        favoritesBtn.textContent = '❤️ View Favorites';
        applyFiltersAndSort();
    } else {
        displayFavorites();
        favoritesBtn.textContent = '⬅️ Back to Results';
    }
}

// ==================== EVENT LISTENERS ====================

// Search functionality
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Filter and sort functionality
languageFilter.addEventListener('change', handleFilterChange);
sortFilter.addEventListener('change', handleFilterChange);

// Favorites button
favoritesBtn.addEventListener('click', handleViewFavorites);

// ==================== INITIALIZE ====================

// Load initial repositories when page loads
document.addEventListener('DOMContentLoaded', () => {
    handleSearch();
});
