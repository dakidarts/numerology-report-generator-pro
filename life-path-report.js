// Updated Life Path Deep Dive Report PDF generation with sequential flow and NO SPREAD OPERATORS
async function createLifePathPDF(data, clientData, customization, template = null) {
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
    const tipBoxHeaderHeight = 15; // Approximate height for the header text
    const tipLineHeight = 6; // Approximate height for each tip line
    const tipBoxPadding = 10; // Padding inside the box

    
    const lightenColor = (rgb, percent = 0.9) => {
        return rgb.map(c => Math.min(255, Math.round(c + (255 - c) * percent)));
    };
    
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
    const footerBuffer = 30; // Safe height for footer

    // Helper function to check if we need a new page for upcoming content and ensure formatting
    const ensureSpaceAndFormat = (requiredHeight, fontSettings = { fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body }) => {
        if (yPos + requiredHeight > pageHeight - footerBuffer) { // Use the new buffer
            addPageFooter();
            doc.addPage();
            currentPage++;
            yPos = margin;
            // Reapply consistent formatting after new page - USE ARRAY INDEXING
            doc.setFont(fontSettings.fontFamily, fontSettings.fontStyle);
            doc.setTextColor(fontSettings.textColor[0], fontSettings.textColor[1], fontSettings.textColor[2]);
            doc.setFontSize(fontSettings.fontSize || styles.fontSize.body);
        }
    };
    
    // Helper function to add a standard vertical space between elements
    const addVerticalSpace = (space = 8) => {
        yPos += space;
    };
    
    const addPageFooter = () => {
        const footerY = pageHeight - 14;
        // USE ARRAY INDEXING for getContrastColor
        const footerTextColor = getContrastColor(lightPrimaryColor);
        doc.setFontSize(9);
        doc.setFont(styles.fontFamily, 'normal');
        // USE ARRAY INDEXING for text color
        doc.setTextColor(footerTextColor[0], footerTextColor[1], footerTextColor[2]);
        
        if (settings.practitionerName) {
            doc.setFont(styles.fontFamily, 'bold');
            // USE STRING CONCATENATION instead of template literal if settings.practitionerName is an object
            doc.text(settings.practitionerName.toString() + ' ', margin, footerY);
            
            if (settings.practitionerWebsite) {
                doc.setFont(styles.fontFamily, 'normal');
                const nameWidth = doc.getTextWidth(settings.practitionerName.toString()); // Ensure string for width calc
                // USE STRING CONCATENATION and REPLACE for website
                doc.text('•  ' + settings.practitionerWebsite.toString().replace(/^https?:\/\//, ''), margin + nameWidth + 3, footerY);
            }
        }
        
        const pageText = `Page ${currentPage}`;
        doc.text(pageText, pageWidth - margin, footerY, { align: 'right' });
    };

    // Helper function to render content blocks (text, lists) safely across pages with consistent formatting
    const renderContentBlock = (content, startX, startY, width, lineHeight = 6, fontSettings = { fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body }) => {
        let currentY = startY;
        const textArray = Array.isArray(content) ? content : [content];

        for (const item of textArray) {
            // APPLY FONT SETTINGS using fontSettings object - USE ARRAY INDEXING
            doc.setFont(fontSettings.fontFamily, fontSettings.fontStyle);
            doc.setTextColor(fontSettings.textColor[0], fontSettings.textColor[1], fontSettings.textColor[2]);
            doc.setFontSize(fontSettings.fontSize);
            
            const lines = Array.isArray(item) ? item : doc.splitTextToSize(item, width);
            
            for (let j = 0; j < lines.length; j++) {
                const line = lines[j];
                
                // Check if line fits, if not add page and reapply formatting - USE ARRAY INDEXING
                if (currentY + lineHeight > pageHeight - footerBuffer) { // Use the new buffer
                    addPageFooter();
                    doc.addPage();
                    currentPage++;
                    currentY = margin;
                    // Reapply consistent formatting after new page - CRITICAL FOR LISTS - USE ARRAY INDEXING
                    doc.setFont(fontSettings.fontFamily, fontSettings.fontStyle);
                    doc.setTextColor(fontSettings.textColor[0], fontSettings.textColor[1], fontSettings.textColor[2]);
                    doc.setFontSize(fontSettings.fontSize);
                }
                
                doc.text(line, startX, currentY);
                currentY += lineHeight;
            }
        }
        return currentY;
    };

    // Set page background - USE ARRAY INDEXING
    doc.setFillColor(backgroundColor[0], backgroundColor[1], backgroundColor[2]);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Header section - USE ARRAY INDEXING
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 80, 'F');
    
    // USE FIXED WHITE COLOR
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(styles.fontSize.title);
    doc.setFont(styles.fontFamily, 'bold');
    const title = customization.title || 'Life Path Deep Dive Report';
    doc.text(title, pageWidth / 2, 35, { align: 'center', maxWidth: contentWidth - 20 });
    
    yPos = 50;
    doc.setFontSize(14);
    doc.text('A Comprehensive Analysis of Your Life Path and Cycles', pageWidth / 2, yPos, { align: 'center' });
    
    yPos = 105;
    
    // Client Information Box - USE ARRAY INDEXING
    const boxHeight = 50;
    doc.setFillColor(lightPrimaryColor[0], lightPrimaryColor[1], lightPrimaryColor[2]);
    // USE ARRAY INDEXING for primary color
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'FD');
    
    // SET INITIAL FONTS AND COLORS - USE ARRAY INDEXING
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.fontFamily, 'bold');
    
    // --- ALIGNED COVER DETAILS ---
    let detailYPos = yPos + 12; // Starting Y position for details
    const detailSpacing = 10; // Vertical space between detail lines
    const labelX = margin + 10; // X position for labels
    const valueX = margin + 60; // X position for values (aligned)
    
    doc.text('Insights For:', labelX, detailYPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(clientData.name, valueX, detailYPos);
    
    detailYPos += detailSpacing;
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Date of Birth:', labelX, detailYPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(formatDate(clientData.dob), valueX, detailYPos);
    
    detailYPos += detailSpacing;
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Age:', labelX, detailYPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    const age = clientData.dob ? Math.floor((new Date() - new Date(clientData.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';
    doc.text(age.toString(), valueX, detailYPos);
    
    detailYPos += detailSpacing;
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Generated:', labelX, detailYPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(new Date().toLocaleDateString(), valueX, detailYPos);
    // --- END: Aligned Cover Details ---
    
    yPos = detailYPos + 20; // Set yPos to below the details
    
    // Calculate center position between box and footer
    const remainingSpace = pageHeight - yPos - 40;
    const centerY = yPos + (remainingSpace / 2);
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'italic');
    // USE ARRAY INDEXING for accent color
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    const introText = 'This comprehensive report provides a deep analysis of your life path and related cycles.';
    doc.text(introText, pageWidth / 2, centerY, { align: 'center', maxWidth: contentWidth });
    
    addPageFooter();
    doc.addPage();
    currentPage++;
    yPos = margin;
    
    // ========== LIFE PATH ANALYSIS ==========
    // USE ARRAY INDEXING for primary color
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Your Life Path', margin, yPos);
    yPos += 12;
    
    const lifePath = data['life_path'] || {};
    if (lifePath.life_path_number) {
        doc.setFontSize(styles.fontSize.subsectionHeader);
        doc.text('Life Path Number', margin, yPos);
        yPos += 10;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        // USE ARRAY INDEXING for secondary color
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(styles.fontSize.body);
        
        const lpIntro = 'The Life Path Number is the most important number in your numerology chart. It represents the path you will take in life and the lessons you will learn.';
        const lpIntroLines = doc.splitTextToSize(lpIntro, contentWidth);
        // USE ARRAY INDEXING for renderContentBlock call
        yPos = renderContentBlock(lpIntroLines, margin, yPos, contentWidth, 6, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
        addVerticalSpace(8); // Add space after intro
        
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Life Path Number: ' + lifePath.life_path_number, margin, yPos);
        yPos += 8;
        
        if (lifePath.summary) {
            const summary = lifePath.summary;
            // Print title
            doc.setFont(styles.fontFamily, 'bold');
            doc.text(summary.title || 'Summary:', margin, yPos);
            yPos += 8;
            
            // Print overview
            if (summary.overview) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Overview:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'normal');
                const overviewLines = doc.splitTextToSize(summary.overview, contentWidth);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(overviewLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(10);
            }
            
            // Print strengths (if it's an array)
            if (Array.isArray(summary.strengths) && summary.strengths.length > 0) {
                ensureSpaceAndFormat(20); // Ensure space for list - USE THE HELPER
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Strengths:', margin, yPos);
                yPos += 8;
                
                doc.setFont(styles.bodyFontFamily, 'normal');
                const strengthLines = summary.strengths.map(item => `• ${item}`);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(strengthLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(5); // Space after list
            }
            
            // Print challenges (if it's an array)
            if (Array.isArray(summary.challenges) && summary.challenges.length > 0) {
                ensureSpaceAndFormat(20); // Ensure space for list - USE THE HELPER
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Challenges:', margin, yPos);
                yPos += 8;
                
                doc.setFont(styles.bodyFontFamily, 'normal');
                const challengeLines = summary.challenges.map(item => `• ${item}`);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(challengeLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(5); // Space after list
            }
            
            // Print life lesson
            if (summary.life_lesson) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Life Lesson:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'normal');
                const lessonLines = doc.splitTextToSize(summary.life_lesson, contentWidth);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(lessonLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(10);
            }
            
            // Print ideal career paths (if it's an array)
            if (Array.isArray(summary.ideal_career_paths) && summary.ideal_career_paths.length > 0) {
                ensureSpaceAndFormat(20); // Ensure space for list - USE THE HELPER
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Ideal Career Paths:', margin, yPos);
                yPos += 8;
                
                doc.setFont(styles.bodyFontFamily, 'normal');
                const pathLines = summary.ideal_career_paths.map(item => `• ${item}`);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(pathLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(5); // Space after list
            }
            
            // Print spiritual growth tip
            if (summary.spiritual_growth_tip) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Spiritual Growth Tip:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'normal');
                const tipLines = doc.splitTextToSize(summary.spiritual_growth_tip, contentWidth);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(tipLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(10);
            }
        }
        
        if (lifePath.detailed_meaning) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Detailed Meaning:', margin, yPos);
            doc.setFont(styles.bodyFontFamily, 'normal');
            const detailLines = doc.splitTextToSize(lifePath.detailed_meaning, contentWidth);
            // USE ARRAY INDEXING for renderContentBlock call
            yPos = renderContentBlock(detailLines, margin, yPos + 6, contentWidth, 6, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
            addVerticalSpace(10); // Space after detailed meaning
        }
    }
    
    ensureSpaceAndFormat(40); // Use the new helper
    
    // Life Essence
    const lifeEssence = data['life-essence'] || {};
    if (lifeEssence.life_essence_number) {
        // USE ARRAY INDEXING for primary color
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(styles.fontSize.subsectionHeader);
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Life Essence Number', margin, yPos);
        yPos += 10;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        // USE ARRAY INDEXING for secondary color
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(styles.fontSize.body);
        
        const leIntro = 'The Life Essence Number represents the core vibration of your soul. It reveals your deepest purpose and the essence of who you are.';
        const leIntroLines = doc.splitTextToSize(leIntro, contentWidth);
        // USE ARRAY INDEXING for renderContentBlock call
        yPos = renderContentBlock(leIntroLines, margin, yPos, contentWidth, 6, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
        addVerticalSpace(8); // Add space after intro
        
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Life Essence Number: ' + lifeEssence.life_essence_number, margin, yPos);
        yPos += 8;
        
        if (lifeEssence.vibration_level) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Vibration Level: ' + lifeEssence.vibration_level, margin, yPos);
            yPos += 8;
        }
        
        if (lifeEssence.keyword) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Keyword:', margin, yPos);
            doc.setFont(styles.bodyFontFamily, 'normal');
            doc.text(lifeEssence.keyword, margin + 25, yPos);
            yPos += 8;
        }
        
        if (lifeEssence.life_path) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Life Path: ' + lifeEssence.life_path, margin, yPos);
            yPos += 8;
        }
        
        if (lifeEssence.soul_urge) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Soul Urge: ' + lifeEssence.soul_urge, margin, yPos);
            yPos += 8;
        }
        
        if (lifeEssence.expression) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Expression: ' + lifeEssence.expression, margin, yPos);
            yPos += 8;
        }
        
        if (lifeEssence.summary) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Summary:', margin, yPos);
            doc.setFont(styles.bodyFontFamily, 'normal');
            const summaryLines = doc.splitTextToSize(lifeEssence.summary, contentWidth);
            // USE ARRAY INDEXING for renderContentBlock call
            yPos = renderContentBlock(summaryLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
            addVerticalSpace(10);
        }
        
        if (lifeEssence.meaning) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Meaning:', margin, yPos);
            doc.setFont(styles.bodyFontFamily, 'normal');
            const meaningLines = doc.splitTextToSize(lifeEssence.meaning, contentWidth);
            // USE ARRAY INDEXING for renderContentBlock call
            yPos = renderContentBlock(meaningLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
            addVerticalSpace(10);
        }
        
        if (lifeEssence.detailed_meaning) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Detailed Meaning:', margin, yPos);
            doc.setFont(styles.bodyFontFamily, 'normal');
            const detailLines = doc.splitTextToSize(lifeEssence.detailed_meaning, contentWidth);
            // USE ARRAY INDEXING for renderContentBlock call
            yPos = renderContentBlock(detailLines, margin, yPos + 6, contentWidth, 6, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
            addVerticalSpace(10); // Space after detailed meaning
        }
    }
    
    // Define the tips for Your Life Path
    const lifePathTips = [
        "Your Life Path Number reveals your core purpose and natural strengths.",
        "Life Essence Number shows how your inner self expresses in daily life.",
        "Align your goals and decisions with the vibration of your Life Path.",
        "Use your Life Essence to understand emotional drives and personal growth.",
        "Reflect on challenges as opportunities to honor your Life Path lessons.",
        "Leverage your innate strengths to navigate relationships and career paths.",
        "Balance your Life Path energy with your current cycles for harmony.",
        "Revisit your Life Path insights regularly to stay aligned with your higher purpose."
    ];

    const totalTipBoxHeight = tipBoxHeaderHeight + (lifePathTips.length * tipLineHeight) + (2 * tipBoxPadding);
    
    ensureSpaceAndFormat(totalTipBoxHeight + 10); // Ensure space for box and padding
    addVerticalSpace(8); // Add space before the box
    
    // Draw the box
    doc.setFillColor(lightPrimaryColor[0],lightPrimaryColor[1], lightPrimaryColor[2]);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(margin, yPos, contentWidth, totalTipBoxHeight, 3, 3, 'FD');
    
    // Position inside the box
    let boxYPos = yPos + tipBoxPadding;
    
    // Add the header text inside the box
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Your Life Path Insights', margin + 5, boxYPos);
    boxYPos += 12; // Move down for the tips
    
    // Add the tips inside the box
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    for (const tip of lifePathTips) {
        doc.text('• ' + tip, margin + 8, boxYPos);
        boxYPos += tipLineHeight;
    }
    
    // Update yPos to after the box
    yPos += totalTipBoxHeight;
    addVerticalSpace(12); // Add space after the box

    addPageFooter();
    doc.addPage();
    currentPage++;
    yPos = margin;
    
    // ========== LIFE CYCLES ==========
    // USE ARRAY INDEXING for primary color
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Life Cycles & Periods', margin, yPos);
    yPos += 12;
    
    // Pinnacle Cycles
    const pinnacleCycles = data['pinnacle-cycles'] || {};
    if (pinnacleCycles.pinnacle_cycles) {
        doc.setFontSize(styles.fontSize.subsectionHeader);
        doc.text('Pinnacle Cycles', margin, yPos);
        yPos += 10;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        // USE ARRAY INDEXING for secondary color
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(styles.fontSize.body);
        
        const pcIntro = 'Pinnacle Cycles represent the major life phases and the themes that will dominate each phase.';
        const pcIntroLines = doc.splitTextToSize(pcIntro, contentWidth);
        // USE ARRAY INDEXING for renderContentBlock call
        yPos = renderContentBlock(pcIntroLines, margin, yPos, contentWidth, 6, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
        addVerticalSpace(10); // Add space after intro
        
        for (const cycle of pinnacleCycles.pinnacle_cycles) {
            ensureSpaceAndFormat(40); // Use the new helper
            doc.setFont(styles.fontFamily, 'bold');
            doc.text(`Pinnacle Cycle ${cycle.cycle} (${cycle.start_year} - ${cycle.end_year}): ${cycle.number}`, margin, yPos);
            yPos += 8;
            
            if (cycle.meaning && cycle.meaning !== 'N/A') { // Check for N/A
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Meaning:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'normal');
                const meaningLines = doc.splitTextToSize(cycle.meaning, contentWidth);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(meaningLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(11); // Space after meaning
            }
            
            if (cycle.detailed_meaning) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Detailed:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'normal');
                const detailLines = doc.splitTextToSize(cycle.detailed_meaning, contentWidth);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(detailLines, margin, yPos + 6, contentWidth, 6, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(10); // Space after detailed meaning
            }
        }
    }
    
    ensureSpaceAndFormat(50); // Use the new helper
    
    // Period Cycles
    const periodCycles = data['period_cycles'] || {};
    if (periodCycles.periods) {
        // USE ARRAY INDEXING for primary color
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(styles.fontSize.subsectionHeader);
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Period Cycles', margin, yPos);
        yPos += 10;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        // USE ARRAY INDEXING for secondary color
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(styles.fontSize.body);
        
        const periods = periodCycles.periods;
        
        ['first_period', 'second_period', 'third_period'].forEach(periodKey => {
            const period = periods[periodKey];
            if (period) {
                ensureSpaceAndFormat(35); // Use the new helper
                doc.setFont(styles.fontFamily, 'bold');
                const periodName = periodKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                doc.text(`${periodName} (${period.cycle}): ${period.number}`, margin, yPos);
                yPos += 8;
                
                if (period.number_meaning) {
                    const numMeaning = period.number_meaning;
                    // Print title
                    doc.setFont(styles.fontFamily, 'bold');
                    doc.text(numMeaning.title || 'Meaning:', margin, yPos);
                    yPos += 8;
                    
                    // Print overview
                    if (numMeaning.overview) {
                        doc.setFont(styles.fontFamily, 'bold');
                        doc.text('Overview:', margin, yPos);
                        doc.setFont(styles.bodyFontFamily, 'normal');
                        const overviewLines = doc.splitTextToSize(numMeaning.overview, contentWidth);
                        // USE ARRAY INDEXING for renderContentBlock call
                        yPos = renderContentBlock(overviewLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                        addVerticalSpace(10);
                    }
                    
                    // Print core theme
                    if (numMeaning.core_theme) {
                        doc.setFont(styles.fontFamily, 'bold');
                        doc.text('Core Theme:', margin, yPos);
                        doc.setFont(styles.bodyFontFamily, 'normal');
                        doc.text(numMeaning.core_theme, margin + 30, yPos);
                        yPos += 8;
                    }
                    
                    // Print emotional focus
                    if (numMeaning.emotional_focus) {
                        doc.setFont(styles.fontFamily, 'bold');
                        doc.text('Emotional Focus:', margin, yPos);
                        doc.setFont(styles.bodyFontFamily, 'normal');
                        const focusLines = doc.splitTextToSize(numMeaning.emotional_focus, contentWidth);
                        // USE ARRAY INDEXING for renderContentBlock call
                        yPos = renderContentBlock(focusLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                        addVerticalSpace(10);
                    }
                    
                    // Print key opportunities (if it's an array)
                    if (Array.isArray(numMeaning.key_opportunities) && numMeaning.key_opportunities.length > 0) {
                        ensureSpaceAndFormat(20); // Ensure space for list
                        doc.setFont(styles.fontFamily, 'bold');
                        doc.text('Key Opportunities:', margin, yPos);
                        yPos += 8;
                        
                        doc.setFont(styles.bodyFontFamily, 'normal');
                        const oppLines = numMeaning.key_opportunities.map(item => `• ${item}`);
                        // USE ARRAY INDEXING for renderContentBlock call
                        yPos = renderContentBlock(oppLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                        addVerticalSpace(5); // Space after list
                    }
                    
                    // Print major lessons (if it's an array)
                    if (Array.isArray(numMeaning.major_lessons) && numMeaning.major_lessons.length > 0) {
                        ensureSpaceAndFormat(20); // Ensure space for list
                        doc.setFont(styles.fontFamily, 'bold');
                        doc.text('Major Lessons:', margin, yPos);
                        yPos += 8;
                        
                        doc.setFont(styles.bodyFontFamily, 'normal');
                        const lessonLines = numMeaning.major_lessons.map(item => `• ${item}`);
                        // USE ARRAY INDEXING for renderContentBlock call
                        yPos = renderContentBlock(lessonLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                        addVerticalSpace(5); // Space after list
                    }
                    
                    // Print spiritual growth tip
                    if (numMeaning.spiritual_growth_tip) {
                        doc.setFont(styles.fontFamily, 'bold');
                        doc.text('Spiritual Growth Tip:', margin, yPos);
                        doc.setFont(styles.bodyFontFamily, 'normal');
                        const tipLines = doc.splitTextToSize(numMeaning.spiritual_growth_tip, contentWidth);
                        // USE ARRAY INDEXING for renderContentBlock call
                        yPos = renderContentBlock(tipLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                        addVerticalSpace(10);
                    }
                    
                    // Print affirmation
                    if (numMeaning.affirmation) {
                        doc.setFont(styles.fontFamily, 'bold');
                        doc.text('Affirmation:', margin, yPos);
                        doc.setFont(styles.bodyFontFamily, 'italic'); // Use italic for affirmation
                        const affirmLines = doc.splitTextToSize(numMeaning.affirmation, contentWidth);
                        // USE ARRAY INDEXING for renderContentBlock call, including italic style
                        yPos = renderContentBlock(affirmLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'italic', textColor: secondaryColor, fontSize: styles.fontSize.body});
                        addVerticalSpace(10);
                    }
                }
                
                if (period.detailed_meaning) {
                    doc.setFont(styles.fontFamily, 'bold');
                    doc.text('Detailed:', margin, yPos);
                    doc.setFont(styles.bodyFontFamily, 'normal');
                    const detailLines = doc.splitTextToSize(period.detailed_meaning, contentWidth);
                    // USE ARRAY INDEXING for renderContentBlock call
                    yPos = renderContentBlock(detailLines, margin, yPos + 6, contentWidth, 6, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                    addVerticalSpace(10); // Space after detailed meaning
                }
            }
        });
    }
    

    addPageFooter();
    doc.addPage();
    currentPage++;
    yPos = margin;
    
    // ========== CHALLENGES ==========
    // USE ARRAY INDEXING for primary color
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Challenges & Life Lessons', margin, yPos);
    yPos += 12;
    
    const challenges = data['challenge_number'] || {};
    if (Object.keys(challenges).length > 0) {
        doc.setFontSize(styles.fontSize.subsectionHeader);
        doc.text('Challenge Numbers', margin, yPos);
        yPos += 10;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        // USE ARRAY INDEXING for secondary color
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(styles.fontSize.body);
        
        const chIntro = 'Challenge Numbers represent the obstacles and lessons you need to overcome in life.';
        const chIntroLines = doc.splitTextToSize(chIntro, contentWidth);
        // USE ARRAY INDEXING for renderContentBlock call
        yPos = renderContentBlock(chIntroLines, margin, yPos, contentWidth, 6, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
        addVerticalSpace(10); // Add space after intro
        
        // Process specific challenge types if they exist
        ['challenge_birth', 'challenge_life', 'challenge_love', 'challenge_death'].forEach(challengeKey => {
            const challenge = challenges[challengeKey];
            if (challenge) {
                ensureSpaceAndFormat(30); // Use the new helper
                doc.setFontSize(styles.fontSize.body);
                doc.setFont(styles.fontFamily, 'bold');
                const challengeName = challengeKey.replace('challenge_', '').replace(/\b\w/g, l => l.toUpperCase());
                doc.text(`Challenge of ${challengeName}: ${challenge.Challenge_number}`, margin, yPos);
                yPos += 8;
                
                if (challenge.Challenge_summary) {
                    doc.setFont(styles.fontFamily, 'bold');
                    doc.text('Summary:', margin, yPos);
                    doc.setFont(styles.bodyFontFamily, 'normal');
                    const summaryLines = doc.splitTextToSize(challenge.Challenge_summary, contentWidth);
                    // USE ARRAY INDEXING for renderContentBlock call
                    yPos = renderContentBlock(summaryLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                    addVerticalSpace(11); // Space after summary
                }
                
                if (challenge.detailed_meaning) {
                    const detMeaning = challenge.detailed_meaning;
                    // Print title
                    doc.setFont(styles.fontFamily, 'bold');
                    doc.text(detMeaning.title || 'Detailed Meaning:', margin, yPos);
                    yPos += 8;
                    
                    // Print overview
                    if (detMeaning.overview) {
                        doc.setFont(styles.fontFamily, 'bold');
                        doc.text('Overview:', margin, yPos);
                        doc.setFont(styles.bodyFontFamily, 'normal');
                        const overviewLines = doc.splitTextToSize(detMeaning.overview, contentWidth);
                        // USE ARRAY INDEXING for renderContentBlock call
                        yPos = renderContentBlock(overviewLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                        addVerticalSpace(10);
                    }
                    
                    // Print core lesson
                    if (detMeaning.core_lesson) {
                        doc.setFont(styles.fontFamily, 'bold');
                        doc.text('Core Lesson:', margin, yPos);
                        doc.setFont(styles.bodyFontFamily, 'normal');
                        const lessonLines = doc.splitTextToSize(detMeaning.core_lesson, contentWidth);
                        // USE ARRAY INDEXING for renderContentBlock call
                        yPos = renderContentBlock(lessonLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                        addVerticalSpace(10);
                    }
                    
                    // Print common manifestations (if it's an array)
                    if (Array.isArray(detMeaning.common_manifestations) && detMeaning.common_manifestations.length > 0) {
                        ensureSpaceAndFormat(20); // Ensure space for list
                        doc.setFont(styles.fontFamily, 'bold');
                        doc.text('Common Manifestations:', margin, yPos);
                        yPos += 8;
                        
                        doc.setFont(styles.bodyFontFamily, 'normal');
                        const manifLines = detMeaning.common_manifestations.map(item => `• ${item}`);
                        // USE ARRAY INDEXING for renderContentBlock call
                        yPos = renderContentBlock(manifLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                        addVerticalSpace(5); // Space after list
                    }
                    
                    // Print growth guidance (if it's an array)
                    if (Array.isArray(detMeaning.growth_guidance) && detMeaning.growth_guidance.length > 0) {
                        ensureSpaceAndFormat(20); // Ensure space for list
                        doc.setFont(styles.fontFamily, 'bold');
                        doc.text('Growth Guidance:', margin, yPos);
                        yPos += 8;
                        
                        doc.setFont(styles.bodyFontFamily, 'normal');
                        const guidLines = detMeaning.growth_guidance.map(item => `• ${item}`);
                        // USE ARRAY INDEXING for renderContentBlock call
                        yPos = renderContentBlock(guidLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                        addVerticalSpace(5); // Space after list
                    }
                    
                    // Print spiritual gift
                    if (detMeaning.spiritual_gift) {
                        doc.setFont(styles.fontFamily, 'bold');
                        doc.text('Spiritual Gift:', margin, yPos);
                        doc.setFont(styles.bodyFontFamily, 'normal');
                        const giftLines = doc.splitTextToSize(detMeaning.spiritual_gift, contentWidth);
                        // USE ARRAY INDEXING for renderContentBlock call
                        yPos = renderContentBlock(giftLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                        addVerticalSpace(10);
                    }
                    
                    // Print affirmation
                    if (detMeaning.affirmation) {
                        doc.setFont(styles.fontFamily, 'bold');
                        doc.text('Affirmation:', margin, yPos);
                        doc.setFont(styles.bodyFontFamily, 'italic'); // Use italic for affirmation
                        const affirmLines = doc.splitTextToSize(detMeaning.affirmation, contentWidth);
                        // USE ARRAY INDEXING for renderContentBlock call, including italic style
                        yPos = renderContentBlock(affirmLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'italic', textColor: secondaryColor, fontSize: styles.fontSize.body});
                        addVerticalSpace(10);
                    }
                }
            }
        });
    }
    
    // Define the paragraph for Challenges & Life Lessons
    const challengeParagraph = "Your Challenge Numbers highlight the obstacles and lessons that shape your personal growth. Each challenge reflects areas where you may face resistance or repeated patterns, guiding you to cultivate patience, resilience, and wisdom. By understanding these challenges, you can transform difficulties into opportunities, align with your true potential, and navigate life with greater awareness and clarity.";
    
    
    // Unique box sizing variables for this section
    const challengeBoxHeaderHeight = 15; // Header height
    const challengeBoxPadding = 10;      // Padding inside the box
    const challengeLineHeight = 6;       // Approximate height per line (for spacing paragraph)
    
    // Calculate total box height (approximation)
    const challengeTotalBoxHeight = challengeBoxHeaderHeight + (challengeParagraph.split('. ').length * challengeLineHeight) + (2 * challengeBoxPadding);
    
    ensureSpaceAndFormat(challengeTotalBoxHeight + 10); // Ensure space for box
    addVerticalSpace(8); // Space before box
    
    // Draw the box
    doc.setFillColor(lightPrimaryColor[0], lightPrimaryColor[1], lightPrimaryColor[2]);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(margin, yPos, contentWidth, challengeTotalBoxHeight, 3, 3, 'FD');
    
    // Position inside the box
    let challengeBoxYPos = yPos + challengeBoxPadding;
    
    // Header inside the box
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Challenges & Life Lessons', margin + 5, challengeBoxYPos);
    challengeBoxYPos += 12;
    
    // Add the paragraph inside the box
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    
    // Split paragraph into lines if needed for PDF width
    const challengeLines = doc.splitTextToSize(challengeParagraph, contentWidth - 16); // 8px padding on both sides
    for (const line of challengeLines) {
        doc.text(line, margin + 8, challengeBoxYPos);
        challengeBoxYPos += challengeLineHeight;
    }
    
    // Update yPos to after the box
    yPos += challengeTotalBoxHeight;
    addVerticalSpace(12);

        
    addPageFooter();
    doc.addPage();
    currentPage++;
    yPos = margin;
    
    // ========== ANNUAL CYCLES ==========
    // USE ARRAY INDEXING for primary color
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Annual & Monthly Cycles', margin, yPos);
    yPos += 12;
    
    // Personal Year
    const personalYear = data['personal_year'] || {};
    if (personalYear.personal_year_number) {
        doc.setFontSize(styles.fontSize.subsectionHeader);
        doc.text('Current Personal Year', margin, yPos);
        yPos += 10;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        // USE ARRAY INDEXING for secondary color
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(styles.fontSize.body);
        
        const pyIntro = 'The Personal Year represents the theme of the current year in your life.';
        const pyIntroLines = doc.splitTextToSize(pyIntro, contentWidth);
        // USE ARRAY INDEXING for renderContentBlock call
        yPos = renderContentBlock(pyIntroLines, margin, yPos, contentWidth, 6, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
        addVerticalSpace(8); // Add space after intro
        
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Personal Year Number: ' + personalYear.personal_year_number, margin, yPos);
        yPos += 8;
        
        if (personalYear.summary) {
            const summary = personalYear.summary;
            // Print title
            doc.setFont(styles.fontFamily, 'bold');
            doc.text(summary.title || 'Summary:', margin, yPos);
            yPos += 8;
            
            // Print overview
            if (summary.overview) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Overview:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'normal');
                const overviewLines = doc.splitTextToSize(summary.overview, contentWidth);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(overviewLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(10);
            }
            
            // Print core energy
            if (summary.core_energy) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Core Energy:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'normal');
                doc.text(summary.core_energy, margin + 30, yPos);
                yPos += 8;
            }
            
            // Print best actions (if it's an array)
            if (Array.isArray(summary.best_actions) && summary.best_actions.length > 0) {
                ensureSpaceAndFormat(20); // Ensure space for list
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Best Actions:', margin, yPos);
                yPos += 8;
                
                doc.setFont(styles.bodyFontFamily, 'normal');
                const actionLines = summary.best_actions.map(item => `• ${item}`);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(actionLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(5); // Space after list
            }
            
            // Print opportunities (if it's an array)
            if (Array.isArray(summary.opportunities) && summary.opportunities.length > 0) {
                ensureSpaceAndFormat(20); // Ensure space for list
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Opportunities:', margin, yPos);
                yPos += 8;
                
                doc.setFont(styles.bodyFontFamily, 'normal');
                const oppLines = summary.opportunities.map(item => `• ${item}`);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(oppLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(5); // Space after list
            }
            
            // Print challenges to master (if it's an array)
            if (Array.isArray(summary.challenges_to_master) && summary.challenges_to_master.length > 0) {
                ensureSpaceAndFormat(20); // Ensure space for list
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Challenges to Master:', margin, yPos);
                yPos += 8;
                
                doc.setFont(styles.bodyFontFamily, 'normal');
                const challLines = summary.challenges_to_master.map(item => `• ${item}`);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(challLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(5); // Space after list
            }
            
            // Print spiritual growth tip
            if (summary.spiritual_growth_tip) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Spiritual Growth Tip:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'normal');
                const tipLines = doc.splitTextToSize(summary.spiritual_growth_tip, contentWidth);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(tipLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(10);
            }
            
            // Print mantra
            if (summary.mantra) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Mantra:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'italic'); // Use italic for mantra
                const mantraLines = doc.splitTextToSize(summary.mantra, contentWidth);
                // USE ARRAY INDEXING for renderContentBlock call, including italic style
                yPos = renderContentBlock(mantraLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'italic', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(10);
            }
        }
        
        if (personalYear.detailed_meaning) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Detailed:', margin, yPos);
            doc.setFont(styles.bodyFontFamily, 'normal');
            const detailLines = doc.splitTextToSize(personalYear.detailed_meaning, contentWidth);
            // USE ARRAY INDEXING for renderContentBlock call
            yPos = renderContentBlock(detailLines, margin, yPos + 6, contentWidth, 6, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
            addVerticalSpace(10); // Space after detailed meaning
        }
    }
    
    ensureSpaceAndFormat(40); // Use the new helper
    
    // Personal Month
    const personalMonth = data['personal-month'] || {};
    if (personalMonth.personal_month_number) {
        // USE ARRAY INDEXING for primary color
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(styles.fontSize.subsectionHeader);
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Current Personal Month', margin, yPos);
        yPos += 10;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        // USE ARRAY INDEXING for secondary color
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(styles.fontSize.body);
        
        const pmIntro = 'The Personal Month represents the theme of the current month in your life.';
        const pmIntroLines = doc.splitTextToSize(pmIntro, contentWidth);
        // USE ARRAY INDEXING for renderContentBlock call
        yPos = renderContentBlock(pmIntroLines, margin, yPos, contentWidth, 6, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
        addVerticalSpace(8); // Add space after intro
        
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Personal Month Number: ' + personalMonth.personal_month_number, margin, yPos);
        yPos += 8;
        
        if (personalMonth.meaning) {
            const meaning = personalMonth.meaning;
            // Print title
            doc.setFont(styles.fontFamily, 'bold');
            doc.text(meaning.title || 'Meaning:', margin, yPos);
            yPos += 8;
            
            // Print overview
            if (meaning.overview) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Overview:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'normal');
                const overviewLines = doc.splitTextToSize(meaning.overview, contentWidth);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(overviewLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(10);
            }
            
            // Print core energy
            if (meaning.core_energy) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Core Energy:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'normal');
                doc.text(meaning.core_energy, margin + 30, yPos);
                yPos += 8;
            }
            
            // Print best actions (if it's an array)
            if (Array.isArray(meaning.best_actions) && meaning.best_actions.length > 0) {
                ensureSpaceAndFormat(20); // Ensure space for list
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Best Actions:', margin, yPos);
                yPos += 8;
                
                doc.setFont(styles.bodyFontFamily, 'normal');
                const actionLines = meaning.best_actions.map(item => `• ${item}`);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(actionLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(5); // Space after list
            }
            
            // Print opportunities this month (if it's an array)
            if (Array.isArray(meaning.opportunities_this_month) && meaning.opportunities_this_month.length > 0) {
                ensureSpaceAndFormat(20); // Ensure space for list
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Opportunities This Month:', margin, yPos);
                yPos += 8;
                
                doc.setFont(styles.bodyFontFamily, 'normal');
                const oppLines = meaning.opportunities_this_month.map(item => `• ${item}`);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(oppLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(5); // Space after list
            }
            
            // Print watch out (if it's an array)
            if (Array.isArray(meaning.watch_out) && meaning.watch_out.length > 0) {
                ensureSpaceAndFormat(20); // Ensure space for list
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Watch Out:', margin, yPos);
                yPos += 8;
                
                doc.setFont(styles.bodyFontFamily, 'normal');
                const warnLines = meaning.watch_out.map(item => `• ${item}`);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(warnLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(5); // Space after list
            }
            
            // Print spiritual growth tip
            if (meaning.spiritual_growth_tip) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Spiritual Growth Tip:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'normal');
                const tipLines = doc.splitTextToSize(meaning.spiritual_growth_tip, contentWidth);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(tipLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(10);
            }
            
            // Print affirmation
            if (meaning.affirmation) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Affirmation:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'italic'); // Use italic for affirmation
                const affirmLines = doc.splitTextToSize(meaning.affirmation, contentWidth);
                // USE ARRAY INDEXING for renderContentBlock call, including italic style
                yPos = renderContentBlock(affirmLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'italic', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(10);
            }
        }
        
        if (personalMonth.detailed_meaning) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Detailed:', margin, yPos);
            doc.setFont(styles.bodyFontFamily, 'normal');
            const detailLines = doc.splitTextToSize(personalMonth.detailed_meaning, contentWidth);
            // USE ARRAY INDEXING for renderContentBlock call
            yPos = renderContentBlock(detailLines, margin, yPos + 6, contentWidth, 6, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
            addVerticalSpace(10); // Space after detailed meaning
        }
    }
    
    ensureSpaceAndFormat(40); // Use the new helper
    
    // Personal Day
    const personalDay = data['personal-day'] || {};
    if (personalDay.personal_day_number) {
        // USE ARRAY INDEXING for primary color
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(styles.fontSize.subsectionHeader);
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Current Personal Day', margin, yPos);
        yPos += 10;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        // USE ARRAY INDEXING for secondary color
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(styles.fontSize.body);
        
        const pdIntro = 'The Personal Day represents the theme of the current day in your life.';
        const pdIntroLines = doc.splitTextToSize(pdIntro, contentWidth);
        // USE ARRAY INDEXING for renderContentBlock call
        yPos = renderContentBlock(pdIntroLines, margin, yPos, contentWidth, 6, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
        addVerticalSpace(8); // Add space after intro
        
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Personal Day Number: ' + personalDay.personal_day_number, margin, yPos);
        yPos += 8;
        
        if (personalDay.meaning) {
            const meaning = personalDay.meaning;
            // Print title
            doc.setFont(styles.fontFamily, 'bold');
            doc.text(meaning.title || 'Meaning:', margin, yPos);
            yPos += 8;
            
            // Print overview
            if (meaning.overview) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Overview:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'normal');
                const overviewLines = doc.splitTextToSize(meaning.overview, contentWidth);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(overviewLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(10);
            }
            
            // Print core energy
            if (meaning.core_energy) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Core Energy:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'normal');
                doc.text(meaning.core_energy, margin + 30, yPos);
                yPos += 8;
            }
            
            // Print best actions (if it's an array)
            if (Array.isArray(meaning.best_actions) && meaning.best_actions.length > 0) {
                ensureSpaceAndFormat(20); // Ensure space for list
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Best Actions:', margin, yPos);
                yPos += 8;
                
                doc.setFont(styles.bodyFontFamily, 'normal');
                const actionLines = meaning.best_actions.map(item => `• ${item}`);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(actionLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(5); // Space after list
            }
            
            // Print opportunities today (if it's an array)
            if (Array.isArray(meaning.opportunities_today) && meaning.opportunities_today.length > 0) {
                ensureSpaceAndFormat(20); // Ensure space for list
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Opportunities Today:', margin, yPos);
                yPos += 8;
                
                doc.setFont(styles.bodyFontFamily, 'normal');
                const oppLines = meaning.opportunities_today.map(item => `• ${item}`);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(oppLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(5); // Space after list
            }
            
            // Print watch out (if it's an array)
            if (Array.isArray(meaning.watch_out) && meaning.watch_out.length > 0) {
                ensureSpaceAndFormat(20); // Ensure space for list
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Watch Out:', margin, yPos);
                yPos += 8;
                
                doc.setFont(styles.bodyFontFamily, 'normal');
                const warnLines = meaning.watch_out.map(item => `• ${item}`);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(warnLines, margin + 5, yPos, contentWidth - 10, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(5); // Space after list
            }
            
            // Print spiritual growth tip
            if (meaning.spiritual_growth_tip) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Spiritual Growth Tip:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'normal');
                const tipLines = doc.splitTextToSize(meaning.spiritual_growth_tip, contentWidth);
                // USE ARRAY INDEXING for renderContentBlock call
                yPos = renderContentBlock(tipLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(10);
            }
            
            // Print affirmation
            if (meaning.affirmation) {
                doc.setFont(styles.fontFamily, 'bold');
                doc.text('Affirmation:', margin, yPos);
                doc.setFont(styles.bodyFontFamily, 'italic'); // Use italic for affirmation
                const affirmLines = doc.splitTextToSize(meaning.affirmation, contentWidth);
                // USE ARRAY INDEXING for renderContentBlock call, including italic style
                yPos = renderContentBlock(affirmLines, margin, yPos + 6, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'italic', textColor: secondaryColor, fontSize: styles.fontSize.body});
                addVerticalSpace(10);
            }
        }
        
        if (personalDay.detailed_meaning) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Detailed:', margin, yPos);
            doc.setFont(styles.bodyFontFamily, 'normal');
            const detailLines = doc.splitTextToSize(personalDay.detailed_meaning, contentWidth);
            // USE ARRAY INDEXING for renderContentBlock call
            yPos = renderContentBlock(detailLines, margin, yPos + 6, contentWidth, 6, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
            addVerticalSpace(10); // Space after detailed meaning
        }
    }
    
    // Define the tips for Annual & Monthly Cycles
    const cycleTips = [
        "Understand your current personal year to align goals and priorities.",
        "Plan major actions in months that match your personal month vibration.",
        "Use favorable personal day numbers to initiate important tasks.",
        "Track your energy patterns to anticipate challenges and opportunities.",
        "Adjust your routine to harmonize with your current numerological cycles.",
        "Reflect weekly on your alignment with your year and month themes.",
        "Leverage high-energy days for productivity, creativity, and growth.",
        "Use cycle awareness to improve decision-making and timing in life."
    ];
    
    // Unique box sizing variables for this section
    const cycleBoxHeaderHeight = 15; // Header text height
    const cycleTipLineHeight = 6;    // Height per tip line
    const cycleBoxPadding = 10;      // Padding inside the box
    
    // Total height for the box
    const cycleTotalBoxHeight = cycleBoxHeaderHeight + (cycleTips.length * cycleTipLineHeight) + (2 * cycleBoxPadding);
    
    ensureSpaceAndFormat(cycleTotalBoxHeight + 10); // Ensure space for box and padding
    addVerticalSpace(8); // Space before box
    
    // Draw the box
    doc.setFillColor(lightPrimaryColor[0], lightPrimaryColor[1], lightPrimaryColor[2]);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(margin, yPos, contentWidth, cycleTotalBoxHeight, 3, 3, 'FD');
    
    // Position inside the box
    let cycleBoxYPos = yPos + cycleBoxPadding;
    
    // Header inside the box
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Annual & Monthly Cycle Insights', margin + 5, cycleBoxYPos);
    cycleBoxYPos += 12; // Move down for tips
    
    // Add the tips inside the box
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    for (const tip of cycleTips) {
        doc.text('• ' + tip, margin + 8, cycleBoxYPos);
        cycleBoxYPos += cycleTipLineHeight;
    }
    
    // Update yPos to after the box
    yPos += cycleTotalBoxHeight;
    addVerticalSpace(12); // Space after the box

    addPageFooter();
    doc.addPage();
    currentPage++;
    yPos = margin;
    
    // ========== LIFE PATH JOURNEY ==========
    // USE ARRAY INDEXING for primary color
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Your Life Path Journey', margin, yPos);
    yPos += 12;
    
    doc.setFont(styles.bodyFontFamily, 'normal');
    // USE ARRAY INDEXING for secondary color
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(styles.fontSize.body);
    
    const journeyText = `Your life path is a unique journey that combines your core essence, major life cycles, and the challenges you encounter along the way. Understanding these elements provides a roadmap for navigating your life with greater awareness and purpose.
Your Life Path Number (${lifePath.life_path_number || 'N/A'}) sets the foundation for your journey, while the Pinnacle Cycles reveal the major themes that will dominate different phases of your life. The Period Cycles show the broader patterns that shape your development across decades.
The current Personal Year, Month, and Day provide insights into the immediate energies influencing your life. These cyclical patterns work together to create the unique tapestry of your life experience.
Remember that while these cycles provide guidance, you always have the power to shape your destiny through your choices and actions. The numbers reveal patterns and tendencies, but your free will and conscious awareness are the keys to creating the life you desire.`;
    
    const journeyLines = doc.splitTextToSize(journeyText, contentWidth);
    // USE ARRAY INDEXING for renderContentBlock call
    yPos = renderContentBlock(journeyLines, margin, yPos, contentWidth, 5, {fontFamily: styles.bodyFontFamily, fontStyle: 'normal', textColor: secondaryColor, fontSize: styles.fontSize.body});
    addVerticalSpace(15);
    
    ensureSpaceAndFormat(30); // Use the new helper
    
    addVerticalSpace(15);
    doc.setFont(styles.bodyFontFamily, 'italic');
    doc.setTextColor(...accentColor);
    doc.setFontSize(styles.fontSize.body + 1);
    const wisdomQuote = '"Your life path is not a destination but a journey of continuous growth and discovery. Embrace each cycle as an opportunity to evolve and fulfill your highest potential."';
    const quoteLines = doc.splitTextToSize(wisdomQuote, contentWidth - 40);
    doc.text(quoteLines, pageWidth / 2, yPos, { align: 'center', maxWidth: contentWidth - 40 });
    
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

// Make function globally accessible - CRITICAL: Name must match popup.js call
window.createLifePathPDF = createLifePathPDF; // Name matches the function definition above