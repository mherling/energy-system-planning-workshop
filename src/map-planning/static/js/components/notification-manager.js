/**
 * Notification System
 * Toast und Alert Management
 */

class NotificationManager {
    constructor() {
        this.toastContainer = this.createToastContainer();
    }
    
    createToastContainer() {
        // Check if toast container already exists
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        return container;
    }
    
    /**
     * Zeigt eine Toast-Nachricht an
     */
    showToast(message, type = 'info', duration = 5000) {
        const toastId = `toast-${Date.now()}`;
        const iconMap = {
            success: 'bi-check-circle-fill',
            error: 'bi-exclamation-triangle-fill',
            warning: 'bi-exclamation-circle-fill',
            info: 'bi-info-circle-fill'
        };
        
        const colorMap = {
            success: 'text-bg-success',
            error: 'text-bg-danger',
            warning: 'text-bg-warning',
            info: 'text-bg-primary'
        };
        
        const toastHtml = `
            <div id="${toastId}" class="toast ${colorMap[type] || colorMap.info}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="bi ${iconMap[type] || iconMap.info} me-2"></i>
                    <strong class="me-auto">
                        ${this.getTypeLabel(type)}
                    </strong>
                    <small>${new Date().toLocaleTimeString()}</small>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        this.toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,  // Explizit auf true setzen
            delay: duration  // Delay in Millisekunden
        });
        
        toast.show();
        
        // Zusätzlicher Fallback: Auto-remove nach der angegebenen Zeit + 500ms Puffer
        setTimeout(() => {
            if (toastElement && document.contains(toastElement)) {
                toast.hide();
            }
        }, duration + 500);
        
        // Remove from DOM after hiding
        toastElement.addEventListener('hidden.bs.toast', () => {
            if (toastElement && document.contains(toastElement)) {
                toastElement.remove();
            }
        });
        
        return toast;
    }
    
    /**
     * Zeigt eine Erfolgs-Toast an
     */
    showSuccess(message, duration = 3000) {  // 3 Sekunden statt 5
        return this.showToast(message, 'success', duration);
    }
    
    /**
     * Zeigt eine Fehler-Toast an
     */
    showError(message, duration = 8000) {
        return this.showToast(message, 'error', duration);
    }
    
    /**
     * Zeigt eine Warnung-Toast an
     */
    showWarning(message, duration = 6000) {
        return this.showToast(message, 'warning', duration);
    }
    
    /**
     * Zeigt eine Info-Toast an
     */
    showInfo(message, duration = 5000) {
        return this.showToast(message, 'info', duration);
    }
    
    /**
     * Erstellt ein Alert Modal
     */
    showAlert(title, message, type = 'info', buttons = null) {
        const alertId = `alert-${Date.now()}`;
        const iconMap = {
            success: 'bi-check-circle text-success',
            error: 'bi-exclamation-triangle text-danger',
            warning: 'bi-exclamation-circle text-warning',
            info: 'bi-info-circle text-primary'
        };
        
        const defaultButtons = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Schließen</button>
        `;
        
        const alertHtml = `
            <div class="modal fade" id="${alertId}" tabindex="-1" aria-labelledby="${alertId}Label" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="${alertId}Label">
                                <i class="bi ${iconMap[type] || iconMap.info} me-2"></i>
                                ${title}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            ${message}
                        </div>
                        <div class="modal-footer">
                            ${buttons || defaultButtons}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', alertHtml);
        
        const alertElement = document.getElementById(alertId);
        const modal = new bootstrap.Modal(alertElement);
        
        // Remove from DOM after hiding
        alertElement.addEventListener('hidden.bs.modal', () => {
            alertElement.remove();
        });
        
        modal.show();
        return modal;
    }
    
    getTypeLabel(type) {
        const labels = {
            success: 'Erfolg',
            error: 'Fehler',
            warning: 'Warnung',
            info: 'Information'
        };
        return labels[type] || labels.info;
    }
}

// Global instance
window.notificationManager = new NotificationManager();

// Legacy support for existing showToast function
window.showToast = (message, type, duration) => {
    return window.notificationManager.showToast(message, type, duration);
};
