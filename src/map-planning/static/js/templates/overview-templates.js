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

// Export to global scope
window.createAllDistrictsContent = createAllDistrictsContent;
