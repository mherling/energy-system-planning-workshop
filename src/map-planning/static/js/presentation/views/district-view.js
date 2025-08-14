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
async function displayDistrictDetails(district) {
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
        
        <!-- Resultierende Ergebnisse - Kosten & CO2 -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0"><i class="bi bi-calculator"></i> Resultierende Ergebnisse</h6>
                    </div>
                    <div class="card-body" id="resultsContent-${district.id}">
                        <div class="text-center">
                            <div class="spinner-border text-info" role="status">
                                <span class="visually-hidden">Berechne Ergebnisse...</span>
                            </div>
                            <p class="mt-2">Kosten und CO2-Bilanz werden berechnet...</p>
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
    
    // Load results asynchronously after UI is rendered
    setTimeout(async () => {
        try {
            await loadDistrictResults(district);
        } catch (error) {
            console.error('Error loading district results:', error);
            const resultsContainer = document.getElementById(`resultsContent-${district.id}`);
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="alert alert-warning">
                        <h6>Fehler bei der Berechnung</h6>
                        <p>Die Kosten- und CO2-Berechnung konnte nicht durchgeführt werden.</p>
                        <small>${error.message}</small>
                    </div>
                `;
            }
        }
    }, 100);
}

// Load and display district results (costs & CO2)
async function loadDistrictResults(district) {
    try {
        let systemConfig;
        
        // Try to load system config from API
        if (typeof apiClient !== 'undefined' && apiClient.getSystemConfig) {
            systemConfig = await apiClient.getSystemConfig();
        } else {
            // Fallback to fetch if apiClient is not ready
            const response = await fetch('/api/system-config');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            systemConfig = await response.json();
        }
        
        // Calculate results using economic analysis utility
        if (typeof calculateDistrictResults !== 'function') {
            throw new Error('calculateDistrictResults function is not available. Please check if economic-analysis.js is loaded.');
        }
        
        const results = calculateDistrictResults(district, systemConfig);
        
        // Generate results HTML
        const resultsHTML = generateResultsHTML(results);
        
        // Update results container
        const resultsContainer = document.getElementById(`resultsContent-${district.id}`);
        if (resultsContainer) {
            resultsContainer.innerHTML = resultsHTML;
        }
        
    } catch (error) {
        console.error('Error in loadDistrictResults:', error);
        throw new Error(`Fehler beim Laden der Systemkonfiguration: ${error.message}`);
    }
}

// Generate HTML for results display
function generateResultsHTML(results) {
    const costs = results.costs;
    const emissions = results.emissions;
    
    return `
        <!-- Kosten-Übersicht -->
        <div class="row mb-3">
            <div class="col-6">
                <div class="text-center p-3 border rounded">
                    <small class="text-muted">Jährliche Energiekosten</small>
                    <div class="fw-bold fs-5 text-danger">${formatNumber(costs.net_costs, 0)} €</div>
                    <small class="text-muted">Pro Kopf: ${formatNumber(results.costs_per_capita, 0)} €</small>
                </div>
            </div>
            <div class="col-6">
                <div class="text-center p-3 border rounded">
                    <small class="text-muted">CO2-Emissionen</small>
                    <div class="fw-bold fs-5 text-warning">${formatNumber(emissions.net_emissions_tons, 1)} t</div>
                    <small class="text-muted">Pro Kopf: ${formatNumber(emissions.per_capita_tons, 1)} t</small>
                </div>
            </div>
        </div>
        
        <!-- Kosten-Aufschlüsselung -->
        <div class="row mb-3">
            <div class="col-12">
                <h6 class="text-primary mb-2"><i class="bi bi-currency-euro"></i> Kosten-Aufschlüsselung</h6>
                <div class="row text-center">
                    <div class="col-3">
                        <small class="text-muted">Strom</small>
                        <div class="fw-bold text-primary">${formatNumber(costs.breakdown.electricity, 0)} €</div>
                    </div>
                    <div class="col-3">
                        <small class="text-muted">Heizung</small>
                        <div class="fw-bold text-orange">${formatNumber(costs.breakdown.heating, 0)} €</div>
                    </div>
                    <div class="col-3">
                        <small class="text-muted">Kühlung</small>
                        <div class="fw-bold text-info">${formatNumber(costs.breakdown.cooling, 0)} €</div>
                    </div>
                    <div class="col-3">
                        <small class="text-muted">Transport</small>
                        <div class="fw-bold text-secondary">${formatNumber(costs.breakdown.transport, 0)} €</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- EE-Einsparungen -->
        <div class="row mb-3">
            <div class="col-12">
                <div class="alert alert-success">
                    <h6><i class="bi bi-piggy-bank"></i> EE-Einsparungen</h6>
                    <div class="row text-center">
                        <div class="col-4">
                            <small>Solar PV</small>
                            <div class="fw-bold">${formatNumber(costs.renewable_breakdown.solar_pv_savings, 0)} €</div>
                        </div>
                        <div class="col-4">
                            <small>Solar Thermal</small>
                            <div class="fw-bold">${formatNumber(costs.renewable_breakdown.solar_thermal_savings, 0)} €</div>
                        </div>
                        <div class="col-4">
                            <small>Biomasse</small>
                            <div class="fw-bold">${formatNumber(costs.renewable_breakdown.biomass_savings, 0)} €</div>
                        </div>
                    </div>
                    <hr class="my-2">
                    <div class="text-center">
                        <strong>Gesamt-Einsparungen: ${formatNumber(costs.renewable_savings, 0)} € / Jahr</strong>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- CO2-Aufschlüsselung -->
        <div class="row mb-3">
            <div class="col-12">
                <h6 class="text-warning mb-2"><i class="bi bi-cloud-arrow-up"></i> CO2-Aufschlüsselung</h6>
                <div class="row text-center">
                    <div class="col-3">
                        <small class="text-muted">Strom</small>
                        <div class="fw-bold text-primary">${formatNumber(emissions.breakdown.electricity_kg / 1000, 1)} t</div>
                    </div>
                    <div class="col-3">
                        <small class="text-muted">Heizung</small>
                        <div class="fw-bold text-orange">${formatNumber(emissions.breakdown.heating_kg / 1000, 1)} t</div>
                    </div>
                    <div class="col-3">
                        <small class="text-muted">Kühlung</small>
                        <div class="fw-bold text-info">${formatNumber(emissions.breakdown.cooling_kg / 1000, 1)} t</div>
                    </div>
                    <div class="col-3">
                        <small class="text-muted">Transport</small>
                        <div class="fw-bold text-secondary">${formatNumber(emissions.breakdown.transport_kg / 1000, 1)} t</div>
                    </div>
                </div>
                <div class="mt-2 text-center">
                    <small class="text-success">
                        <i class="bi bi-arrow-down"></i> EE-Einsparungen: ${formatNumber(emissions.emission_savings_tons, 1)} t CO2 vermieden
                    </small>
                </div>
            </div>
        </div>
        
        <!-- CO2-Kosten -->
        <div class="row">
            <div class="col-12">
                <div class="alert alert-info">
                    <h6><i class="bi bi-calculator"></i> Monetäre CO2-Bewertung</h6>
                    <div class="text-center">
                        <div class="fw-bold fs-5">${formatNumber(results.co2_costs, 0)} €</div>
                        <small class="text-muted">Soziale CO2-Kosten (180 €/t CO2)</small>
                    </div>
                    <hr class="my-2">
                    <div class="text-center">
                        <strong class="fs-6">Gesamtkosten inkl. CO2: ${formatNumber(results.total_annual_costs, 0)} € / Jahr</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Export to global scope
window.selectDistrict = selectDistrict;
window.displayDistrictDetails = displayDistrictDetails;
