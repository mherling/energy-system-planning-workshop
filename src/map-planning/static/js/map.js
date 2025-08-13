// Map Management Module
// Handles map initialization, district visualization, and selection

let map;
let districtLayers = {};

// Initialize map
function initializeMap() {
    // Zittau coordinates
    const zittauCenter = [50.8994, 14.8076];
    
    map = L.map('map').setView(zittauCenter, 14);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Handle window resize to ensure map displays correctly
    window.addEventListener('resize', function() {
        setTimeout(function() {
            map.invalidateSize();
        }, 100);
    });
    
    // Ensure map size is correct after initial load
    setTimeout(function() {
        map.invalidateSize();
    }, 500);
}

// Create quartier polygons on map with individual colors
async function createQuartiersOnMap(districts) {
    try {
        // Load system config to get colors
        const colorResponse = await fetch('/api/system-config');
        const systemConfig = await colorResponse.json();
        const quartierColors = systemConfig.quartier_colors || {};
        
        districts.forEach((district) => {
            // Get specific color for this quartier
            const color = quartierColors[district.id] || '#3388ff';
            
            // Create polygon from GeoJSON geometry
            const coordinates = district.geometry.coordinates[0][0]; // Get first polygon ring
            const latLngs = coordinates.map(coord => [coord[1], coord[0]]); // Convert [lon, lat] to [lat, lon]
            
            const polygon = L.polygon(latLngs, {
                color: color,
                weight: 2,
                fillColor: color,
                fillOpacity: 0.3
            }).addTo(map);
            
            // Parse energy data
            const energyDemand = typeof district.energy_demand === 'string' 
                ? JSON.parse(district.energy_demand) 
                : district.energy_demand || {};
            const renewablePotential = typeof district.renewable_potential === 'string' 
                ? JSON.parse(district.renewable_potential) 
                : district.renewable_potential || {};
            
            polygon.bindPopup(`
                <div style="border-left: 4px solid ${color}; padding-left: 10px;">
                    <strong>${district.name}</strong><br>
                    <small class="text-muted">${district.district_type.toUpperCase()}</small><br><br>
                    
                    <strong>Bevölkerung:</strong> ${district.population.toLocaleString()}<br>
                    <strong>Fläche:</strong> ${district.area_km2} km²<br><br>
                    
                    <strong>Energiebedarf:</strong><br>
                    • Strom: ${(energyDemand.electricity_mwh || 0).toLocaleString()} MWh/Jahr<br>
                    • Wärme: ${(energyDemand.heating_mwh || 0).toLocaleString()} MWh/Jahr<br>
                    • Gesamt: ${(energyDemand.total_annual_mwh || 0).toLocaleString()} MWh/Jahr<br><br>
                    
                    <strong>EE-Potenzial:</strong><br>
                    • Solar PV: ${(renewablePotential.solar_pv_mwh || 0).toLocaleString()} MWh/Jahr<br>
                    • Gesamt: ${(renewablePotential.total_potential_mwh || 0).toLocaleString()} MWh/Jahr
                </div>
            `);
            
            polygon.on('click', () => selectDistrict(district));
            
            districtLayers[district.id] = polygon;
        });
        
        // Update legend with new color scheme
        updateLegend(quartierColors, districts);
        
    } catch (error) {
        console.error('Error creating quartiers:', error);
    }
}

// Update legend with quartier colors
function updateLegend(quartierColors, districts) {
    const legend = document.querySelector('.grid-legend');
    let legendHtml = '<h6 class="mb-2">Quartiere Zittau</h6>';
    
    // Add each quartier with its color
    districts.forEach(district => {
        const color = quartierColors[district.id] || '#3388ff';
        legendHtml += `<div><span style="color: ${color}; font-size: 16px;">●</span> ${district.name}</div>`;
    });
    
    legend.innerHTML = legendHtml;
}

// Highlight selected district on map
function highlightSelectedDistrict(districtId) {
    // Reset all layers
    Object.values(districtLayers).forEach(layer => {
        layer.setStyle({ weight: 2 });
    });
    
    // Highlight selected district
    if (districtLayers[districtId]) {
        districtLayers[districtId].setStyle({ weight: 4 });
    }
}
