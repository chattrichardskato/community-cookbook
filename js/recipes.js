// ========================================
// Recipes Module - Recipe Management
// ========================================

// ========================================
// Submit Recipe
// ========================================
function submitRecipe(event) {
    event.preventDefault();
    
    // Get form values
    const title = document.getElementById('recipeTitle')?.value.trim();
    const category = document.getElementById('recipeCategory')?.value;
    const cookingTime = document.getElementById('cookingTime')?.value.trim();
    const servings = parseInt(document.getElementById('servings')?.value) || 0;
    const image = document.getElementById('recipeImage')?.value.trim();
    const ingredientsText = document.getElementById('ingredients')?.value.trim();
    const instructionsText = document.getElementById('instructions')?.value.trim();
    
    // Get dietary tags
    const dietaryCheckboxes = document.querySelectorAll('.dietary-checkboxes input[type="checkbox"]:checked');
    const dietary = Array.from(dietaryCheckboxes).map(cb => cb.value);
    
    // Validate
    if (!title) {
        showMessage('Please enter a recipe title.', 'error');
        return;
    }
    
    if (!category) {
        showMessage('Please select a category.', 'error');
        return;
    }
    
    if (!ingredientsText) {
        showMessage('Please enter ingredients.', 'error');
        return;
    }
    
    if (!instructionsText) {
        showMessage('Please enter instructions.', 'error');
        return;
    }
    
    // Parse ingredients and instructions
    const ingredients = ingredientsText.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => line.trim());
    
    const instructions = instructionsText.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => line.trim());
    
    // Get current user
    const user = getCurrentUser();
    if (!user) {
        showMessage('Please log in to share a recipe.', 'error');
        return;
    }
    
    // Create recipe object
    const recipeData = {
        title,
        category,
        ingredients,
        instructions,
        cookingTime: cookingTime || 'N/A',
        servings: servings || 1,
        image: image || '',
        dietary,
        author: user.name || 'Anonymous',
        authorId: user.id,
        rating: 0,
        ratingCount: 0,
        views: 0
    };
    
    // Save to database
    const recipe = createRecipe(recipeData);
    
    if (recipe) {
        showMessage('✅ Recipe shared successfully!', 'success');
        // Clear form
        document.getElementById('recipeForm').reset();
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } else {
        showMessage('Failed to share recipe. Please try again.', 'error');
    }
}

