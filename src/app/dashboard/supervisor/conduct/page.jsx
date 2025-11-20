"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupervisorConductPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [conduct, setConduct] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, profiles(first_name, last_name), class_id');
      setStudents(studentsData || []);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const handleSaveConduct = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    // Ajout d'une colonne conduct dans students si non existante
    await supabase.from('students').update({ conduct }).eq('id', selectedStudent.id);
    setShowModal(false);
    setSelectedStudent(null);
    setConduct("");
  };

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Remplir la conduite</h2>
      {loading ? <div>Chargement...</div> : (
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th>Élève</th>
              <th>Classe</th>
              <th>Conduite</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(stu => (
              <tr key={stu.id}>
                <td>{stu.profiles?.first_name} {stu.profiles?.last_name}</td>
                <td>{stu.class_id}</td>
                <td>{stu.conduct || '-'}</td>
                <td>
                  <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => { setSelectedStudent(stu); setShowModal(true); }}>Remplir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Modal de conduite */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Remplir la conduite de {selectedStudent.profiles?.first_name} {selectedStudent.profiles?.last_name}</h3>
            <form onSubmit={handleSaveConduct} className="space-y-4">
              <textarea placeholder="Conduite" value={conduct} onChange={e => setConduct(e.target.value)} className="w-full border px-3 py-2 rounded" required />
              <div className="flex justify-end space-x-2">
                <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => { setShowModal(false); setSelectedStudent(null); setConduct(""); }}>Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
