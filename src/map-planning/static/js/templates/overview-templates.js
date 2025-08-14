/**
 * Overview Templates Module
 * Handles overview and summary template generation
 */

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
        
        // Calculate aggregated demand by type
        let totalElectricityDemand = 0, totalHeatingDemand = 0, totalCoolingDemand = 0, totalTransportDemand = 0;
        let totalSolarPV = 0, totalSolarThermal = 0, totalSmallWind = 0, totalBiomass = 0, totalGeothermal = 0;
        let totalCurrentGeneration = 0;
        
        districts.forEach(district => {
            const parsedDistrict = parseDistrictData(district);
            const energyDemand = parsedDistrict.energy_demand;
            const renewablePotential = parsedDistrict.renewable_potential;
            
            totalElectricityDemand += energyDemand.electricity_mwh || 0;
            totalHeatingDemand += energyDemand.heating_mwh || 0;
            totalCoolingDemand += energyDemand.cooling_mwh || 0;
            totalTransportDemand += energyDemand.transport_mwh || 0;
            
            totalSolarPV += renewablePotential.solar_pv_mwh || 0;
            totalSolarThermal += renewablePotential.solar_thermal_mwh || 0;
            totalSmallWind += renewablePotential.small_wind_mwh || 0;
            totalBiomass += renewablePotential.biomass_mwh || 0;
            totalGeothermal += renewablePotential.geothermal_mwh || 0;
        });
        
        // Calculate current generation (using district-view percentages)
        const currentSolarPV = totalSolarPV * 0.15;
        const currentSolarThermal = totalSolarThermal * 0.25;
        const currentBiomass = totalBiomass * 0.80;
        totalCurrentGeneration = currentSolarPV + currentSolarThermal + currentBiomass;
        
        const content = `
            <!-- Basic Info Row - analog zu district-view.js -->
            <div class="row mb-4">
                <div class="col-4">
                    <div class="text-center p-3 bg-light rounded">
                        <h6 class="text-muted mb-1">Einwohner</h6>
                        <h4 class="text-primary mb-0">${formatNumber(totalPopulation, 0)}</h4>
                    </div>
                </div>
                <div class="col-4">
                    <div class="text-center p-3 bg-light rounded">
                        <h6 class="text-muted mb-1">Fläche</h6>
                        <h4 class="text-primary mb-0">${totalArea.toFixed(1)} km²</h4>
                    </div>
                </div>
                <div class="col-4">
                    <div class="text-center p-3 bg-light rounded">
                        <h6 class="text-muted mb-1">Quartiere</h6>
                        <h4 class="text-success mb-0">${districts.length}</h4>
                    </div>
                </div>
            </div>
            
            <!-- Additional Info Row -->
            <div class="row mb-4">
                <div class="col-4">
                    <div class="text-center p-2 bg-light rounded">
                        <small class="text-muted">Dichte</small>
                        <div class="fw-bold">${formatNumber(totalPopulation / totalArea, 0)}</div>
                        <small class="text-muted">EW/km²</small>
                    </div>
                </div>
                <div class="col-4">
                    <div class="text-center p-2 bg-light rounded">
                        <small class="text-muted">Autarkie</small>
                        <div class="fw-bold">${renewableShare}%</div>
                        <small class="text-muted">Aktuell</small>
                    </div>
                </div>
                <div class="col-4">
                    <div class="text-center p-2 bg-light rounded">
                        <small class="text-muted">Haushalte</small>
                        <div class="fw-bold">${formatNumber(Math.round(totalPopulation / 2.1), 0)}</div>
                        <small class="text-muted">Gesamt</small>
                    </div>
                </div>
            </div>
            
            <!-- Energy Demand - Erweitert (analog zu district-view.js) -->
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
                                    <div class="fw-bold fs-6 text-primary">${formatNumber(totalElectricityDemand, 0)}</div>
                                    <small class="text-muted">MWh/Jahr</small>
                                </div>
                                <div class="col-3">
                                    <small class="text-muted">Wärme</small>
                                    <div class="fw-bold fs-6 text-orange">${formatNumber(totalHeatingDemand, 0)}</div>
                                    <small class="text-muted">MWh/Jahr</small>
                                </div>
                                <div class="col-3">
                                    <small class="text-muted">Kühlung</small>
                                    <div class="fw-bold fs-6 text-info">${formatNumber(totalCoolingDemand, 0)}</div>
                                    <small class="text-muted">MWh/Jahr</small>
                                </div>
                                <div class="col-3">
                                    <small class="text-muted">Transport</small>
                                    <div class="fw-bold fs-6 text-secondary">${formatNumber(totalTransportDemand, 0)}</div>
                                    <small class="text-muted">MWh/Jahr</small>
                                </div>
                            </div>
                            <hr>
                            <div class="text-center">
                                <small class="text-muted">Gesamtbedarf</small>
                                <div class="fw-bold fs-4 text-danger">${formatEnergy(totalDemand, 'MWh', 0)}</div>
                                <small class="text-muted">Pro Einwohner: ${formatNumber(totalDemand / totalPopulation, 1)} MWh/Jahr</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- EE-Potential - Erweitert (analog zu district-view.js) -->
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
                                    <div class="fw-bold text-warning">${formatNumber(totalSolarPV, 0)}</div>
                                    <small class="text-muted">MWh/Jahr</small>
                                </div>
                                <div class="col-4">
                                    <small class="text-muted">Solar Thermal</small>
                                    <div class="fw-bold text-orange">${formatNumber(totalSolarThermal, 0)}</div>
                                    <small class="text-muted">MWh/Jahr</small>
                                </div>
                                <div class="col-4">
                                    <small class="text-muted">Kleinwind</small>
                                    <div class="fw-bold text-info">${formatNumber(totalSmallWind, 0)}</div>
                                    <small class="text-muted">MWh/Jahr</small>
                                </div>
                            </div>
                            <div class="row text-center mb-3">
                                <div class="col-6">
                                    <small class="text-muted">Biomasse</small>
                                    <div class="fw-bold text-success">${formatNumber(totalBiomass, 0)}</div>
                                    <small class="text-muted">MWh/Jahr</small>
                                </div>
                                <div class="col-6">
                                    <small class="text-muted">Geothermie</small>
                                    <div class="fw-bold text-primary">${formatNumber(totalGeothermal, 0)}</div>
                                    <small class="text-muted">MWh/Jahr</small>
                                </div>
                            </div>
                            <hr>
                            <div class="text-center">
                                <small class="text-muted">Gesamt-Potential</small>
                                <div class="fw-bold fs-4 text-success">${formatEnergy(totalPotential, 'MWh', 0)}</div>
                                <small class="text-muted">Deckungsgrad: ${formatPercentage(totalPotential / totalDemand * 100, 0)} des Bedarfs</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Aktuelle EE-Erzeugung (analog zu district-view.js) -->
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
                                    <div class="fw-bold text-warning">${formatNumber(currentSolarPV, 0)}</div>
                                    <small class="text-muted">MWh/Jahr</small>
                                    <div class="progress mt-1" style="height: 5px;">
                                        <div class="progress-bar bg-warning" style="width: 15%"></div>
                                    </div>
                                    <small class="text-muted">15% genutzt</small>
                                </div>
                                <div class="col-4">
                                    <small class="text-muted">Solar Thermal</small>
                                    <div class="fw-bold text-orange">${formatNumber(currentSolarThermal, 0)}</div>
                                    <small class="text-muted">MWh/Jahr</small>
                                    <div class="progress mt-1" style="height: 5px;">
                                        <div class="progress-bar bg-orange" style="width: 25%"></div>
                                    </div>
                                    <small class="text-muted">25% genutzt</small>
                                </div>
                                <div class="col-4">
                                    <small class="text-muted">Biomasse</small>
                                    <div class="fw-bold text-success">${formatNumber(currentBiomass, 0)}</div>
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
                                <div class="fw-bold fs-4 text-warning">${formatEnergy(totalCurrentGeneration, 'MWh', 0)}</div>
                                <small class="text-muted">Ausschöpfungsgrad: ${formatPercentage(totalCurrentGeneration / totalPotential * 100, 0)} des Potentials</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Resultierende Ergebnisse - Kosten & CO2 (Gesamt) -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0"><i class="bi bi-calculator"></i> Resultierende Ergebnisse (Gesamt)</h6>
                        </div>
                        <div class="card-body" id="totalResultsContent">
                            <div class="text-center">
                                <div class="spinner-border text-info" role="status">
                                    <span class="visually-hidden">Berechne Gesamt-Ergebnisse...</span>
                                </div>
                                <p class="mt-2">Kosten und CO2-Bilanz für alle Quartiere werden berechnet...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Detailanalyse Button und Quartiers-Übersicht -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="bi bi-table text-primary"></i> Detailanalyse - Quartiers-Übersicht</h6>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Quartier</th>
                                            <th>Bedarf</th>
                                            <th>Potential</th>
                                            <th>Bilanz</th>
                                            <th class="text-center">Aktion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${districts.map(district => {
                                            const districtMetrics = calculateEnergyMetrics(district);
                                            const districtDemand = districtMetrics.totalDemand;
                                            const districtPotential = districtMetrics.totalPotential;
                                            const balance = districtPotential - districtDemand;
                                            const autarky = districtMetrics.renewableShare;
                                            
                                            return `
                                                <tr style="cursor: pointer;" onclick="selectDistrictFromOverview('${district.id}')">
                                                    <td><strong>${district.name}</strong><br><small class="text-muted">${(district.population || 0).toLocaleString()} EW</small></td>
                                                    <td>${formatEnergy(districtDemand, 'MWh', 0)}<br><small class="text-muted">Bedarf</small></td>
                                                    <td>${formatEnergy(districtPotential, 'MWh', 0)}<br><small class="text-muted">Potential</small></td>
                                                    <td>
                                                        <span class="badge ${balance >= 0 ? 'bg-success' : 'bg-danger'}">
                                                            ${balance >= 0 ? '+' : ''}${formatNumber(balance, 0)} MWh
                                                        </span><br>
                                                        <small class="text-muted">${autarky}% Autarkie</small>
                                                    </td>
                                                    <td class="text-center">
                                                        <button class="btn btn-sm btn-outline-primary" onclick="selectDistrictFromOverview('${district.id}')">
                                                            Details
                                                        </button>
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
        
        // Load total results asynchronously after UI is rendered
        setTimeout(async () => {
            try {
                await loadTotalResults(districts);
            } catch (error) {
                console.error('Error loading total results:', error);
                const resultsContainer = document.getElementById('totalResultsContent');
                if (resultsContainer) {
                    resultsContainer.innerHTML = `
                        <div class="alert alert-warning">
                            <h6>Fehler bei der Berechnung</h6>
                            <p>Die Gesamt-Kosten- und CO2-Berechnung konnte nicht durchgeführt werden.</p>
                            <small>${error.message}</small>
                        </div>
                    `;
                }
            }
        }, 200);
        
        return content;
        
    } catch (error) {
        console.error('Error creating all districts content:', error);
        return `
            <div class="alert alert-danger">
                <h6>Fehler beim Laden der Daten</h6>
                <p>Die Gesamtübersicht konnte nicht geladen werden.</p>
                <small class="text-muted">${error.message}</small>
            </div>
        `;
    }
}

