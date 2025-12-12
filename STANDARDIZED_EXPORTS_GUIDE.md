# 📊 Standardized Export System - PDF & Excel

## Overview

All PDF and Excel exports across the application now use standardized libraries and utilities:

- **PDF**: `pdfkit` (server-side) for professional formatting
- **Excel**: `xlsx` (client-side) for spreadsheet generation
- **Utilities**: Centralized functions in `/lib/exportUtils.js` and `/lib/pdfkitUtils.js`

## Libraries Used

### Already Installed (package.json)
```json
{
  "pdfkit": "^0.17.2",      // Professional PDF generation
  "xlsx": "^0.18.5",        // Excel/CSV export
  "jspdf": "^3.0.3"         // Kept for legacy compatibility
}
```

## Architecture

### Client-Side (Browser)
- **Excel Exports**: Direct generation using `xlsx` library
- **PDF Exports**: API calls to server endpoints
- **Utilities**: `/lib/exportUtils.js` for common functions

### Server-Side (API Routes)
- **PDF Generation**: `/lib/pdfkitUtils.js` with pdfkit
- **Endpoints**: `/api/export/*` routes for PDF generation
- **Response**: Direct binary PDF download

## File Structure

```
src/
├── lib/
│   ├── exportUtils.js           # Client-side export utilities
│   ├── pdfkitUtils.js           # Server-side PDF utilities
│   └── supabase.js              # Existing
├── app/
│   └── api/
│       └── export/
│           ├── grades-pdf/route.js      # Teacher grades PDF
│           ├── students-pdf/route.js    # Student list PDF
│           ├── schedule-pdf/route.js    # Schedule PDF
│           └── reports-pdf/route.js     # Financial reports PDF
└── dashboard/
    ├── teacher/
    │   └── grades/page.jsx      # ✅ Updated
    ├── supervisor/
    │   └── students-list/page.jsx # ✅ Updated
    ├── student/
    │   └── schedule/page.jsx     # ✅ Updated
    └── accountant/
        └── reports/page.jsx      # ✅ Updated
```

## Implementations

### ✅ Completed Standardized Exports

#### 1. Teacher Grades (`teacher/grades/page.jsx`)
**Exports**: PDF (server) + Excel (client)
```javascript
// PDF export via API
const exportPDF = async () => {
  const response = await fetch('/api/export/grades-pdf', {
    method: 'POST',
    body: JSON.stringify({ grades })
  });
  const blob = await response.blob();
  // Download...
};

// Excel export using utility
const exportExcel = async () => {
  await exportToExcel({
    data: gradesList,
    sheetName: 'Notes',
    filename: 'bulletin-notes'
  });
};
```

#### 2. Supervisor Students List (`supervisor/students-list/page.jsx`)
**Exports**: PDF (server) + Excel (client)
- Lists all students with filtering
- Uses standardized PDF API endpoint
- Excel export with name, class, status

#### 3. Student Schedule (`student/schedule/page.jsx`)
**Exports**: PDF (server) + Excel (client)
- Schedule timetable in both formats
- Landscape PDF for better readability
- Excel with day, time, subject, teacher

#### 4. Accountant Reports (`accountant/reports/page.jsx`)
**Exports**: PDF (server) + Excel (client)
- Financial reports with statistics
- Includes payment summaries
- Invoice statistics
- CSV-like Excel format

### 🔄 How to Add New Exports

#### Step 1: Create API Endpoint
File: `/src/app/api/export/[feature]-pdf/route.js`

```javascript
import { 
  createPDFDocument, 
  addHeaderToPDF, 
  addTableToPDF, 
  addFooterToPDF, 
  finalizePDF, 
  createPDFResponse 
} from '@/lib/pdfkitUtils';

export async function POST(request) {
  const { data } = await request.json();

  const { doc, buffers } = createPDFDocument();
  
  // Add content
  addHeaderToPDF(doc, { title: 'My Document' });
  addTableToPDF(doc, { 
    columns: [...], 
    rows: [...] 
  });
  addFooterToPDF(doc);

  const pdfBuffer = finalizePDF(doc, buffers);
  return createPDFResponse(pdfBuffer, 'filename.pdf');
}
```

#### Step 2: Update Component
File: `/src/app/dashboard/[role]/[feature]/page.jsx`

