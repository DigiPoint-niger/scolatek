"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClipboardList, faCheckCircle, faClock, faEye } from '@fortawesome/free-solid-svg-icons'

export default function SupervisorAbsencesPage() {
  const [absences, setAbsences] = useState([]);
  const [stats, setStats] = useState({ total: 0, justified: 0, pending: 0 });
  const [filter, setFilter] = useState({ status: 'all', class: '' });
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
      
      const data = absencesData || [];
      setAbsences(data);
      setStats({
        total: data.length,
        justified: data.filter(a => a.justified).length,
        pending: data.filter(a => !a.justified).length
      });
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

  const filteredAbsences = absences.filter(abs => {
    if (filter.status === 'justified') return abs.justified;
    if (filter.status === 'pending') return !abs.justified;
    if (filter.class) return abs.classes?.name === filter.class;
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
        <h1 className="text-2xl font-bold text-gray-900">Justifier les absences</h1>
        <p className="text-gray-600 mt-2">Gestion et suivi des absences des élèves</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <FontAwesomeIcon icon={faClipboardList} className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total absences</dt>
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
                <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Justifiées</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.justified}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">En attente</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
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
                value={filter.status} 
                onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente de justification</option>
                <option value="justified">Justifiées</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des absences */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Liste des absences ({filteredAbsences.length})</h3>
        </div>
        <div className="border-t border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Élève</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matière</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAbsences.map(abs => (
                <tr key={abs.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {abs.students?.profiles?.first_name} {abs.students?.profiles?.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(abs.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {abs.classes?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {abs.subjects?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      abs.justified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {abs.justified ? '✓ Justifiée' : '⏳ En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {!abs.justified && (
                      <button 
                        onClick={() => { setSelectedAbsence(abs); setShowModal(true); }}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-1" /> Justifier
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de justification */}
      {showModal && selectedAbsence && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Justifier l'absence</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{selectedAbsence.students?.profiles?.first_name} {selectedAbsence.students?.profiles?.last_name}</strong> - {new Date(selectedAbsence.date).toLocaleDateString('fr-FR')}
            </p>
            <form onSubmit={handleJustifyAbsence} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motif de justification</label>
                <textarea 
                  placeholder="Entrez le motif de l'absence..." 
                  value={justification} 
                  onChange={e => setJustification(e.target.value)} 
                  className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  rows="4"
                  required 
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  type="button" 
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50" 
                  onClick={() => { setShowModal(false); setSelectedAbsence(null); setJustification(""); }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Justifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
