/**
 * Scenario View Module
 * Handles energy scenario UI rendering and modal display
 */

// Create scenario analysis content
function createScenarioContent(quartier) {
    const relevantScenarios = getRelevantScenarios(quartier);
    
    if (!relevantScenarios || Object.keys(relevantScenarios).length === 0) {
        return `
            <div class="text-center">
                <p class="text-muted">Keine Szenario-Daten verfügbar.</p>
            </div>
        `;
    }

    return `
        <div class="scenario-container">
            ${quartier !== 'all' ? `<h5>Energie-Szenarien</h5>` : ''}
            <div class="row">
                ${Object.entries(relevantScenarios).map(([scenarioKey, scenarioData]) => `
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-header">
                                <h6>${formatUtils.toTitle(scenarioData.name || scenarioKey)}</h6>
                            </div>
                            <div class="card-body">
                                <p class="card-text">${scenarioData.description || 'Keine Beschreibung verfügbar'}</p>
                                ${scenarioData.electricity_prices && typeof scenarioData.electricity_prices === 'object' ? `
                                    <div class="mt-2">
                                        <h6>Strompreise:</h6>
                                        <ul class="list-unstyled">
                                            ${Object.entries(scenarioData.electricity_prices).map(([year, price]) => 
                                                `<li><strong>${year}:</strong> ${typeof price === 'number' ? price.toFixed(3) : price} €/kWh</li>`
                                            ).join('')}
                                        </ul>
                                    </div>
                                ` : scenarioData.electricity_prices ? `
                                    <div class="mt-2">
                                        <small class="text-muted">Strompreis: ${scenarioData.electricity_prices}</small>
                                    </div>
                                ` : ''}
                                ${scenarioData.gas_prices && typeof scenarioData.gas_prices === 'object' ? `
                                    <div class="mt-2">
                                        <h6>Gaspreise:</h6>
                                        <ul class="list-unstyled">
                                            ${Object.entries(scenarioData.gas_prices).map(([year, price]) => 
                                                `<li><strong>${year}:</strong> ${typeof price === 'number' ? price.toFixed(3) : price} €/kWh</li>`
                                            ).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                                ${scenarioData.co2_price && typeof scenarioData.co2_price === 'object' ? `
                                    <div class="mt-2">
                                        <h6>CO2-Preis:</h6>
                                        <ul class="list-unstyled">
                                            ${Object.entries(scenarioData.co2_price).map(([year, price]) => 
                                                `<li><strong>${year}:</strong> ${typeof price === 'number' ? price.toFixed(0) : price} €/t</li>`
                                            ).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Show scenario analysis modal  
async function showScenarioAnalysis(quartier) {
    console.log('showScenarioAnalysis called with quartier:', quartier);
    try {
        // Ensure data is loaded
        const currentScenarios = getEnergyScenarios();
        console.log('Current energyScenarios keys:', Object.keys(currentScenarios));
        
        if (Object.keys(currentScenarios).length === 0) {
            console.log('Loading energy scenarios...');
            await loadEnergyScenarios();
        }

        console.log('Creating scenario content...');
        const content = createScenarioContent(quartier);
        console.log('Content created, length:', content.length);
        
        console.log('Showing scenario modal...');
        
        // Create and show modal using correct API
        const modalId = 'scenarioModal';
        const modal = modalManager.createModal(modalId, `Szenarien: ${quartier}`, content, { size: 'modal-lg' });
        modalManager.showModal(modalId);
        
        console.log('Scenario modal should be shown now');

    } catch (error) {
        console.error('Error in showScenarioAnalysis:', error);
        Logger.error('Error showing scenario analysis:', error);
        notificationManager.showError('Fehler beim Laden der Szenario-Analyse');
    }
}

// Show scenario comparison modal
async function showScenarioComparison(quartier) {
    console.log('showScenarioComparison called with quartier:', quartier);
    try {
        // Ensure data is loaded
        const currentScenarios = getEnergyScenarios();
        console.log('Current energyScenarios keys:', Object.keys(currentScenarios));
        
        if (Object.keys(currentScenarios).length === 0) {
            console.log('Loading energy scenarios...');
            await loadEnergyScenarios();
            console.log('Energy scenarios loaded');
        }

        console.log('Creating scenario content...');
        const content = createScenarioContent(quartier);
        console.log('Content created, length:', content.length);
        
        const title = quartier === 'all' ? 'Energie-Szenarien' : `Szenario-Vergleich: ${quartier}`;
        console.log('Showing modal with title:', title);
        
        // Create and show modal using correct API
        const modalId = 'scenarioModal';
        const modal = modalManager.createModal(modalId, title, content, { size: 'modal-lg' });
        modalManager.showModal(modalId);
        
        console.log('Modal should be shown now');

    } catch (error) {
        console.error('Error in showScenarioComparison:', error);
        Logger.error('Error showing scenario comparison:', error);
        notificationManager.showError('Fehler beim Laden des Szenario-Vergleichs');
    }
}

// Export to global scope
window.showScenarioAnalysis = showScenarioAnalysis;
window.showScenarioComparison = showScenarioComparison;
window.createScenarioContent = createScenarioContent;
