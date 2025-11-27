/**
 * Extract body content from full HTML document if needed
 */
function extractBodyContent(html: string): string {
  // Check if this is a full HTML document
  if (html.includes('<!DOCTYPE') || html.includes('<html') || html.includes('<body')) {
    // Try to extract body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      return bodyMatch[1].trim();
    }
    // If no body tag, try to extract content after head
    const headEndMatch = html.match(/<\/head>([\s\S]*)/i);
    if (headEndMatch && headEndMatch[1]) {
      // Remove closing html/body tags
      return headEndMatch[1].replace(/<\/body>[\s\S]*$/i, '').replace(/<\/html>[\s\S]*$/i, '').trim();
    }
  }
  return html;
}

/**
 * Strip HTML tags to get plain text
 */
function stripHTML(html: string): string {
  if (typeof window === 'undefined' || !document) {
    // Fallback for SSR or when document is not available
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  }
  
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return (tempDiv.textContent || tempDiv.innerText || '').trim();
  } catch (e) {
    // Fallback if DOM manipulation fails
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  }
}

/**
 * Truncate HTML content to a specified character length
 * Attempts to preserve HTML structure
 */
export function truncateHTML(html: string, maxLength: number = 300): { content: string; isTruncated: boolean } {
  if (!html || html.trim() === '') {
    return { content: html || '', isTruncated: false };
  }

  // Extract body content if this is a full HTML document
  const bodyContent = extractBodyContent(html);
  
  // Get plain text to check length
  const plainText = stripHTML(bodyContent);

  if (plainText.length <= maxLength) {
    return { content: bodyContent, isTruncated: false };
  }

  // Find a good breaking point (end of sentence or word)
  let truncateAt = maxLength;
  const lastSpace = plainText.lastIndexOf(' ', maxLength);
  const lastPeriod = plainText.lastIndexOf('.', maxLength);
  const lastExclamation = plainText.lastIndexOf('!', maxLength);
  const lastQuestion = plainText.lastIndexOf('?', maxLength);

  const lastPunctuation = Math.max(lastPeriod, lastExclamation, lastQuestion);
  if (lastPunctuation > maxLength * 0.7) {
    truncateAt = lastPunctuation + 1;
  } else if (lastSpace > maxLength * 0.7) {
    truncateAt = lastSpace;
  }

  // Now find the corresponding position in the body content HTML
  // We'll walk through the HTML and count text characters
  let htmlPosition = 0;
  let textPosition = 0;
  let inTag = false;
  let i = 0;

  while (i < bodyContent.length && textPosition < truncateAt) {
    const char = bodyContent[i];
    
    if (char === '<') {
      inTag = true;
      htmlPosition = i + 1;
    } else if (char === '>') {
      inTag = false;
      htmlPosition = i + 1;
    } else if (!inTag) {
      // This is actual text content
      textPosition++;
      htmlPosition = i + 1;
    } else {
      // Inside a tag, just advance position
      htmlPosition = i + 1;
    }
    
    i++;
  }

  // Safety check: ensure we have a reasonable position
  if (htmlPosition === 0 || htmlPosition < 50) {
    // If position is too small, use a heuristic based on HTML length
    // Assume roughly 2-3x HTML length for text (accounting for tags)
    htmlPosition = Math.min(bodyContent.length, truncateAt * 2);
  }
  
  // Extract truncated HTML from body content
  let truncatedHTML = bodyContent.substring(0, htmlPosition).trim();
  
  // Verify we actually got some text content
  const checkText = stripHTML(truncatedHTML);
  if (checkText.length === 0 || checkText.length < 10) {
    // If we got no text, try a larger chunk
    htmlPosition = Math.min(html.length, maxLength * 3);
    truncatedHTML = html.substring(0, htmlPosition).trim();
  }
  
  // Add ellipsis if we truncated
  if (truncatedHTML.length < bodyContent.length) {
    truncatedHTML += '...';
  }

  return { content: truncatedHTML, isTruncated: true };
}

