"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function TeacherHomeworksPage() {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    class_id: "",
    subject_id: "",
    title: "",
    description: "",
    due_date: ""
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

      // Fetch classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', profile.school_id);

      setClasses(classesData || []);

      // Fetch subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('school_id', profile.school_id);

      setSubjects(subjectsData || []);

      // Fetch homeworks
      const { data: homeworksData } = await supabase
        .from('homeworks')
        .select('*, classes(name), subjects(name)')
        .eq('teacher_id', session.user.id)
        .order('due_date', { ascending: true });

      setHomeworks(homeworksData || []);
      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  const handleAddHomework = async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (!formData.class_id || !formData.subject_id || !formData.title || !formData.due_date) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const { error } = await supabase
        .from('homeworks')
        .insert({
          class_id: formData.class_id,
          teacher_id: session.user.id,
          subject_id: formData.subject_id,
          title: formData.title,
          description: formData.description,
          due_date: formData.due_date + "T23:59:00"
        });

      if (error) {
        alert("Erreur lors de l'ajout du devoir: " + error.message);
        return;
      }

      setShowModal(false);
      setFormData({ class_id: "", subject_id: "", title: "", description: "", due_date: "" });
      fetchData();
    } catch (error) {
      alert("Erreur: " + error.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Devoirs attribués</h2>
        <button 
          onClick={() => setShowModal(true)} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Ajouter un devoir
        </button>
      </div>

      {/* Modal d'ajout */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Ajouter un devoir</h3>
            <form onSubmit={handleAddHomework} className="space-y-4">
              {/* Classe */}
              <div>
                <label className="block text-sm font-medium mb-1">Classe *</label>
                <select 
                  value={formData.class_id} 
                  onChange={e => setFormData({ ...formData, class_id: e.target.value })} 
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Sélectionner une classe --</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
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

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Exercices sur les fractions" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required 
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  placeholder="Consignes et détails du devoir" 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>

              {/* Date limite */}
              <div>
                <label className="block text-sm font-medium mb-1">Date limite *</label>
                <input 
                  type="date" 
                  value={formData.due_date} 
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })} 
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required 
                />
              </div>

              {/* Boutons */}
              <div className="flex justify-end space-x-2 pt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" 
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ class_id: "", subject_id: "", title: "", description: "", due_date: "" });
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

      {/* Tableau des devoirs */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Classe</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Matière</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Titre</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date limite</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {homeworks.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                  Aucun devoir attribué
                </td>
              </tr>
            ) : (
              homeworks.map(hw => (
                <tr key={hw.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{hw.classes?.name}</td>
                  <td className="px-4 py-3">{hw.subjects?.name}</td>
                  <td className="px-4 py-3 font-medium">{hw.title}</td>
                  <td className="px-4 py-3">{new Date(hw.due_date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-sm">{hw.description || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
