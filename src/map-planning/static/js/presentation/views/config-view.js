/**
 * Config View Layer - Rendering von Konfigurationsdaten
 * Zeigt Quartier-, System- und Technologie-Konfigurationen an
 */

/**
 * View Layer für Konfigurationsanzeigen
 */
class ConfigView {
    
    /**
     * Rendert das Haupt-Dashboard für Konfigurationen
     * @param {HTMLElement} container - Container-Element
     */
    static renderConfigDashboard(container) {
        const html = `
            <div class="config-dashboard">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>
                        <i class="bi bi-gear-fill text-primary me-2"></i>
                        Konfiguration
                    </h2>
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-outline-primary btn-sm" 
                                onclick="configManager.exportConfig()">
                            <i class="bi bi-download me-1"></i>Export
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" 
                                onclick="configManager.refreshConfig()">
                            <i class="bi bi-arrow-clockwise me-1"></i>Aktualisieren
                        </button>
                    </div>
                </div>
                
                <!-- Tab Navigation -->
                <ul class="nav nav-tabs mb-4" id="configTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="quartiere-tab" data-bs-toggle="tab" 
                                data-bs-target="#quartiere-content" type="button" role="tab">
                            <i class="bi bi-buildings me-2"></i>Quartiere
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="system-tab" data-bs-toggle="tab" 
                                data-bs-target="#system-content" type="button" role="tab">
                            <i class="bi bi-sliders me-2"></i>System
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="technologien-tab" data-bs-toggle="tab" 
                                data-bs-target="#technologien-content" type="button" role="tab">
                            <i class="bi bi-cpu me-2"></i>Technologien
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="stakeholder-templates-tab" data-bs-toggle="tab" 
                                data-bs-target="#stakeholder-templates-content" type="button" role="tab">
                            <i class="bi bi-person-lines-fill me-2"></i>Stakeholder-Templates
                        </button>
                    </li>
                </ul>
                
                <!-- Tab Content -->
                <div class="tab-content" id="configTabContent">
                    <div class="tab-pane fade show active" id="quartiere-content" role="tabpanel">
                        <div id="quartiere-container">
                            <div class="d-flex justify-content-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Lade Quartiere...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="system-content" role="tabpanel">
                        <div id="system-container">
                            <div class="d-flex justify-content-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Lade System-Parameter...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="technologien-content" role="tabpanel">
                        <div id="technologien-container">
                            <div class="d-flex justify-content-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Lade Technologien...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="stakeholder-templates-content" role="tabpanel">
                        <div id="stakeholder-templates-container">
                            <div class="d-flex justify-content-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Lade Stakeholder-Templates...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * Rendert die Quartier-Übersichtstabelle
     * @param {Array} quartiers - Array mit Quartier-Daten
     * @returns {string} HTML für Quartier-Übersicht
     */
    static renderQuartierOverview(quartiers) {
        const rows = quartiers.map(quartier => `
            <tr>
                <td>
                    <strong class="text-primary">${quartier.name}</strong>
                    <br>
                    <small class="text-muted">${quartier.key}</small>
                </td>
                <td>
                    <span class="badge bg-secondary">${this.getDistrictTypeLabel(quartier.district_type)}</span>
                </td>
                <td>${quartier.area_km2} km²</td>
                <td>${window.formatUtils.formatNumber(quartier.population)}</td>
                <td>
                    <span class="badge ${this.getPriorityBadgeClass(quartier.priority_level)}">
                        ${this.getPriorityLabel(quartier.priority_level)}
                    </span>
                </td>
                <td>${window.formatUtils.formatEnergy(quartier.total_energy_demand)}</td>
                <td>${window.formatUtils.formatEnergy(quartier.renewable_potential)}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary" 
                                onclick="configManager.showQuartierDetails('${quartier.key}')"
                                title="Details anzeigen">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-info" 
                                onclick="configManager.showEnergyProfile('${quartier.key}')"
                                title="Energieprofil">
                            <i class="bi bi-graph-up"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="bi bi-buildings me-2"></i>Quartier-Übersicht
                        <span class="badge bg-primary ms-2">${quartiers.length} Quartiere</span>
                    </h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Quartier</th>
                                    <th>Typ</th>
                                    <th>Fläche</th>
                                    <th>Einwohner</th>
                                    <th>Priorität</th>
                                    <th>Energiebedarf</th>
                                    <th>EE-Potential</th>
                                    <th>Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Rendert detaillierte Quartier-Informationen
     * @param {Object} quartierData - Detaillierte Quartier-Daten
     * @returns {string} HTML für Quartier-Details
     */
    static renderQuartierDetails(quartierData) {
        const { quartier_data, district_type_defaults } = quartierData;
        
        return `
            <div class="row">
                <!-- Allgemeine Informationen -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-info-circle me-2"></i>Allgemeine Informationen
                            </h6>
                        </div>
                        <div class="card-body">
                            <dl class="row">
                                <dt class="col-sm-5">Name:</dt>
                                <dd class="col-sm-7">${quartier_data.name}</dd>
                                
                                <dt class="col-sm-5">Typ:</dt>
                                <dd class="col-sm-7">
                                    <span class="badge bg-secondary">${this.getDistrictTypeLabel(quartier_data.district_type)}</span>
                                </dd>
                                
                                <dt class="col-sm-5">Fläche:</dt>
                                <dd class="col-sm-7">${quartier_data.area_km2} km²</dd>
                                
                                <dt class="col-sm-5">Einwohner:</dt>
                                <dd class="col-sm-7">${window.formatUtils.formatNumber(quartier_data.population_override)}</dd>
                                
                                <dt class="col-sm-5">Priorität:</dt>
                                <dd class="col-sm-7">
                                    <span class="badge ${this.getPriorityBadgeClass(quartier_data.priority_level)}">
                                        ${this.getPriorityLabel(quartier_data.priority_level)}
                                    </span>
                                </dd>
                                
                                <dt class="col-sm-5">Beschreibung:</dt>
                                <dd class="col-sm-7">${quartier_data.description}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
                
                <!-- Energiebedarf -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-lightning-charge me-2"></i>Energiebedarf (MWh/Jahr)
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.renderEnergyDemandChart(quartier_data.energy_demand)}
                        </div>
                    </div>
                </div>
                
                <!-- Erneuerbare Potentiale -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-sun me-2"></i>Erneuerbare Potentiale
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.renderRenewablePotentialChart(quartier_data.renewable_potential, quartier_data.utilized_potential)}
                        </div>
                    </div>
                </div>
                
                <!-- Energiemix -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-pie-chart me-2"></i>Primärenergie-Mix
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.renderEnergyMixTabs(quartier_data.primary_energy_mix)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Rendert System-Parameter Dashboard
     * @param {Object} systemConfig - System-Konfiguration
     * @returns {string} HTML für System-Parameter
     */
    static renderSystemParameters(systemConfig) {
        const { regional_parameters, emission_factors, technical_parameters, analysis_settings } = systemConfig;
        
        return `
            <div class="row">
                <!-- Regionale Parameter -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-geo-alt me-2"></i>Regionale Parameter (Zittau)
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.renderRegionalParameters(regional_parameters)}
                        </div>
                    </div>
                </div>
                
                <!-- Emissionsfaktoren -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-cloud me-2"></i>CO₂-Emissionsfaktoren
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.renderEmissionFactors(emission_factors)}
                        </div>
                    </div>
                </div>
                
