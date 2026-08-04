// ========================================
// Shopping List Module
// ========================================

// ========================================
// Generate Shopping List from Meal Plan
// ========================================
function generateShoppingList(mealPlanData) {
    const ingredientMap = new Map();
    const weekDates = Object.keys(mealPlanData);
    
    weekDates.forEach(date => {
        const recipeIds = mealPlanData[date] || [];
        recipeIds.forEach(recipeId => {
            const recipe = getRecipeById(recipeId);
            if (recipe && recipe.ingredients) {
                recipe.ingredients.forEach(ingredient => {
                    const normalized = normalizeIngredient(ingredient);
                    const key = normalized.name.toLowerCase();
                    
                    if (ingredientMap.has(key)) {
                        const existing = ingredientMap.get(key);
                        existing.quantity += normalized.quantity;
                        existing.unit = normalized.unit || existing.unit;
                        existing.sources.push(recipe.title);
                    } else {
                        ingredientMap.set(key, {
                            id: generateId(),
                            name: normalized.name,
                            quantity: normalized.quantity,
                            unit: normalized.unit || '',
                            checked: false,
                            sources: [recipe.title],
                            category: getIngredientCategory(normalized.name)
                        });
                    }
                });
            }
        });
    });
    
    const items = Array.from(ingredientMap.values());
    
    // Sort by category and name
    const categoryOrder = ['produce', 'meat', 'dairy', 'pantry', 'spices', 'other'];
    items.sort((a, b) => {
        const catA = categoryOrder.indexOf(a.category);
        const catB = categoryOrder.indexOf(b.category);
        if (catA !== catB) return catA - catB;
        return a.name.localeCompare(b.name);
    });
    
    return items;
}

// ========================================
// Normalize Ingredient String
// ========================================
function normalizeIngredient(ingredient) {
    // Parse ingredient string
    // e.g., "2 cups flour" -> { quantity: 2, unit: 'cups', name: 'flour' }
    // e.g., "1 onion" -> { quantity: 1, unit: '', name: 'onion' }
    
    const parts = ingredient.trim().split(/\s+/);
    let quantity = 0;
    let unit = '';
    let name = ingredient;
    
    // Try to parse quantity
    const firstPart = parts[0];
    if (firstPart && /^[\d./]+$/.test(firstPart)) {
        quantity = parseFloat(firstPart);
        if (isNaN(quantity)) quantity = 1;
        parts.shift();
        
        // Check if next part is a unit
        const unitWords = ['cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 
                          'tsp', 'teaspoon', 'teaspoons', 'oz', 'ounce', 'ounces',
                          'lb', 'pound', 'pounds', 'g', 'kg', 'ml', 'l', 
                          'pinch', 'dash', 'clove', 'cloves', 'piece', 'pieces',
                          'slice', 'slices', 'can', 'cans', 'bunch', 'bunches'];
        
        if (parts.length > 0 && unitWords.includes(parts[0].toLowerCase())) {
            unit = parts[0];
            parts.shift();
        }
        
        name = parts.join(' ');
    } else {
        quantity = 1;
        name = ingredient;
    }
    
    // Clean up name
    name = name.replace(/^[\d./]+\s*/, '').trim();
    name = name.replace(/\(.*?\)/g, '').trim();
    
    return { quantity, unit, name: name || ingredient };
}

// ========================================
// Get Ingredient Category
// ========================================
function getIngredientCategory(name) {
    const lowerName = name.toLowerCase();
    
    const categories = {
        produce: ['apple', 'banana', 'lettuce', 'tomato', 'onion', 'garlic', 'carrot', 'celery', 
                  'spinach', 'kale', 'broccoli', 'cauliflower', 'pepper', 'mushroom', 'avocado',
                  'lemon', 'lime', 'orange', 'potato', 'sweet potato', 'ginger', 'herb'],
        meat: ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'salmon', 'tuna', 'bacon',
               'sausage', 'ham', 'steak', 'ground', 'meat', 'sirloin'],
        dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream', 'cream cheese',
                'parmesan', 'cheddar', 'mozzarella', 'ricotta'],
        pantry: ['flour', 'sugar', 'rice', 'pasta', 'bread', 'oil', 'vinegar', 'soy sauce',
                 'ketchup', 'mustard', 'mayonnaise', 'honey', 'syrup', 'oats', 'cereal'],
        spices: ['salt', 'pepper', 'cinnamon', 'cumin', 'paprika', 'oregano', 'thyme', 'rosemary',
                 'basil', 'parsley', 'cilantro', 'chili', 'nutmeg', 'clove', 'ginger']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(k => lowerName.includes(k))) {
            return category;
        }
    }
    
    return 'other';
}

// ========================================
// Initialize Shopping List Page
// ========================================
function initShoppingList() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    loadShoppingList();
    
    // Set up event listeners
    document.getElementById('refreshList')?.addEventListener('click', loadShoppingList);
    
    document.getElementById('clearChecked')?.addEventListener('click', () => {
        clearCheckedItems();
    });
    
    document.getElementById('clearAll')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all items?')) {
            clearAllItems();
        }
    });
    
    document.getElementById('exportList')?.addEventListener('click', exportShoppingList);
}

