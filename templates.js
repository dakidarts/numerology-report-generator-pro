// Template Management System for Numerology Reports

let templates = [];

async function loadTemplates() {
    try {
        const stored = localStorage.getItem('numerology_templates');
        templates = stored ? JSON.parse(stored) : getDefaultTemplates();
    } catch (error) {
        console.error('Error loading templates:', error);
        templates = getDefaultTemplates();
    }
}

async function saveTemplates() {
    try {
        localStorage.setItem('numerology_templates', JSON.stringify(templates));
    } catch (error) {
        console.error('Error saving templates:', error);
    }
}

function getDefaultTemplates() {
    return [
        {
            id: 'default-personal-cycle',
            name: 'Default Personal Cycle',
            reportType: 'personal-cycle',
            isDefault: true,
            fontFamily: 'helvetica',
            bodyFontFamily: 'helvetica',
            fontSize: {
                title: 24,
                subtitle: 14,
                sectionHeader: 18,
                subsectionHeader: 13,
                body: 12
            },
            colors: {
                primary: '#6B46C1',
                secondary: '#1A202C',
                accent: '#4A5568',
                background: '#FFFFFF'
            }
        }
    ];
}

function getTemplatesByReportType(reportType) {
    return templates.filter(t => t.reportType === reportType);
}

function getTemplateById(id) {
    return templates.find(t => t.id === id);
}

function createTemplate(templateData) {
    const newTemplate = {
        id: Date.now().toString(),
        ...templateData,
        isDefault: false,
        createdAt: new Date().toISOString()
    };
    templates.push(newTemplate);
    saveTemplates();
    return newTemplate;
}

function updateTemplate(id, templateData) {
    const index = templates.findIndex(t => t.id === id);
    if (index !== -1) {
        templates[index] = { ...templates[index], ...templateData };
        saveTemplates();
        return templates[index];
    }
    return null;
}

function deleteTemplate(id) {
    const template = templates.find(t => t.id === id);
    if (template && !template.isDefault) {
        templates = templates.filter(t => t.id !== id);
        saveTemplates();
        return true;
    }
    return false;
}

// Make functions globally accessible
window.loadTemplates = loadTemplates;
window.saveTemplates = saveTemplates;
window.getTemplatesByReportType = getTemplatesByReportType;
window.getTemplateById = getTemplateById;
window.createTemplate = createTemplate;
window.updateTemplate = updateTemplate;
window.deleteTemplate = deleteTemplate;
