import { supabase } from '@/lib/supabase';
import PDFDocument from 'pdfkit';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { filter_type, filter_id, semester } = await req.json();
    
    // Validation
    if (!filter_type || !filter_id || !semester) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch data based on filter type
    let students = [];

    if (filter_type === 'student') {
      // Single student
      const { data } = await supabase
        .from('students')
        .select('*, profiles(first_name, last_name), classes(name)')
        .eq('id', filter_id);
      students = data || [];
    } else if (filter_type === 'class') {
      // All students in a class
      const { data } = await supabase
        .from('students')
        .select('*, profiles(first_name, last_name), classes(name)')
        .eq('class_id', filter_id);
      students = data || [];
    } else if (filter_type === 'school') {
      // All students in a school
      const { data } = await supabase
        .from('students')
        .select('*, profiles(first_name, last_name), classes(name)')
        .eq('school_id', filter_id);
      students = data || [];
    }

    if (students.length === 0) {
      return NextResponse.json(
        { error: 'No students found' },
        { status: 404 }
      );
    }

    // Create PDF document with multiple pages
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    // Buffer to store PDF
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Generate bulletin for each student
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      
      // Fetch grades for this student
      const { data: grades } = await supabase
        .from('grades')
        .select('*, subjects(name, code)')
        .eq('student_id', student.id);

      // Fetch school info
      const { data: school } = await supabase
        .from('schools')
        .select('name')
        .eq('id', student.school_id)
        .single();

      // Generate bulletin page
      generateBulletinPage(
        doc,
        student,
        school,
        grades || [],
        semester,
        i > 0 // Add new page after first
      );
    }

    // Finalize PDF
    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(
          new Response(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="bulletins_${filter_type}_${semester}semestre.pdf"`,
            },
          })
        );
      });
      doc.on('error', reject);
    });
  } catch (error) {
    console.error('Error generating bulletins:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function generateBulletinPage(doc, student, school, grades, semester, addNewPage = false) {
  if (addNewPage) {
    doc.addPage();
  }

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text(school?.name || 'ÉCOLE', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text('BULLETIN DE NOTES', { align: 'center' });
  doc.moveDown(0.5);

  // Semester info
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(`Semestre ${semester}`, { align: 'center' });
  doc.moveDown(1);

  // Student info
  doc.fontSize(11).font('Helvetica-Bold').text('Informations Élève');
  doc
    .fontSize(10)
    .font('Helvetica')
    .text(
      `Nom: ${student.profiles?.last_name} ${student.profiles?.first_name}`
    );
  doc.text(`Classe: ${student.classes?.name}`);
  doc.text(`Matricule: ${student.matricule || 'N/A'}`);
  doc.moveDown(0.5);

  // Table header
  const tableTop = doc.y;
  const col1 = 50;
  const col2 = 250;
  const col3 = 320;
  const col4 = 390;
  const col5 = 460;
  const rowHeight = 25;

  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Matière', col1, tableTop);
  doc.text('Coeff', col2, tableTop);
  doc.text('Note Classe', col3, tableTop);
  doc.text('Note Compo', col4, tableTop);
  doc.text('Moyenne', col5, tableTop);

  // Horizontal line
  doc.lineWidth(1).moveTo(40, tableTop + 15).lineTo(560, tableTop + 15).stroke();

  // Subjects data
  doc.fontSize(9).font('Helvetica');
  let currentY = tableTop + 20;
  let totalCoeff = 0;
  let totalWeightedGrade = 0;
  const subjectGrades = {};

  // Group grades by subject
  grades.forEach(grade => {
    const subjectName = grade.subjects?.name || 'Unknown';
    if (!subjectGrades[subjectName]) {
      subjectGrades[subjectName] = {
        classGrades: [],
        compGrades: [],
      };
    }
    if (grade.type === 'devoir') {
      subjectGrades[subjectName].classGrades.push(grade.value);
    } else if (grade.type === 'examen') {
      subjectGrades[subjectName].compGrades.push(grade.value);
    }
  });

  // Get coefficients for subjects (from school config or default)
  const coefficients = {
    'Français': 4,
    'Mathématiques': 4,
    'Anglais': 3,
    'Sciences': 3,
    'Histoire': 2,
    'Géographie': 2,
    'EPS': 1,
    'Arts': 1,
  };

  // Calculate and display each subject
  Object.entries(subjectGrades).forEach(([subject, gradeData]) => {
    const classAvg =
      gradeData.classGrades.length > 0
        ? (gradeData.classGrades.reduce((a, b) => a + b, 0) /
            gradeData.classGrades.length)
        : 0;
    const compAvg =
      gradeData.compGrades.length > 0
        ? (gradeData.compGrades.reduce((a, b) => a + b, 0) /
            gradeData.compGrades.length)
        : 0;

    const subjectCoeff = coefficients[subject] || 2;
    const subjectAverage = (classAvg * 0.4 + compAvg * 0.6).toFixed(2);

    totalCoeff += subjectCoeff;
    totalWeightedGrade += parseFloat(subjectAverage) * subjectCoeff;

    // Draw row
    doc.text(subject.substring(0, 20), col1, currentY);
    doc.text(subjectCoeff.toString(), col2, currentY);
    doc.text(classAvg.toFixed(2), col3, currentY);
    doc.text(compAvg.toFixed(2), col4, currentY);
    doc.text(subjectAverage, col5, currentY);

    currentY += rowHeight;
  });

  // Horizontal line before totals
  doc.lineWidth(1).moveTo(40, currentY).lineTo(560, currentY).stroke();
  currentY += 10;

  // Calculate final average
  const finalAverage = totalCoeff > 0 ? (totalWeightedGrade / totalCoeff).toFixed(2) : 0;

  // Display totals
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('TOTAL', col1, currentY);
  doc.text(totalCoeff.toString(), col2, currentY);
  doc.text('', col3, currentY);
  doc.text('', col4, currentY);
  doc.text(finalAverage, col5, currentY);

  currentY += rowHeight + 10;

  // Summary section
  doc.fontSize(10).font('Helvetica-Bold').text('Résumé', 40, currentY);
  currentY += 15;

  doc
    .fontSize(9)
    .font('Helvetica')
    .text(`Moyenne Semestre ${semester}: ${finalAverage} / 20`, 40, currentY);
  currentY += 20;

  // If second semester, calculate annual average
  if (parseInt(semester) === 2) {
    // Fetch semester 1 grades (you'll need to implement semester tracking in DB)
    const s1Average = 14.5; // Placeholder - should fetch from DB
    const annualAverage = ((parseFloat(finalAverage) + s1Average) / 2).toFixed(2);

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(`Moyenne Annuelle: ${annualAverage} / 20`, 40, currentY);
    currentY += 15;

    // Status based on average
    const status = annualAverage >= 12 ? 'ADMIS' : 'A RATTRAPER';
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(annualAverage >= 12 ? 'green' : 'red')
      .text(`Statut: ${status}`, 40, currentY);
  }

  // Reset color
  doc.fillColor('black');
}
