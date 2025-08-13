/**
 * Config Data Layer - Lädt Konfigurationsdaten von Backend APIs
 * Handles YAML-basierte Quartier- und System-Konfigurationen
 */

/**
 * Data Access Layer für Konfigurationsdaten
 */
class ConfigData {
    
    /**
     * Lädt die komplette Quartier-Konfiguration
     * @returns {Promise<Object>} Quartier-Config mit Defaults und Schema
     */
    static async getQuartierConfig() {
        try {
            return await window.apiClient.get('/api/config/quartiers');
        } catch (error) {
            console.error('Fehler beim Laden der Quartier-Konfiguration:', error);
            throw error;
        }
    }
    
    /**
     * Lädt die System-Konfiguration
     * @returns {Promise<Object>} System-Config mit allen Parametern
     */
    static async getSystemConfig() {
        try {
            return await window.apiClient.get('/api/config/system');
        } catch (error) {
            console.error('Fehler beim Laden der System-Konfiguration:', error);
            throw error;
        }
    }
    
    /**
     * Lädt Details für ein spezifisches Quartier
     * @param {string} quartierKey - Quartier-Schlüssel (z.B. 'quartier_1')
     * @returns {Promise<Object>} Detaillierte Quartier-Daten mit Defaults
     */
    static async getQuartierDetails(quartierKey) {
        try {
            return await window.apiClient.get(`/api/config/quartiers/${quartierKey}`);
        } catch (error) {
            console.error(`Fehler beim Laden der Details für ${quartierKey}:`, error);
            throw error;
        }
    }
    
    /**
     * Lädt alle Technologie-Templates
     * @returns {Promise<Object>} Technologie-Templates mit Kategorien
     */
    static async getTechnologyTemplates() {
        try {
            return await window.apiClient.get('/api/config/technologies');
        } catch (error) {
            console.error('Fehler beim Laden der Technologie-Templates:', error);
            throw error;
        }
    }
    
    /**
     * Lädt Stakeholder-Templates
     * @returns {Promise<Object>} Stakeholder-Templates
     */
    static async getStakeholderTemplates() {
        try {
            return await window.apiClient.get('/api/config/stakeholder-templates');
        } catch (error) {
            console.error('Fehler beim Laden der Stakeholder-Templates:', error);
            throw error;
        }
    }
    
    /**
     * Lädt detaillierte Energiepreis-Szenarien
     * @returns {Promise<Object>} Energiepreis-Szenarien
     */
    static async getEnergyScenarios() {
        try {
            return await window.apiClient.get('/api/config/energy-scenarios');
        } catch (error) {
            console.error('Fehler beim Laden der Energiepreis-Szenarien:', error);
            throw error;
        }
    }
    
    /**
     * Lädt Quartier-Übersicht mit Basis-Informationen
     * @returns {Promise<Array>} Array mit Quartier-Übersichtsdaten
     */
    static async getQuartierOverview() {
        try {
            const config = await this.getQuartierConfig();
            const quartiers = config.quartiers;
            
            // Transformiere in Array-Format für Tabellenanzeige
            return Object.entries(quartiers).map(([key, data]) => ({
                key: key,
                id: key.replace('quartier_', ''),
                name: data.name,
                district_type: data.district_type,
                area_km2: data.area_km2,
                population: data.population_override || 'Berechnet',
                description: data.description,
                priority_level: data.priority_level,
                total_energy_demand: data.energy_demand?.total_annual_mwh || 'N/A',
                renewable_potential: data.renewable_potential?.total_potential_mwh || 'N/A'
            }));
        } catch (error) {
            console.error('Fehler beim Erstellen der Quartier-Übersicht:', error);
            throw error;
        }
    }
    
    /**
     * Lädt Energieprofile für alle Quartiere
     * @returns {Promise<Array>} Array mit Energieprofil-Daten
     */
    static async getQuartierEnergyProfiles() {
        try {
            const config = await this.getQuartierConfig();
            const quartiers = config.quartiers;
            
            return Object.entries(quartiers).map(([key, data]) => ({
                key: key,
                name: data.name,
                district_type: data.district_type,
                energy_demand: data.energy_demand || {},
                renewable_potential: data.renewable_potential || {},
                current_generation: data.current_generation || {},
                utilized_potential: data.utilized_potential || {}
            }));
        } catch (error) {
            console.error('Fehler beim Laden der Energieprofile:', error);
            throw error;
        }
    }
    
    /**
     * Lädt regionale Parameter
     * @returns {Promise<Object>} Regionale Parameter für Zittau
     */
    static async getRegionalParameters() {
        try {
            const config = await this.getSystemConfig();
            return config.regional_parameters || {};
        } catch (error) {
            console.error('Fehler beim Laden der regionalen Parameter:', error);
            throw error;
        }
    }
    
    /**
     * Lädt Emissionsfaktoren
     * @returns {Promise<Object>} CO2-Emissionsfaktoren
     */
    static async getEmissionFactors() {
        try {
            const config = await this.getSystemConfig();
            return config.emission_factors || {};
        } catch (error) {
            console.error('Fehler beim Laden der Emissionsfaktoren:', error);
            throw error;
        }
    }
    
    /**
     * Lädt technische Parameter
     * @returns {Promise<Object>} Technische System-Parameter
     */
    static async getTechnicalParameters() {
        try {
            const config = await this.getSystemConfig();
            return config.technical_parameters || {};
        } catch (error) {
            console.error('Fehler beim Laden der technischen Parameter:', error);
            throw error;
        }
    }
    
    /**
     * Lädt Quartier-Farbschema
     * @returns {Promise<Object>} Farbzuordnung für Quartiere
     */
    static async getQuartierColors() {
        try {
            const config = await this.getSystemConfig();
            return config.quartier_colors || {};
        } catch (error) {
            console.error('Fehler beim Laden der Quartier-Farben:', error);
            throw error;
        }
    }
    
    /**
     * Lädt Analyse-Einstellungen
     * @returns {Promise<Object>} Konfiguration für Analysen
     */
    static async getAnalysisSettings() {
        try {
            const config = await this.getSystemConfig();
            return config.analysis_settings || {};
        } catch (error) {
            console.error('Fehler beim Laden der Analyse-Einstellungen:', error);
            throw error;
        }
    }
}

// Make ConfigData globally available
window.ConfigData = ConfigData;
