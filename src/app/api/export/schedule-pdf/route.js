import { createPDFDocument, addHeaderToPDF, addTableToPDF, addFooterToPDF, finalizePDF, createPDFResponse } from '@/lib/pdfkitUtils';

export async function POST(request) {
  try {
    const { schedule } = await request.json();

    if (!schedule || schedule.length === 0) {
      return Response.json({ error: 'No schedule provided' }, { status: 400 });
    }

    const { doc, buffers } = createPDFDocument({ orientation: 'landscape' });

    // Add header
    addHeaderToPDF(doc, {
      schoolName: 'ScolaTek',
      title: 'Emploi du Temps',
      date: new Date()
    });

    // Prepare columns
    const columns = [
      { label: 'Jour', key: 'day' },
      { label: 'Heure Début', key: 'start_time' },
      { label: 'Heure Fin', key: 'end_time' },
      { label: 'Matière', key: 'subject' },
      { label: 'Enseignant', key: 'teacher' }
    ];

    // Prepare rows
    const rows = schedule.map(item => ({
      day: item.day || '-',
      start_time: item.start_time || '-',
      end_time: item.end_time || '-',
      subject: item.subject || '-',
      teacher: item.teacher || '-'
    }));

    // Add table
    addTableToPDF(doc, {
      columns,
      rows,
      title: 'Votre Emploi du Temps',
      width: 760
    });

    // Add footer
    addFooterToPDF(doc, {
      text: 'Emploi du temps généré par ScolaTek',
      showPageNumbers: true
    });

    // Finalize PDF
    const pdfBuffer = finalizePDF(doc, buffers);

    // Return PDF response
    return createPDFResponse(pdfBuffer, 'emploi-du-temps.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Response.json(
      { error: `Error generating PDF: ${error.message}` },
      { status: 500 }
    );
  }
}
