"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function TeacherAbsencesPage() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
    const fetchAbsences = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: absencesData } = await supabase
        .from('absences')
        .select('*, students(profiles(first_name, last_name)), subjects(name), classes(name)')
        .eq('teacher_id', session.user.id)
        .order('date', { ascending: false });
      setAbsences(absencesData || []);
      setLoading(false);
    };
    fetchAbsences();
  }, []);

  const handleAddAbsence = async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase
      .from('absences')
      .insert({
        student_id: formData.student_id,
        teacher_id: session.user.id,
        subject_id: formData.subject_id,
        class_id: formData.class_id,
        date: formData.date,
        reason: formData.reason,
        justified: formData.justified
      });
    if (!error) {
      setShowModal(false);
      setFormData({ student_id: "", subject_id: "", class_id: "", date: "", reason: "", justified: false });
      router.refresh();
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Absences signalées</h2>
      <button className="mb-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setShowModal(true)}>Signaler une absence</button>
      {/* Modal d'ajout */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Signaler une absence</h3>
            <form onSubmit={handleAddAbsence} className="space-y-4">
              <input type="text" placeholder="ID élève" value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <input type="text" placeholder="ID matière" value={formData.subject_id} onChange={e => setFormData({ ...formData, subject_id: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <input type="text" placeholder="ID classe" value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <textarea placeholder="Raison" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} className="w-full border px-3 py-2 rounded" />
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={formData.justified} onChange={e => setFormData({ ...formData, justified: e.target.checked })} />
                <span>Justifiée</span>
              </label>
              <div className="flex justify-end space-x-2">
                <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Tableau des absences */}
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th>Élève</th>
            <th>Date</th>
            <th>Matière</th>
            <th>Classe</th>
            <th>Justifiée</th>
            <th>Raison</th>
          </tr>
        </thead>
        <tbody>
          {absences.map(abs => (
            <tr key={abs.id}>
              <td>{abs.students?.profiles?.first_name} {abs.students?.profiles?.last_name}</td>
              <td>{new Date(abs.date).toLocaleDateString('fr-FR')}</td>
              <td>{abs.subjects?.name || '-'}</td>
              <td>{abs.classes?.name || '-'}</td>
              <td>{abs.justified ? 'Oui' : 'Non'}</td>
              <td>{abs.reason || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
