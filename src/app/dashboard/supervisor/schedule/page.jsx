"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupervisorSchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ class_id: "", day: "", start_time: "", end_time: "", subject: "", teacher: "" });

  useEffect(() => {
    const fetchSchedules = async () => {
      const { data: schedulesData } = await supabase
        .from('schedules')
        .select('*')
        .order('day, start_time');
      setSchedules(schedulesData || []);
      setLoading(false);
    };
    fetchSchedules();
  }, []);

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('schedules')
      .insert(formData);
    if (!error) {
      setShowModal(false);
      setFormData({ class_id: "", day: "", start_time: "", end_time: "", subject: "", teacher: "" });
      window.location.reload();
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Modifier les emplois du temps</h2>
      <button className="mb-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setShowModal(true)}>Ajouter un créneau</button>
      {/* Modal d'ajout */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Ajouter un créneau</h3>
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <input type="text" placeholder="ID classe" value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <input type="text" placeholder="Jour" value={formData.day} onChange={e => setFormData({ ...formData, day: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <input type="text" placeholder="Heure début" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <input type="text" placeholder="Heure fin" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <input type="text" placeholder="Matière" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <input type="text" placeholder="Enseignant" value={formData.teacher} onChange={e => setFormData({ ...formData, teacher: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <div className="flex justify-end space-x-2">
                <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Tableau des emplois du temps */}
      {loading ? <div>Chargement...</div> : (
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
      )}
    </div>
  );
}
