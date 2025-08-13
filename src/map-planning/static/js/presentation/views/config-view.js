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
                        <div id="quartiere-container" style="max-height: calc(100vh - 280px); overflow-y: auto; padding-right: 10px;">
                            <div class="d-flex justify-content-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Lade Quartiere...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="system-content" role="tabpanel">
                        <div id="system-container" style="max-height: calc(100vh - 280px); overflow-y: auto; padding-right: 10px;">
                            <div class="d-flex justify-content-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Lade System-Parameter...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="technologien-content" role="tabpanel">
                        <div id="technologien-container" style="max-height: calc(100vh - 280px); overflow-y: auto; padding-right: 10px;">
                            <div class="d-flex justify-content-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Lade Technologien...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="stakeholder-templates-content" role="tabpanel">
                        <div id="stakeholder-templates-container" style="max-height: calc(100vh - 280px); overflow-y: auto; padding-right: 10px;">
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
        console.log('renderEnergyScenarios called with:', scenarios);
        
        // Handle different data structures
        let scenarioData = scenarios;
        if (scenarios && scenarios.scenarios) {
            scenarioData = scenarios.scenarios;
        }
        
        if (!scenarioData || typeof scenarioData !== 'object' || Object.keys(scenarioData).length === 0) {
            return `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Keine Energiepreis-Szenarien verfügbar
                </div>
            `;
        }
        
        const scenarioCards = Object.entries(scenarioData).map(([key, scenario]) => {
            console.log(`Processing scenario ${key}:`, scenario);
            return `
                <div class="col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-light">
                            <h6 class="mb-0 text-primary">${scenario.name || key}</h6>
                        </div>
                        <div class="card-body">
                            <p class="text-muted mb-3">${scenario.description || 'Keine Beschreibung verfügbar'}</p>
                            ${this.renderScenarioPriceTable(scenario)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        const scenarioCount = Object.keys(scenarioData).length;
        
        return `
            <div class="mb-4">
                <h5>
                    <i class="bi bi-graph-up me-2"></i>Energiepreis-Szenarien
                    <span class="badge bg-primary ms-2">${scenarioCount} Szenarien</span>
                </h5>
                <p class="text-muted">Übersicht der konfigurierten Preisszenarien für die Energieplanung</p>
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
        if (!params || !params.location) return '<div class="alert alert-warning">Keine regionalen Parameter verfügbar</div>';
        
        const location = params.location || {};
        const weatherData = params.weather_data || {};
        const economicData = params.economic_data || {};
        const regulatory = params.regulatory_framework || {};
        
        return `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">📍 Standort</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-5">Stadt:</dt>
                        <dd class="col-sm-7">${location.name || 'N/A'}</dd>
                        <dt class="col-sm-5">Koordinaten:</dt>
                        <dd class="col-sm-7">${location.latitude || 'N/A'}°N, ${location.longitude || 'N/A'}°E</dd>
                        <dt class="col-sm-5">Höhe:</dt>
                        <dd class="col-sm-7">${location.elevation_m || 'N/A'} m ü. NN</dd>
                        <dt class="col-sm-5">Klimazone:</dt>
                        <dd class="col-sm-7">${location.climate_zone || 'N/A'}</dd>
                    </dl>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">🌤️ Wetter</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-6">Ø Temperatur:</dt>
                        <dd class="col-sm-6">${weatherData.avg_temperature_celsius || 'N/A'}°C</dd>
                        <dt class="col-sm-6">Heizgradtage:</dt>
                        <dd class="col-sm-6">${window.formatUtils.formatNumber(weatherData.heating_degree_days) || 'N/A'}</dd>
                        <dt class="col-sm-6">Solarstrahlung:</dt>
                        <dd class="col-sm-6">${weatherData.solar_irradiation_kwh_per_m2 || 'N/A'} kWh/m²</dd>
                        <dt class="col-sm-6">Windgeschw.:</dt>
                        <dd class="col-sm-6">${weatherData.wind_speed_avg_m_per_s || 'N/A'} m/s</dd>
                    </dl>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">💼 Wirtschaftsdaten</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-6">Medianeinkommen:</dt>
                        <dd class="col-sm-6">${window.formatUtils.formatCurrency(economicData.median_income_eur) || 'N/A'}</dd>
                        <dt class="col-sm-6">Arbeitslosigkeit:</dt>
                        <dd class="col-sm-6">${economicData.unemployment_rate_pct || 'N/A'}%</dd>
                        <dt class="col-sm-6">Immobilienpreise:</dt>
                        <dd class="col-sm-6">${window.formatUtils.formatCurrency(economicData.property_prices_eur_per_m2) || 'N/A'}/m²</dd>
                        <dt class="col-sm-6">Gewerbesteuer:</dt>
                        <dd class="col-sm-6">${economicData.business_tax_rate_pct || 'N/A'}%</dd>
                    </dl>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">⚖️ Rechtlicher Rahmen</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-6">EEG:</dt>
                        <dd class="col-sm-6">${regulatory.renewable_energy_law || 'N/A'}</dd>
                        <dt class="col-sm-6">GEG:</dt>
                        <dd class="col-sm-6">${regulatory.building_energy_law || 'N/A'}</dd>
                        <dt class="col-sm-6">CO₂-Budget:</dt>
                        <dd class="col-sm-6">${window.formatUtils.formatNumber(regulatory.co2_budget_tons) || 'N/A'} t/Jahr</dd>
                        <dt class="col-sm-6">EE-Ziel 2030:</dt>
                        <dd class="col-sm-6">${regulatory.renewable_target_pct || 'N/A'}%</dd>
                    </dl>
                </div>
            </div>
        `;
    }
    
    static renderEmissionFactors(factors) {
        if (!factors || Object.keys(factors).length === 0) return '<div class="alert alert-warning">Keine Emissionsfaktoren verfügbar</div>';
        
        const factorItems = Object.entries(factors).map(([key, value]) => {
            const label = this.getEmissionFactorLabel(key);
            const formattedValue = typeof value === 'number' ? value.toFixed(3) : value;
            return `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span class="text-muted">${label}:</span>
                    <span class="fw-bold">${formattedValue} kg CO₂/kWh</span>
                </div>
            `;
        }).join('');
        
        return `
            <div class="emission-factors">
                ${factorItems}
                <div class="mt-3">
                    <small class="text-muted">
                        <i class="bi bi-info-circle me-1"></i>
                        Faktoren basierend auf aktuellen deutschen Durchschnittswerten
                    </small>
                </div>
            </div>
        `;
    }
    
    static renderTechnicalParameters(params) {
        if (!params || Object.keys(params).length === 0) return '<div class="alert alert-warning">Keine technischen Parameter verfügbar</div>';
        
        return `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">⏱️ Planungsparameter</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-7">Planungshorizont:</dt>
                        <dd class="col-sm-5">${params.planning_horizon_years || 'N/A'} Jahre</dd>
                        <dt class="col-sm-7">Diskontierungssatz:</dt>
                        <dd class="col-sm-5">${((params.discount_rate || 0) * 100).toFixed(1)}%</dd>
                        <dt class="col-sm-7">Inflationsrate:</dt>
                        <dd class="col-sm-5">${((params.inflation_rate || 0) * 100).toFixed(1)}%</dd>
                    </dl>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">⚡ Systemparameter</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-7">Netzeffizienz:</dt>
                        <dd class="col-sm-5">${((params.grid_efficiency || 0) * 100).toFixed(1)}%</dd>
                        <dt class="col-sm-7">Speichereffizienz:</dt>
                        <dd class="col-sm-5">${((params.storage_efficiency || 0) * 100).toFixed(1)}%</dd>
                        <dt class="col-sm-7">Spitzenlastfaktor:</dt>
                        <dd class="col-sm-5">${params.peak_load_factor || 'N/A'}</dd>
                    </dl>
                </div>
            </div>
            <div class="mt-3">
                <small class="text-muted">
                    <i class="bi bi-gear me-1"></i>
                    Diese Parameter werden für alle Berechnungen und Analysen verwendet
                </small>
            </div>
        `;
    }
    
    static renderAnalysisSettings(settings) {
        if (!settings || Object.keys(settings).length === 0) return '<div class="alert alert-warning">Keine Analyse-Einstellungen verfügbar</div>';
        
        const energyBalance = settings.energy_balance || {};
        const co2Analysis = settings.co2_analysis || {};
        const economicAnalysis = settings.economic_analysis || {};
        const stakeholderAnalysis = settings.stakeholder_analysis || {};
        
        return `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">⚡ Energiebilanz</h6>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" ${energyBalance.include_storage ? 'checked' : ''} disabled>
                        <label class="form-check-label">Speicher einbeziehen</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" ${energyBalance.seasonal_adjustment ? 'checked' : ''} disabled>
                        <label class="form-check-label">Saisonale Anpassung</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" ${energyBalance.grid_import_export ? 'checked' : ''} disabled>
                        <label class="form-check-label">Netz-Import/Export</label>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">🌱 CO₂-Analyse</h6>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" ${co2Analysis.include_upstream_emissions ? 'checked' : ''} disabled>
                        <label class="form-check-label">Vorgelagerte Emissionen</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" ${co2Analysis.lifecycle_assessment ? 'checked' : ''} disabled>
                        <label class="form-check-label">Lebenszyklus-Bewertung</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" ${co2Analysis.carbon_budget_tracking ? 'checked' : ''} disabled>
                        <label class="form-check-label">CO₂-Budget-Tracking</label>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">💰 Wirtschaftsanalyse</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-8">Externalitäten:</dt>
                        <dd class="col-sm-4">${economicAnalysis.include_externalities ? 'Ja' : 'Nein'}</dd>
                        <dt class="col-sm-8">CO₂-Kosten:</dt>
                        <dd class="col-sm-4">${economicAnalysis.social_cost_of_carbon || 'N/A'} €/t</dd>
                        <dt class="col-sm-8">Sozialer Diskont:</dt>
                        <dd class="col-sm-4">${((economicAnalysis.discount_rate_social || 0) * 100).toFixed(1)}%</dd>
                    </dl>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">👥 Stakeholder-Analyse</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-6">Hoch:</dt>
                        <dd class="col-sm-6">Gewichtung ${stakeholderAnalysis.influence_weighting?.high || 'N/A'}</dd>
                        <dt class="col-sm-6">Mittel:</dt>
                        <dd class="col-sm-6">Gewichtung ${stakeholderAnalysis.influence_weighting?.medium || 'N/A'}</dd>
                        <dt class="col-sm-6">Niedrig:</dt>
                        <dd class="col-sm-6">Gewichtung ${stakeholderAnalysis.influence_weighting?.low || 'N/A'}</dd>
                        <dt class="col-sm-6">Beteiligungsbonus:</dt>
                        <dd class="col-sm-6">${stakeholderAnalysis.participation_bonus || 'N/A'}</dd>
                    </dl>
                </div>
            </div>
        `;
    }
    
    static renderScenarioPriceTable(scenario) {
        console.log('renderScenarioPriceTable called with:', scenario);
        
        if (!scenario || typeof scenario !== 'object') {
            return '<div class="alert alert-warning">Keine Preisdaten verfügbar</div>';
        }
        
        const years = [2025, 2030, 2040, 2050];
        const priceTypes = [
            { key: 'electricity_prices', label: 'Strom', unit: '€/kWh', color: 'primary' },
            { key: 'gas_prices', label: 'Gas', unit: '€/kWh', color: 'info' },
            { key: 'heat_prices', label: 'Fernwärme', unit: '€/kWh', color: 'warning' },
            { key: 'co2_prices', label: 'CO₂', unit: '€/t', color: 'success' }
        ];
        
        const tableRows = priceTypes.map(priceType => {
            const prices = scenario[priceType.key] || {};
            console.log(`Processing ${priceType.key}:`, prices);
            
            const yearCells = years.map(year => {
                const price = prices[year];
                let formattedPrice = 'N/A';
                
                if (price !== undefined && price !== null) {
                    if (priceType.unit === '€/t') {
                        formattedPrice = window.formatUtils.formatNumber(price, 0);
                    } else {
                        formattedPrice = price.toFixed(3);
                    }
                }
                
                return `<td class="text-center">${formattedPrice}</td>`;
            }).join('');
            
            return `
                <tr>
                    <td>
                        <span class="badge bg-${priceType.color} me-2">●</span>
                        ${priceType.label}
                    </td>
                    ${yearCells}
                    <td class="text-muted small">${priceType.unit}</td>
                </tr>
            `;
        }).join('');
        
        return `
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    <thead class="table-light">
                        <tr>
                            <th style="width: 25%;">Energieträger</th>
                            <th class="text-center" style="width: 15%;">2025</th>
                            <th class="text-center" style="width: 15%;">2030</th>
                            <th class="text-center" style="width: 15%;">2040</th>
                            <th class="text-center" style="width: 15%;">2050</th>
                            <th style="width: 15%;">Einheit</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
            <div class="mt-2">
                <small class="text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    Alle Preise sind Endkundenpreise inkl. Steuern und Abgaben
                </small>
            </div>
        `;
    }
    
    // Helper method for emission factor labels
    static getEmissionFactorLabel(key) {
        const labels = {
            'electricity_grid_kg_co2_per_kwh': 'Strommix Deutschland',
            'gas_kg_co2_per_kwh': 'Erdgas',
            'heating_oil_kg_co2_per_kwh': 'Heizöl',
            'district_heating_kg_co2_per_kwh': 'Fernwärme',
            'biomass_kg_co2_per_kwh': 'Biomasse'
        };
        return labels[key] || key.replace(/_/g, ' ');
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
