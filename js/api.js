// ========================================
// External API Integration
// ========================================

const API_CONFIG = {
    spoonacular: {
        baseUrl: 'https://api.spoonacular.com',
        apiKey: '299f9d89b4cd4658bbd3278e6f3db201', // Replace with your actual API key
        endpoints: {
            nutrition: '/recipes/{id}/nutritionWidget.json',
            search: '/recipes/complexSearch'
        }
    },
    edamam: {
        baseUrl: 'https://api.edamam.com',
        appId: '09719c10', // Replace with your actual app ID
        appKey: '9b19b7ae7d284a486cfe5ffe0b932664', // Replace with your actual app key
        endpoints: {
            nutrition: '/api/nutrition-data',
            search: '/api/food-database/v2/parser'
        }
    }
};

// ========================================
// Fetch Nutrition Info from Spoonacular
// ========================================
async function fetchNutritionInfo(recipeId) {
    try {
        const url = `${API_CONFIG.spoonacular.baseUrl}${API_CONFIG.spoonacular.endpoints.nutrition.replace('{id}', recipeId)}?apiKey=${API_CONFIG.spoonacular.apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Nutrition API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch nutrition info:', error);
        return getFallbackNutrition();
    }
}

// ========================================
// Fetch Recipe Nutrition by ID
// ========================================
async function fetchRecipeNutrition(recipeId) {
    try {
        // Using Spoonacular API
        const url = `https://api.spoonacular.com/recipes/${recipeId}/nutritionWidget.json?apiKey=${API_CONFIG.spoonacular.apiKey}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.warn('Using fallback nutrition data:', error);
        return getFallbackNutrition();
    }
}

// ========================================
// Fetch Dietary Info from Edamam
// ========================================
async function fetchDietaryInfo(ingredients) {
    try {
        const url = `${API_CONFIG.edamam.baseUrl}${API_CONFIG.edamam.endpoints.nutrition}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ingredients: ingredients.map(ing => ({ text: ing }))
            })
        });
        
        if (!response.ok) {
            throw new Error(`Edamam API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.warn('Edamam API error:', error);
        return getFallbackDietary();
    }
}

// ========================================
// Check Dietary Tags for Recipe
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
    
    // If no dietary tags were found, at least label as vegetarian-friendly if no meat
    if (tags.length === 0) {
        const hasMeat = ['meat', 'chicken', 'beef', 'pork', 'fish', 'lamb', 'turkey']
            .some(k => allIngredients.includes(k));
        if (!hasMeat) {
            tags.push('vegetarian');
        }
    }
    
    return tags;
}

// ========================================
// Fallback Nutrition Data
// ========================================
function getFallbackNutrition() {
    return {
        calories: 'N/A',
        totalFat: 'N/A',
        saturatedFat: 'N/A',
        cholesterol: 'N/A',
        sodium: 'N/A',
        carbohydrates: 'N/A',
        fiber: 'N/A',
        sugar: 'N/A',
        protein: 'N/A'
    };
}

// ========================================
// Fallback Dietary Data
// ========================================
function getFallbackDietary() {
    return {
        dietLabels: ['vegetarian'],
        healthLabels: ['gluten-free']
    };
}

// ========================================
// Test API Connection
// ========================================
async function testAPIConnection() {
    try {
        const testResponse = await fetch('https://api.spoonacular.com/recipes/complexSearch?apiKey=' + API_CONFIG.spoonacular.apiKey + '&query=chicken');
        if (testResponse.ok) {
            console.log('✅ Spoonacular API connection successful');
        } else {
            console.warn('⚠️ Spoonacular API connection failed');
        }
    } catch (error) {
        console.warn('⚠️ API connection error:', error.message);
    }
}

// ========================================
// Expose functions
// ========================================
window.fetchNutritionInfo = fetchNutritionInfo;
window.fetchRecipeNutrition = fetchRecipeNutrition;
window.fetchDietaryInfo = fetchDietaryInfo;
window.getDietaryTags = getDietaryTags;
window.testAPIConnection = testAPIConnection;