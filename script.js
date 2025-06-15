// App State
let currentUser = null;
let currentDate = new Date();
let availabilityDate = new Date();
let deferredPrompt = null;
let notificationPermission = false;
let weatherForecastData = {}; // Store 3-day forecast data by date
let appData = {
    sessions: [],
    venues: [
        {
            id: 1,
            name: 'Jumbo',
            address: 'Λακαταμία',
            phone: '97443000',
            website: 'https://goallpadel.com/',
            pricePerHour: 25.00
        }
    ],
    availability: {}, // user -> date -> boolean
    comments: {} // sessionId -> comments array
};

// Greek month names
const greekMonths = [
    'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
    'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
];

// DOM Elements
const userSelectionModal = document.getElementById('userSelectionModal');
const currentUserAvatar = document.getElementById('currentUserAvatar');
const currentUserName = document.getElementById('currentUserName');
const changeUserBtn = document.getElementById('changeUserBtn');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Calendar elements
const currentMonthEl = document.getElementById('currentMonth');
const calendarGridEl = document.getElementById('calendarGrid');
const upcomingSessionsEl = document.getElementById('upcomingSessions');

// Availability elements
const currentAvailabilityMonthEl = document.getElementById('currentAvailabilityMonth');
const availabilityGridEl = document.getElementById('availabilityGrid');

// Form elements
const sessionForm = document.getElementById('sessionForm');
const sessionDateInput = document.getElementById('sessionDate');
const availabilityInfo = document.getElementById('availabilityInfo');
const playersGrid = document.getElementById('playersGrid');
const venueSelect = document.getElementById('venue');
const venuesListEl = document.getElementById('venuesList');
const addVenueBtn = document.getElementById('addVenueBtn');
const addVenueForm = document.getElementById('addVenueForm');
const venueForm = document.getElementById('venueForm');
const cancelVenueBtn = document.getElementById('cancelVenue');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    await loadData();
    initializeEventListeners();
    initializePWA();
    initializeNotifications();
    initializeWeather(); // Initialize weather widget
    showUserSelection();
}

// User Management
function showUserSelection() {
    userSelectionModal.style.display = 'flex';
    
    // Add click listeners to user options
    document.querySelectorAll('.user-option').forEach(option => {
        option.addEventListener('click', () => {
            selectUser(option.dataset.user);
        });
    });
}

function selectUser(username) {
    currentUser = username;
    userSelectionModal.style.display = 'none';
    
    // Update UI
    currentUserAvatar.src = `images/avatars/${APP_CONFIG.avatars[username]}`;
    currentUserAvatar.alt = username;
    currentUserName.textContent = username;
    
    // Initialize the rest of the app
    renderCalendar();
    renderAvailabilityCalendar();
    renderUpcomingSessions();
    renderVenueOptions();
    renderVenuesList();
    
    // Schedule reminders for existing sessions
    scheduleAllExistingReminders();
    
    // Save current user to localStorage
    localStorage.setItem('currentUser', username);
}

// Load data from Supabase and localStorage
async function loadData() {
    // Load from localStorage as fallback
    const savedData = localStorage.getItem('padelAppData');
    if (savedData) {
        appData = { ...appData, ...JSON.parse(savedData) };
    }
    
    // Load current user
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser && APP_CONFIG.players.includes(savedUser)) {
        currentUser = savedUser;
        currentUserAvatar.src = `images/avatars/${APP_CONFIG.avatars[savedUser]}`;
        currentUserAvatar.alt = savedUser;
        currentUserName.textContent = savedUser;
    }
    
    try {
        // Load sessions from Supabase
        const { data: sessions, error: sessionsError } = await supabaseClient
            .from('sessions')
            .select('*')
            .order('date', { ascending: true });
        
        if (!sessionsError && sessions) {
            appData.sessions = sessions;
        }
        
        // Load availability from Supabase
        const { data: availability, error: availabilityError } = await supabaseClient
            .from('availability')
            .select('*');
        
        if (!availabilityError && availability) {
            appData.availability = {};
            availability.forEach(item => {
                if (!appData.availability[item.user]) {
                    appData.availability[item.user] = {};
                }
                appData.availability[item.user][item.date] = item.available;
            });
        }
        
        // Load venues from Supabase
        const { data: venues, error: venuesError } = await supabaseClient
            .from('venues')
            .select('*');
        
        if (!venuesError && venues && venues.length > 0) {
            appData.venues = venues;
        }

        // Load all comments for all sessions
        const { data: allComments, error: commentsError } = await supabaseClient
            .from('session_comments')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (!commentsError && allComments) {
            appData.comments = {};
            allComments.forEach(comment => {
                if (!appData.comments[comment.session_id]) {
                    appData.comments[comment.session_id] = [];
                }
                appData.comments[comment.session_id].push(comment);
            });
        }
        
    } catch (error) {
        console.log('Using offline mode:', error);
    }
}

// Save data to Supabase
async function saveData() {
    // Save to localStorage as backup
    localStorage.setItem('padelAppData', JSON.stringify(appData));
    
    try {
        // Note: In a real implementation, you would sync with Supabase here
        console.log('Data saved to localStorage (Supabase sync would happen here)');
    } catch (error) {
        console.error('Error saving to Supabase:', error);
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Tab switching
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Availability calendar navigation
    document.getElementById('prevAvailabilityMonth').addEventListener('click', () => {
        availabilityDate.setMonth(availabilityDate.getMonth() - 1);
        renderAvailabilityCalendar();
    });

    document.getElementById('nextAvailabilityMonth').addEventListener('click', () => {
        availabilityDate.setMonth(availabilityDate.getMonth() + 1);
        renderAvailabilityCalendar();
    });

    // Form submissions
    sessionForm.addEventListener('submit', handleSessionSubmit);
    venueForm.addEventListener('submit', handleVenueSubmit);

    // User change
    changeUserBtn.addEventListener('click', showUserSelection);

    // Date selection in booking form
    sessionDateInput.addEventListener('change', updateAvailabilityInfo);

    // Venue management
    addVenueBtn.addEventListener('click', () => {
        addVenueForm.style.display = 'block';
        addVenueBtn.style.display = 'none';
    });

    cancelVenueBtn.addEventListener('click', () => {
        addVenueForm.style.display = 'none';
        addVenueBtn.style.display = 'block';
        venueForm.reset();
    });
}

// Switch between tabs
function switchTab(tabName) {
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });

    // Refresh data when switching tabs
    if (tabName === 'calendar') {
        renderCalendar();
        renderUpcomingSessions();
    } else if (tabName === 'availability') {
        renderAvailabilityCalendar();
    } else if (tabName === 'booking') {
        updateAvailabilityInfo();
        renderPlayersGrid();
    }
}

