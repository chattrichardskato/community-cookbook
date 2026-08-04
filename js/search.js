// ========================================
// Search Module - Recipe Search & Filtering
// ========================================

// ========================================
// Perform Search
// ========================================
function performSearch(query) {
    const filters = getActiveFilters();
    const results = searchRecipes(query, filters);
    displayRecipes(results);
    updateSearchResultsCount(results.length);
}

// ========================================
// Search Recipes
// ========================================
function searchRecipes(query, filters = {}) {
    let results = getRecipes();
    
    // Apply search query
    if (query && query.trim() !== '') {
        const searchTerm = query.toLowerCase().trim();
        results = results.filter(recipe => {
            // Search in title
            if (recipe.title.toLowerCase().includes(searchTerm)) return true;
            // Search in ingredients
            if (recipe.ingredients && recipe.ingredients.some(i => i.toLowerCase().includes(searchTerm))) return true;
            // Search in category
            if (recipe.category && recipe.category.toLowerCase().includes(searchTerm)) return true;
            // Search in author
            if (recipe.author && recipe.author.toLowerCase().includes(searchTerm)) return true;
            return false;
        });
    }
    
    // Apply category filter
    if (filters.category && filters.category !== 'all') {
        results = results.filter(recipe => 
            recipe.category && recipe.category.toLowerCase() === filters.category.toLowerCase()
        );
    }
    
    // Apply dietary filter
    if (filters.dietary && filters.dietary !== 'all') {
        results = results.filter(recipe => 
            recipe.dietary && recipe.dietary.some(d => d.toLowerCase() === filters.dietary.toLowerCase())
        );
    }
    
    // Sort by rating (highest first)
    results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    return results;
}

// ========================================
// Get Active Filters
// ========================================
function getActiveFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const dietaryFilter = document.getElementById('dietaryFilter');
    
    return {
        category: categoryFilter ? categoryFilter.value : 'all',
        dietary: dietaryFilter ? dietaryFilter.value : 'all'
    };
}

// ========================================
// Update Search Results Count
// ========================================
function updateSearchResultsCount(count) {
    const countElement = document.getElementById('resultsCount');
    if (countElement) {
        countElement.textContent = `${count} recipe${count > 1 ? 's' : ''} found`;
    }
}

// ========================================
// Clear Filters
// ========================================
function clearFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const dietaryFilter = document.getElementById('dietaryFilter');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = 'all';
    if (dietaryFilter) dietaryFilter.value = 'all';
    
    performSearch('');
}

// ========================================
// Initialize Search
// ========================================
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const categoryFilter = document.getElementById('categoryFilter');
    const dietaryFilter = document.getElementById('dietaryFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    // Search on button click
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput ? searchInput.value : '';
            performSearch(query);
        });
    }
    
    // Search on Enter key
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });
        
        // Debounced search on input (300ms delay)
        let debounceTimer;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                performSearch(this.value);
            }, 300);
        });
    }
    
    // Filter on change
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const query = searchInput ? searchInput.value : '';
            performSearch(query);
        });
    }
    
    if (dietaryFilter) {
        dietaryFilter.addEventListener('change', function() {
            const query = searchInput ? searchInput.value : '';
            performSearch(query);
        });
    }
    
    // Clear filters
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Initial load - show all recipes
    performSearch('');
}

// ========================================
// Filter by Dietary Tag
// ========================================
function filterByDietary(tag) {
    const dietaryFilter = document.getElementById('dietaryFilter');
    if (dietaryFilter) {
        dietaryFilter.value = tag;
        const searchInput = document.getElementById('searchInput');
        const query = searchInput ? searchInput.value : '';
        performSearch(query);
    }
}

// ========================================
// Filter by Category
// ========================================
function filterByCategory(category) {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.value = category;
        const searchInput = document.getElementById('searchInput');
        const query = searchInput ? searchInput.value : '';
        performSearch(query);
    }
}

// ========================================
// Get Dietary Tags from Recipe
// ========================================
function getDietaryTags(recipe) {
    const tags = [];
    
    // Check ingredients for dietary indicators
    const allIngredients = (recipe.ingredients || []).join(' ').toLowerCase();
    
    const dietaryChecks = {
        vegetarian: ['meat', 'chicken', 'beef', 'pork', 'fish', 'lamb', 'turkey'],
        vegan: ['meat', 'chicken', 'beef', 'pork', 'fish', 'lamb', 'turkey', 'milk', 'cheese', 'butter', 'cream', 'egg', 'honey'],
        'gluten-free': ['wheat', 'flour', 'bread', 'pasta', 'barley', 'rye'],
        'dairy-free': ['milk', 'cheese', 'butter', 'cream', 'yogurt'],
        'nut-free': ['almond', 'walnut', 'pecan', 'hazelnut', 'cashew', 'pistachio']
    };
    
    for (const [diet, keywords] of Object.entries(dietaryChecks)) {
        const hasRestricted = keywords.some(k => allIngredients.includes(k));
        if (!hasRestricted) {
            tags.push(diet);
        }
    }
    
    return tags;
}

// ========================================
// Export Functions
// ========================================
window.performSearch = performSearch;
window.searchRecipes = searchRecipes;
window.getActiveFilters = getActiveFilters;
window.clearFilters = clearFilters;
window.initSearch = initSearch;
window.filterByDietary = filterByDietary;
window.filterByCategory = filterByCategory;
window.getDietaryTags = getDietaryTags;

// Initialize search when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('searchInput')) {
        initSearch();
    }
});