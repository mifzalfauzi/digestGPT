import React from 'react';

/**
 * CustomPDFTextLayer
 * Renders a PDF.js text layer with robust quote/sentence highlighting.
 * @param {Object[]} textItems - Array of PDF.js text items for the page.
 * @param {string} quote - The quote or sentence to highlight.
 * @param {number} pageNumber - The current page number for debugging.
 */
function CustomPDFTextLayer({ textItems, quote, pageNumber }) {
  console.log(`CustomPDFTextLayer (Page ${pageNumber}): textItems`, textItems);
  console.log(`CustomPDFTextLayer (Page ${pageNumber}): quote`, quote);
  
  if (!textItems || textItems.length === 0) {
    console.log(`CustomPDFTextLayer (Page ${pageNumber}): No text items available`);
    return null;
  }

  if (!quote || !quote.trim()) {
    console.log(`CustomPDFTextLayer (Page ${pageNumber}): No quote to highlight`);
    return null;
  }

  // Normalize quote for matching
  const normQuote = quote.replace(/\s+/g, ' ').trim().toLowerCase();
  // Concatenate all text items to a single string
  const fullText = textItems.map(t => t.str).join(' ');
  const normFullText = fullText.replace(/\s+/g, ' ').trim().toLowerCase();

  console.log(`CustomPDFTextLayer (Page ${pageNumber}): normQuote`, normQuote);
  console.log(`CustomPDFTextLayer (Page ${pageNumber}): normFullText preview`, normFullText.substring(0, 200) + '...');

  // Try multiple matching strategies
  let startIdx = -1;
  let endIdx = -1;
  let matchStrategy = '';

  // Strategy 1: Exact match
  startIdx = normFullText.indexOf(normQuote);
  if (startIdx !== -1) {
    endIdx = startIdx + normQuote.length;
    matchStrategy = 'exact';
  }

  // Strategy 2: Partial match with first and last words
  if (startIdx === -1) {
    const words = normQuote.split(/\s+/);
    if (words.length >= 3) {
      // Try matching first 2 and last 2 words
      const firstWords = words.slice(0, 2).join(' ');
      const lastWords = words.slice(-2).join(' ');
      
      const firstWordIndex = normFullText.indexOf(firstWords);
      const lastWordIndex = normFullText.indexOf(lastWords, firstWordIndex);
      
      if (firstWordIndex !== -1 && lastWordIndex !== -1) {
        startIdx = firstWordIndex;
        endIdx = lastWordIndex + lastWords.length;
        matchStrategy = 'partial';
      }
    }
  }

  // Strategy 3: Try individual significant words
  if (startIdx === -1) {
    const words = normQuote.split(/\s+/).filter(word => word.length > 3); // Filter out short words
    if (words.length > 0) {
      // Try to find the first significant word
      const firstSignificantWord = words[0];
      const wordIndex = normFullText.indexOf(firstSignificantWord);
      if (wordIndex !== -1) {
        startIdx = wordIndex;
        endIdx = wordIndex + firstSignificantWord.length;
        matchStrategy = 'word';
      }
    }
  }

  console.log(`CustomPDFTextLayer (Page ${pageNumber}): Match result - startIdx:`, startIdx, 'endIdx:', endIdx, 'strategy:', matchStrategy);

  // Map indices back to text items for highlighting
  let currIdx = 0;
  const highlightItems = [];

  return (
    <div
      className="pdf-custom-textLayer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {textItems.map((item, idx) => {
        // PDF.js transform: [scaleX, skewX, skewY, scaleY, transX, transY]
        const [scaleX, skewX, skewY, scaleY, transX, transY] = item.transform;
        // Compose CSS transform
        const transform = `matrix(${scaleX}, ${skewX}, ${skewY}, ${scaleY}, ${transX}, ${transY})`;
        const itemNorm = item.str.replace(/\s+/g, ' ').trim();
        const itemLen = itemNorm.length;
        
        let highlight = false;
        let highlightIntensity = 'full';
        
        if (startIdx !== -1 && endIdx !== -1) {
          // Check if this text item overlaps with the quote range
          const itemStart = currIdx;
          const itemEnd = currIdx + itemLen;
          
          if (itemEnd > startIdx && itemStart < endIdx) {
            highlight = true;
            // Determine highlight intensity based on overlap
            const overlapStart = Math.max(itemStart, startIdx);
            const overlapEnd = Math.min(itemEnd, endIdx);
            const overlapRatio = (overlapEnd - overlapStart) / itemLen;
            
            if (overlapRatio > 0.8) {
              highlightIntensity = 'full';
            } else if (overlapRatio > 0.5) {
              highlightIntensity = 'medium';
            } else {
              highlightIntensity = 'light';
            }
          }
        }
        
        currIdx += itemLen + 1; // +1 for the space
        
        // Determine background color based on highlight status - MUCH MORE VISIBLE
        let backgroundColor = 'transparent';
        let textColor = 'inherit';
        if (highlight) {
          switch (highlightIntensity) {
            case 'full':
              backgroundColor = '#FFD700'; // Gold/Yellow
              textColor = '#000000'; // Black text
              break;
            case 'medium':
              backgroundColor = '#FFFF00'; // Bright Yellow
              textColor = '#000000'; // Black text
              break;
            case 'light':
              backgroundColor = '#FFFF99'; // Light Yellow
              textColor = '#000000'; // Black text
              break;
          }
        }
        
        return (
          <span
            key={idx}
            style={{
              position: 'absolute',
              transform,
              transformOrigin: '0 0',
              fontFamily: item.fontName || 'sans-serif',
              fontSize: `${item.height}px`,
              color: textColor,
              backgroundColor: backgroundColor,
              lineHeight: 1,
              pointerEvents: 'none',
              whiteSpace: 'pre',
              zIndex: 11,
              border: highlight ? '2px solid #FF6600' : 'none', // Orange border
              borderRadius: highlight ? '3px' : '0',
              padding: highlight ? '2px' : '0',
              boxShadow: highlight ? '0 0 10px rgba(255, 215, 0, 0.8)' : 'none', // Gold glow
              fontWeight: highlight ? 'bold' : 'normal',
            }}
          >
            {item.str}
          </span>
        );
      })}
      
      {/* Debug info overlay - More prominent */}
      {startIdx !== -1 && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: '#FF6600',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 20,
          maxWidth: '300px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        }}>
          <div>🎯 HIGHLIGHT FOUND ON PAGE {pageNumber}!</div>
          <div>Strategy: {matchStrategy}</div>
          <div>Quote: "{quote.substring(0, 40)}..."</div>
        </div>
      )}
    </div>
  );
}

export default CustomPDFTextLayer; 