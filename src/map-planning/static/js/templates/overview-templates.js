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
            
            <!-- Aggregierte Kosten-Zeitverlauf -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h6 class="mb-0"><i class="bi bi-graph-up"></i> Gesamtkosten-Entwicklung bis 2050</h6>
                        </div>
                        <div class="card-body">
                            <div id="aggregateCostTimelineChart" style="min-height: 350px;">
                                <div class="text-center">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Lade aggregiertes Diagramm...</span>
                                    </div>
                                    <p class="mt-2">Berechne Gesamtkosten-Entwicklung für alle Quartiere...</p>
                                </div>
                            </div>
                            <div class="mt-2">
                                <small class="text-muted">
                                    <i class="bi bi-info-circle"></i>
                                    Aggregierte Energiekosten aller ${districts.length} Quartiere in verschiedenen Szenarien.
                                    Zeigt die Auswirkungen unterschiedlicher Energiepreis-Entwicklungen auf die Gesamtstadt.
                                </small>
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
        
        // Load aggregate cost timeline chart
        setTimeout(async () => {
            try {
                await loadAggregateCostTimelineChart(districts);
            } catch (error) {
                console.warn('Could not load aggregate cost timeline chart:', error);
            }
        }, 400);
        
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

// Load and render aggregate cost timeline chart for all districts
async function loadAggregateCostTimelineChart(districts) {
    try {
        console.log('Loading aggregate cost timeline chart for all districts...');
        
        // Get system config
        let systemConfig;
        try {
            if (typeof window.ConfigData !== 'undefined' && window.ConfigData.getSystemConfig) {
                systemConfig = await window.ConfigData.getSystemConfig();
            } else if (typeof window.apiClient !== 'undefined' && window.apiClient.getSystemConfig) {
                systemConfig = await window.apiClient.getSystemConfig();
            } else {
                const response = await fetch('/api/system-config');
                if (response.ok) {
                    systemConfig = await response.json();
                } else {
                    throw new Error('System config API not available');
                }
            }
        } catch (configError) {
            console.warn('Using fallback config for aggregate timeline:', configError);
            systemConfig = {
                energy_scenarios: {
                    base_case: {
                        electricity_prices: { 2025: 0.32, 2030: 0.35, 2040: 0.40, 2050: 0.45 },
                        gas_prices: { 2025: 0.08, 2030: 0.10, 2040: 0.15, 2050: 0.20 },
                        heat_prices: { 2025: 0.09, 2030: 0.11, 2040: 0.14, 2050: 0.18 }
                    },
                    high_prices: {
                        electricity_prices: { 2025: 0.38, 2030: 0.45, 2040: 0.55, 2050: 0.65 },
                        gas_prices: { 2025: 0.12, 2030: 0.18, 2040: 0.25, 2050: 0.35 },
                        heat_prices: { 2025: 0.13, 2030: 0.18, 2040: 0.22, 2050: 0.28 }
                    },
                    green_transition: {
                        electricity_prices: { 2025: 0.30, 2030: 0.28, 2040: 0.25, 2050: 0.22 },
                        gas_prices: { 2025: 0.10, 2030: 0.15, 2040: 0.25, 2050: 0.40 },
                        heat_prices: { 2025: 0.10, 2030: 0.12, 2040: 0.15, 2050: 0.18 }
                    }
                }
            };
        }
        
        // Check if timeline functions are available
        if (typeof window.calculateCostTimeline !== 'function') {
            throw new Error('Cost timeline calculation functions not available');
        }
        
        // Calculate aggregate timeline for all scenarios
        const scenarios = ['base_case', 'high_prices', 'green_transition'];
        const aggregateData = {};
        
        scenarios.forEach(scenarioKey => {
            const scenarioTimeline = [];
            const years = [2025, 2030, 2035, 2040, 2045, 2050];
            
            years.forEach(year => {
                let totalCostsForYear = 0;
                
                // Sum costs from all districts for this year and scenario
                districts.forEach(district => {
                    try {
                        const districtTimeline = window.calculateCostTimeline(district, systemConfig, scenarioKey);
                        const yearData = districtTimeline.timeline.find(point => point.year === year);
                        if (yearData) {
                            totalCostsForYear += yearData.total_costs || 0;
                        }
                    } catch (districtError) {
                        console.warn(`Error calculating timeline for district ${district.name}:`, districtError);
                    }
                });
                
                scenarioTimeline.push({
                    year: year,
                    total_costs: totalCostsForYear
                });
            });
            
            aggregateData[scenarioKey] = {
                scenario_name: getScenarioDisplayName(scenarioKey),
                timeline: scenarioTimeline
            };
        });
        
        // Generate chart HTML
        const chartHTML = generateAggregateCostTimelineHTML(aggregateData, districts.length);
        
        // Update chart container
        const chartContainer = document.getElementById('aggregateCostTimelineChart');
        if (chartContainer) {
            chartContainer.innerHTML = chartHTML;
        }
        
        console.log('Aggregate cost timeline chart loaded successfully');
        
    } catch (error) {
        console.error('Error loading aggregate cost timeline chart:', error);
        const chartContainer = document.getElementById('aggregateCostTimelineChart');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="alert alert-warning">
                    <h6>Diagramm nicht verfügbar</h6>
                    <p>Die aggregierte Kostenentwicklung konnte nicht dargestellt werden.</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }
}