                <!-- Technische Parameter -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-gear me-2"></i>Technische Parameter
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.renderTechnicalParameters(technical_parameters)}
                        </div>
                    </div>
                </div>
                
                <!-- Analyse-Einstellungen -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-graph-up me-2"></i>Analyse-Einstellungen
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.renderAnalysisSettings(analysis_settings)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Rendert Energiepreis-Szenarien
     * @param {Object} scenarios - Energiepreis-Szenarien
     * @returns {string} HTML für Szenarien-Visualisierung
     */
    static renderEnergyScenarios(scenarios) {
        const scenarioCards = Object.entries(scenarios.scenarios).map(([key, scenario]) => `
            <div class="col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-header">
                        <h6 class="mb-0">${scenario.name}</h6>
                    </div>
                    <div class="card-body">
                        <p class="text-muted">${scenario.description}</p>
                        ${this.renderScenarioPriceTable(scenario)}
                    </div>
                </div>
            </div>
        `).join('');
        
        return `
            <div class="mb-4">
                <h5>
                    <i class="bi bi-graph-up me-2"></i>Energiepreis-Szenarien
                    <span class="badge bg-primary ms-2">${scenarios.scenario_count} Szenarien</span>
                </h5>
            </div>
            <div class="row">
                ${scenarioCards}
            </div>
        `;
    }
    
    /**
     * Rendert Technologie-Templates
     * @param {Object} technologies - Technologie-Templates
     * @returns {string} HTML für Technologie-Übersicht
     */
    static renderTechnologyTemplates(technologies) {
        const templates = technologies.technology_templates;
        const categories = technologies.categories;
        
        const categoryTabs = categories.map((category, index) => `
            <li class="nav-item" role="presentation">
                <button class="nav-link ${index === 0 ? 'active' : ''}" 
                        id="${category}-tab" data-bs-toggle="tab" 
                        data-bs-target="#${category}-content" type="button" role="tab">
                    ${this.getTechnologyCategoryLabel(category)}
                </button>
            </li>
        `).join('');
        
        const categoryContents = categories.map((category, index) => {
            const categoryTemplates = Object.entries(templates).filter(([key, template]) => 
                template.category === category
            );
            
            return `
                <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" 
                     id="${category}-content" role="tabpanel">
                    <div class="row">
                        ${categoryTemplates.map(([key, template]) => 
                            this.renderTechnologyCard(key, template)
                        ).join('')}
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="mb-4">
                <h5>
                    <i class="bi bi-cpu me-2"></i>Technologie-Templates
                    <span class="badge bg-primary ms-2">${Object.keys(templates).length} Technologien</span>
                </h5>
            </div>
            
            <ul class="nav nav-tabs mb-3" role="tablist">
                ${categoryTabs}
            </ul>
            
            <div class="tab-content">
                ${categoryContents}
            </div>
        `;
    }
    
    // Helper Methods
    static getDistrictTypeLabel(type) {
        const labels = {
            'residential': 'Wohnen',
            'commercial': 'Gewerbe',
            'industrial': 'Industrie',
            'mixed': 'Gemischt'
        };
        return labels[type] || type;
    }
    
    static getPriorityBadgeClass(priority) {
        const classes = {
            'high': 'bg-danger',
            'medium': 'bg-warning',
            'low': 'bg-success'
        };
        return classes[priority] || 'bg-secondary';
    }
    
    static getPriorityLabel(priority) {
        const labels = {
            'high': 'Hoch',
            'medium': 'Mittel',
            'low': 'Niedrig'
        };
        return labels[priority] || priority;
    }
    
    static getTechnologyCategoryLabel(category) {
        const labels = {
            'generation': 'Erzeugung',
            'storage': 'Speicher',
            'conversion': 'Umwandlung'
        };
        return labels[category] || category;
    }
    
    // Placeholder methods for complex rendering components
    static renderEnergyDemandChart(energyDemand) {
        return '<div class="alert alert-info">Energiebedarf-Diagramm wird geladen...</div>';
    }
    
    static renderRenewablePotentialChart(potential, utilized) {
        return '<div class="alert alert-info">EE-Potential-Diagramm wird geladen...</div>';
    }
    
    static renderEnergyMixTabs(energyMix) {
        return '<div class="alert alert-info">Energiemix-Tabs werden geladen...</div>';
    }
    
    static renderRegionalParameters(params) {
        return '<div class="alert alert-info">Regionale Parameter werden geladen...</div>';
    }
    
    static renderEmissionFactors(factors) {
        return '<div class="alert alert-info">Emissionsfaktoren werden geladen...</div>';
    }
    
    static renderTechnicalParameters(params) {
        return '<div class="alert alert-info">Technische Parameter werden geladen...</div>';
    }
    
    static renderAnalysisSettings(settings) {
        return '<div class="alert alert-info">Analyse-Einstellungen werden geladen...</div>';
    }
    
    static renderScenarioPriceTable(scenario) {
        return '<div class="alert alert-info">Preistabelle wird geladen...</div>';
    }
    
    static renderTechnologyCard(key, template) {
        return `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title">${template.name}</h6>
                        <p class="card-text text-muted">${template.technology_type}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Make ConfigView globally available
window.ConfigView = ConfigView;
