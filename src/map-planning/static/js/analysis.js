// Analysis and Modals Module
// Handles energy flows, analysis, stakeholders, and scenarios

let stakeholders = [];
let energyScenarios = {};

// Load stakeholders data
async function loadStakeholders() {
    try {
        const response = await fetch('/api/stakeholders');
        stakeholders = await response.json();
        console.log(`Loaded ${stakeholders.length} stakeholders`);
    } catch (error) {
        console.error('Error loading stakeholders:', error);
    }
}

// Load energy scenarios
async function loadEnergyScenarios() {
    try {
        const response = await fetch('/api/energy-scenarios');
        energyScenarios = await response.json();
        console.log('Loaded energy scenarios:', Object.keys(energyScenarios).length);
    } catch (error) {
        console.error('Error loading energy scenarios:', error);
    }
}

// Show energy flow modal
async function showEnergyFlowModal(districtId) {
    try {
        const response = await fetch(`/api/districts/${districtId}/energy-flows`);
        const data = await response.json();
        
        // Create and show modal
        const modalHtml = `
            <div class="modal fade" id="energyFlowModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-diagram-3"></i> 
                                Energiefluss - ${data.district_name}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${createEnergyFlowContent(data)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal and add new one
        const existingModal = document.getElementById('energyFlowModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        new bootstrap.Modal(document.getElementById('energyFlowModal')).show();
        
    } catch (error) {
        console.error('Error loading energy flow:', error);
        showToast('Fehler beim Laden des Energieflusses', 'error');
    }
}

// Create energy flow content
function createEnergyFlowContent(data) {
    return `
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0"><i class="bi bi-info-circle"></i> Quartier-Information</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">
                                <strong>Name:</strong> ${data.district_name}<br>
                                <strong>Typ:</strong> ${data.district_type}<br>
                                <strong>Bevölkerung:</strong> ${data.population.toLocaleString()}
                            </div>
                            <div class="col-6">
                                <strong>Fläche:</strong> ${data.area_km2} km²<br>
                                <strong>Dichte:</strong> ${(data.population / data.area_km2).toFixed(0)} Einw./km²
                            </div>
                        </div>
                        <p class="small">${data.additional_data?.description || 'Keine Beschreibung verfügbar'}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header bg-danger text-white">
                        <h6 class="mb-0"><i class="bi bi-arrow-down"></i> Energiebedarf</h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Strom:</span>
                                <strong>${(data.energy_flows.electricity_demand_mwh || 0).toLocaleString()} MWh/Jahr</strong>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Wärme:</span>
                                <strong>${(data.energy_flows.heating_demand_mwh || 0).toLocaleString()} MWh/Jahr</strong>
                            </div>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between">
                            <span class="fw-bold">Gesamt:</span>
                            <strong class="text-danger">${(data.energy_flows.total_demand_mwh || 0).toLocaleString()} MWh/Jahr</strong>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="bi bi-arrow-up"></i> EE-Potenzial</h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Solar PV:</span>
                                <strong>${(data.energy_flows.solar_pv_potential_mwh || 0).toLocaleString()} MWh/Jahr</strong>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Solar Thermal:</span>
                                <strong>${(data.energy_flows.solar_thermal_potential_mwh || 0).toLocaleString()} MWh/Jahr</strong>
                            </div>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between">
                            <span class="fw-bold">Gesamt:</span>
                            <strong class="text-success">${(data.energy_flows.total_potential_mwh || 0).toLocaleString()} MWh/Jahr</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header ${data.energy_flows.balance_mwh >= 0 ? 'bg-success' : 'bg-warning'} text-white">
                        <h6 class="mb-0">
                            <i class="bi bi-${data.energy_flows.balance_mwh >= 0 ? 'check-circle' : 'exclamation-triangle'}"></i>
                            Energiebilanz
                        </h6>
                    </div>
                    <div class="card-body text-center">
                        <h3 class="${data.energy_flows.balance_mwh >= 0 ? 'text-success' : 'text-warning'}">
                            ${data.energy_flows.balance_mwh >= 0 ? '+' : ''}${(data.energy_flows.balance_mwh || 0).toFixed(1)} MWh/Jahr
                        </h3>
                        <p class="mb-0">
                            ${data.energy_flows.balance_mwh >= 0 
                                ? 'Dieses Quartier kann mehr Energie erzeugen als verbraucht wird' 
                                : 'Dieses Quartier benötigt zusätzliche Energie von außen'}
                        </p>
                        <small class="text-muted">
                            Autarkiegrad: ${((data.energy_flows.total_potential_mwh / data.energy_flows.total_demand_mwh) * 100).toFixed(1)}%
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Show detail analysis
async function showDetailAnalysis(districtId) {
    console.log('showDetailAnalysis called with districtId:', districtId);
    try {
        // Show modal with loading state
        const modal = new bootstrap.Modal(document.getElementById('energyFlowModal'));
        modal.show();
        
        // Load energy flow data using the correct endpoint
        const response = await fetch(`/api/districts/${districtId}/energy-flows`);
        if (!response.ok) {
            throw new Error('Daten konnten nicht geladen werden');
        }
        
        const energyFlowData = await response.json();
        console.log('Energy flow data loaded:', energyFlowData);
        
        // Create energy flow content
        createEnergyFlowContent(energyFlowData);
        
    } catch (error) {
        console.error('Error loading energy flow data:', error);
        document.getElementById('energyFlowContent').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                <strong>Fehler:</strong> ${error.message}
            </div>
        `;
    }
}

// Create energy flow content for detail analysis modal
function createEnergyFlowContent(data) {
    const content = document.getElementById('energyFlowContent');
    
    const totalDemand = data.energy_demand?.total_annual_mwh || 0;
    const totalGeneration = data.current_generation?.total_generation_mwh || 0;
    const totalPotential = data.renewable_potential?.total_potential_mwh || 0;
    const renewableShare = totalDemand > 0 ? Math.round((totalGeneration / totalDemand) * 100) : 0;
    
    content.innerHTML = `
        <!-- Quartier Header -->
        <div class="row mb-4">
            <div class="col-md-8">
                <h4>${data.name}</h4>
                <p class="text-muted">
                    ${data.district_type.toUpperCase()} • ${data.population?.toLocaleString()} Einwohner • ${data.area_km2} km²
                </p>
                <p class="small">${data.additional_data?.description || 'Keine Beschreibung verfügbar'}</p>
            </div>
            <div class="col-md-4">
                <div class="card bg-primary text-white">
                    <div class="card-body text-center">
                        <h6>Energiebilanz</h6>
                        <h3>${(totalGeneration - totalDemand > 0 ? '+' : '')}${(totalGeneration - totalDemand).toLocaleString()} MWh</h3>
                        <small>${totalGeneration >= totalDemand ? 'Energieüberschuss' : 'Energiedefizit'}</small>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Energy Metrics -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h6 class="card-title text-danger">Stromverbrauch</h6>
                        <h4>${(data.energy_demand?.electricity_mwh || 0).toLocaleString()} MWh</h4>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h6 class="card-title text-warning">Wärmeverbrauch</h6>
                        <h4>${(data.energy_demand?.heating_mwh || 0).toLocaleString()} MWh</h4>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h6 class="card-title text-success">EE-Erzeugung</h6>
                        <h4>${totalGeneration.toLocaleString()} MWh</h4>
                        <small class="text-muted">${renewableShare}% des Bedarfs</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h6 class="card-title text-info">EE-Potential</h6>
                        <h4>${totalPotential.toLocaleString()} MWh</h4>
                        <small class="text-muted">${totalPotential > 0 ? Math.round((totalGeneration / totalPotential) * 100) : 0}% genutzt</small>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Primary Energy Mix -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6><i class="bi bi-fire text-warning"></i> Wärme-Primärenergie</h6>
                    </div>
                    <div class="card-body">
                        ${createPrimaryEnergyTable(data.primary_energy?.heating || {}, 'heating')}
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6><i class="bi bi-lightning text-primary"></i> Strom-Primärenergie</h6>
                    </div>
                    <div class="card-body">
                        ${createPrimaryEnergyTable(data.primary_energy?.electricity || {}, 'electricity')}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Renewable Energy Details -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h6><i class="bi bi-sun text-success"></i> Erneuerbare Energien - Potential vs. Nutzung</h6>
                    </div>
                    <div class="card-body">
                        ${createRenewableTable(data.renewable_potential || {}, data.current_generation || {})}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Create primary energy table
function createPrimaryEnergyTable(primaryData, type) {
    const total = primaryData.total_mwh || 0;
    if (total === 0) return '<p class="text-muted">Keine Daten verfügbar</p>';
    
    let html = '<div class="table-responsive"><table class="table table-sm">';
    
    Object.entries(primaryData).forEach(([key, value]) => {
        if (key !== 'total_mwh' && value > 0) {
            const name = key.replace('_mwh', '').replace('_', ' ');
            const percentage = Math.round((value / total) * 100);
            const displayName = getDetailedEnergySourceDisplayName(name);
            const color = getDetailedEnergySourceColor(name);
            
            html += `
                <tr>
                    <td>
                        <span class="badge" style="background-color: ${color};">&nbsp;</span>
                        ${displayName}
                    </td>
                    <td class="text-end">${value.toLocaleString()} MWh</td>
                    <td class="text-end">${percentage}%</td>
                    <td style="width: 100px;">
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar" style="width: ${percentage}%; background-color: ${color};" role="progressbar"></div>
                        </div>
                    </td>
                </tr>
            `;
        }
    });
    
    html += '</table></div>';
    return html;
}

// Create renewable energy comparison table
function createRenewableTable(potential, current) {
    const renewableTypes = [
        { key: 'solar_pv', name: 'Solar PV', color: '#ffc107' },
        { key: 'solar_thermal', name: 'Solar Thermal', color: '#fd7e14' },
        { key: 'small_wind', name: 'Kleinwind', color: '#20c997' },
        { key: 'biomass', name: 'Biomasse', color: '#198754' },
        { key: 'geothermal', name: 'Geothermie', color: '#6f42c1' }
    ];
    
    let html = '<div class="table-responsive"><table class="table table-sm">';
    html += `
        <thead>
            <tr>
                <th>Technologie</th>
                <th class="text-end">Potential</th>
                <th class="text-end">Genutzt</th>
                <th class="text-end">Auslastung</th>
                <th style="width: 150px;">Fortschritt</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    renewableTypes.forEach(type => {
        const potentialValue = potential[`${type.key}_mwh`] || 0;
        const currentValue = current[`${type.key}_mwh`] || 0;
        const utilization = potentialValue > 0 ? Math.round((currentValue / potentialValue) * 100) : 0;
        
        if (potentialValue > 0 || currentValue > 0) {
            html += `
                <tr>
                    <td>
                        <span class="badge" style="background-color: ${type.color};">&nbsp;</span>
                        ${type.name}
                    </td>
                    <td class="text-end">${potentialValue.toFixed(1)} MWh</td>
                    <td class="text-end">${currentValue.toFixed(1)} MWh</td>
                    <td class="text-end">${utilization}%</td>
                    <td>
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar" style="width: ${Math.min(utilization, 100)}%; background-color: ${type.color};" role="progressbar">
                                ${utilization > 10 ? utilization + '%' : ''}
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }
    });
    
    html += '</tbody></table></div>';
    return html;
}

// Helper functions for detailed energy source display
function getDetailedEnergySourceDisplayName(name) {
    const mapping = {
        'gas': 'Erdgas',
        'oil': 'Heizöl',
        'heat pump': 'Wärmepumpe',
        'biomass': 'Biomasse',
        'district heating': 'Fernwärme',
        'direct electric': 'Direktstrom',
        'grid': 'Stromnetz',
        'solar pv': 'Solar PV',
        'other renewables': 'Sonstige EE'
    };
    return mapping[name] || name.charAt(0).toUpperCase() + name.slice(1);
}

function getDetailedEnergySourceColor(name) {
    const mapping = {
        'gas': '#dc3545',
        'oil': '#6f42c1',
        'heat pump': '#20c997',
        'biomass': '#198754',
        'district heating': '#fd7e14',
        'direct electric': '#0d6efd',
        'grid': '#6c757d',
        'solar pv': '#ffc107',
        'other renewables': '#20c997'
    };
    return mapping[name] || '#6c757d';
}

// Show stakeholders modal
function showStakeholders() {
    const container = document.getElementById('stakeholderContent');
    
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
    
    new bootstrap.Modal(document.getElementById('stakeholderModal')).show();
}

// Show scenarios modal
function showScenarios() {
    const container = document.getElementById('scenarioContent');
    
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
    
    new bootstrap.Modal(document.getElementById('scenarioModal')).show();
}

// Select scenario
function selectScenario(scenarioKey) {
    const scenario = energyScenarios[scenarioKey];
    showToast(`Szenario "${scenario.name}" ausgewählt`, 'success');
    
    // Store selected scenario
    localStorage.setItem('selectedEnergyScenario', JSON.stringify({key: scenarioKey, ...scenario}));
}

// Show energy balance
async function showEnergyBalance() {
    try {
        const [energyResponse, co2Response] = await Promise.all([
            fetch('/api/analysis/energy-balance'),
            fetch('/api/analysis/co2-emissions')
        ]);
        
        const energyData = await energyResponse.json();
        const co2Data = await co2Response.json();
        
        const container = document.getElementById('analysisContent');
        container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Energiebilanz</h6>
                    <ul class="list-unstyled">
                        <li><strong>Gesamtverbrauch:</strong> ${Math.round(energyData.total_consumption_mwh)} MWh</li>
                        <li><strong>EE-Potenzial:</strong> ${Math.round(energyData.total_production_potential_mwh)} MWh</li>
                        <li><strong>Bilanz:</strong> ${Math.round(energyData.balance_mwh)} MWh</li>
                        <li><strong>Autarkiegrad:</strong> ${(energyData.self_sufficiency_ratio * 100).toFixed(1)}%</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h6>CO2-Emissionen</h6>
                    <ul class="list-unstyled">
                        <li><strong>Gesamtemissionen:</strong> ${Math.round(co2Data.total_emissions_tons)} t CO2/Jahr</li>
                        <li><strong>Emissionsfaktor:</strong> ${co2Data.emission_factor_kg_per_kwh} kg CO2/kWh</li>
                        <li><strong>Raster analysiert:</strong> ${co2Data.districts_analyzed}</li>
                    </ul>
                </div>
            </div>
        `;
        
        new bootstrap.Modal(document.getElementById('analysisModal')).show();
    } catch (error) {
        console.error('Error loading analysis:', error);
        showToast('Fehler beim Laden der Analyse', 'error');
    }
}
