/**
 * Analysis Module
 * Handles energy flows, analysis, stakeholders, and scenarios
 */

let stakeholders = [];
let energyScenarios = {};

// Load stakeholders data
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

// Load energy scenarios
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

// Show energy flow modal using new modal manager
async function showEnergyFlowModal(districtId) {
    try {
        Logger.info('Loading energy flows for district:', districtId);
        const data = await apiClient.getDistrictEnergyFlows(districtId);
        
        const content = createEnergyFlowContent(data);
        
        modalManager.createModal('energyFlowModal', 
            `Energiefluss - ${data.district_name}`, 
            content, 
            {
                size: 'modal-lg',
                icon: 'bi-diagram-3',
                headerClass: 'bg-primary text-white'
            }
        );
        
        modalManager.showModal('energyFlowModal');
        Logger.info('Energy flow modal displayed');
        
    } catch (error) {
        Logger.error('Error loading energy flows:', error);
        notificationManager.showError('Fehler beim Laden der Energiefluss-Daten');
    }
}

// Create energy flow content
function createEnergyFlowContent(data) {
    const balance = data.energy_balance;
    const renewable = data.renewable_breakdown;
    const primaryEnergy = data.primary_energy_mix;
    
    return `
        <div class="container-fluid">
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0"><i class="bi bi-lightning-charge"></i> Energiebilanz</h6>
                        </div>
                        <div class="card-body">
                            <ul class="list-unstyled">
                                <li><strong>Gesamtbedarf:</strong> ${formatUtils.formatEnergy(balance.total_demand_mwh)}</li>
                                <li><strong>Gesamtpotential:</strong> ${formatUtils.formatEnergy(balance.total_potential_mwh)}</li>
                                <li><strong>Bilanz:</strong> 
                                    <span class="${balance.balance_mwh >= 0 ? 'text-success' : 'text-danger'}">
                                        ${formatUtils.formatEnergy(balance.balance_mwh)}
                                    </span>
                                </li>
                                <li><strong>Autarkiegrad:</strong> ${formatUtils.formatPercentage(balance.self_sufficiency_ratio * 100)}</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-success text-white">
                            <h6 class="mb-0"><i class="bi bi-arrow-repeat"></i> Import/Export</h6>
                        </div>
                        <div class="card-body">
                            <ul class="list-unstyled">
                                <li><strong>Import:</strong> 
                                    <span class="text-danger">${formatUtils.formatEnergy(data.import_export.import_mwh)}</span>
                                </li>
                                <li><strong>Export:</strong> 
                                    <span class="text-success">${formatUtils.formatEnergy(data.import_export.export_mwh)}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-warning text-dark">
                            <h6 class="mb-0"><i class="bi bi-pie-chart"></i> Energiemix</h6>
                        </div>
                        <div class="card-body">
                            ${createEnergyMixDisplay(primaryEnergy)}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-success text-white">
                            <h6 class="mb-0"><i class="bi bi-sun"></i> Erneuerbare Energien</h6>
                        </div>
                        <div class="card-body">
                            ${createRenewableDisplay(renewable)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Create energy mix display
function createEnergyMixDisplay(primaryEnergy) {
    if (!primaryEnergy || Object.keys(primaryEnergy).length === 0) {
        return '<p class="text-muted">Keine Daten verfügbar</p>';
    }
    
    return Object.entries(primaryEnergy).map(([source, data]) => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span>${getEnergySourceLabel(source)}:</span>
            <div>
                <span class="fw-bold">${formatUtils.formatEnergy(data.value_mwh)}</span>
                <small class="text-muted">(${formatUtils.formatPercentage(data.percentage)})</small>
            </div>
        </div>
    `).join('');
}