// Function to load total results for all districts
async function loadTotalResults(districts) {
    try {
        console.log('Loading total results for all districts...');
        
        // Get system config for economic calculations - with fallback methods
        let systemConfig;
        try {
            // First try to use the ConfigData class (which is working in district-view)
            if (typeof window.ConfigData !== 'undefined' && window.ConfigData.getSystemConfig) {
                systemConfig = await window.ConfigData.getSystemConfig();
            } else if (typeof window.apiClient !== 'undefined' && window.apiClient.getSystemConfig) {
                systemConfig = await window.apiClient.getSystemConfig();
            } else {
                // Fallback: try direct API call
                const response = await fetch('/api/system-config');
                if (response.ok) {
                    systemConfig = await response.json();
                } else {
                    throw new Error('System config API not available');
                }
            }
        } catch (configError) {
            console.warn('Could not load system config, using fallback values:', configError);
            // Use fallback configuration similar to economic-analysis.js
            systemConfig = {
                energy_scenarios: {
                    scenario_1: {
                        electricity_price_eur_mwh: 280,
                        heating_price_eur_mwh: 120,
                        transport_price_eur_mwh: 150
                    }
                },
                emission_factors: {
                    electricity_kg_co2_mwh: 420,
                    heating_kg_co2_mwh: 250,
                    transport_kg_co2_mwh: 280
                },
                social_cost_carbon_eur_per_tonne: 195
            };
        }
        
        // Calculate aggregate results for all districts
        let totalEnergyCosts = 0;
        let totalCO2Emissions = 0;
        let totalSocialCost = 0;
        let totalEESavings = 0;
        let totalNetBenefit = 0;
        
        // Check if economic analysis functions are available
        if (typeof window.calculateAnnualEnergyCosts === 'undefined' || 
            typeof window.calculateCO2Emissions === 'undefined' || 
            typeof window.calculateDistrictResults === 'undefined' ||
            typeof window.parseDistrictData === 'undefined') {
            throw new Error('Economic analysis functions not available. Required: calculateAnnualEnergyCosts, calculateCO2Emissions, calculateDistrictResults, parseDistrictData');
        }
        
        // Process each district
        for (const district of districts) {
            try {
                // Parse district data for economic calculations
                const districtData = window.parseDistrictData(district);
                
                // Calculate economic results
                const annualCosts = window.calculateAnnualEnergyCosts(districtData, systemConfig);
                const co2Results = window.calculateCO2Emissions(districtData, systemConfig);
                const districtResults = window.calculateDistrictResults(districtData, systemConfig);
                
                // Aggregate the results - using correct property names
                totalEnergyCosts += annualCosts.total_costs || 0;
                totalCO2Emissions += co2Results.total_emissions_tons || 0;
                totalSocialCost += districtResults.co2_costs || 0;
                totalEESavings += annualCosts.renewable_savings || 0;
                totalNetBenefit += (annualCosts.renewable_savings || 0) - (districtResults.co2_costs || 0);
                
                console.log(`District ${district.name} results:`, {
                    costs: annualCosts.total_costs,
                    co2_tons: co2Results.total_emissions_tons,
                    social_cost: districtResults.co2_costs,
                    ee_savings: annualCosts.renewable_savings
                });
                
            } catch (districtError) {
                console.warn(`Error calculating results for district ${district.name}:`, districtError);
                // Continue with other districts
            }
        }
        
        // Generate the total results HTML
        const totalResultsHTML = generateTotalResultsHTML({
            totalEnergyCosts,
            totalCO2Emissions,
            totalSocialCost,
            totalEESavings,
            totalNetBenefit,
            districtsCount: districts.length
        });
        
        // Update the UI
        const resultsContainer = document.getElementById('totalResultsContent');
        if (resultsContainer) {
            resultsContainer.innerHTML = totalResultsHTML;
        }
        
        console.log('Total results loaded successfully');
        
    } catch (error) {
        console.error('Error in loadTotalResults:', error);
        throw error;
    }
}

