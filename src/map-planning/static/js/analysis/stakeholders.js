/**
 * Stakeholder Analysis Module
 * Handles stakeholder data loading, display, and analysis
 */

let stakeholders = [];

// Load stakeholders data
async function loadStakeholders() {
    try {
        Logger.info('Loading stakeholders...');
        stakeholders = await apiClient.getStakeholders();
        Logger.info('Loaded stakeholders:', stakeholders.length);
        return stakeholders;
    } catch (error) {
        Logger.error('Error loading stakeholders:', error);
        notificationManager.showError('Fehler beim Laden der Stakeholder-Daten');
        return [];
    }
}

// Create stakeholder content for modal
function createStakeholderContent(quartier) {
    let relevantStakeholders;
    
    if (quartier === 'all') {
        relevantStakeholders = stakeholders;
    } else {
        relevantStakeholders = stakeholders;
    }
    
    if (relevantStakeholders.length === 0) {
        return `
            <div class="text-center">
                <p class="text-muted">Keine Stakeholder-Daten verfügbar.</p>
            </div>
        `;
    }

    return `
        <div class="stakeholder-container">
            ${quartier !== 'all' ? `<h5>Akteure und Interessensgruppen</h5>` : ''}
            <div class="row">
                ${relevantStakeholders.map(stakeholder => `
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">${stakeholder.name}</h6>
                                <p class="card-text"><strong>Kategorie:</strong> ${stakeholder.category}</p>
                                <div class="mt-2">
                                    <span class="badge bg-primary">${stakeholder.category}</span>
                                    <span class="badge bg-info">ID: ${stakeholder.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Show stakeholder analysis modal
async function showStakeholderAnalysis(quartier) {
    console.log('showStakeholderAnalysis called with quartier:', quartier);
    try {
        // Ensure data is loaded
        console.log('Current stakeholders length:', stakeholders.length);
        console.log('Stakeholders data:', stakeholders);
        if (stakeholders.length === 0) {
            console.log('Loading stakeholders...');
            await loadStakeholders();
            console.log('Stakeholders loaded, new length:', stakeholders.length);
            console.log('Loaded stakeholders data:', stakeholders);
        }

        console.log('Creating stakeholder content...');
        const content = createStakeholderContent(quartier);
        console.log('Content created, length:', content.length);
        
        console.log('Showing stakeholder modal...');
        
        // Create and show modal using correct API
        const modalId = 'stakeholderModal';
        const modal = modalManager.createModal(modalId, `Stakeholder: ${quartier}`, content, { size: 'modal-lg' });
        modalManager.showModal(modalId);
        
        console.log('Stakeholder modal should be shown now');

    } catch (error) {
        console.error('Error in showStakeholderAnalysis:', error);
        Logger.error('Error showing stakeholder analysis:', error);
        notificationManager.showError('Fehler beim Laden der Stakeholder-Analyse');
    }
}

// Get stakeholders data (for other modules)
function getStakeholders() {
    return stakeholders;
}

// Export functions for global access
window.showStakeholderAnalysis = showStakeholderAnalysis;
window.loadStakeholders = loadStakeholders;
window.getStakeholders = getStakeholders;
