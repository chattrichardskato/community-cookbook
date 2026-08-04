// ========================================
// Database Module - LocalStorage CRUD Operations
// ========================================

const DB = {
    collections: {
        users: 'communityUsers',
        recipes: 'communityRecipes',
        ratings: 'communityRatings',
        mealPlans: 'communityMealPlans',
        shoppingLists: 'communityShoppingLists',
        events: 'communityEvents',
        favorites: 'communityFavorites'
    }
};

// ========================================
// Generic CRUD Operations
// ========================================

function getCollection(collectionName) {
    try {
        const data = localStorage.getItem(collectionName);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.warn(`Failed to get collection ${collectionName}:`, error);
        return [];
    }
}

function saveCollection(collectionName, data) {
    try {
        localStorage.setItem(collectionName, JSON.stringify(data));
        return true;
    } catch (error) {
        console.warn(`Failed to save collection ${collectionName}:`, error);
        return false;
    }
}

function addToCollection(collectionName, item) {
    const collection = getCollection(collectionName);
    collection.push(item);
    return saveCollection(collectionName, collection);
}

function updateInCollection(collectionName, id, updates) {
    const collection = getCollection(collectionName);
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) return false;
    collection[index] = { ...collection[index], ...updates };
    return saveCollection(collectionName, collection);
}

function deleteFromCollection(collectionName, id) {
    const collection = getCollection(collectionName);
    const filtered = collection.filter(item => item.id !== id);
    return saveCollection(collectionName, filtered);
}

function findInCollection(collectionName, predicate) {
    const collection = getCollection(collectionName);
    return collection.find(predicate);
}

function filterCollection(collectionName, predicate) {
    const collection = getCollection(collectionName);
    return collection.filter(predicate);
}

// ========================================
// Specific Database Operations
// ========================================

// Users
function getUsers() {
    return getCollection(DB.collections.users);
}

function saveUsers(users) {
    return saveCollection(DB.collections.users, users);
}

function getUserById(userId) {
    return findInCollection(DB.collections.users, u => u.id === userId);
}

function getUserByEmail(email) {
    return findInCollection(DB.collections.users, u => u.email === email);
}

function createUser(userData) {
    const user = {
        id: generateId(),
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
            dietary: [],
            favoriteCategories: [],
            theme: 'light'
        }
    };
    addToCollection(DB.collections.users, user);
    return user;
}

function updateUser(userId, updates) {
    return updateInCollection(DB.collections.users, userId, updates);
}

function deleteUser(userId) {
    return deleteFromCollection(DB.collections.users, userId);
}

// Recipes
function getRecipes() {
    return getCollection(DB.collections.recipes);
}

function saveRecipes(recipes) {
    return saveCollection(DB.collections.recipes, recipes);
}

function getRecipeById(recipeId) {
    return findInCollection(DB.collections.recipes, r => r.id === recipeId);
}

function getRecipesByUser(userId) {
    return filterCollection(DB.collections.recipes, r => r.authorId === userId);
}

function createRecipe(recipeData) {
    const recipe = {
        id: generateId(),
        ...recipeData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rating: 0,
        ratingCount: 0,
        views: 0
    };
    addToCollection(DB.collections.recipes, recipe);
    return recipe;
}

function updateRecipe(recipeId, updates) {
    return updateInCollection(DB.collections.recipes, recipeId, updates);
}

function deleteRecipe(recipeId) {
    return deleteFromCollection(DB.collections.recipes, recipeId);
}

function incrementRecipeViews(recipeId) {
    const recipe = getRecipeById(recipeId);
    if (recipe) {
        recipe.views = (recipe.views || 0) + 1;
        return updateInCollection(DB.collections.recipes, recipeId, { views: recipe.views });
    }
    return false;
}

// Ratings
function getRatings() {
    return getCollection(DB.collections.ratings);
}

function saveRatings(ratings) {
    return saveCollection(DB.collections.ratings, ratings);
}

function getRatingsForRecipe(recipeId) {
    return filterCollection(DB.collections.ratings, r => r.recipeId === recipeId);
}

