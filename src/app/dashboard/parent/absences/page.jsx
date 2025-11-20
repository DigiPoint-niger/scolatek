"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ParentAbsencesPage() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbsences = async () => {
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
        .select('student_id')
        .eq('parent_id', parent.id);
      const studentIds = parentStudents?.map(ps => ps.student_id) || [];
      if (studentIds.length === 0) return;
      const { data: absencesData } = await supabase
        .from('absences')
        .select('*, students(profiles(first_name, last_name)), subjects(name), teachers(profiles(first_name, last_name)), classes(name)')
        .in('student_id', studentIds)
        .order('date', { ascending: false });
      setAbsences(absencesData || []);
      setLoading(false);
    };
    fetchAbsences();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Absences de mes enfants</h2>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th>Élève</th>
            <th>Date</th>
            <th>Matière</th>
            <th>Enseignant</th>
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
              <td>{abs.teachers?.profiles?.first_name} {abs.teachers?.profiles?.last_name}</td>
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
