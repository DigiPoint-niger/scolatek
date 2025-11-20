"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupervisorStudentsListPage() {
  // Export PDF avec jspdf
  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Liste des élèves', 10, 15);
    let y = 25;
    students.forEach((stu, i) => {
      doc.text(`${i + 1}. ${stu.profiles?.last_name || ''} ${stu.profiles?.first_name || ''} | ${stu.class_id} | ${stu.status}` , 10, y);
      y += 10;
      if (y > 270) {
        doc.addPage();
        y = 15;
      }
    });
    doc.save('liste-eleves.pdf');
  };

  // Export Excel avec xlsx
  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const data = students.map(stu => ({
      Nom: stu.profiles?.last_name,
      Prénom: stu.profiles?.first_name,
      Classe: stu.class_id,
      Statut: stu.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Élèves');
    XLSX.writeFile(wb, 'liste-eleves.xlsx');
  };
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState({ class_id: "", status: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      let query = supabase.from('students').select('id, profiles(first_name, last_name), class_id, status');
      if (filter.class_id) query = query.eq('class_id', filter.class_id);
      if (filter.status) query = query.eq('status', filter.status);
      const { data: studentsData } = await query.order('last_name');
      setStudents(studentsData || []);
      setLoading(false);
    };
    fetchStudents();
  }, [filter]);

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Liste des élèves</h2>
      {/* Filtres */}
      <div className="mb-4 flex gap-4">
        <input type="text" placeholder="ID classe" value={filter.class_id} onChange={e => setFilter(f => ({ ...f, class_id: e.target.value }))} className="border px-3 py-2 rounded" />
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} className="border px-3 py-2 rounded">
          <option value="">Tous</option>
          <option value="active">Actif</option>
          <option value="transferred">Transféré</option>
          <option value="suspended">Suspendu</option>
          <option value="graduated">Diplômé</option>
        </select>
  <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={exportPDF}>Exporter PDF</button>
  <button className="px-4 py-2 bg-yellow-500 text-white rounded" onClick={exportExcel}>Exporter Excel</button>
  <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => window.print()}>Imprimer</button>
      </div>
      {/* Tableau des élèves */}
      {loading ? <div>Chargement...</div> : (
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Classe</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map(stu => (
              <tr key={stu.id}>
                <td>{stu.profiles?.last_name}</td>
                <td>{stu.profiles?.first_name}</td>
                <td>{stu.class_id}</td>
                <td>{stu.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
