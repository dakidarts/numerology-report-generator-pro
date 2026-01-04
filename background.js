// ==================== BACKGROUND SCRIPT ====================
// Numerology Report Generator Pro - Background Service

// Extension Installation/Update
browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        handleInstall();
    } else if (details.reason === 'update') {
        handleUpdate(details.previousVersion);
    }
});

async function handleInstall() {
    console.log('Numerology Report Generator Pro installed');
    
    // Set default settings
    await browser.storage.local.set({
        settings: {
            apiKey: '',
            practitionerName: '',
            practitionerEmail: '',
            practitionerWebsite: '',
            autoSaveReports: true,
            showNotifications: true,
            darkMode: false
        },
        profiles: [],
        history: []
    });
    
    // Show welcome notification
    browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Welcome to Numerology Report Generator Pro!',
        message: 'Click the extension icon to get started. Don\'t forget to add your API key in settings.'
    });
    
    // Open getting started page
    browser.tabs.create({
        url: 'https://numerologyapi.com'
    });
}

async function handleUpdate(previousVersion) {
    console.log(`Extension updated from ${previousVersion}`);
    
    // Show update notification
    browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Numerology Pro Updated!',
        message: 'New features and improvements are now available.'
    });
}

// Message handling from popup/content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'showNotification':
            showNotification(message.title, message.message);
            break;
        case 'openTab':
            browser.tabs.create({ url: message.url });
            break;
        case 'getVersion':
            sendResponse({ version: browser.runtime.getManifest().version });
            break;
    }
    return true;
});

// Notification helper
function showNotification(title, message) {
    browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: title,
        message: message
    });
}

// Context menu for quick actions (optional future feature)
browser.contextMenus.create({
    id: 'open-numerology-pro',
    title: 'Open Numerology Report Generator',
    contexts: ['page']
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'open-numerology-pro') {
        browser.sidebarAction.open();
    }
});

// Keyboard shortcut handling
browser.commands.onCommand.addListener((command) => {
    if (command === '_execute_sidebar_action') {
        browser.sidebarAction.open();
    }
});

// Periodic cleanup of old data (run once per day)
browser.alarms.create('cleanupOldData', { periodInMinutes: 1440 });

browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'cleanupOldData') {
        await cleanupOldData();
    }
});

async function cleanupOldData() {
    try {
        const result = await browser.storage.local.get('history');
        let history = result.history || [];
        
        // Keep only last 100 reports
        if (history.length > 100) {
            history = history.slice(0, 100);
            await browser.storage.local.set({ history });
            console.log('Cleaned up old history data');
        }
    } catch (error) {
        console.error('Error cleaning up data:', error);
    }
}

// Monitor storage usage
async function checkStorageUsage() {
    if (browser.storage.local.getBytesInUse) {
        const bytes = await browser.storage.local.getBytesInUse();
        const mb = (bytes / 1024 / 1024).toFixed(2);
        console.log(`Storage usage: ${mb} MB`);
        
        // Warn if storage is getting high
        if (bytes > 4 * 1024 * 1024) { // 4MB
            browser.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Storage Warning',
                message: 'Extension storage is getting full. Consider clearing old history.'
            });
        }
    }
}

// Check storage on startup
checkStorageUsage();

console.log('Numerology Report Generator Pro background script loaded');