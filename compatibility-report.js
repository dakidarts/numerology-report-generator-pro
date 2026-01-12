// Updated Compatibility Report PDF generation with sequential flow and ALL details
async function createCompatibilityPDF(data, clientData, customization, template = null) {
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
        
        if (settings.practitionerName) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text(settings.practitionerName + ' ', margin, footerY);
            
            if (settings.practitionerWebsite) {
                doc.setFont(styles.fontFamily, 'normal');
                const nameWidth = doc.getTextWidth(settings.practitionerName);
                doc.text('•  ' + settings.practitionerWebsite.replace(/^https?:\/\//, ''), margin + nameWidth + 3, footerY);
            }
        }
        
        const pageText = `Page ${currentPage}`;
        doc.text(pageText, pageWidth - margin, footerY, { align: 'right' });
    };

    // Draw compatibility chart function (with label wrapping)
    const drawCompatibilityChart = (scores, startY) => {
        const chartHeight = 60;
        const chartWidth = contentWidth - 20;
        const barWidth = chartWidth / Object.keys(scores).length;
        const maxScore = 100;
        const labelFontSize = 7; // Font size for labels
        
        let xPos = margin + 10;
        
        Object.entries(scores).forEach(([key, value]) => {
            if (typeof value !== 'number') return; // Skip non-numeric values
            
            const barHeight = (value / maxScore) * chartHeight;
            const barY = startY + chartHeight - barHeight;
            
            doc.setFillColor(...primaryColor);
            doc.rect(xPos, barY, barWidth - 5, barHeight, 'F');
            
            // Add score number inside the bar (white text)
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255); // White text on bars
            doc.text(value.toString(), xPos + (barWidth - 5) / 2, barY + (barHeight / 2) + 2, { align: 'center' });
            
            // Prepare label for wrapping
            doc.setFontSize(labelFontSize);
            doc.setTextColor(...secondaryColor); // Black text for labels
            const labelParts = key.replace(/_/g, ' ').split(' '); // Split label by space
            const labelLines = [];
            let currentLine = '';
            
            for (const part of labelParts) {
                const testLine = currentLine ? `${currentLine} ${part}` : part;
                const testLineWidth = doc.getTextWidth(testLine);
                
                if (testLineWidth <= (barWidth - 5)) {
                    currentLine = testLine;
                } else {
                    if (currentLine) labelLines.push(currentLine);
                    currentLine = part;
                }
            }
            if (currentLine) labelLines.push(currentLine);
            
            // Draw label lines below the bar
            let labelY = startY + chartHeight + 5; // Starting Y for the first label line
            for (const line of labelLines) {
                // Calculate X position to center the specific line within the bar
                const lineWidth = doc.getTextWidth(line);
                const lineX = xPos + (barWidth - 5) / 2; 
                doc.text(line, lineX, labelY, { align: 'center' }); // Use align: 'center'
                labelY += labelFontSize * 0.8; // Adjust line height based on font size
            }
            
            xPos += barWidth;
        });
        
        return chartHeight + 15 + (labelFontSize * 0.8 * 2); // Add extra space for potentially 2 lines of labels
    };

    doc.setFillColor(...backgroundColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 80, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(styles.fontSize.title);
    doc.setFont(styles.fontFamily, 'bold');
    const title = customization.title || 'Relationship Compatibility Report';
    doc.text(title, pageWidth / 2, 35, { align: 'center', maxWidth: contentWidth - 20 });
    
    yPos = 50;
    doc.setFontSize(14);
    doc.text('A Comprehensive Analysis of Two Souls\' Connection', pageWidth / 2, yPos, { align: 'center' });
    
    yPos = 105;
    
    const boxHeight = 70;
    doc.setFillColor(...lightPrimaryColor);
    doc.setDrawColor(...primaryColor);
    doc.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'FD');
    
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(styles.fontSize.body);
    
    const compatData = data['compatibility-score'] || {};
    const person1 = compatData.person_1 || {};
    const person2 = compatData.person_2 || {};
    const scores = compatData.compatibility_scores || {};
    
    // --- START: Aligned Cover Details (Fixed DOB Layout) ---
    let detailYPos = yPos + 12; // Starting Y position for details
    const detailSpacing = 10; // Vertical space between detail lines
    const labelX = margin + 10; // X position for labels
    const valueX = margin + 60; // X position for values (aligned)
    
    // Person 1 Full Name
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Person 1:', labelX, detailYPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(person1.full_name || clientData.person1Name || 'N/A', valueX, detailYPos);
    detailYPos += detailSpacing; // Move to next line

    // Person 1 DOB
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('DOB:', labelX, detailYPos); // Use 'DOB:' for brevity
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(person1.dob || clientData.person1Dob || 'N/A', valueX, detailYPos);
    detailYPos += detailSpacing; // Move to next line

    // Person 2 Full Name
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Person 2:', labelX, detailYPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(person2.full_name || clientData.person2Name || 'N/A', valueX, detailYPos);
    detailYPos += detailSpacing; // Move to next line

    // Person 2 DOB
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('DOB:', labelX, detailYPos); // Use 'DOB:' for brevity
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(person2.dob || clientData.person2Dob || 'N/A', valueX, detailYPos);
    detailYPos += detailSpacing; // Move to next line

    // Overall Score
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Overall Score:', labelX, detailYPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(`${scores.overall_score || 'N/A'}/100`, valueX, detailYPos);
    detailYPos += detailSpacing; // Move to next line

    // Generated Date
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
    doc.setTextColor(...accentColor);
    const introText = 'This report analyzes relationship dynamics through numerological profiles.';
    doc.text(introText, pageWidth / 2, centerY, { align: 'center', maxWidth: contentWidth });
    
    addPageFooter();
    doc.addPage();
    currentPage++;
    yPos = margin;
    
    // ========== OVERALL COMPATIBILITY ==========
    doc.setTextColor(...primaryColor);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Overall Compatibility', margin, yPos);
    yPos += 12;
    
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(styles.fontSize.body);
    
    doc.setFont(styles.fontFamily, 'bold');
    doc.text(`Overall Score: ${scores.overall_score || 'N/A'}/100`, margin, yPos);
    yPos += 10;
    
    if (scores.overall_insight) {
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Insight:', margin, yPos);
        doc.setFont(styles.bodyFontFamily, 'normal');
        const insightLines = doc.splitTextToSize(scores.overall_insight, contentWidth);
        doc.text(insightLines, margin, yPos + 6);
        yPos += insightLines.length * 5 + 15;
    }
    
    // Compatibility Chart
    addVerticalSpace(10);
    doc.setTextColor(...primaryColor);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Compatibility Breakdown', margin, yPos);
    yPos += 10;
    
    const scoreData = {
        'Life Path': scores.life_path_score,
        'Destiny': scores.destiny_number_score,
        'Heart': scores.heart_desire_score,
        'Personality': scores.personality_score,
        'Attitude': scores.attitude_number_score,
        'Hidden Passion': scores.hidden_passion_score,
        'Subconscious': scores.subconscious_self_score,
        'Rational Thought': scores.rational_thought_score
    };
    
    const filteredScores = Object.fromEntries(
        Object.entries(scoreData).filter(([k, v]) => typeof v === 'number')
    );
    
    if (Object.keys(filteredScores).length > 0) {
        ensureSpace(80); // Ensure space for chart
        yPos += drawCompatibilityChart(filteredScores, yPos);
    }
    
    // ========== DETAILED ANALYSIS ==========
    addVerticalSpace(8); // Section break
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Detailed Compatibility Analysis', margin, yPos);
    yPos += 12;
    
    const analyses = [
        { title: 'Life Path Compatibility', p1Key: 'life_path', p2Key: 'life_path', scoreKey: 'life_path_score', desc: 'Life Path compatibility indicates how well core life purposes align.' },
        { title: 'Destiny Number Compatibility', p1Key: 'destiny_number', p2Key: 'destiny_number', scoreKey: 'destiny_number_score', desc: 'Destiny Number compatibility shows alignment of potential and life missions.' },
        { title: 'Heart\'s Desire Compatibility', p1Key: 'heart_desire', p2Key: 'heart_desire', scoreKey: 'heart_desire_score', desc: 'Heart\'s Desire compatibility reveals alignment of inner motivations and desires.' },
        { title: 'Personality Compatibility', p1Key: 'personality', p2Key: 'personality', scoreKey: 'personality_score', desc: 'Personality compatibility shows alignment of outer expressions and social interactions.' },
        { title: 'Attitude Number Compatibility', p1Key: 'attitude_number', p2Key: 'attitude_number', scoreKey: 'attitude_number_score', desc: 'Attitude Number compatibility reflects how you approach daily life and challenges.' },
        { title: 'Hidden Passion Compatibility', p1Key: 'hidden_passion', p2Key: 'hidden_passion', scoreKey: 'hidden_passion_score', desc: 'Hidden Passion compatibility shows shared deep drives and motivations.' },
        { title: 'Subconscious Self Compatibility', p1Key: 'subconscious_self_number', p2Key: 'subconscious_self_number', scoreKey: 'subconscious_self_score', desc: 'Subconscious Self compatibility reveals unconscious patterns and reactions.' },
        { title: 'Rational Thought Compatibility', p1Key: 'rational_thought_number', p2Key: 'rational_thought_number', scoreKey: 'rational_thought_score', desc: 'Rational Thought compatibility shows how you process and analyze information.' }
    ];
    
    for (const analysis of analyses) {
        const scoreValue = scores[analysis.scoreKey];
        if (typeof scoreValue !== 'number') continue; // Skip if no score
        
        ensureSpace(40); // Ensure space for analysis block
        
        doc.setTextColor(...primaryColor);
        doc.setFontSize(styles.fontSize.subsectionHeader);
        doc.setFont(styles.fontFamily, 'bold');
        doc.text(analysis.title, margin, yPos);
        yPos += 10;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(styles.fontSize.body);
        
        doc.setFont(styles.fontFamily, 'bold');
        doc.text(`Person 1: ${person1[analysis.p1Key] || 'N/A'}`, margin, yPos);
        yPos += 6;
        doc.text(`Person 2: ${person2[analysis.p2Key] || 'N/A'}`, margin, yPos);
        yPos += 6;
        doc.text(`Score: ${scoreValue}/100`, margin, yPos);
        yPos += 10;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        const descLines = doc.splitTextToSize(analysis.desc, contentWidth);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 5 + 15;
    }
    
    // ========== HOROSCOPE COMPATIBILITY ==========
    // Dynamically identify all horoscope compatibility keys in the data object
    const allDataKeys = Object.keys(data);
    const horoscopeKeys = allDataKeys.filter(key => key.startsWith('horoscope/compatibility/'));
    
    for (const horoscopeKey of horoscopeKeys) {
        const horoData = data[horoscopeKey] || {};
        
        // Skip if the data object is empty or only contains metadata
        if (Object.keys(horoData).length <= 1 && horoData._api_metadata_) continue; 

        // Derive a title from the key if not explicitly defined elsewhere or if it's a new type
        const keyParts = horoscopeKey.split('/');
        const category = keyParts[keyParts.length - 1]; // e.g., 'love', 'career', 'lifestyle'
        const title = category.charAt(0).toUpperCase() + category.slice(1) + ' Compatibility'; 

        // --- NEW FIX: ESTIMATE HEIGHT AND FORCE NEW PAGE IF NEEDED ---
        // Estimate the height required for the main header block (Title, Match For, Score, Summary)
        let estimatedHeight = 12; // Space for title
        if (horoData.match_for || (horoData.sign_main && horoData.sign_partner)) estimatedHeight += 10; // Match For line
        if (horoData.compatibility_score) estimatedHeight += 10; // Score line
        if (horoData.match_summary) {
            const summaryLines = doc.splitTextToSize(horoData.match_summary, contentWidth);
            estimatedHeight += (summaryLines.length * 5) + 15; // Summary lines + padding
        }
        // Add some buffer space
        estimatedHeight += 20; 

        ensureSpace(estimatedHeight); // This will force a new page if needed based on the estimate
        // --- END NEW FIX ---

        addVerticalSpace(15); // Section break (now happens after ensureSpace)
        
        doc.setTextColor(...primaryColor);
        doc.setFontSize(styles.fontSize.sectionHeader);
        doc.setFont(styles.fontFamily, 'bold');
        doc.text(title, margin, yPos);
        yPos += 12;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(styles.fontSize.body);

        // Try to print a general identifier if available
        if (horoData.match_for) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Match For:', margin, yPos);
            doc.setFont(styles.bodyFontFamily, 'normal');
            doc.text(horoData.match_for, margin + 30, yPos);
            yPos += 10;
        } else if (horoData.sign_main && horoData.sign_partner) {
             // Fallback if match_for isn't present but sign info is
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Signs:', margin, yPos);
            doc.setFont(styles.bodyFontFamily, 'normal');
            doc.text(`${horoData.sign_main} & ${horoData.sign_partner}`, margin + 30, yPos);
            yPos += 10;
        }
        
        // Print score if available
        if (horoData.compatibility_score) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text(`Score: ${horoData.compatibility_score}/100`, margin, yPos);
            yPos += 10;
        }
        
        // Print summary if available
        if (horoData.match_summary) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Summary:', margin, yPos);
            doc.setFont(styles.bodyFontFamily, 'normal');
            const summaryLines = doc.splitTextToSize(horoData.match_summary, contentWidth);
            doc.text(summaryLines, margin, yPos + 6);
            yPos += summaryLines.length * 5 + 15;
        }
        
        // Process ALL keys from the horoscope data object, excluding metadata
        const metadataKeys = ['_api_metadata_']; // Keep only _api_metadata_
        const dataKeys = Object.keys(horoData).filter(k => !metadataKeys.includes(k));
        
        for (const dataKey of dataKeys) {
            const value = horoData[dataKey];
            
            // Skip if value is null, undefined, or an empty string/array
            if (value == null || value === '') continue;
            if (Array.isArray(value) && value.length === 0) continue;
            
            ensureSpace(15); // Ensure space for each data block
            
            // Ensure consistent font size for section titles
            doc.setFontSize(styles.fontSize.subsectionHeader);
            doc.setFont(styles.fontFamily, 'bold');
            const sectionTitle = dataKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            doc.text(`${sectionTitle}:`, margin, yPos);
            yPos += 8;
            
            // Ensure consistent font size for content BEFORE processing the value
            doc.setFontSize(styles.fontSize.body);
            doc.setFont(styles.bodyFontFamily, 'normal');
            doc.setTextColor(...secondaryColor); // Ensure text color is set
            
            if (Array.isArray(value)) {
                // Handle array values (e.g., strengths, challenges)
                for (const item of value) {
                    // Check for page break BEFORE adding the list item
                    if (yPos > pageHeight - 30) { // Leave space for footer and some buffer
                        addPageFooter();
                        doc.addPage();
                        currentPage++;
                        yPos = margin;
                        // Reapply consistent formatting after new page - CRITICAL FOR LISTS
                        doc.setFontSize(styles.fontSize.body);
                        doc.setFont(styles.bodyFontFamily, 'normal');
                        doc.setTextColor(...secondaryColor);
                    }
                    
                    ensureSpace(10); // Ensure space for list item
                    const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 10);
                    doc.text(lines, margin + 5, yPos);
                    yPos += lines.length * 5 + 3;
                }
            } else {
                // Handle string/object values
                const valueStr = typeof value === 'string' ? value : JSON.stringify(value); // Fallback for unexpected types
                const valueLines = doc.splitTextToSize(valueStr, contentWidth);
                
                // Write value lines with automatic page breaks
                for (let i = 0; i < valueLines.length; i++) {
                    if (yPos > pageHeight - 30) { // Leave space for footer and some buffer
                        addPageFooter();
                        doc.addPage();
                        currentPage++;
                        yPos = margin;
                        // Reapply consistent formatting after new page
                        doc.setFontSize(styles.fontSize.body);
                        doc.setFont(styles.bodyFontFamily, 'normal');
                        doc.setTextColor(...secondaryColor);
                    }
                    doc.text(valueLines[i], margin, yPos);
                    yPos += 6; // Line height
                }
            }
            
            yPos += 5; // Space after the block
        }
    }
    
    // ========== STRENGTHS & CHALLENGES (from numerology scores) ==========
    addVerticalSpace(15); // Section break
    ensureSpace(40); // Ensure space for strengths/challenges block
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Relationship Strengths & Challenges (from Numerology)', margin, yPos);
    yPos += 12;
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.text('Strengths', margin, yPos);
    yPos += 10;
    
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(styles.fontSize.body);
    
    const highScores = Object.entries(scores).filter(([k, v]) => typeof v === 'number' && v >= 80);
    if (highScores.length > 0) {
        for (const [key, value] of highScores) {
            ensureSpace(10); // Ensure space for list item
            const name = key.replace(/_score$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const text = `• ${name} (${value}/100): Strong alignment in this area.`;
            const lines = doc.splitTextToSize(text, contentWidth - 10);
            doc.text(lines, margin + 5, yPos);
            yPos += lines.length * 5 + 3;
        }
    } else {
        doc.text('• Moderate compatibility across all numerology areas.', margin + 5, yPos);
        yPos += 8;
    }
    
    addVerticalSpace(10);
    ensureSpace(40); // Ensure space for challenges block
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(styles.fontSize.subsectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Challenges', margin, yPos);
    yPos += 10;
    
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(styles.fontSize.body);
    
    const lowScores = Object.entries(scores).filter(([k, v]) => typeof v === 'number' && v <= 40);
    if (lowScores.length > 0) {
        for (const [key, value] of lowScores) {
            ensureSpace(10); // Ensure space for list item
            const name = key.replace(/_score$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const text = `• ${name} (${value}/100): May require extra attention.`;
            const lines = doc.splitTextToSize(text, contentWidth - 10);
            doc.text(lines, margin + 5, yPos);
            yPos += lines.length * 5 + 3;
        }
    } else {
        doc.text('• Balanced compatibility with no significant challenges from numerology scores.', margin + 5, yPos);
        yPos += 8;
    }
    
    addVerticalSpace(15);
    ensureSpace(30); // Ensure space for quote
    
    doc.setFont(styles.bodyFontFamily, 'italic');
    doc.setTextColor(...accentColor);
    doc.setFontSize(styles.fontSize.body + 1);
    const wisdomQuote = '"True compatibility comes from appreciating and complementing each other\'s differences. The strongest relationships are built on mutual respect, understanding, and growth."';
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

window.createCompatibilityPDF = createCompatibilityPDF;