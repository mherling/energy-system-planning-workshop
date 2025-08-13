/**
 * Utility Functions für Datenformatierung und -verarbeitung
 */

/**
 * Formatiert Zahlen mit deutschen Konventionen
 */
function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined || isNaN(value)) {
        return '0';
    }
    
    return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

/**
 * Formatiert Energie-Werte mit Einheit
 */
function formatEnergy(value, unit = 'MWh', decimals = 1) {
    return `${formatNumber(value, decimals)} ${unit}`;
}

/**
 * Formatiert Prozent-Werte
 */
function formatPercentage(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) {
        return '0%';
    }
    return `${formatNumber(value, decimals)}%`;
}

/**
 * Formatiert Währungswerte
 */
function formatCurrency(value, currency = 'EUR', decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) {
        return '0,00 €';
    }
    
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

/**
 * Formatiert Datum und Zeit
 */
function formatDateTime(date, options = {}) {
    if (!date) return '';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const formatOptions = { ...defaultOptions, ...options };
    
    return new Intl.DateTimeFormat('de-DE', formatOptions).format(new Date(date));
}

/**
 * Konvertiert String zu Title Case
 */
function toTitle(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

/**
 * Gibt eine Farbe basierend auf einem Wert zurück
 */
function getColorForValue(value, min = 0, max = 100, colorMap = null) {
    if (colorMap) {
        // Verwende benutzerdefinierte Farbkarte
        const keys = Object.keys(colorMap).map(k => parseFloat(k)).sort((a, b) => a - b);
        for (let i = 0; i < keys.length; i++) {
            if (value <= keys[i]) {
                return colorMap[keys[i]];
            }
        }
        return colorMap[keys[keys.length - 1]];
    }
    
    // Standard Farbverlauf von rot zu gelb zu grün
    const normalized = Math.min(Math.max((value - min) / (max - min), 0), 1);
    
    if (normalized < 0.5) {
        // Rot zu Gelb
        const red = 255;
        const green = Math.round(255 * (normalized * 2));
        return `rgb(${red}, ${green}, 0)`;
    } else {
        // Gelb zu Grün
        const red = Math.round(255 * (2 - normalized * 2));
        const green = 255;
        return `rgb(${red}, ${green}, 0)`;
    }
}

/**
 * Interpoliert zwischen zwei Farben
 */
function interpolateColor(color1, color2, factor) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    
    if (!c1 || !c2) return color1;
    
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    
    return rgbToHex(r, g, b);
}

/**
 * Konvertiert Hex zu RGB
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Konvertiert RGB zu Hex
 */
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Debounce Funktion
 */
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * Throttle Funktion
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Deep Clone Funktion
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * Berechnet Statistiken für ein Array von Zahlen
 */
function calculateStats(values) {
    if (!Array.isArray(values) || values.length === 0) {
        return { min: 0, max: 0, mean: 0, median: 0, sum: 0, count: 0 };
    }
    
    const sorted = values.filter(v => !isNaN(v)).sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const count = sorted.length;
    
    return {
        min: sorted[0] || 0,
        max: sorted[sorted.length - 1] || 0,
        mean: count > 0 ? sum / count : 0,
        median: count > 0 ? sorted[Math.floor(count / 2)] : 0,
        sum: sum,
        count: count
    };
}

// Export functions to global scope
window.formatUtils = {
    formatNumber,
    formatEnergy,
    formatPercentage,
    formatCurrency,
    formatDateTime,
    toTitle,
    getColorForValue,
    interpolateColor,
    hexToRgb,
    rgbToHex,
    debounce,
    throttle,
    deepClone,
    calculateStats
};
