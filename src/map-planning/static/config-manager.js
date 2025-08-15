/**
 * Configuration Manager for new modular structure
 * Handles loading and caching of stakeholder, technology, and measures configurations
 */

class ConfigurationManager {
    constructor() {
        this.configs = {
            stakeholders: null,
            technologies: null,
            measures: null,
            quarters: null,
            system: null
        };
        this.loadPromises = {};
    }

    /**
     * Load configuration from API
     * @param {string} configType - Type of configuration to load
     * @param {boolean} forceReload - Force reload even if cached
     * @returns {Promise} Configuration data
     */
    async loadConfig(configType, forceReload = false) {
        if (this.configs[configType] && !forceReload) {
            return this.configs[configType];
        }

        // Avoid multiple simultaneous requests for the same config
        if (this.loadPromises[configType]) {
            return this.loadPromises[configType];
        }

        const endpoints = {
            stakeholders: '/api/config/stakeholders',
            technologies: '/api/config/technologies',
            'technology-templates': '/api/config/technology-templates', // Legacy endpoint
            measures: '/api/config/measures',
            quarters: '/api/config/quarters',
            system: '/api/config/system'
        };

        this.loadPromises[configType] = fetch(endpoints[configType])
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${configType} configuration: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                this.configs[configType] = data;
                delete this.loadPromises[configType];
                return data;
            })
            .catch(error => {
                console.error(`Error loading ${configType} configuration:`, error);
                delete this.loadPromises[configType];
                throw error;
            });

        return this.loadPromises[configType];
    }

    /**
     * Get stakeholder configuration
     * @param {string} stakeholderId - Optional specific stakeholder ID
     * @returns {Promise} Stakeholder configuration
     */
    async getStakeholders(stakeholderId = null) {
        const config = await this.loadConfig('stakeholders');
        
        if (stakeholderId) {
            return config.stakeholders[stakeholderId] || null;
        }
        
        return config.stakeholders;
    }

    /**
     * Get cooperation matrix for stakeholders
     * @returns {Promise} Cooperation matrix
     */
    async getCooperationMatrix() {
        const config = await this.loadConfig('stakeholders');
        return config.cooperation_matrix || {};
    }

    /**
     * Get technology configurations
     * @param {string} category - Optional technology category
     * @returns {Promise} Technology configuration
     */
    async getTechnologies(category = null) {
        const config = await this.loadConfig('technologies');
        
        if (category) {
            return config.technology_categories[category] || null;
        }
        
        return config.technology_categories;
    }

    /**
     * Get technology templates (legacy format for backwards compatibility)
     * @returns {Promise} Technology templates in old format
     */
    async getTechnologyTemplates() {
        const config = await this.loadConfig('technology-templates');
        return config;
    }

    /**
     * Get measures catalog
     * @returns {Promise} Complete measures catalog
     */
    async getMeasures() {
        const config = await this.loadConfig('measures');
        return config;
    }

    /**
     * Get suitable measures for a quarter type
     * @param {string} quarterType - Type of quarter
     * @returns {Promise} Suitable measures
     */
    async getMeasuresForQuarter(quarterType) {
        try {
            const response = await fetch(`/api/config/measures/quarter/${quarterType}`);
            if (!response.ok) {
                throw new Error(`Failed to load measures for quarter ${quarterType}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading measures for quarter ${quarterType}:`, error);
            throw error;
        }
    }

    /**
     * Get quarter type definitions
     * @returns {Promise} Quarter types
     */
    async getQuarterTypes() {
        const config = await this.loadConfig('quarters');
        return config.quarter_types;
    }

    /**
     * Get system parameters and game settings
     * @returns {Promise} System configuration
     */
    async getSystemConfig() {
        const config = await this.loadConfig('system');
        return config;
    }

    /**
     * Calculate consensus for a measure among stakeholders
     * @param {string} measureId - Measure ID
     * @param {Array} activeStakeholders - List of active stakeholder IDs
     * @returns {Promise} Consensus analysis
     */
    async calculateMeasureConsensus(measureId, activeStakeholders) {
        try {
            const response = await fetch(`/api/game/consensus/${measureId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    active_stakeholders: activeStakeholders
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to calculate consensus for measure ${measureId}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error calculating consensus for measure ${measureId}:`, error);
            throw error;
        }
    }

    /**
     * Get stakeholder position on a specific measure
     * @param {string} stakeholderId - Stakeholder ID
     * @param {string} measureId - Measure ID
     * @returns {Promise} Stakeholder position
     */
    async getStakeholderMeasurePosition(stakeholderId, measureId) {
        const measures = await this.getMeasures();
        const measure = measures.measures_catalog[measureId];
        
        if (!measure) {
            throw new Error(`Measure ${measureId} not found`);
        }

        const stakeholderViews = measure.stakeholder_views || {};
        return stakeholderViews[stakeholderId] || {
            support_level: 5,
            key_benefits: [],
            concerns: []
        };
    }

    /**
     * Clear all cached configurations
     */
    clearCache() {
        this.configs = {
            stakeholders: null,
            technologies: null,
            measures: null,
            quarters: null,
            system: null
        };
        this.loadPromises = {};
    }
}

