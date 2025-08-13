// Districts Module
// Handles district data loading, selection, and detail display

let districts = [];
let currentDistrict = null;

// Load districts data
async function loadDistricts() {
    try {
        Logger.info('Loading districts data...');
        districts = await apiClient.getDistricts();
        createQuartiersOnMap(districts);
        Logger.info(`Loaded ${districts.length} quartiers`);
        return districts;
    } catch (error) {
        Logger.error('Error loading districts:', error);
        notificationManager.showError('Fehler beim Laden der Quartier-Daten');
        return [];
    }
}

// Select district
function selectDistrict(district) {
    currentDistrict = district;
    displayDistrictDetails(district);
    highlightSelectedDistrict(district.id);
}

// Display district details in selected district panel
function displayDistrictDetails(district) {
    // Update title
    document.getElementById('selectedDistrictTitle').textContent = district.name;
    
    // Get container
    const container = document.getElementById('selectedDistrictContent');
    
    // Parse JSON data safely
    const energyDemand = typeof district.energy_demand === 'string' 
        ? JSON.parse(district.energy_demand) 
        : district.energy_demand || {};
    const renewablePotential = typeof district.renewable_potential === 'string' 
        ? JSON.parse(district.renewable_potential) 
        : district.renewable_potential || {};
    const additionalData = typeof district.additional_data === 'string' 
        ? JSON.parse(district.additional_data) 
        : district.additional_data || {};
    const buildingTypes = typeof district.building_types === 'string' 
        ? JSON.parse(district.building_types) 
        : district.building_types || {};
    
    // Calculate energy metrics using central utility
    const metrics = calculateEnergyMetrics(district);
    const totalDemand = metrics.totalDemand;
    const totalPotential = metrics.totalPotential;
    
    container.innerHTML = `
        <!-- Basic Info -->
        <div class="row mb-4">
            <div class="col-6">
                <div class="text-center p-3 bg-light rounded">
                    <h6 class="text-muted mb-1">Einwohner</h6>
                    <h4 class="text-primary mb-0">${formatUtils.formatNumber(district.population, 0)}</h4>
                </div>
            </div>
            <div class="col-6">
                <div class="text-center p-3 bg-light rounded">
                    <h6 class="text-muted mb-1">Fläche</h6>
                    <h4 class="text-primary mb-0">${district.area_km2} km²</h4>
                </div>
            </div>
        </div>
        
        <!-- Description -->
        ${district.description ? `
            <div class="alert alert-info mb-4">
                <small>${district.description}</small>
            </div>
        ` : ''}
        
        <!-- Energy Metrics -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-danger text-white">
                        <h6 class="mb-0"><i class="bi bi-lightning-charge"></i> Energiebedarf</h6>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-6">
                                <small class="text-muted">Strom</small>
                                <div class="fw-bold fs-5">${formatUtils.formatNumber(energyDemand.electricity_mwh || 0, 0)}</div>
                                <small class="text-muted">MWh/Jahr</small>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Wärme</small>
                                <div class="fw-bold fs-5">${formatUtils.formatNumber(energyDemand.heating_mwh || 0, 0)}</div>
                                <small class="text-muted">MWh/Jahr</small>
                            </div>
                        </div>
                        <hr>
                        <div class="text-center">
                            <small class="text-muted">Gesamtbedarf</small>
                            <div class="fw-bold fs-4 text-danger">${formatUtils.formatEnergy(totalDemand, 'MWh', 0)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="bi bi-sun"></i> EE-Potential</h6>
                    </div>
                    <div class="card-body">
                        <div class="row text-center mb-2">
                            <div class="col-6">
                                <small class="text-muted">Solar PV</small>
                                <div class="fw-bold">${(renewablePotential.solar_pv_mwh || 0).toFixed(1)}</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Solar Thermal</small>
                                <div class="fw-bold">${(renewablePotential.solar_thermal_mwh || 0).toFixed(1)}</div>
                            </div>
                        </div>
                        <div class="row text-center mb-2">
                            <div class="col-6">
                                <small class="text-muted">Kleinwind</small>
                                <div class="fw-bold">${(renewablePotential.small_wind_mwh || 0).toFixed(1)}</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Biomasse</small>
                                <div class="fw-bold">${(renewablePotential.biomass_mwh || 0).toFixed(1)}</div>
                            </div>
                        </div>
                        <hr>
                        <div class="text-center">
                            <small class="text-muted">Gesamtpotential</small>
                            <div class="fw-bold fs-4 text-success">${totalPotential.toFixed(1)} MWh</div>
                            <small class="text-muted">
                                ${totalDemand > 0 ? Math.round((totalPotential / totalDemand) * 100) : 0}% des Bedarfs
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Primary Energy Sources -->
        ${additionalData.primary_energy_mix ? `
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-warning text-dark">
                            <h6 class="mb-0"><i class="bi bi-fire"></i> Primärenergie-Mix</h6>
                        </div>
                        <div class="card-body">
                            ${Object.entries(additionalData.primary_energy_mix).map(([source, percentage]) => `
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="small">${window.getEnergySourceDisplayName(source)}</span>
                                    <div class="d-flex align-items-center">
                                        <div class="progress me-2" style="width: 60px; height: 10px;">
                                            <div class="progress-bar" style="width: ${percentage}%; background-color: ${window.getEnergySourceColor(source)};"></div>
                                        </div>
                                        <span class="small fw-bold">${percentage}%</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        ` : ''}
        
        <!-- Building Types -->
        ${Object.keys(buildingTypes).length > 0 ? `
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0"><i class="bi bi-buildings"></i> Gebäudetypen</h6>
                        </div>
                        <div class="card-body">
                            ${Object.entries(buildingTypes).map(([type, count]) => `
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="small">${type}</span>
                                    <span class="fw-bold">${count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        ` : ''}
        
        <!-- Action Buttons -->
        <div class="d-grid gap-2">
            <button class="btn btn-primary" onclick="showDetailedAnalysis('${district.id}')">
                <i class="bi bi-bar-chart-line"></i> Detailanalyse
            </button>
        </div>
    `;
}