// Render main calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    currentMonthEl.textContent = `${greekMonths[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    // Clear only day elements, keep headers
    const dayElements = calendarGridEl.querySelectorAll('.day');
    dayElements.forEach(day => day.remove());

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        const prevDate = new Date(year, month - 1, new Date(year, month, 0).getDate() - startingDayOfWeek + i + 1);
        const dayEl = createDayElement(prevDate.getDate(), true, false);
        calendarGridEl.appendChild(dayEl);
    }

    // Add days of the current month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const hasSession = hasSessionOnDate(date);
        const dayEl = createDayElement(day, false, isToday, hasSession, date);
        calendarGridEl.appendChild(dayEl);
    }

    // Fill remaining cells
    const currentCells = calendarGridEl.children.length;
    const remainingCells = 42 - currentCells;
    for (let i = 1; i <= remainingCells && remainingCells > 0; i++) {
        const nextDate = new Date(year, month + 1, i);
        const dayEl = createDayElement(nextDate.getDate(), true, false);
        calendarGridEl.appendChild(dayEl);
    }
}

// Create calendar day element
function createDayElement(day, isOtherMonth, isToday, hasSession = false, date = null) {
    const dayEl = document.createElement('div');
    dayEl.className = 'day';
    
    // Create day number element
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayEl.appendChild(dayNumber);

    if (isOtherMonth) {
        dayEl.classList.add('other-month');
    }
    if (isToday) {
        dayEl.classList.add('today');
    }
    if (hasSession) {
        dayEl.classList.add('has-session');
    }

    // Add weather icon and temperature if forecast is available for this date
    if (!isOtherMonth && date && hasWeatherForecast(date)) {
        const dateStr = date.toISOString().split('T')[0];
        const weatherData = getWeatherForDate(dateStr);
        
        if (weatherData) {
            dayEl.classList.add('has-weather');
            
            // Create weather container
            const weatherContainer = document.createElement('div');
            weatherContainer.className = 'day-weather-container';
            
            // Create weather icon element
            const weatherIcon = document.createElement('div');
            weatherIcon.className = 'day-weather-icon';
            weatherIcon.textContent = weatherData.icon;
            weatherContainer.appendChild(weatherIcon);
            
            // Create temperature element
            const weatherTemp = document.createElement('div');
            weatherTemp.className = 'day-weather-temp';
            weatherTemp.textContent = `${weatherData.maxTemp}°`;
            weatherContainer.appendChild(weatherTemp);
            
            // Add tooltip with full weather info
            weatherContainer.title = `${weatherData.condition} - ${weatherData.minTemp}°/${weatherData.maxTemp}°C`;
            
            dayEl.appendChild(weatherContainer);
        }
    }

    if (!isOtherMonth && date) {
        dayEl.addEventListener('click', () => {
            showSessionsForDate(date);
        });
    }

    return dayEl;
}

