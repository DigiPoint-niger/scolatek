"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StudentGradesPage() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: gradesData } = await supabase
        .from('grades')
        .select('*, subjects(name), teachers(profiles(first_name, last_name))')
        .eq('student_id', session.user.id)
        .order('created_at', { ascending: false });
      setGrades(gradesData || []);
      setLoading(false);
    };
    fetchGrades();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Mes notes</h2>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
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
