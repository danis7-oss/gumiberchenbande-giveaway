// TikTok API Configuration
const TIKTOK_USERNAME = 'gumiberchenbande';

// Form Elements
const form = document.getElementById('giveawayForm');
const tikTokInput = document.getElementById('tikTokName');
const reasonInput = document.getElementById('reason');
const charCountSpan = document.getElementById('charCount');
const prizeTypeInputs = document.querySelectorAll('input[name="prizeType"]');
const gutscheinSelect = document.getElementById('gutscheinType');
const gutscheinHint = document.getElementById('gutscheinHint');
const successMessage = document.getElementById('successMessage');
const followerCountEl = document.getElementById('followerCount');
const updateTimeEl = document.getElementById('updateTime');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
    loadFollowerCount();
    // Refresh follower count every 5 minutes
    setInterval(loadFollowerCount, 5 * 60 * 1000);
});

// Initialize Form Listeners
function initializeForm() {
    // Character counter for reason textarea
    reasonInput.addEventListener('input', updateCharCount);

    // Prize type change listener
    prizeTypeInputs.forEach(input => {
        input.addEventListener('change', handlePrizeTypeChange);
    });

    // Gutschein type change listener
    gutscheinSelect.addEventListener('change', updateGutscheinHint);

    // TikTok username formatting
    tikTokInput.addEventListener('input', formatTikTokUsername);

    // Form submission
    form.addEventListener('submit', handleFormSubmit);
}

// Update character count
function updateCharCount() {
    const length = reasonInput.value.length;
    charCountSpan.textContent = Math.min(length, 500);
    
    if (length > 500) {
        reasonInput.value = reasonInput.value.substring(0, 500);
    }
}

// Format TikTok username
function formatTikTokUsername() {
    let value = tikTokInput.value.trim();
    
    // Remove @ if it exists
    if (value.startsWith('@')) {
        value = value.substring(1);
    }
    
    // Remove spaces
    value = value.replace(/\s/g, '');
    
    tikTokInput.value = value;
}

// Handle prize type change
function handlePrizeTypeChange(e) {
    const selectedType = e.target.value;
    
    if (selectedType === 'gutschein') {
        gutscheinSelect.parentElement.style.display = 'block';
        gutscheinSelect.required = true;
    } else {
        gutscheinSelect.parentElement.style.display = 'none';
        gutscheinSelect.required = false;
        gutscheinSelect.value = '';
    }
}

// Update Gutschein Hint
function updateGutscheinHint() {
    const selected = gutscheinSelect.options[gutscheinSelect.selectedIndex].text;
    if (selected && selected !== '-- Wähle einen Gutschein --') {
        gutscheinHint.textContent = `Du hast ${selected} gewählt!`;
        gutscheinHint.style.color = '#00d4ff';
    }
}

