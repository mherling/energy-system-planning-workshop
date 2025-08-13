/**
 * Stakeholders Data Module
 * Handles stakeholder data loading and management
 */

let stakeholders = [];

// Load stakeholders data from API
async function loadStakeholders() {
    try {
        Logger.info('Loading stakeholders...');
        stakeholders = await apiClient.getStakeholders();
        Logger.info('Loaded stakeholders:', stakeholders.length);
        return stakeholders;
    } catch (error) {
        Logger.error('Error loading stakeholders:', error);
        notificationManager.showError('Fehler beim Laden der Stakeholder-Daten');
        return [];
    }
}

// Get all stakeholders
function getStakeholders() {
    return stakeholders;
}

// Get stakeholders by category
function getStakeholdersByCategory(category) {
    return stakeholders.filter(s => s.category === category);
}

// Get relevant stakeholders for a quartier
function getRelevantStakeholders(quartier) {
    if (quartier === 'all') {
        return stakeholders;
    } else {
        // For now, return all stakeholders - can be enhanced with quartier-specific logic
        return stakeholders;
    }
}

// Cache stakeholders data
function cacheStakeholders(stakeholdersData) {
    stakeholders = stakeholdersData;
}

// Export to global scope
window.loadStakeholders = loadStakeholders;
window.getStakeholders = getStakeholders;
window.getStakeholdersByCategory = getStakeholdersByCategory;
window.getRelevantStakeholders = getRelevantStakeholders;
window.cacheStakeholders = cacheStakeholders;
window.stakeholders = stakeholders;