// Function to generate HTML for total results display
function generateTotalResultsHTML(results) {
    const {
        totalEnergyCosts,
        totalCO2Emissions,
        totalSocialCost,
        totalEESavings,
        totalNetBenefit,
        districtsCount
    } = results;
    
    return `
        <div class="row text-center mb-3">
            <div class="col-md-6">
                <div class="p-3 bg-light rounded">
                    <h6 class="text-muted mb-1">Jährliche Energiekosten (Gesamt)</h6>
                    <h4 class="text-danger mb-0">${formatNumber(totalEnergyCosts, 0)} €</h4>
                    <small class="text-muted">Alle ${districtsCount} Quartiere</small>
                </div>
            </div>
            <div class="col-md-6">
                <div class="p-3 bg-light rounded">
                    <h6 class="text-muted mb-1">CO2-Emissionen (Gesamt)</h6>
                    <h4 class="text-warning mb-0">${formatNumber(totalCO2Emissions, 0)} t CO2</h4>
                    <small class="text-muted">Pro Jahr</small>
                </div>
            </div>
        </div>
        
        <div class="row text-center mb-3">
            <div class="col-md-4">
                <div class="p-2 bg-light rounded">
                    <small class="text-muted">Soziale Kosten CO2</small>
                    <div class="fw-bold text-danger">${formatNumber(totalSocialCost, 0)} €</div>
                    <small class="text-muted">Pro Jahr</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="p-2 bg-light rounded">
                    <small class="text-muted">EE-Einsparungen</small>
                    <div class="fw-bold text-success">${formatNumber(totalEESavings, 0)} €</div>
                    <small class="text-muted">Potentiell</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="p-2 bg-light rounded">
                    <small class="text-muted">Netto-Nutzen</small>
                    <div class="fw-bold ${totalNetBenefit >= 0 ? 'text-success' : 'text-danger'}">${formatNumber(totalNetBenefit, 0)} €</div>
                    <small class="text-muted">Bei Vollausbau</small>
                </div>
            </div>
        </div>
        
        <hr>
        
        <div class="row text-center">
            <div class="col-md-6">
                <h6 class="text-muted">Durchschnittliche Kosten pro Quartier</h6>
                <div class="fw-bold fs-5 text-primary">${formatNumber(totalEnergyCosts / districtsCount, 0)} €/Jahr</div>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted">Durchschnittliche Emissionen pro Quartier</h6>
                <div class="fw-bold fs-5 text-warning">${formatNumber(totalCO2Emissions / districtsCount, 0)} t CO2/Jahr</div>
            </div>
        </div>
        
        <div class="mt-3">
            <small class="text-muted">
                <i class="bi bi-info-circle"></i>
                Berechnung basiert auf aktuellen Energiepreisen und Emissionsfaktoren.
                EE-Einsparungen zeigen das Potential bei Vollausbau der erneuerbaren Energien.
            </small>
        </div>
    `;
}

// Export to global scope
window.createAllDistrictsContent = createAllDistrictsContent;
