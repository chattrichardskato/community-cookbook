// ========================================
// Application State
// ========================================
const AppState = {
    currentUser: null,
    recipes: [],
    favorites: [],
    mealPlan: {},
    shoppingList: [],
    events: [],
    theme: 'light',
    searchQuery: '',
    filters: {
        category: 'all',
        diet: 'all',
        dietary: 'all'
    }
};

// ========================================
// DOM Ready - Initialize App
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🍳 Community Cookbook initialized');
    
    // Load saved state
    loadAppState();
    
    // Initialize hamburger menu
    initHamburgerMenu();
    
    // Initialize mobile bottom nav
    initMobileNav();
    
    // Load sample recipes
    loadSampleRecipes();
    
    // Check if user is logged in
    checkAuthStatus();
});

// ========================================
// Hamburger Menu Toggle
// ========================================
function initHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
}

// ========================================
// Mobile Bottom Navigation
// ========================================
function initMobileNav() {
    const navItems = document.querySelectorAll('.mobile-bottom-nav .nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            const target = this.dataset.target;
            if (target) {
                window.location.href = target;
            }
        });
    });
}

// ========================================
// Load App State from LocalStorage
// ========================================
function loadAppState() {
    try {
        const saved = localStorage.getItem('communityCookbook');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(AppState, parsed);
        }
        
        // Load theme preference
        const theme = localStorage.getItem('theme');
        if (theme) {
            AppState.theme = theme;
            document.body.classList.toggle('dark-mode', theme === 'dark');
        }
    } catch (error) {
        console.warn('Could not load app state:', error);
    }
}

// ========================================
// Save App State to LocalStorage
// ========================================
function saveAppState() {
    try {
        const stateToSave = {
            favorites: AppState.favorites,
            mealPlan: AppState.mealPlan,
            shoppingList: AppState.shoppingList,
            events: AppState.events,
            theme: AppState.theme
        };
        localStorage.setItem('communityCookbook', JSON.stringify(stateToSave));
    } catch (error) {
        console.warn('Could not save app state:', error);
    }
}

// ========================================
// Theme Toggle
// ========================================
function toggleTheme() {
    AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', AppState.theme);
    saveAppState();
}

// ========================================
// Load Sample Recipes
// ========================================
async function loadSampleRecipes() {
    try {
        const response = await fetch('data/sample-recipes.json');
        if (response.ok) {
            const data = await response.json();
            AppState.recipes = data.recipes || [];
            console.log(`📖 Loaded ${AppState.recipes.length} sample recipes`);
        }
    } catch (error) {
        console.log('Using default sample recipes');
        // Fallback sample data
        AppState.recipes = getDefaultRecipes();
    }
    
    // Render recipes if on dashboard
    if (document.getElementById('recipe-grid')) {
        renderRecipes(AppState.recipes);
    }
}

// ========================================
// Default Fallback Recipes
// ========================================
function getDefaultRecipes() {
    return [
        {
            id: 1,
            title: 'Grandma\'s Chocolate Chip Cookies',
            category: 'Dessert',
            ingredients: ['2 1/4 cups flour', '1 cup butter', '3/4 cup sugar', '3/4 cup brown sugar', '2 eggs', '2 cups chocolate chips'],
            instructions: 'Cream butter and sugars. Add eggs. Mix in flour and chips. Bake at 375°F for 10-12 minutes.',
            cookingTime: '25 min',
            servings: 24,
            image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop',
            rating: 4.8,
            dietary: ['vegetarian'],
            author: 'Grandma Helen'
        },
        {
            id: 2,
            title: 'Vegetarian Chili',
            category: 'Main Dish',
            ingredients: ['2 cans beans', '1 onion', '2 bell peppers', '4 cloves garlic', '2 cans tomatoes', '3 tbsp chili powder'],
            instructions: 'Sauté onion and peppers. Add garlic and spices. Add beans and tomatoes. Simmer for 30 minutes.',
            cookingTime: '45 min',
            servings: 6,
            image: 'https://images.unsplash.com/photo-1576583463999-1f1c5079f0d9?w=400&h=300&fit=crop',
            rating: 4.5,
            dietary: ['vegetarian', 'vegan', 'gluten-free'],
            author: 'Chef Maria'
        },
        {
            id: 3,
            title: 'Classic Caesar Salad',
            category: 'Side Dish',
            ingredients: ['Romaine lettuce', 'Caesar dressing', 'Parmesan cheese', 'Croutons', 'Garlic', 'Lemon juice'],
            instructions: 'Toss lettuce with dressing. Top with cheese and croutons. Squeeze lemon over top.',
            cookingTime: '15 min',
            servings: 4,
            image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
            rating: 4.2,
            dietary: ['vegetarian'],
            author: 'Community Member'
        }
    ];
}