```javascript
import { exportToExcel } from '@/lib/exportUtils';

// PDF Export
const exportPDF = async () => {
  const response = await fetch('/api/export/feature-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'export.pdf';
  link.click();
  URL.revokeObjectURL(url);
};

// Excel Export
const exportExcel = async () => {
  await exportToExcel({
    data: transformedData,
    sheetName: 'Sheet Name',
    filename: 'export-name'
  });
};
```

## Utility Functions Reference

### Client-Side (exportUtils.js)

#### `exportToExcel(options)`
Exports data to Excel format.

**Parameters:**
```javascript
{
  data: Array,           // Array of objects
  sheetName: String,     // Excel sheet name (default: 'Sheet')
  filename: String       // Filename without .xlsx (required)
}
```

**Example:**
```javascript
await exportToExcel({
  data: [
    { Name: 'John', Email: 'john@example.com' },
    { Name: 'Jane', Email: 'jane@example.com' }
  ],
  sheetName: 'Contacts',
  filename: 'contact-list'
});
// Downloads: contact-list.xlsx
```

#### `exportToPDFSimple(options)`
Simple PDF export with basic table layout (client-side).

**Parameters:**
```javascript
{
  title: String,        // PDF title
  columns: Array,       // [{label, key}, ...]
  data: Array,         // Array of objects
  filename: String,    // Without .pdf
  orientation: String  // 'portrait' or 'landscape'
}
```

#### `prepareDataForExport(rawData, fieldMapping)`
Formats data for export (dates, numbers, booleans).

**Example:**
```javascript
const formatted = prepareDataForExport(
  students,
  {
    id: 'ID',
    name: 'Nom Complet',
    created_at: 'Date Inscription'
  }
);
```

#### `downloadFileFromResponse(response, filename)`
Helper to download file from fetch response.

### Server-Side (pdfkitUtils.js)

#### `createPDFDocument(options)`
Creates a new PDF document.

**Options:**
```javascript
{
  orientation: 'portrait' | 'landscape', // Default: 'portrait'
  size: 'A4',                            // Paper size
  margin: 20,                            // Margin in pixels
  fontSize: 10                           // Default font size
}
```

**Returns:** `{ doc, buffers }` - PDFDocument instance and buffer array

#### `addHeaderToPDF(doc, options)`
Adds header with school name, title, and date.

**Example:**
```javascript
addHeaderToPDF(doc, {
  schoolName: 'My School',
  title: 'Student Report',
  subtitle: 'Class 2024',
  date: new Date()
});
```

#### `addTableToPDF(doc, options)`
Adds professional table to PDF.

**Parameters:**
```javascript
{
  title: String,           // Optional table title
  columns: Array,          // [{label, key}, ...]
  rows: Array,            // Array of objects
  x: Number,              // X position (default: 50)
  y: Number,              // Y position (default: 100)
  width: Number,          // Table width (default: 495)
  rowHeight: Number,      // Row height (default: 25)
  headerHeight: Number,   // Header height (default: 30)
  backgroundColor: String // BG color hex
}
```

#### `addFooterToPDF(doc, options)`
Adds footer with optional page numbers.

**Example:**
```javascript
addFooterToPDF(doc, {
  text: 'Generated by ScolaTek',
  showPageNumbers: true
});
```

#### `finalizePDF(doc, buffers)`
Finishes PDF generation and returns buffer.

#### `createPDFResponse(pdfBuffer, filename)`
Creates HTTP response for PDF download.

**Returns:** `Response` object with proper headers

#### `generatePDF(options)`
Quick helper for simple PDF generation.

## API Endpoints

### POST /api/export/grades-pdf
Exports teacher grades as PDF.

**Body:**
```json
{
  "grades": [
    {
      "students": { "profiles": { "first_name": "John", "last_name": "Doe" } },
      "subjects": { "name": "Math" },
      "value": 18.5,
      "type": "devoir",
      "comment": "Excellent work",
      "created_at": "2024-12-01T10:00:00"
    }
  ]
}
```

### POST /api/export/students-pdf
Exports student list as PDF.

**Body:**
```json
{
  "students": [
    {
      "profiles": { "first_name": "John", "last_name": "Doe" },
      "class_id": "class-123",
      "status": "active"
    }
  ]
}
```

