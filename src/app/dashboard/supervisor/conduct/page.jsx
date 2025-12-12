"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserGraduate, faEdit, faEye } from '@fortawesome/free-solid-svg-icons'

export default function SupervisorConductPage() {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ total: 0, excellent: 0, good: 0, fair: 0 });
  const [filter, setFilter] = useState({ conduct: 'all', class: '' });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [conduct, setConduct] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      const { data: studentsData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, class_id, conduct')
        .eq('role', 'student');
      setStudents(studentsData || []);
      const data = studentsData || [];
      setStats({
        total: data.length,
        excellent: data.filter(s => s.conduct === 'Excellent').length,
        good: data.filter(s => s.conduct === 'Bon').length,
        fair: data.filter(s => s.conduct === 'Passable').length
      });
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const handleSaveConduct = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    await supabase.from('profiles').update({ conduct }).eq('id', selectedStudent.id);
    setShowModal(false);
    setSelectedStudent(null);
    setConduct("");
    window.location.reload();
  };

  const filteredStudents = students.filter(stu => {
    if (filter.conduct !== 'all' && stu.conduct !== filter.conduct) return false;
    if (filter.class && stu.class_id !== filter.class) return false;
    return true;
  });

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
        <h1 className="text-2xl font-bold text-gray-900">Remplir la conduite</h1>
        <p className="text-gray-600 mt-2">Enregistrement et suivi du comportement des élèves</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUserGraduate} className="h-6 w-6 text-blue-600" />
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
                <FontAwesomeIcon icon={faUserGraduate} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Excellent</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.excellent}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUserGraduate} className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Bon</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.good}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUserGraduate} className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Passable</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.fair}</dd>
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <select 
                value={filter.conduct} 
                onChange={e => setFilter(f => ({ ...f, conduct: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Toutes les conduites</option>
                <option value="Excellent">Excellent</option>
                <option value="Bon">Bon</option>
                <option value="Passable">Passable</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des élèves */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Liste des élèves ({filteredStudents.length})</h3>
        </div>
        <div className="border-t border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Élève</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conduite</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map(stu => (
                <tr key={stu.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {stu.first_name} {stu.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stu.class_id || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stu.conduct || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => { setSelectedStudent(stu); setShowModal(true); }}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FontAwesomeIcon icon={faEdit} className="mr-1" /> Remplir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de conduite */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Remplir la conduite</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{selectedStudent.first_name} {selectedStudent.last_name}</strong>
            </p>
            <form onSubmit={handleSaveConduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Niveau de conduite</label>
                <select 
                  value={conduct} 
                  onChange={e => setConduct(e.target.value)} 
                  className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Bon">Bon</option>
                  <option value="Passable">Passable</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50" 
                  onClick={() => { setShowModal(false); setSelectedStudent(null); setConduct(""); }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
