/**
 * Scenarios Data Module
 * Handles energy scenario data loading and management
 */

let energyScenarios = {};

// Load energy scenarios from API
async function loadEnergyScenarios() {
    try {
        Logger.info('Loading energy scenarios...');
        energyScenarios = await apiClient.getEnergyScenarios();
        Logger.info('Loaded energy scenarios:', Object.keys(energyScenarios));
        return energyScenarios;
    } catch (error) {
        Logger.error('Error loading energy scenarios:', error);
        notificationManager.showError('Fehler beim Laden der Energie-Szenarien');
        return {};
    }
}

// Get all energy scenarios
function getEnergyScenarios() {
    return energyScenarios;
}

// Get scenario by key
function getScenarioByKey(scenarioKey) {
    return energyScenarios[scenarioKey];
}

// Get relevant scenarios for a quartier
function getRelevantScenarios(quartier) {
    // For now, return all scenarios - can be enhanced with quartier-specific logic
    return energyScenarios;
}

// Cache scenarios data
function cacheEnergyScenarios(scenariosData) {
    energyScenarios = scenariosData;
}

// Export to global scope
window.loadEnergyScenarios = loadEnergyScenarios;
window.getEnergyScenarios = getEnergyScenarios;
window.getScenarioByKey = getScenarioByKey;
window.getRelevantScenarios = getRelevantScenarios;
window.cacheEnergyScenarios = cacheEnergyScenarios;
window.energyScenarios = energyScenarios;
