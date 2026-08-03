// Enhanced search with dietary filters
function searchRecipesWithFilters(query, dietaryFilters) {
    let results = AppState.recipes;
    
    // Apply search query
    if (query && query.trim() !== '') {
        const searchTerm = query.toLowerCase().trim();
        results = results.filter(recipe => 
            recipe.title.toLowerCase().includes(searchTerm) ||
            recipe.ingredients.some(i => i.toLowerCase().includes(searchTerm)) ||
            (recipe.category && recipe.category.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply dietary filters
    if (dietaryFilters && dietaryFilters.length > 0) {
        results = results.filter(recipe => {
            const recipeDietary = recipe.dietary || [];
            return dietaryFilters.every(filter => recipeDietary.includes(filter));
        });
    }
    
    return results;
}