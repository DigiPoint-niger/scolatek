import { createPDFDocument, addHeaderToPDF, addFooterToPDF, finalizePDF, createPDFResponse } from '@/lib/pdfkitUtils';

export async function POST(request) {
  try {
    const { reportType, dateRange, stats, payments, invoices, schoolName } = await request.json();

    const { doc, buffers } = createPDFDocument({ orientation: 'portrait' });

    // Add header
    addHeaderToPDF(doc, {
      schoolName: schoolName || 'ScolaTek',
      title: 'Rapport Financier',
      subtitle: `Période: ${dateRange.start} à ${dateRange.end}`,
      date: new Date()
    });

    let currentY = 150;

    // Add statistics section
    doc.fontSize(12).font('Helvetica-Bold').text('STATISTIQUES GÉNÉRALES', 50, currentY);
    currentY += 25;

    doc.fontSize(10).font('Helvetica');
    const statsLines = [
      `Revenu Total: ${formatCurrency(stats.totalRevenue)}`,
      `Paiements Payés: ${stats.paidPayments}`,
      `Paiements En Attente: ${stats.pendingPayments}`,
      `Paiement Moyen: ${formatCurrency(stats.averagePayment)}`,
      `Croissance Mensuelle: ${stats.monthlyGrowth.toFixed(1)}%`,
      `Nombre d'Étudiants: ${stats.studentCount}`
    ];

    statsLines.forEach(line => {
      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 50;
      }
      doc.text(line, 60, currentY);
      currentY += 15;
    });

    currentY += 20;

    // Add invoice statistics section
    doc.fontSize(12).font('Helvetica-Bold').text('STATISTIQUES DES FACTURES', 50, currentY);
    currentY += 25;

    doc.fontSize(10).font('Helvetica');
    const invoiceLines = [
      `Total Factures: ${stats.invoiceStats.total}`,
      `Payées: ${stats.invoiceStats.paid}`,
      `En Attente: ${stats.invoiceStats.pending}`,
      `En Retard: ${stats.invoiceStats.overdue}`
    ];

    invoiceLines.forEach(line => {
      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 50;
      }
      doc.text(line, 60, currentY);
      currentY += 15;
    });

    currentY += 20;

    // Add recent payments summary
    if (payments && payments.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('PAIEMENTS RÉCENTS', 50, currentY);
      currentY += 25;

      doc.fontSize(9).font('Helvetica');
      const recentPayments = payments.slice(0, 10);

      recentPayments.forEach(payment => {
        if (currentY > doc.page.height - 50) {
          doc.addPage();
          currentY = 50;
        }

        const paymentDate = new Date(payment.created_at).toLocaleDateString('fr-FR');
        const studentName = payment.students?.profiles
          ? `${payment.students.profiles.first_name} ${payment.students.profiles.last_name}`
          : 'N/A';

        doc.text(
          `${paymentDate} | ${studentName} | ${formatCurrency(payment.amount)} | ${payment.status}`,
          60,
          currentY
        );
        currentY += 12;
      });
    }

    // Add footer
    addFooterToPDF(doc, {
      text: `Rapport généré par ScolaTek le ${new Date().toLocaleDateString('fr-FR')}`,
      showPageNumbers: true
    });

    // Finalize PDF
    const pdfBuffer = finalizePDF(doc, buffers);

    // Return PDF response
    const filename = `rapport-financier-${new Date().toISOString().split('T')[0]}.pdf`;
    return createPDFResponse(pdfBuffer, filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Response.json(
      { error: `Error generating PDF: ${error.message}` },
      { status: 500 }
    );
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}
