"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupervisorPromotedListPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotedStudents = async () => {
      // Ajout d'une colonne promoted (boolean) dans students si non existante
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, profiles(first_name, last_name), class_id, promoted')
        .eq('promoted', true)
        .order('last_name');
      setStudents(studentsData || []);
      setLoading(false);
    };
    fetchPromotedStudents();
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Élèves promus à l'année suivante</h2>
      {loading ? <div>Chargement...</div> : (
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Classe</th>
            </tr>
          </thead>
          <tbody>
            {students.map(stu => (
              <tr key={stu.id}>
                <td>{stu.profiles?.last_name}</td>
                <td>{stu.profiles?.first_name}</td>
                <td>{stu.class_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
