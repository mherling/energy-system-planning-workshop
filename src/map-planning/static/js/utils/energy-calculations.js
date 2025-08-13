/**
 * Energy Calculations Utility Module
 * Zentrale Berechnungen für Energiewerte zur Vermeidung von Code-Duplikation
 */

/**
 * Berechnet den Gesamtenergiebedarf aus verschiedenen Sektoren
 * @param {Object} energyDemand - Energiebedarfs-Objekt
 * @returns {number} Gesamtenergiebedarf in MWh
 */
function calculateTotalDemand(energyDemand) {
    if (!energyDemand) return 0;
    
    return (energyDemand.electricity_mwh || 0) + 
           (energyDemand.heating_mwh || 0) + 
           (energyDemand.cooling_mwh || 0) + 
           (energyDemand.transport_mwh || 0);
}

/**
 * Berechnet die Gesamterzeugung aus verschiedenen Quellen
 * @param {Object} generation - Erzegungs-Objekt
 * @returns {number} Gesamterzeugung in MWh
 */
function calculateTotalGeneration(generation) {
    if (!generation) return 0;
    
    return (generation.solar_pv_mwh || 0) + 
           (generation.solar_thermal_mwh || 0) + 
           (generation.small_wind_mwh || 0) + 
           (generation.biomass_mwh || 0) + 
           (generation.chp_mwh || 0) + 
           (generation.geothermal_mwh || 0);
}

/**
 * Berechnet das Gesamtpotenzial erneuerbarer Energien
 * @param {Object} renewables - Erneuerbare-Energien-Objekt
 * @returns {number} Gesamtpotenzial in MWh
 */
function calculateTotalPotential(renewables) {
    if (!renewables) return 0;
    
    return (renewables.solar_pv_mwh || 0) + 
           (renewables.solar_thermal_mwh || 0) + 
           (renewables.small_wind_mwh || 0) + 
           (renewables.biomass_mwh || 0) + 
           (renewables.geothermal_mwh || 0);
}

/**
 * Berechnet den Anteil erneuerbarer Energien am Gesamtbedarf
 * @param {number} totalGeneration - Gesamterzeugung in MWh
 * @param {number} totalDemand - Gesamtbedarf in MWh
 * @returns {number} Anteil in Prozent (0-100)
 */
function calculateRenewableShare(totalGeneration, totalDemand) {
    if (!totalDemand || totalDemand === 0) return 0;
    return Math.round((totalGeneration / totalDemand) * 100);
}

/**
 * Berechnet die Energiebilanz (Erzeugung minus Bedarf)
 * @param {number} totalGeneration - Gesamterzeugung in MWh
 * @param {number} totalDemand - Gesamtbedarf in MWh
 * @returns {number} Energiebilanz in MWh (positiv = Überschuss, negativ = Defizit)
 */
function calculateEnergyBalance(totalGeneration, totalDemand) {
    return totalGeneration - totalDemand;
}

/**
 * Berechnet die Potenzialausschöpfung (wie viel vom verfügbaren Potenzial wird genutzt)
 * @param {number} totalGeneration - Aktuelle Erzeugung in MWh
 * @param {number} totalPotential - Verfügbares Potenzial in MWh
 * @returns {number} Ausschöpfung in Prozent (0-100)
 */
function calculatePotentialUtilization(totalGeneration, totalPotential) {
    if (!totalPotential || totalPotential === 0) return 0;
    return Math.round((totalGeneration / totalPotential) * 100);
}

/**
 * Berechnet die Selbstversorgungsquote
 * @param {number} totalGeneration - Gesamterzeugung in MWh
 * @param {number} totalDemand - Gesamtbedarf in MWh
 * @returns {number} Selbstversorgungsquote in Prozent
 */
function calculateSelfSufficiency(totalGeneration, totalDemand) {
    if (!totalDemand || totalDemand === 0) return 0;
    return ((totalGeneration / totalDemand) * 100);
}

/**
 * Berechnet den durchschnittlichen Verbrauch pro Quartier
 * @param {number} totalDemand - Gesamtbedarf in MWh
 * @param {number} numberOfDistricts - Anzahl der Quartiere
 * @returns {number} Durchschnittlicher Verbrauch pro Quartier in MWh
 */
