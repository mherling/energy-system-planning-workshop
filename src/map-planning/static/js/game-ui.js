/**
 * Vereinfachte Game UI für das Energiesystem-Planspiel
 * Mit Skip-Button und State-Persistierung
 */

class GameUIManager {
    constructor() {
        // Prüfen ob bereits ein GameEngine-State existiert
        if (window.gameEngineState) {
            this.gameEngine = window.gameEngineState;
            console.log('Vorhandenen GameEngine-State wiederhergestellt');
        } else {
            this.gameEngine = new GameEngine();
            window.gameEngineState = this.gameEngine;
        }
        
        this.currentPlayer = {
            id: 'demo_player',
            name: 'Demo-Spieler',
            role: 'stadtplaner'
        };
        
        this.setupEventListeners();
        this.initializeUI();
        
        // Wenn bereits ein Spiel läuft, UI entsprechend wiederherstellen
        this.restoreGameState();
    }

    setupEventListeners() {
        // Game Engine Events
        this.gameEngine.on('gameStarted', (data) => this.onGameStarted(data));
        this.gameEngine.on('phaseStarted', (data) => this.onPhaseStarted(data));
        this.gameEngine.on('roundCompleted', (data) => this.onRoundCompleted(data));
        this.gameEngine.on('gameEnded', (data) => this.onGameEnded(data));
        
        // Phase-spezifische Events
        this.gameEngine.on('analysisPhaseReady', (data) => this.showAnalysisPhase(data));
        this.gameEngine.on('planningPhaseReady', (data) => this.showPlanningPhase(data));
        this.gameEngine.on('eventsPhaseReady', (data) => this.showEventsPhase(data));
        this.gameEngine.on('realityPhaseReady', (data) => this.showRealityPhase(data));
        this.gameEngine.on('evaluationPhaseReady', (data) => this.showEvaluationPhase(data));
        
        // Investment & Forecast Events
        this.gameEngine.on('investmentMade', (data) => this.onInvestmentMade(data));
        this.gameEngine.on('forecastMade', (data) => this.onForecastMade(data));
    }

    initializeUI() {
        this.createGameContainer();
        this.createGameControls();
        this.createPhaseDisplay();
        this.createPlayerDashboard();
        this.createInvestmentPanel();
        this.createEventDisplay();
    }