// ========================================
// Render Recipes
// ========================================
function renderRecipes(recipes, containerId = 'recipe-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!recipes || recipes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No recipes found. <a href="create-recipe.html">Share your first recipe!</a></p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recipes.map(recipe => `
        <div class="recipe-card" data-id="${recipe.id}" onclick="viewRecipe(${recipe.id})">
            <img src="${recipe.image || 'https://via.placeholder.com/400x300?text=Recipe+Image'}" 
                 alt="${recipe.title}" 
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'" />
            <div class="recipe-card-content">
                <h3>${recipe.title}</h3>
                <div class="meta">
                    <span>${recipe.category || 'Uncategorized'}</span>
                    <span>⏱️ ${recipe.cookingTime || 'N/A'}</span>
                </div>
                <div class="meta">
                    <span class="rating">⭐ ${recipe.rating || 'N/A'}</span>
                    <span>👤 ${recipe.author || 'Community'}</span>
                </div>
                ${recipe.dietary && recipe.dietary.length > 0 ? `
                    <div class="meta" style="margin-top: 8px;">
                        ${recipe.dietary.map(d => `<span class="diet-tag">${d}</span>`).join('')}
                    </div>
                ` : ''}
                <div style="margin-top: 12px;">
                    <button class="btn-primary" style="padding: 6px 16px; font-size: 0.8rem;" 
                            onclick="event.stopPropagation(); toggleFavorite(${recipe.id})">
                        ${AppState.favorites.includes(recipe.id) ? '❤️' : '🤍'} Favorite
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ========================================
// View Recipe Detail
// ========================================
function viewRecipe(recipeId) {
    // Find the recipe
    const recipe = AppState.recipes.find(r => r.id === recipeId);
    if (!recipe) {
        console.warn('Recipe not found');
        return;
    }
    
    // Store current recipe in session
    sessionStorage.setItem('viewingRecipe', JSON.stringify(recipe));
    
    // Navigate to detail page
    window.location.href = `recipe-detail.html?id=${recipeId}`;
}

// ========================================
// Toggle Favorite
// ========================================
function toggleFavorite(recipeId) {
    const index = AppState.favorites.indexOf(recipeId);
    if (index > -1) {
        AppState.favorites.splice(index, 1);
    } else {
        AppState.favorites.push(recipeId);
    }
    saveAppState();
    
    // Re-render the current view
    const container = document.getElementById('recipe-grid');
    if (container) {
        renderRecipes(AppState.recipes);
    }
}

// ========================================
// Search Functionality
// ========================================
function searchRecipes(query) {
    if (!query || query.trim() === '') {
        renderRecipes(AppState.recipes);
        return;
    }
    
    const searchTerm = query.toLowerCase().trim();
    const results = AppState.recipes.filter(recipe => 
        recipe.title.toLowerCase().includes(searchTerm) ||
        recipe.ingredients.some(i => i.toLowerCase().includes(searchTerm)) ||
        (recipe.category && recipe.category.toLowerCase().includes(searchTerm))
    );
    
    renderRecipes(results);
}

// ========================================
// Authentication Check
// ========================================
function checkAuthStatus() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        try {
            AppState.currentUser = JSON.parse(user);
            console.log(`👋 Welcome back, ${AppState.currentUser.name || 'User'}!`);
        } catch (e) {
            console.warn('Could not parse user data');
        }
    }
}

// ========================================
// Global Exports for HTML onclick
// ========================================
window.viewRecipe = viewRecipe;
window.toggleFavorite = toggleFavorite;
window.searchRecipes = searchRecipes;
window.toggleTheme = toggleTheme;