function calculateAverageConsumptionPerDistrict(totalDemand, numberOfDistricts) {
    if (!numberOfDistricts || numberOfDistricts === 0) return 0;
    return totalDemand / numberOfDistricts;
}

/**
 * Berechnet alle wichtigen Energiekennzahlen für ein Quartier oder Gesamtgebiet
 * @param {Object} data - Daten-Objekt mit energy_demand, current_generation, renewable_potential
 * @returns {Object} Objekt mit allen berechneten Kennzahlen
 */
function calculateEnergyMetrics(data) {
    const energyDemand = data.energy_demand || {};
    const currentGeneration = data.current_generation || {};
    const renewablePotential = data.renewable_potential || {};
    
    const totalDemand = calculateTotalDemand(energyDemand);
    const totalGeneration = calculateTotalGeneration(currentGeneration);
    const totalPotential = calculateTotalPotential(renewablePotential);
    
    return {
        totalDemand,
        totalGeneration,
        totalPotential,
        renewableShare: calculateRenewableShare(totalGeneration, totalDemand),
        energyBalance: calculateEnergyBalance(totalGeneration, totalDemand),
        potentialUtilization: calculatePotentialUtilization(totalGeneration, totalPotential),
        selfSufficiency: calculateSelfSufficiency(totalGeneration, totalDemand),
        hasEnergyOverflow: totalGeneration >= totalDemand,
        hasSurplus: totalGeneration > totalDemand
    };
}

/**
 * Berechnet aggregierte Energiekennzahlen für mehrere Quartiere
 * @param {Array} districts - Array von Quartier-Objekten
 * @returns {Object} Aggregierte Kennzahlen für alle Quartiere
 */
function calculateAggregatedMetrics(districts) {
    if (!districts || !Array.isArray(districts) || districts.length === 0) {
        return {
            totalDemand: 0,
            totalGeneration: 0,
            totalPotential: 0,
            totalPopulation: 0,
            totalArea: 0,
            renewableShare: 0,
            energyBalance: 0,
            potentialUtilization: 0,
            selfSufficiency: 0,
            averageConsumptionPerDistrict: 0,
            numberOfDistricts: 0
        };
    }
    
    let totalDemand = 0;
    let totalGeneration = 0;
    let totalPotential = 0;
    let totalPopulation = 0;
    let totalArea = 0;
    
    districts.forEach(district => {
        const metrics = calculateEnergyMetrics(district);
        totalDemand += metrics.totalDemand;
        totalGeneration += metrics.totalGeneration;
        totalPotential += metrics.totalPotential;
        totalPopulation += district.population || 0;
        totalArea += district.area_km2 || 0;
    });
    
    return {
        totalDemand,
        totalGeneration,
        totalPotential,
        totalPopulation,
        totalArea,
        renewableShare: calculateRenewableShare(totalGeneration, totalDemand),
        energyBalance: calculateEnergyBalance(totalGeneration, totalDemand),
        potentialUtilization: calculatePotentialUtilization(totalGeneration, totalPotential),
        selfSufficiency: calculateSelfSufficiency(totalGeneration, totalDemand),
        averageConsumptionPerDistrict: calculateAverageConsumptionPerDistrict(totalDemand, districts.length),
        numberOfDistricts: districts.length
    };
}

// Export aller Funktionen für globalen Zugriff
window.energyCalculations = {
    calculateTotalDemand,
    calculateTotalGeneration,
    calculateTotalPotential,
    calculateRenewableShare,
    calculateEnergyBalance,
    calculatePotentialUtilization,
    calculateSelfSufficiency,
    calculateAverageConsumptionPerDistrict,
    calculateEnergyMetrics,
    calculateAggregatedMetrics
};

// Direkte globale Funktionen für einfachen Zugriff
window.calculateTotalDemand = calculateTotalDemand;
window.calculateTotalGeneration = calculateTotalGeneration;
window.calculateTotalPotential = calculateTotalPotential;
window.calculateRenewableShare = calculateRenewableShare;
window.calculateEnergyBalance = calculateEnergyBalance;
window.calculatePotentialUtilization = calculatePotentialUtilization;
window.calculateSelfSufficiency = calculateSelfSufficiency;
window.calculateEnergyMetrics = calculateEnergyMetrics;
window.calculateAggregatedMetrics = calculateAggregatedMetrics;
