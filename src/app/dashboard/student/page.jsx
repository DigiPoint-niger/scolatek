"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faBook, 
  faCalendarAlt, 
  faClipboardList,
  faEye,
  faStar
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [stats, setStats] = useState({
    myGrades: 0,
    absences: 0,
    pendingHomework: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, schools(*)')
        .eq('id', session.user.id)
        .single();
      if (!profile || profile.role !== 'student' || profile.status !== 'active') {
        router.push("/unauthorized");
        return;
      }
      setUser(profile);
      setSchool(profile.schools);

      // Fetch student stats
      try {
        const { data: grades } = await supabase
          .from('grades')
          .select('id')
          .eq('student_profile_id', profile.id);
        const { data: absences } = await supabase
          .from('absences')
          .select('id')
          .eq('student_profile_id', profile.id);
        const { data: homeworks } = await supabase
          .from('homeworks')
          .select('id');

        setStats({
          myGrades: grades?.length || 0,
          absences: absences?.length || 0,
          pendingHomework: homeworks?.length || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }

      setLoading(false);
    };
    fetchStudentData();
  }, [router]);

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
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faStar} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Mes notes</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.myGrades}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Absences</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.absences}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <FontAwesomeIcon icon={faBook} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Devoirs en attente</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingHomework}</dd>
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
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Accédez à vos informations académiques</p>
        </div>
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4">
              <Link
                href="/dashboard/student/grades"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
                  <FontAwesomeIcon icon={faStar} className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Consulter mes notes</p>
                  <p className="text-sm text-gray-500">Voir toutes vos évaluations</p>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                </div>
              </Link>

              <Link
                href="/dashboard/student/absences"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className="flex-shrink-0 bg-red-100 rounded-md p-2">
                  <FontAwesomeIcon icon={faClipboardList} className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Voir mes absences</p>
                  <p className="text-sm text-gray-500">Consultez votre historique de présence</p>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                </div>
              </Link>

              <Link
                href="/dashboard/student/schedule"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className="flex-shrink-0 bg-green-100 rounded-md p-2">
                  <FontAwesomeIcon icon={faCalendarAlt} className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Voir mon emploi du temps</p>
                  <p className="text-sm text-gray-500">Consultez votre calendrier scolaire</p>
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
