"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ParentSchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Récupérer le profil parent
        const { data: parentProfile } = await supabase
          .from('profiles')
          .select('id, school_id')
          .eq('id', session.user.id)
          .eq('role', 'parent')
          .single();

        if (!parentProfile?.school_id) return;

        // Récupérer les emplois du temps de l'école (TODO: implémenter la relation parent-enfant)
        const { data: schedulesData } = await supabase
          .from('schedules')
          .select(`
            id,
            class_id,
            day,
            start_time,
            end_time,
            subject_id,
            teacher_profile_id
          `)
          .order('day, start_time');

        setSchedules(schedulesData || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Emplois du temps des enfants</h2>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th>Classe</th>
            <th>Jour</th>
            <th>Heure début</th>
            <th>Heure fin</th>
            <th>Matière</th>
            <th>Enseignant</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map(item => (
            <tr key={item.id}>
              <td>{item.class_id}</td>
              <td>{item.day}</td>
              <td>{item.start_time}</td>
              <td>{item.end_time}</td>
              <td>{item.subject}</td>
              <td>{item.teacher}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