// Render availability calendar
function renderAvailabilityCalendar() {
    const year = availabilityDate.getFullYear();
    const month = availabilityDate.getMonth();
    
    currentAvailabilityMonthEl.textContent = `${greekMonths[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    // Clear only day elements, keep headers
    const dayElements = availabilityGridEl.querySelectorAll('.availability-day');
    dayElements.forEach(day => day.remove());

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        const prevDate = new Date(year, month - 1, new Date(year, month, 0).getDate() - startingDayOfWeek + i + 1);
        const dayEl = createAvailabilityDayElement(prevDate.getDate(), true, false);
        availabilityGridEl.appendChild(dayEl);
    }

    // Add days of the current month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const dayEl = createAvailabilityDayElement(day, false, isToday, date);
        availabilityGridEl.appendChild(dayEl);
    }

    // Fill remaining cells
    const currentCells = availabilityGridEl.children.length;
    const remainingCells = 42 - currentCells;
    for (let i = 1; i <= remainingCells && remainingCells > 0; i++) {
        const nextDate = new Date(year, month + 1, i);
        const dayEl = createAvailabilityDayElement(nextDate.getDate(), true, false);
        availabilityGridEl.appendChild(dayEl);
    }
}

// Create availability day element
function createAvailabilityDayElement(day, isOtherMonth, isToday, date = null) {
    const dayEl = document.createElement('div');
    dayEl.className = 'availability-day';
    dayEl.textContent = day;

    if (isOtherMonth) {
        dayEl.classList.add('other-month');
        return dayEl;
    }

    if (isToday) {
        dayEl.classList.add('today');
    }

    if (date && currentUser) {
        const dateStr = date.toISOString().split('T')[0];
        const userAvailability = getUserAvailability(currentUser, dateStr);
        const othersAvailable = getOthersAvailableCount(dateStr);

        if (userAvailability === true) {
            dayEl.classList.add('current-user-available');
        } else if (userAvailability === false) {
            dayEl.classList.add('unavailable');
        } else if (othersAvailable > 0) {
            dayEl.classList.add('others-available');
        }

        // Add click listener to toggle availability
        dayEl.addEventListener('click', () => {
            toggleAvailability(dateStr);
        });
    }

    return dayEl;
}

// Availability functions
function getUserAvailability(user, dateStr) {
    if (!appData.availability[user]) return null;
    const availability = appData.availability[user][dateStr];
    return availability === undefined ? null : availability;
}

function getOthersAvailableCount(dateStr) {
    let count = 0;
    APP_CONFIG.players.forEach(player => {
        if (player !== currentUser && getUserAvailability(player, dateStr) === true) {
            count++;
        }
    });
    return count;
}

function getAvailablePlayersForDate(dateStr) {
    return APP_CONFIG.players.filter(player => 
        getUserAvailability(player, dateStr) === true
    );
}

async function toggleAvailability(dateStr) {
    if (!currentUser) return;

    if (!appData.availability[currentUser]) {
        appData.availability[currentUser] = {};
    }

    const currentAvailability = appData.availability[currentUser][dateStr];
    let newAvailability;
    
    // 3-state cycle: undefined -> true -> false -> undefined
    if (currentAvailability === undefined || currentAvailability === null) {
        newAvailability = true; // First click: available
    } else if (currentAvailability === true) {
        newAvailability = false; // Second click: unavailable
    } else {
        newAvailability = null; // Third click: unset (remove from availability)
    }
    
    if (newAvailability === null) {
        // Remove from local data
        delete appData.availability[currentUser][dateStr];
        
        // Remove from Supabase
        try {
            await supabaseClient
                .from('availability')
                .delete()
                .eq('user', currentUser)
                .eq('date', dateStr);
        } catch (error) {
            console.error('Error removing availability:', error);
        }
    } else {
        // Set new availability
        appData.availability[currentUser][dateStr] = newAvailability;
        
        // Save to Supabase
        try {
            await supabaseClient
                .from('availability')
                .upsert({
                    user: currentUser,
                    date: dateStr,
                    available: newAvailability
                });
        } catch (error) {
            console.error('Error saving availability:', error);
        }
    }

    await saveData();
    renderAvailabilityCalendar();
    
    // Update booking form if on booking tab
    if (document.getElementById('booking').classList.contains('active')) {
        updateAvailabilityInfo();
        renderPlayersGrid();
    }
}

// Update availability info in booking form
function updateAvailabilityInfo() {
    const selectedDate = sessionDateInput.value;
    if (!selectedDate) {
        availabilityInfo.innerHTML = '';
        return;
    }

    const availablePlayers = getAvailablePlayersForDate(selectedDate);
    const weatherAdvice = getWeatherAdvice();
    
    let infoHtml = '';
    
    if (availablePlayers.length === 0) {
        infoHtml = '<i class="fas fa-exclamation-triangle"></i> Κανένας παίκτης δεν είναι διαθέσιμος για αυτή την ημερομηνία';
        availabilityInfo.className = 'availability-info no-availability';
    } else {
        infoHtml = `<i class="fas fa-check-circle"></i> Διαθέσιμοι παίκτες: ${availablePlayers.join(', ')}`;
        availabilityInfo.className = 'availability-info has-availability';
    }
    
    // Add weather advice if available
    if (weatherAdvice) {
        infoHtml += `<br><div class="weather-advice"><i class="fas fa-cloud-sun"></i> ${weatherAdvice}</div>`;
    }
    
    availabilityInfo.innerHTML = infoHtml;
}

// Render players grid based on availability
function renderPlayersGrid() {
    const selectedDate = sessionDateInput.value;
    const availablePlayers = selectedDate ? getAvailablePlayersForDate(selectedDate) : APP_CONFIG.players;

    playersGrid.innerHTML = APP_CONFIG.players.map((player, index) => {
        const isAvailable = availablePlayers.includes(player);
        const isDisabled = selectedDate && !isAvailable;
        
        return `
            <div class="player-card ${isDisabled ? 'disabled' : ''}">
                <input type="checkbox" id="player${index + 1}" value="${player}" ${isDisabled ? 'disabled' : ''}>
                <label for="player${index + 1}">
                    <img src="images/avatars/${APP_CONFIG.avatars[player]}" alt="${player}" class="player-avatar">
                    ${player}
                    ${selectedDate && !isAvailable ? '<br><small>Μη διαθέσιμος</small>' : ''}
                </label>
            </div>
        `;
    }).join('');
}

// Check if there's a session on a specific date
function hasSessionOnDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return appData.sessions.some(session => session.date === dateStr);
}

// Show sessions for specific date
function showSessionsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    const sessions = appData.sessions.filter(session => session.date === dateStr);
    
    if (sessions.length === 0) {
        alert(`Δεν υπάρχουν προγραμματισμένα παιχνίδια για ${formatDate(date)}`);
        return;
    }
    
    if (sessions.length === 1) {
        // If only one session, show comments directly
        showSessionComments(sessions[0].id);
        return;
    }
    
    // If multiple sessions, show selection dialog
    showSessionSelectionDialog(sessions, date);
}

function showSessionSelectionDialog(sessions, date) {
    const sessionsList = sessions.map((session, index) => {
        const venue = appData.venues.find(v => v.id === (session.venue_id || session.venueId));
        const commentsCount = getSessionCommentsCount(session.id);
        return `${index + 1}. ${session.time} - ${venue ? venue.name : 'Άγνωστο γήπεδο'} (${session.players.join(', ')})${commentsCount > 0 ? ` [${commentsCount} σχόλια]` : ''}`;
    }).join('\n');
    
    const message = `Παιχνίδια για ${formatDate(date)}:\n\n${sessionsList}\n\nΕπίλεξε αριθμό για να δεις σχόλια:`;
    
    const choice = prompt(message);
    const sessionIndex = parseInt(choice) - 1;
    
    if (sessionIndex >= 0 && sessionIndex < sessions.length) {
        showSessionComments(sessions[sessionIndex].id);
    }
}

// Format date for display
function formatDate(date) {
    const day = date.getDate();
    const month = greekMonths[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

// Render upcoming sessions
function renderUpcomingSessions() {
    const today = new Date();
    const upcomingSessions = appData.sessions
        .filter(session => new Date(session.date + 'T' + session.time) >= today)
        .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
        .slice(0, 5);

    if (upcomingSessions.length === 0) {
        upcomingSessionsEl.innerHTML = '<p style="color: #718096; text-align: center; padding: 20px;">Δεν υπάρχουν προγραμματισμένα παιχνίδια</p>';
        return;
    }

    upcomingSessionsEl.innerHTML = upcomingSessions.map(session => {
        const venue = appData.venues.find(v => v.id === (session.venue_id || session.venueId));
        const date = new Date(session.date);
        
        return `
            <div class="session-card">
                <div class="session-date">${formatDate(date)} στις ${session.time}</div>
                <div class="session-details">
                    <strong>📍 Γήπεδο:</strong> ${venue ? venue.name : 'Άγνωστο'}
                    ${session.notes ? `<br><strong>📝 Σημειώσεις:</strong> ${session.notes}` : ''}
                </div>
                <div class="session-players">
                    <strong>👥 Παίκτες:</strong> 
                    <div class="players-avatars">
                        ${session.players.map(player => `
                            <img src="images/avatars/${APP_CONFIG.avatars[player]}" alt="${player}" class="session-player-avatar" title="${player}">
                        `).join('')}
                        <span class="players-names">${session.players.join(', ')}</span>
                    </div>
                </div>
                <div class="session-actions">
                    <button class="comments-btn ${getSessionCommentsCount(session.id) > 0 ? 'has-comments' : ''}" onclick="showSessionComments(${session.id})">
                        <i class="fas fa-comments"></i>
                        Σχόλια ${getSessionCommentsCount(session.id) > 0 ? `(${getSessionCommentsCount(session.id)})` : ''}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Handle session form submission
async function handleSessionSubmit(e) {
    e.preventDefault();

    const selectedPlayers = Array.from(document.querySelectorAll('#playersGrid input[type="checkbox"]:checked'))
        .map(cb => cb.value);

    if (selectedPlayers.length === 0) {
        alert('Παρακαλώ επιλέξτε τουλάχιστον έναν παίκτη');
        return;
    }

    const session = {
        id: Date.now(),
        date: sessionDateInput.value,
        time: document.getElementById('sessionTime').value,
        venue_id: parseInt(document.getElementById('venue').value),
        players: selectedPlayers,
        notes: document.getElementById('notes').value,
        created_by: currentUser,
        created_at: new Date().toISOString()
    };

    try {
        // Save to Supabase
        await supabaseClient.from('sessions').insert([session]);
        
        appData.sessions.push(session);
        await saveData();

        // Schedule game reminder
        scheduleGameReminder(session);

        // Notify other players about new booking
        if (notificationPermission) {
            showNotification(
                'Νέα κράτηση παιχνιδιού! 🎾',
                `${currentUser} προγραμμάτισε παιχνίδι για ${formatDate(new Date(session.date))} στις ${session.time}`,
                {
                    tag: `new-booking-${session.id}`,
                    data: { sessionId: session.id }
                }
            );
        }

        showSuccessMessage('Το παιχνίδι προγραμματίστηκε επιτυχώς!');

        // Reset form
        sessionForm.reset();
        document.querySelectorAll('#playersGrid input[type="checkbox"]').forEach(cb => cb.checked = false);
        availabilityInfo.innerHTML = '';

        // Switch to calendar tab
        switchTab('calendar');
    } catch (error) {
        console.error('Error saving session:', error);
        alert('Σφάλμα κατά την αποθήκευση του παιχνιδιού');
    }
}

// Handle venue form submission
async function handleVenueSubmit(e) {
    e.preventDefault();

    const venue = {
        id: Date.now(),
        name: document.getElementById('venueName').value,
        address: document.getElementById('venueAddress').value,
        phone: document.getElementById('venuePhone').value,
        website: document.getElementById('venueWebsite').value,
        price_per_hour: parseFloat(document.getElementById('venuePricePerHour').value) || 0
    };

    try {
        // Save to Supabase
        await supabaseClient.from('venues').insert([venue]);
        
        appData.venues.push(venue);
        await saveData();

        showSuccessMessage('Το γήπεδο προστέθηκε επιτυχώς!');

        // Reset form and hide it
        venueForm.reset();
        addVenueForm.style.display = 'none';
        addVenueBtn.style.display = 'block';

        // Refresh venue displays
        renderVenueOptions();
        renderVenuesList();
    } catch (error) {
        console.error('Error saving venue:', error);
        alert('Σφάλμα κατά την αποθήκευση του γηπέδου');
    }
}

// Render venue options in select
function renderVenueOptions() {
    venueSelect.innerHTML = '<option value="">Επιλέξτε γήπεδο...</option>';
    appData.venues.forEach(venue => {
        const option = document.createElement('option');
        option.value = venue.id;
        option.textContent = venue.name;
        venueSelect.appendChild(option);
    });
}

// Render venues list
function renderVenuesList() {
    if (appData.venues.length === 0) {
        venuesListEl.innerHTML = '<p style="color: #718096; text-align: center; padding: 20px;">Δεν υπάρχουν καταχωρημένα γήπεδα</p>';
        return;
    }

    venuesListEl.innerHTML = appData.venues.map(venue => `
        <div class="venue-card">
            <div class="venue-name">${venue.name}</div>
            <div class="venue-details">
                ${venue.address ? `📍 ${venue.address}<br>` : ''}
                ${venue.phone ? `📞 ${venue.phone}<br>` : ''}
                ${venue.website ? `🌐 <a href="${venue.website}" target="_blank" rel="noopener">Κρατήσεις Online</a><br>` : ''}
            </div>
            ${(venue.price_per_hour || venue.pricePerHour) > 0 ? `<div class="venue-price">💰 ${venue.price_per_hour || venue.pricePerHour}€/ώρα</div>` : ''}
        </div>
    `).join('');
}

// Show success message
function showSuccessMessage(message) {
    const successEl = document.createElement('div');
    successEl.className = 'success-message show';
    successEl.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    document.querySelector('.container').insertBefore(successEl, document.querySelector('.tab-nav'));
    
    setTimeout(() => {
        successEl.remove();
    }, 3000);
}

// Set default date to today in the booking form
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    if (sessionDateInput) {
        sessionDateInput.value = today.toISOString().split('T')[0];
        sessionDateInput.min = today.toISOString().split('T')[0];
    }
    
    // Initialize PWA and notifications
    initializePWA();
    
    // Start daily notification check
    startDailyNotificationCheck();
});

