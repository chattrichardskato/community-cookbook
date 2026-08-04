// ========================================
// Events Module - Community Event Management
// ========================================

// ========================================
// Initialize Events Page
// ========================================
function initEvents() {
    // Check if we're on the events page
    if (!document.getElementById('eventsList')) return;
    
    renderEvents();
    
    // Set up event listeners
    document.getElementById('createEventBtn')?.addEventListener('click', () => {
        openEventModal();
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('eventModal');
        if (event.target === modal) {
            closeEventModal();
        }
    });
}

// ========================================
// Render Events
// ========================================
function renderEvents() {
    const container = document.getElementById('eventsList');
    const noEvents = document.getElementById('noEvents');
    
    if (!container) return;
    
    const events = getUpcomingEvents();
    
    if (events.length === 0) {
        container.innerHTML = '';
        if (noEvents) noEvents.style.display = 'block';
        return;
    }
    
    if (noEvents) noEvents.style.display = 'none';
    
    const user = getCurrentUser();
    
    container.innerHTML = events.map(event => {
        const isCreator = user && event.creatorId === user.id;
        const isAttending = user && event.attendees.some(a => a.userId === user.id);
        
        return `
            <div class="event-card">
                <h3>${event.title}</h3>
                <div class="event-meta">
                    <span>📅 ${formatDate(event.date)}</span>
                    ${event.time ? `<span>⏰ ${formatTime(event.time)}</span>` : ''}
                    ${event.location ? `<span>📍 ${event.location}</span>` : ''}
                </div>
                ${event.description ? `<p>${event.description}</p>` : ''}
                <div class="event-attendees">
                    <strong>👥 ${event.attendees.length} attending</strong>
                    <div class="attendee-list">
                        ${event.attendees.map(a => `
                            <span class="attendee-item">
                                ${a.recipeName || 'Bringing a dish'}
                            </span>
                        `).join('')}
                    </div>
                </div>
                <div class="event-actions">
                    ${isCreator ? `
                        <button class="btn-secondary" onclick="deleteEvent('${event.id}')">🗑️ Delete</button>
                    ` : ''}
                    ${!isAttending && user ? `
                        <button class="btn-primary" onclick="showAttendModal('${event.id}')">➕ Sign Up</button>
                    ` : ''}
                    ${isAttending ? `
                        <button class="btn-secondary" onclick="cancelAttendance('${event.id}')">🚫 Cancel</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// Open Event Modal
// ========================================
function openEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('eventForm')?.reset();
    }
}

// ========================================
// Close Event Modal
// ========================================
function closeEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ========================================
// Create Event
// ========================================
function createEvent(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        showMessage('Please log in to create events.', 'warning');
        return;
    }
    
    const title = document.getElementById('eventTitle')?.value.trim();
    const date = document.getElementById('eventDate')?.value;
    const time = document.getElementById('eventTime')?.value;
    const location = document.getElementById('eventLocation')?.value.trim();
    const description = document.getElementById('eventDescription')?.value.trim();
    
    if (!title || !date) {
        showMessage('Please fill in all required fields.', 'error');
        return;
    }
    
    const eventData = {
        title,
        date,
        time: time || '',
        location: location || '',
        description: description || '',
        creatorId: user.id,
        creatorName: user.name || 'Anonymous',
        attendees: []
    };
    
    const newEvent = createEvent(eventData);
    
    if (newEvent) {
        closeEventModal();
        renderEvents();
        showMessage('Event created successfully! 🎉', 'success');
    } else {
        showMessage('Failed to create event. Please try again.', 'error');
    }
}

// ========================================
// Show Attend Modal
// ========================================
function showAttendModal(eventId) {
    const user = getCurrentUser();
    if (!user) {
        showMessage('Please log in to sign up.', 'warning');
        return;
    }
    
    const event = getEventById(eventId);
    if (!event) {
        showMessage('Event not found.', 'error');
        return;
    }
    
    // Get user's recipes
    const userRecipes = getRecipesByUser(user.id);
    const allRecipes = getRecipes();
    
    // Show a modal with recipe selection
    const modalHtml = `
        <div id="attendModal" class="modal" style="display:flex;">
            <div class="modal-content">
                <span class="modal-close" onclick="closeAttendModal()">&times;</span>
                <h2>Sign Up for ${event.title}</h2>
                <p>Select a recipe you'll bring:</p>
                <div class="recipe-selection">
                    ${allRecipes.map(recipe => `
                        <div class="recipe-option" onclick="signUpForEvent('${event.id}', '${recipe.id}')">
                            <strong>${recipe.title}</strong>
                            <span>${recipe.category || 'Uncategorized'}</span>
                            ${userRecipes.some(r => r.id === recipe.id) ? ' 👤 Your recipe' : ''}
                        </div>
                    `).join('')}
                </div>
                <button class="btn-secondary" onclick="closeAttendModal()">Cancel</button>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existing = document.getElementById('attendModal');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ========================================
// Close Attend Modal
// ========================================
function closeAttendModal() {
    const modal = document.getElementById('attendModal');
    if (modal) modal.remove();
}

// ========================================
// Sign Up for Event
// ========================================
function signUpForEvent(eventId, recipeId) {
    const user = getCurrentUser();
    if (!user) return;
    
    const recipe = getRecipeById(recipeId);
    if (!recipe) {
        showMessage('Recipe not found.', 'error');
        return;
    }
    
    const result = addAttendeeToEvent(eventId, user.id, recipeId, recipe.title);
    
    if (result) {
        closeAttendModal();
        renderEvents();
        showMessage(`Signed up to bring ${recipe.title}! 🎉`, 'success');
    } else {
        showMessage('Failed to sign up. You may already be bringing this dish.', 'error');
    }
}

// ========================================
// Cancel Attendance
// ========================================
function cancelAttendance(eventId) {
    const user = getCurrentUser();
    if (!user) return;
    
    if (!confirm('Are you sure you want to cancel your attendance?')) return;
    
    const event = getEventById(eventId);
    if (!event) return;
    
    const attendee = event.attendees.find(a => a.userId === user.id);
    if (attendee) {
        removeAttendeeFromEvent(eventId, user.id, attendee.recipeId);
        renderEvents();
        showMessage('Attendance cancelled.', 'info');
    }
}

// ========================================
// Delete Event
// ========================================
function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    const result = deleteEvent(eventId);
    
    if (result) {
        renderEvents();
        showMessage('Event deleted.', 'info');
    } else {
        showMessage('Failed to delete event.', 'error');
    }
}

// ========================================
// Export Functions
// ========================================
window.initEvents = initEvents;
window.renderEvents = renderEvents;
window.openEventModal = openEventModal;
window.closeEventModal = closeEventModal;
window.createEvent = createEvent;
window.showAttendModal = showAttendModal;
window.closeAttendModal = closeAttendModal;
window.signUpForEvent = signUpForEvent;
window.cancelAttendance = cancelAttendance;
window.deleteEvent = deleteEvent;

// Initialize events when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initEvents();
});