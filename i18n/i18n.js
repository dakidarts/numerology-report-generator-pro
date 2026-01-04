// i18n Manager
const i18n = {
    currentLanguage: 'en',
    translations: {},
    
    init: function(language = 'en') {
        this.currentLanguage = language;
        this.loadTranslations();
    },
    
    loadTranslations: function() {
        if (typeof en !== 'undefined') this.translations.en = en;
        if (typeof fr !== 'undefined') this.translations.fr = fr;
        if (typeof es !== 'undefined') this.translations.es = es;
        if (typeof de !== 'undefined') this.translations.de = de;
        if (typeof ru !== 'undefined') this.translations.ru = ru;
        if (typeof hi !== 'undefined') this.translations.hi = hi;
        if (typeof bn !== 'undefined') this.translations.bn = bn;
        if (typeof pt !== 'undefined') this.translations.pt = pt;
    },
    
    setLanguage: function(language) {
        this.loadTranslations();
        if (this.translations[language]) {
            this.currentLanguage = language;
            this.updateUI();
        }
    },
    
    t: function(key) {
        const translation = this.translations[this.currentLanguage];
        return translation && translation[key] ? translation[key] : key;
    },
    
    updateUI: function() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.placeholder !== undefined) {
                    element.placeholder = translation;
                }
            } else {
                element.textContent = translation;
            }
        });
        
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });
        
        // Update dynamic content
        this.updateDynamicContent();
    },
    
    updateDynamicContent: function() {
        // Re-render profiles, templates, history with new language
        if (typeof renderProfiles === 'function') renderProfiles();
        if (typeof renderTemplates === 'function') renderTemplates();
        if (typeof renderHistory === 'function') renderHistory();
        if (typeof updateProfileSelect === 'function') updateProfileSelect();
        if (typeof updateTemplateSelect === 'function') updateTemplateSelect();
    }
};

window.i18n = i18n;
