// ========================================
// External API Integration
// ========================================

const API_CONFIG = {
    spoonacular: {
        baseUrl: 'https://api.spoonacular.com',
        apiKey: 'YOUR_API_KEY_HERE', // Replace with your actual API key
        endpoints: {
            nutrition: '/recipes/{id}/nutritionWidget.json',
            search: '/recipes/complexSearch'
        }
    },
    edamam: {
        baseUrl: 'https://api.edamam.com',
        appId: 'YOUR_APP_ID_HERE', // Replace with your actual app ID
        appKey: 'YOUR_APP_KEY_HERE', // Replace with your actual app key
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
// Enhanced Nutrition API Call (YOUR CODE FIXED)
// ========================================
async function fetchRecipeNutrition(recipeId) {
    try {
        // FIX: Use the correct API endpoint format
        const url = `https://api.spoonacular.com/recipes/${recipeId}/nutritionWidget.json?apiKey=${API_CONFIG.spoonacular.apiKey}`;
        
        console.log(`🔍 Fetching nutrition data for recipe ${recipeId}...`);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Nutrition data received:', data);
        
        // Transform data for display
        // FIX: Use proper property names from Spoonacular response
        return {
            calories: data.calories || 'N/A',
            totalFat: data.fat || data.totalFat || 'N/A',
            saturatedFat: data.saturatedFat || data['Saturated Fat'] || 'N/A',
            cholesterol: data.cholesterol || 'N/A',
            sodium: data.sodium || 'N/A',
            carbohydrates: data.carbohydrates || data['Total Carbohydrate'] || 'N/A',
            fiber: data.fiber || data['Dietary Fiber'] || 'N/A',
            sugar: data.sugar || data['Sugars'] || 'N/A',
            protein: data.protein || 'N/A'
        };
    } catch (error) {
        console.warn('⚠️ Nutrition API error:', error.message);
        // FIX: Return fallback data instead of failing
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
// Fallback Nutrition Data (FIXED)
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
        protein: 'N/A',
        isFallback: true // Flag to indicate this is fallback data
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
// Test API Connection (NEW)
// ========================================
async function testAPIConnection() {
    try {
        const testResponse = await fetch('https://api.spoonacular.com/recipes/complexSearch?apiKey=' + API_CONFIG.spoonacular.apiKey + '&query=chicken');
        if (testResponse.ok) {
            console.log('✅ Spoonacular API connection successful');
            return true;
        } else {
            console.warn('⚠️ Spoonacular API connection failed');
            return false;
        }
    } catch (error) {
        console.warn('⚠️ API connection error:', error.message);
        return false;
    }
}

// ========================================
// Expose functions globally
// ========================================
window.fetchNutritionInfo = fetchNutritionInfo;
window.fetchRecipeNutrition = fetchRecipeNutrition;
window.fetchDietaryInfo = fetchDietaryInfo;
window.getDietaryTags = getDietaryTags;
window.testAPIConnection = testAPIConnection;
window.getFallbackNutrition = getFallbackNutrition;
window.getFallbackDietary = getFallbackDietary;

console.log('🍳 API Module Loaded');