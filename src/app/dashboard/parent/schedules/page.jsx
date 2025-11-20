"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ParentSchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      // Récupérer les enfants
      const { data: parent } = await supabase
        .from('parents')
        .select('id')
        .eq('profile_id', session.user.id)
        .single();
      if (!parent) return;
      const { data: parentStudents } = await supabase
        .from('parent_students')
        .select('student_id, students(class_id)')
        .eq('parent_id', parent.id);
      const classIds = parentStudents?.map(ps => ps.students?.class_id).filter(Boolean) || [];
      if (classIds.length === 0) return;
      // Exemple : table schedules à ajouter si besoin
      const { data: schedulesData } = await supabase
        .from('schedules')
        .select('*')
        .in('class_id', classIds)
        .order('day, start_time');
      setSchedules(schedulesData || []);
      setLoading(false);
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
