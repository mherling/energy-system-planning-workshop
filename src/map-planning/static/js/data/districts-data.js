/**
 * Districts Data Module
 * Handles districts data loading, caching, and management
 */

let districts = [];
let currentDistrict = null;

// Load districts data from API
async function loadDistricts() {
    try {
        Logger.info('Loading districts data...');
        districts = await apiClient.getDistricts();
        createQuartiersOnMap(districts);
        Logger.info(`Loaded ${districts.length} quartiers`);
        return districts;
    } catch (error) {
        Logger.error('Error loading districts:', error);
        notificationManager.showError('Fehler beim Laden der Quartier-Daten');
        return [];
    }
}

// Get all districts
function getDistricts() {
    return districts;
}

// Get district by ID
function getDistrictById(districtId) {
    return districts.find(d => d.id == districtId);
}

// Get current selected district
function getCurrentDistrict() {
    return currentDistrict;
}

// Set current selected district
function setCurrentDistrict(district) {
    currentDistrict = district;
}

// Cache districts data
function cacheDistricts(districtsData) {
    districts = districtsData;
}

// Parse district JSON data safely
function parseDistrictData(district) {
    return {
        ...district,
        energy_demand: typeof district.energy_demand === 'string' 
            ? JSON.parse(district.energy_demand) 
            : district.energy_demand || {},
        renewable_potential: typeof district.renewable_potential === 'string' 
            ? JSON.parse(district.renewable_potential) 
            : district.renewable_potential || {},
        additional_data: typeof district.additional_data === 'string' 
            ? JSON.parse(district.additional_data) 
            : district.additional_data || {},
        building_types: typeof district.building_types === 'string' 
            ? JSON.parse(district.building_types) 
            : district.building_types || {}
    };
}

// Export to global scope
window.loadDistricts = loadDistricts;
window.getDistricts = getDistricts;
window.getDistrictById = getDistrictById;
window.getCurrentDistrict = getCurrentDistrict;
window.setCurrentDistrict = setCurrentDistrict;
window.cacheDistricts = cacheDistricts;
window.parseDistrictData = parseDistrictData;
window.districts = districts;
window.currentDistrict = currentDistrict;