// Create renewable energy display
function createRenewableDisplay(renewable) {
    if (!renewable || Object.keys(renewable).length === 0) {
        return '<p class="text-muted">Keine Daten verfügbar</p>';
    }
    
    return Object.entries(renewable).map(([source, value]) => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span>${getRenewableSourceLabel(source)}:</span>
            <span class="fw-bold">${formatUtils.formatEnergy(value)}</span>
        </div>
    `).join('');
}

// Get energy source label
function getEnergySourceLabel(source) {
    const labels = {
        electricity: 'Strom',
        heating: 'Wärme',
        gas: 'Gas',
        oil: 'Öl',
        biomass: 'Biomasse'
    };
    return labels[source] || source;
}

// Get renewable source label
function getRenewableSourceLabel(source) {
    const labels = {
        solar_pv_mwh: 'Solar PV',
        wind_mwh: 'Wind',
        biomass_mwh: 'Biomasse',
        geothermal_mwh: 'Geothermie'
    };
    return labels[source] || source;
}

// Show stakeholders modal using new modal manager
function showStakeholders() {
    const container = document.createElement('div');
    
    if (stakeholders.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Keine Stakeholder-Daten verfügbar</p>';
    } else {
        const html = stakeholders.map(stakeholder => {
            const influenceColor = stakeholder.influence_level === 'high' ? 'success' : 
                                 stakeholder.influence_level === 'low' ? 'warning' : 'info';
                                 
            return `
                <div class="col-md-6 mb-3">
                    <div class="card stakeholder-card">
                        <div class="card-body">
                            <h6 class="card-title">${stakeholder.name}</h6>
                            <p class="card-text small">${stakeholder.category}</p>
                            <span class="badge bg-${influenceColor}">${stakeholder.influence_level} Einfluss</span>
                            <span class="badge bg-secondary">${stakeholder.participation_willingness} Bereitschaft</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        container.innerHTML = `<div class="row">${html}</div>`;
    }
    
    modalManager.createModal('stakeholderModal', 
        'Stakeholder Übersicht', 
        container.innerHTML, 
        {
            size: 'modal-xl',
            icon: 'bi-people',
            headerClass: 'bg-info text-white'
        }
    );
    
    modalManager.showModal('stakeholderModal');
}

