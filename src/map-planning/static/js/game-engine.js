/**
 * Game Engine für das Energiesystem-Planspiel
 * Implementiert die Kern-Spielmechanik: PROGNOSE vs. REALITÄT
 */

class GameEngine {
    constructor() {
        this.gameState = {
            currentRound: 0,
            currentPhase: 'analysis', // analysis, planning, events, reality, evaluation
            year: 2024,
            players: [],
            globalEvents: [],
            roundHistory: []
        };
        
        this.phases = {
            analysis: { name: 'Analysephase', duration: 300 }, // 5 Min in Sekunden
            planning: { name: 'Planungsphase', duration: 420 }, // 7 Min
            events: { name: 'Ereignisphase', duration: 120 }, // 2 Min
            reality: { name: 'Realitätsphase', duration: 180 }, // 3 Min
            evaluation: { name: 'Auswertungsphase', duration: 300 } // 5 Min
        };
        
        this.eventManager = new EventManager();
        this.investmentEngine = new InvestmentEngine();
        this.phaseTimer = null;
        this.callbacks = {};
    }

    // Spiel starten
    startGame(players = []) {
        this.gameState.players = players.map(player => ({
            id: player.id,
            name: player.name,
            role: player.role,
            budget: 1000000, // 1M € Startbudget
            investments: [],
            forecasts: {},
            actualResults: {},
            performance: {
                costs: [],
                co2: [],
                resilience: []
            }
        }));
        
        this.gameState.currentRound = 1;
        this.gameState.year = 2024;
        this.startPhase('analysis');
        
        this.triggerCallback('gameStarted', this.gameState);
    }

    // Phase starten
    startPhase(phaseName) {
        this.gameState.currentPhase = phaseName;
        const phase = this.phases[phaseName];
        
        this.triggerCallback('phaseStarted', {
            phase: phaseName,
            name: phase.name,
            duration: phase.duration
        });

        // Timer für Phase (nur als Maximum, kann manuell übersprungen werden)
        if (this.phaseTimer) {
            clearTimeout(this.phaseTimer);
        }
        
        this.phaseTimer = setTimeout(() => {
            this.completePhase();
        }, phase.duration * 1000);

        // Phasen-spezifische Initialisierung
        switch (phaseName) {
            case 'analysis':
                this.initAnalysisPhase();
                break;
            case 'planning':
                this.initPlanningPhase();
                break;
            case 'events':
                this.initEventsPhase();
                break;
            case 'reality':
                this.initRealityPhase();
                break;
            case 'evaluation':
                this.initEvaluationPhase();
                break;
        }
    }

    // Manuell zur nächsten Phase wechseln
    skipToNextPhase() {
        if (this.phaseTimer) {
            clearTimeout(this.phaseTimer);
        }
        this.completePhase();
    }

    // Phase abschließen
    completePhase() {
        const currentPhase = this.gameState.currentPhase;
        
        switch (currentPhase) {
            case 'analysis':
                this.startPhase('planning');
                break;
            case 'planning':
                this.startPhase('events');
                break;
            case 'events':
                this.startPhase('reality');
                break;
            case 'reality':
                this.startPhase('evaluation');
                break;
            case 'evaluation':
                this.completeRound();
                break;
        }
    }

    // Runde abschließen und neue starten
    completeRound() {
        // Rundenergebnisse speichern
        this.gameState.roundHistory.push({
            round: this.gameState.currentRound,
            year: this.gameState.year,
            players: JSON.parse(JSON.stringify(this.gameState.players)),
            events: [...this.gameState.globalEvents]
        });

        this.gameState.currentRound++;
        this.gameState.year++;
        this.gameState.globalEvents = [];

        this.triggerCallback('roundCompleted', {
            round: this.gameState.currentRound - 1,
            history: this.gameState.roundHistory
        });

        // Prüfen ob Spiel beendet (z.B. nach 10 Runden bis 2034)
        if (this.gameState.currentRound > 10) {
            this.endGame();
        } else {
            this.startPhase('analysis');
        }
    }

