// ========================================
// Calendar Module - Meal Planning Calendar
// ========================================

// ========================================
// State
// ========================================
let currentWeekOffset = 0;

// ========================================
// Initialize Calendar
// ========================================
function initCalendar() {
    // Check if we're on the calendar page
    if (!document.getElementById('calendarGrid')) return;
    
    // Get recipe to add from URL
    const params = new URLSearchParams(window.location.search);
    const addRecipeId = params.get('add');
    
    renderCalendar(currentWeekOffset);
    renderRecipePool();
    
    // Set up event listeners
    document.getElementById('prevWeek')?.addEventListener('click', () => {
        currentWeekOffset--;
        renderCalendar(currentWeekOffset);
    });
    
    document.getElementById('nextWeek')?.addEventListener('click', () => {
        currentWeekOffset++;
        renderCalendar(currentWeekOffset);
    });
    
    document.getElementById('clearWeek')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all meals for this week?')) {
            clearWeek();
        }
    });
    
    document.getElementById('generateShoppingList')?.addEventListener('click', () => {
        generateAndNavigateShoppingList();
    });
    
    // If recipe was requested to be added, highlight the calendar
    if (addRecipeId) {
        setTimeout(() => {
            const recipe = getRecipeById(addRecipeId);
            if (recipe) {
                showMessage(`Drag "${recipe.title}" to a day to plan it!`, 'info');
            }
        }, 500);
    }
}