// ==================== PWA FUNCTIONALITY ====================

function initializePWA() {
    // Clear old caches first
    if ('caches' in window) {
        caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
                if (cacheName.includes('padel') && !cacheName.includes('v2')) {
                    console.log('Deleting old cache:', cacheName);
                    caches.delete(cacheName);
                }
            });
        });
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
        // Dynamic path detection
        const basePath = window.location.pathname.includes('/padel-pros/') ? '/padel-pros' : '';
        navigator.serviceWorker.register(basePath + '/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
                // Force update if there's a waiting service worker
                if (registration.waiting) {
                    registration.waiting.postMessage({command: 'skipWaiting'});
                }
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }

    // Handle PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPrompt();
    });

    // Also show install prompt on first visit
    window.addEventListener('load', () => {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            console.log('App is already installed');
            return;
        }
        
        // Check if user has dismissed the prompt before
        const installDismissed = localStorage.getItem('installPromptDismissed');
        const lastDismissed = localStorage.getItem('installLastDismissed');
        
        // Show prompt again after 7 days
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        if (!installDismissed || (lastDismissed && parseInt(lastDismissed) < sevenDaysAgo)) {
            setTimeout(() => {
                if (!deferredPrompt) {
                    showInstallPromptFallback();
                }
            }, 5000);
        }
    });

    // Handle PWA install button
    const installBtn = document.getElementById('installBtn');
    const dismissInstall = document.getElementById('dismissInstall');
    const installPrompt = document.getElementById('installPrompt');

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
                installPrompt.style.display = 'none';
                
                if (outcome === 'accepted') {
                    localStorage.setItem('pwaInstalled', 'true');
                    showSuccessMessage('Η εφαρμογή εγκαταστάθηκε επιτυχώς! 📱');
                }
            }
        });
    }

    if (dismissInstall) {
        dismissInstall.addEventListener('click', () => {
            installPrompt.style.display = 'none';
            localStorage.setItem('installPromptDismissed', 'true');
            localStorage.setItem('installLastDismissed', Date.now().toString());
        });
    }
}

function showInstallPrompt() {
    const installPrompt = document.getElementById('installPrompt');
    const dismissed = localStorage.getItem('installPromptDismissed');
    const lastDismissed = localStorage.getItem('installLastDismissed');
    
    // Show prompt again after 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const shouldShow = !dismissed || (lastDismissed && parseInt(lastDismissed) < sevenDaysAgo);
    
    if (shouldShow && installPrompt) {
        setTimeout(() => {
            installPrompt.style.display = 'block';
            installPrompt.classList.add('slide-in');
        }, 3000); // Show after 3 seconds
        
        // Auto-hide after 15 seconds
        setTimeout(() => {
            if (installPrompt.style.display === 'block') {
                installPrompt.classList.add('slide-out');
                setTimeout(() => {
                    installPrompt.style.display = 'none';
                    installPrompt.classList.remove('slide-in', 'slide-out');
                }, 300);
            }
        }, 15000);
    }
}

function showInstallPromptFallback() {
    const dismissed = localStorage.getItem('installPromptDismissed');
    const lastDismissed = localStorage.getItem('installLastDismissed');
    
    // Show prompt again after 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const shouldShow = !dismissed || (lastDismissed && parseInt(lastDismissed) < sevenDaysAgo);
    
    if (!shouldShow) return;
    
    const fallbackPrompt = document.createElement('div');
    fallbackPrompt.className = 'install-fallback-prompt';
    fallbackPrompt.innerHTML = `
        <div class="install-content">
            <div class="install-icon">📱</div>
            <div class="install-text">
                <h3>Εγκατάσταση Padel Pros</h3>
                <p>Προσθέστε την εφαρμογή στην αρχική οθόνη για γρήγορη πρόσβαση!</p>
                <small>Πατήστε το μενού του browser και επιλέξτε "Προσθήκη στην αρχική οθόνη"</small>
            </div>
            <button class="dismiss-fallback">Εντάξει</button>
        </div>
    `;
    
    document.body.appendChild(fallbackPrompt);
    
    // Add animation
    setTimeout(() => {
        fallbackPrompt.classList.add('show');
    }, 100);
    
    fallbackPrompt.querySelector('.dismiss-fallback').addEventListener('click', () => {
        localStorage.setItem('installPromptDismissed', 'true');
        localStorage.setItem('installLastDismissed', Date.now().toString());
        fallbackPrompt.classList.add('hide');
        setTimeout(() => {
            fallbackPrompt.remove();
        }, 300);
    });
    
    // Auto-hide after 12 seconds
    setTimeout(() => {
        if (document.body.contains(fallbackPrompt)) {
            fallbackPrompt.classList.add('hide');
            setTimeout(() => {
                if (document.body.contains(fallbackPrompt)) {
                    fallbackPrompt.remove();
                }
            }, 300);
        }
    }, 12000);
}

