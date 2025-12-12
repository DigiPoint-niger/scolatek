/**
 * Server-side PDF generation utilities using pdfkit
 * Use this in API routes for generating PDFs
 */

import PDFDocument from 'pdfkit';

/**
 * Create a PDF document with professional formatting
 * @param {Object} options - Configuration options
 * @returns {Object} { doc: PDFDocument, buffers: Array }
 */
export function createPDFDocument(options = {}) {
  const { 
    orientation = 'portrait',
    size = 'A4',
    margin = 20,
    fontSize = 10
  } = options;

  const buffers = [];
  
  const doc = new PDFDocument({
    size,
    margin,
    bufferPages: true
  });

  // Collect data as it's written
  doc.on('data', (chunk) => buffers.push(chunk));

  doc.fontSize(fontSize);

  return { doc, buffers };
}

/**
 * Add a table to the PDF document
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {Object} options - Table options
 */
export function addTableToPDF(doc, options) {
  const { 
    title, 
    columns, 
    rows, 
    x = 50, 
    y = 100,
    width = 495,
    rowHeight = 25,
    headerHeight = 30,
    backgroundColor = '#f5f5f5'
  } = options;

  let currentY = y;

  // Add title if provided
  if (title) {
    doc.fontSize(16).font('Helvetica-Bold').text(title, x, currentY);
    currentY += 40;
  }

  // Calculate column width
  const columnWidth = width / columns.length;

  // Draw header
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff');
  doc.fillColor('#1f2937');
  
  columns.forEach((column, index) => {
    const xPos = x + (index * columnWidth);
    doc.rect(xPos, currentY, columnWidth, headerHeight).fill();
    doc.fillColor('#ffffff').text(
      column.label,
      xPos + 5,
      currentY + 8,
      { width: columnWidth - 10, align: 'left' }
    );
  });

  currentY += headerHeight;

  // Draw rows
  doc.fontSize(10).font('Helvetica').fillColor('#000000');
  
  rows.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (currentY > doc.page.height - 50) {
      doc.addPage();
      currentY = 50;
    }

    // Alternate row colors
    const bgColor = rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb';
    doc.fillColor(bgColor);
    
    columns.forEach((column, colIndex) => {
      const xPos = x + (colIndex * columnWidth);
      const cellContent = String(row[column.key] || '');
      
      doc.rect(xPos, currentY, columnWidth, rowHeight).fill();
      doc.fillColor('#000000').text(
        cellContent.substring(0, 50),
        xPos + 5,
        currentY + 8,
        { width: columnWidth - 10, align: 'left' }
      );
    });

    currentY += rowHeight;
  });

  return currentY;
}

/**
 * Add header information to PDF
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {Object} options - Header options
 */
export function addHeaderToPDF(doc, options = {}) {
  const { 
    schoolName = 'École',
    title = 'Document',
    subtitle = '',
    date = new Date(),
    margin = 20
  } = options;

  // School name and title
  doc.fontSize(20).font('Helvetica-Bold').text(schoolName, margin, margin);
  doc.fontSize(16).font('Helvetica-Bold').text(title, margin, margin + 30);
  
  if (subtitle) {
    doc.fontSize(12).font('Helvetica').text(subtitle, margin, margin + 60);
  }

  // Date
  doc.fontSize(10).font('Helvetica').fillColor('#666666')
    .text(`Generated: ${date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, margin, margin + 85);

  return margin + 120;
}

/**
 * Add footer to PDF (page numbers)
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {Object} options - Footer options
 */
export function addFooterToPDF(doc, options = {}) {
  const { 
    text = '',
    showPageNumbers = true,
    margin = 20
  } = options;

  const pages = doc.bufferedPageRange().count;
  
  for (let i = 0; i < pages; i++) {
    doc.switchToPage(i);
    
    const pageHeight = doc.page.height;
    const pageWidth = doc.page.width;
    
    // Bottom line
    doc.moveTo(margin, pageHeight - 40).lineTo(pageWidth - margin, pageHeight - 40).stroke();
    
    // Footer text
    if (text) {
      doc.fontSize(9).font('Helvetica').fillColor('#666666')
        .text(text, margin, pageHeight - 30, { width: pageWidth - (2 * margin), align: 'left' });
    }
    
    // Page numbers
    if (showPageNumbers) {
      doc.text(
        `Page ${i + 1} of ${pages}`,
        margin,
        pageHeight - 30,
        { width: pageWidth - (2 * margin), align: 'right' }
      );
    }
  }
}

/**
 * Generate PDF buffer from document
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {Array} buffers - Array of buffers collected from doc.on('data')
 * @returns {Buffer} Combined PDF buffer
 */
export function finalizePDF(doc, buffers) {
  doc.end();
  return Buffer.concat(buffers);
}

/**
 * Create a response object for sending PDF to client
 * @param {Buffer} pdfBuffer - PDF buffer from finalizePDF
 * @param {string} filename - Filename for download
 * @returns {Response} Response object with proper headers
 */
export function createPDFResponse(pdfBuffer, filename = 'document.pdf') {
  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Quick PDF generation helper
 * @param {Object} options - All options (title, columns, rows, etc.)
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generatePDF(options) {
  const {
    title = 'Document',
    schoolName = 'École',
    columns = [],
    rows = [],
    filename = 'export.pdf',
    orientation = 'portrait'
  } = options;

  const { doc, buffers } = createPDFDocument({ orientation });

  // Add header
  addHeaderToPDF(doc, { schoolName, title });

  // Add table
  if (columns.length > 0 && rows.length > 0) {
    addTableToPDF(doc, { columns, rows, title: null });
  }

  // Add footer
  addFooterToPDF(doc, { showPageNumbers: true });

  // Finalize and return
  return finalizePDF(doc, buffers);
}

export default {
  createPDFDocument,
  addTableToPDF,
  addHeaderToPDF,
  addFooterToPDF,
  finalizePDF,
  createPDFResponse,
  generatePDF
};
