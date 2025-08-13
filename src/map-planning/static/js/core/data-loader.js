/**
 * Data Loader Module
 * Handles all data loading operations for the application
 */

// Load all application data
async function loadData() {
    try {
        Logger.info('Loading application data...');
        
        const results = await Promise.all([
            loadDistricts(),
            initializeAnalysis(),
            loadEnergyMetrics()
        ]);
        
        Logger.info('All data loaded successfully:', {
            districts: results[0]?.length || 0,
            analysisInitialized: results[1] || false
        });
        
    } catch (error) {
        Logger.error('Error loading data:', error);
        notificationManager.showError('Fehler beim Laden der Daten');
    }
}

// Load energy metrics for overview using new API client
async function loadEnergyMetrics() {
    try {
        Logger.info('Loading energy metrics...');
        const data = await apiClient.getEnergyBalance();
        displayTotalOverview(data);
        Logger.info('Energy metrics loaded and displayed');
        return data;
    } catch (error) {
        Logger.error('Error loading energy metrics:', error);
        notificationManager.showWarning('Energie-Metriken konnten nicht geladen werden');
        return null;
    }
}

// Export to global scope
window.loadData = loadData;
window.loadEnergyMetrics = loadEnergyMetrics;

// Temporary compatibility shims for removed functions (to prevent cache errors)
window.loadStakeholders = function() { 
    console.log('loadStakeholders is deprecated - use Configuration instead');
    return Promise.resolve([]);
};
window.loadEnergyScenarios = function() { 
    console.log('loadEnergyScenarios is deprecated - use Configuration instead');
    return Promise.resolve([]);
};
