// Updated Business Analysis Report PDF generation
async function createBusinessPDF(data, clientData, customization, template = null) {
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

    doc.setFillColor(...backgroundColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 80, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(styles.fontSize.title);
    doc.setFont(styles.fontFamily, 'bold');
    const title = customization.title || 'Business Numerology Analysis';
    doc.text(title, pageWidth / 2, 35, { align: 'center', maxWidth: contentWidth - 20 });
    
    yPos = 50;
    doc.setFontSize(14);
    doc.text('Unlock the Power of Numbers for Your Business', pageWidth / 2, yPos, { align: 'center' });
    
    yPos = 105;
    
    const boxHeight = 53;
    doc.setFillColor(...lightPrimaryColor);
    doc.setDrawColor(...primaryColor);
    doc.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'FD');
    
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(styles.fontSize.body);
    
    yPos += 12;
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Business Name:', margin + 10, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(clientData.businessName || 'N/A', margin + 55, yPos);
    
    yPos += 10;
    if (clientData.phoneNumber) {
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Phone Number:', margin + 10, yPos);
        doc.setFont(styles.bodyFontFamily, 'normal');
        doc.text(clientData.phoneNumber, margin + 55, yPos);
        yPos += 10;
    }
    
    if (clientData.email) {
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Email:', margin + 10, yPos);
        doc.setFont(styles.bodyFontFamily, 'normal');
        doc.text(clientData.email, margin + 55, yPos);
        yPos += 10;
    }
    
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Generated:', margin + 10, yPos);
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.text(new Date().toLocaleDateString(), margin + 55, yPos);
    
    yPos += 20;
    
    // Calculate center position between box and footer
    const remainingSpace = pageHeight - yPos - 40; // 40 for footer space
    const centerY = yPos + (remainingSpace / 2);
    
    doc.setFontSize(styles.fontSize.body);
    doc.setFont(styles.bodyFontFamily, 'italic');
    doc.setTextColor(...accentColor);
    const introText = 'This report analyzes the numerological vibrations of your business.';
    doc.text(introText, pageWidth / 2, centerY, { align: 'center', maxWidth: contentWidth });
    
    addPageFooter();
    doc.addPage();
    currentPage++;
    yPos = margin;
    
    // Business Name Analysis (using updated gematria structure)
    const nameData = data['gematria'] || {};
    if (nameData.text) {
        doc.setTextColor(...primaryColor);
        doc.setFontSize(styles.fontSize.sectionHeader);
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Business Name Analysis', margin, yPos);
        yPos += 12;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(styles.fontSize.body);
        
        const intro = 'Your business name carries unique vibrational frequencies calculated through various numerological systems.';
        const introLines = doc.splitTextToSize(intro, contentWidth);
        doc.text(introLines, margin, yPos);
        yPos += introLines.length * 6 + 10;
        
        doc.setFont(styles.fontFamily, 'bold');
        doc.text(`Business Name: ${nameData.text}`, margin, yPos);
        yPos += 10;
        
        // Iterate through available systems in the new structure
        const systems = nameData.systems || {};
        for (const [systemName, systemData] of Object.entries(systems)) {
             // Skip empty systems like standard_hebrew in the example
            if (!systemData.total && !systemData.interpretation) continue;
            
            // Capitalize system name for display
            const displayName = systemName.charAt(0).toUpperCase() + systemName.slice(1).replace(/_/g, ' ');
            
            doc.setFont(styles.fontFamily, 'bold');
            doc.text(`${displayName}:`, margin, yPos);
            yPos += 8; // Move down for the number
            
            // Add the number in BOLD
            doc.setFont(styles.fontFamily, 'bold'); // Set to bold
            doc.text(systemData.total?.toString() || 'N/A', margin, yPos);
            yPos += 8; // Move down for the interpretation
            
            // Add interpretation in normal font
            doc.setFont(styles.bodyFontFamily, 'normal'); // Reset to normal
            if (systemData.interpretation) {
                const interpLines = doc.splitTextToSize(`Interpretation: ${systemData.interpretation}`, contentWidth);
                doc.text(interpLines, margin, yPos);
                yPos += interpLines.length * 5 + 5;
            }
        }
        
        // --- NEW: Tip for choosing a better business name box ---
        // Define the tips
        const nameTips = [
            "Research numerological meanings of potential names.",
            "Consider the Pythagorean, Chaldean, and Kabbalah systems.",
            "Ensure the name's total reduces to a favorable number.",
            "Check how the name sounds and feels when spoken aloud.",
            "Align the name's energy with your business goals."
        ];
        
        // Calculate height needed for the box content
        const tipBoxHeaderHeight = 15; // Approximate height for the header text
        const tipLineHeight = 6; // Approximate height for each tip line
        const tipBoxPadding = 10; // Padding inside the box
        const totalTipBoxHeight = tipBoxHeaderHeight + (nameTips.length * tipLineHeight) + (2 * tipBoxPadding);
        
        ensureSpace(totalTipBoxHeight + 10); // Ensure space for box and padding
        addVerticalSpace(8); // Add space before the box
        
        // Draw the box
        doc.setFillColor(...lightPrimaryColor);
        doc.setDrawColor(...primaryColor);
        doc.roundedRect(margin, yPos, contentWidth, totalTipBoxHeight, 3, 3, 'FD');
        
        // Position inside the box
        let boxYPos = yPos + tipBoxPadding;
        
        // Add the header text inside the box
        doc.setFontSize(styles.fontSize.subsectionHeader);
        doc.setFont(styles.fontFamily, 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('Tip for choosing a better business name', margin + 5, boxYPos);
        boxYPos += 12; // Move down for the tips
        
        // Add the tips inside the box
        doc.setFontSize(styles.fontSize.body);
        doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
        for (const tip of nameTips) {
            doc.text('• ' + tip, margin + 8, boxYPos);
            boxYPos += tipLineHeight;
        }
        
        // Update yPos to after the box
        yPos += totalTipBoxHeight;
        addVerticalSpace(12); // Add space after the box
    }
    
    // ... (rest of the phone number analysis section remains the same)
    yPos += 15;
    ensureSpace(40); // Use the new helper
    
    // Phone Number Analysis (unchanged structure handled correctly)
    const phoneData = data['analyze_phone'] || {};
    if (phoneData.phone_number) {
        doc.setTextColor(...primaryColor);
        doc.setFontSize(styles.fontSize.sectionHeader);
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Phone Number Analysis', margin, yPos);
        yPos += 12;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(styles.fontSize.body);
        
        const phoneIntro = 'Your business phone number influences customer connections and communication flow.';
        const phoneIntroLines = doc.splitTextToSize(phoneIntro, contentWidth);
        doc.text(phoneIntroLines, margin, yPos);
        yPos += phoneIntroLines.length * 6 + 10;
        
        doc.setFont(styles.fontFamily, 'bold');
        doc.text(`Phone Number: ${phoneData.phone_number}`, margin, yPos);
        yPos += 10;
        
        if (phoneData.phone_overall_vibration) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text(`Overall Vibration: ${phoneData.phone_overall_vibration}`, margin, yPos);
            yPos += 8;
        }
        
        if (phoneData.phone_vibration_description) {
            doc.setFont(styles.fontFamily, 'bold');
            doc.text(`Description: ${phoneData.phone_vibration_description}`, margin, yPos);
            yPos += 10;
        }
        
        if (phoneData.overall_minor_numbers && phoneData.overall_minor_numbers.length > 0) {
            ensureSpace(30); // Use the new helper
            doc.setFont(styles.fontFamily, 'bold');
            doc.text('Number Breakdown:', margin, yPos);
            yPos += 8;
            
            doc.setFont(styles.bodyFontFamily, 'normal');
            for (let i = 0; i < phoneData.overall_minor_numbers.length; i++) {
                const minor = phoneData.overall_minor_numbers[i];
                
                // Check for page break before adding the item
                if (yPos > pageHeight - 30) { // Leave space for footer and some buffer
                    addPageFooter();
                    doc.addPage();
                    currentPage++;
                    yPos = margin;
                    // Reapply consistent formatting after new page
                    doc.setFontSize(styles.fontSize.body); // Explicitly set font size again
                    doc.setFont(styles.bodyFontFamily, 'normal');
                    doc.setTextColor(...secondaryColor);
                    doc.setFont(styles.fontFamily, 'bold'); // Reapply bold for "Number Breakdown:"
                    doc.text('Number Breakdown:', margin, yPos);
                    yPos += 8;
                    doc.setFont(styles.bodyFontFamily, 'normal'); // Reset to normal for list items
                }
                
                ensureSpace(15); // Use the new helper for individual items
                const text = `• Number ${minor.number}: [ ${minor.description} ] - ${minor.occurrence} occurrence(s) (${minor.percentage}%)`;
                const lines = doc.splitTextToSize(text, contentWidth - 10);
                doc.text(lines, margin + 5, yPos);
                yPos += lines.length * 5 + 3;
            }
            yPos += 10;
        }
    }
    
    // Check if Email Analysis will fit, otherwise start on a new page
    const emailData = data['email-numerology'] || {};
    if (emailData.email) { // Check for the new root field
        // Estimate height for email section
        const emailSectionEstHeight = 100; // Approximate minimum height
        
        if (yPos + emailSectionEstHeight > pageHeight - 20) {
            addPageFooter();
            doc.addPage();
            currentPage++;
            yPos = margin;
        } else {
            addVerticalSpace(15); // Add space if staying on same page
        }
        
        doc.setTextColor(...primaryColor);
        doc.setFontSize(styles.fontSize.sectionHeader);
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Email Analysis', margin, yPos);
        yPos += 12;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(styles.fontSize.body);
        
        const emailIntro = 'Your business email carries energetic vibrations that affect digital communications.';
        const emailIntroLines = doc.splitTextToSize(emailIntro, contentWidth);
        doc.text(emailIntroLines, margin, yPos);
        yPos += emailIntroLines.length * 6 + 10;
        
        doc.setFont(styles.fontFamily, 'bold');
        doc.text(`Email Address: ${emailData.email}`, margin, yPos); // Updated field
        yPos += 8;
        
        doc.setFont(styles.fontFamily, 'bold');
        doc.text(`Email Number: ${emailData.email_number}`, margin, yPos); // Updated field
        yPos += 8;
        
        // Use the detailed meaning for the main description
        if (emailData.detailed_meaning) {
            doc.setFont(styles.bodyFontFamily, 'normal');
            const meaningLines = doc.splitTextToSize(emailData.detailed_meaning, contentWidth);
            
            // Write detailed meaning with automatic page breaks
            for (let i = 0; i < meaningLines.length; i++) {
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
                doc.text(meaningLines[i], margin, yPos);
                yPos += 6; // Line height
            }
            addVerticalSpace(10); // Space after detailed meaning
        } else if (emailData.meaning && typeof emailData.meaning === 'object') {
            // Fallback to object structure if detailed_meaning isn't available
            const overview = emailData.meaning.overview;
            if (overview) {
                const overviewLines = doc.splitTextToSize(overview, contentWidth);
                doc.text(overviewLines, margin, yPos);
                yPos += overviewLines.length * 6 + 8;
            }
        }
    }

    // Cornerstone Letter Analysis (NEW SECTION)
    const cornerstoneData = data['cornerstone-letter'] || {};
    if (cornerstoneData.cornerstone_letter) {
        ensureSpace(40); // Use the new helper
        addVerticalSpace(10); // Add some space before the section
        
        doc.setTextColor(...primaryColor);
        doc.setFontSize(styles.fontSize.sectionHeader);
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Cornerstone Letter Analysis', margin, yPos);
        yPos += 12;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(styles.fontSize.body);
        
        const cornerstoneIntro = 'Your business name\'s Cornerstone letter (first letter of the first name) sets the tone for how you initiate and approach new beginnings.';
        const cornerstoneIntroLines = doc.splitTextToSize(cornerstoneIntro, contentWidth);
        doc.text(cornerstoneIntroLines, margin, yPos);
        yPos += cornerstoneIntroLines.length * 6 + 10;
        
        doc.setFont(styles.fontFamily, 'bold');
        doc.text(`Cornerstone Letter: ${cornerstoneData.cornerstone_letter}`, margin, yPos);
        yPos += 8;
        
        // Use the detailed meaning for the main description
        if (cornerstoneData.detailed_meaning) {
            doc.setFont(styles.bodyFontFamily, 'normal');
            const meaningLines = doc.splitTextToSize(cornerstoneData.detailed_meaning, contentWidth);
            
            // Write detailed meaning with automatic page breaks
            for (let i = 0; i < meaningLines.length; i++) {
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
                doc.text(meaningLines[i], margin, yPos);
                yPos += 6; // Line height
            }
            addVerticalSpace(10); // Space after detailed meaning
        } else if (cornerstoneData.meaning && typeof cornerstoneData.meaning === 'object') {
            // Fallback to object structure if detailed_meaning isn't available
            const overview = cornerstoneData.meaning.overview;
            if (overview) {
                const overviewLines = doc.splitTextToSize(overview, contentWidth);
                doc.text(overviewLines, margin, yPos);
                yPos += overviewLines.length * 6 + 8;
            }
        }
    }

    // Capstone Letter Analysis (NEW SECTION)
    const capstoneData = data['capstone-letter'] || {};
    if (capstoneData.capstone_letter) {
        ensureSpace(40); // Use the new helper
        addVerticalSpace(10); // Add some space before the section
        
        doc.setTextColor(...primaryColor);
        doc.setFontSize(styles.fontSize.sectionHeader);
        doc.setFont(styles.fontFamily, 'bold');
        doc.text('Capstone Letter Analysis', margin, yPos);
        yPos += 12;
        
        doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(styles.fontSize.body);
        
        const capstoneIntro = 'Your business name\'s Capstone letter (last letter of the first name) influences how you complete projects and close cycles.';
        const capstoneIntroLines = doc.splitTextToSize(capstoneIntro, contentWidth);
        doc.text(capstoneIntroLines, margin, yPos);
        yPos += capstoneIntroLines.length * 6 + 10;
        
        doc.setFont(styles.fontFamily, 'bold');
        doc.text(`Capstone Letter: ${capstoneData.capstone_letter}`, margin, yPos);
        yPos += 8;
        
        // Use the detailed meaning for the main description
        if (capstoneData.detailed_meaning) {
            doc.setFont(styles.bodyFontFamily, 'normal');
            const meaningLines = doc.splitTextToSize(capstoneData.detailed_meaning, contentWidth);
            
            // Write detailed meaning with automatic page breaks
            for (let i = 0; i < meaningLines.length; i++) {
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
                doc.text(meaningLines[i], margin, yPos);
                yPos += 6; // Line height
            }
            addVerticalSpace(10); // Space after detailed meaning
        } else if (capstoneData.meaning && typeof capstoneData.meaning === 'object') {
            // Fallback to object structure if detailed_meaning isn't available
            const overview = capstoneData.meaning.overview;
            if (overview) {
                const overviewLines = doc.splitTextToSize(overview, contentWidth);
                doc.text(overviewLines, margin, yPos);
                yPos += overviewLines.length * 6 + 8;
            }
        }
        
        // --- NEW: Tip for choosing a better business name box --- I need your help here mi breda haha please you can see it is a duplicate section from a version that's above, yup i did it. i want us to return a 8 lines Actionable Steps that's aligned to our business numerology report.. it's for our firefox extension. so output the new content for this section or the version you've done with the tip 
        // Define the tips
        const nameTips = [
          "Audit your current business name across multiple numerology systems.",
          "Favor name totals that align with growth, authority, expansion.",
          "Avoid frequent rebranding; numerological stability strengthens brand trust.",
          "Ensure your business name, phone number, and email vibrate harmoniously.",
          "Use your Cornerstone letter to guide how you initiate projects.",
          "Use your Capstone letter to refine how you close deals, campaigns.",
          "Time major launches using favorable personal or business number days.",
          "Re-evaluate your name’s vibration annually as your business mission."
        ];

        
        // Calculate height needed for the box content
        const tipBoxHeaderHeight = 15; // Approximate height for the header text
        const tipLineHeight = 6; // Approximate height for each tip line
        const tipBoxPadding = 10; // Padding inside the box
        const totalTipBoxHeight = tipBoxHeaderHeight + (nameTips.length * tipLineHeight) + (2 * tipBoxPadding);
        
        ensureSpace(totalTipBoxHeight + 10); // Ensure space for box and padding
        addVerticalSpace(8); // Add space before the box
        
        // Draw the box
        doc.setFillColor(...lightPrimaryColor);
        doc.setDrawColor(...primaryColor);
        doc.roundedRect(margin, yPos, contentWidth, totalTipBoxHeight, 3, 3, 'FD');
        
        // Position inside the box
        let boxYPos = yPos + tipBoxPadding;
        
        // Add the header text inside the box
        doc.setFontSize(styles.fontSize.subsectionHeader);
        doc.setFont(styles.fontFamily, 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('Actionable Business Numerology Steps', margin + 5, boxYPos);
        boxYPos += 12; // Move down for the tips
        
        // Add the tips inside the box
        doc.setFontSize(styles.fontSize.body);
        doc.setFont(styles.bodyFontFamily, 'normal');
        doc.setTextColor(...secondaryColor);
        for (const tip of nameTips) {
            doc.text('• ' + tip, margin + 8, boxYPos);
            boxYPos += tipLineHeight;
        }
        
        // Update yPos to after the box
        yPos += totalTipBoxHeight;
        addVerticalSpace(12); // Add space after the box
    }

    // Force Recommendations section onto a new page
    addPageFooter();
    doc.addPage();
    currentPage++;
    yPos = margin; // Start at top of new page
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(styles.fontSize.sectionHeader);
    doc.setFont(styles.fontFamily, 'bold');
    doc.text('Strategic Business Alignment Summary', margin, yPos);
    yPos += 12;
    
    doc.setFont(styles.bodyFontFamily, 'normal');
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(styles.fontSize.body);
    
    const recommendations = [
      '• Your business carries a distinct energetic signature that influences perception, trust, and long-term growth.',
      '• Consistency across name, communication channels, and decision-making strengthens brand authority.',
      '• When internal strategy aligns with external vibration, opportunities emerge with less resistance.',
      '• Periodic numerological reviews help maintain alignment as the business evolves.',
      '• Conscious alignment transforms numbers from analysis into strategic advantage.'
    ];

    
    recommendations.forEach(rec => {
        const lines = doc.splitTextToSize(rec, contentWidth - 10);
        doc.text(lines, margin + 5, yPos);
        yPos += lines.length * 5 + 3;
    });
    
    addVerticalSpace(15); // Use the new helper
    ensureSpace(30); // Use the new helper
    
    doc.setFont(styles.bodyFontFamily, 'italic');
    doc.setTextColor(...accentColor);
    doc.setFontSize(styles.fontSize.body + 1);
    const wisdomQuote = '"Success in business comes from aligning your actions with the natural vibrations of your brand. Numbers reveal the hidden patterns that lead to prosperity."';
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

window.createBusinessPDF = createBusinessPDF;