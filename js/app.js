// ========================================
// Main Application Module
// ========================================

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
    theme: 'light'
};

// ========================================
// Initialize Application
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🍳 Community Cookbook initialized');
    
    // Initialize database
    initializeDatabase();
    
    // Load app state
    loadAppState();
    
    // Initialize hamburger menu
    initHamburgerMenu();
    
    // Initialize mobile bottom nav
    initMobileNav();
    
    // Check auth status
    checkAuthStatus();
    
    // Load user's favorites
    loadUserFavorites();
    
    // Apply theme
    applyTheme();
    
    // Load recipes if on dashboard
    if (document.getElementById('recipe-grid')) {
        const recipes = getRecipes();
        displayRecipes(recipes);
    }
    
    // Show welcome message on dashboard
    if (document.getElementById('userName')) {
        const user = getCurrentUser();
        if (user) {
            document.getElementById('userName').textContent = user.name || 'Cook';
        }
    }
});

// ========================================
// Hamburger Menu
// ========================================
function initHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
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
// Load App State
// ========================================
function loadAppState() {
    try {
        const saved = localStorage.getItem('communityCookbook');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(AppState, parsed);
        }
    } catch (error) {
        console.warn('Could not load app state:', error);
    }
}

// ========================================
// Save App State
// ========================================
function saveAppState() {
    try {
        const stateToSave = {
            favorites: AppState.favorites,
            theme: AppState.theme
        };
        localStorage.setItem('communityCookbook', JSON.stringify(stateToSave));
    } catch (error) {
        console.warn('Could not save app state:', error);
    }
}

// ========================================
// Load User Favorites
// ========================================
function loadUserFavorites() {
    const user = getCurrentUser();
    if (user) {
        const favorites = getFavoritesByUser(user.id);
        AppState.favorites = favorites.map(f => f.recipeId);
        saveAppState();
    }
}

// ========================================
// Apply Theme
// ========================================
function applyTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    AppState.theme = theme;
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// ========================================
// Toggle Theme
// ========================================
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    AppState.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', AppState.theme);
    saveAppState();
}

// ========================================
// Check Auth Status
// ========================================
function checkAuthStatus() {
    const user = getCurrentUser();
    if (user) {
        AppState.currentUser = user;
        console.log(`👋 Welcome back, ${user.name || 'User'}!`);
    } else {
        AppState.currentUser = null;
    }
}

// ========================================
// Show Message
// ========================================
function showMessage(message, type = 'info') {
    const container = document.getElementById('messageContainer');
    if (!container) {
        // Fallback: alert for pages without message container
        console.log(`[${type}] ${message}`);
        return;
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    
    // Style the message
    const colors = {
        success: '#8BA888',
        error: '#E74C3C',
        warning: '#F4B400',
        info: '#6B8FA3'
    };
    
    messageEl.style.cssText = `
        padding: 12px 20px;
        margin: 8px 0;
        border-radius: 8px;
        background: ${colors[type] || '#eee'};
        color: white;
        font-weight: 600;
        animation: slideDown 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;
    
    container.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.style.opacity = '0';
        messageEl.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            messageEl.remove();
        }, 300);
    }, 4000);
}

// ========================================
// Get Current User
// ========================================
function getCurrentUser() {
    try {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

// ========================================
// Logout
// ========================================
function logoutUser() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// ========================================
// Export Functions
// ========================================
window.initHamburgerMenu = initHamburgerMenu;
window.initMobileNav = initMobileNav;
window.loadAppState = loadAppState;
window.saveAppState = saveAppState;
window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.checkAuthStatus = checkAuthStatus;
window.showMessage = showMessage;
window.getCurrentUser = getCurrentUser;
window.logoutUser = logoutUser;

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

console.log('🚀 App module loaded');