// ==================== NOTIFICATIONS FUNCTIONALITY ====================

function initializeNotifications() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
    }

    // Check current permission
    if (Notification.permission === 'granted') {
        notificationPermission = true;
    } else if (Notification.permission === 'default') {
        showNotificationPrompt();
    }
}

function showNotificationPrompt() {
    // Check if prompt already exists
    if (document.querySelector('.notification-prompt')) {
        return;
    }
    
    const prompt = document.createElement('div');
    prompt.className = 'notification-prompt';
    prompt.innerHTML = `
        <i class="fas fa-bell"></i>
        <span>Ενεργοποίησε τις ειδοποιήσεις για να λαμβάνεις reminders για τα παιχνίδια!</span>
        <button onclick="requestNotificationPermission()">Ενεργοποίηση</button>
        <button onclick="this.parentElement.remove()">Όχι τώρα</button>
    `;
    
    document.querySelector('.container').insertBefore(prompt, document.querySelector('.tab-nav'));
}

async function requestNotificationPermission() {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        notificationPermission = true;
        showSuccessMessage('Οι ειδοποιήσεις ενεργοποιήθηκαν!');
        
        // Show welcome notification
        showNotification('Padel Pros', 'Οι ειδοποιήσεις είναι ενεργές! 🎾');
    }
    
    // Remove prompt
    const prompt = document.querySelector('.notification-prompt');
    if (prompt) prompt.remove();
}

function showNotification(title, body, options = {}) {
    if (!notificationPermission) return;
    
    const defaultOptions = {
        body: body,
        icon: (window.location.pathname.includes('/padel-pros/') ? '/padel-pros' : '') + '/images/logo.jpg',
        badge: (window.location.pathname.includes('/padel-pros/') ? '/padel-pros' : '') + '/images/logo.jpg',
        vibrate: [100, 50, 100],
        ...options
    };
    
    new Notification(title, defaultOptions);
}

function scheduleGameReminder(session) {
    if (!notificationPermission) return;
    
    const gameDateTime = new Date(`${session.date}T${session.time}`);
    const now = new Date();
    const venue = appData.venues.find(v => v.id === (session.venue_id || session.venueId));
    
    // Check if current user is playing in this session
    if (!session.players.includes(currentUser)) return;
    
    // 1. Notification the day before (at 20:00)
    const dayBefore = new Date(gameDateTime);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(20, 0, 0, 0); // 8 PM the day before
    
    if (dayBefore > now) {
        const timeUntilDayBefore = dayBefore.getTime() - now.getTime();
        
        setTimeout(() => {
            showNotification(
                'Αύριο έχεις παιχνίδι Padel! 🎾',
                `Στις ${session.time} στο ${venue ? venue.name : 'γήπεδο'}. Μην το ξεχάσεις!`,
                {
                    tag: `day-before-${session.id}`,
                    requireInteraction: true,
                    actions: [
                        {
                            action: 'view',
                            title: 'Δες λεπτομέρειες'
                        }
                    ]
                }
            );
        }, timeUntilDayBefore);
    }
    
    // 2. Notification on the day of the game (2 hours before)
    const twoHoursBefore = new Date(gameDateTime.getTime() - 2 * 60 * 60 * 1000);
    
    if (twoHoursBefore > now) {
        const timeUntilTwoHours = twoHoursBefore.getTime() - now.getTime();
        
        setTimeout(() => {
            showNotification(
                'Σήμερα έχεις παιχνίδι Padel! 🎾',
                `Σε 2 ώρες στο ${venue ? venue.name : 'γήπεδο'} στις ${session.time}`,
                {
                    tag: `two-hours-before-${session.id}`,
                    requireInteraction: true,
                    actions: [
                        {
                            action: 'view',
                            title: 'Δες παίκτες'
                        }
                    ]
                }
            );
        }, timeUntilTwoHours);
    }
    
    // 3. Notification 30 minutes before the game
    const thirtyMinutesBefore = new Date(gameDateTime.getTime() - 30 * 60 * 1000);
    
    if (thirtyMinutesBefore > now) {
        const timeUntilThirtyMin = thirtyMinutesBefore.getTime() - now.getTime();
        
        setTimeout(() => {
            showNotification(
                'Το παιχνίδι ξεκινάει σύντομα! ⏰',
                `Σε 30 λεπτά στο ${venue ? venue.name : 'γήπεδο'}. Ώρα να ετοιμαστείς!`,
                {
                    tag: `thirty-min-before-${session.id}`,
                    requireInteraction: true,
                    vibrate: [200, 100, 200, 100, 200],
                    actions: [
                        {
                            action: 'directions',
                            title: 'Οδηγίες'
                        }
                    ]
                }
            );
        }, timeUntilThirtyMin);
    }
}

// ==================== COMMENTS FUNCTIONALITY ====================

// DOM Elements for comments
const sessionCommentsModal = document.getElementById('sessionCommentsModal');
const closeCommentsModal = document.getElementById('closeCommentsModal');
const sessionInfo = document.getElementById('sessionInfo');
const commentsContainer = document.getElementById('commentsContainer');
const newCommentTextarea = document.getElementById('newComment');
const addCommentBtn = document.getElementById('addCommentBtn');

let currentSessionForComments = null;

// Initialize comments event listeners
if (closeCommentsModal) {
    closeCommentsModal.addEventListener('click', closeCommentsModal_handler);
}

if (addCommentBtn) {
    addCommentBtn.addEventListener('click', addComment);
}

// Ensure modal is hidden on page load
if (sessionCommentsModal) {
    sessionCommentsModal.style.display = 'none';
}

function closeCommentsModal_handler() {
    sessionCommentsModal.style.display = 'none';
    currentSessionForComments = null;
}

async function showSessionComments(sessionId) {
    currentSessionForComments = sessionId;
    const session = appData.sessions.find(s => s.id === sessionId);
    
    if (!session) return;
    
    // Load comments from Supabase
    await loadSessionComments(sessionId);
    
    // Update session info
    const venue = appData.venues.find(v => v.id === (session.venue_id || session.venueId));
    const date = new Date(session.date);
    
    sessionInfo.innerHTML = `
        <h4>${formatDate(date)} στις ${session.time}</h4>
        <p><i class="fas fa-map-marker-alt"></i> ${venue ? venue.name : 'Άγνωστο γήπεδο'}</p>
        <p><i class="fas fa-users"></i> ${session.players.join(', ')}</p>
        ${session.notes ? `<p><i class="fas fa-sticky-note"></i> ${session.notes}</p>` : ''}
    `;
    
    // Render comments
    renderComments(sessionId);
    
    // Show modal
    sessionCommentsModal.style.display = 'flex';
}

