"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUserGraduate, 
  faClipboardList, 
  faBook,
  faEye,
  faFileAlt,
  faGraduationCap,
  faChalkboardUser
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalGrades: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherData = async () => {
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
      if (!profile || profile.role !== 'teacher' || profile.status !== 'active') {
        router.push("/unauthorized");
        return;
      }
      setUser(profile);
      setSchool(profile.schools);

      // Fetch teacher stats
      try {
        const { data: homeworks } = await supabase
          .from('homeworks')
          .select('id')
          .eq('teacher_profile_id', profile.id);
        const { data: grades } = await supabase
          .from('grades')
          .select('id')
          .eq('teacher_profile_id', profile.id);

        setStats({
          totalClasses: homeworks?.length || 0,
          totalStudents: grades?.length || 0,
          totalGrades: grades?.length || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }

      setLoading(false);
    };
    fetchTeacherData();
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
                <FontAwesomeIcon icon={faChalkboardUser} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Mes classes</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalClasses}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Mes étudiants</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalStudents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <FontAwesomeIcon icon={faBook} className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Notes entrées</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalGrades}</dd>
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
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Accédez à vos fonctionnalités principales</p>
        </div>
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4">
              <Link
                href="/dashboard/teacher/grades"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
                  <FontAwesomeIcon icon={faBook} className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Entrer les notes</p>
                  <p className="text-sm text-gray-500">Enregistrer et mettre à jour les évaluations</p>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                </div>
              </Link>

              <Link
                href="/dashboard/teacher/absences"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-2">
                  <FontAwesomeIcon icon={faClipboardList} className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Gérer les absences</p>
                  <p className="text-sm text-gray-500">Enregistrer les présences et absences</p>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                </div>
              </Link>

              <Link
                href="/dashboard/teacher/homeworks"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className="flex-shrink-0 bg-green-100 rounded-md p-2">
                  <FontAwesomeIcon icon={faFileAlt} className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Créer des devoirs</p>
                  <p className="text-sm text-gray-500">Assigner du travail aux étudiants</p>
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
