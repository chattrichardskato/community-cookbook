// ========================================
// Authentication Module
// ========================================

// ========================================
// Register New User
// ========================================
function registerUser(event) {
    event.preventDefault();
    
    const name = document.getElementById('fullName')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    // Validation
    if (!name || !email || !password) {
        showMessage('Please fill in all fields.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters.', 'error');
        return;
    }
    
    // Check if user already exists
    const users = getUsers();
    if (users.some(u => u.email === email)) {
        showMessage('An account with this email already exists.', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        name: name,
        email: email,
        password: btoa(password), // Simple encoding (not secure for production)
        createdAt: new Date().toISOString(),
        preferences: {
            dietary: [],
            favoriteCategories: []
        }
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // Auto-login
    loginUserDirect(newUser);
    
    showMessage('Account created successfully!', 'success');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
}

// ========================================
// Login User
// ========================================
function loginUser(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    
    if (!email || !password) {
        showMessage('Please enter your email and password.', 'error');
        return;
    }
    
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === btoa(password));
    
    if (!user) {
        showMessage('Invalid email or password.', 'error');
        return;
    }
    
    loginUserDirect(user);
    showMessage('Welcome back!', 'success');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 800);
}

// ========================================
// Direct Login (after registration)
// ========================================
function loginUserDirect(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: user }));
}

// ========================================
// Logout User
// ========================================
function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ========================================
// Get All Users
// ========================================
function getUsers() {
    try {
        const data = localStorage.getItem('communityUsers');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

// ========================================
// Save Users
// ========================================
function saveUsers(users) {
    localStorage.setItem('communityUsers', JSON.stringify(users));
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
// Show Message
// ========================================
function showMessage(message, type = 'info') {
    const container = document.getElementById('messageContainer');
    if (!container) {
        // Fallback: alert
        alert(message);
        return;
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    
    container.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 5000);
}

// ========================================
// Update User Profile
// ========================================
function updateUserProfile(updates) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const users = getUsers();
    const index = users.findIndex(u => u.id === currentUser.id);
    
    if (index > -1) {
        users[index] = { ...users[index], ...updates };
        saveUsers(users);
        localStorage.setItem('currentUser', JSON.stringify(users[index]));
        return users[index];
    }
    return null;
}

// ========================================
// Check Auth Status on Page Load
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // If on login or register page and already logged in, redirect
    const isAuthPage = window.location.pathname.includes('login') || 
                       window.location.pathname.includes('register');
    const currentUser = getCurrentUser();
    
    if (isAuthPage && currentUser) {
        window.location.href = 'dashboard.html';
    }
    
    // If on protected page and not logged in, redirect
    const isProtectedPage = window.location.pathname.includes('dashboard') ||
                            window.location.pathname.includes('create-recipe') ||
                            window.location.pathname.includes('calendar') ||
                            window.location.pathname.includes('shopping-list') ||
                            window.location.pathname.includes('events');
    
    if (isProtectedPage && !currentUser) {
        window.location.href = 'login.html';
    }
});

// ========================================
// Expose functions globally
// ========================================
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.getCurrentUser = getCurrentUser;
window.updateUserProfile = updateUserProfile;