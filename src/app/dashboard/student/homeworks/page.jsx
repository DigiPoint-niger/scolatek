"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StudentHomeworksPage() {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeworks = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      // Récupérer la classe de l'élève
      const { data: student } = await supabase
        .from('students')
        .select('class_id')
        .eq('profile_id', session.user.id)
        .single();
      if (!student) return;
      const { data: homeworksData } = await supabase
        .from('homeworks')
        .select('*, subjects(name), teachers(profiles(first_name, last_name))')
        .eq('class_id', student.class_id)
        .order('due_date', { ascending: true });
      setHomeworks(homeworksData || []);
      setLoading(false);
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
              <td>{hw.subjects?.name}</td>
              <td>{hw.teachers?.profiles?.first_name} {hw.teachers?.profiles?.last_name}</td>
              <td>{new Date(hw.due_date).toLocaleDateString('fr-FR')}</td>
              <td>{hw.description || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
