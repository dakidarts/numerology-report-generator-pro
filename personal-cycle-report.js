// Updated PDF generation function ensuring "Global Focus Areas" doesn't break awkwardly
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

    // Helper function to check if we need a new page for upcoming content
    const ensureSpace = (requiredHeight) => {
        if (yPos + requiredHeight > pageHeight - 20) { // Leave 20pt for footer
            addPageFooter();
            doc.addPage();
            currentPage++;
            yPos = margin;
        }
    };
    
    // Helper function to add a standard vertical space between elements
    const addVerticalSpace = (space = 8) => {
        yPos += space;
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
                doc.text('• ' + settings.practitionerWebsite.replace(/^https?:\/\//, ''), margin + nameWidth + 3, footerY);
            }
        }
        
        // Right side: Page number
        const totalPages = 6; // Approximate
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
    
    yPos = 50;
    doc.setFontSize(48);
    doc.text(targetYear.toString(), pageWidth / 2, yPos, { align: 'center' });
    
    yPos = 105;
    
    // Client Information Box with proper padding
    const boxHeight = 70;
    doc.setFillColor(...lightPrimaryColor);
    doc.setDrawColor(...primaryColor);
    doc.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'FD');
    
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.fontFamily, 'bold');
    
    yPos += 12;
    doc.text('Insights For:', margin + 10, yPos);
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
    const overviewLines = doc.splitTextToSize(data.cycle_synthesis.overview, contentWidth);
    doc.text(overviewLines, margin, yPos);
    yPos += overviewLines.length * 6 + 8; // Standard space after paragraph
    
    // Key Integration Box
    const keyIntLines = doc.splitTextToSize(data.cycle_synthesis.key_integration, contentWidth - 10);
    const keyIntBoxHeight = 20 + (keyIntLines.length * 5);
    ensureSpace(keyIntBoxHeight + 10); // Ensure space for box and padding
    
    doc.setFillColor(255, 249, 230);
    doc.setDrawColor(217, 119, 6);
    doc.roundedRect(margin, yPos, contentWidth, keyIntBoxHeight, 3, 3, 'FD');
    
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Key Integration', margin + 5, yPos + 8);
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(keyIntLines, margin + 5, yPos + 16);
    yPos += keyIntBoxHeight + 8;
    
    // Alignment Guidance Box
    const alignLines = doc.splitTextToSize(data.cycle_synthesis.alignment_guidance, contentWidth - 10);
    const alignBoxHeight = 20 + (alignLines.length * 5);
    ensureSpace(alignBoxHeight + 10); // Ensure space for box and padding
    
    doc.setFillColor(232, 245, 233);
    doc.setDrawColor(56, 161, 105);
    doc.roundedRect(margin, yPos, contentWidth, alignBoxHeight, 3, 3, 'FD');
    
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Alignment Guidance', margin + 5, yPos + 8);
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(alignLines, margin + 5, yPos + 16);
    yPos += alignBoxHeight + 8;
    
    // ========== PERSONAL YEAR SECTION ==========
    addVerticalSpace(15); // Section break
    
    const personalMeaning = data.personal_cycle.meaning;
    const personalDetailed = data.personal_cycle.detailed_meaning;
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text(`Personal Year ${data.personal_cycle.number}`, margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.text(personalMeaning.title, margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'italic');
    doc.setTextColor(...accentColor);
    const themeText = `Theme: ${personalMeaning.theme}`;
    const themeLines = doc.splitTextToSize(themeText, contentWidth);
    doc.text(themeLines, margin, yPos);
    yPos += themeLines.length * 6 + 8;
    
    // Detailed Meaning - Allow to flow naturally across pages
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Deep Insight', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const detailedLines = doc.splitTextToSize(personalDetailed, contentWidth);
    
    // Write detailed content with automatic page breaks
    for (let i = 0; i < detailedLines.length; i++) {
        // Check if we need a new page before adding this line
        if (yPos > pageHeight - 30) { // Leave space for footer and some buffer
            addPageFooter();
            doc.addPage();
            currentPage++;
            yPos = margin;
            // Reapply formatting after new page
            doc.setFont(styles.bodyFontFamily, 'normal');
            doc.setTextColor(...secondaryColor);
            doc.setFontSize(styles.fontSize.body);
        }
        doc.text(detailedLines[i], margin, yPos);
        yPos += 6; // Line height
    }
    addVerticalSpace(8); // Space after detailed insight
    
    // Core Attributes
    addVerticalSpace(10);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Core Attributes', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    
    const attributes = [
        ['Energy:', personalMeaning.energy],
        ['Emotional Tone:', personalMeaning.emotional_tone]
    ];
    
    for (const [label, value] of attributes) {
        ensureSpace(15); // Ensure space for attribute block
        doc.setFont(styles.fontFamily, 'bold');
        doc.text(label, margin, yPos);
        doc.setFont(styles.bodyFontFamily, 'normal');
        const valueLines = doc.splitTextToSize(value, contentWidth - 40);
        doc.text(valueLines, margin + 40, yPos);
        yPos += Math.max(valueLines.length * 5, 8);
    }
    
    addVerticalSpace(6);
    
    // Key Areas of Focus
    addVerticalSpace(10);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Key Areas of Focus', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    for (const area of personalMeaning.key_areas) {
        ensureSpace(10); // Ensure space for list item
        doc.text('• ' + area, margin + 5, yPos);
        yPos += 7;
    }
    
    addVerticalSpace(6);
    
    // Opportunities & Challenges
    addVerticalSpace(10);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Opportunities & Challenges', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Opportunities:', margin, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const oppLines = doc.splitTextToSize(personalMeaning.opportunities, contentWidth - 35);
    doc.text(oppLines, margin + 35, yPos);
    yPos += oppLines.length * 5 + 8;
    
    ensureSpace(20); // Ensure space for challenges
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Challenges:', margin, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const chalLines = doc.splitTextToSize(personalMeaning.challenges, contentWidth - 35);
    doc.text(chalLines, margin + 35, yPos);
    yPos += chalLines.length * 5 + 10;
    
    // Action Steps with proper padding
    const actionStepsHeight = 20 + (personalMeaning.action_steps.length * 7);
    ensureSpace(actionStepsHeight + 10); // Ensure space for action steps box
    addVerticalSpace(8);
    
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
    for (const step of personalMeaning.action_steps) {
        doc.text('• ' + step, margin + 8, yPos);
        yPos += 7;
    }
    
    addVerticalSpace(12);
    
    // ========== LIFE AREAS DEEP DIVE ==========
    addVerticalSpace(15); // Section break
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Life Areas in Focus', margin, yPos);
    yPos += 15;
    
    const lifeAreas = [
        ['Career & Money', personalMeaning.career_money],
        ['Relationships', personalMeaning.relationships],
        ['Health & Wellness', personalMeaning.health_wellness],
        ['Spiritual Lesson', personalMeaning.spiritual_lesson]
    ];
    
    for (const [title, content] of lifeAreas) {
        ensureSpace(25); // Ensure minimum space for life area block
        
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
        yPos += contentLines.length * 5 + 8;
    }
    
    // ========== UNIVERSAL YEAR SECTION ==========
    // Calculate estimated height for the entire Universal Year section
    const universalMeaning = data.universal_cycle.meaning;
    const universalDetailed = data.universal_cycle.detailed_meaning;
    
    const uTitleHeight = 10; // For section header
    const uSubtitleHeight = 10; // For title
    const uThemeLines = doc.splitTextToSize(`Theme: ${universalMeaning.theme}`, contentWidth);
    const uThemeHeight = uThemeLines.length * 6 + 12;
    const uDetailedLines = doc.splitTextToSize(universalDetailed, contentWidth);
    const uDetailedHeight = uDetailedLines.length * 6 + 12; // +12 for header
    const uProfileHeaderHeight = 10; // For "Global Energy Profile"
    const uProfileAttrsHeight = 30; // Approx for attributes
    const uFocusHeaderHeight = 10; // For "Global Focus Areas"
    const uFocusHeight = universalMeaning.global_focus.length * 7 + 10; // +10 for header
    const uGuidanceHeaderHeight = 10; // For "Universal Guidance"
    const uOppLines = doc.splitTextToSize(universalMeaning.opportunities, contentWidth - 35);
    const uChalLines = doc.splitTextToSize(universalMeaning.challenges, contentWidth - 35);
    const adviceLines = doc.splitTextToSize(universalMeaning.advice, contentWidth - 35);
    const uGuidanceHeight = (uOppLines.length + uChalLines.length + adviceLines.length) * 5 + 30; // +30 for headers
    
    const totalUSectionHeight = uTitleHeight + uSubtitleHeight + uThemeHeight + uDetailedHeight + 
                               uProfileHeaderHeight + uProfileAttrsHeight + uFocusHeaderHeight + 
                               uFocusHeight + uGuidanceHeaderHeight + uGuidanceHeight + 30; // +30 for safety margin
    
    // If the entire section won't fit comfortably, start it on a new page
    if (yPos + totalUSectionHeight > pageHeight - 20) {
        addPageFooter();
        doc.addPage();
        currentPage++;
        yPos = margin;
    } else {
        addVerticalSpace(15); // Otherwise, just add standard section break
    }
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text(`Universal Year ${data.universal_cycle.number}`, margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.text(universalMeaning.title, margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'italic');
    doc.setTextColor(...accentColor);
    const uThemeText = `Theme: ${universalMeaning.theme}`;
    const uThemeLines2 = doc.splitTextToSize(uThemeText, contentWidth);
    doc.text(uThemeLines2, margin, yPos);
    yPos += uThemeLines2.length * 6 + 12;
    
    // Detailed Meaning - Allow to flow naturally across pages
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Deep Insight', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const uDetailedLines2 = doc.splitTextToSize(universalDetailed, contentWidth);
    
    // Write detailed content with automatic page breaks
    for (let i = 0; i < uDetailedLines2.length; i++) {
        // Check if we need a new page before adding this line
        if (yPos > pageHeight - 30) { // Leave space for footer and some buffer
            addPageFooter();
            doc.addPage();
            currentPage++;
            yPos = margin;
            // Reapply formatting after new page
            doc.setFont(styles.bodyFontFamily, 'normal');
            doc.setTextColor(...secondaryColor);
            doc.setFontSize(styles.fontSize.body);
        }
        doc.text(uDetailedLines2[i], margin, yPos);
        yPos += 6; // Line height
    }
    addVerticalSpace(8); // Space after detailed insight
    
    // Global Energy Profile
    addVerticalSpace(10);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Global Energy Profile', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    
    const universalAttrs = [
        ['Energy:', universalMeaning.energy],
        ['Collective Mood:', universalMeaning.collective_mood]
    ];
    
    for (const [label, value] of universalAttrs) {
        ensureSpace(15); // Ensure space for attribute block
        doc.setFont(styles.fontFamily, 'bold');
        doc.text(label, margin, yPos);
        doc.setFont(styles.bodyFontFamily, 'normal');
        const valueLines = doc.splitTextToSize(value, contentWidth - 40);
        doc.text(valueLines, margin + 40, yPos);
        yPos += Math.max(valueLines.length * 5, 8);
    }
    
    addVerticalSpace(6);
    
    // --- Global Focus Areas: Ensure it starts fresh if needed ---
    // Calculate height needed for the "Global Focus Areas" header and its content
    const uFocusHeaderHeightCalc = 10; // Height for the header text
    const uFocusContentHeight = universalMeaning.global_focus.length * 7; // Approximate height for list items
    const uFocusTotalHeight = uFocusHeaderHeightCalc + uFocusContentHeight + 10; // +10 for space after
    
    // If it won't fit comfortably, start on a new page
    if (yPos + uFocusTotalHeight > pageHeight - 20) {
        addPageFooter();
        doc.addPage();
        currentPage++;
        yPos = margin;
    }
    
    // Global Focus Areas
    addVerticalSpace(10);
    doc.setFontSize(styles.fontSize.subsectionHeader); // Ensure font size is set before header
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Global Focus Areas', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body); // Ensure body font size is set before list items
    doc.setFont(styles.bodyFontFamily, 'normal');
    for (const item of universalMeaning.global_focus) {
        // Check for page break before adding the item
        if (yPos > pageHeight - 30) { // Leave space for footer and some buffer
            addPageFooter();
            doc.addPage();
            currentPage++;
            yPos = margin;
            // Reapply consistent formatting after new page
            doc.setFont(styles.bodyFontFamily, 'normal');
            doc.setTextColor(...secondaryColor);
            doc.setFontSize(styles.fontSize.body); // Explicitly set font size again
            // Reprint header if needed on new page (optional, often not needed for lists continuing)
            // doc.setFont(styles.fontFamily, 'bold');
            // doc.setFontSize(styles.fontSize.subsectionHeader);
            // doc.text('Global Focus Areas', margin, yPos);
            // yPos += 10;
            // doc.setFont(styles.bodyFontFamily, 'normal');
            // doc.setFontSize(styles.fontSize.body); // Reset to normal for list items again after header
        }
        
        ensureSpace(10); // Ensure space for list item
        doc.text('• ' + item, margin + 5, yPos);
        yPos += 7;
    }
    
    addVerticalSpace(6); // Space after the list

    // Universal Guidance
    addVerticalSpace(10);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Universal Guidance', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Opportunities:', margin, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const uOppLines2 = doc.splitTextToSize(universalMeaning.opportunities, contentWidth - 35);
    doc.text(uOppLines2, margin + 35, yPos);
    yPos += uOppLines2.length * 5 + 8;
    
    ensureSpace(20); // Ensure space for challenges
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Challenges:', margin, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const uChalLines2 = doc.splitTextToSize(universalMeaning.challenges, contentWidth - 35);
    doc.text(uChalLines2, margin + 35, yPos);
    yPos += uChalLines2.length * 5 + 8;
    
    ensureSpace(20); // Ensure space for advice
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Advice:', margin, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const adviceLines2 = doc.splitTextToSize(universalMeaning.advice, contentWidth - 35);
    doc.text(adviceLines2, margin + 35, yPos);
    yPos += adviceLines2.length * 5 + 8;
    
    
    addVerticalSpace(20);
    ensureSpace(30); // Ensure space for quote
    
    doc.setFont(styles.bodyFontFamily, 'italic');
    doc.setTextColor(...accentColor);
    doc.setFontSize(styles.fontSize.body + 1);
    const wisdomQuote = '"Life unfolds in cycles, not accidents. When you honor the energy of each year and act with awareness, the Universe responds with clarity, momentum, and meaningful growth."';
    const quoteLines = doc.splitTextToSize(wisdomQuote, contentWidth - 40);
    doc.text(quoteLines, pageWidth / 2, yPos, { align: 'center', maxWidth: contentWidth - 40 });
    
    // Add final footer
    addPageFooter();
    
    // ========== FINAL PAGE FOOTER ==========
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