async function loadSessionComments(sessionId) {
    try {
        const { data: comments, error } = await supabaseClient
            .from('session_comments')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });
        
        if (!error && comments) {
            appData.comments[sessionId] = comments;
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

function renderComments(sessionId) {
    const comments = appData.comments[sessionId] || [];
    
    if (comments.length === 0) {
        commentsContainer.innerHTML = '<div class="no-comments">Δεν υπάρχουν σχόλια ακόμα. Γράψε το πρώτο!</div>';
        return;
    }
    
    commentsContainer.innerHTML = comments.map(comment => {
        const commentDate = new Date(comment.created_at);
        const timeAgo = getTimeAgo(commentDate);
        
        return `
            <div class="comment">
                <div class="comment-header">
                    <div class="comment-author">
                        <img src="images/avatars/${APP_CONFIG.avatars[comment.user_name]}" alt="${comment.user_name}" class="comment-avatar">
                        <span class="comment-name">${comment.user_name}</span>
                    </div>
                    <span class="comment-time">${timeAgo}</span>
                </div>
                <p class="comment-text">${comment.comment}</p>
            </div>
        `;
    }).join('');
    
    // Scroll to bottom
    commentsContainer.scrollTop = commentsContainer.scrollHeight;
}

async function addComment() {
    if (!currentSessionForComments || !currentUser) return;
    
    const commentText = newCommentTextarea.value.trim();
    if (!commentText) return;
    
    const comment = {
        session_id: currentSessionForComments,
        user_name: currentUser,
        comment: commentText,
        created_at: new Date().toISOString()
    };
    
    try {
        // Save to Supabase
        const { data, error } = await supabaseClient
            .from('session_comments')
            .insert([comment])
            .select()
            .single();
        
        if (!error && data) {
            // Add to local data
            if (!appData.comments[currentSessionForComments]) {
                appData.comments[currentSessionForComments] = [];
            }
            appData.comments[currentSessionForComments].push(data);
            
            // Clear textarea
            newCommentTextarea.value = '';
            
            // Re-render comments
            renderComments(currentSessionForComments);
            
            // Update session cards to show comment indicator
            renderUpcomingSessions();
            
            // Send notification to other players
            notifyPlayersAboutComment(currentSessionForComments, commentText);
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Σφάλμα κατά την προσθήκη σχολίου');
    }
}

function notifyPlayersAboutComment(sessionId, commentText) {
    const session = appData.sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    // In a real app, you would send push notifications to other players
    // For now, we'll just show a local notification if the user has permission
    if (notificationPermission) {
        showNotification(
            'Νέο σχόλιο στο παιχνίδι!',
            `${currentUser}: ${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}`,
            {
                tag: `comment-${sessionId}`,
                data: { sessionId: sessionId }
            }
        );
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Τώρα';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} λεπτά πριν`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ώρες πριν`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} μέρες πριν`;
    
    return date.toLocaleDateString('el-GR');
}

function getSessionCommentsCount(sessionId) {
    return appData.comments[sessionId] ? appData.comments[sessionId].length : 0;
}

// ==================== DAILY NOTIFICATION CHECK ====================

function startDailyNotificationCheck() {
    if (!notificationPermission || !currentUser) return;
    
    // Check immediately on load
    checkTodayAndTomorrowGames();
    
    // Set up daily check at 8 AM and 8 PM
    const now = new Date();
    
    // Schedule 8 AM check
    const nextMorning = new Date();
    nextMorning.setHours(8, 0, 0, 0);
    if (nextMorning <= now) {
        nextMorning.setDate(nextMorning.getDate() + 1);
    }
    
    const timeUntilMorning = nextMorning.getTime() - now.getTime();
    setTimeout(() => {
        checkTodayAndTomorrowGames();
        // Set up recurring daily check
        setInterval(checkTodayAndTomorrowGames, 24 * 60 * 60 * 1000); // Every 24 hours
    }, timeUntilMorning);
    
    // Schedule 8 PM check for tomorrow's games
    const nextEvening = new Date();
    nextEvening.setHours(20, 0, 0, 0);
    if (nextEvening <= now) {
        nextEvening.setDate(nextEvening.getDate() + 1);
    }
    
    const timeUntilEvening = nextEvening.getTime() - now.getTime();
    setTimeout(() => {
        checkTomorrowGames();
        // Set up recurring evening check
        setInterval(checkTomorrowGames, 24 * 60 * 60 * 1000); // Every 24 hours
    }, timeUntilEvening);
}

function checkTodayAndTomorrowGames() {
    if (!currentUser || !notificationPermission) return;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Check today's games
    const todayGames = appData.sessions.filter(session => 
        session.date === todayStr && 
        session.players.includes(currentUser)
    );
    
    todayGames.forEach(session => {
        const gameDateTime = new Date(`${session.date}T${session.time}`);
        const now = new Date();
        
        // Only notify if game is still upcoming
        if (gameDateTime > now) {
            const venue = appData.venues.find(v => v.id === (session.venue_id || session.venueId));
            showNotification(
                'Σήμερα έχεις παιχνίδι Padel! 🎾',
                `Στις ${session.time} στο ${venue ? venue.name : 'γήπεδο'}`,
                {
                    tag: `today-game-${session.id}`,
                    requireInteraction: true
                }
            );
        }
    });
}

function checkTomorrowGames() {
    if (!currentUser || !notificationPermission) return;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Check tomorrow's games
    const tomorrowGames = appData.sessions.filter(session => 
        session.date === tomorrowStr && 
        session.players.includes(currentUser)
    );
    
    tomorrowGames.forEach(session => {
        const venue = appData.venues.find(v => v.id === (session.venue_id || session.venueId));
        showNotification(
            'Αύριο έχεις παιχνίδι Padel! 🎾',
            `Στις ${session.time} στο ${venue ? venue.name : 'γήπεδο'}. Μην το ξεχάσεις!`,
            {
                tag: `tomorrow-game-${session.id}`,
                requireInteraction: true
            }
        );
    });
}

// Schedule reminders for all existing sessions when app loads
function scheduleAllExistingReminders() {
    if (!currentUser || !notificationPermission) return;
    
    const now = new Date();
    
    appData.sessions.forEach(session => {
        const gameDateTime = new Date(`${session.date}T${session.time}`);
        
        // Only schedule reminders for future games where current user is playing
        if (gameDateTime > now && session.players.includes(currentUser)) {
            scheduleGameReminder(session);
        }
    });
}

// ==================== WEATHER FUNCTIONALITY ====================

let weatherData = null;
let weatherUpdateInterval = null;

async function initializeWeather() {
    await loadWeatherData();
    
    // Update weather every 30 minutes
    weatherUpdateInterval = setInterval(loadWeatherData, 30 * 60 * 1000);
}

async function loadWeatherData() {
    const weatherWidget = document.getElementById('weatherWidget');
    
    try {
        // Show loading state
        weatherWidget.innerHTML = `
            <div class="weather-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Φόρτωση καιρού...</span>
            </div>
        `;

        // Fetch real weather data from WeatherAPI.com
        const weatherResponse = await fetchWeatherData();
        
        weatherData = weatherResponse;
        renderWeatherWidget(weatherResponse);
        
        // Check for weather alerts
        checkWeatherAlerts(weatherResponse);
        
        // Re-render calendar to show weather icons
        if (currentUser) {
            renderCalendar();
        }
        
    } catch (error) {
        console.error('Weather loading failed:', error);
        
        // Fallback to mock data if API fails
        try {
            const mockWeatherData = await getMockWeatherData();
            weatherData = mockWeatherData;
            renderWeatherWidget(mockWeatherData);
            
            // Re-render calendar to show weather icons
            if (currentUser) {
                renderCalendar();
            }
        } catch (mockError) {
            weatherWidget.innerHTML = `
                <div class="weather-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    Δεν ήταν δυνατή η φόρτωση του καιρού
                </div>
            `;
        }
    }
}

async function fetchWeatherData() {
    // Fetch current weather and 3-day forecast from WeatherAPI.com
    const currentUrl = `${WEATHER_API_URL}/current.json?key=${WEATHER_API_KEY}&q=${WEATHER_LOCATION}&aqi=no`;
    const forecastUrl = `${WEATHER_API_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${WEATHER_LOCATION}&days=3&aqi=no&alerts=yes`;
    
    try {
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(currentUrl),
            fetch(forecastUrl)
        ]);
        
        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('Weather API request failed');
        }
        
        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        
        // Debug logging
        console.log('Weather API Response:', { currentData, forecastData });
        console.log('Alerts data:', forecastData.alerts, 'Type:', typeof forecastData.alerts);
        
        // Transform API response to our format
        const current = currentData.current || {};
        const location = currentData.location || {};
        const forecastDays = forecastData.forecast?.forecastday || [];
        
        // Store daily forecast data for calendar integration
        weatherForecastData = {};
        forecastDays.forEach((day, index) => {
            const date = new Date(day.date);
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            weatherForecastData[dateStr] = {
                date: dateStr,
                maxTemp: Math.round(day.day?.maxtemp_c || 25),
                minTemp: Math.round(day.day?.mintemp_c || 15),
                condition: day.day?.condition?.text || 'Clear',
                icon: getWeatherEmoji(day.day?.condition?.code || 1000, 1), // Use day icon
                code: day.day?.condition?.code || 1000,
                chanceOfRain: day.day?.daily_chance_of_rain || 0,
                avgHumidity: day.day?.avghumidity || 50,
                maxWind: Math.round(day.day?.maxwind_kph || 10)
            };
        });
        
        console.log('Daily forecast data stored:', weatherForecastData);
        
        return {
            current: {
                temp: Math.round(current.temp_c || 20),
                condition: (current.condition?.text || 'Clear').toLowerCase(),
                description: current.condition?.text || 'Clear',
                icon: getWeatherEmoji(current.condition?.code || 1000, current.is_day || 1),
                humidity: current.humidity || 50,
                windSpeed: Math.round(current.wind_kph || 0),
                windDirection: current.wind_dir || 'N',
                feelsLike: Math.round(current.feelslike_c || current.temp_c || 20),
                uv: current.uv || 0,
                visibility: current.vis_km || 10
            },
            forecast: generateHourlyForecast(forecastDays[0]?.hour || []),
            dailyForecast: weatherForecastData,
            alerts: (forecastData.alerts && Array.isArray(forecastData.alerts)) ? 
                forecastData.alerts.map(alert => alert.headline || alert.event || 'Weather Alert') : [],
            location: {
                name: location.name || 'Nicosia',
                country: location.country || 'Cyprus',
                localtime: location.localtime || new Date().toISOString()
            }
        };
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

function getWeatherEmoji(code, isDay) {
    // WeatherAPI.com condition codes to emoji mapping
    const weatherEmojis = {
        1000: isDay ? '☀️' : '🌙', // Clear/Sunny
        1003: '🌤️', // Partly cloudy
        1006: '☁️', // Cloudy
        1009: '☁️', // Overcast
        1030: '🌫️', // Mist
        1063: '🌦️', // Patchy rain possible
        1066: '🌨️', // Patchy snow possible
        1069: '🌨️', // Patchy sleet possible
        1072: '🌨️', // Patchy freezing drizzle possible
        1087: '⛈️', // Thundery outbreaks possible
        1114: '❄️', // Blowing snow
        1117: '❄️', // Blizzard
        1135: '🌫️', // Fog
        1147: '🌫️', // Freezing fog
        1150: '🌦️', // Patchy light drizzle
        1153: '🌦️', // Light drizzle
        1168: '🌨️', // Freezing drizzle
        1171: '🌨️', // Heavy freezing drizzle
        1180: '🌦️', // Patchy light rain
        1183: '🌧️', // Light rain
        1186: '🌦️', // Moderate rain at times
        1189: '🌧️', // Moderate rain
        1192: '🌧️', // Heavy rain at times
        1195: '🌧️', // Heavy rain
        1198: '🌨️', // Light freezing rain
        1201: '🌨️', // Moderate or heavy freezing rain
        1204: '🌨️', // Light sleet
        1207: '🌨️', // Moderate or heavy sleet
        1210: '🌨️', // Patchy light snow
        1213: '❄️', // Light snow
        1216: '🌨️', // Patchy moderate snow
        1219: '❄️', // Moderate snow
        1222: '🌨️', // Patchy heavy snow
        1225: '❄️', // Heavy snow
        1237: '🌨️', // Ice pellets
        1240: '🌦️', // Light rain shower
        1243: '🌧️', // Moderate or heavy rain shower
        1246: '🌧️', // Torrential rain shower
        1249: '🌨️', // Light sleet showers
        1252: '🌨️', // Moderate or heavy sleet showers
        1255: '🌨️', // Light snow showers
        1258: '❄️', // Moderate or heavy snow showers
        1261: '🌨️', // Light showers of ice pellets
        1264: '🌨️', // Moderate or heavy showers of ice pellets
        1273: '⛈️', // Patchy light rain with thunder
        1276: '⛈️', // Moderate or heavy rain with thunder
        1279: '⛈️', // Patchy light snow with thunder
        1282: '⛈️'  // Moderate or heavy snow with thunder
    };
    
    return weatherEmojis[code] || (isDay ? '☀️' : '🌙');
}

function generateHourlyForecast(hourlyData) {
    if (!hourlyData || !Array.isArray(hourlyData)) {
        return [];
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    const forecast = [];
    
    // Get next 5 periods (every 3 hours)
    for (let i = 1; i <= 5; i++) {
        const targetHour = (currentHour + i * 3) % 24;
        const hourData = hourlyData.find(h => {
            try {
                return new Date(h.time).getHours() === targetHour;
            } catch (e) {
                return false;
            }
        });
        
        if (hourData && hourData.temp_c !== undefined) {
            forecast.push({
                time: `${targetHour.toString().padStart(2, '0')}:00`,
                temp: Math.round(hourData.temp_c),
                icon: getWeatherEmoji(hourData.condition?.code || 1000, hourData.is_day || 1)
            });
        }
    }
    
    // If we don't have enough forecast data, fill with current conditions
    while (forecast.length < 3) {
        const hour = (currentHour + forecast.length + 1) % 24;
        forecast.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            temp: '?',
            icon: '🌤️'
        });
    }
    
    return forecast;
}

async function getMockWeatherData() {
    // Mock weather data for Nicosia, Cyprus
    // In production, replace with real API call
    const currentHour = new Date().getHours();
    const isDay = currentHour >= 6 && currentHour < 20;
    
    const conditions = [
        { condition: 'clear', icon: isDay ? '☀️' : '🌙', temp: 24, desc: 'Αίθριος' },
        { condition: 'clouds', icon: '⛅', temp: 22, desc: 'Συννεφιά' },
        { condition: 'rain', icon: '🌧️', temp: 18, desc: 'Βροχή' },
        { condition: 'sun', icon: '☀️', temp: 26, desc: 'Ηλιοφάνεια' }
    ];
    
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    // Generate 3-day mock forecast for calendar
    weatherForecastData = {};
    const today = new Date();
    
    for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayCondition = conditions[Math.floor(Math.random() * conditions.length)];
        const baseTemp = 20 + Math.floor(Math.random() * 10);
        
        weatherForecastData[dateStr] = {
            date: dateStr,
            maxTemp: baseTemp + Math.floor(Math.random() * 8),
            minTemp: baseTemp - Math.floor(Math.random() * 5),
            condition: dayCondition.desc,
            icon: dayCondition.icon,
            code: 1000,
            chanceOfRain: Math.floor(Math.random() * 100),
            avgHumidity: 45 + Math.floor(Math.random() * 30),
            maxWind: Math.floor(Math.random() * 20) + 5
        };
    }
    
    console.log('Mock daily forecast data stored:', weatherForecastData);
    
    return {
        current: {
            temp: randomCondition.temp + Math.floor(Math.random() * 6) - 3, // ±3°C variation
            condition: randomCondition.condition,
            description: randomCondition.desc,
            icon: randomCondition.icon,
            humidity: 45 + Math.floor(Math.random() * 30),
            windSpeed: Math.floor(Math.random() * 15) + 5,
            windDirection: ['Β', 'ΒΑ', 'Α', 'ΝΑ', 'Ν', 'ΝΔ', 'Δ', 'ΒΔ'][Math.floor(Math.random() * 8)]
        },
        forecast: generateMockForecast(),
        dailyForecast: weatherForecastData,
        alerts: Math.random() > 0.8 ? ['Ισχυροί άνεμοι αναμένονται το απόγευμα'] : []
    };
}