// ========================================
// Display Recipes
// ========================================
function displayRecipes(recipes, containerId = 'recipe-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!recipes || recipes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>🍽️ No recipes found. Be the first to share one!</p>
                <a href="create-recipe.html" class="btn-primary">Share a Recipe</a>
            </div>
        `;
        return;
    }
    
    const user = getCurrentUser();
    
    container.innerHTML = recipes.map(recipe => {
        const isFavorited = user ? isRecipeFavorited(user.id, recipe.id) : false;
        const imageUrl = recipe.image || 'https://via.placeholder.com/400x300?text=🍳+Recipe';
        
        return `
            <div class="recipe-card" data-id="${recipe.id}" onclick="viewRecipe('${recipe.id}')">
                <img src="${imageUrl}" 
                     alt="${recipe.title}" 
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/400x300?text=🍳+Recipe'" />
                <div class="recipe-card-content">
                    <h3>${recipe.title}</h3>
                    <div class="meta">
                        <span>${recipe.category || 'Uncategorized'}</span>
                        <span>⏱️ ${recipe.cookingTime || 'N/A'}</span>
                    </div>
                    <div class="meta">
                        <span class="rating">⭐ ${recipe.rating || 0} (${recipe.ratingCount || 0})</span>
                        <span>👤 ${recipe.author || 'Community'}</span>
                    </div>
                    ${recipe.dietary && recipe.dietary.length > 0 ? `
                        <div class="meta" style="margin-top: 8px; flex-wrap: wrap;">
                            ${recipe.dietary.map(d => `<span class="dietary-tag ${d}">${d}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn-primary" style="padding: 6px 16px; font-size: 0.8rem;" 
                                onclick="event.stopPropagation(); handleFavoriteToggle('${recipe.id}')">
                            ${isFavorited ? '❤️' : '🤍'} Favorite
                        </button>
                        <button class="btn-secondary" style="padding: 6px 16px; font-size: 0.8rem;" 
                                onclick="event.stopPropagation(); addToMealPlan('${recipe.id}')">
                            📅 Plan
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// View Recipe Detail
// ========================================
function viewRecipe(recipeId) {
    // Increment view count
    incrementRecipeViews(recipeId);
    
    // Navigate to detail page
    window.location.href = `recipe-detail.html?id=${recipeId}`;
}

// ========================================
// Load Recipe Detail
// ========================================
function loadRecipeDetail() {
    // Get recipe ID from URL
    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get('id');
    
    if (!recipeId) {
        showMessage('Recipe not found.', 'error');
        return;
    }
    
    const recipe = getRecipeById(recipeId);
    if (!recipe) {
        showMessage('Recipe not found.', 'error');
        return;
    }
    
    // Display recipe
    displayRecipeDetail(recipe);
    
    // Load nutrition data
    loadNutritionData(recipeId);
    
    // Load related recipes
    loadRelatedRecipes(recipe);
}

// ========================================
// Display Recipe Detail
// ========================================
function displayRecipeDetail(recipe) {
    // Set page title
    document.title = `Community Cookbook - ${recipe.title}`;
    
    // Set header
    document.getElementById('recipeTitle').textContent = recipe.title;
    document.getElementById('recipeAuthor').textContent = `By: ${recipe.author || 'Community'}`;
    document.getElementById('recipeCategory').textContent = recipe.category || 'Uncategorized';
    document.getElementById('recipeRating').textContent = `⭐ ${recipe.rating || 0} (${recipe.ratingCount || 0} ratings)`;
    document.getElementById('recipeServings').textContent = `👤 ${recipe.servings || 1} servings`;
    document.getElementById('recipeTime').textContent = `⏱️ ${recipe.cookingTime || 'N/A'}`;
    
    // Set image
    const image = document.getElementById('recipeImage');
    image.src = recipe.image || 'https://via.placeholder.com/800x400?text=🍳+Recipe';
    image.alt = recipe.title;
    
    // Set dietary tags
    const tagsContainer = document.getElementById('dietaryTags');
    if (recipe.dietary && recipe.dietary.length > 0) {
        tagsContainer.innerHTML = recipe.dietary.map(d => 
            `<span class="dietary-tag ${d}">${d}</span>`
        ).join('');
    } else {
        tagsContainer.innerHTML = '<span class="dietary-tag">No dietary restrictions</span>';
    }
    
    // Set ingredients
    const ingredientsList = document.getElementById('ingredientsList');
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        ingredientsList.innerHTML = recipe.ingredients.map(ing => 
            `<li>${ing}</li>`
        ).join('');
    } else {
        ingredientsList.innerHTML = '<li>No ingredients listed</li>';
    }
    
    // Set instructions
    const instructionsList = document.getElementById('instructionsList');
    if (recipe.instructions && recipe.instructions.length > 0) {
        instructionsList.innerHTML = recipe.instructions.map(step => 
            `<li>${step}</li>`
        ).join('');
    } else {
        instructionsList.innerHTML = '<li>No instructions listed</li>';
    }
    
    // Update favorite button
    const user = getCurrentUser();
    if (user) {
        const isFavorited = isRecipeFavorited(user.id, recipe.id);
        const favBtn = document.getElementById('favoriteBtn');
        favBtn.textContent = isFavorited ? '❤️ Remove from Favorites' : '🤍 Add to Favorites';
        favBtn.className = isFavorited ? 'btn-primary' : 'btn-secondary';
    }
    
    // Check if user has rated
    if (user) {
        const existingRating = getRatingByUserAndRecipe(user.id, recipe.id);
        if (existingRating) {
            highlightStars(existingRating.rating);
        }
    }
}

// ========================================
// Load Nutrition Data
// ========================================
async function loadNutritionData(recipeId) {
    try {
        const nutrition = await fetchRecipeNutrition(recipeId);
        
        if (nutrition && !nutrition.isFallback) {
            document.getElementById('nutCalories').textContent = nutrition.calories || 'N/A';
            document.getElementById('nutFat').textContent = nutrition.totalFat || 'N/A';
            document.getElementById('nutSatFat').textContent = nutrition.saturatedFat || 'N/A';
            document.getElementById('nutCholesterol').textContent = nutrition.cholesterol || 'N/A';
            document.getElementById('nutSodium').textContent = nutrition.sodium || 'N/A';
            document.getElementById('nutCarbs').textContent = nutrition.carbohydrates || 'N/A';
            document.getElementById('nutFiber').textContent = nutrition.fiber || 'N/A';
            document.getElementById('nutSugar').textContent = nutrition.sugar || 'N/A';
            document.getElementById('nutProtein').textContent = nutrition.protein || 'N/A';
        } else {
            // Show fallback message
            const nutritionInfo = document.getElementById('nutritionInfo');
            nutritionInfo.innerHTML = `
                <p style="text-align: center; color: var(--text-light); padding: 20px;">
                    🍎 Nutrition information unavailable.<br>
                    <small>Please add your Spoonacular API key to enable this feature.</small>
                </p>
            `;
        }
    } catch (error) {
        console.warn('Failed to load nutrition data:', error);
    }
}

// ========================================
// Load Related Recipes
// ========================================
function loadRelatedRecipes(currentRecipe) {
    const allRecipes = getRecipes();
    const related = allRecipes
        .filter(r => r.id !== currentRecipe.id)
        .filter(r => r.category === currentRecipe.category || 
                     (r.dietary && currentRecipe.dietary && 
                      r.dietary.some(d => currentRecipe.dietary.includes(d))))
        .slice(0, 3);
    
    const container = document.getElementById('relatedRecipes');
    if (related.length > 0) {
        displayRecipes(related, 'relatedRecipes');
    } else {
        container.innerHTML = `
            <div class="empty-state" style="padding: 20px;">
                <p>No related recipes found.</p>
            </div>
        `;
    }
}

// ========================================
// Toggle Favorite (Detail Page)
// ========================================
function toggleFavoriteDetail() {
    const user = getCurrentUser();
    if (!user) {
        showMessage('Please log in to save favorites.', 'warning');
        return;
    }
    
    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get('id');
    
    if (!recipeId) return;
    
    const isFavorited = toggleFavorite(user.id, recipeId);
    const favBtn = document.getElementById('favoriteBtn');
    favBtn.textContent = isFavorited ? '❤️ Remove from Favorites' : '🤍 Add to Favorites';
    favBtn.className = isFavorited ? 'btn-primary' : 'btn-secondary';
    
    showMessage(isFavorited ? 'Added to favorites! ❤️' : 'Removed from favorites.', 'success');
}

// ========================================
// Handle Favorite Toggle (Dashboard)
// ========================================
function handleFavoriteToggle(recipeId) {
    const user = getCurrentUser();
    if (!user) {
        showMessage('Please log in to save favorites.', 'warning');
        return;
    }
    
    toggleFavorite(user.id, recipeId);
    
    // Refresh the recipe grid
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value : '';
    performSearch(query);
}

// ========================================
// Add to Meal Plan
// ========================================
function addToMealPlan(recipeId) {
    const user = getCurrentUser();
    if (!user) {
        showMessage('Please log in to plan meals.', 'warning');
        return;
    }
    
    // Redirect to calendar with recipe pre-selected
    window.location.href = `calendar.html?add=${recipeId}`;
}

// ========================================
// Add to Calendar (Detail Page)
// ========================================
function addToCalendar() {
    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get('id');
    if (recipeId) {
        addToMealPlan(recipeId);
    }
}

// ========================================
// Set Rating
// ========================================
function setRating(rating) {
    const user = getCurrentUser();
    if (!user) {
        showMessage('Please log in to rate recipes.', 'warning');
        return;
    }
    
    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get('id');
    
    if (!recipeId) return;
    
    // Save rating
    createRating(user.id, recipeId, rating);
    highlightStars(rating);
    
    // Update recipe rating display
    const recipe = getRecipeById(recipeId);
    if (recipe) {
        document.getElementById('recipeRating').textContent = `⭐ ${recipe.rating || 0} (${recipe.ratingCount || 0} ratings)`;
    }
    
    showMessage(`⭐ Rated ${rating} stars!`, 'success');
}

// ========================================
// Highlight Stars
// ========================================
function highlightStars(rating) {
    const stars = document.querySelectorAll('.star-rating span:not(#ratingDisplay)');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '⭐';
            star.className = 'star-filled';
        } else {
            star.textContent = '☆';
            star.className = 'star-empty';
        }
    });
}

