// Client-side JavaScript for Portmaster Game Checker

// Platform form switching functions
function showSteamForm() {
    document.getElementById('steam-form').className = 'block';
    document.getElementById('epic-form').className = 'hidden';
    document.getElementById('gog-form').className = 'hidden';
    document.getElementById('steam-btn').style.backgroundColor = '#1b2838';
    document.getElementById('epic-btn').className = 'px-5 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 bg-gray-600';
    document.getElementById('gog-btn').className = 'px-5 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 bg-gray-600';
}

function showEpicForm() {
    document.getElementById('steam-form').className = 'hidden';
    document.getElementById('epic-form').className = 'block';
    document.getElementById('gog-form').className = 'hidden';
    document.getElementById('steam-btn').className = 'px-5 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 bg-gray-600';
    document.getElementById('epic-btn').style.backgroundColor = '#313131';
    document.getElementById('gog-btn').className = 'px-5 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 bg-gray-600';
}

function showGogForm() {
    document.getElementById('steam-form').className = 'hidden';
    document.getElementById('epic-form').className = 'hidden';
    document.getElementById('gog-form').className = 'block';
    document.getElementById('steam-btn').className = 'px-5 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 bg-gray-600';
    document.getElementById('epic-btn').className = 'px-5 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 bg-gray-600';
    document.getElementById('gog-btn').style.backgroundColor = '#7c3aed';
}
