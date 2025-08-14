/**
 * Economic Analysis Utility
 * Berechnet Kosten und CO2-Bilanz basierend auf Quartiersdaten und Systemkonfiguration
 */

// Berechne jährliche Energiekosten für ein Quartier
function calculateAnnualEnergyCosts(district, systemConfig) {
    const parsedDistrict = parseDistrictData(district);
    const energyDemand = parsedDistrict.energy_demand;
    const renewablePotential = parsedDistrict.renewable_potential;
    
    // Robuste Verarbeitung der Systemkonfiguration
    let scenario;
    if (systemConfig && systemConfig.energy_scenarios && systemConfig.energy_scenarios.base_case) {
        scenario = systemConfig.energy_scenarios.base_case;
    } else {
        console.warn('Using fallback energy prices - system config not properly loaded');
        // Fallback-Preise
        scenario = {
            electricity_prices: { 2025: 0.32 },
            gas_prices: { 2025: 0.08 },
            heat_prices: { 2025: 0.09 }
        };
    }
    
    const currentYear = new Date().getFullYear();
    
    // Interpoliere Preise für aktuelles Jahr (falls nicht exakt definiert)
    const electricityPrice = interpolatePrice(scenario.electricity_prices, currentYear) || 0.32;
    const gasPrice = interpolatePrice(scenario.gas_prices, currentYear) || 0.08;
    const heatPrice = interpolatePrice(scenario.heat_prices, currentYear) || 0.09;
    
    // Berechne Kosten für verschiedene Energieträger
    const electricityCostTotal = (energyDemand.electricity_mwh || 0) * 1000 * electricityPrice; // MWh -> kWh -> EUR
    const heatingCostGas = (energyDemand.heating_mwh || 0) * 1000 * gasPrice; // Annahme: Gas-basierte Heatingt
    const coolingCostElectricity = (energyDemand.cooling_mwh || 0) * 1000 * electricityPrice; // Kühlung über Strom
    const transportCostElectricity = (energyDemand.transport_mwh || 0) * 1000 * electricityPrice; // E-Mobilität
    
    // Aktuelle EE-Erzeugung (aus district-view.js Prozentsätzen)
    const currentSolarPV = (renewablePotential.solar_pv_mwh || 0) * 0.15;
    const currentSolarThermal = (renewablePotential.solar_thermal_mwh || 0) * 0.25;
    const currentBiomass = (renewablePotential.biomass_mwh || 0) * 0.80;
    const totalCurrentGeneration = currentSolarPV + currentSolarThermal + currentBiomass;
    
    // EE-Einsparungen (vermiedene Energiekosten)
    const solarPVSavings = currentSolarPV * 1000 * electricityPrice;
    const solarThermalSavings = currentSolarThermal * 1000 * heatPrice;
    const biomassSavings = currentBiomass * 1000 * heatPrice;
    const totalRenewableSavings = solarPVSavings + solarThermalSavings + biomassSavings;
    
    const totalEnergyCosts = electricityCostTotal + heatingCostGas + coolingCostElectricity + transportCostElectricity;
    const netEnergyCosts = totalEnergyCosts - totalRenewableSavings;
    
    return {
        total_costs: totalEnergyCosts,
        net_costs: Math.max(netEnergyCosts, 0), // Nicht negativ
        renewable_savings: totalRenewableSavings,
        breakdown: {
            electricity: electricityCostTotal,
            heating: heatingCostGas,
            cooling: coolingCostElectricity,
            transport: transportCostElectricity
        },
        renewable_breakdown: {
            solar_pv_savings: solarPVSavings,
            solar_thermal_savings: solarThermalSavings,
            biomass_savings: biomassSavings
        },
        current_generation_mwh: totalCurrentGeneration
    };
}

