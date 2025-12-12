"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { exportToExcel } from "@/lib/exportUtils";

export default function TeacherGradesPage() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    student_id: "",
    subject_id: "",
    value: "",
    type: "devoir",
    comment: ""
  });
  const router = useRouter();

  // Export PDF to server (using pdfkit)
  const exportPDF = async () => {
    if (grades.length === 0) {
      alert("Aucune note à exporter");
      return;
    }

    try {
      const response = await fetch('/api/export/grades-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bulletin-notes.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Erreur lors de l\'export PDF');
    }
  };

  // Export Excel using xlsx library
  const exportExcel = async () => {
    if (grades.length === 0) {
      alert("Aucune note à exporter");
      return;
    }

    try {
      const data = grades.map(grade => ({
        Élève: `${grade.student?.first_name || ''} ${grade.student?.last_name || ''}`,
        Matière: grade.subject?.name,
        Note: grade.value,
        Type: grade.type,
        Date: new Date(grade.created_at).toLocaleDateString('fr-FR'),
        Commentaire: grade.comment || '-'
      }));

      await exportToExcel({
        data,
        sheetName: 'Notes',
        filename: 'bulletin-notes'
      });
    } catch (error) {
      console.error('Export error:', error);
      alert('Erreur lors de l\'export Excel');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Get teacher's school
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single();

      if (!profile?.school_id) return;

      // Fetch students
      const { data: studentsData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'student')
        .eq('school_id', profile.school_id)
        .order('first_name');

      setStudents(studentsData || []);

      // Fetch subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('school_id', profile.school_id)
        .order('name');

      setSubjects(subjectsData || []);

      // Fetch grades
      const { data: gradesData } = await supabase
        .from('grades')
        .select(`
          id,
          value,
          type,
          comment,
          created_at,
          student_profile_id,
          subject_id,
          student:student_profile_id(first_name, last_name),
          subject:subject_id(name)
        `)
        .eq('teacher_profile_id', session.user.id)
        .order('created_at', { ascending: false });

      setGrades(gradesData || []);
      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  const handleAddGrade = async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (!formData.student_id || !formData.subject_id || !formData.value) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const gradeValue = parseFloat(formData.value);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 20) {
      alert("La note doit être un nombre entre 0 et 20");
      return;
    }

    try {
      const { error } = await supabase
        .from('grades')
        .insert({
          student_id: formData.student_id,
          teacher_id: session.user.id,
          subject_id: formData.subject_id,
          value: gradeValue,
          type: formData.type,
          comment: formData.comment
        });

      if (error) {
        alert("Erreur lors de l'ajout de la note: " + error.message);
        return;
      }

      setShowModal(false);
      setFormData({ student_id: "", subject_id: "", value: "", type: "devoir", comment: "" });
      fetchData();
    } catch (error) {
      alert("Erreur: " + error.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notes attribuées</h2>
        <button 
          onClick={() => setShowModal(true)} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Ajouter une note
        </button>
      </div>

      <div className="mb-4 flex gap-4">
        <button 
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" 
          onClick={exportPDF}
        >
          📄 Exporter PDF
        </button>
        <button 
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600" 
          onClick={exportExcel}
        >
          📊 Exporter Excel
        </button>
      </div>

      {/* Modal d'ajout */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Ajouter une note</h3>
            <form onSubmit={handleAddGrade} className="space-y-4">
              {/* Élève */}
              <div>
                <label className="block text-sm font-medium mb-1">Élève *</label>
                <select 
                  value={formData.student_id} 
                  onChange={e => setFormData({ ...formData, student_id: e.target.value })} 
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Sélectionner un élève --</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Matière */}
              <div>
                <label className="block text-sm font-medium mb-1">Matière *</label>
                <select 
                  value={formData.subject_id} 
                  onChange={e => setFormData({ ...formData, subject_id: e.target.value })} 
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Sélectionner une matière --</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Note */}
                <div>
                  <label className="block text-sm font-medium mb-1">Note (0-20) *</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 15" 
                    value={formData.value} 
                    onChange={e => setFormData({ ...formData, value: e.target.value })} 
                    className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="20"
                    step="0.5"
                    required 
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({ ...formData, type: e.target.value })} 
                    className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="devoir">Devoir</option>
                    <option value="examen">Examen</option>
                    <option value="oral">Oral</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-sm font-medium mb-1">Commentaire</label>
                <textarea 
                  placeholder="Remarques optionnelles" 
                  value={formData.comment} 
                  onChange={e => setFormData({ ...formData, comment: e.target.value })} 
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>

              {/* Boutons */}
              <div className="flex justify-end space-x-2 pt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" 
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ student_id: "", subject_id: "", value: "", type: "devoir", comment: "" });
                  }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tableau des notes */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Élève</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Matière</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Note</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Commentaire</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {grades.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                  Aucune note ajoutée
                </td>
              </tr>
            ) : (
              grades.map(grade => (
                <tr key={grade.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{grade.student?.first_name} {grade.student?.last_name}</td>
                  <td className="px-4 py-3">{grade.subject?.name}</td>
                  <td className="px-4 py-3 text-center font-semibold">{grade.value}</td>
                  <td className="px-4 py-3 text-sm capitalize">{grade.type}</td>
                  <td className="px-4 py-3 text-sm">{new Date(grade.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-sm">{grade.comment || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