// ========================================
// Render Calendar
// ========================================
function renderCalendar(weekOffset) {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    
    const weekDates = getWeekDates(weekOffset);
    const mealPlan = getMealPlanForWeek(weekOffset);
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Update week display
    const weekDisplay = document.getElementById('weekDisplay');
    if (weekDisplay && weekDates.length > 0) {
        const start = new Date(weekDates[0] + 'T00:00:00');
        const end = new Date(weekDates[6] + 'T00:00:00');
        weekDisplay.textContent = `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    
    // Build calendar grid
    let html = '<div class="calendar-grid-header">';
    dayNames.forEach(name => {
        html += `<div class="day-header">${name}</div>`;
    });
    html += '</div><div class="calendar-grid-body">';
    
    weekDates.forEach((date, index) => {
        const dayMeals = mealPlan[date] || [];
        const dateObj = new Date(date + 'T00:00:00');
        const isToday = new Date().toISOString().split('T')[0] === date;
        
        html += `
            <div class="day-cell ${isToday ? 'today' : ''}" 
                 data-date="${date}"
                 ondragover="onDragOver(event)"
                 ondrop="onDrop(event, '${date}')">
                <div class="date">${dateObj.getDate()}${isToday ? ' 🎯' : ''}</div>
                <div class="day-meals">
        `;
        
        if (dayMeals.length > 0) {
            dayMeals.forEach(recipeId => {
                const recipe = getRecipeById(recipeId);
                if (recipe) {
                    html += `
                        <div class="meal" onclick="removeMeal('${date}', '${recipeId}')" title="Click to remove">
                            ${recipe.title}
                            <span class="remove-icon">×</span>
                        </div>
                    `;
                }
            });
        } else {
            html += `<div class="empty-meal">Drop a recipe here</div>`;
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    grid.innerHTML = html;
}

// ========================================
// Get Week Dates
// ========================================
function getWeekDates(weekOffset = 0) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    // Adjust to Monday (0 = Sunday, 1 = Monday, etc.)
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysFromMonday + (weekOffset * 7));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        weekDates.push(date.toISOString().split('T')[0]);
    }
    return weekDates;
}

// ========================================
// Get Meal Plan for Week
// ========================================
function getMealPlanForWeek(weekOffset) {
    const user = getCurrentUser();
    if (!user) return {};
    
    const mealPlan = getMealPlanByUser(user.id);
    if (!mealPlan || !mealPlan.weekData) return {};
    
    // Get the week key
    const weekDates = getWeekDates(weekOffset);
    const weekKey = weekDates[0] + '_' + weekDates[6];
    
    return mealPlan.weekData[weekKey] || {};
}

// ========================================
// Save Meal Plan
// ========================================
function saveMealPlan(weekData) {
    const user = getCurrentUser();
    if (!user) {
        showMessage('Please log in to save meal plans.', 'warning');
        return false;
    }
    
    const weekDates = getWeekDates(currentWeekOffset);
    const weekKey = weekDates[0] + '_' + weekDates[6];
    
    let mealPlan = getMealPlanByUser(user.id);
    
    if (mealPlan) {
        if (!mealPlan.weekData) mealPlan.weekData = {};
        mealPlan.weekData[weekKey] = weekData;
        updateMealPlan(mealPlan.id, mealPlan.weekData);
    } else {
        const newMealPlan = {
            weekData: { [weekKey]: weekData }
        };
        createMealPlan(user.id, newMealPlan.weekData);
    }
    
    return true;
}

// ========================================
// Add Meal to Day
// ========================================
function addMealToDay(date, recipeId) {
    const weekDates = getWeekDates(currentWeekOffset);
    const weekData = getMealPlanForWeek(currentWeekOffset);
    
    if (!weekData[date]) {
        weekData[date] = [];
    }
    
    // Check if recipe already exists for this day
    if (weekData[date].includes(recipeId)) {
        showMessage('This recipe is already planned for this day.', 'warning');
        return false;
    }
    
    weekData[date].push(recipeId);
    
    if (saveMealPlan(weekData)) {
        renderCalendar(currentWeekOffset);
        showMessage('Meal added to calendar! 📅', 'success');
        return true;
    }
    
    return false;
}

// ========================================
// Remove Meal from Day
// ========================================
function removeMeal(date, recipeId) {
    const weekData = getMealPlanForWeek(currentWeekOffset);
    
    if (!weekData[date]) return;
    
    weekData[date] = weekData[date].filter(id => id !== recipeId);
    
    // Remove empty day entries
    if (weekData[date].length === 0) {
        delete weekData[date];
    }
    
    if (saveMealPlan(weekData)) {
        renderCalendar(currentWeekOffset);
        showMessage('Meal removed from calendar.', 'info');
    }
}

// ========================================
// Clear Week
// ========================================
function clearWeek() {
    const weekData = {};
    if (saveMealPlan(weekData)) {
        renderCalendar(currentWeekOffset);
        showMessage('All meals cleared for this week.', 'info');
    }
}

// ========================================
// Drag and Drop Handlers
// ========================================
function onDragStart(event, recipeId) {
    event.dataTransfer.setData('text/plain', recipeId);
    event.dataTransfer.effectAllowed = 'copy';
}

function onDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    event.currentTarget.style.backgroundColor = 'var(--primary-light)';
}

function onDragLeave(event) {
    event.currentTarget.style.backgroundColor = '';
}

function onDrop(event, date) {
    event.preventDefault();
    event.currentTarget.style.backgroundColor = '';
    
    const recipeId = event.dataTransfer.getData('text/plain');
    if (recipeId) {
        addMealToDay(date, recipeId);
    }
}

// ========================================
// Render Recipe Pool (Available Recipes)
// ========================================
function renderRecipePool() {
    const pool = document.getElementById('recipePool');
    if (!pool) return;
    
    const recipes = getRecipes();
    
    if (recipes.length === 0) {
        pool.innerHTML = `
            <div class="empty-state" style="padding: 20px;">
                <p>No recipes yet. <a href="create-recipe.html">Share your first recipe!</a></p>
            </div>
        `;
        return;
    }
    
    pool.innerHTML = recipes.map(recipe => `
        <div class="recipe-pool-item" 
             draggable="true" 
             ondragstart="onDragStart(event, '${recipe.id}')"
             title="Drag this recipe to the calendar">
            ${recipe.title}
            <span style="font-size: 0.7rem; display: block; color: var(--text-light);">
                ${recipe.category || 'Uncategorized'}
            </span>
        </div>
    `).join('');
}

// ========================================
// Generate and Navigate to Shopping List
// ========================================
function generateAndNavigateShoppingList() {
    const weekData = getMealPlanForWeek(currentWeekOffset);
    const allRecipeIds = Object.values(weekData).flat();
    
    if (allRecipeIds.length === 0) {
        showMessage('No meals planned for this week. Add some recipes first!', 'warning');
        return;
    }
    
    // Generate shopping list
    const shoppingItems = generateShoppingList(weekData);
    
    // Save shopping list
    const user = getCurrentUser();
    if (user) {
        createShoppingList(user.id, shoppingItems);
    }
    
    // Navigate to shopping list
    window.location.href = 'shopping-list.html';
}

// ========================================
// Export Functions
// ========================================
window.initCalendar = initCalendar;
window.renderCalendar = renderCalendar;
window.getWeekDates = getWeekDates;
window.getMealPlanForWeek = getMealPlanForWeek;
window.saveMealPlan = saveMealPlan;
window.addMealToDay = addMealToDay;
window.removeMeal = removeMeal;
window.clearWeek = clearWeek;
window.onDragStart = onDragStart;
window.onDragOver = onDragOver;
window.onDragLeave = onDragLeave;
window.onDrop = onDrop;
window.renderRecipePool = renderRecipePool;
window.generateAndNavigateShoppingList = generateAndNavigateShoppingList;

// Initialize calendar when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initCalendar();
});