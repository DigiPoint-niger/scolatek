"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { exportToExcel } from "@/lib/exportUtils";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faFileExcel, faFilePdf, faPrint } from '@fortawesome/free-solid-svg-icons'

export default function SupervisorStudentsListPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [filter, setFilter] = useState({ class_id: "", status: "" });
  const [loading, setLoading] = useState(true);

  // Export PDF to server (using pdfkit)
  const exportPDF = async () => {
    if (students.length === 0) {
      alert("Aucun élève à exporter");
      return;
    }

    try {
      const response = await fetch('/api/export/students-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'liste-eleves.pdf';
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
    if (students.length === 0) {
      alert("Aucun élève à exporter");
      return;
    }

    try {
      const data = students.map(stu => ({
        Nom: stu.last_name || '',
        Prénom: stu.first_name || '',
        Classe: stu.class_id || '-',
        Statut: stu.status || '-'
      }));

      await exportToExcel({
        data,
        sheetName: 'Élèves',
        filename: 'liste-eleves'
      });
    } catch (error) {
      console.error('Export error:', error);
      alert('Erreur lors de l\'export Excel');
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // Get supervisor's school
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('No session found');
          setLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('school_id, role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setLoading(false);
          return;
        }

        if (!profile?.school_id) {
          console.error('No school_id found for supervisor');
          setLoading(false);
          return;
        }

        // Récupérer les classes
        const { data: classesData } = await supabase
          .from('classes')
          .select('id, name')
          .eq('school_id', profile.school_id)
          .order('name');

        setClasses(classesData || []);

        // Fetch students from supervisor's school (using consolidated profiles table)
        let query = supabase
          .from('profiles')
          .select('id, first_name, last_name, class_id, status, school_id, role')
          .eq('role', 'student')
          .eq('school_id', profile.school_id);

        if (filter.class_id) query = query.eq('class_id', filter.class_id);
        if (filter.status) query = query.eq('status', filter.status);

        const { data: studentsData, error } = await query.order('last_name');

        console.log('Students fetched:', studentsData?.length || 0);

        if (error) {
          console.error('Error fetching students:', error);
        }

        const data = studentsData || [];
        setStudents(data);
        setStats({
          total: data.length,
          active: data.filter(s => s.status === 'active').length,
          inactive: data.filter(s => s.status !== 'active').length
        });
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [filter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Liste des élèves</h1>
        <p className="text-gray-600 mt-2">Gestion et export de la liste d'élèves</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total élèves</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Actifs</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.active}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Inactifs</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.inactive}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Filtres</h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <select 
                value={filter.class_id} 
                onChange={e => setFilter(f => ({ ...f, class_id: e.target.value }))} 
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Toutes les classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              <select 
                value={filter.status} 
                onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} 
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="transferred">Transféré</option>
                <option value="suspended">Suspendu</option>
                <option value="graduated">Diplômé</option>
              </select>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FontAwesomeIcon icon={faPrint} className="mr-2" /> Imprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Boutons d'export */}
      <div className="mb-8 flex gap-3">
        <button 
          onClick={exportPDF}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <FontAwesomeIcon icon={faFilePdf} className="mr-2" /> Exporter PDF
        </button>
        <button 
          onClick={exportExcel}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <FontAwesomeIcon icon={faFileExcel} className="mr-2" /> Exporter Excel
        </button>
      </div>

      {/* Tableau des élèves */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Élèves ({students.length})</h3>
        </div>
        <div className="border-t border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prénom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map(stu => (
                <tr key={stu.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {stu.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stu.first_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stu.class_id || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      stu.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : stu.status === 'graduated'
                        ? 'bg-blue-100 text-blue-800'
                        : stu.status === 'transferred'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {stu.status === 'active' && '✓ Actif'}
                      {stu.status === 'graduated' && '✓ Diplômé'}
                      {stu.status === 'transferred' && '➜ Transféré'}
                      {stu.status === 'suspended' && '⊘ Suspendu'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