    createGameContainer() {
        // Prüfen ob wir bereits im Planspiel-Container sind
        let container = document.getElementById('planspiel-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'planspiel-container';
            const mainContent = document.querySelector('.container-fluid') || document.body;
            mainContent.appendChild(container);
        }
        
        container.className = 'container-fluid mt-3';
        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="card bg-dark text-white">
                        <div class="card-header">
                            <h2 class="mb-0">🎮 Energiesystem-Planspiel</h2>
                            <div id="game-status" class="mt-2">
                                <span class="badge bg-secondary me-2">Bereit zum Start</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="game-content">
                                <!-- Game content wird hier eingefügt -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createGameControls() {
        const controlsHTML = `
            <div id="game-controls" class="mb-4">
                <div class="row">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5>🎯 Planspiel-Steuerung</h5>
                            </div>
                            <div class="card-body">
                                <button id="start-game-btn" class="btn btn-success me-2">
                                    <i class="bi bi-play-fill"></i> Planspiel starten
                                </button>
                                <button id="pause-game-btn" class="btn btn-warning me-2" disabled>
                                    <i class="bi bi-pause-fill"></i> Pausieren
                                </button>
                                <button id="reset-game-btn" class="btn btn-danger">
                                    <i class="bi bi-arrow-clockwise"></i> Zurücksetzen
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h5>📊 Spielmodus</h5>
                            </div>
                            <div class="card-body">
                                <p class="mb-2">Demo-Modus</p>
                                <small class="text-muted">Flexibles Timing, State-Persistierung</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('game-content').innerHTML = controlsHTML;
        this.attachControlEventListeners();
    }

    createPhaseDisplay() {
        const phaseHTML = `
            <div id="phase-display" class="mb-4" style="display: none;">
                <div class="card border-primary">
                    <div class="card-header bg-primary text-white">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <h4 id="phase-name" class="mb-0">Aktuelle Phase</h4>
                                <p id="phase-description" class="mb-0 small">Beschreibung der aktuellen Phase</p>
                            </div>
                            <div class="col-md-3 text-center">
                                <div id="phase-timer" class="h5 mb-0">00:00</div>
                                <small class="text-muted">verbleibend</small>
                                <div class="progress mt-2" style="height: 8px;">
                                    <div id="phase-progress" class="progress-bar" role="progressbar" 
                                         style="width: 0%"></div>
                                </div>
                            </div>
                            <div class="col-md-3 text-end">
                                <button id="skip-phase-btn" class="btn btn-warning btn-sm">
                                    <i class="bi bi-skip-end-fill"></i> Weiter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('game-content').insertAdjacentHTML('beforeend', phaseHTML);
    }

    createPlayerDashboard() {
        const dashboardHTML = `
            <div id="player-dashboard" class="mb-4" style="display: none;">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5>💰 Budget & Performance</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-6">
                                        <div class="text-center">
                                            <h6>Verfügbares Budget</h6>
                                            <div id="current-budget" class="h4 text-success">€ 1.000.000</div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="text-center">
                                            <h6>Investiert</h6>
                                            <div id="invested-amount" class="h4 text-info">€ 0</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row mt-3">
                                    <div class="col-4">
                                        <div class="text-center">
                                            <h6 class="small">CO₂-Reduktion</h6>
                                            <div id="co2-reduction" class="h5 text-success">0%</div>
                                        </div>
                                    </div>
                                    <div class="col-4">
                                        <div class="text-center">
                                            <h6 class="small">Kosteneinsparung</h6>
                                            <div id="cost-savings" class="h5 text-primary">€ 0</div>
                                        </div>
                                    </div>
                                    <div class="col-4">
                                        <div class="text-center">
                                            <h6 class="small">Resilienz</h6>
                                            <div id="resilience-score" class="h5 text-warning">0/10</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 id="round-header">📊 Runde 1 - Jahr 2024</h5>
                            </div>
                            <div class="card-body">
                                <div id="round-summary">
                                    <p>Willkommen zum Energiesystem-Planspiel! Klicken Sie auf "Planspiel starten" um zu beginnen.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('game-content').insertAdjacentHTML('beforeend', dashboardHTML);
    }

    createInvestmentPanel() {
        const investmentHTML = `
            <div id="investment-panel" class="mb-4" style="display: none;">
                <div class="card">
                    <div class="card-header">
                        <h5>🏗️ Investitionsoptionen</h5>
                    </div>
                    <div class="card-body">
                        <div id="investment-options" class="row">
                            <!-- Investitionsoptionen werden hier dynamisch eingefügt -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('game-content').insertAdjacentHTML('beforeend', investmentHTML);
    }

    createEventDisplay() {
        const eventHTML = `
            <div id="event-display" class="mb-4" style="display: none;">
                <div class="card border-warning">
                    <div class="card-header bg-warning text-dark">
                        <h5>⚡ Ereignisse</h5>
                    </div>
                    <div class="card-body">
                        <div id="events-list">
                            <!-- Ereignisse werden hier angezeigt -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('game-content').insertAdjacentHTML('beforeend', eventHTML);
    }

    attachControlEventListeners() {
        // Spiel starten
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.gameEngine.startGame([this.currentPlayer]);
        });

        // Pausieren
        document.getElementById('pause-game-btn').addEventListener('click', () => {
            console.log('Pause-Funktion noch nicht implementiert');
        });

        // Zurücksetzen
        document.getElementById('reset-game-btn').addEventListener('click', () => {
            if (confirm('Spiel wirklich zurücksetzen?')) {
                delete window.gameEngineState;
                location.reload();
            }
        });

        // Skip Phase Button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'skip-phase-btn' || e.target.closest('#skip-phase-btn')) {
                this.skipPhase();
            }
        });
    }

    // Zur nächsten Phase wechseln
    skipPhase() {
        if (this.gameEngine && typeof this.gameEngine.skipToNextPhase === 'function') {
            this.gameEngine.skipToNextPhase();
        }
    }

    // Spielzustand wiederherstellen
    restoreGameState() {
        const gameState = this.gameEngine.getGameState();
        
        if (gameState.currentRound > 0) {
            // Spiel läuft bereits - UI entsprechend anpassen
            document.getElementById('game-controls').style.display = 'none';
            document.getElementById('phase-display').style.display = 'block';
            document.getElementById('player-dashboard').style.display = 'block';
            
            // Dashboard aktualisieren
            this.updatePlayerDashboard();
            
            // Round header aktualisieren
            document.getElementById('round-header').textContent = `📊 Runde ${gameState.currentRound} - Jahr ${gameState.year}`;
            
            // Aktuelle Phase anzeigen
            if (gameState.currentPhase) {
                this.updatePhaseDisplay(gameState.currentPhase);
            }
            
            console.log('Spielzustand wiederhergestellt:', gameState);
        }
    }

    // Phase-Display aktualisieren
    updatePhaseDisplay(phase) {
        const phaseConfig = this.gameEngine.phases[phase];
        if (phaseConfig) {
            document.getElementById('phase-name').textContent = phaseConfig.name;
            this.updatePhaseDescription(phase);
        }
    }

    // Event Handler für Game Engine Events
    onGameStarted(data) {
        document.getElementById('game-controls').style.display = 'none';
        document.getElementById('phase-display').style.display = 'block';
        document.getElementById('player-dashboard').style.display = 'block';
        
        this.updateGameStatus('Spiel läuft');
        console.log('Planspiel gestartet!', data);
    }

    onPhaseStarted(data) {
        document.getElementById('phase-name').textContent = data.name;
        this.updatePhaseDescription(data.phase);
        this.startPhaseTimer(data.duration);
        
        console.log('Phase gestartet:', data.phase);
    }

    onRoundCompleted(data) {
        this.updatePlayerDashboard();
        this.showRoundSummary(data);
        
        // Round header aktualisieren
        const gameState = this.gameEngine.getGameState();
        document.getElementById('round-header').textContent = `📊 Runde ${gameState.currentRound} - Jahr ${gameState.year}`;
    }

    onGameEnded(data) {
        this.showFinalResults(data);
        this.updateGameStatus('Spiel beendet');
    }

    onInvestmentMade(data) {
        console.log('Investment gemacht:', data);
    }

    onForecastMade(data) {
        console.log('Prognose erstellt:', data);
    }

    // Phase-spezifische UI Updates
    showAnalysisPhase(data) {
        document.getElementById('investment-panel').style.display = 'none';
        document.getElementById('event-display').style.display = 'none';
        
        this.updateRoundSummary('📊 Analysieren Sie die aktuelle Systemsituation und Trends.');
    }

    showPlanningPhase(data) {
        document.getElementById('investment-panel').style.display = 'block';
        this.populateInvestmentOptions(data.investments);
        
        this.updateRoundSummary('🎯 Wählen Sie Ihre Investitionen und erstellen Sie Prognosen.');
    }

    showEventsPhase(data) {
        document.getElementById('event-display').style.display = 'block';
        this.displayEvents(data.events);
        
        this.updateRoundSummary('⚡ Unerwartete Ereignisse treten ein...');
    }

    showRealityPhase(data) {
        this.displayRealityVsForecast(data);
        this.updateRoundSummary('📈 Die Realität weicht von Ihren Prognosen ab.');
    }

    showEvaluationPhase(data) {
        this.displayEvaluation(data);
        this.updateRoundSummary('🎓 Bewerten Sie Ihre Performance und lernen Sie aus den Erfahrungen.');
    }

    // UI Helper Methods
    updateGameStatus(status) {
        document.getElementById('game-status').innerHTML = 
            `<span class="badge bg-success">${status}</span>`;
    }

    updatePhaseDescription(phase) {
        const descriptions = {
            analysis: 'Studieren Sie IST-Zustand und Trends (max. 5 Min)',
            planning: 'Treffen Sie Investitionsentscheidungen (max. 7 Min)',
            events: 'Zufallsereignisse treffen ein (max. 2 Min)',
            reality: 'Vergleich: Prognose vs. Realität (max. 3 Min)',
            evaluation: 'Performance bewerten und lernen (max. 5 Min)'
        };
        
        document.getElementById('phase-description').textContent = descriptions[phase] || '';
    }

    startPhaseTimer(duration) {
        let remaining = duration;
        const timerElement = document.getElementById('phase-timer');
        const progressElement = document.getElementById('phase-progress');
        
        const updateTimer = () => {
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            const progress = ((duration - remaining) / duration) * 100;
            progressElement.style.width = `${progress}%`;
            
            if (remaining > 0) {
                remaining--;
                setTimeout(updateTimer, 1000);
            }
        };
        
        updateTimer();
    }

    populateInvestmentOptions(investments) {
        const container = document.getElementById('investment-options');
        container.innerHTML = '';
        
        investments.forEach(investment => {
            const investmentCard = `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card h-100 investment-card">
                        <div class="card-header">
                            <h6 class="mb-0">${investment.name}</h6>
                        </div>
                        <div class="card-body">
                            <p class="small">${investment.description}</p>
                            <div class="mb-2">
                                <strong>Kosten:</strong> €${investment.cost.toLocaleString()}
                            </div>
                            <div class="mb-2">
                                <strong>CO₂-Reduktion:</strong> ${Math.round(investment.benefits.co2_reduction)} kg/Jahr
                            </div>
                            <div class="mb-2">
                                <strong>Einsparung:</strong> €${Math.round(investment.benefits.cost_savings)}/Jahr
                            </div>
                            <div class="mb-3">
                                <small class="text-warning">Risiko: ${investment.risks}</small>
                            </div>
                            <button class="btn btn-primary btn-sm w-100" 
                                    onclick="gameUI.makeInvestment('${investment.id}', ${JSON.stringify(investment).replace(/"/g, '&quot;')})">
                                💰 Investieren
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', investmentCard);
        });
    }

    makeInvestment(investmentId, investment) {
        if (this.gameEngine.makeInvestment(this.currentPlayer.id, investment)) {
            this.updatePlayerDashboard();
            console.log('Investment gemacht:', investment.name);
        } else {
            alert('Unzureichendes Budget für diese Investition!');
        }
    }

    displayEvents(events) {
        const container = document.getElementById('events-list');
        container.innerHTML = '';
        
        if (events.length === 0) {
            container.innerHTML = '<p class="text-muted">Keine besonderen Ereignisse in diesem Jahr.</p>';
            return;
        }
        
        events.forEach(event => {
            const eventCard = `
                <div class="alert alert-warning mb-3">
                    <h6 class="alert-heading">⚡ ${event.event.replace(/_/g, ' ').toUpperCase()}</h6>
                    <p class="mb-1">${event.description}</p>
                    <small class="text-muted">Auswirkung: ${event.impact}</small>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', eventCard);
        });
    }

    updatePlayerDashboard() {
        const gameState = this.gameEngine.getGameState();
        const player = gameState.players.find(p => p.id === this.currentPlayer.id);
        
        if (player) {
            document.getElementById('current-budget').textContent = `€ ${player.budget.toLocaleString()}`;
            
            const invested = player.investments.reduce((sum, inv) => sum + inv.cost, 0);
            document.getElementById('invested-amount').textContent = `€ ${invested.toLocaleString()}`;
            
            // Vereinfachte Performance-Kennzahlen
            document.getElementById('co2-reduction').textContent = `${(player.investments.length * 5)}%`;
            document.getElementById('cost-savings').textContent = `€ ${(player.investments.length * 1000).toLocaleString()}`;
            document.getElementById('resilience-score').textContent = `${Math.min(10, player.investments.length)}/10`;
        }
    }

    updateRoundSummary(message) {
        document.getElementById('round-summary').innerHTML = `<p>${message}</p>`;
    }

    displayRealityVsForecast(data) {
        this.updateRoundSummary('📊 Ihre Prognosen werden mit der eingetretenen Realität verglichen...');
    }

    displayEvaluation(data) {
        this.updateRoundSummary('📈 Ihre Performance wird ausgewertet...');
    }

    showRoundSummary(data) {
        console.log('Runde abgeschlossen:', data);
    }

    showFinalResults(data) {
        this.updateRoundSummary('🎉 Spiel beendet! Herzlichen Glückwunsch!');
        
        setTimeout(() => {
            alert('Spiel beendet! Finale Ergebnisse:\n\n' + 
                  'Investitionen: ' + data.finalResults.totalInvestments + '\n' +
                  'CO₂-Reduktion: ' + data.finalResults.co2Reduction + '%\n' +
                  'Kosteneinsparungen: €' + data.finalResults.costSavings);
        }, 1000);
    }
}

// Game UI initialisieren
let gameUI;

document.addEventListener('DOMContentLoaded', function() {
    // Prüfen ob wir im Planspiel-Modus sind
    if (window.location.pathname.includes('map-planning') || document.getElementById('planspiel-container')) {
        // Warten bis alle anderen Scripts geladen sind
        setTimeout(() => {
            if (typeof GameEngine !== 'undefined') {
                gameUI = new GameUIManager();
                console.log('Planspiel UI initialisiert');
            } else {
                console.error('GameEngine nicht gefunden');
            }
        }, 100);
    }
});

// Für globalen Zugriff
window.gameUI = gameUI;
