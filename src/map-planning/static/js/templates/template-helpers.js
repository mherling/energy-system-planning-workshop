/**
 * Template Helpers Module
 * Provides helper functions for template generation
 */

// Helper functions for energy source display
function getEnergySourceDisplayName(name) {
    const mapping = {
        'gas': 'Erdgas',
        'oil': 'Heizöl',
        'heat pump': 'Wärmepumpe',
        'biomass': 'Biomasse',
        'district heating': 'Fernwärme',
        'direct electric': 'Direktstrom',
        'grid import': 'Stromnetz',
        'local pv': 'Lokale PV',
        'local wind': 'Lokaler Wind',
        'local chp': 'Lokales BHKW',
        'gasoline': 'Benzin',
        'diesel': 'Diesel',
        'electric': 'Elektro',
        'public transport': 'ÖPNV',
        'cycling walking': 'Rad/Fuß'
    };
    return mapping[name] || name.charAt(0).toUpperCase() + name.slice(1);
}

function getEnergySourceColor(name) {
    const mapping = {
        'gas': '#dc3545',
        'oil': '#6f42c1',
        'heat pump': '#20c997',
        'biomass': '#198754',
        'district heating': '#fd7e14',
        'direct electric': '#0d6efd',
        'grid import': '#6c757d',
        'local pv': '#ffc107',
        'local wind': '#20c997',
        'local chp': '#28a745',
        'gasoline': '#dc3545',
        'diesel': '#6f42c1',
        'electric': '#20c997',
        'public transport': '#0d6efd',
        'cycling walking': '#28a745'
    };
    return mapping[name] || '#6c757d';
}

// Export to global scope
window.getEnergySourceDisplayName = getEnergySourceDisplayName;
window.getEnergySourceColor = getEnergySourceColor;