// ========================================
// Share Recipe
// ========================================
function shareRecipe(platform) {
    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get('id');
    const recipe = getRecipeById(recipeId);
    
    if (!recipe) return;
    
    const url = window.location.href;
    const title = encodeURIComponent(recipe.title);
    const text = encodeURIComponent(`Check out this recipe: ${recipe.title}`);
    
    let shareUrl = '';
    switch (platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`;
            break;
        case 'pinterest':
            shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${title}`;
            break;
        default:
            return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

// ========================================
// Initialize Recipe Pages
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the recipe detail page
    if (window.location.pathname.includes('recipe-detail.html')) {
        loadRecipeDetail();
    }
    
    // Check if we're on the create recipe page
    if (window.location.pathname.includes('create-recipe.html')) {
        // Form is handled by submitRecipe function
    }
});

// ========================================
// Export Functions
// ========================================
window.submitRecipe = submitRecipe;
window.displayRecipes = displayRecipes;
window.viewRecipe = viewRecipe;
window.loadRecipeDetail = loadRecipeDetail;
window.toggleFavoriteDetail = toggleFavoriteDetail;
window.handleFavoriteToggle = handleFavoriteToggle;
window.addToMealPlan = addToMealPlan;
window.addToCalendar = addToCalendar;
window.setRating = setRating;
window.shareRecipe = shareRecipe;