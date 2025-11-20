"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupervisorAbsencesPage() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [justification, setJustification] = useState("");

  useEffect(() => {
    const fetchAbsences = async () => {
      const { data: absencesData } = await supabase
        .from('absences')
        .select('*, students(profiles(first_name, last_name)), subjects(name), teachers(profiles(first_name, last_name)), classes(name)')
        .order('date', { ascending: false });
      setAbsences(absencesData || []);
      setLoading(false);
    };
    fetchAbsences();
  }, []);

  const handleJustifyAbsence = async (e) => {
    e.preventDefault();
    if (!selectedAbsence) return;
    const { error } = await supabase
      .from('absences')
      .update({ justified: true, reason: justification })
      .eq('id', selectedAbsence.id);
    if (!error) {
      setShowModal(false);
      setSelectedAbsence(null);
      setJustification("");
      window.location.reload();
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Justifier les absences</h2>
      {loading ? <div>Chargement...</div> : (
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
              <th>Action</th>
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
                <td>
                  {!abs.justified && (
                    <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => { setSelectedAbsence(abs); setShowModal(true); }}>Justifier</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Modal de justification */}
      {showModal && selectedAbsence && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Justifier l'absence du {new Date(selectedAbsence.date).toLocaleDateString('fr-FR')}</h3>
            <form onSubmit={handleJustifyAbsence} className="space-y-4">
              <textarea placeholder="Motif de justification" value={justification} onChange={e => setJustification(e.target.value)} className="w-full border px-3 py-2 rounded" required />
              <div className="flex justify-end space-x-2">
                <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => { setShowModal(false); setSelectedAbsence(null); setJustification(""); }}>Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
