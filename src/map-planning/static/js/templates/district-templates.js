/**
 * District Templates Module
 * Handles district-specific template generation and formatting
 */

// Create detailed district analysis content
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
                    ${(data.district_type || '').toUpperCase()} • ${formatUtils.formatNumber(data.population || 0, 0)} Einwohner • ${data.area_km2 || 0} km²
                </p>
                <p class="small">${additional.description || data.description || 'Keine Beschreibung verfügbar'}</p>
            </div>
            <div class="col-md-4">
                <div class="card bg-primary text-white">
                    <div class="card-body text-center">
                        <h6>Energiebilanz</h6>
                        <h3>${(totalGeneration - totalDemand > 0 ? '+' : '')}${formatUtils.formatEnergy(Math.abs(totalGeneration - totalDemand), 'MWh', 0)}</h3>
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
                        <h4>${formatUtils.formatEnergy(energyDemand.electricity_mwh || 0, 'MWh', 0)}</h4>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h6 class="card-title text-warning">Wärmeverbrauch</h6>
                        <h4>${formatUtils.formatEnergy(energyDemand.heating_mwh || 0, 'MWh', 0)}</h4>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h6 class="card-title text-success">EE-Erzeugung</h6>
                        <h4>${formatUtils.formatEnergy(totalGeneration, 'MWh', 0)}</h4>
                        <small class="text-muted">${formatUtils.formatPercentage(renewableShare, 0)} des Bedarfs</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h6 class="card-title text-info">EE-Potential</h6>
                        <h4>${formatUtils.formatEnergy(totalPotential, 'MWh', 0)}</h4>
                        <small class="text-muted">${formatUtils.formatPercentage(totalPotential > 0 ? Math.round((totalGeneration / totalPotential) * 100) : 0, 0)} genutzt</small>
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
                            <li><strong>Strom Gesamt:</strong> ${formatUtils.formatEnergy(energyDemand.electricity_mwh || 0, 'MWh', 0)}</li>
                            <li>- Haushalte: ${formatUtils.formatEnergy(Math.round((energyDemand.electricity_mwh || 0) * 0.4), 'MWh', 0)}</li>
                            <li>- Gewerbe: ${formatUtils.formatEnergy(Math.round((energyDemand.electricity_mwh || 0) * 0.35), 'MWh', 0)}</li>
                            <li>- Industrie: ${formatUtils.formatEnergy(Math.round((energyDemand.electricity_mwh || 0) * 0.25), 'MWh', 0)}</li>
                            <li><strong>Wärme Gesamt:</strong> ${formatUtils.formatEnergy(energyDemand.heating_mwh || 0, 'MWh', 0)}</li>
                            <li>- Raumheizung: ${formatUtils.formatEnergy(Math.round((energyDemand.heating_mwh || 0) * 0.75), 'MWh', 0)}</li>
                            <li>- Warmwasser: ${formatUtils.formatEnergy(Math.round((energyDemand.heating_mwh || 0) * 0.25), 'MWh', 0)}</li>
                            <li><strong>Kühlung:</strong> ${formatUtils.formatEnergy(energyDemand.cooling_mwh || 0, 'MWh', 0)}</li>
                            <li><strong>Transport:</strong> ${formatUtils.formatEnergy(energyDemand.transport_mwh || 0, 'MWh', 0)}</li>
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
                            <li><strong>Solar PV:</strong> ${formatUtils.formatEnergy(renewables.solar_pv_mwh || 0, 'MWh', 0)}</li>
                            <li><strong>Solarthermie:</strong> ${formatUtils.formatEnergy(renewables.solar_thermal_mwh || 0, 'MWh', 0)}</li>
                            <li><strong>Kleinwind:</strong> ${formatUtils.formatEnergy(renewables.small_wind_mwh || 0, 'MWh', 0)}</li>
                            <li><strong>Biomasse:</strong> ${formatUtils.formatEnergy(renewables.biomass_mwh || 0, 'MWh', 0)}</li>
                            <li><strong>Geothermie:</strong> ${formatUtils.formatEnergy(renewables.geothermal_mwh || 0, 'MWh', 0)}</li>
                            <li><strong>Gesamt:</strong> ${formatUtils.formatEnergy(totalPotential, 'MWh', 0)}</li>
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

// Export to global scope
window.createEnergyFlowContent = createEnergyFlowContent;
