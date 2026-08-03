// Shopping list generator combining ingredients
function generateShoppingList(mealPlan) {
    const ingredientMap = new Map();
    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    weekDays.forEach(day => {
        const recipes = mealPlan[day] || [];
        recipes.forEach(recipeId => {
            const recipe = AppState.recipes.find(r => r.id === recipeId);
            if (recipe && recipe.ingredients) {
                recipe.ingredients.forEach(ingredient => {
                    const normalized = normalizeIngredient(ingredient);
                    if (ingredientMap.has(normalized.name)) {
                        const existing = ingredientMap.get(normalized.name);
                        existing.quantity += normalized.quantity;
                        ingredientMap.set(normalized.name, existing);
                    } else {
                        ingredientMap.set(normalized.name, normalized);
                    }
                });
            }
        });
    });
    
    return Array.from(ingredientMap.values());
}