/**
 * MP3 - Internationalization Module
 * Language switching: HT (Haitian Creole), FR, EN, ES
 */

const I18n = {
  currentLang: 'ht',
  translations: {},
  supportedLangs: ['ht', 'fr', 'en', 'es'],

  /**
   * Initialize i18n
   */
  async init() {
    // Detect language from localStorage or URL only
    // Browser language is ignored - site always defaults to Haitian Creole
    const savedLang = localStorage.getItem('mp3-language');
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    const userSetLang = localStorage.getItem('mp3-user-set-language');
    
    let lang;
    
    // If user explicitly set a language before, use it
    if (userSetLang && this.supportedLangs.includes(savedLang)) {
      lang = savedLang;
    } else if (urlLang && this.supportedLangs.includes(urlLang)) {
      // URL parameter takes precedence
      lang = urlLang;
    } else {
      // Always default to Haitian Creole
      lang = 'ht';
    }
    
    await this.setLanguage(lang, false);
    
    // Setup language switcher listeners
    this.setupLanguageSwitchers();
  },

  /**
   * Load translations for a language
   */
  getBasePath() {
    const script = document.querySelector('script[src*="i18n.js"]');
    if (script) {
      const src = script.getAttribute('src');
      return src.startsWith('../') ? '../' : '';
    }
    return '';
  },

  async loadTranslations(lang) {
    try {
      const base = this.getBasePath();
      const response = await fetch(`${base}locales/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load ${lang} translations`);
      this.translations = await response.json();
      return true;
    } catch (error) {
      console.error('Error loading translations:', error);
      return false;
    }
  },

  /**
   * Set current language
   */
  async setLanguage(lang, save = true) {
    if (!this.supportedLangs.includes(lang)) return;
    
    const success = await this.loadTranslations(lang);
    if (!success) return;
    
    this.currentLang = lang;
    document.documentElement.lang = lang;
    
    if (save) {
      localStorage.setItem('mp3-language', lang);
      // Mark that user explicitly set this language
      localStorage.setItem('mp3-user-set-language', 'true');
    }
    
    // Update all elements with data-i18n attribute
    this.updatePageContent();
    
    // Update language switcher UI
    this.updateLanguageSwitchers();
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  },

  /**
   * Get translation by key
   */
  t(key, defaultValue = '') {
    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    
    return value || defaultValue || key;
  },

  /**
   * Update all elements with data-i18n
   */
  updatePageContent() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      const originalText = el.getAttribute('data-i18n-original') || el.textContent;
      
      // Store original text on first run
      if (!el.getAttribute('data-i18n-original')) {
        el.setAttribute('data-i18n-original', originalText);
      }
      
      // Only update if we have a valid translation
      if (translation && translation !== key) {
        if (el.hasAttribute('data-i18n-attr')) {
          const attr = el.getAttribute('data-i18n-attr');
          el.setAttribute(attr, translation);
        } else {
          el.textContent = translation;
        }
      }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      if (translation && translation !== key) {
        el.placeholder = translation;
      }
    });
  },

  /**
   * Setup language switcher buttons
   */
  setupLanguageSwitchers() {
    document.querySelectorAll('.lang-btn, .navbar-lang-btn, .mobile-header-lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = btn.getAttribute('data-lang');
        if (lang) this.setLanguage(lang);
      });
    });
  },

  /**
   * Update language switcher UI
   */
  updateLanguageSwitchers() {
    document.querySelectorAll('.lang-btn, .navbar-lang-btn, .mobile-header-lang-btn').forEach(btn => {
      const lang = btn.getAttribute('data-lang');
      btn.classList.toggle('active', lang === this.currentLang);
    });
  },

  /**
   * Format date according to current language
   */
  formatDate(date, options = {}) {
    const locales = {
      ht: 'fr-FR', // Haitian Creole uses French locale as base
      fr: 'fr-FR',
      en: 'en-US',
      es: 'es-ES'
    };
    
    const defaultOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      ...options 
    };
    
    return new Date(date).toLocaleDateString(locales[this.currentLang], defaultOptions);
  },

  /**
   * Format number according to current language
   */
  formatNumber(number, options = {}) {
    const locales = {
      ht: 'fr-FR',
      fr: 'fr-FR',
      en: 'en-US',
      es: 'es-ES'
    };
    
    return new Intl.NumberFormat(locales[this.currentLang], options).format(number);
  },

  /**
   * Format currency
   */
  formatCurrency(amount, currency = 'HTG') {
    const locales = {
      ht: 'fr-FR',
      fr: 'fr-FR',
      en: 'en-US',
      es: 'es-ES'
    };
    
    return new Intl.NumberFormat(locales[this.currentLang], {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  I18n.init();
});

// Expose to window
window.I18n = I18n;
window.t = (key, defaultValue) => I18n.t(key, defaultValue);
