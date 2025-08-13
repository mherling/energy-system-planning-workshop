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

// Show stakeholders modal
async function showStakeholders() {
    console.log('showStakeholders called!');
    try {
        console.log('Checking if showStakeholderAnalysis exists:', typeof showStakeholderAnalysis);
        if (typeof showStakeholderAnalysis === 'undefined') {
            alert('showStakeholderAnalysis function not found!');
            return;
        }
        
        console.log('Calling showStakeholderAnalysis...');
        await showStakeholderAnalysis('all');
        console.log('showStakeholderAnalysis completed');
    } catch (error) {
        console.error('Error showing stakeholders:', error);
        alert('Error: ' + error.message);
        notificationManager.showError('Fehler beim Anzeigen der Stakeholder');
    }
}

// Show scenarios modal
async function showScenarios() {
    console.log('showScenarios called!');
    try {
        console.log('Checking if showScenarioComparison exists:', typeof showScenarioComparison);
        if (typeof showScenarioComparison === 'undefined') {
            alert('showScenarioComparison function not found!');
            return;
        }
        
        console.log('Calling showScenarioComparison...');
        await showScenarioComparison('all');
        console.log('showScenarioComparison completed');
    } catch (error) {
        console.error('Error showing scenarios:', error);
        alert('Error: ' + error.message);
        notificationManager.showError('Fehler beim Anzeigen der Szenarien');
    }
}

// Export to global scope
window.selectDistrictFromOverview = selectDistrictFromOverview;
window.showOverview = showOverview;
window.showToast = showToast;
window.showStakeholders = showStakeholders;
window.showScenarios = showScenarios;
