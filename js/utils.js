// ====================================
// ARA Cafe - توابع کمکی
// ====================================

/**
 * فرمت کردن عدد به واحد پولی ریال
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
}

/**
 * فرمت کردن تاریخ شمسی
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

/**
 * ذخیره در LocalStorage با هندل خطا
 */
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('LocalStorage save error:', error);
        return false;
    }
}

/**
 * خواندن از LocalStorage
 */
function loadFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('LocalStorage load error:', error);
        return null;
    }
}

/**
 * لود کردن فایل JSON
 */
async function loadJSON(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading JSON:', error);
        return null;
    }
}

/**
 * ذخیره فایل JSON (برای GitHub API)
 */
async function saveJSON(path, data) {
    // در حالت واقعی از GitHub API استفاده می‌شود
    // اینجا برای Offline mode ذخیره می‌کنیم
    saveToLocalStorage(path, data);
    
    // اگر آنلاین بودیم، از GitHub API استفاده می‌کنیم
    if (navigator.onLine) {
        try {
            // GitHub API endpoint
            const apiUrl = `https://api.github.com/repos/YOUR-USERNAME/ara-cafe-pos/contents/${path}`;
            
            // این بخش نیاز به Token دارد و در Production پیاده‌سازی می‌شود
            console.log('Online mode: Using GitHub API');
        } catch (error) {
            console.log('Falling back to LocalStorage');
        }
    }
}

/**
 * تشخیص آنلاین بودن
 */
function isOnline() {
    return navigator.onLine;
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * تولید شناسه یکتا
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * کلیپبورد
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Copy failed:', error);
        return false;
    }
}

/**
 * تغییر تم
 */
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.classList.contains('light-mode') ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    body.classList.toggle('light-mode');
    
    // ذخیره تنظیمات
    saveToLocalStorage('theme', newTheme);
}

/**
 * لود تم ذخیره شده
 */
function loadTheme() {
    const savedTheme = loadFromLocalStorage('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
}

// اکسپورت توابع برای استفاده در ماژول‌های دیگر
window.ARAUtils = {
    formatCurrency,
    formatDate,
    saveToLocalStorage,
    loadFromLocalStorage,
    loadJSON,
    saveJSON,
    isOnline,
    debounce,
    generateUUID,
    copyToClipboard,
    toggleTheme,
    loadTheme
};