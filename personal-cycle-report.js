// Updated PDF generation function with custom footers and template support
// Replace the createPersonalCyclePDF function in personal-cycle-report.js with this

async function createPersonalCyclePDF(data, clientData, targetYear, customization, template = null) {
    // Retry mechanism for jsPDF loading
    let jsPDF = null;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!jsPDF && attempts < maxAttempts) {
        if (window.jsPDF) {
            jsPDF = window.jsPDF;
        } else if (window.jspdf && window.jspdf.jsPDF) {
            jsPDF = window.jspdf.jsPDF;
            window.jsPDF = jsPDF;
        }
        
        if (!jsPDF) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    }
    
    if (!jsPDF) {
        throw new Error('jsPDF library failed to load after retries');
    }
    
    const doc = new jsPDF();
    
    // Apply template or use defaults
    const styles = template || {
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
            background: '#FFFFFF',
        }
    };
    
    let yPos = 20;
    
    // Convert hex colors to RGB if needed
    const hexToRgb = (color) => {
        if (Array.isArray(color)) return color;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [107, 70, 193];
    };
    
    const primaryColor = hexToRgb(styles.colors.primary);
    const secondaryColor = hexToRgb(styles.colors.secondary);
    const accentColor = hexToRgb(styles.colors.accent);
    const backgroundColor = hexToRgb(styles.colors.background || '#FFFFFF');
    
    // Function to lighten color for accent backgrounds
    const lightenColor = (rgb, percent = 0.9) => {
        return rgb.map(c => Math.min(255, Math.round(c + (255 - c) * percent)));
    };
    
    // Function to get contrasting text color based on background luminance
    const getContrastColor = (rgb) => {
        const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
        return luminance > 0.5 ? [0, 0, 0] : [255, 255, 255];
    };
    
    const lightPrimaryColor = lightenColor(primaryColor);
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let currentPage = 1;

    const checkNewPage = (neededHeight) => {
        if (yPos + neededHeight > pageHeight - 40) {
            addPageFooter();
            doc.addPage();
            currentPage++;
            yPos = margin;
            return true;
        }
        return false;
    };
    
    const addPageFooter = () => {
        const footerY = pageHeight - 14;
        const footerTextColor = getContrastColor(lightPrimaryColor);
        doc.setFontSize(9);
        doc.setFont(styles.fontFamily, 'normal');
        doc.setTextColor(...footerTextColor);
        
        // Left side: Practitioner info
        if (settings.practitionerName) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text(settings.practitionerName + ' ', margin, footerY);
            
            if (settings.practitionerWebsite) {
                doc.setFont(styles.fontFamily, 'normal');
                const nameWidth = doc.getTextWidth(settings.practitionerName);
                doc.text('•  ' + settings.practitionerWebsite.replace(/^https?:\/\//, ''), margin + nameWidth + 3, footerY);
            }
        }
        
        // Right side: Page number
        const totalPages = 5; // Approximate, will be updated
        const pageText = `Page ${currentPage} of ${totalPages}`;
        doc.text(pageText, pageWidth - margin, footerY, { align: 'right' });
    };

    // Set page background
    doc.setFillColor(...backgroundColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    // Header section
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 80, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(styles.fontSize.title);
    doc.setFont(styles.fontFamily, 'bold');
    const title = customization.title || 'Personal Cycle Analysis Report';
    doc.text(title, pageWidth / 2, 35, { align: 'center', maxWidth: contentWidth - 20 });
    
    yPos = 60;
    doc.setFontSize(48);
    doc.text(targetYear.toString(), pageWidth / 2, yPos, { align: 'center' });
    
    yPos = 105;
    
    // Client Information Box with proper padding
    const boxHeight = 70;
    doc.setFillColor(...lightPrimaryColor);
    doc.setDrawColor(...primaryColor);
    doc.setFillColor(...lightPrimaryColor);
    doc.setDrawColor(...primaryColor);
    doc.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'FD');
    
    doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.fontFamily, 'bold');
    
    yPos += 12;
    doc.text('Client Name:', margin + 10, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(clientData.name, margin + 60, yPos);
    
    yPos += 10;
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Date of Birth:', margin + 10, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(formatDate(clientData.dob), margin + 60, yPos);
    
    yPos += 10;
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Age in Target Year:', margin + 10, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(data.input.age_in_target_year.toString(), margin + 60, yPos);
    
    yPos += 10;
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Personal Year:', margin + 10, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(...primaryColor);
    doc.text(data.personal_cycle.number.toString(), margin + 60, yPos);
    
    yPos += 10;
    doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Universal Year:', margin + 10, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(...primaryColor);
    doc.text(data.universal_cycle.number.toString(), margin + 60, yPos);
    
    yPos += 10;
    doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Generated:', margin + 10, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(new Date().toLocaleDateString(), margin + 60, yPos);
    
    yPos += 62;
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'italic');
    doc.setTextColor(...accentColor);
    doc.text('Understanding Your Personal Journey Within the Universal Flow', 
        pageWidth / 2, yPos, { align: 'center', maxWidth: contentWidth });
    
    addPageFooter();
    doc.addPage();
    currentPage++;
    yPos = margin;
    
    // ========== CYCLE SYNTHESIS ==========
    doc.setTextColor(...primaryColor);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Your Cycle Overview', margin, yPos);
    yPos += 12;
    
    doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const overviewLines = doc.splitTextToSize(data.cycle_synthesis.overview, contentWidth);
    doc.text(overviewLines, margin, yPos);
    yPos += overviewLines.length * 6 + 10;
    
    checkNewPage(40);
    
    // Key Integration Box
    doc.setFillColor(255, 249, 230);
    doc.setDrawColor(217, 119, 6);
    doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'FD');
    
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Key Integration', margin + 5, yPos + 8);
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const keyIntLines = doc.splitTextToSize(data.cycle_synthesis.key_integration, contentWidth - 10);
    doc.text(keyIntLines, margin + 5, yPos + 16);
    yPos += 40;
    
    checkNewPage(40);
    
    // Alignment Guidance Box
    doc.setFillColor(232, 245, 233);
    doc.setDrawColor(56, 161, 105);
    doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'FD');
    
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Alignment Guidance', margin + 5, yPos + 8);
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const alignLines = doc.splitTextToSize(data.cycle_synthesis.alignment_guidance, contentWidth - 10);
    doc.text(alignLines, margin + 5, yPos + 16);
    yPos += 45;
    
    // ========== PERSONAL YEAR SECTION ==========
    addPageFooter();
    doc.addPage();
    currentPage++;
    yPos = margin;
    
    const personal = data.personal_cycle.detailed_meaning;
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text(`Personal Year ${data.personal_cycle.number}`, margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.text(personal.title, margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'italic');
    doc.setTextColor(...accentColor);
    const meaningLines = doc.splitTextToSize(data.personal_cycle.meaning, contentWidth);
    doc.text(meaningLines, margin, yPos);
    yPos += meaningLines.length * 6 + 15;
    
    // Core Attributes
    doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Core Attributes', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    
    const attributes = [
        ['Theme:', personal.theme],
        ['Energy:', personal.energy],
        ['Emo Tone:', personal.emotional_tone]
    ];
    
    attributes.forEach(([label, value]) => {
        checkNewPage(15);
        doc.setFont(styles.fontFamily, 'bold');
        doc.text(label, margin, yPos);
        doc.setFont(styles.bodyFontFamily, 'normal');
        const valueLines = doc.splitTextToSize(value, contentWidth - 30);
        doc.text(valueLines, margin + 35, yPos);
        yPos += Math.max(valueLines.length * 5, 8);
    });
    
    yPos += 10;
    
    // Key Areas of Focus
    checkNewPage(50);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Key Areas of Focus', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    personal.key_areas.forEach(area => {
        checkNewPage(10);
        doc.text('- ' + area, margin + 5, yPos);
        yPos += 7;
    });
    
    yPos += 10;
    
    // Opportunities & Challenges
    checkNewPage(40);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Opportunities & Challenges', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Opportunities:', margin, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const oppLines = doc.splitTextToSize(personal.opportunities, contentWidth - 35);
    doc.text(oppLines, margin + 35, yPos);
    yPos += 8;
    
    checkNewPage(20);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Challenges:', margin, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const chalLines = doc.splitTextToSize(personal.challenges, contentWidth - 35);
    doc.text(chalLines, margin + 35, yPos);
    yPos += 8;
    
    // Action Steps with proper padding
        checkNewPage(65);
        
        const actionStepsHeight = 17 + (personal.action_steps.length * 7) + 8;
        doc.setFillColor(...lightPrimaryColor);
        doc.setDrawColor(...primaryColor);
        doc.roundedRect(margin, yPos, contentWidth, actionStepsHeight, 3, 3, 'FD');
        
        yPos += 12;
        doc.setFontSize(styles.fontSize.subsectionHeader);
        doc.setFont(styles.fontFamily, 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('Action Steps for This Year', margin + 5, yPos);
        yPos += 8;
        
        doc.setFontSize(styles.fontSize.body);
        doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
        personal.action_steps.forEach(step => {
            doc.text('- ' + step, margin + 8, yPos);
            yPos += 7;
        });
        
        yPos += 18;
    
    // ========== LIFE AREAS DEEP DIVE ==========
    addPageFooter();
    doc.addPage();
    currentPage++;
    yPos = margin;
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Life Areas in Focus', margin, yPos);
    yPos += 15;
    
    const lifeAreas = [
        ['Career & Money', personal.career_money],
        ['Relationships', personal.relationships],
        ['Health & Wellness', personal.health_wellness],
        ['Spiritual Lesson', personal.spiritual_lesson]
    ];
    
    lifeAreas.forEach(([title, content]) => {
        checkNewPage(40);
        doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(styles.fontSize.subsectionHeader);
        doc.setFont(styles.fontFamily, 'bold');
        doc.text(title, margin, yPos);
        yPos += 8;
        
        doc.setFontSize(styles.fontSize.body);
        doc.setFont(styles.bodyFontFamily, 'normal');
        const contentLines = doc.splitTextToSize(content, contentWidth);
        doc.text(contentLines, margin, yPos);
        yPos += contentLines.length * 5 + 12;
    });
    
    // ========== UNIVERSAL YEAR SECTION ==========
    addPageFooter();
    doc.addPage();
    currentPage++;
    yPos = margin;
    
    const universal = data.universal_cycle.detailed_meaning;
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text(`Universal Year ${data.universal_cycle.number}`, margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.text(universal.title, margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'italic');
    doc.setTextColor(...accentColor);
    const uMeaningLines = doc.splitTextToSize(data.universal_cycle.meaning, contentWidth);
    doc.text(uMeaningLines, margin, yPos);
    yPos += uMeaningLines.length * 6 + 15;
    
    // Global Energy Profile
    doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Global Energy Profile', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    
    const universalAttrs = [
        ['Theme:', universal.theme],
        ['Energy:', universal.energy],
        ['Collective:', universal.collective_mood]
    ];
    
    universalAttrs.forEach(([label, value]) => {
        checkNewPage(15);
        doc.setFont(styles.fontFamily, 'bold');
        doc.text(label, margin, yPos);
        doc.setFont(styles.bodyFontFamily, 'normal');
        const valueLines = doc.splitTextToSize(value, contentWidth - 35);
        doc.text(valueLines, margin + 35, yPos);
        yPos += Math.max(valueLines.length * 5, 8);
    });
    
    yPos += 10;
    
    // Global Focus Areas
    checkNewPage(50);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Global Focus Areas', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    universal.global_focus.forEach(item => {
        checkNewPage(10);
        doc.text('- ' + item, margin + 5, yPos);
        yPos += 7;
    });
    
    yPos += 10;
    
    // Universal Guidance
    checkNewPage(60);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Universal Guidance', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Opportunities:', margin, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const uOppLines = doc.splitTextToSize(universal.opportunities, contentWidth - 35);
    doc.text(uOppLines, margin + 35, yPos);
    yPos += 8;
    
    checkNewPage(20);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Challenges:', margin, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const uChalLines = doc.splitTextToSize(universal.challenges, contentWidth - 35);
    doc.text(uChalLines, margin + 35, yPos);
    yPos += 8;
    
    checkNewPage(20);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Advice:', margin, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const adviceLines = doc.splitTextToSize(universal.advice, contentWidth - 35);
    doc.text(adviceLines, margin + 35, yPos);
    yPos += 8;
    
    // ========== FOOTER ==========
    const footerY = pageHeight - 30;
    doc.setFillColor(...lightPrimaryColor);
    doc.rect(0, footerY, pageWidth, 30, 'F');
    
    doc.setFontSize(9);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(149, 165, 166);
    
    const footerText = customization.branding || 
        `Generated by ${settings.practitionerName || 'Numerology Report Generator Pro'}`;
    doc.text(footerText, pageWidth / 2, footerY + 10, { align: 'center' });
    doc.text('Powered by The Numerology API - NumerologyAPI.com', 
        pageWidth / 2, footerY + 17, { align: 'center' });
    doc.text(`© ${new Date().getFullYear()} - For Personal Guidance Only`, 
        pageWidth / 2, footerY + 24, { align: 'center' });
    
    return doc;
}

// Make function globally accessible
window.createPersonalCyclePDF = createPersonalCyclePDF;
