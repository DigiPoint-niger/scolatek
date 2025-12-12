"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faUserGraduate } from '@fortawesome/free-solid-svg-icons'

export default function SupervisorPromotedListPage() {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ total: 0, promoted: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotedStudents = async () => {
      const { data: allStudents } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, class_id, promoted')
        .eq('role', 'student');
      
      const promoted = (allStudents || []).filter(s => s.promoted === true);
      const total = allStudents?.length || 1;
      
      setStudents(promoted);
      setStats({
        total: promoted.length,
        promoted: promoted.length,
        percentage: Math.round((promoted.length / total) * 100)
      });
      setLoading(false);
    };
    fetchPromotedStudents();
  }, []);

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
        <h1 className="text-2xl font-bold text-gray-900">Liste de promotion</h1>
        <p className="text-gray-600 mt-2">Élèves promus à l'année suivante</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total promus</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUserGraduate} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Taux de promotion</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.percentage}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des élèves promus */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Élèves promus ({students.length})</h3>
        </div>
        <div className="border-t border-gray-200 overflow-x-auto">
          {students.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prénom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe actuelle</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="text-gray-500">Aucun élève promu pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
