"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StudentHomeworksPage() {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeworks = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Récupérer la classe de l'étudiant depuis son profil
        const { data: studentProfile } = await supabase
          .from('profiles')
          .select('class_id')
          .eq('id', session.user.id)
          .eq('role', 'student')
          .single();

        if (!studentProfile?.class_id) return;

        // Récupérer les devoirs de la classe
        const { data: homeworksData } = await supabase
          .from('homeworks')
          .select(`
            id,
            title,
            description,
            due_date,
            subject:subject_id(name),
            teacher:teacher_profile_id(first_name, last_name)
          `)
          .eq('class_id', studentProfile.class_id)
          .order('due_date', { ascending: true });

        setHomeworks(homeworksData || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeworks();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Mes devoirs</h2>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th>Titre</th>
            <th>Matière</th>
            <th>Enseignant</th>
            <th>Date limite</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {homeworks.map(hw => (
            <tr key={hw.id}>
              <td>{hw.title}</td>
              <td>{hw.subject?.name}</td>
              <td>{hw.teacher?.first_name} {hw.teacher?.last_name}</td>
              <td>{new Date(hw.due_date).toLocaleDateString('fr-FR')}</td>
              <td>{hw.description || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
