/**
 * Navigation Module
 * Handles navigation, UI interactions, and modal displays
 */

// Select district from overview table
function selectDistrictFromOverview(districtId) {
    const district = districts.find(d => d.id == districtId);
    if (district) {
        selectDistrict(district);
    }
}

// Show overview
async function showOverview() {
    // Restore original layout if configuration was shown
    const contentContainer = document.getElementById('content');
    if (contentContainer) {
        contentContainer.innerHTML = `
            <div class="row h-100">
                <!-- Map Section -->
                <div class="col-lg-4 h-100">
                    <div class="position-relative h-100">
                        <div id="map"></div>
                        <div class="grid-legend">
                            <h6 class="mb-2">Quartiere Zittau</h6>
                            <div><span style="color: #28a745;">●</span> Hoher Verbrauch</div>
                            <div><span style="color: #ffc107;">●</span> Mittlerer Verbrauch</div>
                            <div><span style="color: #17a2b8;">●</span> Niedriger Verbrauch</div>
                        </div>
                    </div>
                </div>
                
                <!-- Selected District Panel -->
                <div class="col-lg-4 h-100" style="overflow-y: auto;">
                    <div class="card h-100">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">
                                <i class="bi bi-geo-alt-fill"></i>
                                <span id="selectedDistrictTitle">Quartier auswählen</span>
                            </h5>
                        </div>
                        <div class="card-body" id="selectedDistrictContent">
                            <div class="text-center text-muted py-5">
                                <i class="bi bi-cursor text-muted" style="font-size: 3rem;"></i>
                                <p class="mt-3">Klicken Sie auf ein Quartier in der Karte, um Details anzuzeigen</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Total Overview Panel -->
                <div class="col-lg-4 h-100" style="overflow-y: auto;">
                    <div class="card h-100">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0">
                                <i class="bi bi-grid-3x3-gap-fill"></i>
                                Gesamtübersicht Zittau
                            </h5>
                        </div>
                        <div class="card-body" id="totalOverviewContent">
                            <div class="text-center">
                                <div class="spinner-border text-success" role="status">
                                    <span class="visually-hidden">Wird geladen...</span>
                                </div>
                                <p class="mt-3">Gesamtdaten werden geladen...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Reinitialize map and load data
        try {
            if (typeof initializeMap === 'function') {
                initializeMap();
                console.log('Map reinitialized');
            }
            
            if (typeof loadData === 'function') {
                await loadData();
                console.log('Data reloaded');
            }
            
            // Load overview data using the existing overview-templates functions
            if (typeof createAllDistrictsContent === 'function') {
                try {
                    const overviewContent = await createAllDistrictsContent();
                    const overviewContainer = document.getElementById('totalOverviewContent');
                    if (overviewContainer) {
                        overviewContainer.innerHTML = overviewContent;
                        console.log('Overview content loaded successfully');
                    }
                } catch (error) {
                    console.error('Error loading overview content:', error);
                    const overviewContainer = document.getElementById('totalOverviewContent');
                    if (overviewContainer) {
                        overviewContainer.innerHTML = `
                            <div class="alert alert-danger">
                                <h6>Fehler beim Laden</h6>
                                <p>Die Gesamtübersicht konnte nicht geladen werden.</p>
                                <small>Error: ${error.message}</small>
                            </div>
                        `;
                    }
                }
            } else {
                console.error('createAllDistrictsContent function not found');
                const overviewContainer = document.getElementById('totalOverviewContent');
                if (overviewContainer) {
                    overviewContainer.innerHTML = `
                        <div class="alert alert-warning">
                            <h6>Funktion nicht verfügbar</h6>
                            <p>Die createAllDistrictsContent Funktion wurde nicht gefunden.</p>
                        </div>
                    `;
                }
            }
            
            // If there's a current district, redisplay its details
            const current = getCurrentDistrict ? getCurrentDistrict() : window.currentDistrict;
            if (current && typeof displayDistrictDetails === 'function') {
                displayDistrictDetails(current);
            }
            
        } catch (error) {
            console.error('Error reinitializing application:', error);
        }
    }
    
    // Reset map view and clear selections (only if map exists)
    if (typeof map !== 'undefined' && map) {
        map.setView([50.8994, 14.8076], 14);
        if (typeof districtLayers !== 'undefined') {
            Object.values(districtLayers).forEach(layer => {
                layer.setStyle({ weight: 2 });
            });
        }
    }
    
    // Reset current district
    if (typeof setCurrentDistrict === 'function') {
        setCurrentDistrict(null);
    } else {
        window.currentDistrict = null;
    }
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

// Show configuration dashboard
async function showConfiguration() {
    console.log('showConfiguration called!');
    try {
        // Check if config manager exists
        if (typeof window.configManager === 'undefined') {
            console.error('ConfigManager not found!');
            notificationManager.showError('Konfiguration-Manager nicht gefunden');
            return;
        }
        
        console.log('Calling configManager.showDashboard...');
        await window.configManager.showDashboard();
        console.log('Configuration dashboard shown');
    } catch (error) {
        console.error('Error showing configuration:', error);
        notificationManager.showError('Fehler beim Anzeigen der Konfiguration');
    }
}

// Export to global scope
window.selectDistrictFromOverview = selectDistrictFromOverview;
window.showOverview = showOverview;
window.showToast = showToast;
window.showConfiguration = showConfiguration;