// Berechne CO2-Emissionen für ein Quartier
function calculateCO2Emissions(district, systemConfig) {
    const parsedDistrict = parseDistrictData(district);
    const energyDemand = parsedDistrict.energy_demand;
    const renewablePotential = parsedDistrict.renewable_potential;
    
    // Robuste Verarbeitung der Emissionsfaktoren
    let emissionFactors;
    if (systemConfig && systemConfig.emission_factors) {
        emissionFactors = systemConfig.emission_factors;
    } else {
        console.warn('Using fallback emission factors - system config not properly loaded');
        // Fallback-Emissionsfaktoren
        emissionFactors = {
            electricity_grid_kg_co2_per_kwh: 0.40,
            gas_kg_co2_per_kwh: 0.20,
            biomass_kg_co2_per_kwh: 0.02
        };
    }
    
    // CO2-Emissionen nach Energieträger (in kg CO2)
    const electricityEmissions = (energyDemand.electricity_mwh || 0) * 1000 * emissionFactors.electricity_grid_kg_co2_per_kwh;
    const heatingEmissions = (energyDemand.heating_mwh || 0) * 1000 * emissionFactors.gas_kg_co2_per_kwh;
    const coolingEmissions = (energyDemand.cooling_mwh || 0) * 1000 * emissionFactors.electricity_grid_kg_co2_per_kwh;
    const transportEmissions = (energyDemand.transport_mwh || 0) * 1000 * emissionFactors.electricity_grid_kg_co2_per_kwh;
    
    // Aktuelle EE-Erzeugung (vermiedene Emissionen)
    const currentSolarPV = (renewablePotential.solar_pv_mwh || 0) * 0.15;
    const currentSolarThermal = (renewablePotential.solar_thermal_mwh || 0) * 0.25;
    const currentBiomass = (renewablePotential.biomass_mwh || 0) * 0.80;
    
    // Vermiedene CO2-Emissionen durch EE
    const solarPVEmissionSavings = currentSolarPV * 1000 * emissionFactors.electricity_grid_kg_co2_per_kwh;
    const solarThermalEmissionSavings = currentSolarThermal * 1000 * emissionFactors.gas_kg_co2_per_kwh;
    const biomassEmissions = currentBiomass * 1000 * emissionFactors.biomass_kg_co2_per_kwh; // Minimal
    const biomassEmissionSavings = currentBiomass * 1000 * emissionFactors.gas_kg_co2_per_kwh - biomassEmissions;
    
    const totalEmissions = electricityEmissions + heatingEmissions + coolingEmissions + transportEmissions;
    const totalEmissionSavings = solarPVEmissionSavings + solarThermalEmissionSavings + biomassEmissionSavings;
    const netEmissions = Math.max(totalEmissions - totalEmissionSavings, biomassEmissions);
    
    return {
        total_emissions_kg: totalEmissions,
        net_emissions_kg: netEmissions,
        emission_savings_kg: totalEmissionSavings,
        total_emissions_tons: totalEmissions / 1000,
        net_emissions_tons: netEmissions / 1000,
        emission_savings_tons: totalEmissionSavings / 1000,
        breakdown: {
            electricity_kg: electricityEmissions,
            heating_kg: heatingEmissions,
            cooling_kg: coolingEmissions,
            transport_kg: transportEmissions
        },
        renewable_breakdown: {
            solar_pv_savings_kg: solarPVEmissionSavings,
            solar_thermal_savings_kg: solarThermalEmissionSavings,
            biomass_savings_kg: biomassEmissionSavings,
            biomass_emissions_kg: biomassEmissions
        },
        per_capita_tons: (netEmissions / 1000) / (district.population || 1)
    };
}

// Hilfsfunktion: Interpoliere Preise zwischen Jahren
function interpolatePrice(priceData, targetYear) {
    if (!priceData || typeof priceData !== 'object') {
        console.warn('Invalid price data provided to interpolatePrice');
        return null;
    }
    
    const years = Object.keys(priceData).map(Number).sort();
    
    if (years.length === 0) {
        console.warn('No price data available');
        return null;
    }
    
    // Exakter Treffer
    if (priceData[targetYear]) {
        return priceData[targetYear];
    }
    
    // Finde umgebende Jahre
    let lowerYear = null, upperYear = null;
    for (let year of years) {
        if (year <= targetYear) lowerYear = year;
        if (year >= targetYear && !upperYear) upperYear = year;
    }
    
    // Extrapolation/Interpolation
    if (!lowerYear) return priceData[upperYear];
    if (!upperYear) return priceData[lowerYear];
    if (lowerYear === upperYear) return priceData[lowerYear];
    
    // Lineare Interpolation
    const ratio = (targetYear - lowerYear) / (upperYear - lowerYear);
    return priceData[lowerYear] + ratio * (priceData[upperYear] - priceData[lowerYear]);
}

// Berechne kombinierte Ergebnisse (Kosten + CO2)
function calculateDistrictResults(district, systemConfig) {
    const costs = calculateAnnualEnergyCosts(district, systemConfig);
    const emissions = calculateCO2Emissions(district, systemConfig);
    
    // CO2-Kosten (social cost of carbon)
    let socialCostOfCarbon = 180; // Default
    if (systemConfig && systemConfig.analysis_settings && 
        systemConfig.analysis_settings.economic_analysis && 
        systemConfig.analysis_settings.economic_analysis.social_cost_of_carbon) {
        socialCostOfCarbon = systemConfig.analysis_settings.economic_analysis.social_cost_of_carbon;
    }
    
    const co2Costs = emissions.net_emissions_tons * socialCostOfCarbon;
    
    return {
        district_id: district.id,
        district_name: district.name,
        population: district.population || 0,
        costs,
        emissions,
        co2_costs: co2Costs,
        total_annual_costs: costs.net_costs + co2Costs,
        costs_per_capita: costs.net_costs / (district.population || 1),
        co2_costs_per_capita: co2Costs / (district.population || 1)
    };
}

// Export to global scope
window.calculateAnnualEnergyCosts = calculateAnnualEnergyCosts;
window.calculateCO2Emissions = calculateCO2Emissions;
window.calculateDistrictResults = calculateDistrictResults;
window.interpolatePrice = interpolatePrice;
