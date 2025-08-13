/**
 * Energy Templates Module
 * Handles energy analysis template generation and formatting
 */

// Create detailed analysis content (matching original format from index_backup.html)
function createEnergyFlowContent(data) {
    console.log('Creating energy flow content with data:', data);
    
    const energyDemand = data.energy_demand || {};
    const renewables = data.renewable_potential || {};
    const additional = data.additional_data || {};
    
    // Calculate totals using central utility
    const metrics = calculateEnergyMetrics(data);
    const totalDemand = metrics.totalDemand;
    const totalGeneration = metrics.totalGeneration;
    const totalPotential = metrics.totalPotential;
    const renewableShare = metrics.renewableShare;
    
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

// Create overview content for all districts
async function createAllDistrictsContent() {
    try {
        // Load all districts data
        const response = await fetch('/api/districts');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const districts = await response.json();
        
        // Calculate totals using central utility
        const aggregatedMetrics = calculateAggregatedMetrics(districts);
        const totalDemand = aggregatedMetrics.totalDemand;
        const totalGeneration = aggregatedMetrics.totalGeneration;
        const totalPotential = aggregatedMetrics.totalPotential;
        const totalPopulation = aggregatedMetrics.totalPopulation;
        const totalArea = aggregatedMetrics.totalArea;
        const renewableShare = aggregatedMetrics.renewableShare;
        const potentialUtilization = aggregatedMetrics.potentialUtilization;
        
        return `
            <!-- Overview Header -->
            <div class="row mb-4">
                <div class="col-md-8">
                    <h4>Gesamtübersicht aller Quartiere</h4>
                    <p class="text-muted">
                        ${districts.length} Quartiere • ${totalPopulation.toLocaleString()} Einwohner • ${totalArea.toFixed(1)} km²
                    </p>
                </div>
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <h6>Gesamt-Energiebilanz</h6>
                            <h3>${(totalGeneration - totalDemand > 0 ? '+' : '')}${(totalGeneration - totalDemand).toLocaleString()} MWh</h3>
                            <small>${totalGeneration >= totalDemand ? 'Energieüberschuss' : 'Energiedefizit'}</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Total Energy Metrics -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="card-title text-danger">Gesamtverbrauch</h6>
                            <h4>${totalDemand.toLocaleString()} MWh</h4>
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
                            <small class="text-muted">${potentialUtilization}% genutzt</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="card-title text-warning">Autarkie-Grad</h6>
                            <h4>${renewableShare}%</h4>
                            <small class="text-muted">Eigenversorgung</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Districts Overview Table -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="bi bi-table text-primary"></i> Quartiers-Übersicht</h6>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Quartier</th>
                                            <th>Typ</th>
                                            <th class="text-end">Einwohner</th>
                                            <th class="text-end">Verbrauch (MWh)</th>
                                            <th class="text-end">EE-Erzeugung (MWh)</th>
                                            <th class="text-end">Autarkie (%)</th>
                                            <th>Bilanz</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${districts.map(district => {
                                            const districtMetrics = calculateEnergyMetrics(district);
                                            const districtDemand = districtMetrics.totalDemand;
                                            const districtGeneration = districtMetrics.totalGeneration;
                                            const districtAutarky = districtMetrics.renewableShare;
                                            const balance = districtMetrics.energyBalance;
                                            
                                            return `
                                                <tr>
                                                    <td><strong>${district.name}</strong></td>
                                                    <td><span class="badge bg-secondary">${district.district_type || 'N/A'}</span></td>
                                                    <td class="text-end">${(district.population || 0).toLocaleString()}</td>
                                                    <td class="text-end">${districtDemand.toLocaleString()}</td>
                                                    <td class="text-end">${districtGeneration.toLocaleString()}</td>
                                                    <td class="text-end">
                                                        <span class="badge ${districtAutarky >= 100 ? 'bg-success' : districtAutarky >= 50 ? 'bg-warning' : 'bg-danger'}">
                                                            ${districtAutarky}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span class="badge ${balance >= 0 ? 'bg-success' : 'bg-danger'}">
                                                            ${balance >= 0 ? '+' : ''}${balance.toFixed(0)} MWh
                                                        </span>
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error creating all districts content:', error);
        return `
            <div class="alert alert-danger">
                <h6>Fehler beim Laden der Daten</h6>
                <p>Die Gesamtübersicht konnte nicht geladen werden.</p>
            </div>
        `;
    }
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

// Export functions for global access
window.createEnergyFlowContent = createEnergyFlowContent;
window.createPrimaryEnergyTable = createPrimaryEnergyTable;
window.createRenewableTable = createRenewableTable;
window.createAllDistrictsContent = createAllDistrictsContent;
window.getEnergySourceDisplayName = getEnergySourceDisplayName;
window.getEnergySourceColor = getEnergySourceColor;
