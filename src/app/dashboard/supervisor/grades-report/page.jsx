"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupervisorGradesReportPage() {
  const [grades, setGrades] = useState([]);
  const [filter, setFilter] = useState({ class_id: "", subject_id: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      let query = supabase.from('grades').select('*, students(profiles(first_name, last_name, class_id)), subjects(name), classes(name)');
      if (filter.class_id) query = query.eq('students.class_id', filter.class_id);
      if (filter.subject_id) query = query.eq('subject_id', filter.subject_id);
      const { data: gradesData } = await query.order('created_at', { ascending: false });
      setGrades(gradesData || []);
      setLoading(false);
    };
    fetchGrades();
  }, [filter]);

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Relevés de notes</h2>
      {/* Filtres */}
      <div className="mb-4 flex gap-4">
        <input type="text" placeholder="ID classe" value={filter.class_id} onChange={e => setFilter(f => ({ ...f, class_id: e.target.value }))} className="border px-3 py-2 rounded" />
        <input type="text" placeholder="ID matière" value={filter.subject_id} onChange={e => setFilter(f => ({ ...f, subject_id: e.target.value }))} className="border px-3 py-2 rounded" />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => window.print()}>Imprimer</button>
      </div>
      {/* Tableau des notes */}
      {loading ? <div>Chargement...</div> : (
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th>Élève</th>
              <th>Classe</th>
              <th>Matière</th>
              <th>Note</th>
              <th>Type</th>
              <th>Date</th>
              <th>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {grades.map(grade => (
              <tr key={grade.id}>
                <td>{grade.students?.profiles?.first_name} {grade.students?.profiles?.last_name}</td>
                <td>{grade.classes?.name}</td>
                <td>{grade.subjects?.name}</td>
                <td>{grade.value}</td>
                <td>{grade.type}</td>
                <td>{new Date(grade.created_at).toLocaleDateString('fr-FR')}</td>
                <td>{grade.comment || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
