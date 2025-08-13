/**
 * API Utility Functions
 * Zentrale API-Aufrufe mit Fehlerbehandlung
 */

class ApiClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }
    
    /**
     * Generic API request handler
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error(`API Request failed for ${endpoint}:`, error);
            throw error;
        }
    }
    
    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        return this.request(url.pathname + url.search, { method: 'GET' });
    }
    
    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
    
    // District API methods
    async getDistricts() {
        return this.get('/api/districts');
    }
    
    async getDistrict(districtId) {
        return this.get(`/api/districts/${districtId}`);
    }
    
    async getDistrictEnergyBalance(districtId) {
        return this.get(`/api/districts/${districtId}/energy-balance`);
    }
    
    async getDistrictEnergyFlows(districtId) {
        return this.get(`/api/districts/${districtId}/energy-flows`);
    }
    
    async updateDistrict(districtId, data) {
        return this.put(`/api/districts/${districtId}`, data);
    }
    
    // Analysis API methods
    async getEnergyBalance() {
        return this.get('/api/analysis/energy-balance');
    }
    
    async getCO2Emissions() {
        return this.get('/api/analysis/co2-emissions');
    }
    
    async getRenewablePotential() {
        return this.get('/api/analysis/renewable-potential');
    }
    
    async getDetailedAnalysis() {
        return this.get('/api/analysis/detailed-analysis');
    }
    
    // Stakeholder API methods
    async getStakeholders() {
        return this.get('/api/stakeholders');
    }
    
    async createStakeholder(data) {
        return this.post('/api/stakeholders', data);
    }
    
    async updateStakeholder(stakeholderId, data) {
        return this.put(`/api/stakeholders/${stakeholderId}`, data);
    }
    
    async deleteStakeholder(stakeholderId) {
        return this.delete(`/api/stakeholders/${stakeholderId}`);
    }
    
    // Energy Scenarios API methods
    async getEnergyScenarios() {
        return this.get('/api/energy-scenarios');
    }
}

// Global API client instance
window.apiClient = new ApiClient();
