// UI module for Key Club Hub Web App

const UI = {
    // Toast notification system
    showToast: function(message, type = 'info', duration = 5000) {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px 20px;
            color: #1e293b;
            font-size: 0.9rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            animation: toastSlideIn 0.3s ease-out;
            max-width: 400px;
            word-wrap: break-word;
        `;

        // Add border color based on type
        const borderColors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        const bgColors = {
            success: '#f0fdf4',
            error: '#fef2f2',
            warning: '#fffbeb',
            info: '#eff6ff'
        };

        toast.style.borderLeftColor = borderColors[type] || borderColors.info;
        toast.style.backgroundColor = bgColors[type] || bgColors.info;

        // Add icon based on type
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.1rem;">${icons[type] || icons.info}</span>
                <span>${message}</span>
            </div>
        `;

        // Add to container
        toastContainer.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'toastSlideOut 0.3s ease-out';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, duration);

        // Add click to dismiss
        toast.addEventListener('click', () => {
            if (toast.parentNode) {
                toast.style.animation = 'toastSlideOut 0.3s ease-out';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        });

        // Add hover effect
        toast.addEventListener('mouseenter', () => {
            toast.style.transform = 'translateX(-5px)';
            toast.style.transition = 'transform 0.2s ease';
        });

        toast.addEventListener('mouseleave', () => {
            toast.style.transform = 'translateX(0)';
        });
    },

    // Show loading spinner
    showLoading: function(message = 'Loading...') {
        const loading = document.createElement('div');
        loading.id = 'loading-overlay';
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
        `;

        loading.innerHTML = `
            <div style="
                background: #ffffff;
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e2e8f0;
                    border-top: 4px solid #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px;
                "></div>
                <p style="color: #64748b; margin: 0;">${message}</p>
            </div>
        `;

        document.body.appendChild(loading);
    },

    // Hide loading spinner
    hideLoading: function() {
        const loading = document.getElementById('loading-overlay');
        if (loading) {
            loading.remove();
        }
    },

    // Show confirmation dialog
    showConfirm: function(message, onConfirm, onCancel) {
        const dialog = document.createElement('div');
        dialog.id = 'confirm-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
        `;

        dialog.innerHTML = `
            <div style="
                background: #ffffff;
                border-radius: 12px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            ">
                <h3 style="margin: 0 0 15px 0; color: #1e293b;">Confirm Action</h3>
                <p style="margin: 0 0 25px 0; color: #64748b; line-height: 1.5;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="confirm-yes" style="
                        background: #ef4444;
                        color: #ffffff;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Yes</button>
                    <button id="confirm-no" style="
                        background: #64748b;
                        color: #ffffff;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">No</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Add event listeners
        document.getElementById('confirm-yes').addEventListener('click', () => {
            dialog.remove();
            if (onConfirm) onConfirm();
        });

        document.getElementById('confirm-no').addEventListener('click', () => {
            dialog.remove();
            if (onCancel) onCancel();
        });

        // Close on backdrop click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
                if (onCancel) onCancel();
            }
        });
    },

    // Show modal
    showModal: function(title, content, onClose) {
        const modal = document.createElement('div');
        modal.id = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
        `;

        modal.innerHTML = `
            <div style="
                background: #ffffff;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            ">
                <div style="
                    padding: 20px 30px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                ">
                    <h3 style="margin: 0; color: #1e293b;">${title}</h3>
                    <button id="modal-close" style="
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: #64748b;
                        padding: 5px;
                    ">&times;</button>
                </div>
                <div style="padding: 30px;">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('modal-close').addEventListener('click', () => {
            modal.remove();
            if (onClose) onClose();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                if (onClose) onClose();
            }
        });
    }
};

// Add CSS animations for toasts
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes toastSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style); 