function generateMockForecast() {
    const forecast = [];
    const baseTemp = 20 + Math.floor(Math.random() * 10);
    
    for (let i = 1; i <= 5; i++) {
        const hour = (new Date().getHours() + i * 3) % 24;
        const temp = baseTemp + Math.floor(Math.random() * 8) - 4;
        const conditions = ['☀️', '⛅', '🌤️', '🌧️'];
        
        forecast.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            temp: temp,
            icon: conditions[Math.floor(Math.random() * conditions.length)]
        });
    }
    
    return forecast;
}

function renderWeatherWidget(data) {
    const weatherWidget = document.getElementById('weatherWidget');
    
    const alertsHtml = data.alerts.length > 0 ? `
        <div class="weather-alerts">
            <div class="alert-title">⚠️ Προειδοποιήσεις:</div>
            ${data.alerts.map(alert => `<div>${alert}</div>`).join('')}
        </div>
    ` : '';
    
    const locationName = data.location ? data.location.name : 'Λευκωσία';
    
    weatherWidget.innerHTML = `
        <div class="weather-content">
            <div class="weather-main">
                <div class="weather-icon">${data.current.icon}</div>
                <div class="weather-temp">${data.current.temp}°</div>
            </div>
            <div class="weather-details">
                <div class="weather-location">📍 ${locationName}</div>
                <div class="weather-description">${data.current.description}</div>
                <div class="weather-extra">
                    💧${data.current.humidity}% • 💨${data.current.windSpeed}km/h
                </div>
            </div>
        </div>
        ${data.forecast.length > 0 ? `
        <div class="weather-forecast">
            ${data.forecast.slice(0, 4).map(item => `
                <div class="forecast-item">
                    <div class="forecast-time">${item.time}</div>
                    <div class="forecast-icon">${item.icon}</div>
                    <div class="forecast-temp">${item.temp}°</div>
                </div>
            `).join('')}
        </div>
        ` : ''}
        ${alertsHtml}
    `;
}