// Load Follower Count
async function loadFollowerCount() {
    try {
        // Using TikTok API - Note: For production, you need a backend service
        // as TikTok API requires server-side authentication
        
        const response = await fetch(`https://www.tiktok.com/api/user/detail/?uniqueId=${TIKTOK_USERNAME}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }).catch(() => null);

        if (response && response.ok) {
            const data = await response.json();
            const followers = data.userDetail?.user?.stats?.followerCount || 0;
            updateFollowerDisplay(followers);
        } else {
            // Fallback: Load from localStorage or use placeholder
            loadFollowerCountFallback();
        }
    } catch (error) {
        console.log('Follower count error - using fallback');
        loadFollowerCountFallback();
    }
}

// Fallback Follower Count
function loadFollowerCountFallback() {
    // Try to load from localStorage
    let followers = localStorage.getItem('gumiberchenbande_followers');
    
    if (!followers) {
        // Placeholder - you'll need to update this manually or connect to a real API
        followers = 'Follower werden geladen...';
        // Set a data-attribute to track that we need real data
        document.querySelector('.count').setAttribute('data-loading', 'true');
    }
    
    updateFollowerDisplay(followers);
}

// Update Follower Display
function updateFollowerDisplay(count) {
    const countElement = document.querySelector('.count');
    
    if (typeof count === 'number') {
        countElement.textContent = count.toLocaleString('de-DE');
        countElement.removeAttribute('data-loading');
        localStorage.setItem('gumiberchenbande_followers', count);
    } else {
        countElement.textContent = count;
    }
    
    const now = new Date();
    const timeString = now.toLocaleString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    updateTimeEl.textContent = `Aktualisiert: ${timeString}`;
}

// Handle Form Submission
async function handleFormSubmit(e) {
    e.preventDefault();

    // Validate form
    if (!form.checkValidity()) {
        alert('Bitte fülle alle Felder aus!');
        return;
    }

    // Get form data
    const formData = {
        tikTokName: tikTokInput.value.toLowerCase(),
        email: document.getElementById('email').value,
        reason: reasonInput.value,
        prizeType: document.querySelector('input[name="prizeType"]:checked').value,
        gutscheinType: gutscheinSelect.value || null,
        timestamp: new Date().toISOString(),
        id: generateUniqueId()
    };

    // Validate TikTok follower status (client-side check)
    try {
        const isFollowing = await checkTikTokFollow(formData.tikTokName);
        if (!isFollowing && document.querySelector('input[name="followConfirm"]').checked) {
            // Note: This is a client-side check. For production, implement server-side verification.
            console.log('Follow status confirmed by user');
        }
    } catch (error) {
        console.log('TikTok verification not available, relying on user confirmation');
    }

    // Save to localStorage (for demo) - In production, send to backend
    saveParticipation(formData);

    // Show success message
    form.style.display = 'none';
    successMessage.style.display = 'block';

    // Log for monitoring
    console.log('Participation saved:', formData);
}

// Check TikTok Follow (placeholder)
async function checkTikTokFollow(username) {
    // This would need server-side implementation for real verification
    // TikTok API doesn't allow direct client-side follower checks
    return true; // Assume true, rely on user checkbox
}

// Save Participation
function saveParticipation(data) {
    // Get existing participations
    let participations = JSON.parse(localStorage.getItem('gumiberchenbande_participations') || '[]');
    
    // Add new participation
    participations.push(data);
    
    // Save back to localStorage
    localStorage.setItem('gumiberchenbande_participations', JSON.stringify(participations));
    
    // For production: Send to backend API
    // sendToBackend(data);
    
    // Send email notification (would need backend)
    sendEmailNotification(data);
}

// Generate Unique ID
function generateUniqueId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Send Email Notification (backend required)
async function sendEmailNotification(formData) {
    try {
        // This would call a backend service
        // For now, just log it
        console.log('Email notification would be sent to:', formData.email);
        
        // Example of what would be sent:
        const emailContent = {
            to: formData.email,
            subject: 'Gumiberchenbande Verlosung - Anmeldung bestätigt! 🎉',
            message: `
                Danke für deine Teilnahme an der Gumiberchenbande Verlosung!
                
                Dein TikTok Name: @${formData.tikTokName}
                Gewünschter Preis: ${formData.prizeType === 'gutschein' ? `€10 ${formData.gutscheinType} Gutschein` : 'Tag mit uns'}
                
                Viel Glück! 🍀
            `
        };
        
        console.log('Email content:', emailContent);
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

// Validation helper
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Debug: Log all participations
function getParticipations() {
    return JSON.parse(localStorage.getItem('gumiberchenbande_participations') || '[]');
}

// Debug: Get statistics
function getParticipationStats() {
    const participations = getParticipations();
    
    const stats = {
        total: participations.length,
        byPrizeType: {
            gutschein: participations.filter(p => p.prizeType === 'gutschein').length,
            dayWithUs: participations.filter(p => p.prizeType === 'dayWithUs').length
        },
        gutscheinPreferences: {}
    };
    
    participations.forEach(p => {
        if (p.gutscheinType) {
            stats.gutscheinPreferences[p.gutscheinType] = (stats.gutscheinPreferences[p.gutscheinType] || 0) + 1;
        }
    });
    
    return stats;
}

// Manually update follower count (for admin)
function updateFollowerCountManual(count) {
    localStorage.setItem('gumiberchenbande_followers', count);
    loadFollowerCount();
    console.log(`Followers updated to: ${count}`);
}

// Export functions for console access in production
window.giveawayDebug = {
    getParticipations,
    getStats: getParticipationStats,
    updateFollowers: updateFollowerCountManual
};

// Console hint
console.log('Gumiberchenbande Giveaway Seite geladen!');
console.log('Debug-Funktionen verfügbar unter: window.giveawayDebug');