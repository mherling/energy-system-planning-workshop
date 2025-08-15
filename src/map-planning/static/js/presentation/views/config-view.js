/**
 * Config View Layer - Rendering von Konfigurationsdaten
 * Zeigt Quartier-, System- und Technologie-Konfigurationen an
 */

/**
 * View Layer für Konfigurationsanzeigen
 */
class ConfigView {
    
    /**
     * Rendert das Haupt-Dashboard für Konfigurationen
     * @param {HTMLElement} container - Container-Element
     */
    static renderConfigDashboard(container) {
        const html = `
            <div class="config-dashboard">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>
                        <i class="bi bi-gear-fill text-primary me-2"></i>
                        Konfiguration
                    </h2>
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-outline-primary btn-sm" 
                                onclick="configManager.exportConfig()">
                            <i class="bi bi-download me-1"></i>Export
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" 
                                onclick="configManager.refreshConfig()">
                            <i class="bi bi-arrow-clockwise me-1"></i>Aktualisieren
                        </button>
                    </div>
                </div>
                
                <!-- Tab Navigation -->
                <ul class="nav nav-tabs mb-4" id="configTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="quartiere-tab" data-bs-toggle="tab" 
                                data-bs-target="#quartiere-content" type="button" role="tab">
                            <i class="bi bi-buildings me-2"></i>Quartiere
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="system-tab" data-bs-toggle="tab" 
                                data-bs-target="#system-content" type="button" role="tab">
                            <i class="bi bi-sliders me-2"></i>System
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="technologien-tab" data-bs-toggle="tab" 
                                data-bs-target="#technologien-content" type="button" role="tab">
                            <i class="bi bi-cpu me-2"></i>Technologien
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="stakeholder-templates-tab" data-bs-toggle="tab" 
                                data-bs-target="#stakeholder-templates-content" type="button" role="tab">
                            <i class="bi bi-person-lines-fill me-2"></i>Stakeholder-Templates
                        </button>
                    </li>
                </ul>
                
                <!-- Tab Content -->
                <div class="tab-content" id="configTabContent">
                    <div class="tab-pane fade show active" id="quartiere-content" role="tabpanel">
                        <div id="quartiere-container" style="max-height: calc(100vh - 280px); overflow-y: auto; padding-right: 10px;">
                            <div class="d-flex justify-content-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Lade Quartiere...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="system-content" role="tabpanel">
                        <div id="system-container" style="max-height: calc(100vh - 280px); overflow-y: auto; padding-right: 10px;">
                            <div class="d-flex justify-content-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Lade System-Parameter...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="technologien-content" role="tabpanel">
                        <div id="technologien-container" style="max-height: calc(100vh - 280px); overflow-y: auto; padding-right: 10px;">
                            <div class="d-flex justify-content-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Lade Technologien...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="stakeholder-templates-content" role="tabpanel">
                        <div id="stakeholder-templates-container" style="max-height: calc(100vh - 280px); overflow-y: auto; padding-right: 10px;">
                            <div class="d-flex justify-content-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Lade Stakeholder-Templates...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * Rendert die Quartier-Übersichtstabelle
     * @param {Array} quartiers - Array mit Quartier-Daten
     * @returns {string} HTML für Quartier-Übersicht
     */
    static renderQuartierOverview(quartiers) {
        const rows = quartiers.map(quartier => `
            <tr>
                <td>
                    <strong class="text-primary">${quartier.name}</strong>
                    <br>
                    <small class="text-muted">${quartier.key}</small>
                </td>
                <td>
                    <span class="badge bg-secondary">${this.getDistrictTypeLabel(quartier.district_type)}</span>
                </td>
                <td>${quartier.area_km2} km²</td>
                <td>${window.formatUtils.formatNumber(quartier.population)}</td>
                <td>
                    <span class="badge ${this.getPriorityBadgeClass(quartier.priority_level)}">
                        ${this.getPriorityLabel(quartier.priority_level)}
                    </span>
                </td>
                <td>${window.formatUtils.formatEnergy(quartier.total_energy_demand)}</td>
                <td>${window.formatUtils.formatEnergy(quartier.renewable_potential)}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary" 
                                onclick="configManager.showQuartierDetails('${quartier.key}')"
                                title="Details anzeigen">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-info" 
                                onclick="configManager.showEnergyProfile('${quartier.key}')"
                                title="Energieprofil">
                            <i class="bi bi-graph-up"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="bi bi-buildings me-2"></i>Quartier-Übersicht
                        <span class="badge bg-primary ms-2">${quartiers.length} Quartiere</span>
                    </h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Quartier</th>
                                    <th>Typ</th>
                                    <th>Fläche</th>
                                    <th>Einwohner</th>
                                    <th>Priorität</th>
                                    <th>Energiebedarf</th>
                                    <th>EE-Potential</th>
                                    <th>Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Rendert detaillierte Quartier-Informationen
     * @param {Object} quartierData - Detaillierte Quartier-Daten
     * @returns {string} HTML für Quartier-Details
     */
    static renderQuartierDetails(quartierData) {
        const { quartier_data, district_type_defaults } = quartierData;
        
        return `
            <div class="row">
                <!-- Allgemeine Informationen -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-info-circle me-2"></i>Allgemeine Informationen
                            </h6>
                        </div>
                        <div class="card-body">
                            <dl class="row">
                                <dt class="col-sm-5">Name:</dt>
                                <dd class="col-sm-7">${quartier_data.name}</dd>
                                
                                <dt class="col-sm-5">Typ:</dt>
                                <dd class="col-sm-7">
                                    <span class="badge bg-secondary">${this.getDistrictTypeLabel(quartier_data.district_type)}</span>
                                </dd>
                                
                                <dt class="col-sm-5">Fläche:</dt>
                                <dd class="col-sm-7">${quartier_data.area_km2} km²</dd>
                                
                                <dt class="col-sm-5">Einwohner:</dt>
                                <dd class="col-sm-7">${window.formatUtils.formatNumber(quartier_data.population_override)}</dd>
                                
                                <dt class="col-sm-5">Priorität:</dt>
                                <dd class="col-sm-7">
                                    <span class="badge ${this.getPriorityBadgeClass(quartier_data.priority_level)}">
                                        ${this.getPriorityLabel(quartier_data.priority_level)}
                                    </span>
                                </dd>
                                
                                <dt class="col-sm-5">Beschreibung:</dt>
                                <dd class="col-sm-7">${quartier_data.description}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
                
                <!-- Energiebedarf -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-lightning-charge me-2"></i>Energiebedarf (MWh/Jahr)
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.renderEnergyDemandChart(quartier_data.energy_demand)}
                        </div>
                    </div>
                </div>
                
                <!-- Erneuerbare Potentiale -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-sun me-2"></i>Erneuerbare Potentiale
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.renderRenewablePotentialChart(quartier_data.renewable_potential, quartier_data.utilized_potential)}
                        </div>
                    </div>
                </div>
                
                <!-- Energiemix -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-pie-chart me-2"></i>Primärenergie-Mix
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.renderEnergyMixTabs(quartier_data.primary_energy_mix)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Rendert System-Parameter Dashboard mit allen Daten aus system_config.yml
     * @param {Object} systemConfig - System-Konfiguration
     * @param {Object} scenarios - Energiepreis-Szenarien (optional, wird aus systemConfig verwendet wenn nicht vorhanden)
     * @returns {string} HTML für System-Parameter
     */
    static renderSystemParameters(systemConfig, scenarios = null) {
        const { regional_parameters, emission_factors, technical_parameters, energy_scenarios } = systemConfig;
        
        // Verwende Szenarien aus systemConfig wenn nicht separat übergeben
        const scenariosToRender = scenarios || energy_scenarios;
        
        return `
            <div class="row">
                <!-- Linke Spalte: Regionale Parameter, Technische Parameter, CO2-Faktoren -->
                <div class="col-lg-6">
                    <!-- Regionale Parameter -->
                    <div class="mb-4">
                        <div class="card h-100">
                            <div class="card-header">
                                <h6 class="mb-0">
                                    <i class="bi bi-geo-alt me-2"></i>Regionale Parameter (Zittau)
                                </h6>
                            </div>
                            <div class="card-body">
                                ${this.renderRegionalParameters(regional_parameters)}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Technische Parameter -->
                    <div class="mb-4">
                        <div class="card h-100">
                            <div class="card-header">
                                <h6 class="mb-0">
                                    <i class="bi bi-gear me-2"></i>Technische Parameter
                                </h6>
                            </div>
                            <div class="card-body">
                                ${this.renderSystemTechnicalParameters(technical_parameters)}
                            </div>
                        </div>
                    </div>
                    
                    <!-- CO2-Emissionsfaktoren -->
                    <div class="mb-4">
                        <div class="card h-100">
                            <div class="card-header">
                                <h6 class="mb-0">
                                    <i class="bi bi-cloud me-2"></i>CO₂-Emissionsfaktoren
                                </h6>
                            </div>
                            <div class="card-body">
                                ${this.renderEmissionFactors(emission_factors)}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Rechte Spalte: Energiepreis-Szenarien -->
                <div class="col-lg-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-graph-up me-2"></i>Energiepreis-Szenarien
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.renderEnergyScenarios(scenariosToRender)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Rendert Energiepreis-Szenarien
     * @param {Object} scenarios - Energiepreis-Szenarien
     * @returns {string} HTML für Szenarien-Visualisierung
     */
    static renderEnergyScenarios(scenarios) {
        console.log('renderEnergyScenarios called with:', scenarios);
        
        // Handle different data structures
        let scenarioData = scenarios;
        if (scenarios && scenarios.scenarios) {
            scenarioData = scenarios.scenarios;
        }
        
        if (!scenarioData || typeof scenarioData !== 'object' || Object.keys(scenarioData).length === 0) {
            return `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Keine Energiepreis-Szenarien verfügbar
                </div>
            `;
        }
        
        const scenarioCards = Object.entries(scenarioData).map(([key, scenario]) => {
            console.log(`Processing scenario ${key}:`, scenario);
            return `
                <div class="col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-light">
                            <h6 class="mb-0 text-primary">${scenario.name || key}</h6>
                        </div>
                        <div class="card-body">
                            <p class="text-muted mb-3">${scenario.description || 'Keine Beschreibung verfügbar'}</p>
                            ${this.renderScenarioPriceTable(scenario)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        const scenarioCount = Object.keys(scenarioData).length;
        
        return `
            <div class="mb-4">
                <h5>
                    <i class="bi bi-graph-up me-2"></i>Energiepreis-Szenarien
                    <span class="badge bg-primary ms-2">${scenarioCount} Szenarien</span>
                </h5>
                <p class="text-muted">Übersicht der konfigurierten Preisszenarien für die Energieplanung</p>
            </div>
            <div class="row">
                ${scenarioCards}
            </div>
            
            <!-- Vergleichsdiagramm -->
            <div class="mt-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="bi bi-bar-chart-line me-2"></i>Preisentwicklung im Vergleich
                        </h6>
                    </div>
                    <div class="card-body">
                        <div id="price-comparison-chart">
                            ${this.renderPriceComparisonChart(scenarioData)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Rendert ein Vergleichsdiagramm für alle Energiepreis-Szenarien
     * @param {Object} scenarioData - Szenarien-Daten
     * @returns {string} HTML und JavaScript für das Vergleichsdiagramm
     */
    static renderPriceComparisonChart(scenarioData) {
        console.log('Creating price comparison chart with data:', scenarioData);
        
        // Korrekte Feldnamen entsprechend der YAML-Struktur
        const years = [2025, 2030, 2040, 2050];
        const energyTypes = [
            { key: 'electricity_prices', label: 'Strom', unit: '€/kWh' },
            { key: 'gas_prices', label: 'Gas', unit: '€/kWh' },
            { key: 'heat_prices', label: 'Heizöl/Fernwärme', unit: '€/kWh' }
        ];
        
        // Definiere eindeutige Farben für jede Szenario-Energieart-Kombination
        const colorPalette = [
            '#1f77b4', // Blau
            '#ff7f0e', // Orange
            '#2ca02c', // Grün
            '#d62728', // Rot
            '#9467bd', // Lila
            '#8c564b', // Braun
            '#e377c2', // Pink
            '#7f7f7f', // Grau
            '#bcbd22'  // Olive
        ];
        
        // Erstelle Chart-Daten mit individuellen Farben
        const chartData = [];
        let colorIndex = 0;
        
        Object.entries(scenarioData).forEach(([scenarioKey, scenario]) => {
            energyTypes.forEach(energyType => {
                if (scenario[energyType.key]) {
                    const dataPoints = years.map(year => ({
                        year: year,
                        price: scenario[energyType.key][year] || 0
                    }));
                    
                    chartData.push({
                        scenario: scenario.name || scenarioKey,
                        energyType: energyType.label,
                        color: colorPalette[colorIndex % colorPalette.length],
                        data: dataPoints
                    });
                    colorIndex++;
                }
            });
        });
        
        console.log('Processed chart data:', chartData);
        
        if (chartData.length === 0) {
            return `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Keine Daten für Preisvergleich verfügbar
                </div>
            `;
        }
        
        // SVG-Dimensionen - angepasst für bessere Einbettung
        const svgWidth = 100; // Prozent-basiert
        const svgHeight = 400;
        const svgWidthPx = 720; // Pixel für Berechnungen
        const margin = { top: 30, right: 160, bottom: 60, left: 70 };
        const chartWidth = svgWidthPx - margin.left - margin.right;
        const chartHeight = svgHeight - margin.top - margin.bottom;
        
        // Finde Min/Max-Werte für Skalierung
        const allPrices = chartData.flatMap(series => series.data.map(d => d.price));
        const minPrice = Math.min(...allPrices) * 0.95; // Etwas Puffer
        const maxPrice = Math.max(...allPrices) * 1.05; // Etwas Puffer
        const priceRange = maxPrice - minPrice;
        
        // Hilfsfunktionen für Koordinaten
        const getX = (yearIndex) => margin.left + (yearIndex / (years.length - 1)) * chartWidth;
        const getY = (price) => margin.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
        
        // SVG-Pfade für jede Datenreihe erstellen
        const svgPaths = chartData.map((series, index) => {
            const pathData = series.data.map((d, i) => {
                const x = getX(i);
                const y = getY(d.price);
                return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
            }).join(' ');
            
            const circles = series.data.map((d, i) => {
                const x = getX(i);
                const y = getY(d.price);
                return `
                    <circle 
                        cx="${x}" 
                        cy="${y}" 
                        r="4" 
                        fill="${series.color}" 
                        stroke="white" 
                        stroke-width="2"
                        class="chart-point"
                        data-year="${d.year}" 
                        data-price="${d.price.toFixed(3)}" 
                        data-series="${series.scenario} - ${series.energyType}"
                        style="cursor: pointer;"
                    />
                `;
            }).join('');
            
            return `
                <path 
                    d="${pathData}" 
                    fill="none" 
                    stroke="${series.color}" 
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
                ${circles}
            `;
        }).join('');
        
        // X-Achsen-Labels
        const xAxisLabels = years.map((year, i) => {
            const x = getX(i);
            return `
                <text x="${x}" y="${margin.top + chartHeight + 20}" text-anchor="middle" font-size="11" fill="#666">${year}</text>
                <line x1="${x}" y1="${margin.top + chartHeight}" x2="${x}" y2="${margin.top + chartHeight + 4}" stroke="#ccc"/>
            `;
        }).join('');
        
        // Y-Achsen-Labels
        const yTicks = 6;
        const yAxisLabels = Array.from({length: yTicks}, (_, i) => {
            const value = minPrice + (priceRange / (yTicks - 1)) * i;
            const y = getY(value);
            return `
                <text x="${margin.left - 10}" y="${y + 3}" text-anchor="end" font-size="10" fill="#666">${value.toFixed(3)}</text>
                <line x1="${margin.left - 5}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="#ccc"/>
                <line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" stroke="#f0f0f0" stroke-width="1"/>
            `;
        }).join('');
        
        // Legende - gruppiert nach Szenarien
        const scenarios = [...new Set(chartData.map(series => series.scenario))];
        const uniqueEnergyTypes = [...new Set(chartData.map(series => series.energyType))];
        
        let legendY = 35;
        const legend = [];
        
        // Legende Header
        legend.push(`<text x="${svgWidthPx - 150}" y="25" font-weight="bold" font-size="12" fill="#333">Szenarien:</text>`);
        
        scenarios.forEach((scenario, scenarioIndex) => {
            // Szenario-Titel
            legend.push(`<text x="${svgWidthPx - 150}" y="${legendY}" font-weight="bold" font-size="10" fill="#555">${scenario}</text>`);
            legendY += 15;
            
            // Energiearten für dieses Szenario
            chartData.filter(series => series.scenario === scenario).forEach((series, typeIndex) => {
                legend.push(`
                    <g>
                        <line x1="${svgWidthPx - 145}" y1="${legendY}" x2="${svgWidthPx - 125}" y2="${legendY}" stroke="${series.color}" stroke-width="2.5"/>
                        <circle cx="${svgWidthPx - 135}" cy="${legendY}" r="3" fill="${series.color}" stroke="white" stroke-width="1"/>
                        <text x="${svgWidthPx - 120}" y="${legendY + 3}" font-size="9" fill="#666">${series.energyType}</text>
                    </g>
                `);
                legendY += 12;
            });
            
            legendY += 5; // Extra Abstand zwischen Szenarien
        });
        
        const legendContent = legend.join('');
        
        return `
            <svg width="100%" height="${svgHeight}" viewBox="0 0 ${svgWidthPx} ${svgHeight}" style="background: white; border: 1px solid #dee2e6; border-radius: 4px;">
                <!-- Hintergrund -->
                <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" fill="white"/>
                
                <!-- Grid Lines -->
                ${yAxisLabels}
                
                <!-- Achsen -->
                <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" stroke="#333" stroke-width="1.5"/>
                <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" stroke="#333" stroke-width="1.5"/>
                
                <!-- Datenlinien -->
                ${svgPaths}
                
                <!-- X-Achsen-Labels -->
                ${xAxisLabels}
                
                <!-- Titel und Achsenbeschriftungen -->
                <text x="${svgWidthPx/2}" y="18" text-anchor="middle" font-weight="bold" font-size="14" fill="#333">Energiepreisentwicklung im Vergleich</text>
                <text x="${margin.left + chartWidth/2}" y="${svgHeight - 15}" text-anchor="middle" font-size="12" fill="#666">Jahr</text>
                <text x="20" y="${margin.top + chartHeight/2}" text-anchor="middle" font-size="12" fill="#666" transform="rotate(-90, 20, ${margin.top + chartHeight/2})">Preis (€/kWh)</text>
                
                <!-- Legende -->
                ${legendContent}
            </svg>
            
            <div class="mt-2">
                <small class="text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    Bewegen Sie die Maus über das Diagramm oder die Datenpunkte für Details zu den Preisen.
                </small>
            </div>
            
            <script>
                // Einfache und robuste Tooltip-Funktionalität
                (function() {
                    // Tooltip erstellen
                    function createTooltip() {
                        let tooltip = document.getElementById('price-chart-tooltip');
                        if (!tooltip) {
                            tooltip = document.createElement('div');
                            tooltip.id = 'price-chart-tooltip';
                            tooltip.style.cssText = \`
                                position: absolute;
                                background: rgba(0,0,0,0.9);
                                color: white;
                                padding: 10px 14px;
                                border-radius: 6px;
                                font-size: 12px;
                                pointer-events: none;
                                z-index: 1000;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                                white-space: nowrap;
                                display: none;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            \`;
                            document.body.appendChild(tooltip);
                        }
                        return tooltip;
                    }
                    
                    // Tooltip anzeigen
                    function showTooltip(e, content) {
                        const tooltip = createTooltip();
                        tooltip.innerHTML = content;
                        tooltip.style.display = 'block';
                        tooltip.style.left = (e.pageX + 15) + 'px';
                        tooltip.style.top = (e.pageY - 10) + 'px';
                    }
                    
                    // Tooltip verstecken
                    function hideTooltip() {
                        const tooltip = document.getElementById('price-chart-tooltip');
                        if (tooltip) {
                            tooltip.style.display = 'none';
                        }
                    }
                    
                    // Datenpunkt-Hover
                    const points = document.querySelectorAll('.chart-point');
                    points.forEach(point => {
                        point.addEventListener('mouseenter', function(e) {
                            const series = this.getAttribute('data-series');
                            const year = this.getAttribute('data-year');
                            const price = this.getAttribute('data-price');
                            
                            const content = \`
                                <div style="font-weight: bold; margin-bottom: 4px; color: #fff;">\${series}</div>
                                <div style="margin-bottom: 2px;">📅 Jahr: \${year}</div>
                                <div style="margin-bottom: 2px;">💰 Preis: \${price} €/kWh</div>
                                <div style="font-size: 10px; color: #ccc; margin-top: 4px;">Detailansicht</div>
                            \`;
                            
                            showTooltip(e, content);
                            
                            // Highlight Punkt
                            this.setAttribute('r', '6');
                            this.style.filter = 'drop-shadow(0 0 4px rgba(255,255,255,0.8))';
                        });
                        
                        point.addEventListener('mouseleave', function() {
                            hideTooltip();
                            
                            // Reset Punkt
                            this.setAttribute('r', '4');
                            this.style.filter = 'none';
                        });
                        
                        point.addEventListener('mousemove', function(e) {
                            // Tooltip Position aktualisieren bei Bewegung
                            const tooltip = document.getElementById('price-chart-tooltip');
                            if (tooltip && tooltip.style.display === 'block') {
                                tooltip.style.left = (e.pageX + 15) + 'px';
                                tooltip.style.top = (e.pageY - 10) + 'px';
                            }
                        });
                    });
                    
                    // Linien-Hover (einfache Version)
                    const paths = document.querySelectorAll('path[stroke]');
                    paths.forEach(path => {
                        path.addEventListener('mouseenter', function(e) {
                            const content = \`
                                <div style="font-weight: bold; margin-bottom: 4px; color: #fff;">Preisentwicklung</div>
                                <div style="font-size: 10px; color: #ccc;">Bewegen Sie die Maus über die Datenpunkte für Details</div>
                            \`;
                            
                            showTooltip(e, content);
                            
                            // Highlight Linie
                            this.style.strokeWidth = '3.5';
                            this.style.filter = 'drop-shadow(0 0 2px rgba(255,255,255,0.5))';
                        });
                        
                        path.addEventListener('mouseleave', function() {
                            hideTooltip();
                            
                            // Reset Linie
                            this.style.strokeWidth = '2.5';
                            this.style.filter = 'none';
                        });
                        
                        path.addEventListener('mousemove', function(e) {
                            // Tooltip Position aktualisieren
                            const tooltip = document.getElementById('price-chart-tooltip');
                            if (tooltip && tooltip.style.display === 'block') {
                                tooltip.style.left = (e.pageX + 15) + 'px';
                                tooltip.style.top = (e.pageY - 10) + 'px';
                            }
                        });
                    });
                    
                    // Globales Cleanup
                    document.addEventListener('click', function(e) {
                        if (!e.target.closest('svg')) {
                            hideTooltip();
                        }
                    });
                })();
            </script>
        `;
    }
    
    /**
     * Rendert Technologie-Templates
     * @param {Object} technologies - Technologie-Templates
     * @returns {string} HTML für Technologie-Übersicht
     */
    static renderTechnologyTemplates(technologies) {
        const templates = technologies.technology_templates;
        const categories = technologies.categories;
        
        const categoryTabs = categories.map((category, index) => `
            <li class="nav-item" role="presentation">
                <button class="nav-link ${index === 0 ? 'active' : ''}" 
                        id="${category}-tab" data-bs-toggle="tab" 
                        data-bs-target="#${category}-content" type="button" role="tab">
                    ${this.getTechnologyCategoryLabel(category)}
                </button>
            </li>
        `).join('');
        
        const categoryContents = categories.map((category, index) => {
            const categoryTemplates = Object.entries(templates).filter(([key, template]) => 
                template.category === category
            );
            
            return `
                <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" 
                     id="${category}-content" role="tabpanel">
                    <div class="row">
                        ${categoryTemplates.map(([key, template]) => 
                            this.renderTechnologyCard(key, template)
                        ).join('')}
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="mb-4">
                <h5>
                    <i class="bi bi-cpu me-2"></i>Technologie-Templates
                    <span class="badge bg-primary ms-2">${Object.keys(templates).length} Technologien</span>
                </h5>
            </div>
            
            <ul class="nav nav-tabs mb-3" role="tablist">
                ${categoryTabs}
            </ul>
            
            <div class="tab-content">
                ${categoryContents}
            </div>
        `;
    }
    
    // Helper Methods
    static getDistrictTypeLabel(type) {
        const labels = {
            'residential': 'Wohnen',
            'commercial': 'Gewerbe',
            'industrial': 'Industrie',
            'mixed': 'Gemischt'
        };
        return labels[type] || type;
    }
    
    static getPriorityBadgeClass(priority) {
        const classes = {
            'high': 'bg-danger',
            'medium': 'bg-warning',
            'low': 'bg-success'
        };
        return classes[priority] || 'bg-secondary';
    }
    
    static getPriorityLabel(priority) {
        const labels = {
            'high': 'Hoch',
            'medium': 'Mittel',
            'low': 'Niedrig'
        };
        return labels[priority] || priority;
    }
    
    static getTechnologyCategoryLabel(category) {
        const labels = {
            'generation': 'Erzeugung',
            'storage': 'Speicher',
            'conversion': 'Umwandlung'
        };
        return labels[category] || category;
    }
    
    // Placeholder methods for complex rendering components
    static renderEnergyDemandChart(energyDemand) {
        return '<div class="alert alert-info">Energiebedarf-Diagramm wird geladen...</div>';
    }
    
    static renderRenewablePotentialChart(potential, utilized) {
        return '<div class="alert alert-info">EE-Potential-Diagramm wird geladen...</div>';
    }
    
    static renderEnergyMixTabs(energyMix) {
        return '<div class="alert alert-info">Energiemix-Tabs werden geladen...</div>';
    }
    
    static renderRegionalParameters(params) {
        if (!params || !params.location) return '<div class="alert alert-warning">Keine regionalen Parameter verfügbar</div>';
        
        const location = params.location || {};
        const weatherData = params.weather_data || {};
        const economicData = params.economic_data || {};
        const regulatory = params.regulatory_framework || {};
        
        return `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">📍 Standort</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-5">Stadt:</dt>
                        <dd class="col-sm-7">${location.name || 'N/A'}</dd>
                        <dt class="col-sm-5">Koordinaten:</dt>
                        <dd class="col-sm-7">${location.latitude || 'N/A'}°N, ${location.longitude || 'N/A'}°E</dd>
                        <dt class="col-sm-5">Höhe:</dt>
                        <dd class="col-sm-7">${location.elevation_m || 'N/A'} m ü. NN</dd>
                        <dt class="col-sm-5">Klimazone:</dt>
                        <dd class="col-sm-7">${location.climate_zone || 'N/A'}</dd>
                    </dl>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">🌤️ Wetter</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-6">Ø Temperatur:</dt>
                        <dd class="col-sm-6">${weatherData.avg_temperature_celsius || 'N/A'}°C</dd>
                        <dt class="col-sm-6">Heizgradtage:</dt>
                        <dd class="col-sm-6">${window.formatUtils.formatNumber(weatherData.heating_degree_days) || 'N/A'}</dd>
                        <dt class="col-sm-6">Solarstrahlung:</dt>
                        <dd class="col-sm-6">${weatherData.solar_irradiation_kwh_per_m2 || 'N/A'} kWh/m²</dd>
                        <dt class="col-sm-6">Windgeschw.:</dt>
                        <dd class="col-sm-6">${weatherData.wind_speed_avg_m_per_s || 'N/A'} m/s</dd>
                    </dl>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">💼 Wirtschaftsdaten</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-6">Medianeinkommen:</dt>
                        <dd class="col-sm-6">${window.formatUtils.formatCurrency(economicData.median_income_eur) || 'N/A'}</dd>
                        <dt class="col-sm-6">Arbeitslosigkeit:</dt>
                        <dd class="col-sm-6">${economicData.unemployment_rate_pct || 'N/A'}%</dd>
                        <dt class="col-sm-6">Immobilienpreise:</dt>
                        <dd class="col-sm-6">${window.formatUtils.formatCurrency(economicData.property_prices_eur_per_m2) || 'N/A'}/m²</dd>
                        <dt class="col-sm-6">Gewerbesteuer:</dt>
                        <dd class="col-sm-6">${economicData.business_tax_rate_pct || 'N/A'}%</dd>
                    </dl>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">⚖️ Rechtlicher Rahmen</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-6">EEG:</dt>
                        <dd class="col-sm-6">${regulatory.renewable_energy_law || 'N/A'}</dd>
                        <dt class="col-sm-6">GEG:</dt>
                        <dd class="col-sm-6">${regulatory.building_energy_law || 'N/A'}</dd>
                        <dt class="col-sm-6">CO₂-Budget:</dt>
                        <dd class="col-sm-6">${window.formatUtils.formatNumber(regulatory.co2_budget_tons) || 'N/A'} t/Jahr</dd>
                        <dt class="col-sm-6">EE-Ziel 2030:</dt>
                        <dd class="col-sm-6">${regulatory.renewable_target_pct || 'N/A'}%</dd>
                    </dl>
                </div>
            </div>
        `;
    }
    
    static renderEmissionFactors(factors) {
        if (!factors || Object.keys(factors).length === 0) return '<div class="alert alert-warning">Keine Emissionsfaktoren verfügbar</div>';
        
        const factorItems = Object.entries(factors).map(([key, value]) => {
            const label = this.getEmissionFactorLabel(key);
            const formattedValue = typeof value === 'number' ? value.toFixed(3) : value;
            return `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span class="text-muted">${label}:</span>
                    <span class="fw-bold">${formattedValue} kg CO₂/kWh</span>
                </div>
            `;
        }).join('');
        
        return `
            <div class="emission-factors">
                ${factorItems}
                <div class="mt-3">
                    <small class="text-muted">
                        <i class="bi bi-info-circle me-1"></i>
                        Faktoren basierend auf aktuellen deutschen Durchschnittswerten
                    </small>
                </div>
            </div>
        `;
    }
    
    static renderTechnicalParameters(params) {
        if (!params || Object.keys(params).length === 0) return '<div class="alert alert-warning">Keine technischen Parameter verfügbar</div>';
        
        return `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">⏱️ Planungsparameter</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-7">Planungshorizont:</dt>
                        <dd class="col-sm-5">${params.planning_horizon_years || 'N/A'} Jahre</dd>
                        <dt class="col-sm-7">Diskontierungssatz:</dt>
                        <dd class="col-sm-5">${((params.discount_rate || 0) * 100).toFixed(1)}%</dd>
                        <dt class="col-sm-7">Inflationsrate:</dt>
                        <dd class="col-sm-5">${((params.inflation_rate || 0) * 100).toFixed(1)}%</dd>
                    </dl>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">⚡ Systemparameter</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-7">Netzeffizienz:</dt>
                        <dd class="col-sm-5">${((params.grid_efficiency || 0) * 100).toFixed(1)}%</dd>
                        <dt class="col-sm-7">Speichereffizienz:</dt>
                        <dd class="col-sm-5">${((params.storage_efficiency || 0) * 100).toFixed(1)}%</dd>
                        <dt class="col-sm-7">Spitzenlastfaktor:</dt>
                        <dd class="col-sm-5">${params.peak_load_factor || 'N/A'}</dd>
                    </dl>
                </div>
            </div>
            <div class="mt-3">
                <small class="text-muted">
                    <i class="bi bi-gear me-1"></i>
                    Diese Parameter werden für alle Berechnungen und Analysen verwendet
                </small>
            </div>
        `;
    }
    
    static renderAnalysisSettings(settings) {
        if (!settings || Object.keys(settings).length === 0) return '<div class="alert alert-warning">Keine Analyse-Einstellungen verfügbar</div>';
        
        const energyBalance = settings.energy_balance || {};
        const co2Analysis = settings.co2_analysis || {};
        const economicAnalysis = settings.economic_analysis || {};
        const stakeholderAnalysis = settings.stakeholder_analysis || {};
        
        return `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">⚡ Energiebilanz</h6>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" ${energyBalance.include_storage ? 'checked' : ''} disabled>
                        <label class="form-check-label">Speicher einbeziehen</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" ${energyBalance.seasonal_adjustment ? 'checked' : ''} disabled>
                        <label class="form-check-label">Saisonale Anpassung</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" ${energyBalance.grid_import_export ? 'checked' : ''} disabled>
                        <label class="form-check-label">Netz-Import/Export</label>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">🌱 CO₂-Analyse</h6>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" ${co2Analysis.include_upstream_emissions ? 'checked' : ''} disabled>
                        <label class="form-check-label">Vorgelagerte Emissionen</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" ${co2Analysis.lifecycle_assessment ? 'checked' : ''} disabled>
                        <label class="form-check-label">Lebenszyklus-Bewertung</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" ${co2Analysis.carbon_budget_tracking ? 'checked' : ''} disabled>
                        <label class="form-check-label">CO₂-Budget-Tracking</label>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">💰 Wirtschaftsanalyse</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-8">Externalitäten:</dt>
                        <dd class="col-sm-4">${economicAnalysis.include_externalities ? 'Ja' : 'Nein'}</dd>
                        <dt class="col-sm-8">CO₂-Kosten:</dt>
                        <dd class="col-sm-4">${economicAnalysis.social_cost_of_carbon || 'N/A'} €/t</dd>
                        <dt class="col-sm-8">Sozialer Diskont:</dt>
                        <dd class="col-sm-4">${((economicAnalysis.discount_rate_social || 0) * 100).toFixed(1)}%</dd>
                    </dl>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="text-muted mb-2">👥 Stakeholder-Analyse</h6>
                    <dl class="row mb-0">
                        <dt class="col-sm-6">Hoch:</dt>
                        <dd class="col-sm-6">Gewichtung ${stakeholderAnalysis.influence_weighting?.high || 'N/A'}</dd>
                        <dt class="col-sm-6">Mittel:</dt>
                        <dd class="col-sm-6">Gewichtung ${stakeholderAnalysis.influence_weighting?.medium || 'N/A'}</dd>
                        <dt class="col-sm-6">Niedrig:</dt>
                        <dd class="col-sm-6">Gewichtung ${stakeholderAnalysis.influence_weighting?.low || 'N/A'}</dd>
                        <dt class="col-sm-6">Beteiligungsbonus:</dt>
                        <dd class="col-sm-6">${stakeholderAnalysis.participation_bonus || 'N/A'}</dd>
                    </dl>
                </div>
            </div>
        `;
    }
    
    static renderNewTechnicalParameters(techParams) {
        if (!techParams || Object.keys(techParams).length === 0) {
            return '<div class="alert alert-info">Keine technischen Parameter aus der neuen Konfiguration verfügbar</div>';
        }
        
        // Check if we have technology categories data
        if (techParams.categories) {
            const categories = techParams.categories;
            const categoryCards = Object.entries(categories).map(([key, category]) => {
                return `
                    <div class="mb-3">
                        <h6 class="text-primary">${category.name || key}</h6>
                        <p class="text-muted small">${category.description || 'Keine Beschreibung verfügbar'}</p>
                    </div>
                `;
            }).join('');
            
            return `
                <div class="mb-3">
                    <h6 class="text-muted mb-2">🔧 Technologie-Kategorien</h6>
                    ${categoryCards}
                </div>
                <small class="text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    Technologie-Parameter werden aus der technology_config.yml geladen
                </small>
            `;
        }
        
        // Fallback for other technical parameters structure
        return `
            <div class="alert alert-info">
                <i class="bi bi-gear me-2"></i>
                <strong>Technische Parameter</strong><br>
                Die Parameter werden aus der neuen Konfigurationsstruktur geladen.
            </div>
        `;
    }
    
    /**
     * Rendert technische Parameter aus system_config.yml
     * @param {Object} techParams - Technische Parameter aus system_config
     * @returns {string} HTML für technische Parameter
     */
    static renderSystemTechnicalParameters(techParams) {
        if (!techParams || Object.keys(techParams).length === 0) {
            return '<div class="alert alert-warning">Keine technischen Parameter verfügbar</div>';
        }
        
        return `
            <dl class="row mb-0">
                <dt class="col-sm-8">Planungshorizont:</dt>
                <dd class="col-sm-4">${techParams.planning_horizon_years || 'N/A'} Jahre</dd>
                
                <dt class="col-sm-8">Diskontierungssatz:</dt>
                <dd class="col-sm-4">${techParams.discount_rate ? (techParams.discount_rate * 100).toFixed(1) + '%' : 'N/A'}</dd>
                
                <dt class="col-sm-8">Inflationsrate:</dt>
                <dd class="col-sm-4">${techParams.inflation_rate ? (techParams.inflation_rate * 100).toFixed(1) + '%' : 'N/A'}</dd>
            </dl>
            
            <div class="mt-3">
                <small class="text-muted">
                    <i class="bi bi-gear me-1"></i>
                    Allgemeine Parameter für die Energiesystemplanung
                </small>
            </div>
        `;
    }
    
    static renderScenarioPriceTable(scenario) {
        console.log('renderScenarioPriceTable called with:', scenario);
        
        if (!scenario || typeof scenario !== 'object') {
            return '<div class="alert alert-warning">Keine Preisdaten verfügbar</div>';
        }
        
        const years = [2025, 2030, 2040, 2050];
        const priceTypes = [
            { key: 'electricity_prices', label: 'Strom', unit: '€/kWh', color: 'primary' },
            { key: 'gas_prices', label: 'Gas', unit: '€/kWh', color: 'info' },
            { key: 'heat_prices', label: 'Fernwärme', unit: '€/kWh', color: 'warning' },
            { key: 'co2_prices', label: 'CO₂', unit: '€/t', color: 'success' }
        ];
        
        const tableRows = priceTypes.map(priceType => {
            const prices = scenario[priceType.key] || {};
            console.log(`Processing ${priceType.key}:`, prices);
            
            const yearCells = years.map(year => {
                const price = prices[year];
                let formattedPrice = 'N/A';
                
                if (price !== undefined && price !== null) {
                    if (priceType.unit === '€/t') {
                        formattedPrice = window.formatUtils.formatNumber(price, 0);
                    } else {
                        formattedPrice = price.toFixed(3);
                    }
                }
                
                return `<td class="text-center">${formattedPrice}</td>`;
            }).join('');
            
            return `
                <tr>
                    <td>
                        <span class="badge bg-${priceType.color} me-2">●</span>
                        ${priceType.label}
                    </td>
                    ${yearCells}
                    <td class="text-muted small">${priceType.unit}</td>
                </tr>
            `;
        }).join('');
        
        return `
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    <thead class="table-light">
                        <tr>
                            <th style="width: 25%;">Energieträger</th>
                            <th class="text-center" style="width: 15%;">2025</th>
                            <th class="text-center" style="width: 15%;">2030</th>
                            <th class="text-center" style="width: 15%;">2040</th>
                            <th class="text-center" style="width: 15%;">2050</th>
                            <th style="width: 15%;">Einheit</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
            <div class="mt-2">
                <small class="text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    Alle Preise sind Endkundenpreise inkl. Steuern und Abgaben
                </small>
            </div>
        `;
    }
    
    // Helper method for emission factor labels
    static getEmissionFactorLabel(key) {
        const labels = {
            'electricity_grid_kg_co2_per_kwh': 'Strommix Deutschland',
            'gas_kg_co2_per_kwh': 'Erdgas',
            'heating_oil_kg_co2_per_kwh': 'Heizöl',
            'district_heating_kg_co2_per_kwh': 'Fernwärme',
            'biomass_kg_co2_per_kwh': 'Biomasse'
        };
        return labels[key] || key.replace(/_/g, ' ');
    }
    
    static renderTechnologyCard(key, template) {
        return `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title">${template.name}</h6>
                        <p class="card-text text-muted">${template.technology_type}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Make ConfigView globally available
window.ConfigView = ConfigView;