// Show scenarios modal using new modal manager
function showScenarios() {
    const container = document.createElement('div');
    
    if (Object.keys(energyScenarios).length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Keine Szenario-Daten verfügbar</p>';
    } else {
        const html = Object.entries(energyScenarios).map(([key, scenario]) => `
            <div class="col-md-4 mb-3">
                <div class="card scenario-card h-100" onclick="selectScenario('${key}')">
                    <div class="card-body">
                        <h6 class="card-title">${scenario.name}</h6>
                        <p class="card-text small">${scenario.description}</p>
                        <div class="mt-3">
                            <small class="text-muted">Strom 2030:</small>
                            <div class="fw-bold">${scenario.electricity_prices['2030']} €/kWh</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        container.innerHTML = `<div class="row">${html}</div>`;
    }
    
    modalManager.createModal('scenarioModal', 
        'Energie-Szenarien', 
        container.innerHTML, 
        {
            size: 'modal-xl',
            icon: 'bi-graph-up',
            headerClass: 'bg-warning text-dark'
        }
    );
    
    modalManager.showModal('scenarioModal');
}

// Select scenario
function selectScenario(scenarioKey) {
    const scenario = energyScenarios[scenarioKey];
    notificationManager.showSuccess(`Szenario "${scenario.name}" ausgewählt`);
    
    // Store selected scenario
    localStorage.setItem('selectedEnergyScenario', JSON.stringify({key: scenarioKey, ...scenario}));
    modalManager.hideModal('scenarioModal');
}

// Show energy balance using new modal manager
async function showEnergyBalance() {
    try {
        Logger.info('Loading energy balance...');
        const [energyData, co2Data] = await Promise.all([
            apiClient.getEnergyBalance(),
            apiClient.getCO2Emissions()
        ]);
        
        const content = createEnergyBalanceContent(energyData, co2Data);
        
        modalManager.createModal('energyBalanceModal', 
            'Gesamte Energiebilanz', 
            content, 
            {
                size: 'modal-xl',
                icon: 'bi-bar-chart',
                headerClass: 'bg-success text-white'
            }
        );
        
        modalManager.showModal('energyBalanceModal');
        Logger.info('Energy balance modal displayed');
        
    } catch (error) {
        Logger.error('Error loading energy balance:', error);
        notificationManager.showError('Fehler beim Laden der Energiebilanz');
    }
}

// Create energy balance content
function createEnergyBalanceContent(energyData, co2Data) {
    return `
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-6">
                    <h6>Energiebilanz</h6>
                    <ul class="list-unstyled">
                        <li><strong>Gesamtverbrauch:</strong> ${formatUtils.formatEnergy(energyData.total_consumption_mwh)}</li>
                        <li><strong>Gesamtproduktion:</strong> ${formatUtils.formatEnergy(energyData.total_production_potential_mwh)}</li>
                        <li><strong>Bilanz:</strong> 
                            <span class="${energyData.balance_mwh >= 0 ? 'text-success' : 'text-danger'}">
                                ${formatUtils.formatEnergy(energyData.balance_mwh)}
                            </span>
                        </li>
                        <li><strong>Autarkiegrad:</strong> ${formatUtils.formatPercentage(energyData.self_sufficiency_percentage)}</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h6>CO₂-Emissionen</h6>
                    <ul class="list-unstyled">
                        <li><strong>Aktuelle Emissionen:</strong> ${formatUtils.formatNumber(co2Data.current_emissions_tons, 0)} t CO₂</li>
                        <li><strong>Mit Erneuerbaren:</strong> ${formatUtils.formatNumber(co2Data.renewable_emissions_tons, 0)} t CO₂</li>
                        <li><strong>Einsparung:</strong> 
                            <span class="text-success">${formatUtils.formatNumber(co2Data.savings_tons, 0)} t CO₂</span>
                        </li>
                        <li><strong>Reduktion:</strong> ${formatUtils.formatPercentage(co2Data.reduction_percentage)}</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// Show detailed analysis using new modal manager
async function showDetailedAnalysis() {
    try {
        Logger.info('Loading detailed analysis...');
        const data = await apiClient.getDetailedAnalysis();
        
        const content = createDetailedAnalysisContent(data);
        
        modalManager.createModal('detailedAnalysisModal', 
            'Detaillierte Analyse', 
            content, 
            {
                size: 'modal-xl',
                icon: 'bi-graph-up-arrow',
                headerClass: 'bg-primary text-white'
            }
        );
        
        modalManager.showModal('detailedAnalysisModal');
        Logger.info('Detailed analysis modal displayed');
        
    } catch (error) {
        Logger.error('Error loading detailed analysis:', error);
        notificationManager.showError('Fehler beim Laden der detaillierten Analyse');
    }
}

// Create detailed analysis content
function createDetailedAnalysisContent(data) {
    return `
        <div class="container-fluid">
            <div class="row mb-4">
                <div class="col-12">
                    <div class="alert alert-info">
                        <h6 class="alert-heading">Zusammenfassung</h6>
                        <p class="mb-0">Detaillierte Analyse aller Quartiere mit Energiebilanz, Potentialen und Empfehlungen.</p>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Gesamtübersicht</h6>
                        </div>
                        <div class="card-body">
                            <ul class="list-unstyled">
                                <li><strong>Quartiere gesamt:</strong> ${data.total_districts || districts.length}</li>
                                <li><strong>Gesamtbevölkerung:</strong> ${formatUtils.formatNumber(data.total_population || 0)}</li>
                                <li><strong>Gesamtfläche:</strong> ${formatUtils.formatNumber(data.total_area_km2 || 0, 1)} km²</li>
                                <li><strong>Energieverbrauch:</strong> ${formatUtils.formatEnergy(data.total_consumption_mwh || 0)}</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Erneuerbare Potentiale</h6>
                        </div>
                        <div class="card-body">
                            <ul class="list-unstyled">
                                <li><strong>Solar PV:</strong> ${formatUtils.formatEnergy(data.renewable_potential?.solar_pv_mwh || 0)}</li>
                                <li><strong>Wind:</strong> ${formatUtils.formatEnergy(data.renewable_potential?.wind_mwh || 0)}</li>
                                <li><strong>Biomasse:</strong> ${formatUtils.formatEnergy(data.renewable_potential?.biomass_mwh || 0)}</li>
                                <li><strong>Geothermie:</strong> ${formatUtils.formatEnergy(data.renewable_potential?.geothermal_mwh || 0)}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
