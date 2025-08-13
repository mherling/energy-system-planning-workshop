/**
 * Analysis Module - Clean Version without Charts
 * Handles detailed analysis coordination
 */

// Show detailed analysis modal
async function showDetailedAnalysis(quartier) {
    console.log('showDetailedAnalysis called with quartier:', quartier);
    try {
        let content;
        let title;
        
        if (quartier === 'all') {
            console.log('Creating overview for all districts...');
            title = 'Gesamtübersicht aller Quartiere';
            content = await createAllDistrictsContent();
        } else {
            console.log('Loading detailed district data...');
            
            // Load district detailed data from API
            const response = await fetch(`/api/districts/${quartier}/detailed`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const district = await response.json();
            console.log('District detailed data loaded:', district);
            
            title = `Detailanalyse: ${district.name}`;
            content = createEnergyFlowContent(district);
        }
        
        console.log('Content created, length:', content.length);
        console.log('Showing detailed analysis modal...');
        
        // Create and show modal using correct API
        const modalId = 'detailedAnalysisModal';
        const modal = modalManager.createModal(modalId, title, content, { 
            size: 'modal-xl',
            scrollable: true 
        });
        modalManager.showModal(modalId);
        
        console.log('Detailed analysis modal shown successfully');

    } catch (error) {
        console.error('Error in showDetailedAnalysis:', error);
        Logger.error('Error showing detailed analysis:', error);
        notificationManager.showError('Fehler beim Laden der Detailanalyse');
    }
}

// Initialize analysis module
async function initializeAnalysis() {
    try {
        Logger.info('Initializing analysis module...');
        Logger.info('Analysis module initialized successfully');
        return true;
    } catch (error) {
        Logger.error('Error initializing analysis module:', error);
        notificationManager.showError('Fehler beim Initialisieren der Analyse-Module');
        return false;
    }
}

// Global exports
window.showDetailedAnalysis = showDetailedAnalysis;
window.initializeAnalysis = initializeAnalysis;