    // Spiel beenden
    endGame() {
        this.triggerCallback('gameEnded', {
            finalResults: this.calculateFinalResults(),
            history: this.gameState.roundHistory
        });
    }

    // Analysephase initialisieren
    initAnalysisPhase() {
        // Aktuelle Systemdaten laden und aufbereiten
        this.triggerCallback('analysisPhaseReady', {
            currentYear: this.gameState.year,
            systemState: this.getCurrentSystemState(),
            trends: this.generateTrendAnalysis()
        });
    }

    // Planungsphase initialisieren
    initPlanningPhase() {
        // Verfügbare Investitionsoptionen laden
        const investments = this.investmentEngine.getAvailableInvestments(this.gameState.year);
        
        this.triggerCallback('planningPhaseReady', {
            investments: investments,
            budgets: this.getPlayerBudgets(),
            forecastScenarios: this.getForecastScenarios()
        });
    }

    // Ereignisphase initialisieren
    initEventsPhase() {
        // Zufallsereignisse generieren
        const events = this.eventManager.generateEvents(this.gameState.year);
        this.gameState.globalEvents = events;
        
        this.triggerCallback('eventsPhaseReady', {
            events: events
        });
    }

    // Realitätsphase initialisieren
    initRealityPhase() {
        // Tatsächliche Entwicklung vs. Prognose berechnen
        const reality = this.calculateReality();
        
        this.triggerCallback('realityPhaseReady', {
            reality: reality,
            deviations: this.calculateDeviations()
        });
    }

    // Auswertungsphase initialisieren
    initEvaluationPhase() {
        // Performance-Bewertung durchführen
        const evaluation = this.evaluatePerformance();
        
        this.triggerCallback('evaluationPhaseReady', {
            evaluation: evaluation,
            rankings: this.calculateRankings(),
            lessons: this.generateLessonsLearned()
        });
    }

    // Investition durchführen
    makeInvestment(playerId, investment) {
        const player = this.gameState.players.find(p => p.id === playerId);
        if (!player) return false;

        if (player.budget >= investment.cost) {
            player.budget -= investment.cost;
            player.investments.push({
                ...investment,
                year: this.gameState.year,
                roundMade: this.gameState.currentRound
            });
            
            this.triggerCallback('investmentMade', {
                playerId,
                investment,
                remainingBudget: player.budget
            });
            
            return true;
        }
        return false;
    }

    // Prognose erstellen
    makeForecast(playerId, scenario, forecast) {
        const player = this.gameState.players.find(p => p.id === playerId);
        if (player) {
            player.forecasts[scenario] = forecast;
            
            this.triggerCallback('forecastMade', {
                playerId,
                scenario,
                forecast
            });
        }
    }

    // Hilfsmethoden
    getCurrentSystemState() {
        // Hier würde der aktuelle Zustand aller Quartiere abgerufen
        return {
            totalDemand: 0,
            renewableShare: 0,
            co2Emissions: 0,
            costs: 0
        };
    }

    generateTrendAnalysis() {
        return {
            energyDemandTrend: 'increasing',
            renewableTrend: 'increasing',
            costTrend: 'volatile'
        };
    }

    getPlayerBudgets() {
        return this.gameState.players.map(p => ({
            playerId: p.id,
            budget: p.budget,
            spent: p.investments.reduce((sum, inv) => sum + inv.cost, 0)
        }));
    }

    getForecastScenarios() {
        return ['base_case', 'high_prices', 'green_transition'];
    }

    calculateReality() {
        // Hier würde die tatsächliche Entwicklung basierend auf Investitionen und Ereignissen berechnet
        return {
            actualCosts: 0,
            actualCO2: 0,
            actualResilience: 0
        };
    }

