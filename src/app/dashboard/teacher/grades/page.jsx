"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function TeacherGradesPage() {
  // Export PDF avec jspdf
  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Bulletin de notes', 10, 15);
    let y = 25;
    grades.forEach((grade, i) => {
      doc.text(`${i + 1}. ${grade.students?.profiles?.first_name || ''} ${grade.students?.profiles?.last_name || ''} | ${grade.subjects?.name || ''} | ${grade.value} | ${grade.type}` , 10, y);
      y += 10;
      if (y > 270) {
        doc.addPage();
        y = 15;
      }
    });
    doc.save('bulletin-notes.pdf');
  };

  // Export Excel avec xlsx
  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const data = grades.map(grade => ({
      Élève: `${grade.students?.profiles?.first_name || ''} ${grade.students?.profiles?.last_name || ''}`,
      Matière: grade.subjects?.name,
      Note: grade.value,
      Type: grade.type,
      Date: new Date(grade.created_at).toLocaleDateString('fr-FR'),
      Commentaire: grade.comment || '-'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Notes');
    XLSX.writeFile(wb, 'bulletin-notes.xlsx');
  };
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    subject_id: "",
    value: "",
    type: "devoir",
    comment: ""
  });
  const router = useRouter();

  useEffect(() => {
    const fetchGrades = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: gradesData } = await supabase
        .from('grades')
        .select('*, students(profiles(first_name, last_name)), subjects(name)')
        .eq('teacher_id', session.user.id)
        .order('created_at', { ascending: false });
      setGrades(gradesData || []);
      setLoading(false);
    };
    fetchGrades();
  }, []);

  const handleAddGrade = async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase
      .from('grades')
      .insert({
        student_id: formData.student_id,
        teacher_id: session.user.id,
        subject_id: formData.subject_id,
        value: formData.value,
        type: formData.type,
        comment: formData.comment
      });
    if (!error) {
      setShowModal(false);
      setFormData({ student_id: "", subject_id: "", value: "", type: "devoir", comment: "" });
      router.refresh();
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Notes attribuées</h2>
      <div className="mb-4 flex gap-4">
        <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={exportPDF}>Exporter PDF</button>
        <button className="px-4 py-2 bg-yellow-500 text-white rounded" onClick={exportExcel}>Exporter Excel</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setShowModal(true)}>Ajouter une note</button>
      </div>
      {/* Modal d'ajout */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Ajouter une note</h3>
            <form onSubmit={handleAddGrade} className="space-y-4">
              <input type="text" placeholder="ID élève" value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <input type="text" placeholder="ID matière" value={formData.subject_id} onChange={e => setFormData({ ...formData, subject_id: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <input type="number" placeholder="Note" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full border px-3 py-2 rounded">
                <option value="devoir">Devoir</option>
                <option value="examen">Examen</option>
                <option value="oral">Oral</option>
                <option value="autre">Autre</option>
              </select>
              <textarea placeholder="Commentaire" value={formData.comment} onChange={e => setFormData({ ...formData, comment: e.target.value })} className="w-full border px-3 py-2 rounded" />
              <div className="flex justify-end space-x-2">
                <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Tableau des notes */}
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th>Élève</th>
            <th>Matière</th>
            <th>Note</th>
            <th>Type</th>
            <th>Date</th>
            <th>Commentaire</th>
          </tr>
        </thead>
        <tbody>
          {grades.map(grade => (
            <tr key={grade.id}>
              <td>{grade.students?.profiles?.first_name} {grade.students?.profiles?.last_name}</td>
              <td>{grade.subjects?.name}</td>
              <td>{grade.value}</td>
              <td>{grade.type}</td>
              <td>{new Date(grade.created_at).toLocaleDateString('fr-FR')}</td>
              <td>{grade.comment || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