function checkWeatherAlerts(data) {
    // Check for weather conditions that might affect padel games
    const temp = data.current.temp;
    const condition = data.current.condition.toLowerCase();
    const windSpeed = data.current.windSpeed;
    const uv = data.current.uv || 0;
    
    let alerts = [];
    
    // Temperature alerts
    if (temp > 35) {
        alerts.push('🌡️ Υψηλές θερμοκρασίες - Προσοχή στην ενυδάτωση!');
    }
    
    if (temp < 10) {
        alerts.push('🥶 Χαμηλές θερμοκρασίες - Ντυθείτε ζεστά!');
    }
    
    // Weather condition alerts
    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('shower')) {
        alerts.push('🌧️ Βροχή - Ελέγξτε αν τα γήπεδα είναι στεγασμένα!');
    }
    
    if (condition.includes('thunder') || condition.includes('storm')) {
        alerts.push('⛈️ Καταιγίδα - Αποφύγετε το παιχνίδι σε εξωτερικά γήπεδα!');
    }
    
    if (condition.includes('snow') || condition.includes('blizzard')) {
        alerts.push('❄️ Χιόνι - Τα γήπεδα μπορεί να είναι κλειστά!');
    }
    
    if (condition.includes('fog') || condition.includes('mist')) {
        alerts.push('🌫️ Ομίχλη - Μειωμένη ορατότητα, προσοχή!');
    }
    
    // Wind alerts
    if (windSpeed > 25) {
        alerts.push('💨 Ισχυροί άνεμοι - Μπορεί να επηρεάσουν το παιχνίδι!');
    }
    
    // UV alerts
    if (uv > 8) {
        alerts.push('☀️ Υψηλή UV ακτινοβολία - Χρησιμοποιήστε αντηλιακό!');
    }
    
    // Show weather-based notifications (only for severe conditions)
    if (alerts.length > 0 && notificationPermission && (temp > 38 || temp < 5 || windSpeed > 30 || condition.includes('thunder'))) {
        alerts.forEach(alert => {
            showNotification('Καιρικές Συνθήκες', alert, {
                tag: 'weather-alert',
                icon: (window.location.pathname.includes('/padel-pros/') ? '/padel-pros' : '') + '/images/logo.jpg'
            });
        });
    }
}

function getWeatherAdvice() {
    if (!weatherData) return '';
    
    const temp = weatherData.current.temp;
    const condition = weatherData.current.condition;
    
    if (condition === 'rain') {
        return '🌧️ Βρέχει - Καλύτερα να παίξετε σε στεγασμένο γήπεδο!';
    }
    
    if (temp > 30) {
        return '🌡️ Ζέστη - Φέρτε πολύ νερό και παίξτε νωρίς το πρωί ή αργά το απόγευμα!';
    }
    
    if (temp < 15) {
        return '🧥 Κρύο - Ντυθείτε ζεστά και κάντε καλό προθέρμανση!';
    }
    
    if (weatherData.current.windSpeed > 20) {
        return '💨 Άνεμος - Προσαρμόστε το παιχνίδι σας στις συνθήκες!';
    }
    
    return '✅ Ιδανικές συνθήκες για padel!';
}

// Get weather forecast for a specific date (YYYY-MM-DD format)
function getWeatherForDate(dateStr) {
    return weatherForecastData[dateStr] || null;
}

// Check if a date has weather forecast available (today + 2 days)
function hasWeatherForecast(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Weather available for today (0), tomorrow (1), and day after (2)
    return diffDays >= 0 && diffDays <= 2;
} 