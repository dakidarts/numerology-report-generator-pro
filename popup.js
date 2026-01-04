// ==================== NUMEROLOGY REPORT GENERATOR PRO ====================

// API Configuration
const API_BASE = 'https://the-numerology-api.p.rapidapi.com';
const API_HOST = 'the-numerology-api.p.rapidapi.com';

// State Management
let currentTab = 'generate';
let profiles = [];
let history = [];
let settings = {
    apiKey: '',
    practitionerName: '',
    practitionerEmail: '',
    practitionerWebsite: '',
    autoSaveReports: true,
    showNotifications: true,
    darkMode: false,
    language: 'en'
};

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadSettings();
    await loadProfiles();
    await loadHistory();
    await loadTemplates();
    
    // Initialize i18n
    i18n.init(settings.language || 'en');
    i18n.updateUI();
    
    applyTheme();
    setupEventListeners();
    updateAnalytics();
    checkApiKey();
    setCurrentYear();
    renderTemplates();
    updateTemplateSelect();
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Theme Toggle
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

    // Settings Modal
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeSettingsBtn').addEventListener('click', closeSettings);
    document.getElementById('saveApiKeyBtn').addEventListener('click', saveApiKey);
    document.getElementById('savePersonalInfoBtn').addEventListener('click', savePersonalInfo);
    document.getElementById('savePreferencesBtn').addEventListener('click', savePreferences);

    // Client Mode Toggle
    document.querySelectorAll('input[name="clientMode"]').forEach(radio => {
        radio.addEventListener('change', toggleClientMode);
    });

    // Profile Modal
    document.getElementById('addProfileBtn').addEventListener('click', () => openProfileModal());
    document.getElementById('closeProfileBtn').addEventListener('click', closeProfileModal);
    document.getElementById('cancelProfileBtn').addEventListener('click', closeProfileModal);
    document.getElementById('profileForm').addEventListener('submit', saveProfile);

    // Profile Search
    document.getElementById('profileSearch').addEventListener('input', filterProfiles);

    // Template Management
    document.getElementById('addTemplateBtn').addEventListener('click', () => openTemplateModal());
    document.getElementById('closeTemplateBtn').addEventListener('click', closeTemplateModal);
    document.getElementById('cancelTemplateBtn').addEventListener('click', closeTemplateModal);
    document.getElementById('templateForm').addEventListener('submit', saveTemplate);
    document.getElementById('reportType').addEventListener('change', updateTemplateSelect);

    // Generate Report
    document.getElementById('generateReportBtn').addEventListener('click', generateReport);

    // History Actions
    document.getElementById('exportHistoryBtn').addEventListener('click', exportHistory);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

    // Collapsible Sections
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => toggleCollapsible(header));
    });

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    document.getElementById('currentYear').textContent = new Date().getFullYear();

}

// ==================== STORAGE FUNCTIONS ====================

