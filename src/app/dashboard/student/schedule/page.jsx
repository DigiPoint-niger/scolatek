"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { exportToExcel } from "@/lib/exportUtils";

export default function StudentSchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // Export PDF to server (using pdfkit)
  const exportPDF = async () => {
    if (schedule.length === 0) {
      alert("Aucun emploi du temps à exporter");
      return;
    }

    try {
      const response = await fetch('/api/export/schedule-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'emploi-du-temps.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Erreur lors de l\'export PDF');
    }
  };

  // Export Excel using xlsx library
  const exportExcel = async () => {
    if (schedule.length === 0) {
      alert("Aucun emploi du temps à exporter");
      return;
    }

    try {
      const data = schedule.map(item => ({
        Jour: item.day || '-',
        "Heure début": item.start_time || '-',
        "Heure fin": item.end_time || '-',
        Matière: item.subject || '-',
        Enseignant: item.teacher || '-'
      }));

      await exportToExcel({
        data,
        sheetName: 'Emploi du temps',
        filename: 'emploi-du-temps'
      });
    } catch (error) {
      console.error('Export error:', error);
      alert('Erreur lors de l\'export Excel');
    }
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      // Récupérer la classe de l'élève
      const { data: student } = await supabase
        .from('students')
        .select('class_id')
        .eq('profile_id', session.user.id)
        .single();
      if (!student) return;
      // Exemple : table schedules à ajouter si besoin
      const { data: scheduleData } = await supabase
        .from('schedules')
        .select('*')
        .eq('class_id', student.class_id)
        .order('day, start_time');
      setSchedule(scheduleData || []);
      setLoading(false);
    };
    fetchSchedule();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Emploi du temps</h2>
      <div className="mb-4 flex gap-4">
        <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={exportPDF}>Exporter PDF</button>
        <button className="px-4 py-2 bg-yellow-500 text-white rounded" onClick={exportExcel}>Exporter Excel</button>
      </div>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th>Jour</th>
            <th>Heure début</th>
            <th>Heure fin</th>
            <th>Matière</th>
            <th>Enseignant</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map(item => (
            <tr key={item.id}>
              <td>{item.day}</td>
              <td>{item.start_time}</td>
              <td>{item.end_time}</td>
              <td>{item.subject}</td>
              <td>{item.teacher}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
