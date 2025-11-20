"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ParentGradesPage() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
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
      const { data: gradesData } = await supabase
        .from('grades')
        .select('*, students(profiles(first_name, last_name)), subjects(name), teachers(profiles(first_name, last_name))')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });
      setGrades(gradesData || []);
      setLoading(false);
    };
    fetchGrades();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Notes de mes enfants</h2>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th>Élève</th>
            <th>Matière</th>
            <th>Note</th>
            <th>Type</th>
            <th>Enseignant</th>
            <th>Date</th>
            <th>Commentaire</th>
          </tr>
        </thead>
        <tbody>
          {grades.map(grade => (
            <tr key={grade.id}>
              <td>{grade.students?.profiles?.first_name} {grade.students?.profiles?.last_name}</td>
              <td>{grade.subjects?.name}</td>
              <td>{grade.value}</td>
              <td>{grade.type}</td>
              <td>{grade.teachers?.profiles?.first_name} {grade.teachers?.profiles?.last_name}</td>
              <td>{new Date(grade.created_at).toLocaleDateString('fr-FR')}</td>
              <td>{grade.comment || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
