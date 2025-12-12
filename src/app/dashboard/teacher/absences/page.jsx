"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function TeacherAbsencesPage() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [school, setSchool] = useState(null);
  const [formData, setFormData] = useState({
    student_id: "",
    subject_id: "",
    class_id: "",
    date: "",
    reason: "",
    justified: false
  });
  const router = useRouter();

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

      setSchool(profile.school_id);

      // Fetch students and their classes
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, profiles(first_name, last_name), classes(id, name)')
        .eq('school_id', profile.school_id);

      setStudents(studentsData || []);

      // Fetch subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('school_id', profile.school_id);

      setSubjects(subjectsData || []);

      // Fetch classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', profile.school_id);

      setClasses(classesData || []);

      // Fetch absences
      const { data: absencesData } = await supabase
        .from('absences')
        .select('*, students(profiles(first_name, last_name)), subjects(name), classes(name)')
        .eq('teacher_id', session.user.id)
        .order('date', { ascending: false });

      setAbsences(absencesData || []);
      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  const handleAddAbsence = async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (!formData.student_id || !formData.date) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const { error } = await supabase
        .from('absences')
        .insert({
          student_id: formData.student_id,
          teacher_id: session.user.id,
          subject_id: formData.subject_id || null,
          class_id: formData.class_id || null,
          date: formData.date,
          reason: formData.reason,
          justified: formData.justified
        });

      if (error) {
        alert("Erreur lors de l'ajout de l'absence: " + error.message);
        return;
      }

      setShowModal(false);
      setFormData({ student_id: "", subject_id: "", class_id: "", date: "", reason: "", justified: false });
      fetchData();
    } catch (error) {
      alert("Erreur: " + error.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Absences signalées</h2>
        <button 
          onClick={() => setShowModal(true)} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Signaler une absence
        </button>
      </div>

      {/* Modal d'ajout */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Signaler une absence</h3>
            <form onSubmit={handleAddAbsence} className="space-y-4">
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
                      {student.profiles?.first_name} {student.profiles?.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input 
                  type="date" 
                  value={formData.date} 
                  onChange={e => setFormData({ ...formData, date: e.target.value })} 
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required 
                />
              </div>

              {/* Matière */}
              <div>
                <label className="block text-sm font-medium mb-1">Matière</label>
                <select 
                  value={formData.subject_id} 
                  onChange={e => setFormData({ ...formData, subject_id: e.target.value })} 
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Optionnel --</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Classe */}
              <div>
                <label className="block text-sm font-medium mb-1">Classe</label>
                <select 
                  value={formData.class_id} 
                  onChange={e => setFormData({ ...formData, class_id: e.target.value })} 
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Optionnel --</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Raison */}
              <div>
                <label className="block text-sm font-medium mb-1">Raison</label>
                <textarea 
                  placeholder="Motif de l'absence" 
                  value={formData.reason} 
                  onChange={e => setFormData({ ...formData, reason: e.target.value })} 
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>

              {/* Justifiée */}
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={formData.justified} 
                  onChange={e => setFormData({ ...formData, justified: e.target.checked })} 
                  className="w-4 h-4"
                />
                <span>Absence justifiée</span>
              </label>

              {/* Boutons */}
              <div className="flex justify-end space-x-2 pt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" 
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ student_id: "", subject_id: "", class_id: "", date: "", reason: "", justified: false });
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

      {/* Tableau des absences */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Élève</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Matière</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Classe</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Justifiée</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Raison</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {absences.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                  Aucune absence signalée
                </td>
              </tr>
            ) : (
              absences.map(abs => (
                <tr key={abs.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{abs.students?.profiles?.first_name} {abs.students?.profiles?.last_name}</td>
                  <td className="px-4 py-3">{new Date(abs.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">{abs.subjects?.name || '-'}</td>
                  <td className="px-4 py-3">{abs.classes?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${abs.justified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {abs.justified ? 'Justifiée' : 'Non'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{abs.reason || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