    calculateDeviations() {
        // Abweichungen zwischen Prognose und Realität berechnen
        return this.gameState.players.map(player => ({
            playerId: player.id,
            deviations: {
                costs: 0, // % Abweichung
                co2: 0,
                resilience: 0
            }
        }));
    }

    evaluatePerformance() {
        return this.gameState.players.map(player => ({
            playerId: player.id,
            scores: {
                economic: 0,
                ecological: 0,
                social: 0,
                resilience: 0
            }
        }));
    }

    calculateRankings() {
        return {
            overall: [],
            economic: [],
            ecological: [],
            resilience: []
        };
    }

    generateLessonsLearned() {
        return [
            "Diversifikation reduziert Risiken",
            "Langfristige Planung wichtig für Amortisation",
            "Unerwartete Ereignisse können Pläne durcheinander bringen"
        ];
    }

    calculateFinalResults() {
        return {
            winners: [],
            totalInvestments: 0,
            co2Reduction: 0,
            costSavings: 0
        };
    }

    // Callback-System
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    triggerCallback(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }

    // Getter für aktuellen Spielstand
    getGameState() {
        return { ...this.gameState };
    }

    getCurrentPhaseTime() {
        return this.phases[this.gameState.currentPhase];
    }
}

// Event Manager für Zufallsereignisse
class EventManager {
    constructor() {
        this.eventTypes = {
            market_shock: {
                probability: 0.3,
                impact: 'high',
                examples: ['gas_crisis', 'electricity_price_spike', 'technology_breakthrough']
            },
            regulatory: {
                probability: 0.4,
                impact: 'medium',
                examples: ['co2_price_increase', 'subsidy_changes', 'building_standards']
            },
            climate: {
                probability: 0.2,
                impact: 'high',
                examples: ['heat_wave', 'cold_winter', 'storm_damage']
            },
            demographic: {
                probability: 0.2,
                impact: 'medium',
                examples: ['population_growth', 'aging_society', 'energy_poverty']
            },
            technical: {
                probability: 0.1,
                impact: 'low',
                examples: ['equipment_failure', 'cyber_attack', 'grid_outage']
            }
        };
    }

    generateEvents(year) {
        const events = [];
        
        Object.entries(this.eventTypes).forEach(([type, config]) => {
            if (Math.random() < config.probability) {
                const example = config.examples[Math.floor(Math.random() * config.examples.length)];
                events.push({
                    type,
                    event: example,
                    impact: config.impact,
                    year,
                    description: this.getEventDescription(example),
                    effects: this.getEventEffects(example)
                });
            }
        });

        return events;
    }

    getEventDescription(event) {
        const descriptions = {
            gas_crisis: "Geopolitische Spannungen führen zu 200% Anstieg der Gaspreise",
            electricity_price_spike: "Strompreis steigt aufgrund niedriger EE-Erzeugung um 150%",
            technology_breakthrough: "Neue Wärmepumpen-Technologie reduziert Kosten um 30%",
            co2_price_increase: "CO₂-Preis steigt von 25€ auf 50€ pro Tonne",
            heat_wave: "Außergewöhnliche Hitzewelle verdreifacht Kühlbedarf",
            population_growth: "Zuzug erhöht Einwohnerzahl um 20%"
        };
        
        return descriptions[event] || "Unbekanntes Ereignis";
    }

    getEventEffects(event) {
        const effects = {
            gas_crisis: { gas_price_multiplier: 3.0, duration: 2 },
            electricity_price_spike: { electricity_price_multiplier: 2.5, duration: 1 },
            technology_breakthrough: { heat_pump_cost_multiplier: 0.7, duration: 10 },
            co2_price_increase: { co2_price: 50, duration: 10 },
            heat_wave: { cooling_demand_multiplier: 3.0, duration: 1 },
            population_growth: { demand_multiplier: 1.2, duration: 10 }
        };
        
        return effects[event] || {};
    }
}

