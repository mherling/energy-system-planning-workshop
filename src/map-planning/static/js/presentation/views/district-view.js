/**
 * District View Module  
 * Handles district UI rendering and display
 */

// Select district and update UI
function selectDistrict(district) {
    setCurrentDistrict(district);
    displayDistrictDetails(district);
    highlightSelectedDistrict(district.id);
}

// Display district details in selected district panel
function displayDistrictDetails(district) {
    // Update title
    document.getElementById('selectedDistrictTitle').textContent = district.name;
    
    // Get container
    const container = document.getElementById('selectedDistrictContent');
    
    // Parse district data using data module
    const parsedDistrict = parseDistrictData(district);
    const energyDemand = parsedDistrict.energy_demand;
    const renewablePotential = parsedDistrict.renewable_potential;
    const additionalData = parsedDistrict.additional_data;
    const buildingTypes = parsedDistrict.building_types;
    
    // Calculate energy metrics using central utility
    const metrics = calculateEnergyMetrics(district);
    const totalDemand = metrics.totalDemand;
    const totalPotential = metrics.totalPotential;
    
    container.innerHTML = `
        <!-- Basic Info Row -->
        <div class="row mb-4">
            <div class="col-4">
                <div class="text-center p-3 bg-light rounded">
                    <h6 class="text-muted mb-1">Einwohner</h6>
                    <h4 class="text-primary mb-0">${formatUtils.formatNumber(district.population, 0)}</h4>
                </div>
            </div>
            <div class="col-4">
                <div class="text-center p-3 bg-light rounded">
                    <h6 class="text-muted mb-1">Fläche</h6>
                    <h4 class="text-primary mb-0">${district.area_km2} km²</h4>
                </div>
            </div>
            <div class="col-4">
                <div class="text-center p-3 bg-light rounded">
                    <h6 class="text-muted mb-1">Typ</h6>
                    <h4 class="text-success mb-0">${(district.district_type || 'Mixed').charAt(0).toUpperCase() + (district.district_type || 'Mixed').slice(1)}</h4>
                </div>
            </div>
        </div>
        
        <!-- Additional Info Row -->
        <div class="row mb-4">
            <div class="col-4">
                <div class="text-center p-2 bg-light rounded">
                    <small class="text-muted">Dichte</small>
                    <div class="fw-bold">${formatUtils.formatNumber(district.population / district.area_km2, 0)}</div>
                    <small class="text-muted">EW/km²</small>
                </div>
            </div>
            <div class="col-4">
                <div class="text-center p-2 bg-light rounded">
                    <small class="text-muted">Priorität</small>
                    <div class="fw-bold">${additionalData.priority_level || 'Medium'}</div>
                </div>
            </div>
            <div class="col-4">
                <div class="text-center p-2 bg-light rounded">
                    <small class="text-muted">Haushalte</small>
                    <div class="fw-bold">${formatUtils.formatNumber(Math.round(district.population / 2.1), 0)}</div>
                </div>
            </div>
        </div>
        
        <!-- Description -->
        ${district.description ? `
            <div class="alert alert-info mb-4">
                <small><strong>Beschreibung:</strong> ${district.description}</small>
            </div>
        ` : ''}
        
        <!-- Energy Demand - Erweitert -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-danger text-white">
                        <h6 class="mb-0"><i class="bi bi-lightning-charge"></i> Energiebedarf (Gesamt)</h6>
                    </div>
                    <div class="card-body">
                        <div class="row text-center mb-3">
                            <div class="col-3">
                                <small class="text-muted">Strom</small>
                                <div class="fw-bold fs-6 text-primary">${formatUtils.formatNumber(energyDemand.electricity_mwh || 0, 0)}</div>
                                <small class="text-muted">MWh/Jahr</small>
                            </div>
                            <div class="col-3">
                                <small class="text-muted">Wärme</small>
                                <div class="fw-bold fs-6 text-orange">${formatUtils.formatNumber(energyDemand.heating_mwh || 0, 0)}</div>
                                <small class="text-muted">MWh/Jahr</small>
                            </div>
                            <div class="col-3">
                                <small class="text-muted">Kühlung</small>
                                <div class="fw-bold fs-6 text-info">${formatUtils.formatNumber(energyDemand.cooling_mwh || 0, 0)}</div>
                                <small class="text-muted">MWh/Jahr</small>
                            </div>
                            <div class="col-3">
                                <small class="text-muted">Transport</small>
                                <div class="fw-bold fs-6 text-secondary">${formatUtils.formatNumber(energyDemand.transport_mwh || 0, 0)}</div>
                                <small class="text-muted">MWh/Jahr</small>
                            </div>
                        </div>
                        <hr>
                        <div class="text-center">
                            <small class="text-muted">Gesamtbedarf</small>
                            <div class="fw-bold fs-4 text-danger">${formatUtils.formatEnergy(totalDemand, 'MWh', 0)}</div>
                            <small class="text-muted">Pro Einwohner: ${formatUtils.formatNumber(totalDemand / district.population, 1)} MWh/Jahr</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- EE-Potential - Erweitert -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="bi bi-sun"></i> EE-Potentiale (Technisch)</h6>
                    </div>
                    <div class="card-body">
                        <div class="row text-center mb-3">
                            <div class="col-4">
                                <small class="text-muted">Solar PV</small>
                                <div class="fw-bold text-warning">${formatUtils.formatNumber(renewablePotential.solar_pv_mwh || 0, 0)}</div>
                                <small class="text-muted">MWh/Jahr</small>
                            </div>
                            <div class="col-4">
                                <small class="text-muted">Solar Thermal</small>
                                <div class="fw-bold text-orange">${formatUtils.formatNumber(renewablePotential.solar_thermal_mwh || 0, 0)}</div>
                                <small class="text-muted">MWh/Jahr</small>
                            </div>
                            <div class="col-4">
                                <small class="text-muted">Kleinwind</small>
                                <div class="fw-bold text-info">${formatUtils.formatNumber(renewablePotential.small_wind_mwh || 0, 0)}</div>
                                <small class="text-muted">MWh/Jahr</small>
                            </div>
                        </div>
                        <div class="row text-center mb-3">
                            <div class="col-6">
                                <small class="text-muted">Biomasse</small>
                                <div class="fw-bold text-success">${formatUtils.formatNumber(renewablePotential.biomass_mwh || 0, 0)}</div>
                                <small class="text-muted">MWh/Jahr</small>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Geothermie</small>
                                <div class="fw-bold text-primary">${formatUtils.formatNumber(renewablePotential.geothermal_mwh || 0, 0)}</div>
                                <small class="text-muted">MWh/Jahr</small>
                            </div>
                        </div>
                        <hr>
                        <div class="text-center">
                            <small class="text-muted">Gesamt-Potential</small>
                            <div class="fw-bold fs-4 text-success">${formatUtils.formatEnergy(totalPotential, 'MWh', 0)}</div>
                            <small class="text-muted">Deckungsgrad: ${formatUtils.formatPercentage(totalPotential / totalDemand * 100, 0)} des Bedarfs</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Aktuelle EE-Erzeugung -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-warning text-dark">
                        <h6 class="mb-0"><i class="bi bi-lightning"></i> Aktuelle EE-Erzeugung</h6>
                    </div>
                    <div class="card-body">
                        <div class="row text-center mb-3">
                            <div class="col-4">
                                <small class="text-muted">Solar PV aktuell</small>
                                <div class="fw-bold text-warning">${formatUtils.formatNumber((renewablePotential.solar_pv_mwh || 0) * 0.15, 0)}</div>
                                <small class="text-muted">MWh/Jahr</small>
                                <div class="progress mt-1" style="height: 5px;">
                                    <div class="progress-bar bg-warning" style="width: 15%"></div>
                                </div>
                                <small class="text-muted">15% genutzt</small>
                            </div>
                            <div class="col-4">
                                <small class="text-muted">Solar Thermal</small>
                                <div class="fw-bold text-orange">${formatUtils.formatNumber((renewablePotential.solar_thermal_mwh || 0) * 0.25, 0)}</div>
                                <small class="text-muted">MWh/Jahr</small>
                                <div class="progress mt-1" style="height: 5px;">
                                    <div class="progress-bar bg-orange" style="width: 25%"></div>
                                </div>
                                <small class="text-muted">25% genutzt</small>
                            </div>
                            <div class="col-4">
                                <small class="text-muted">Biomasse</small>
                                <div class="fw-bold text-success">${formatUtils.formatNumber((renewablePotential.biomass_mwh || 0) * 0.80, 0)}</div>
                                <small class="text-muted">MWh/Jahr</small>
                                <div class="progress mt-1" style="height: 5px;">
                                    <div class="progress-bar bg-success" style="width: 80%"></div>
                                </div>
                                <small class="text-muted">80% genutzt</small>
                            </div>
                        </div>
                        <hr>
                        <div class="text-center">
                            <small class="text-muted">Aktuelle EE-Erzeugung</small>
                            <div class="fw-bold fs-4 text-warning">${formatUtils.formatEnergy(totalPotential * 0.25, 'MWh', 0)}</div>
                            <small class="text-muted">Ausschöpfungsgrad: ${formatUtils.formatPercentage(25, 0)} des Potentials</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="d-grid gap-2">
            <button class="btn btn-primary" onclick="showDetailedAnalysis('${district.id}')">
                <i class="bi bi-bar-chart-line"></i> Detailanalyse anzeigen
            </button>
        </div>`;
}

// Export to global scope
window.selectDistrict = selectDistrict;
window.displayDistrictDetails = displayDistrictDetails;
