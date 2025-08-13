/**
 * Modal Component Handler
 * Zentrale Verwaltung für alle Modals
 */

class ModalManager {
    constructor() {
        this.modals = new Map();
        this.activeModal = null;
    }
    
    /**
     * Erstellt und registriert ein neues Modal
     */
    createModal(id, title, content, options = {}) {
        const modalHtml = `
            <div class="modal fade" id="${id}" tabindex="-1" aria-labelledby="${id}Label" aria-hidden="true">
                <div class="modal-dialog ${options.size || 'modal-lg'} ${options.scrollable ? 'modal-dialog-scrollable' : ''}">
                    <div class="modal-content">
                        <div class="modal-header ${options.headerClass || 'bg-primary text-white'}">
                            <h5 class="modal-title" id="${id}Label">
                                ${options.icon ? `<i class="${options.icon}"></i> ` : ''}${title}
                            </h5>
                            <button type="button" class="btn-close ${options.headerClass ? 'btn-close-white' : ''}" 
                                    data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        this.removeModal(id);
        
        // Add to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Register modal
        const modalElement = document.getElementById(id);
        const modal = new bootstrap.Modal(modalElement);
        this.modals.set(id, modal);
        
        return modal;
    }
    
    /**
     * Zeigt ein Modal an
     */
    showModal(id) {
        const modal = this.modals.get(id);
        if (modal) {
            this.activeModal = id;
            modal.show();
        }
    }
    
    /**
     * Versteckt ein Modal
     */
    hideModal(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.hide();
            this.activeModal = null;
        }
    }
    
    /**
     * Entfernt ein Modal aus DOM und Registry
     */
    removeModal(id) {
        const existingModal = document.getElementById(id);
        if (existingModal) {
            existingModal.remove();
        }
        this.modals.delete(id);
    }
    
    /**
     * Update Modal Content
     */
    updateModalContent(id, content) {
        const modalElement = document.getElementById(id);
        if (modalElement) {
            const bodyElement = modalElement.querySelector('.modal-body');
            if (bodyElement) {
                bodyElement.innerHTML = content;
            }
        }
    }
    
    /**
     * Update Modal Title
     */
    updateModalTitle(id, title, icon = null) {
        const modalElement = document.getElementById(id);
        if (modalElement) {
            const titleElement = modalElement.querySelector('.modal-title');
            if (titleElement) {
                titleElement.innerHTML = `${icon ? `<i class="${icon}"></i> ` : ''}${title}`;
            }
        }
    }
}

// Global instance
window.modalManager = new ModalManager();
