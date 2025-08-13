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

// Create stakeholder content for modal
function createStakeholderContent(quartier) {
    let relevantStakeholders;
    
    if (quartier === 'all') {
        relevantStakeholders = stakeholders;
    } else {
        // Since stakeholders don't have quartier property, show all for now
        relevantStakeholders = stakeholders;
    }
    
    if (relevantStakeholders.length === 0) {
        return `
            <div class="text-center">
                <p class="text-muted">Keine Stakeholder-Daten verfügbar.</p>
            </div>
        `;
    }

    return `
        <div class="stakeholder-container">
            ${quartier !== 'all' ? `<h5>Akteure und Interessensgruppen</h5>` : ''}
            <div class="row">
                ${relevantStakeholders.map(stakeholder => `
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">${stakeholder.name}</h6>
                                <p class="card-text"><strong>Kategorie:</strong> ${stakeholder.category}</p>
                                <div class="mt-2">
                                    <span class="badge bg-primary">${stakeholder.category}</span>
                                    <span class="badge bg-info">ID: ${stakeholder.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Create scenario analysis content
function createScenarioContent(quartier) {
    if (!energyScenarios || Object.keys(energyScenarios).length === 0) {
        return `
            <div class="text-center">
                <p class="text-muted">Keine Szenario-Daten verfügbar.</p>
            </div>
        `;
    }

    return `
        <div class="scenario-container">
            ${quartier !== 'all' ? `<h5>Energie-Szenarien</h5>` : ''}
            <div class="row">
                ${Object.entries(energyScenarios).map(([scenarioKey, scenarioData]) => `
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-header">
                                <h6>${formatUtils.toTitle(scenarioData.name || scenarioKey)}</h6>
                            </div>
                            <div class="card-body">
                                <p class="card-text">${scenarioData.description || 'Keine Beschreibung verfügbar'}</p>
                                ${scenarioData.electricity_prices ? `
                                    <div class="mt-2">
                                        <h6>Strompreise:</h6>
                                        <ul class="list-unstyled">
                                            ${Object.entries(scenarioData.electricity_prices).map(([year, price]) => 
                                                `<li><strong>${year}:</strong> ${price} €/kWh</li>`
                                            ).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Create detailed analysis content (matching original format from index_backup.html)
function createEnergyFlowContent(data) {
    console.log('Creating energy flow content with data:', data);
    
    const energyDemand = data.energy_demand || {};
    const renewables = data.renewable_potential || {};
    const additional = data.additional_data || {};
    
    // Calculate totals
    const totalDemand = energyDemand.total_annual_mwh || 
                       (energyDemand.electricity_mwh || 0) + 
                       (energyDemand.heating_mwh || 0) + 
                       (energyDemand.cooling_mwh || 0) + 
                       (energyDemand.transport_mwh || 0);
    
    const currentGeneration = data.current_generation || {};
    const totalGeneration = currentGeneration.total_generation_mwh || 
                           (currentGeneration.solar_pv_mwh || 0) + 
                           (currentGeneration.solar_thermal_mwh || 0) + 
                           (currentGeneration.small_wind_mwh || 0) + 
                           (currentGeneration.biomass_mwh || 0) + 
                           (currentGeneration.chp_mwh || 0) + 
                           (currentGeneration.geothermal_mwh || 0);
    
    const totalPotential = renewables.total_potential_mwh || 
                          (renewables.solar_pv_mwh || 0) + 
                          (renewables.solar_thermal_mwh || 0) + 
                          (renewables.small_wind_mwh || 0) + 
                          (renewables.biomass_mwh || 0) + 
                          (renewables.geothermal_mwh || 0);
    
    const renewableShare = totalDemand > 0 ? Math.round((totalGeneration / totalDemand) * 100) : 0;
    
    return `
        <!-- Quartier Header -->
        <div class="row mb-4">
            <div class="col-md-8">
                <h4>${data.name}</h4>
                <p class="text-muted">
                    ${(data.district_type || '').toUpperCase()} • ${(data.population || 0).toLocaleString()} Einwohner • ${data.area_km2 || 0} km²
                </p>
                <p class="small">${additional.description || data.description || 'Keine Beschreibung verfügbar'}</p>
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
                        <h4>${(energyDemand.electricity_mwh || 0).toLocaleString()} MWh</h4>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h6 class="card-title text-warning">Wärmeverbrauch</h6>
                        <h4>${(energyDemand.heating_mwh || 0).toLocaleString()} MWh</h4>
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
        
        <!-- Detailed Energy Data -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6><i class="bi bi-lightning text-primary"></i> Energieverbrauch</h6>
                    </div>
                    <div class="card-body">
                        <ul class="list-unstyled">
                            <li><strong>Strom Gesamt:</strong> ${(energyDemand.electricity_mwh || 0).toLocaleString()} MWh</li>
                            <li>- Haushalte: ${Math.round((energyDemand.electricity_mwh || 0) * 0.4).toLocaleString()} MWh</li>
                            <li>- Gewerbe: ${Math.round((energyDemand.electricity_mwh || 0) * 0.35).toLocaleString()} MWh</li>
                            <li>- Industrie: ${Math.round((energyDemand.electricity_mwh || 0) * 0.25).toLocaleString()} MWh</li>
                            <li><strong>Wärme Gesamt:</strong> ${(energyDemand.heating_mwh || 0).toLocaleString()} MWh</li>
                            <li>- Raumheizung: ${Math.round((energyDemand.heating_mwh || 0) * 0.75).toLocaleString()} MWh</li>
                            <li>- Warmwasser: ${Math.round((energyDemand.heating_mwh || 0) * 0.25).toLocaleString()} MWh</li>
                            <li><strong>Kühlung:</strong> ${(energyDemand.cooling_mwh || 0).toLocaleString()} MWh</li>
                            <li><strong>Transport:</strong> ${(energyDemand.transport_mwh || 0).toLocaleString()} MWh</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6><i class="bi bi-sun text-warning"></i> Erzeugungspotenzial</h6>
                    </div>
                    <div class="card-body">
                        <ul class="list-unstyled">
                            <li><strong>Solar PV:</strong> ${(renewables.solar_pv_mwh || 0).toLocaleString()} MWh</li>
                            <li><strong>Solarthermie:</strong> ${(renewables.solar_thermal_mwh || 0).toLocaleString()} MWh</li>
                            <li><strong>Kleinwind:</strong> ${(renewables.small_wind_mwh || 0).toLocaleString()} MWh</li>
                            <li><strong>Biomasse:</strong> ${(renewables.biomass_mwh || 0).toLocaleString()} MWh</li>
                            <li><strong>Geothermie:</strong> ${(renewables.geothermal_mwh || 0).toLocaleString()} MWh</li>
                            <li><strong>Gesamt:</strong> ${totalPotential.toLocaleString()} MWh</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Economic Indicators -->
        ${additional.economic_indicators ? `
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h6><i class="bi bi-graph-up text-success"></i> Wirtschaftliche Indikatoren</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">BIP/Kopf: ${(additional.economic_indicators.gdp_per_capita || 0).toLocaleString()} €</div>
                            <div class="col-6">Arbeitslosigkeit: ${((additional.economic_indicators.unemployment_rate || 0) * 100).toFixed(1)}%</div>
                            <div class="col-6">Innovationsindex: ${((additional.economic_indicators.innovation_index || 0) * 100).toFixed(0)}%</div>
                            <div class="col-6">Unternehmensdichte: ${(additional.economic_indicators.business_density || 0).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- Primary Energy Mix -->
        ${data.primary_energy_mix ? `
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6><i class="bi bi-fire text-warning"></i> Wärme-Primärenergie</h6>
                    </div>
                    <div class="card-body">
                        ${createPrimaryEnergyTable(data.primary_energy_mix.heating || {}, 'heating')}
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6><i class="bi bi-lightning text-primary"></i> Strom-Primärenergie</h6>
                    </div>
                    <div class="card-body">
                        ${createPrimaryEnergyTable(data.primary_energy_mix.electricity || {}, 'electricity')}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Transport Mix -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h6><i class="bi bi-truck text-info"></i> Transport-Mix</h6>
                    </div>
                    <div class="card-body">
                        ${createPrimaryEnergyTable(data.primary_energy_mix.transport || {}, 'transport')}
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- Renewable Energy Details -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h6><i class="bi bi-sun text-success"></i> Erneuerbare Energien - Potential vs. Nutzung</h6>
                    </div>
                    <div class="card-body">
                        ${createRenewableTable(renewables, data.current_generation || {})}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Create primary energy table
function createPrimaryEnergyTable(primaryData, type) {
    console.log('Creating primary energy table for type:', type, 'with data:', primaryData);
    
    if (!primaryData || Object.keys(primaryData).length === 0) {
        return '<p class="text-muted">Keine Daten verfügbar</p>';
    }
    
    // Calculate total based on percentages
    const totalPercentage = Object.values(primaryData).reduce((sum, value) => sum + (value || 0), 0);
    if (totalPercentage === 0) return '<p class="text-muted">Keine Daten verfügbar</p>';
    
    let html = '<div class="table-responsive"><table class="table table-sm">';
    
    Object.entries(primaryData).forEach(([key, percentage]) => {
        if (percentage > 0) {
            const name = key.replace('_pct', '').replace('_', ' ');
            const displayName = getEnergySourceDisplayName(name);
            const color = getEnergySourceColor(name);
            
            html += `
                <tr>
                    <td>
                        <span class="badge" style="background-color: ${color};">&nbsp;</span>
                        ${displayName}
                    </td>
                    <td class="text-end">${percentage.toFixed(1)}%</td>
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
    console.log('Creating renewable table with potential:', potential, 'and current:', current);
    
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

// Create energy balance chart using Chart.js
function createDistrictEnergyChart(district) {
    console.log('=== CHART CREATION START ===');
    console.log('District:', district.name);
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js library is not loaded!');
        document.getElementById('districtEnergyChart').parentElement.innerHTML = '<p class="text-danger">Chart.js Bibliothek konnte nicht geladen werden.</p>';
        return;
    }
    
    console.log('Chart.js is available, version:', Chart.version);
    
    const canvas = document.getElementById('districtEnergyChart');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    console.log('Canvas found:', canvas);
    console.log('Canvas width:', canvas.width, 'height:', canvas.height);
    console.log('Canvas offsetWidth:', canvas.offsetWidth, 'offsetHeight:', canvas.offsetHeight);
    console.log('Canvas parent:', canvas.parentElement);
    
    // Force canvas size
    canvas.width = 800;
    canvas.height = 400;
    canvas.style.width = '100%';
    canvas.style.height = '400px';
    
    console.log('Canvas size set, width:', canvas.width, 'height:', canvas.height);
    
    const ctx = canvas.getContext('2d');
    console.log('Context obtained:', ctx);
    
    // Test if we can draw on canvas directly
    try {
        ctx.fillStyle = 'red';
        ctx.fillRect(10, 10, 100, 50);
        ctx.fillStyle = 'blue';
        ctx.fillText('Test Canvas', 120, 30);
        console.log('Direct canvas drawing successful');
    } catch (drawError) {
        console.error('Cannot draw on canvas:', drawError);
        return;
    }
    
    // Wait a moment then clear and create chart
    setTimeout(() => {
        console.log('Creating Chart after direct draw test...');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Very simple test data
        const testData = [7200, 4500, 0, 2550];
        const testLabels = ['Strom', 'Wärme', 'EE-Erzg', 'EE-Pot'];
        
        console.log('Test data:', testData);
        console.log('Test labels:', testLabels);
        
        // Clear any existing chart
        if (window.districtChart) {
            console.log('Destroying existing chart');
            window.districtChart.destroy();
        }
        
        try {
            console.log('Creating new Chart instance...');
            
            const config = {
                type: 'bar',
                data: {
                    labels: testLabels,
                    datasets: [{
                        label: 'MWh/Jahr',
                        data: testData,
                        backgroundColor: [
                            '#dc3545',
                            '#ffc107', 
                            '#28a745',
                            '#6c757d'
                        ],
                        borderColor: [
                            '#dc3545',
                            '#ffc107', 
                            '#28a745',
                            '#6c757d'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `Energiebilanz: ${district.name}`,
                            font: {
                                size: 14
                            }
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'MWh/Jahr'
                            }
                        }
                    }
                }
            };
            
            console.log('Chart config:', config);
            
            window.districtChart = new Chart(ctx, config);
            
            console.log('Chart created successfully:', window.districtChart);
            
            // Force render
            window.districtChart.update('none');
            console.log('Chart update called');
            
            // Check if chart rendered
            setTimeout(() => {
                console.log('Checking chart render status...');
                console.log('Chart data:', window.districtChart.data);
                console.log('Chart canvas:', window.districtChart.canvas);
                console.log('Chart context:', window.districtChart.ctx);
            }, 100);
            
        } catch (error) {
            console.error('=== CHART CREATION FAILED ===');
            console.error('Error:', error);
            console.error('Error stack:', error.stack);
            
            // Show error message and fallback data
            canvas.parentElement.innerHTML = `
                <div class="alert alert-warning">
                    <h6>Energiedaten für ${district.name}</h6>
                    <div class="row text-center">
                        <div class="col-3">
                            <div class="badge bg-danger p-2 w-100">
                                <div>Strom</div>
                                <div>${testData[0]} MWh</div>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="badge bg-warning p-2 w-100">
                                <div>Wärme</div>
                                <div>${testData[1]} MWh</div>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="badge bg-success p-2 w-100">
                                <div>EE-Erzg</div>
                                <div>${testData[2]} MWh</div>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="badge bg-secondary p-2 w-100">
                                <div>EE-Pot</div>
                                <div>${testData[3]} MWh</div>
                            </div>
                        </div>
                    </div>
                    <small class="text-muted">Chart-Fallback: ${error.message}</small>
                </div>
            `;
        }
    }, 500);
    
    console.log('=== CHART CREATION SETUP COMPLETE ===');
}
function createDistrictEnergyChart(quartier) {
    const scenarios = energyScenarios[quartier];
    
    if (!scenarios || !scenarios.baseline) {
        return;
    }

    const data = scenarios.baseline;
    const ctx = document.getElementById('energyBalanceChart');
    
    if (!ctx) {
        Logger.warn('Chart canvas element not found');
        return;
    }

    // Destroy existing chart if it exists
    if (window.energyChart) {
        window.energyChart.destroy();
    }

    const chartData = {
        labels: ['Verbrauch', 'EE-Potenzial'],
        datasets: [{
            label: 'Strom (kWh/Jahr)',
            data: [
                data.electricity_consumption,
                data.solar_potential + data.wind_potential
            ],
            backgroundColor: ['#e74c3c', '#2ecc71'],
            borderColor: ['#c0392b', '#27ae60'],
            borderWidth: 1
        }, {
            label: 'Wärme (kWh/Jahr)',
            data: [
                data.heat_consumption,
                data.biomass_potential
            ],
            backgroundColor: ['#f39c12', '#3498db'],
            borderColor: ['#d68910', '#2980b9'],
            borderWidth: 1
        }]
    };

    const config = {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Energie (kWh/Jahr)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: `Energiebilanz: ${quartier}`
                }
            }
        }
    };

    window.energyChart = new Chart(ctx, config);
}

// Show detailed analysis modal
async function showDetailedAnalysis(quartier) {
    console.log('showDetailedAnalysis called with quartier:', quartier);
    try {
        console.log('Loading detailed district data...');
        
        // Load district detailed data from API
        const response = await fetch(`/api/districts/${quartier}/detailed`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const district = await response.json();
        console.log('District detailed data loaded:', district);
        
        console.log('Creating detailed analysis content...');
        const content = createEnergyFlowContent(district);
        console.log('Content created, length:', content.length);
        
        console.log('Showing detailed analysis modal...');
        
        // Create and show modal using correct API
        const modalId = 'detailedAnalysisModal';
        const modal = modalManager.createModal(modalId, `Detailanalyse: ${district.name}`, content, { 
            size: 'modal-xl',
            scrollable: true 
        });
        modalManager.showModal(modalId);
        
        // Test Chart.js availability first
        setTimeout(() => {
            console.log('Testing Chart.js availability...');
            console.log('typeof Chart:', typeof Chart);
            console.log('Chart object:', Chart);
            
            if (typeof Chart !== 'undefined') {
                console.log('Chart.js is available, creating chart...');
                createDistrictEnergyChart(district);
            } else {
                console.error('Chart.js is not available!');
                // Fallback: Show data without chart
                const chartContainer = document.getElementById('districtEnergyChart');
                if (chartContainer) {
                    chartContainer.parentElement.innerHTML = `
                        <div class="alert alert-warning">
                            <h6>Energiedaten für ${district.name}</h6>
                            <div class="row">
                                <div class="col-6">Strom: ${district.energy_demand?.electricity_mwh || 0} MWh</div>
                                <div class="col-6">Wärme: ${district.energy_demand?.heating_mwh || 0} MWh</div>
                            </div>
                            <small>Chart.js konnte nicht geladen werden - Daten werden als Text angezeigt</small>
                        </div>
                    `;
                }
            }
        }, 1500); // Noch längeres Timeout
        
        console.log('Detailed analysis modal should be shown now');

    } catch (error) {
        console.error('Error in showDetailedAnalysis:', error);
        Logger.error('Error showing detailed analysis:', error);
        notificationManager.showError('Fehler beim Laden der Detailanalyse');
    }
}

// Show stakeholder analysis modal
async function showStakeholderAnalysis(quartier) {
    console.log('showStakeholderAnalysis called with quartier:', quartier);
    try {
        // Ensure data is loaded
        console.log('Current stakeholders length:', stakeholders.length);
        console.log('Stakeholders data:', stakeholders);
        if (stakeholders.length === 0) {
            console.log('Loading stakeholders...');
            await loadStakeholders();
            console.log('Stakeholders loaded, new length:', stakeholders.length);
            console.log('Loaded stakeholders data:', stakeholders);
        }

        console.log('Creating stakeholder content...');
        const content = createStakeholderContent(quartier);
        console.log('Content created, length:', content.length);
        
        const title = quartier === 'all' ? 'Stakeholder-Matrix' : `Stakeholder-Analyse: ${quartier}`;
        console.log('Showing modal with title:', title);
        
        // Create and show modal using correct API
        const modalId = 'stakeholderModal';
        const modal = modalManager.createModal(modalId, title, content, { size: 'modal-lg' });
        modalManager.showModal(modalId);
        
        console.log('Modal should be shown now');

    } catch (error) {
        console.error('Error in showStakeholderAnalysis:', error);
        Logger.error('Error showing stakeholder analysis:', error);
        notificationManager.showError('Fehler beim Laden der Stakeholder-Analyse');
    }
}

// Show scenario comparison modal
async function showScenarioComparison(quartier) {
    console.log('showScenarioComparison called with quartier:', quartier);
    try {
        // Ensure data is loaded
        console.log('Current energyScenarios keys:', Object.keys(energyScenarios));
        console.log('Energy scenarios data:', energyScenarios);
        if (Object.keys(energyScenarios).length === 0) {
            console.log('Loading energy scenarios...');
            await loadEnergyScenarios();
            console.log('Energy scenarios loaded, new keys:', Object.keys(energyScenarios));
            console.log('Loaded energy scenarios data:', energyScenarios);
        }

        console.log('Creating scenario content...');
        const content = createScenarioContent(quartier);
        console.log('Content created, length:', content.length);
        
        const title = quartier === 'all' ? 'Energie-Szenarien' : `Szenario-Vergleich: ${quartier}`;
        console.log('Showing modal with title:', title);
        
        // Create and show modal using correct API
        const modalId = 'scenarioModal';
        const modal = modalManager.createModal(modalId, title, content, { size: 'modal-lg' });
        modalManager.showModal(modalId);
        
        console.log('Modal should be shown now');

    } catch (error) {
        console.error('Error in showScenarioComparison:', error);
        Logger.error('Error showing scenario comparison:', error);
        notificationManager.showError('Fehler beim Laden des Szenario-Vergleichs');
    }
}

// Initialize analysis module
async function initializeAnalysis() {
    try {
        Logger.info('Initializing analysis module...');
        
        // Load initial data
        await Promise.all([
            loadStakeholders(),
            loadEnergyScenarios()
        ]);
        
        Logger.info('Analysis module initialized successfully');
        return true;
    } catch (error) {
        Logger.error('Error initializing analysis module:', error);
        notificationManager.showError('Fehler beim Initialisieren der Analyse-Module');
        return false;
    }
}

// Export functions for global access
window.showDetailedAnalysis = showDetailedAnalysis;
window.showStakeholderAnalysis = showStakeholderAnalysis;
window.showScenarioComparison = showScenarioComparison;
window.initializeAnalysis = initializeAnalysis;
window.showScenarioComparison = showScenarioComparison;
window.initializeAnalysis = initializeAnalysis;
