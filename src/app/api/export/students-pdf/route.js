import { createPDFDocument, addHeaderToPDF, addTableToPDF, addFooterToPDF, finalizePDF, createPDFResponse } from '@/lib/pdfkitUtils';

export async function POST(request) {
  try {
    const { students } = await request.json();

    if (!students || students.length === 0) {
      return Response.json({ error: 'No students provided' }, { status: 400 });
    }

    const { doc, buffers } = createPDFDocument({ orientation: 'portrait' });

    // Add header
    addHeaderToPDF(doc, {
      schoolName: 'ScolaTek',
      title: 'Liste des Élèves',
      date: new Date()
    });

    // Prepare columns
    const columns = [
      { label: 'Nom', key: 'last_name' },
      { label: 'Prénom', key: 'first_name' },
      { label: 'Classe', key: 'class_id' },
      { label: 'Statut', key: 'status' }
    ];

    // Prepare rows
    const rows = students.map(stu => ({
      last_name: stu.profiles?.last_name || '-',
      first_name: stu.profiles?.first_name || '-',
      class_id: stu.class_id || '-',
      status: stu.status || '-'
    }));

    // Add table
    addTableToPDF(doc, {
      columns,
      rows,
      title: `Total: ${students.length} élève(s)`
    });

    // Add footer
    addFooterToPDF(doc, {
      text: 'Liste générée par ScolaTek',
      showPageNumbers: true
    });

    // Finalize PDF
    const pdfBuffer = finalizePDF(doc, buffers);

    // Return PDF response
    return createPDFResponse(pdfBuffer, 'liste-eleves.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Response.json(
      { error: `Error generating PDF: ${error.message}` },
      { status: 500 }
    );
  }
}
