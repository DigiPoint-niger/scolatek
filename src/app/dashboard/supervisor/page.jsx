"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faGraduationCap, 
  faClipboard, 
  faListCheck,
  faEye,
  faClipboardList,
  faClock,
  faUserGroup,
  faCheckCircle,
  faAbacus
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function SupervisorDashboard() {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAbsences: 0,
    pendingReports: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupervisorData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, schools(*)')
        .eq('id', session.user.id)
        .single();
      if (!profile || profile.role !== 'supervisor' || profile.status !== 'active') return;
      setUser(profile);
      setSchool(profile.schools);

      // Fetch supervisor stats
      try {
        const { data: students } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'student')
          .eq('status', 'active');
        const { data: absences } = await supabase
          .from('absences')
          .select('id');
        const { data: reports } = await supabase
          .from('grades')
          .select('id');

        setStats({
          totalStudents: students?.length || 0,
          totalAbsences: absences?.length || 0,
          pendingReports: reports?.length || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }

      setLoading(false);
    };
    fetchSupervisorData();
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
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenue, {user?.first_name} {user?.last_name}
        </h1>
        <p className="text-gray-600 mt-2">
          École: {school?.name}
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUserGroup} className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total élèves</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalStudents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <FontAwesomeIcon icon={faClipboardList} className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total absences</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalAbsences}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faGraduationCap} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rapports d'examen</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingReports}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Actions Rapides</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Gestion académique et administrative</p>
        </div>
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Link
                href="/dashboard/supervisor/grades-report"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
                  <FontAwesomeIcon icon={faGraduationCap} className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Gérer les relevés de notes</p>
                  <p className="text-sm text-gray-500">Consulter et valider les résultats</p>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                </div>
              </Link>

              <Link
                href="/dashboard/supervisor/conduct"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className="flex-shrink-0 bg-green-100 rounded-md p-2">
                  <FontAwesomeIcon icon={faClipboard} className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Remplir la conduite</p>
                  <p className="text-sm text-gray-500">Enregistrer le comportement des élèves</p>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                </div>
              </Link>

              <Link
                href="/dashboard/supervisor/students-list"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-2">
                  <FontAwesomeIcon icon={faUserGroup} className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Listes d'élèves</p>
                  <p className="text-sm text-gray-500">Impression et gestion des listes</p>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                </div>
              </Link>

              <Link
                href="/dashboard/supervisor/promoted-list"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-2">
                  <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Liste de promotion</p>
                  <p className="text-sm text-gray-500">Gérer les promotions d'élèves</p>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                </div>
              </Link>

              <Link
                href="/dashboard/supervisor/absences"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className="flex-shrink-0 bg-red-100 rounded-md p-2">
                  <FontAwesomeIcon icon={faClipboardList} className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Justifier les absences</p>
                  <p className="text-sm text-gray-500">Valider et justifier les absences</p>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                </div>
              </Link>

              <Link
                href="/dashboard/supervisor/schedule"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className="flex-shrink-0 bg-gray-100 rounded-md p-2">
                  <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Emplois du temps</p>
                  <p className="text-sm text-gray-500">Modifier et consulter les horaires</p>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
