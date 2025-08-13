/**
 * Overview View Module  
 * Handles overview display and rendering
 */

// Display total overview in the main overview panel
function displayTotalOverview(data) {
    const container = document.getElementById('totalOverviewContent');
    
    // Calculate metrics using central utility
    const totalDemand = data.total_consumption_mwh || 0;
    const totalPotential = data.total_production_potential_mwh || 0;
    const balanceMWh = calculateEnergyBalance(totalPotential, totalDemand);
    const selfSufficiencyPct = calculateSelfSufficiency(totalPotential, totalDemand).toFixed(1);
    const avgConsumptionPerDistrict = districts.length > 0 ? (totalDemand / districts.length).toFixed(0) : 0;
    const avgPotentialPerDistrict = districts.length > 0 ? (totalPotential / districts.length).toFixed(0) : 0;
    
    container.innerHTML = `
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-danger text-white">
                        <h6 class="mb-0"><i class="bi bi-lightning-charge"></i> Gesamt-Energiebedarf</h6>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-6">
                                <small class="text-muted">Ø pro Quartier</small>
                                <div class="fw-bold fs-5">${avgConsumptionPerDistrict}</div>
                                <small class="text-muted">MWh/Jahr</small>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Anzahl Quartiere</small>
                                <div class="fw-bold fs-5">${districts.length}</div>
                                <small class="text-muted">Quartiere</small>
                            </div>
                        </div>
                        <hr>
                        <div class="text-center">
                            <small class="text-muted">Gesamtverbrauch</small>
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
                        <h6 class="mb-0"><i class="bi bi-sun"></i> Gesamt EE-Potential</h6>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-6">
                                <small class="text-muted">Gesamtpotential</small>
                                <div class="fw-bold fs-5">${formatUtils.formatNumber(totalPotential, 0)}</div>
                                <small class="text-muted">MWh/Jahr</small>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Ø pro Quartier</small>
                                <div class="fw-bold fs-5">${avgPotentialPerDistrict}</div>
                                <small class="text-muted">MWh/Jahr</small>
                            </div>
                        </div>
                        <hr>
                        <div class="text-center">
                            <small class="text-muted">Deckungsgrad des Bedarfs</small>
                            <div class="fw-bold fs-4 text-success">${selfSufficiencyPct}%</div>
                            <small class="text-muted">
                                ${totalPotential.toFixed(1)} MWh Potential
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- District Summary -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0"><i class="bi bi-list"></i> Quartiere-Übersicht</h6>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Quartier</th>
                                        <th class="text-end">Bedarf</th>
                                        <th class="text-end">Potential</th>
                                        <th class="text-end">Bilanz</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(data.district_details || []).map(district => {
                                        const balance = district.balance_mwh || 0;
                                        return `
                                            <tr style="cursor: pointer;" onclick="selectDistrictFromOverview('${district.id}')">
                                                <td class="fw-bold">${district.name}</td>
                                                <td class="text-end">${(district.consumption_mwh || 0).toFixed(0)} MWh</td>
                                                <td class="text-end">${(district.production_potential_mwh || 0).toFixed(0)} MWh</td>
                                                <td class="text-end">
                                                    <span class="badge ${balance >= 0 ? 'bg-success' : 'bg-warning'}">
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
        
        <!-- Overall Balance -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header ${balanceMWh >= 0 ? 'bg-success' : 'bg-warning'} text-white">
                        <h6 class="mb-0">
                            <i class="bi bi-${balanceMWh >= 0 ? 'check-circle' : 'exclamation-triangle'}"></i>
                            Gesamtenergiebilanz
                        </h6>
                    </div>
                    <div class="card-body text-center">
                        <h3 class="mb-3 ${balanceMWh >= 0 ? 'text-success' : 'text-warning'}">
                            ${balanceMWh >= 0 ? '+' : ''}${balanceMWh.toFixed(1)} MWh/Jahr
                        </h3>
                        <p class="mb-0">
                            ${balanceMWh >= 0 
                                ? 'Zittau kann theoretisch energieautark werden' 
                                : 'Zusätzliche Energiequellen oder Effizienzmaßnahmen erforderlich'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Export to global scope
window.displayTotalOverview = displayTotalOverview;
