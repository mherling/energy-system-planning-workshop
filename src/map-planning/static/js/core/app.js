/**
 * App Core Module
 * Handles application initialization and startup
 */

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', function() {
    Logger.info('DOM Content Loaded - Initializing application...');
    initializeApp();
});

// Initialize the application
async function initializeApp() {
    try {
        Logger.info('Starting application initialization...');
        
        // Initialize map first
        initializeMap();
        Logger.info('Map initialized');
        
        // Load all data
        await loadData();
        
        Logger.info('Application initialized successfully');
        notificationManager.showSuccess('Anwendung erfolgreich geladen', 3000); // 3 Sekunden statt 5
    } catch (error) {
        Logger.error('Error initializing application:', error);
        notificationManager.showError('Fehler beim Initialisieren der Anwendung');
    }
}

// Export to global scope
window.initializeApp = initializeApp;
