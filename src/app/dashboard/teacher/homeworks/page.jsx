"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function TeacherHomeworksPage() {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    class_id: "",
    subject_id: "",
    title: "",
    description: "",
    due_date: ""
  });
  const router = useRouter();

  useEffect(() => {
    const fetchHomeworks = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: homeworksData } = await supabase
        .from('homeworks')
        .select('*, classes(name), subjects(name)')
        .eq('teacher_id', session.user.id)
        .order('due_date', { ascending: true });
      setHomeworks(homeworksData || []);
      setLoading(false);
    };
    fetchHomeworks();
  }, []);

  const handleAddHomework = async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase
      .from('homeworks')
      .insert({
        class_id: formData.class_id,
        teacher_id: session.user.id,
        subject_id: formData.subject_id,
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date
      });
    if (!error) {
      setShowModal(false);
      setFormData({ class_id: "", subject_id: "", title: "", description: "", due_date: "" });
      router.refresh();
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Devoirs attribués</h2>
      <button className="mb-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setShowModal(true)}>Ajouter un devoir</button>
      {/* Modal d'ajout */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Ajouter un devoir</h3>
            <form onSubmit={handleAddHomework} className="space-y-4">
              <input type="text" placeholder="ID classe" value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <input type="text" placeholder="ID matière" value={formData.subject_id} onChange={e => setFormData({ ...formData, subject_id: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <input type="text" placeholder="Titre" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border px-3 py-2 rounded" />
              <input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <div className="flex justify-end space-x-2">
                <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Tableau des devoirs */}
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th>Classe</th>
            <th>Matière</th>
            <th>Titre</th>
            <th>Date limite</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {homeworks.map(hw => (
            <tr key={hw.id}>
              <td>{hw.classes?.name}</td>
              <td>{hw.subjects?.name}</td>
              <td>{hw.title}</td>
              <td>{new Date(hw.due_date).toLocaleDateString('fr-FR')}</td>
              <td>{hw.description || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