/**
 * Utility functions for working with configurations
 */
class ConfigUtils {
    /**
     * Format support level as descriptive text
     * @param {number} supportLevel - Support level (1-10)
     * @returns {string} Descriptive text
     */
    static formatSupportLevel(supportLevel) {
        if (supportLevel >= 9) return "Sehr hohe Unterstützung";
        if (supportLevel >= 7) return "Hohe Unterstützung";
        if (supportLevel >= 6) return "Moderate Unterstützung";
        if (supportLevel >= 4) return "Geringe Unterstützung";
        return "Ablehnung";
    }

    /**
     * Get support level color
     * @param {number} supportLevel - Support level (1-10)
     * @returns {string} CSS color class or hex color
     */
    static getSupportLevelColor(supportLevel) {
        if (supportLevel >= 8) return "#28a745"; // green
        if (supportLevel >= 6) return "#ffc107"; // yellow
        if (supportLevel >= 4) return "#fd7e14"; // orange
        return "#dc3545"; // red
    }

    /**
     * Calculate weighted average support considering stakeholder influence
     * @param {Array} stakeholderSupport - Array of {stakeholderId, supportLevel}
     * @param {Object} influenceWeights - Stakeholder influence weights
     * @returns {number} Weighted average support
     */
    static calculateWeightedSupport(stakeholderSupport, influenceWeights) {
        let totalWeight = 0;
        let weightedSum = 0;

        stakeholderSupport.forEach(({stakeholderId, supportLevel}) => {
            const weight = influenceWeights[stakeholderId] || 1;
            totalWeight += weight;
            weightedSum += supportLevel * weight;
        });

        return totalWeight > 0 ? weightedSum / totalWeight : 5;
    }

    /**
     * Format investment cost with proper units
     * @param {number} cost - Cost in EUR
     * @returns {string} Formatted cost string
     */
    static formatCost(cost) {
        if (cost >= 1000000) {
            return `${(cost / 1000000).toFixed(1)} Mio. €`;
        } else if (cost >= 1000) {
            return `${(cost / 1000).toFixed(0)} T€`;
        } else {
            return `${cost} €`;
        }
    }

    /**
     * Format energy values with proper units
     * @param {number} energy - Energy in kWh
     * @returns {string} Formatted energy string
     */
    static formatEnergy(energy) {
        if (energy >= 1000000) {
            return `${(energy / 1000000).toFixed(1)} GWh`;
        } else if (energy >= 1000) {
            return `${(energy / 1000).toFixed(0)} MWh`;
        } else {
            return `${energy} kWh`;
        }
    }

    /**
     * Get measure category icon
     * @param {string} category - Measure category
     * @returns {string} Icon class or emoji
     */
    static getMeasureCategoryIcon(category) {
        const icons = {
            'building_measures': '🏢',
            'renewable_energy': '☀️',
            'mobility': '🚗',
            'participation': '👥',
            'efficiency': '⚡',
            'storage': '🔋',
            'heating': '🔥',
            'infrastructure': '🏗️'
        };
        return icons[category] || '📋';
    }

    /**
     * Sort measures by priority and implementation potential
     * @param {Array} measures - Array of measures
     * @returns {Array} Sorted measures
     */
    static sortMeasures(measures) {
        return measures.sort((a, b) => {
            // First by priority (higher is better)
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            // Then by implementation potential (higher is better)
            return b.implementation_potential_pct - a.implementation_potential_pct;
        });
    }
}

// Global configuration manager instance
const configManager = new ConfigurationManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConfigurationManager, ConfigUtils, configManager };
}
