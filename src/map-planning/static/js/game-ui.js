/**
 * Game UI Manager für das Energiesystem-Planspiel
 * Steuert die Benutzeroberfläche und Interaktionen
 */

class GameUIManager {
    constructor() {
        this.gameEngine = new GameEngine();
        this.currentPlayer = null;
        this.setupEventListeners();
        this.initializeUI();
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
            // Falls nicht, zur Hauptseite hinzufügen
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
                                <span class="badge badge-secondary me-2">Bereit zum Start</span>
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
        
        // Container-Inhalt setzen (überschreibt vorherigen Inhalt)
        const gameContentContainer = container.querySelector('#game-content') || container;
    }

    createGameControls() {
        const controlsHTML = `
            <div id="game-controls" class="mb-4">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5>🎯 Spielsteuerung</h5>
                            </div>
                            <div class="card-body">
                                <button id="start-game-btn" class="btn btn-success me-2">
                                    <i class="fas fa-play"></i> Spiel starten
                                </button>
                                <button id="pause-game-btn" class="btn btn-warning me-2" disabled>
                                    <i class="fas fa-pause"></i> Pausieren
                                </button>
                                <button id="reset-game-btn" class="btn btn-danger">
                                    <i class="fas fa-redo"></i> Zurücksetzen
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5>👥 Spieler-Setup</h5>
                            </div>
                            <div class="card-body">
                                <div id="player-setup">
                                    <div class="input-group mb-2">
                                        <input type="text" id="player-name" class="form-control" 
                                               placeholder="Spielername eingeben">
                                        <select id="player-role" class="form-select">
                                            <option value="stadtplaner">Stadtplaner*in</option>
                                            <option value="stadtwerke">Stadtwerke-Manager*in</option>
                                            <option value="quartiersentwickler">Quartiersentwickler*in</option>
                                            <option value="klimaschutz">Klimaschutz-Manager*in</option>
                                            <option value="buergerinitiative">Bürgerinitiative</option>
                                        </select>
                                        <button id="add-player-btn" class="btn btn-outline-primary">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                    <div id="players-list">
                                        <!-- Spielerliste wird hier angezeigt -->
                                    </div>
                                </div>
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
                            <div class="col-md-8">
                                <h4 id="phase-name" class="mb-0">Aktuelle Phase</h4>
                                <p id="phase-description" class="mb-0 small">Beschreibung der aktuellen Phase</p>
                            </div>
                            <div class="col-md-4 text-end">
                                <div id="phase-timer" class="h3 mb-0">00:00</div>
                                <div class="progress mt-2" style="height: 10px;">
                                    <div id="phase-progress" class="progress-bar" role="progressbar" 
                                         style="width: 0%"></div>
                                </div>
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
                                <h5>📊 Runde ${this.gameEngine.getGameState().currentRound} - Jahr ${this.gameEngine.getGameState().year}</h5>
                            </div>
                            <div class="card-body">
                                <div id="round-summary">
                                    <p>Aktuelle Spielsituation und wichtige Kennzahlen werden hier angezeigt.</p>
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
            const players = this.getPlayersFromUI();
            if (players.length > 0) {
                this.gameEngine.startGame(players);
            } else {
                alert('Bitte mindestens einen Spieler hinzufügen!');
            }
        });

        // Spieler hinzufügen
        document.getElementById('add-player-btn').addEventListener('click', () => {
            this.addPlayerToUI();
        });

        // Enter-Taste für Spieler hinzufügen
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPlayerToUI();
            }
        });
    }

    addPlayerToUI() {
        const nameInput = document.getElementById('player-name');
        const roleSelect = document.getElementById('player-role');
        
        if (nameInput.value.trim()) {
            const playerId = 'player_' + Date.now();
            const playerHTML = `
                <div class="alert alert-info alert-dismissible fade show" data-player-id="${playerId}">
                    <strong>${nameInput.value}</strong> - ${this.getRoleDisplayName(roleSelect.value)}
                    <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
                </div>
            `;
            
            document.getElementById('players-list').insertAdjacentHTML('beforeend', playerHTML);
            nameInput.value = '';
        }
    }

    getPlayersFromUI() {
        const playerElements = document.querySelectorAll('#players-list .alert');
        return Array.from(playerElements).map((el, index) => {
            const text = el.textContent.trim();
            const [name, role] = text.split(' - ');
            return {
                id: el.dataset.playerId,
                name: name,
                role: this.getRoleKeyFromDisplayName(role)
            };
        });
    }

    getRoleDisplayName(roleKey) {
        const roleNames = {
            stadtplaner: 'Stadtplaner*in',
            stadtwerke: 'Stadtwerke-Manager*in',
            quartiersentwickler: 'Quartiersentwickler*in',
            klimaschutz: 'Klimaschutz-Manager*in',
            buergerinitiative: 'Bürgerinitiative'
        };
        return roleNames[roleKey] || roleKey;
    }

    getRoleKeyFromDisplayName(displayName) {
        const roleKeys = {
            'Stadtplaner*in': 'stadtplaner',
            'Stadtwerke-Manager*in': 'stadtwerke',
            'Quartiersentwickler*in': 'quartiersentwickler',
            'Klimaschutz-Manager*in': 'klimaschutz',
            'Bürgerinitiative': 'buergerinitiative'
        };
        return roleKeys[displayName] || displayName;
    }

    // Event Handler für Game Engine Events
    onGameStarted(data) {
        document.getElementById('game-controls').style.display = 'none';
        document.getElementById('phase-display').style.display = 'block';
        document.getElementById('player-dashboard').style.display = 'block';
        
        // Ersten Spieler als aktuellen Spieler setzen (für Single-Player Demo)
        this.currentPlayer = data.players[0];
        
        this.updateGameStatus('Spiel läuft');
    }

    onPhaseStarted(data) {
        document.getElementById('phase-name').textContent = data.name;
        this.updatePhaseDescription(data.phase);
        this.startPhaseTimer(data.duration);
    }

    onRoundCompleted(data) {
        this.updatePlayerDashboard();
        this.showRoundSummary(data);
    }

    onGameEnded(data) {
        this.showFinalResults(data);
        this.updateGameStatus('Spiel beendet');
    }

    // Phase-spezifische UI Updates
    showAnalysisPhase(data) {
        document.getElementById('investment-panel').style.display = 'none';
        document.getElementById('event-display').style.display = 'none';
        
        this.updateRoundSummary('Analysieren Sie die aktuelle Systemsituation und Trends.');
    }

    showPlanningPhase(data) {
        document.getElementById('investment-panel').style.display = 'block';
        this.populateInvestmentOptions(data.investments);
        
        this.updateRoundSummary('Wählen Sie Ihre Investitionen und erstellen Sie Prognosen.');
    }

    showEventsPhase(data) {
        document.getElementById('event-display').style.display = 'block';
        this.displayEvents(data.events);
        
        this.updateRoundSummary('Unerwartete Ereignisse treten ein...');
    }

    showRealityPhase(data) {
        this.displayRealityVsForecast(data);
        this.updateRoundSummary('Die Realität weicht von Ihren Prognosen ab.');
    }

    showEvaluationPhase(data) {
        this.displayEvaluation(data);
        this.updateRoundSummary('Bewerten Sie Ihre Performance und lernen Sie aus den Erfahrungen.');
    }

    // UI Helper Methods
    updateGameStatus(status) {
        document.getElementById('game-status').innerHTML = 
            `<span class="badge badge-success">${status}</span>`;
    }

    updatePhaseDescription(phase) {
        const descriptions = {
            analysis: 'Studieren Sie IST-Zustand und Trends (3-5 Min)',
            planning: 'Treffen Sie Investitionsentscheidungen (5-7 Min)',
            events: 'Zufallsereignisse treffen ein (1-2 Min)',
            reality: 'Vergleich: Prognose vs. Realität (2-3 Min)',
            evaluation: 'Performance bewerten und lernen (3-5 Min)'
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
                    <div class="card h-100">
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
                                Investieren
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', investmentCard);
        });
    }

    makeInvestment(investmentId, investment) {
        if (this.currentPlayer && this.gameEngine.makeInvestment(this.currentPlayer.id, investment)) {
            this.updatePlayerDashboard();
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
        if (!this.currentPlayer) return;
        
        const player = this.gameEngine.getGameState().players.find(p => p.id === this.currentPlayer.id);
        if (player) {
            document.getElementById('current-budget').textContent = `€ ${player.budget.toLocaleString()}`;
            
            const invested = player.investments.reduce((sum, inv) => sum + inv.cost, 0);
            document.getElementById('invested-amount').textContent = `€ ${invested.toLocaleString()}`;
            
            // Placeholder-Werte für Performance-Kennzahlen
            document.getElementById('co2-reduction').textContent = `${(player.investments.length * 5)}%`;
            document.getElementById('cost-savings').textContent = `€ ${(player.investments.length * 1000).toLocaleString()}`;
            document.getElementById('resilience-score').textContent = `${Math.min(10, player.investments.length)}/10`;
        }
    }

    updateRoundSummary(message) {
        document.getElementById('round-summary').innerHTML = `<p>${message}</p>`;
    }

    displayRealityVsForecast(data) {
        // Hier würde der Vergleich zwischen Prognose und Realität angezeigt
        this.updateRoundSummary('Ihre Prognosen werden mit der eingetretenen Realität verglichen...');
    }

    displayEvaluation(data) {
        // Hier würde die Performance-Bewertung angezeigt
        this.updateRoundSummary('Ihre Performance wird ausgewertet...');
    }

    showRoundSummary(data) {
        // Hier würde eine Zusammenfassung der Runde angezeigt
        console.log('Runde abgeschlossen:', data);
    }

    showFinalResults(data) {
        // Hier würden die finalen Ergebnisse angezeigt
        alert('Spiel beendet! Finale Ergebnisse werden angezeigt...');
    }
}

// Game UI initialisieren wenn die Seite geladen ist
let gameUI;

document.addEventListener('DOMContentLoaded', function() {
    // Prüfen ob wir auf der richtigen Seite sind
    if (window.location.pathname.includes('map-planning') || document.getElementById('map-container')) {
        gameUI = new GameUIManager();
    }
});

// Für globalen Zugriff
window.gameUI = gameUI;