// ========================================
// Load Shopping List
// ========================================
function loadShoppingList() {
    const user = getCurrentUser();
    if (!user) return;
    
    const shoppingList = getShoppingListByUser(user.id);
    const container = document.getElementById('shoppingList');
    const emptyContainer = document.getElementById('emptyShoppingList');
    const summaryContainer = document.getElementById('mealPlanSummary');
    
    if (!shoppingList || !shoppingList.items || shoppingList.items.length === 0) {
        if (container) container.innerHTML = '';
        if (emptyContainer) emptyContainer.style.display = 'block';
        if (summaryContainer) summaryContainer.innerHTML = '<p>No meals planned for this week.</p>';
        return;
    }
    
    if (emptyContainer) emptyContainer.style.display = 'none';
    
    // Display shopping list
    if (container) {
        const items = shoppingList.items;
        const checkedCount = items.filter(i => i.checked).length;
        
        container.innerHTML = `
            <div class="shopping-list-header">
                <span>${items.length} items (${checkedCount} checked)</span>
                <span>${Math.round((checkedCount / items.length) * 100)}% complete</span>
            </div>
            <ul>
                ${items.map(item => `
                    <li class="${item.checked ? 'checked' : ''}">
                        <input type="checkbox" 
                               ${item.checked ? 'checked' : ''} 
                               onchange="toggleShoppingItem('${item.id}')" />
                        <span class="quantity">${formatQuantity(item.quantity, item.unit)}</span>
                        <span class="item-name">${item.name}</span>
                        <span class="item-sources" title="From: ${item.sources.join(', ')}">
                            📖 ${item.sources.length}
                        </span>
                    </li>
                `).join('')}
            </ul>
        `;
    }
    
    // Display meal plan summary
    if (summaryContainer) {
        const weekData = getMealPlanForWeek(0);
        const days = Object.keys(weekData);
        if (days.length === 0) {
            summaryContainer.innerHTML = '<p>No meals planned for this week.</p>';
        } else {
            let html = '<div class="meal-summary-grid">';
            days.forEach(date => {
                const recipeIds = weekData[date] || [];
                const dayName = getDayName(date);
                html += `
                    <div class="meal-summary-day">
                        <strong>${dayName}</strong>
                        ${recipeIds.map(id => {
                            const recipe = getRecipeById(id);
                            return recipe ? `<div>${recipe.title}</div>` : '';
                        }).join('')}
                    </div>
                `;
            });
            html += '</div>';
            summaryContainer.innerHTML = html;
        }
    }
}

// ========================================
// Toggle Shopping Item
// ========================================
function toggleShoppingItem(itemId) {
    const user = getCurrentUser();
    if (!user) return;
    
    const shoppingList = getShoppingListByUser(user.id);
    if (!shoppingList) return;
    
    const item = shoppingList.items.find(i => i.id === itemId);
    if (item) {
        item.checked = !item.checked;
        updateShoppingList(shoppingList.id, shoppingList.items);
        loadShoppingList(); // Refresh
    }
}

// ========================================
// Clear Checked Items
// ========================================
function clearCheckedItems() {
    const user = getCurrentUser();
    if (!user) return;
    
    const shoppingList = getShoppingListByUser(user.id);
    if (!shoppingList) return;
    
    shoppingList.items = shoppingList.items.filter(i => !i.checked);
    updateShoppingList(shoppingList.id, shoppingList.items);
    loadShoppingList();
    showMessage('Checked items removed.', 'success');
}

// ========================================
// Clear All Items
// ========================================
function clearAllItems() {
    const user = getCurrentUser();
    if (!user) return;
    
    const shoppingList = getShoppingListByUser(user.id);
    if (!shoppingList) return;
    
    shoppingList.items = [];
    updateShoppingList(shoppingList.id, shoppingList.items);
    loadShoppingList();
    showMessage('All items cleared.', 'info');
}

// ========================================
// Export Shopping List
// ========================================
function exportShoppingList() {
    const user = getCurrentUser();
    if (!user) return;
    
    const shoppingList = getShoppingListByUser(user.id);
    if (!shoppingList || !shoppingList.items || shoppingList.items.length === 0) {
        showMessage('Shopping list is empty.', 'warning');
        return;
    }
    
    let text = '🛒 Shopping List\n';
    text += '=' .repeat(40) + '\n\n';
    
    const items = shoppingList.items;
    
    // Group by category
    const categories = ['produce', 'meat', 'dairy', 'pantry', 'spices', 'other'];
    const categoryLabels = {
        produce: '🥬 Produce',
        meat: '🥩 Meat & Seafood',
        dairy: '🧀 Dairy & Eggs',
        pantry: '🥫 Pantry',
        spices: '🌿 Spices & Herbs',
        other: '📦 Other'
    };
    
    categories.forEach(category => {
        const categoryItems = items.filter(i => i.category === category);
        if (categoryItems.length > 0) {
            text += `\n${categoryLabels[category] || category}:\n`;
            text += '-' .repeat(30) + '\n';
            categoryItems.forEach(item => {
                const checked = item.checked ? '✅' : '☐';
                text += `${checked} ${formatQuantity(item.quantity, item.unit)} ${item.name}\n`;
            });
        }
    });
    
    // Create download
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.txt';
    a.click();
    URL.revokeObjectURL(url);
}

// ========================================
// Format Quantity
// ========================================
function formatQuantity(quantity, unit) {
    if (!unit) return quantity.toString();
    return `${quantity} ${unit}`;
}

// ========================================
// Export Functions
// ========================================
window.generateShoppingList = generateShoppingList;
window.normalizeIngredient = normalizeIngredient;
window.initShoppingList = initShoppingList;
window.loadShoppingList = loadShoppingList;
window.toggleShoppingItem = toggleShoppingItem;
window.clearCheckedItems = clearCheckedItems;
window.clearAllItems = clearAllItems;
window.exportShoppingList = exportShoppingList;

// Initialize shopping list when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('shoppingList')) {
        initShoppingList();
    }
});