/**
 * Configuration Manager - Core Komponente für Konfigurationsverwaltung
 * Koordiniert Laden und Anzeigen von Quartier- und System-Konfigurationen
 */

/**
 * Configuration Manager Class
 */
class ConfigManager {
    
    constructor() {
        this.currentTab = 'quartiere';
        this.quartierConfig = null;
        this.systemConfig = null;
        this.isLoaded = false;
    }
    
    /**
     * Zeigt das Konfigurations-Dashboard
     */
    async showDashboard() {
        try {
            // Get content container
            const contentContainer = document.getElementById('content');
            if (!contentContainer) {
                throw new Error('Content container not found');
            }
            
            // Render dashboard structure
            window.ConfigView.renderConfigDashboard(contentContainer);
            
            // Load initial tab content
            await this.loadQuartiereTab();
            
            // Setup tab event listeners
            this.setupTabListeners();
            
            this.isLoaded = true;
            window.notificationManager.showSuccess('Konfiguration geladen');
            
        } catch (error) {
            console.error('Error showing configuration dashboard:', error);
            window.notificationManager.showError('Fehler beim Laden der Konfiguration');
            throw error;
        }
    }
    
    /**
     * Lädt den Quartiere-Tab
     */
    async loadQuartiereTab() {
        try {
            const container = document.getElementById('quartiere-container');
            if (!container) return;
            
            // Show loading spinner
            container.innerHTML = `
                <div class="d-flex justify-content-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Lade Quartiere...</span>
                    </div>
                </div>
            `;
            
            // Load quartier overview data
            const quartiers = await window.ConfigData.getQuartierOverview();
            
            // Render quartier overview
            const html = window.ConfigView.renderQuartierOverview(quartiers);
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading quartiere tab:', error);
            const container = document.getElementById('quartiere-container');
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Fehler beim Laden der Quartier-Daten: ${error.message}
                    </div>
                `;
            }
        }
    }
    
    /**
     * Lädt den System-Tab
     */
    async loadSystemTab() {
        try {
            const container = document.getElementById('system-container');
            if (!container) return;
            
            // Show loading spinner
            container.innerHTML = `
                <div class="d-flex justify-content-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Lade System-Parameter...</span>
                    </div>
                </div>
            `;
            
            // Load system config
            const systemConfig = await window.ConfigData.getSystemConfig();
            this.systemConfig = systemConfig;
            
            // Render system parameters
            const html = window.ConfigView.renderSystemParameters(systemConfig);
            container.innerHTML = html;
            
            // Load energy scenarios
            const scenarios = await window.ConfigData.getEnergyScenarios();
            const scenariosHtml = window.ConfigView.renderEnergyScenarios(scenarios);
            container.innerHTML += `<hr class="my-4">${scenariosHtml}`;
            
        } catch (error) {
            console.error('Error loading system tab:', error);
            const container = document.getElementById('system-container');
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Fehler beim Laden der System-Parameter: ${error.message}
                    </div>
                `;
            }
        }
    }
    
    /**
     * Lädt den Technologien-Tab
     */
    async loadTechnologienTab() {
        try {
            const container = document.getElementById('technologien-container');
            if (!container) return;
            
            // Show loading spinner
            container.innerHTML = `
                <div class="d-flex justify-content-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Lade Technologien...</span>
                    </div>
                </div>
            `;
            
            // Load technology templates
            const technologies = await window.ConfigData.getTechnologyTemplates();
            
            // Render technology templates
            const html = window.ConfigView.renderTechnologyTemplates(technologies);
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading technologien tab:', error);
            const container = document.getElementById('technologien-container');
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Fehler beim Laden der Technologie-Templates: ${error.message}
                    </div>
                `;
            }
        }
    }
    
    /**
     * Lädt den Stakeholder-Templates-Tab
     */
    async loadStakeholderTemplatesTab() {
        try {
            const container = document.getElementById('stakeholder-templates-container');
            if (!container) return;
            
            // Show loading spinner
            container.innerHTML = `
                <div class="d-flex justify-content-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Lade Stakeholder-Templates...</span>
                    </div>
                </div>
            `;
            
            // Load stakeholder templates
            const templates = await window.ConfigData.getStakeholderTemplates();
            
            // Simple render for now
            const html = `
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="bi bi-person-lines-fill me-2"></i>Stakeholder-Templates
                            <span class="badge bg-primary ms-2">${Object.keys(templates.stakeholder_templates || {}).length} Templates</span>
                        </h6>
                    </div>
                    <div class="card-body">
                        ${Object.entries(templates.stakeholder_templates || {}).map(([key, template]) => `
                            <div class="border rounded p-3 mb-3">
                                <h6 class="text-primary">${key.charAt(0).toUpperCase() + key.slice(1)}</h6>
                                <p class="mb-2"><strong>Einfluss:</strong> ${template.default_influence}</p>
                                <p class="mb-2"><strong>Beteiligung:</strong> ${template.default_participation}</p>
                                <p class="mb-0">
                                    <strong>Typische Interessen:</strong>
                                    ${(template.typical_interests || []).map(interest => 
                                        `<span class="badge bg-light text-dark me-1">${interest}</span>`
                                    ).join('')}
                                </p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading stakeholder templates tab:', error);
            const container = document.getElementById('stakeholder-templates-container');
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Fehler beim Laden der Stakeholder-Templates: ${error.message}
                    </div>
                `;
            }
        }
    }
    
    /**
     * Setup Tab Event Listeners
     */
    setupTabListeners() {
        const tabs = {
            'quartiere-tab': () => this.loadQuartiereTab(),
            'system-tab': () => this.loadSystemTab(),
            'technologien-tab': () => this.loadTechnologienTab(),
            'stakeholder-templates-tab': () => this.loadStakeholderTemplatesTab()
        };
        
        Object.entries(tabs).forEach(([tabId, loadFunction]) => {
            const tab = document.getElementById(tabId);
            if (tab) {
                tab.addEventListener('shown.bs.tab', loadFunction);
            }
        });
    }
    
    /**
     * Zeigt Details für ein spezifisches Quartier
     * @param {string} quartierKey - Quartier-Schlüssel
     */
    async showQuartierDetails(quartierKey) {
        try {
            console.log(`Showing details for quartier: ${quartierKey}`);
            
            // Load detailed quartier data
            const quartierData = await window.ConfigData.getQuartierDetails(quartierKey);
            
            // Render details in modal
            const modalHtml = window.ConfigView.renderQuartierDetails(quartierData);
            
            window.modalManager.createModal(
                'quartierDetails',
                `Quartier Details: ${quartierData.quartier_data.name}`,
                modalHtml,
                { size: 'modal-xl' }
            );
            
            window.modalManager.showModal('quartierDetails');
            
        } catch (error) {
            console.error('Error showing quartier details:', error);
            window.notificationManager.showError(`Fehler beim Laden der Details für ${quartierKey}`);
        }
    }
    
    /**
     * Zeigt Energieprofil für ein Quartier
     * @param {string} quartierKey - Quartier-Schlüssel
     */
    async showEnergyProfile(quartierKey) {
        try {
            console.log(`Showing energy profile for quartier: ${quartierKey}`);
            
            // Load energy profile data
            const profiles = await window.ConfigData.getQuartierEnergyProfiles();
            const profile = profiles.find(p => p.key === quartierKey);
            
            if (!profile) {
                throw new Error(`Energieprofil für ${quartierKey} nicht gefunden`);
            }
            
            // Simple profile display for now
            const modalHtml = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Energiebedarf</h6>
                            </div>
                            <div class="card-body">
                                <pre>${JSON.stringify(profile.energy_demand, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">EE-Potential</h6>
                            </div>
                            <div class="card-body">
                                <pre>${JSON.stringify(profile.renewable_potential, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            window.modalManager.createModal(
                'energyProfile',
                `Energieprofil: ${profile.name}`,
                modalHtml,
                { size: 'modal-lg' }
            );
            
            window.modalManager.showModal('energyProfile');
            
        } catch (error) {
            console.error('Error showing energy profile:', error);
            window.notificationManager.showError(`Fehler beim Laden des Energieprofils für ${quartierKey}`);
        }
    }
    
    /**
     * Exportiert Konfigurationsdaten
     */
    async exportConfig() {
        try {
            console.log('Exporting configuration...');
            
            if (!this.quartierConfig) {
                this.quartierConfig = await window.ConfigData.getQuartierConfig();
            }
            if (!this.systemConfig) {
                this.systemConfig = await window.ConfigData.getSystemConfig();
            }
            
            const exportData = {
                timestamp: new Date().toISOString(),
                quartier_config: this.quartierConfig,
                system_config: this.systemConfig
            };
            
            // Create download
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `zittau-config-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            window.notificationManager.showSuccess('Konfiguration erfolgreich exportiert');
            
        } catch (error) {
            console.error('Error exporting configuration:', error);
            window.notificationManager.showError('Fehler beim Export der Konfiguration');
        }
    }
    
    /**
     * Aktualisiert die Konfiguration
     */
    async refreshConfig() {
        try {
            console.log('Refreshing configuration...');
            
            // Clear cached data
            this.quartierConfig = null;
            this.systemConfig = null;
            
            // Reload current tab
            switch (this.currentTab) {
                case 'quartiere':
                    await this.loadQuartiereTab();
                    break;
                case 'system':
                    await this.loadSystemTab();
                    break;
                case 'technologien':
                    await this.loadTechnologienTab();
                    break;
                case 'stakeholder-templates':
                    await this.loadStakeholderTemplatesTab();
                    break;
            }
            
            window.notificationManager.showSuccess('Konfiguration aktualisiert');
            
        } catch (error) {
            console.error('Error refreshing configuration:', error);
            window.notificationManager.showError('Fehler beim Aktualisieren der Konfiguration');
        }
    }
}

// Make functions available globally
window.configManager = new ConfigManager();
window.configManager.showQuartierDetails = window.configManager.showQuartierDetails.bind(window.configManager);
window.configManager.showEnergyProfile = window.configManager.showEnergyProfile.bind(window.configManager);
window.configManager.exportConfig = window.configManager.exportConfig.bind(window.configManager);
window.configManager.refreshConfig = window.configManager.refreshConfig.bind(window.configManager);
