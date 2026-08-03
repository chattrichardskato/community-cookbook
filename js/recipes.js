// Recipe rating system
function rateRecipe(recipeId, rating) {
    const ratings = getRatings();
    const userId = getCurrentUser()?.id;
    
    if (!userId) {
        showMessage('Please log in to rate recipes.', 'warning');
        return;
    }
    
    // Update or create rating
    const existingIndex = ratings.findIndex(r => r.recipeId === recipeId && r.userId === userId);
    
    if (existingIndex > -1) {
        ratings[existingIndex].rating = rating;
        ratings[existingIndex].updatedAt = new Date().toISOString();
    } else {
        ratings.push({
            recipeId: recipeId,
            userId: userId,
            rating: rating,
            createdAt: new Date().toISOString()
        });
    }
    
    saveRatings(ratings);
    updateRecipeRating(recipeId);
    showMessage('Rating saved!', 'success');
}

function getRecipeAverageRating(recipeId) {
    const ratings = getRatingsForRecipe(recipeId);
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10; // One decimal place
}