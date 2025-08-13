/**
 * Frontend Configuration
 * Zentrale Konfiguration für die Anwendung
 */

window.AppConfig = {
    // API Configuration
    api: {
        baseUrl: '',
        timeout: 30000,
        retryAttempts: 3
    },
    
    // Map Configuration
    map: {
        defaultCenter: [51.0379, 14.8080], // Zittau coordinates
        defaultZoom: 13,
        minZoom: 10,
        maxZoom: 18,
        tileLayer: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '© OpenStreetMap contributors'
        }
    },
    
    // UI Configuration
    ui: {
        // Toast notification durations (ms)
        notifications: {
            success: 5000,
            info: 5000,
            warning: 6000,
            error: 8000
        },
        
        // Animation durations (ms)
        animations: {
            fadeIn: 300,
            fadeOut: 200,
            slideIn: 400,
            mapTransition: 500
        },
        
        // Color schemes
        colors: {
            primary: '#0d6efd',
            success: '#198754',
            warning: '#ffc107',
            danger: '#dc3545',
            info: '#0dcaf0',
            
            // District colors
            residential: '#4CAF50',
            commercial: '#2196F3',
            industrial: '#FF9800',
            mixed: '#9C27B0',
            
            // Energy source colors
            solar: '#FFD700',
            wind: '#87CEEB',
            biomass: '#8FBC8F',
            geothermal: '#CD853F',
            electricity: '#4169E1',
            gas: '#FF6347',
            heating: '#DC143C'
        }
    },
    
    // Feature flags
    features: {
        enableAdvancedAnalysis: true,
        enableExport: true,
        enableStakeholderManagement: true,
        enableScenarioComparison: true,
        enableRealtimeUpdates: false
    },
    
    // Data configuration
    data: {
        // Refresh intervals (ms)
        refreshIntervals: {
            districts: 60000,     // 1 minute
            stakeholders: 300000, // 5 minutes
            scenarios: 300000     // 5 minutes
        },
        
        // Default units
        units: {
            energy: 'MWh',
            power: 'MW',
            area: 'km²',
            currency: 'EUR',
            emissions: 'tCO2'
        },
        
        // Number formatting
        formatting: {
            decimals: {
                energy: 1,
                percentage: 1,
                currency: 2,
                emissions: 2
            }
        }
    },
    
    // Validation rules
    validation: {
        district: {
            minPopulation: 0,
            maxPopulation: 100000,
            minArea: 0.01,
            maxArea: 50
        },
        energy: {
            minDemand: 0,
            maxDemand: 10000,
            minPotential: 0,
            maxPotential: 10000
        }
    },
    
    // Development settings
    development: {
        debug: false,
        mockData: false,
        logLevel: 'info' // debug, info, warn, error
    }
};

// Environment detection
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.AppConfig.development.debug = true;
    window.AppConfig.development.logLevel = 'debug';
}

// Logging utility
window.Logger = {
    debug: (...args) => {
        if (window.AppConfig.development.logLevel === 'debug') {
            console.debug('[DEBUG]', ...args);
        }
    },
    info: (...args) => {
        if (['debug', 'info'].includes(window.AppConfig.development.logLevel)) {
            console.info('[INFO]', ...args);
        }
    },
    warn: (...args) => {
        if (['debug', 'info', 'warn'].includes(window.AppConfig.development.logLevel)) {
            console.warn('[WARN]', ...args);
        }
    },
    error: (...args) => {
        console.error('[ERROR]', ...args);
    }
};