// Investment Engine für Technologie-Modelle
class InvestmentEngine {
    constructor() {
        this.technologies = {
            building_renovation: {
                name: 'Energetische Sanierung',
                categories: ['insulation', 'windows', 'heating_system'],
                cost_per_m2: { min: 50, max: 200 },
                savings_percent: { min: 20, max: 40 },
                lifetime: 15
            },
            solar_pv: {
                name: 'Solar-PV',
                cost_per_kwp: { min: 1000, max: 1500 },
                generation_kwh_per_kwp: { min: 800, max: 1200 },
                lifetime: 25
            },
            heat_pump: {
                name: 'Wärmepumpen',
                types: ['air_water', 'ground_water'],
                cost: { air_water: 15000, ground_water: 25000 },
                cop: { air_water: 3.5, ground_water: 4.5 },
                lifetime: 20
            },
            battery_storage: {
                name: 'Batteriespeicher',
                cost_per_kwh: { min: 800, max: 1200 },
                efficiency: 0.9,
                lifetime: 15
            },
            district_heating: {
                name: 'Fernwärme',
                cost_per_connection: 5000,
                efficiency: 0.85,
                lifetime: 30
            }
        };
    }

    getAvailableInvestments(year) {
        // Technologie-Verfügbarkeit kann sich über Zeit ändern
        const available = [];
        
        Object.entries(this.technologies).forEach(([key, tech]) => {
            available.push({
                id: key,
                name: tech.name,
                description: this.getTechnologyDescription(key),
                cost: this.calculateCost(tech, year),
                benefits: this.calculateBenefits(tech),
                risks: this.getTechnologyRisks(key),
                readiness: this.getTechnologyReadiness(key, year)
            });
        });

        return available;
    }

    calculateCost(tech, year) {
        // Technologie-Kostenkurven über Zeit
        if (tech.cost_per_kwp) {
            return Math.round(tech.cost_per_kwp.min + (tech.cost_per_kwp.max - tech.cost_per_kwp.min) * Math.random());
        }
        if (tech.cost) {
            return tech.cost;
        }
        return 10000; // Default
    }

    calculateBenefits(tech) {
        return {
            co2_reduction: Math.random() * 50, // kg CO2/Jahr
            cost_savings: Math.random() * 1000, // €/Jahr
            resilience_improvement: Math.random() * 10 // Score
        };
    }

    getTechnologyDescription(key) {
        const descriptions = {
            building_renovation: "Reduziert Energiebedarf durch bessere Isolierung",
            solar_pv: "Erzeugt erneuerbaren Strom vor Ort",
            heat_pump: "Effiziente Wärmeerzeugung aus Umweltwärme",
            battery_storage: "Speichert überschüssigen Strom für späteren Verbrauch",
            district_heating: "Zentrale Wärmeversorgung für mehrere Gebäude"
        };
        
        return descriptions[key] || "Energietechnologie";
    }

    getTechnologyRisks(key) {
        const risks = {
            building_renovation: "Lange Amortisationszeit, Mieterbelastung",
            solar_pv: "Wetterabhängigkeit, Flächenbedarf",
            heat_pump: "Effizienz bei niedrigen Temperaturen",
            battery_storage: "Hohe Kosten, begrenzte Lebensdauer",
            district_heating: "Hohe Anfangsinvestition, Lock-in Effekt"
        };
        
        return risks[key] || "Technisches Risiko";
    }

    getTechnologyReadiness(key, year) {
        // Technology Readiness Level basierend auf Jahr
        const baseReadiness = {
            building_renovation: 9, // Sehr ausgereift
            solar_pv: 8,
            heat_pump: 7,
            battery_storage: 6,
            district_heating: 8
        };
        
        return Math.min(9, baseReadiness[key] + (year - 2024) * 0.1);
    }
}

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameEngine, EventManager, InvestmentEngine };
}