function getRatingByUserAndRecipe(userId, recipeId) {
    return findInCollection(DB.collections.ratings, r => r.userId === userId && r.recipeId === recipeId);
}

function createRating(userId, recipeId, rating) {
    const existing = getRatingByUserAndRecipe(userId, recipeId);
    if (existing) {
        return updateInCollection(DB.collections.ratings, existing.id, { rating, updatedAt: new Date().toISOString() });
    }
    const newRating = {
        id: generateId(),
        userId,
        recipeId,
        rating,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    addToCollection(DB.collections.ratings, newRating);
    updateRecipeAverageRating(recipeId);
    return newRating;
}

function updateRecipeAverageRating(recipeId) {
    const ratings = getRatingsForRecipe(recipeId);
    const recipe = getRecipeById(recipeId);
    if (recipe && ratings.length > 0) {
        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        const average = Math.round((sum / ratings.length) * 10) / 10;
        updateRecipe(recipeId, { rating: average, ratingCount: ratings.length });
    } else if (recipe) {
        updateRecipe(recipeId, { rating: 0, ratingCount: 0 });
    }
}

// Meal Plans
function getMealPlans() {
    return getCollection(DB.collections.mealPlans);
}

function saveMealPlans(mealPlans) {
    return saveCollection(DB.collections.mealPlans, mealPlans);
}

function getMealPlanByUser(userId) {
    return findInCollection(DB.collections.mealPlans, mp => mp.userId === userId);
}

function createMealPlan(userId, weekData) {
    const existing = getMealPlanByUser(userId);
    if (existing) {
        return updateInCollection(DB.collections.mealPlans, existing.id, { 
            weekData, 
            updatedAt: new Date().toISOString() 
        });
    }
    const mealPlan = {
        id: generateId(),
        userId,
        weekData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    addToCollection(DB.collections.mealPlans, mealPlan);
    return mealPlan;
}

function updateMealPlan(mealPlanId, weekData) {
    return updateInCollection(DB.collections.mealPlans, mealPlanId, { 
        weekData, 
        updatedAt: new Date().toISOString() 
    });
}

// Shopping Lists
function getShoppingLists() {
    return getCollection(DB.collections.shoppingLists);
}

function saveShoppingLists(shoppingLists) {
    return saveCollection(DB.collections.shoppingLists, shoppingLists);
}

function getShoppingListByUser(userId) {
    return findInCollection(DB.collections.shoppingLists, sl => sl.userId === userId);
}

function createShoppingList(userId, items) {
    const existing = getShoppingListByUser(userId);
    if (existing) {
        return updateInCollection(DB.collections.shoppingLists, existing.id, { 
            items, 
            updatedAt: new Date().toISOString() 
        });
    }
    const shoppingList = {
        id: generateId(),
        userId,
        items,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    addToCollection(DB.collections.shoppingLists, shoppingList);
    return shoppingList;
}

function updateShoppingList(shoppingListId, items) {
    return updateInCollection(DB.collections.shoppingLists, shoppingListId, { 
        items, 
        updatedAt: new Date().toISOString() 
    });
}

// Events
function getEvents() {
    return getCollection(DB.collections.events);
}

function saveEvents(events) {
    return saveCollection(DB.collections.events, events);
}

function getEventById(eventId) {
    return findInCollection(DB.collections.events, e => e.id === eventId);
}

function getEventsByUser(userId) {
    return filterCollection(DB.collections.events, e => e.creatorId === userId);
}

function getUpcomingEvents() {
    const now = new Date().toISOString();
    return filterCollection(DB.collections.events, e => e.date >= now);
}

function createEvent(eventData) {
    const event = {
        id: generateId(),
        ...eventData,
        attendees: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    addToCollection(DB.collections.events, event);
    return event;
}

function updateEvent(eventId, updates) {
    return updateInCollection(DB.collections.events, eventId, updates);
}

function deleteEvent(eventId) {
    return deleteFromCollection(DB.collections.events, eventId);
}

function addAttendeeToEvent(eventId, userId, recipeId, recipeName) {
    const event = getEventById(eventId);
    if (!event) return false;
    
    // Check for duplicate recipe
    const duplicate = event.attendees.some(a => a.recipeId === recipeId && a.userId === userId);
    if (duplicate) return false;
    
    event.attendees.push({
        userId,
        recipeId,
        recipeName,
        signedUpAt: new Date().toISOString()
    });
    
    return updateEvent(eventId, { attendees: event.attendees });
}

function removeAttendeeFromEvent(eventId, userId, recipeId) {
    const event = getEventById(eventId);
    if (!event) return false;
    
    event.attendees = event.attendees.filter(a => !(a.userId === userId && a.recipeId === recipeId));
    return updateEvent(eventId, { attendees: event.attendees });
}

// Favorites
function getFavorites() {
    return getCollection(DB.collections.favorites);
}

function saveFavorites(favorites) {
    return saveCollection(DB.collections.favorites, favorites);
}

function getFavoritesByUser(userId) {
    return filterCollection(DB.collections.favorites, f => f.userId === userId);
}

function getFavoriteRecipeIds(userId) {
    const favorites = getFavoritesByUser(userId);
    return favorites.map(f => f.recipeId);
}

function isRecipeFavorited(userId, recipeId) {
    return findInCollection(DB.collections.favorites, f => f.userId === userId && f.recipeId === recipeId) !== undefined;
}

function toggleFavorite(userId, recipeId) {
    const existing = findInCollection(DB.collections.favorites, f => f.userId === userId && f.recipeId === recipeId);
    if (existing) {
        deleteFromCollection(DB.collections.favorites, existing.id);
        return false; // Removed
    } else {
        const favorite = {
            id: generateId(),
            userId,
            recipeId,
            createdAt: new Date().toISOString()
        };
        addToCollection(DB.collections.favorites, favorite);
        return true; // Added
    }
}

// ========================================
// Utility Functions
// ========================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getCurrentTimestamp() {
    return new Date().toISOString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function getWeekDates() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        weekDays.push(date.toISOString().split('T')[0]);
    }
    return weekDays;
}

function getDayName(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long' });
}

// ========================================
// Initialize Database with Sample Data
// ========================================

function initializeDatabase() {
    // Check if recipes already exist
    const existingRecipes = getRecipes();
    if (existingRecipes.length > 0) {
        console.log('📦 Database already initialized');
        return;
    }
    
    console.log('📦 Initializing database with sample data...');
    
    // Load sample recipes from JSON file
    fetch('data/sample-recipes.json')
        .then(response => response.json())
        .then(data => {
            if (data.recipes && data.recipes.length > 0) {
                data.recipes.forEach(recipe => {
                    // Ensure each recipe has an ID
                    if (!recipe.id) {
                        recipe.id = generateId();
                    }
                    addToCollection(DB.collections.recipes, recipe);
                });
                console.log(`✅ Loaded ${data.recipes.length} sample recipes`);
            }
        })
        .catch(error => {
            console.warn('Failed to load sample recipes:', error);
            // Create default recipes
            createDefaultRecipes();
        });
}

function createDefaultRecipes() {
    const defaultRecipes = [
        {
            id: generateId(),
            title: "Grandma's Chocolate Chip Cookies",
            category: "Dessert",
            ingredients: ["2 1/4 cups flour", "1 cup butter", "3/4 cup sugar", "3/4 cup brown sugar", "2 eggs", "2 cups chocolate chips"],
            instructions: "1. Cream butter and sugars. 2. Add eggs. 3. Mix in flour and chips. 4. Bake at 375°F for 10-12 minutes.",
            cookingTime: "25 min",
            servings: 24,
            image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop",
            rating: 4.8,
            ratingCount: 5,
            dietary: ["vegetarian"],
            author: "Grandma Helen",
            authorId: "system",
            createdAt: new Date().toISOString(),
            views: 0
        },
        {
            id: generateId(),
            title: "Vegetarian Chili",
            category: "Main Dish",
            ingredients: ["2 cans beans", "1 onion", "2 bell peppers", "4 cloves garlic", "2 cans tomatoes", "3 tbsp chili powder"],
            instructions: "1. Sauté onion and peppers. 2. Add garlic and spices. 3. Add beans and tomatoes. 4. Simmer for 30 minutes.",
            cookingTime: "45 min",
            servings: 6,
            image: "https://images.unsplash.com/photo-1576583463999-1f1c5079f0d9?w=400&h=300&fit=crop",
            rating: 4.5,
            ratingCount: 3,
            dietary: ["vegetarian", "vegan", "gluten-free"],
            author: "Chef Maria",
            authorId: "system",
            createdAt: new Date().toISOString(),
            views: 0
        },
        {
            id: generateId(),
            title: "Classic Caesar Salad",
            category: "Side Dish",
            ingredients: ["Romaine lettuce", "Caesar dressing", "Parmesan cheese", "Croutons", "Garlic", "Lemon juice"],
            instructions: "1. Toss lettuce with dressing. 2. Top with cheese and croutons. 3. Squeeze lemon over top.",
            cookingTime: "15 min",
            servings: 4,
            image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop",
            rating: 4.2,
            ratingCount: 2,
            dietary: ["vegetarian"],
            author: "Community Member",
            authorId: "system",
            createdAt: new Date().toISOString(),
            views: 0
        }
    ];
    
    defaultRecipes.forEach(recipe => {
        addToCollection(DB.collections.recipes, recipe);
    });
    console.log(`✅ Created ${defaultRecipes.length} default recipes`);
}

// ========================================
// Export Database Functions
// ========================================

window.DB = DB;
window.getUsers = getUsers;
window.saveUsers = saveUsers;
window.getUserById = getUserById;
window.getUserByEmail = getUserByEmail;
window.createUser = createUser;
window.updateUser = updateUser;
window.deleteUser = deleteUser;
window.getRecipes = getRecipes;
window.saveRecipes = saveRecipes;
window.getRecipeById = getRecipeById;
window.getRecipesByUser = getRecipesByUser;
window.createRecipe = createRecipe;
window.updateRecipe = updateRecipe;
window.deleteRecipe = deleteRecipe;
window.incrementRecipeViews = incrementRecipeViews;
window.getRatings = getRatings;
window.saveRatings = saveRatings;
window.getRatingsForRecipe = getRatingsForRecipe;
window.getRatingByUserAndRecipe = getRatingByUserAndRecipe;
window.createRating = createRating;
window.updateRecipeAverageRating = updateRecipeAverageRating;
window.getMealPlans = getMealPlans;
window.saveMealPlans = saveMealPlans;
window.getMealPlanByUser = getMealPlanByUser;
window.createMealPlan = createMealPlan;
window.updateMealPlan = updateMealPlan;
window.getShoppingLists = getShoppingLists;
window.saveShoppingLists = saveShoppingLists;
window.getShoppingListByUser = getShoppingListByUser;
window.createShoppingList = createShoppingList;
window.updateShoppingList = updateShoppingList;
window.getEvents = getEvents;
window.saveEvents = saveEvents;
window.getEventById = getEventById;
window.getEventsByUser = getEventsByUser;
window.getUpcomingEvents = getUpcomingEvents;
window.createEvent = createEvent;
window.updateEvent = updateEvent;
window.deleteEvent = deleteEvent;
window.addAttendeeToEvent = addAttendeeToEvent;
window.removeAttendeeFromEvent = removeAttendeeFromEvent;
window.getFavorites = getFavorites;
window.saveFavorites = saveFavorites;
window.getFavoritesByUser = getFavoritesByUser;
window.getFavoriteRecipeIds = getFavoriteRecipeIds;
window.isRecipeFavorited = isRecipeFavorited;
window.toggleFavorite = toggleFavorite;
window.generateId = generateId;
window.getCurrentTimestamp = getCurrentTimestamp;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.getWeekDates = getWeekDates;
window.getDayName = getDayName;
window.initializeDatabase = initializeDatabase;

console.log('🗄️ Database module loaded');