### POST /api/export/schedule-pdf
Exports schedule/timetable as PDF.

**Body:**
```json
{
  "schedule": [
    {
      "day": "Monday",
      "start_time": "08:00",
      "end_time": "09:00",
      "subject": "Math",
      "teacher": "M. Smith"
    }
  ]
}
```

### POST /api/export/reports-pdf
Exports financial reports as PDF.

**Body:**
```json
{
  "reportType": "financial",
  "dateRange": { "start": "2024-01-01", "end": "2024-12-31" },
  "stats": { 
    "totalRevenue": 500000,
    "paidPayments": 25,
    ...
  },
  "payments": [...],
  "invoices": [...],
  "schoolName": "My School"
}
```

## PDF Styling

### Colors
- **Headers**: Blue (#1f2937) with white text
- **Alternating rows**: White (#ffffff) and light gray (#f9fafb)
- **Links**: Blue (#3b82f6)

### Fonts
- **Headers**: Helvetica-Bold, 11pt
- **Title**: Helvetica-Bold, 16pt
- **Body**: Helvetica, 10pt
- **Footer**: Helvetica, 9pt

### Layout
- **Margin**: 20px default
- **Page breaks**: Automatic
- **Columns**: Auto-sized based on content
- **Max rows per page**: Auto-calculated

## Performance Tips

### PDF Generation
- Server-side generation (pdfkit) is fast (100-500ms per page)
- Supports multi-page documents
- Streaming output for large files

### Excel Generation
- Client-side (xlsx) is very fast (<100ms)
- No server overhead
- Good for data with many columns

### Optimization
1. Limit rows in single export (consider pagination)
2. Use appropriate orientation (landscape for many columns)
3. Cache school/metadata to reduce queries
4. Implement download size limits for school-wide exports

## Testing Checklist

- [ ] PDF generation for single records
- [ ] PDF generation for large datasets (100+ rows)
- [ ] Multi-page PDF pagination
- [ ] Excel exports with special characters (French accents)
- [ ] Excel exports with dates and numbers
- [ ] PDF headers/footers display correctly
- [ ] Table layout responsive to content width
- [ ] Download file naming is consistent
- [ ] Files download with correct MIME types
- [ ] Large file downloads work without timeout

## Troubleshooting

### PDF Generation Fails
**Error**: "Cannot create PDF document"
**Solution**: Check that pdfkit is imported and buffers array is passed to finalizePDF

### Excel Export Empty
**Error**: "No data in downloaded file"
**Solution**: Ensure data array has objects with keys matching column definitions

### PDF Font Issues
**Error**: "Special characters not displaying"
**Solution**: pdfkit supports UTF-8, but some fonts may not. Use standard fonts.

### Large PDF Timeouts
**Error**: "Request timeout for school-wide export"
**Solution**: 
- Implement pagination (export per class instead of per school)
- Add progress indicators
- Consider background job for very large exports

## Migration from jsPDF

Old (jsPDF):
```javascript
const { jsPDF } = await import('jspdf');
const doc = new jsPDF();
doc.text('Hello', 10, 10);
doc.save('file.pdf');
```

New (pdfkit):
```javascript
// Server-side API route
import { createPDFDocument, finalizePDF, createPDFResponse } from '@/lib/pdfkitUtils';
const { doc, buffers } = createPDFDocument();
doc.text('Hello', 50, 50);
const pdf = finalizePDF(doc, buffers);
return createPDFResponse(pdf, 'file.pdf');
```

## Best Practices

1. **Always validate data before export** - Check for empty arrays
2. **Use meaningful filenames** - Include date/student name
3. **Add error handling** - Try-catch with user feedback
4. **Optimize file size** - Limit columns and rows
5. **Consistent formatting** - Use utility functions for dates/currency
6. **Test with real data** - Special characters, large datasets
7. **Monitor performance** - Log generation times
8. **Provide user feedback** - Loading states, success messages

## Future Enhancements

- [ ] Batch exports (multiple students at once)
- [ ] Email delivery instead of download
- [ ] Digital signatures on PDFs
- [ ] Custom branding/logo in headers
- [ ] Password protection for sensitive exports
- [ ] Archives/history of generated reports
- [ ] Export scheduling (automatic reports)
- [ ] S3/Cloud storage instead of direct download
