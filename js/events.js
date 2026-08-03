// Event sign-up with duplicate prevention
function signUpForEvent(eventId, userId, recipeId) {
    const events = getEvents();
    const eventIndex = events.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) {
        showMessage('Event not found', 'error');
        return;
    }
    
    const event = events[eventIndex];
    const recipe = AppState.recipes.find(r => r.id === recipeId);
    
    // Check for duplicates
    const duplicate = event.attendees.some(a => a.recipeId === recipeId);
    if (duplicate) {
        showMessage(`${recipe.title} is already being brought!`, 'warning');
        return;
    }
    
    // Add attendee
    event.attendees.push({
        userId: userId,
        recipeId: recipeId,
        recipeName: recipe.title,
        signedUpAt: new Date().toISOString()
    });
    
    saveEvents(events);
    renderEventDetails(event);
    showMessage(`Signed up to bring ${recipe.title}!`, 'success');
}