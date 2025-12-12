/**
 * Utilities for exporting data to PDF and Excel formats
 * Standardized across the entire application
 */

/**
 * Export data to PDF using pdfkit (server-side)
 * Use this when you need PDF generation on the server
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.title - PDF title
 * @param {Array} options.columns - Column definitions [{label, key}]
 * @param {Array} options.data - Array of row objects
 * @param {string} options.filename - Output filename
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generatePDFServer(options) {
  const { title, columns, data, filename = 'export.pdf' } = options;
  
  // This is a helper for server-side PDF generation
  // Import PDFDocument from pdfkit in your API route
  // Usage: const { generatePDFServer } = require('@/lib/exportUtils');
  
  return {
    title,
    columns,
    data,
    filename
  };
}

/**
 * Export data to Excel using xlsx library (client-side)
 * @param {Object} options - Configuration options
 * @param {Array} options.data - Array of row objects
 * @param {string} options.sheetName - Name of the sheet
 * @param {string} options.filename - Output filename (without .xlsx)
 */
export async function exportToExcel(options) {
  const { data, sheetName = 'Sheet', filename = 'export' } = options;

  try {
    const XLSX = await import('xlsx');
    
    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Generate and download file
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    return { success: true };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error(`Failed to export to Excel: ${error.message}`);
  }
}

/**
 * Export data to PDF using jsPDF (client-side)
 * Simple tables and text layout
 * @param {Object} options - Configuration options
 * @param {string} options.title - PDF title
 * @param {Array} options.columns - Column definitions [{label, key}]
 * @param {Array} options.data - Array of row objects
 * @param {string} options.filename - Output filename (without .pdf)
 * @param {string} options.orientation - 'portrait' or 'landscape'
 */
export async function exportToPDFSimple(options) {
  const { 
    title = 'Document', 
    columns = [], 
    data = [], 
    filename = 'export',
    orientation = 'portrait'
  } = options;

  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation });
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 10, 10);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 10, 20);
    
    // Create table data
    const tableData = data.map(row => 
      columns.map(col => row[col.key] || '')
    );
    
    // Get column headers
    const headers = columns.map(col => col.label);
    
    // Add table (using basic text layout if autoTable not available)
    let yPosition = 30;
    const lineHeight = 7;
    const columnWidth = (doc.internal.pageSize.getWidth() - 20) / columns.length;
    
    // Headers
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(200, 200, 200);
    
    headers.forEach((header, colIndex) => {
      const xPosition = 10 + (colIndex * columnWidth);
      doc.rect(xPosition, yPosition - 5, columnWidth, lineHeight, 'F');
      doc.text(header, xPosition + 2, yPosition, { maxWidth: columnWidth - 4 });
    });
    
    yPosition += lineHeight;
    
    // Data rows
    doc.setFontSize(10);
    tableData.forEach((row, rowIndex) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 10) {
        doc.addPage();
        yPosition = 10;
      }
      
      doc.setFillColor(rowIndex % 2 === 0 ? 255 : 240, 240, 240);
      row.forEach((cell, colIndex) => {
        const xPosition = 10 + (colIndex * columnWidth);
        doc.rect(xPosition, yPosition - 5, columnWidth, lineHeight, 'F');
        doc.text(
          String(cell).substring(0, 50),
          xPosition + 2,
          yPosition,
          { maxWidth: columnWidth - 4 }
        );
      });
      yPosition += lineHeight;
    });
    
    // Save PDF
    doc.save(`${filename}.pdf`);
    return { success: true };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error(`Failed to export to PDF: ${error.message}`);
  }
}

/**
 * Prepare data for export (cleaning, formatting)
 * @param {Array} rawData - Original data array
 * @param {Object} fieldMapping - Mapping of field names to display names
 * @returns {Array} Formatted data
 */
export function prepareDataForExport(rawData, fieldMapping = {}) {
  return rawData.map(row => {
    const formattedRow = {};
    
    Object.keys(fieldMapping).forEach(key => {
      const displayName = fieldMapping[key];
      let value = row[key];
      
      // Format dates
      if (value instanceof Date) {
        value = value.toLocaleDateString();
      }
      // Format numbers
      else if (typeof value === 'number') {
        value = Number.isInteger(value) ? value : value.toFixed(2);
      }
      // Format booleans
      else if (typeof value === 'boolean') {
        value = value ? 'Oui' : 'Non';
      }
      
      formattedRow[displayName] = value;
    });
    
    return formattedRow;
  });
}

/**
 * Generate column definitions from data headers
 * @param {Array} headers - Column header names
 * @returns {Array} Column definitions
 */
export function generateColumns(headers) {
  return headers.map(header => ({
    label: header,
    key: header
  }));
}

/**
 * Download file from server response (for PDF/Excel generated server-side)
 * @param {Response} response - Fetch response object
 * @param {string} filename - Filename for download
 */
export async function downloadFileFromResponse(response, filename) {
  try {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

export default {
  exportToExcel,
  exportToPDFSimple,
  generatePDFServer,
  prepareDataForExport,
  generateColumns,
  downloadFileFromResponse
};
