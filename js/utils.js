// Utility functions for Key Club Hub Web App

const Utils = {
    // Storage Utilities
    storage: {
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Error saving to localStorage:', error);
                return false;
            }
        },

        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error reading from localStorage:', error);
                return defaultValue;
            }
        },

        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Error removing from localStorage:', error);
                return false;
            }
        },

        clear: () => {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Error clearing localStorage:', error);
                return false;
            }
        }
    },

    // Validation Utilities
    validation: {
        isValidSNumber: (sNumber) => {
            return CONFIG.VALIDATION.S_NUMBER_PATTERN.test(sNumber);
        },

        isValidEmail: (email) => {
            return CONFIG.VALIDATION.EMAIL_PATTERN.test(email);
        },

        isValidPassword: (password) => {
            return password && password.length >= CONFIG.VALIDATION.PASSWORD_MIN_LENGTH;
        },

        isValidName: (name) => {
            return name && name.trim().length >= CONFIG.VALIDATION.NAME_MIN_LENGTH;
        },

        isValidPhone: (phone) => {
            return CONFIG.VALIDATION.PHONE_PATTERN.test(phone);
        },

        isValidFile: (file) => {
            if (!file) return false;
            
            const isValidType = CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type);
            const isValidSize = file.size <= CONFIG.MAX_FILE_SIZE;
            
            return isValidType && isValidSize;
        },

        validateForm: (formData, rules) => {
            const errors = {};
            
            Object.keys(rules).forEach(field => {
                const value = formData[field];
                const fieldRules = rules[field];
                
                // Handle required field validation with proper type checking
                if (fieldRules.required) {
                    if (value === null || value === undefined || value === '') {
                        errors[field] = CONFIG.ERROR_MESSAGES.REQUIRED_FIELD;
                        return;
                    }
                    // For string values, check if they're empty after trimming
                    if (typeof value === 'string' && value.trim() === '') {
                        errors[field] = CONFIG.ERROR_MESSAGES.REQUIRED_FIELD;
                        return;
                    }
                }
                
                // Only apply string-based validations to string values
                if (typeof value === 'string' && value) {
                    if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
                        errors[field] = fieldRules.message || CONFIG.ERROR_MESSAGES.VALIDATION_ERROR;
                        return;
                    }
                    
                    if (fieldRules.minLength && value.length < fieldRules.minLength) {
                        errors[field] = fieldRules.message || CONFIG.ERROR_MESSAGES.VALIDATION_ERROR;
                        return;
                    }
                }
                
                // Custom validation for any type
                if (value && fieldRules.custom) {
                    const customError = fieldRules.custom(value, formData);
                    if (customError) {
                        errors[field] = customError;
                    }
                }
            });
            
            return {
                isValid: Object.keys(errors).length === 0,
                errors
            };
        }
    },

    // Date Utilities
    date: {
        format: (date, format = CONFIG.DATE_FORMATS.DISPLAY) => {
            if (!date) return '';
            
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            const year = d.getFullYear();
            const month = months[d.getMonth()];
            const day = d.getDate();
            const dayName = days[d.getDay()];
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');
            
            switch (format) {
                case CONFIG.DATE_FORMATS.DISPLAY:
                    return `${month} ${day}, ${year}`;
                case CONFIG.DATE_FORMATS.INPUT:
                    return `${year}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                case CONFIG.DATE_FORMATS.TIME:
                    return `${hours}:${minutes}`;
                case CONFIG.DATE_FORMATS.DATETIME:
                    return `${month} ${day}, ${year} ${hours}:${minutes}`;
                case CONFIG.DATE_FORMATS.RELATIVE:
                    return Utils.date.getRelativeTime(d);
                default:
                    return d.toLocaleDateString();
            }
        },

        getRelativeTime: (date) => {
            const now = new Date();
            const diff = now - date;
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (seconds < 60) return 'Just now';
            if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
            
            return Utils.date.format(date, CONFIG.DATE_FORMATS.DISPLAY);
        },

        isToday: (date) => {
            const today = new Date();
            const d = new Date(date);
            return d.toDateString() === today.toDateString();
        },

        isPast: (date) => {
            return new Date(date) < new Date();
        },

        isFuture: (date) => {
            return new Date(date) > new Date();
        },

        addDays: (date, days) => {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        },

        getWeekDates: (date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day;
            const startOfWeek = new Date(d.setDate(diff));
            const endOfWeek = new Date(d.setDate(diff + 6));
            
            return {
                start: startOfWeek,
                end: endOfWeek
            };
        }
    },

    // String Utilities
    string: {
        capitalize: (str) => {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        },

        truncate: (str, length = 100, suffix = '...') => {
            if (!str || str.length <= length) return str;
            return str.substring(0, length) + suffix;
        },

        slugify: (str) => {
            return str
                .toLowerCase()
                .replace(/[^a-z0-9 -]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim('-');
        },

        generateId: (prefix = '') => {
            const timestamp = Date.now().toString(36);
            const randomStr = Math.random().toString(36).substring(2);
            return `${prefix}${timestamp}${randomStr}`;
        },

        formatPhone: (phone) => {
            if (!phone) return '';
            const cleaned = phone.replace(/\D/g, '');
            const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
            if (match) {
                return `(${match[1]}) ${match[2]}-${match[3]}`;
            }
            return phone;
        }
    },

    // Array Utilities
    array: {
        chunk: (array, size) => {
            const chunks = [];
            for (let i = 0; i < array.length; i += size) {
                chunks.push(array.slice(i, i + size));
            }
            return chunks;
        },

        unique: (array, key = null) => {
            if (key) {
                const seen = new Set();
                return array.filter(item => {
                    const value = item[key];
                    if (seen.has(value)) {
                        return false;
                    }
                    seen.add(value);
                    return true;
                });
            }
            return [...new Set(array)];
        },

        sortBy: (array, key, direction = 'asc') => {
            return [...array].sort((a, b) => {
                let aVal = a[key];
                let bVal = b[key];
                
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }
                
                if (direction === 'desc') {
                    [aVal, bVal] = [bVal, aVal];
                }
                
                if (aVal < bVal) return -1;
                if (aVal > bVal) return 1;
                return 0;
            });
        },

        groupBy: (array, key) => {
            return array.reduce((groups, item) => {
                const group = item[key];
                if (!groups[group]) {
                    groups[group] = [];
                }
                groups[group].push(item);
                return groups;
            }, {});
        }
    },

    // Object Utilities
    object: {
        pick: (obj, keys) => {
            const result = {};
            keys.forEach(key => {
                if (obj.hasOwnProperty(key)) {
                    result[key] = obj[key];
                }
            });
            return result;
        },

        omit: (obj, keys) => {
            const result = { ...obj };
            keys.forEach(key => {
                delete result[key];
            });
            return result;
        },

        deepClone: (obj) => {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(item => Utils.object.deepClone(item));
            if (typeof obj === 'object') {
                const clonedObj = {};
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        clonedObj[key] = Utils.object.deepClone(obj[key]);
                    }
                }
                return clonedObj;
            }
        },

        isEmpty: (obj) => {
            if (obj == null) return true;
            if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
            return Object.keys(obj).length === 0;
        }
    },

    // DOM Utilities
    dom: {
        showElement: (element) => {
            if (element) {
                element.classList.remove('hidden');
                element.classList.add('active');
            }
        },

        hideElement: (element) => {
            if (element) {
                element.classList.add('hidden');
                element.classList.remove('active');
            }
        },

        toggleElement: (element) => {
            if (element) {
                element.classList.toggle('hidden');
                element.classList.toggle('active');
            }
        },

        scrollToElement: (element, offset = 0) => {
            if (element) {
                const elementPosition = element.offsetTop - offset;
                window.scrollTo({
                    top: elementPosition,
                    behavior: 'smooth'
                });
            }
        },

        getElementBySelector: (selector) => {
            return document.querySelector(selector);
        },

        getElementsBySelector: (selector) => {
            return document.querySelectorAll(selector);
        },

        addEventListeners: (element, events, handler) => {
            if (!element) return;
            
            events.forEach(event => {
                element.addEventListener(event, handler);
            });
        },

        removeEventListeners: (element, events, handler) => {
            if (!element) return;
            
            events.forEach(event => {
                element.removeEventListener(event, handler);
            });
        }
    },

    // File Utilities
    file: {
        readAsDataURL: (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        },

        readAsText: (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(file);
            });
        },

        getFileExtension: (filename) => {
            return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
        },

        formatFileSize: (bytes) => {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        downloadFile: (url, filename) => {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },

    // Network Utilities
    network: {
        isOnline: () => {
            return navigator.onLine;
        },

        addOnlineListener: (callback) => {
            window.addEventListener('online', callback);
        },

        addOfflineListener: (callback) => {
            window.addEventListener('offline', callback);
        },

        removeOnlineListener: (callback) => {
            window.removeEventListener('online', callback);
        },

        removeOfflineListener: (callback) => {
            window.removeEventListener('offline', callback);
        }
    },

    // Color Utilities
    color: {
        hexToRgb: (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },

        rgbToHex: (r, g, b) => {
            return '#' + [r, g, b].map(x => {
                const hex = x.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        },

        getContrastColor: (hexColor) => {
            const rgb = Utils.color.hexToRgb(hexColor);
            if (!rgb) return '#000000';
            
            const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
            return brightness > 128 ? '#000000' : '#ffffff';
        },

        lighten: (hex, percent) => {
            const rgb = Utils.color.hexToRgb(hex);
            if (!rgb) return hex;
            
            const factor = 1 + percent / 100;
            const r = Math.min(255, Math.round(rgb.r * factor));
            const g = Math.min(255, Math.round(rgb.g * factor));
            const b = Math.min(255, Math.round(rgb.b * factor));
            
            return Utils.color.rgbToHex(r, g, b);
        },

        darken: (hex, percent) => {
            const rgb = Utils.color.hexToRgb(hex);
            if (!rgb) return hex;
            
            const factor = 1 - percent / 100;
            const r = Math.max(0, Math.round(rgb.r * factor));
            const g = Math.max(0, Math.round(rgb.g * factor));
            const b = Math.max(0, Math.round(rgb.b * factor));
            
            return Utils.color.rgbToHex(r, g, b);
        }
    },

    // Debounce and Throttle
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
} 