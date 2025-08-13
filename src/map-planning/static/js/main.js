// Main Application Module
// Handles initialization, data loading, and overview functionality

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
async function initializeApp() {
    try {
        // Initialize map first
        initializeMap();
        
        // Load all data
        await loadData();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        showToast('Fehler beim Initialisieren der Anwendung', 'error');
    }
}

// Load all data
async function loadData() {
    try {
        await Promise.all([
            loadDistricts(),
            loadStakeholders(),
            loadEnergyScenarios(),
            loadEnergyMetrics()
        ]);
        console.log('All data loaded successfully');
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Fehler beim Laden der Daten', 'error');
    }
}

// Load energy metrics for overview
async function loadEnergyMetrics() {
    try {
        const response = await fetch('/api/analysis/energy-balance');
        const data = await response.json();
        displayTotalOverview(data);
    } catch (error) {
        console.error('Error loading energy metrics:', error);
    }
}

// Display total overview
function displayTotalOverview(data) {
    const container = document.getElementById('totalOverviewContent');
    
    // Calculate metrics
    const totalDemand = data.total_consumption_mwh || 0;
    const totalPotential = data.total_production_potential_mwh || 0;
    const balanceMWh = totalPotential - totalDemand;
    const selfSufficiencyPct = totalDemand > 0 ? ((totalPotential / totalDemand) * 100).toFixed(1) : 0;
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
                            <div class="fw-bold fs-4 text-danger">${totalDemand.toLocaleString()} MWh</div>
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
                                <div class="fw-bold fs-5">${totalPotential.toLocaleString()}</div>
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

// Select district from overview table
function selectDistrictFromOverview(districtId) {
    const district = districts.find(d => d.id == districtId);
    if (district) {
        selectDistrict(district);
    }
}

// Show overview
function showOverview() {
    // Reset map view and clear selections
    map.setView([50.8994, 14.8076], 14);
    Object.values(districtLayers).forEach(layer => {
        layer.setStyle({ weight: 2 });
    });
    
    // Reset selected district panel
    document.getElementById('selectedDistrictTitle').textContent = 'Quartier auswählen';
    document.getElementById('selectedDistrictContent').innerHTML = `
        <div class="text-center text-muted py-5">
            <i class="bi bi-cursor text-muted" style="font-size: 3rem;"></i>
            <p class="mt-3">Klicken Sie auf ein Quartier in der Karte, um Details anzuzeigen</p>
        </div>
    `;
    
    currentDistrict = null;
}

// Utility function to show toast notifications
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">
                    <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
                    ${type === 'success' ? 'Erfolg' : type === 'error' ? 'Fehler' : 'Information'}
                </strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Show toast and auto-remove
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remove from DOM after hiding
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