async function loadSettings() {
    try {
        const stored = localStorage.getItem('numerology_settings');
        if (stored) {
            settings = { ...settings, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveSettings() {
    try {
        localStorage.setItem('numerology_settings', JSON.stringify(settings));
        showMessage('Settings saved successfully', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showMessage('Failed to save settings', 'error');
    }
}

async function loadProfiles() {
    try {
        const stored = localStorage.getItem('numerology_profiles');
        profiles = stored ? JSON.parse(stored) : [];
        renderProfiles();
        updateProfileSelect();
    } catch (error) {
        console.error('Error loading profiles:', error);
    }
}

async function saveProfilesToStorage() {
    try {
        localStorage.setItem('numerology_profiles', JSON.stringify(profiles));
    } catch (error) {
        console.error('Error saving profiles:', error);
    }
}

async function loadHistory() {
    try {
        const stored = localStorage.getItem('numerology_history');
        history = stored ? JSON.parse(stored) : [];
        renderHistory();
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

async function saveHistoryToStorage() {
    try {
        localStorage.setItem('numerology_history', JSON.stringify(history));
    } catch (error) {
        console.error('Error saving history:', error);
    }
}

// ==================== TAB NAVIGATION ====================

function switchTab(tabName) {
    currentTab = tabName;
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}Tab`);
    });

    if (tabName === 'profiles') renderProfiles();
    if (tabName === 'designer') renderTemplates();
    if (tabName === 'history') renderHistory();
    if (tabName === 'analytics') updateAnalytics();
}

// ==================== THEME MANAGEMENT ====================

function toggleTheme() {
    settings.darkMode = !settings.darkMode;
    applyTheme();
    saveSettings();
}

function applyTheme() {
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggleBtn').innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('themeToggleBtn').innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// ==================== SETTINGS MODAL ====================

function openSettings() {
    document.getElementById('apiKeyInput').value = settings.apiKey || '';
    document.getElementById('practitionerName').value = settings.practitionerName || '';
    document.getElementById('practitionerEmail').value = settings.practitionerEmail || '';
    document.getElementById('practitionerWebsite').value = settings.practitionerWebsite || '';
    document.getElementById('languageSelect').value = settings.language || 'en';
    document.getElementById('autoSaveReports').checked = settings.autoSaveReports;
    document.getElementById('showNotifications').checked = settings.showNotifications;
    
    document.getElementById('settingsModal').classList.add('active');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

async function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    
    if (!apiKey) {
        showMessage('Please enter an API key', 'error');
        return;
    }

    settings.apiKey = apiKey;
    await saveSettings();
    checkApiKey();
}

async function savePersonalInfo() {
    settings.practitionerName = document.getElementById('practitionerName').value.trim();
    settings.practitionerEmail = document.getElementById('practitionerEmail').value.trim();
    settings.practitionerWebsite = document.getElementById('practitionerWebsite').value.trim();
    await saveSettings();
}

async function savePreferences() {
    const newLanguage = document.getElementById('languageSelect').value;
    const languageChanged = newLanguage !== settings.language;
    
    settings.language = newLanguage;
    settings.autoSaveReports = document.getElementById('autoSaveReports').checked;
    settings.showNotifications = document.getElementById('showNotifications').checked;
    await saveSettings();
    
    if (languageChanged) {
        i18n.setLanguage(newLanguage);
    }
}

function checkApiKey() {
    if (!settings.apiKey) {
        showMessage('Please configure your API key to start generating reports', 'info');
    }
}

// ==================== CLIENT MODE TOGGLE ====================

function toggleClientMode() {
    const mode = document.querySelector('input[name="clientMode"]:checked').value;
    
    if (mode === 'existing') {
        document.getElementById('existingProfileMode').style.display = 'block';
        document.getElementById('quickEntryMode').style.display = 'none';
    } else {
        document.getElementById('existingProfileMode').style.display = 'none';
        document.getElementById('quickEntryMode').style.display = 'block';
    }
}

// ==================== PROFILE MANAGEMENT ====================

function openProfileModal(profileId = null) {
    const modal = document.getElementById('profileModal');
    const form = document.getElementById('profileForm');
    form.reset();
    
    if (profileId) {
        const profile = profiles.find(p => p.id === profileId);
        if (profile) {
            document.getElementById('profileModalTitle').innerHTML = '<i class="fas fa-user-edit"></i> ' + i18n.t('edit_client_profile');
            document.getElementById('profileId').value = profile.id;
            document.getElementById('profileFirstName').value = profile.firstName || '';
            document.getElementById('profileMiddleName').value = profile.middleName || '';
            document.getElementById('profileLastName').value = profile.lastName || '';
            document.getElementById('profileShortName').value = profile.shortName || '';
            document.getElementById('profileDob').value = profile.dob;
            document.getElementById('profileBirthPlace').value = profile.birthPlace || '';
            document.getElementById('profileCity').value = profile.city || '';
            document.getElementById('profileCountry').value = profile.country || '';
            document.getElementById('profileTimezone').value = profile.timezone || '';
            document.getElementById('profileEmail').value = profile.email || '';
            document.getElementById('profilePhone').value = profile.phone || '';
            document.getElementById('profileNotes').value = profile.notes || '';
        }
    } else {
        document.getElementById('profileModalTitle').innerHTML = '<i class="fas fa-user-plus"></i> ' + i18n.t('add_client_profile');
        document.getElementById('profileId').value = '';
    }
    
    modal.classList.add('active');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('active');
}

async function saveProfile(e) {
    e.preventDefault();
    
    const profileId = document.getElementById('profileId').value;
    const firstName = document.getElementById('profileFirstName').value.trim();
    const lastName = document.getElementById('profileLastName').value.trim();
    
    if (!firstName || !lastName) {
        showMessage('First name and last name are required', 'error');
        return;
    }
    
    const profileData = {
        firstName,
        middleName: document.getElementById('profileMiddleName').value.trim(),
        lastName,
        shortName: document.getElementById('profileShortName').value.trim(),
        dob: document.getElementById('profileDob').value,
        birthPlace: document.getElementById('profileBirthPlace').value.trim(),
        city: document.getElementById('profileCity').value.trim(),
        country: document.getElementById('profileCountry').value.trim(),
        timezone: document.getElementById('profileTimezone').value,
        email: document.getElementById('profileEmail').value.trim(),
        phone: document.getElementById('profilePhone').value.trim(),
        notes: document.getElementById('profileNotes').value.trim(),
        // Computed full name for display
        name: `${firstName} ${document.getElementById('profileMiddleName').value.trim() ? document.getElementById('profileMiddleName').value.trim() + ' ' : ''}${lastName}`
    };

    if (profileId) {
        // Edit existing
        const index = profiles.findIndex(p => p.id === profileId);
        if (index !== -1) {
            profiles[index] = { ...profiles[index], ...profileData };
            showMessage('Profile updated successfully', 'success');
        }
    } else {
        // Add new
        const newProfile = {
            id: Date.now().toString(),
            ...profileData,
            createdAt: new Date().toISOString(),
            reportsGenerated: 0
        };
        profiles.push(newProfile);
        showMessage('Profile created successfully', 'success');
    }

    await saveProfilesToStorage();
    renderProfiles();
    updateProfileSelect();
    closeProfileModal();
}

async function deleteProfile(profileId) {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    profiles = profiles.filter(p => p.id !== profileId);
    await saveProfilesToStorage();
    renderProfiles();
    updateProfileSelect();
    showMessage('Profile deleted', 'success');
}

function renderProfiles() {
    const container = document.getElementById('profilesList');
    
    if (profiles.length === 0) {
        container.textContent = '';
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.innerHTML = '<i class="fas fa-user-friends"></i><p>' + i18n.t('no_profiles') + '</p><small>' + i18n.t('no_profiles_sub') + '</small>';
        container.appendChild(emptyDiv);
        return;
    }

    container.textContent = '';
    profiles.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        
        const header = document.createElement('div');
        header.className = 'profile-card-header';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'profile-name';
        nameDiv.textContent = profile.name;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'profile-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'icon-btn';
        editBtn.title = 'Edit';
        editBtn.onclick = () => openProfileModal(profile.id);
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'icon-btn';
        deleteBtn.title = 'Delete';
        deleteBtn.onclick = () => deleteProfile(profile.id);
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        
        header.appendChild(nameDiv);
        header.appendChild(actionsDiv);
        
        const details = document.createElement('div');
        details.className = 'profile-details';
        
        const dobDiv = document.createElement('div');
        dobDiv.innerHTML = '<i class="fas fa-birthday-cake"></i>';
        dobDiv.appendChild(document.createTextNode(' ' + formatDate(profile.dob)));
        details.appendChild(dobDiv);
        
        if (profile.email) {
            const emailDiv = document.createElement('div');
            emailDiv.innerHTML = '<i class="fas fa-envelope"></i>';
            emailDiv.appendChild(document.createTextNode(' ' + profile.email));
            details.appendChild(emailDiv);
        }
        
        if (profile.phone) {
            const phoneDiv = document.createElement('div');
            phoneDiv.innerHTML = '<i class="fas fa-phone"></i>';
            phoneDiv.appendChild(document.createTextNode(' ' + profile.phone));
            details.appendChild(phoneDiv);
        }
        
        const reportsDiv = document.createElement('div');
        reportsDiv.innerHTML = '<i class="fas fa-file-pdf"></i>';
        reportsDiv.appendChild(document.createTextNode(' ' + (profile.reportsGenerated || 0) + ' ' + i18n.t('reports_generated')));
        details.appendChild(reportsDiv);
        
        card.appendChild(header);
        card.appendChild(details);
        container.appendChild(card);
    });
}

function updateProfileSelect() {
    const select = document.getElementById('profileSelect');
    select.textContent = '';
    
    if (profiles.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = i18n.t('select_profile_placeholder');
        select.appendChild(option);
        return;
    }

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = i18n.t('select_profile_choose');
    select.appendChild(defaultOption);
    
    profiles.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.name} (${formatDate(p.dob)})`;
        select.appendChild(option);
    });
}

function filterProfiles() {
    const searchTerm = document.getElementById('profileSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.profile-card');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

// ==================== REPORT GENERATION ====================

async function generateReport() {
    if (!settings.apiKey) {
        showMessage('Please configure your API key first', 'error');
        openSettings();
        return;
    }

    const reportType = document.getElementById('reportType').value;
    const clientMode = document.querySelector('input[name="clientMode"]:checked').value;
    
    let clientData;
    
    if (clientMode === 'existing') {
        const profileId = document.getElementById('profileSelect').value;
        if (!profileId) {
            showMessage('Please select a client profile', 'error');
            return;
        }
        const profile = profiles.find(p => p.id === profileId);
        if (!profile) {
            showMessage('Profile not found', 'error');
            return;
        }
        clientData = {
            id: profile.id,
            name: profile.name,
            dob: profile.dob,
            email: profile.email
        };
    } else {
        const firstName = document.getElementById('quickFirstName').value.trim();
        const lastName = document.getElementById('quickLastName').value.trim();
        const dob = document.getElementById('quickDob').value;
        
        if (!firstName || !lastName || !dob) {
            showMessage('Please enter client first name, last name and date of birth', 'error');
            return;
        }
        
        clientData = {
            id: null,
            firstName: document.getElementById('quickFirstName').value.trim(),
            lastName: document.getElementById('quickLastName').value.trim(),
            name: `${document.getElementById('quickFirstName').value.trim()} ${document.getElementById('quickLastName').value.trim()}`,
            dob: document.getElementById('quickDob').value,
            birthPlace: document.getElementById('quickBirthPlace').value.trim(),
            email: document.getElementById('quickEmail').value.trim()
        };
    }

    const targetYear = parseInt(document.getElementById('targetYear').value);
    const customization = {
        title: document.getElementById('reportTitle').value.trim()
    };

    try {
        showLoading(true, 'Connecting to Numerology API...');
        
        if (reportType === 'personal-cycle') {
            await generatePersonalCycleReport(clientData, targetYear, customization);
        }
        
    } catch (error) {
        console.error('Report generation error:', error);
        showMessage('Failed to generate report: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function generatePersonalCycleReport(clientData, targetYear, customization) {
    // Update progress
    updateProgress(20, 'Fetching personal cycle data...');
    
    // Fetch data from API
    const apiData = await fetchPersonalCycleData(clientData.dob, targetYear);
    
    updateProgress(50, 'Processing numerology calculations...');
    
    // Get selected template
    const templateId = document.getElementById('templateSelect').value;
    const template = templateId ? getTemplateById(templateId) : null;
    
    // Generate PDF
    const pdfData = await createPersonalCyclePDF(apiData, clientData, targetYear, customization, template);
    
    updateProgress(90, 'Finalizing report...');
    
    // Save to history
    if (settings.autoSaveReports) {
        await saveToHistory({
            type: 'personal-cycle',
            clientName: clientData.name,
            clientDob: clientData.dob,
            targetYear,
            generatedAt: new Date().toISOString(),
            profileId: clientData.id
        });
        
        // Update profile report count
        if (clientData.id) {
            const profile = profiles.find(p => p.id === clientData.id);
            if (profile) {
                profile.reportsGenerated = (profile.reportsGenerated || 0) + 1;
                await saveProfilesToStorage();
            }
        }
    }
    
    updateProgress(100, 'Complete!');
    
    // Download PDF
    downloadPDF(pdfData, `Numerology_Report_${clientData.name}_${targetYear}.pdf`);
    
    showMessage('Report generated successfully!', 'success');
    
    if (settings.showNotifications) {
        showNotification('Report Ready', `Personal Cycle Report for ${clientData.name} has been generated.`);
    }
}

async function fetchPersonalCycleData(dob, targetYear) {
    const url = `${API_BASE}/personal-cycle-report?dob=${dob}&target_year=${targetYear}`;
    
    console.log('API Request URL:', url);
    console.log('API Key (first 10 chars):', settings.apiKey.substring(0, 10) + '...');
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': settings.apiKey,
            'X-RapidAPI-Host': API_HOST,
            'Content-Type': 'application/json'
        }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
}

// ==================== PDF GENERATION ====================

function downloadPDF(doc, filename) {
    doc.save(filename);
}

// ==================== HISTORY MANAGEMENT ====================

async function saveToHistory(entry) {
    history.unshift(entry);
    if (history.length > 100) history.splice(100);
    await saveHistoryToStorage();
    renderHistory();
}

function renderHistory() {
    const container = document.getElementById('historyList');
    
    if (history.length === 0) {
        container.textContent = '';
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.innerHTML = '<i class="fas fa-inbox"></i><p>' + i18n.t('no_history') + '</p>';
        container.appendChild(emptyDiv);
        return;
    }

    container.textContent = '';
    history.slice(0, 50).forEach(entry => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const header = document.createElement('div');
        header.className = 'history-header';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'history-title';
        titleDiv.textContent = entry.clientName;
        
        const dateDiv = document.createElement('div');
        dateDiv.className = 'history-date';
        dateDiv.textContent = formatDateTime(entry.generatedAt);
        
        header.appendChild(titleDiv);
        header.appendChild(dateDiv);
        
        const meta = document.createElement('div');
        meta.className = 'history-meta';
        
        const badge = document.createElement('span');
        badge.className = 'badge info';
        badge.textContent = entry.type;
        
        const yearSpan = document.createElement('span');
        yearSpan.innerHTML = '<i class="fas fa-calendar-alt"></i>';
        yearSpan.appendChild(document.createTextNode(' Year ' + entry.targetYear));
        
        const dobSpan = document.createElement('span');
        dobSpan.innerHTML = '<i class="fas fa-birthday-cake"></i>';
        dobSpan.appendChild(document.createTextNode(' ' + formatDate(entry.clientDob)));
        
        meta.appendChild(badge);
        meta.appendChild(yearSpan);
        meta.appendChild(dobSpan);
        
        item.appendChild(header);
        item.appendChild(meta);
        container.appendChild(item);
    });
}

async function exportHistory() {
    if (history.length === 0) {
        showMessage('No history to export', 'error');
        return;
    }

    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `numerology-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showMessage('History exported successfully', 'success');
}

async function clearHistory() {
    if (!confirm('Are you sure you want to clear all report history?')) return;

    history = [];
    await saveHistoryToStorage();
    renderHistory();
    updateAnalytics();
    showMessage('History cleared', 'success');
}

// ==================== ANALYTICS ====================

function updateAnalytics() {
    // Total Reports
    document.getElementById('totalReports').textContent = history.length;
    
    // Total Profiles
    document.getElementById('totalProfiles').textContent = profiles.length;
    
    // This Month Reports
    const now = new Date();
    const thisMonth = history.filter(h => {
        const date = new Date(h.generatedAt);
        return date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
    }).length;
    document.getElementById('thisMonthReports').textContent = thisMonth;
    
    // Most Used Report Type
    const typeCounts = {};
    history.forEach(h => {
        typeCounts[h.type] = (typeCounts[h.type] || 0) + 1;
    });
    const mostUsed = Object.keys(typeCounts).length > 0 ? 
        Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b) :
        'N/A';
    document.getElementById('mostUsedReport').textContent = 
        mostUsed === 'personal-cycle' ? 'Personal Cycle' : mostUsed;
    
    // Update chart if available
    updateChart();
}

function updateChart() {
    const canvas = document.getElementById('reportsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Get last 30 days data
    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
    });
    
    const counts = last30Days.map(date => {
        return history.filter(h => h.generatedAt.startsWith(date)).length;
    });
    
    // Clear previous chart
    if (window.myChart) {
        window.myChart.destroy();
    }
    
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last30Days.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
                label: 'Reports Generated',
                data: counts,
                borderColor: 'rgb(107, 70, 193)',
                backgroundColor: 'rgba(107, 70, 193, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ==================== UI HELPERS ====================

function showLoading(show, text = 'Processing...') {
    const container = document.getElementById('loadingContainer');
    const loadingText = document.getElementById('loadingText');
    const btn = document.getElementById('generateReportBtn');
    
    container.style.display = show ? 'block' : 'none';
    btn.disabled = show;
    
    if (show) {
        loadingText.textContent = text;
        updateProgress(10, text);
    } else {
        updateProgress(0, '');
    }
}

function updateProgress(percent, text) {
    const progressFill = document.getElementById('progressFill');
    const loadingText = document.getElementById('loadingText');
    
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (loadingText && text) loadingText.textContent = text;
}

function showMessage(text, type = 'info') {
    const container = document.getElementById('messageContainer');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' :
                 type === 'error' ? 'fa-exclamation-circle' :
                 type === 'warning' ? 'fa-exclamation-triangle' :
                 'fa-info-circle';
    
    const iconEl = document.createElement('i');
    iconEl.className = `fas ${icon}`;
    
    const textEl = document.createElement('span');
    textEl.textContent = text;
    
    message.appendChild(iconEl);
    message.appendChild(textEl);
    container.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 5000);
}

function showNotification(title, message) {
    if (typeof browser !== 'undefined' && browser.notifications) {
        browser.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: title,
            message: message
        });
    }
}

function toggleCollapsible(header) {
    header.classList.toggle('active');
    const content = header.nextElementSibling;
    content.classList.toggle('active');
}

// ==================== UTILITY FUNCTIONS ====================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function setCurrentYear() {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

// Make functions globally accessible for onclick handlers
window.openProfileModal = openProfileModal;
window.deleteProfile = deleteProfile;


// ==================== TEMPLATE MANAGEMENT ====================

function renderTemplates() {
    const container = document.getElementById('templatesList');
    
    if (!templates || templates.length === 0) {
        container.textContent = '';
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.innerHTML = '<i class="fas fa-paint-brush"></i><p>' + i18n.t('no_templates') + '</p>';
        container.appendChild(emptyDiv);
        return;
    }

    container.textContent = '';
    templates.forEach(template => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        
        const header = document.createElement('div');
        header.className = 'profile-card-header';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'profile-name';
        nameDiv.textContent = template.name + (template.isDefault ? ' (' + i18n.t('default_template') + ')' : '');
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'profile-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'icon-btn';
        editBtn.title = 'Edit';
        editBtn.onclick = () => openTemplateModal(template.id);
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        actionsDiv.appendChild(editBtn);
        
        if (!template.isDefault) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'icon-btn';
            deleteBtn.title = 'Delete';
            deleteBtn.onclick = () => deleteTemplateConfirm(template.id);
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            actionsDiv.appendChild(deleteBtn);
        }
        
        header.appendChild(nameDiv);
        header.appendChild(actionsDiv);
        
        const details = document.createElement('div');
        details.className = 'profile-details';
        
        const typeDiv = document.createElement('div');
        typeDiv.innerHTML = '<i class="fas fa-scroll"></i>';
        typeDiv.appendChild(document.createTextNode(' ' + template.reportType));
        details.appendChild(typeDiv);
        
        const fontDiv = document.createElement('div');
        fontDiv.innerHTML = '<i class="fas fa-font"></i>';
        fontDiv.appendChild(document.createTextNode(' ' + template.fontFamily));
        details.appendChild(fontDiv);
        
        const colorDiv = document.createElement('div');
        colorDiv.innerHTML = '<i class="fas fa-palette"></i>';
        colorDiv.appendChild(document.createTextNode(' ' + template.colors.primary));
        details.appendChild(colorDiv);
        
        card.appendChild(header);
        card.appendChild(details);
        container.appendChild(card);
    });
}

function updateTemplateSelect() {
    const reportType = document.getElementById('reportType').value;
    const select = document.getElementById('templateSelect');
    select.textContent = '';
    
    const reportTemplates = getTemplatesByReportType(reportType);
    
    if (reportTemplates.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = i18n.t('select_template_placeholder');
        select.appendChild(option);
        return;
    }

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = i18n.t('select_template_placeholder');
    select.appendChild(defaultOption);
    
    reportTemplates.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.name + (t.isDefault ? ' (' + i18n.t('default_template') + ')' : '');
        if (t.isDefault) option.selected = true;
        select.appendChild(option);
    });
}

function openTemplateModal(templateId = null) {
    const modal = document.getElementById('templateModal');
    const form = document.getElementById('templateForm');
    form.reset();
    
    if (templateId) {
        const template = getTemplateById(templateId);
        if (template) {
            document.getElementById('templateModalTitle').innerHTML = '<i class="fas fa-palette"></i> ' + i18n.t('edit_template');
            document.getElementById('templateId').value = template.id;
            document.getElementById('templateName').value = template.name;
            document.getElementById('templateReportType').value = template.reportType;
            document.getElementById('templateFontFamily').value = template.fontFamily;
            document.getElementById('templateBodyFontFamily').value = template.bodyFontFamily || template.fontFamily;
            document.getElementById('templatePrimaryColor').value = template.colors.primary;
            document.getElementById('templateSecondaryColor').value = template.colors.secondary;
            document.getElementById('templateAccentColor').value = template.colors.accent;
            document.getElementById('templateBackgroundColor').value = template.colors.background || '#FFFFFF';
            document.getElementById('templateTitleSize').value = template.fontSize.title;
            document.getElementById('templateBodySize').value = template.fontSize.body;
        }
    } else {
        document.getElementById('templateModalTitle').innerHTML = '<i class="fas fa-palette"></i> ' + i18n.t('create_template');
        document.getElementById('templateId').value = '';
    }
    
    modal.classList.add('active');
}

function closeTemplateModal() {
    document.getElementById('templateModal').classList.remove('active');
}

async function saveTemplate(e) {
    e.preventDefault();
    
    const templateId = document.getElementById('templateId').value;
    const templateData = {
        name: document.getElementById('templateName').value.trim(),
        reportType: document.getElementById('templateReportType').value,
        fontFamily: document.getElementById('templateFontFamily').value,
        bodyFontFamily: document.getElementById('templateBodyFontFamily').value,
        colors: {
            primary: document.getElementById('templatePrimaryColor').value,
            secondary: document.getElementById('templateSecondaryColor').value,
            accent: document.getElementById('templateAccentColor').value,
            background: document.getElementById('templateBackgroundColor').value,
        },
        fontSize: {
            title: parseInt(document.getElementById('templateTitleSize').value),
            subtitle: 14,
            sectionHeader: 18,
            subsectionHeader: 13,
            body: parseInt(document.getElementById('templateBodySize').value)
        }
    };

    if (templateId) {
        updateTemplate(templateId, templateData);
        showMessage('Template updated successfully', 'success');
    } else {
        createTemplate(templateData);
        showMessage('Template created successfully', 'success');
    }

    renderTemplates();
    updateTemplateSelect();
    closeTemplateModal();
}

async function deleteTemplateConfirm(templateId) {
    if (!confirm('Are you sure you want to delete this template?')) return;

    if (deleteTemplate(templateId)) {
        renderTemplates();
        updateTemplateSelect();
        showMessage('Template deleted', 'success');
    } else {
        showMessage('Cannot delete default template', 'error');
    }
}

window.openTemplateModal = openTemplateModal;
window.deleteTemplateConfirm = deleteTemplateConfirm;
