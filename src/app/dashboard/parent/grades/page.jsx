"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ParentGradesPage() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
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

        // Pour l'instant, afficher les notes de l'école (TODO: implémenter la relation parent-enfant)
        const { data: gradesData } = await supabase
          .from('grades')
          .select(`
            id,
            value,
            type,
            created_at,
            student:student_profile_id(first_name, last_name),
            subject:subject_id(name),
            teacher:teacher_profile_id(first_name, last_name)
          `)
          .order('created_at', { ascending: false });

        setGrades(gradesData || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
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
              <td>{grade.student?.first_name} {grade.student?.last_name}</td>
              <td>{grade.subject?.name}</td>
              <td>{grade.value}</td>
              <td>{grade.type}</td>
              <td>{grade.teacher?.first_name} {grade.teacher?.last_name}</td>
              <td>{new Date(grade.created_at).toLocaleDateString('fr-FR')}</td>
              <td>{grade.comment || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