// Helper function to get display names for scenarios
function getScenarioDisplayName(scenarioKey) {
    const names = {
        'base_case': 'Basis-Szenario',
        'high_prices': 'Hohe Energiepreise',
        'green_transition': 'Grüne Energiewende'
    };
    return names[scenarioKey] || scenarioKey;
}

// Generate HTML for aggregate cost timeline visualization
function generateAggregateCostTimelineHTML(aggregateData, districtCount) {
    const scenarios = Object.keys(aggregateData);
    if (scenarios.length === 0) {
        return '<p class="text-muted">Keine aggregierten Daten verfügbar</p>';
    }
    
    // Get maximum and minimum costs for better scaling
    const maxCost = Math.max(...scenarios.map(key => 
        Math.max(...aggregateData[key].timeline.map(point => point.total_costs || 0))
    ));
    
    const minCost = Math.min(...scenarios.map(key => 
        Math.min(...aggregateData[key].timeline.map(point => point.total_costs || 0))
    ));
    
    const colors = {
        'base_case': '#007bff',
        'high_prices': '#dc3545', 
        'green_transition': '#28a745'
    };
    
    const firstScenario = aggregateData[scenarios[0]];
    const chartHeight = 280;
    const chartPadding = 25;
    const usableHeight = chartHeight - (2 * chartPadding);
    
    let html = `
        <div class="cost-timeline-chart">
            <h5 class="mb-4 text-center text-primary">Gesamtkosten-Entwicklung aller ${districtCount} Quartiere</h5>
            
            <!-- Legend with better styling -->
            <div class="text-center mb-4">
                ${scenarios.map(key => `
                    <span class="badge me-3 px-4 py-2" style="background-color: ${colors[key] || '#6c757d'}; font-size: 1em;">
                        <i class="bi bi-circle-fill me-1"></i>${aggregateData[key].scenario_name}
                    </span>
                `).join('')}
            </div>
            
            <!-- Chart Area with improved design -->
            <div class="chart-container position-relative border rounded shadow-sm" style="height: 350px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px;">
                <!-- Y-Axis Labels with better positioning -->
                <div class="position-absolute" style="left: 8px; top: 30px; font-size: 0.8em; color: #495057; font-weight: 600;">
                    ${formatNumber(maxCost / 1000, 0)}k €
                </div>
                <div class="position-absolute" style="left: 8px; top: 45%; font-size: 0.8em; color: #495057; font-weight: 600;">
                    ${formatNumber(((maxCost + minCost) / 2) / 1000, 0)}k €
                </div>
                <div class="position-absolute" style="left: 8px; bottom: 60px; font-size: 0.8em; color: #495057; font-weight: 600;">
                    ${formatNumber(minCost / 1000, 0)}k €
                </div>
                
                <!-- Chart Lines with improved SVG -->
                <svg width="100%" height="${chartHeight}" style="margin-left: 50px; margin-top: 15px;">
                    <!-- Grid lines for better readability -->
                    ${[0, 0.2, 0.4, 0.6, 0.8, 1].map(ratio => `
                        <line x1="25" y1="${chartPadding + (ratio * usableHeight)}" 
                              x2="650" y2="${chartPadding + (ratio * usableHeight)}" 
                              stroke="#dee2e6" stroke-width="1" stroke-dasharray="3,3" opacity="0.7"/>
                    `).join('')}
                    
                    <!-- Vertical grid lines -->
                    ${firstScenario.timeline.map((_, index) => {
                        const x = 40 + (index * 120);
                        return `
                            <line x1="${x}" y1="${chartPadding}" 
                                  x2="${x}" y2="${chartPadding + usableHeight}" 
                                  stroke="#dee2e6" stroke-width="1" stroke-dasharray="2,2" opacity="0.5"/>
                        `;
                    }).join('')}
                    
                    ${scenarios.map(scenarioKey => {
                        const data = aggregateData[scenarioKey];
                        const points = data.timeline.map((point, index) => {
                            const x = 40 + (index * 120);
                            const y = chartPadding + (1 - ((point.total_costs - minCost) / (maxCost - minCost))) * usableHeight;
                            return `${x},${y}`;
                        }).join(' ');
                        
                        return `
                            <!-- Line with gradient effect -->
                            <polyline 
                                fill="none" 
                                stroke="${colors[scenarioKey] || '#6c757d'}" 
                                stroke-width="4" 
                                points="${points}"
                                style="filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.15));"
                            />
                            <!-- Data points with enhanced styling -->
                            ${data.timeline.map((point, index) => {
                                const x = 40 + (index * 120);
                                const y = chartPadding + (1 - ((point.total_costs - minCost) / (maxCost - minCost))) * usableHeight;
                                return `
                                    <circle cx="${x}" cy="${y}" r="6" fill="white" stroke="${colors[scenarioKey] || '#6c757d'}" stroke-width="3"
                                            style="filter: drop-shadow(1px 1px 3px rgba(0,0,0,0.2));">
                                        <title>${aggregateData[scenarioKey].scenario_name}: ${formatNumber(point.total_costs, 0)} € (${point.year})</title>
                                    </circle>
                                    <circle cx="${x}" cy="${y}" r="3" fill="${colors[scenarioKey] || '#6c757d'}"/>
                                `;
                            }).join('')}
                        `;
                    }).join('')}
                </svg>
                
                <!-- X-Axis Labels with improved styling -->
                <div class="d-flex justify-content-between position-absolute bottom-0 w-100" style="margin-left: 50px; padding-right: 50px; margin-bottom: 15px;">
                    ${firstScenario.timeline.map(point => 
                        `<span class="text-dark fw-bold border rounded px-2 py-1 bg-white shadow-sm" style="font-size: 0.9em;">${point.year}</span>`
                    ).join('')}
                </div>
            </div>
            
            <!-- Enhanced Summary Statistics -->
            <div class="row mt-4 g-3">
                <div class="col-md-3">
                    <div class="text-center p-3 bg-primary text-white rounded shadow">
                        <small class="d-block opacity-75">Aktuell (2025)</small>
                        <div class="fw-bold fs-5">${formatNumber(firstScenario.timeline[0].total_costs, 0)} €</div>
                        <small class="opacity-75">Alle Quartiere</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-3 bg-success text-white rounded shadow">
                        <small class="d-block opacity-75">Basis-Prognose 2050</small>
                        <div class="fw-bold fs-5">${formatNumber(aggregateData.base_case.timeline[aggregateData.base_case.timeline.length-1].total_costs, 0)} €</div>
                        <small class="opacity-75">+${Math.round(((aggregateData.base_case.timeline[aggregateData.base_case.timeline.length-1].total_costs / firstScenario.timeline[0].total_costs - 1) * 100))}% vs. 2025</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-3 bg-danger text-white rounded shadow">
                        <small class="d-block opacity-75">Hohe Preise 2050</small>
                        <div class="fw-bold fs-5">${formatNumber(aggregateData.high_prices.timeline[aggregateData.high_prices.timeline.length-1].total_costs, 0)} €</div>
                        <small class="opacity-75">+${Math.round(((aggregateData.high_prices.timeline[aggregateData.high_prices.timeline.length-1].total_costs / firstScenario.timeline[0].total_costs - 1) * 100))}% vs. 2025</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-3 bg-info text-white rounded shadow">
                        <small class="d-block opacity-75">Pro Quartier (Ø)</small>
                        <div class="fw-bold fs-5">${formatNumber(firstScenario.timeline[0].total_costs / districtCount, 0)} €</div>
                        <small class="opacity-75">Aktuell (2025)</small>
                    </div>
                </div>
            </div>
            
            <!-- Cost Impact Analysis -->
            <div class="mt-4">
                <div class="alert alert-info">
                    <h6 class="mb-2"><i class="bi bi-info-circle"></i> Szenario-Auswirkungen</h6>
                    <div class="row">
                        <div class="col-md-6">
                            <small class="text-muted d-block">Zusätzliche Kosten bei hohen Preisen (2050):</small>
                            <span class="fw-bold text-danger fs-6">+${formatNumber(aggregateData.high_prices.timeline[aggregateData.high_prices.timeline.length-1].total_costs - aggregateData.base_case.timeline[aggregateData.base_case.timeline.length-1].total_costs, 0)} €</span>
                            <small class="text-muted"> vs. Basis-Szenario</small>
                        </div>
                        <div class="col-md-6">
                            <small class="text-muted d-block">Einsparungen bei grüner Wende (2050):</small>
                            <span class="fw-bold text-success fs-6">${formatNumber(aggregateData.base_case.timeline[aggregateData.base_case.timeline.length-1].total_costs - aggregateData.green_transition.timeline[aggregateData.green_transition.timeline.length-1].total_costs, 0)} €</span>
                            <small class="text-muted"> vs. Basis-Szenario</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Data Table with enhanced design -->
            <div class="mt-4">
                <h6 class="text-muted mb-3"><i class="bi bi-table"></i> Detaillierte Kostenvergleich</h6>
                <div class="table-responsive">
                    <table class="table table-hover table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th class="fw-bold">Jahr</th>
                                ${scenarios.map(key => `<th class="fw-bold text-center">${aggregateData[key].scenario_name}</th>`).join('')}
                                <th class="fw-bold text-center">Differenz Hoch vs. Basis</th>
                                <th class="fw-bold text-center">Einsparung Grün vs. Basis</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${firstScenario.timeline.map((_, index) => {
                                const baseCost = aggregateData.base_case ? aggregateData.base_case.timeline[index].total_costs : 0;
                                const highCost = aggregateData.high_prices ? aggregateData.high_prices.timeline[index].total_costs : 0;
                                const greenCost = aggregateData.green_transition ? aggregateData.green_transition.timeline[index].total_costs : 0;
                                const highDifference = highCost - baseCost;
                                const greenSaving = baseCost - greenCost;
                                return `
                                <tr>
                                    <td class="fw-bold fs-6">${firstScenario.timeline[index].year}</td>
                                    ${scenarios.map(key => `
                                        <td class="text-center fw-bold" style="color: ${colors[key]}">${formatNumber(aggregateData[key].timeline[index].total_costs, 0)} €</td>
                                    `).join('')}
                                    <td class="text-center text-danger fw-bold">+${formatNumber(highDifference, 0)} €</td>
                                    <td class="text-center text-success fw-bold">-${formatNumber(greenSaving, 0)} €</td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    return html;
}

// Export to global scope
window.createAllDistrictsContent = createAllDistrictsContent;
