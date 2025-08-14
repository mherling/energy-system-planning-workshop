/**
 * Overview View Module  
 * Handles overview display and rendering - REPLACED WITH NEW TEMPLATE SYSTEM
 * This file is kept for backward compatibility but functionality moved to overview-templates.js
 */

// Legacy function - use createAllDistrictsContent from overview-templates.js instead
function displayTotalOverview(data) {
    console.warn('displayTotalOverview is deprecated. Use createAllDistrictsContent from overview-templates.js instead');
    
    // Fallback to new system if available
    if (typeof createAllDistrictsContent === 'function') {
        createAllDistrictsContent().then(content => {
            const container = document.getElementById('totalOverviewContent');
            if (container) {
                container.innerHTML = content;
                console.log('Loaded new overview template via legacy function');
            }
        }).catch(error => {
            console.error('Error loading new overview content:', error);
            showLegacyOverview(data);
        });
    } else {
        console.error('createAllDistrictsContent not available, showing legacy fallback');
        showLegacyOverview(data);
    }
}

// Legacy overview display (minimal fallback)
function showLegacyOverview(data) {
    const container = document.getElementById('totalOverviewContent');
    if (!container) return;
    
    container.innerHTML = `
        <div class="alert alert-warning">
            <h6><i class="bi bi-exclamation-triangle"></i> Legacy Overview</h6>
            <p>Die neue Übersicht konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.</p>
            <button class="btn btn-sm btn-primary" onclick="location.reload()">
                <i class="bi bi-arrow-clockwise"></i> Seite aktualisieren
            </button>
        </div>
        <div class="alert alert-info">
            <h6>Debug Information</h6>
            <p><strong>createAllDistrictsContent verfügbar:</strong> ${typeof createAllDistrictsContent}</p>
            <p><strong>Data:</strong> ${JSON.stringify(data, null, 2)}</p>
        </div>
    `;
}

// Export to global scope (for backward compatibility)
window.displayTotalOverview = displayTotalOverview;
