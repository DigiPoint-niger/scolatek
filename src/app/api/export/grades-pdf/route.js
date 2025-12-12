import { createPDFDocument, addHeaderToPDF, addTableToPDF, addFooterToPDF, finalizePDF, createPDFResponse } from '@/lib/pdfkitUtils';

export async function POST(request) {
  try {
    const { grades } = await request.json();

    if (!grades || grades.length === 0) {
      return Response.json({ error: 'No grades provided' }, { status: 400 });
    }

    const { doc, buffers } = createPDFDocument({ orientation: 'landscape' });

    // Add header
    addHeaderToPDF(doc, {
      schoolName: 'ScolaTek',
      title: 'Bulletin de Notes',
      date: new Date()
    });

    // Prepare columns
    const columns = [
      { label: 'Élève', key: 'student_name' },
      { label: 'Matière', key: 'subject_name' },
      { label: 'Note', key: 'value' },
      { label: 'Type', key: 'type' },
      { label: 'Date', key: 'date' },
      { label: 'Commentaire', key: 'comment' }
    ];

    // Prepare rows
    const rows = grades.map(grade => ({
      student_name: `${grade.students?.profiles?.first_name || ''} ${grade.students?.profiles?.last_name || ''}`,
      subject_name: grade.subjects?.name || '-',
      value: grade.value || '-',
      type: grade.type || '-',
      date: grade.created_at ? new Date(grade.created_at).toLocaleDateString('fr-FR') : '-',
      comment: grade.comment || '-'
    }));

    // Add table
    addTableToPDF(doc, {
      columns,
      rows,
      title: 'Notes Détaillées',
      width: 760
    });

    // Add footer
    addFooterToPDF(doc, {
      text: 'Bulletin généré par ScolaTek',
      showPageNumbers: true
    });

    // Finalize PDF
    const pdfBuffer = finalizePDF(doc, buffers);

    // Return PDF response
    return createPDFResponse(pdfBuffer, 'bulletin-notes.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Response.json(
      { error: `Error generating PDF: ${error.message}` },
      { status: 500 }
    );
  }
}
