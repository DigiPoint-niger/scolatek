"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ParentAbsencesPage() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbsences = async () => {
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

        // Pour l'instant, afficher les absences de l'école (TODO: implémenter la relation parent-enfant)
        const { data: absencesData } = await supabase
          .from('absences')
          .select(`
            id,
            date,
            reason,
            justified,
            student:student_profile_id(first_name, last_name),
            subject:subject_id(name),
            teacher:teacher_profile_id(first_name, last_name),
            class:class_id(name)
          `)
          .order('date', { ascending: false });

        setAbsences(absencesData || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
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
              <td>{abs.student?.first_name} {abs.student?.last_name}</td>
              <td>{new Date(abs.date).toLocaleDateString('fr-FR')}</td>
              <td>{abs.subject?.name || '-'}</td>
              <td>{abs.teacher?.first_name} {abs.teacher?.last_name}</td>
              <td>{abs.class?.name || '-'}</td>
              <td>{abs.justified ? 'Oui' : 'Non'}</td>
              <td>{abs.reason || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
