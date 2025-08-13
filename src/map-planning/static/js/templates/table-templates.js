/**
 * Table Templates Module
 * Handles table generation for energy data
 */

// Create primary energy table
function createPrimaryEnergyTable(primaryData, type) {
    console.log('Creating primary energy table for type:', type, 'with data:', primaryData);
    
    if (!primaryData || Object.keys(primaryData).length === 0) {
        return '<p class="text-muted">Keine Daten verfügbar</p>';
    }
    
    // Calculate total based on percentages
    const totalPercentage = Object.values(primaryData).reduce((sum, value) => sum + (value || 0), 0);
    if (totalPercentage === 0) return '<p class="text-muted">Keine Daten verfügbar</p>';
    
    let html = '<div class="table-responsive"><table class="table table-sm">';
    
    Object.entries(primaryData).forEach(([key, percentage]) => {
        if (percentage > 0) {
            const name = key.replace('_pct', '').replace('_', ' ');
            const displayName = getEnergySourceDisplayName(name);
            const color = getEnergySourceColor(name);
            
            html += `
                <tr>
                    <td>
                        <span class="badge" style="background-color: ${color};">&nbsp;</span>
                        ${displayName}
                    </td>
                    <td class="text-end">${percentage.toFixed(1)}%</td>
                    <td style="width: 100px;">
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar" style="width: ${percentage}%; background-color: ${color};" role="progressbar"></div>
                        </div>
                    </td>
                </tr>
            `;
        }
    });
    
    html += '</table></div>';
    return html;
}

// Create renewable energy comparison table
function createRenewableTable(potential, current) {
    console.log('Creating renewable table with potential:', potential, 'and current:', current);
    
    const renewableTypes = [
        { key: 'solar_pv', name: 'Solar PV', color: '#ffc107' },
        { key: 'solar_thermal', name: 'Solar Thermal', color: '#fd7e14' },
        { key: 'small_wind', name: 'Kleinwind', color: '#20c997' },
        { key: 'biomass', name: 'Biomasse', color: '#198754' },
        { key: 'geothermal', name: 'Geothermie', color: '#6f42c1' }
    ];
    
    let html = '<div class="table-responsive"><table class="table table-sm">';
    html += `
        <thead>
            <tr>
                <th>Technologie</th>
                <th class="text-end">Potential</th>
                <th class="text-end">Genutzt</th>
                <th class="text-end">Auslastung</th>
                <th style="width: 150px;">Fortschritt</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    renewableTypes.forEach(type => {
        const potentialValue = potential[`${type.key}_mwh`] || 0;
        const currentValue = current[`${type.key}_mwh`] || 0;
        const utilization = potentialValue > 0 ? Math.round((currentValue / potentialValue) * 100) : 0;
        
        if (potentialValue > 0 || currentValue > 0) {
            html += `
                <tr>
                    <td>
                        <span class="badge" style="background-color: ${type.color};">&nbsp;</span>
                        ${type.name}
                    </td>
                    <td class="text-end">${potentialValue.toFixed(1)} MWh</td>
                    <td class="text-end">${currentValue.toFixed(1)} MWh</td>
                    <td class="text-end">${utilization}%</td>
                    <td>
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar" style="width: ${Math.min(utilization, 100)}%; background-color: ${type.color};" role="progressbar">
                                ${utilization > 10 ? utilization + '%' : ''}
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }
    });
    
    html += '</tbody></table></div>';
    return html;
}

// Export to global scope
window.createPrimaryEnergyTable = createPrimaryEnergyTable;
window.createRenewableTable = createRenewableTable;
