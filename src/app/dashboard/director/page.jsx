// /dashboard/director/page.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUserGraduate, 
  faChalkboardTeacher, 
  faUsers, 
  faMoneyBill,
  faClock,
  faCheckCircle,
  faEye,
  faSchool,
  faUserPlus,
  faMoneyCheckDollar
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

// Fonction pour formater la date relative
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'À l\'instant';
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} minutes`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} heures`;
  if (diffInSeconds < 2592000) return `Il y a ${Math.floor(diffInSeconds / 86400)} jours`;
  
  return date.toLocaleDateString('fr-FR');
};

export default function DirectorDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    activeStudents: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchRecentActivities = async (schoolId) => {
    try {
      const activities = [];

      // Récupérer les étudiants récemment inscrits
      const { data: recentStudents } = await supabase
        .from('students')
        .select(`
          id,
          created_at,
          profiles!inner(first_name, last_name),
          classes(name)
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentStudents) {
        recentStudents.forEach(student => {
          activities.push({
            id: `student-${student.id}`,
            type: 'student_registration',
            message: `Nouvel étudiant inscrit: ${student.profiles.first_name} ${student.profiles.last_name}`,
            time: formatTimeAgo(student.created_at),
            icon: faUserGraduate,
            color: 'text-green-500',
            created_at: student.created_at
          });
        });
      }

      // Récupérer les paiements récents
      const { data: recentPayments } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          status,
          created_at,
          students!inner(
            profiles!inner(first_name, last_name)
          )
        `)
        .eq('school_id', schoolId)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentPayments) {
        recentPayments.forEach(payment => {
          activities.push({
            id: `payment-${payment.id}`,
            type: 'payment_received',
            message: `Paiement de ${payment.amount?.toLocaleString() || 0} FCFA reçu de ${payment.students.profiles.first_name} ${payment.students.profiles.last_name}`,
            time: formatTimeAgo(payment.created_at),
            icon: faMoneyCheckDollar,
            color: 'text-blue-500',
            created_at: payment.created_at
          });
        });
      }

      // Récupérer les nouveaux enseignants
      const { data: recentTeachers } = await supabase
        .from('teachers')
        .select(`
          id,
          created_at,
          profiles!inner(first_name, last_name)
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(2);

      if (recentTeachers) {
        recentTeachers.forEach(teacher => {
          activities.push({
            id: `teacher-${teacher.id}`,
            type: 'teacher_added',
            message: `Nouvel enseignant: ${teacher.profiles.first_name} ${teacher.profiles.last_name}`,
            time: formatTimeAgo(teacher.created_at),
            icon: faChalkboardTeacher,
            color: 'text-purple-500',
            created_at: teacher.created_at
          });
        });
      }

      // Récupérer les nouvelles classes
      const { data: recentClasses } = await supabase
        .from('classes')
        .select('id, name, created_at')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(2);

      if (recentClasses) {
        recentClasses.forEach(classItem => {
          activities.push({
            id: `class-${classItem.id}`,
            type: 'class_created',
            message: `Nouvelle classe créée: ${classItem.name}`,
            time: formatTimeAgo(classItem.created_at),
            icon: faUsers,
            color: 'text-indigo-500',
            created_at: classItem.created_at
          });
        });
      }

      // Trier toutes les activités par date (du plus récent au plus ancien)
      activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Prendre les 5 plus récentes
      return activities.slice(0, 5);

    } catch (error) {
      console.error("Erreur lors de la récupération des activités:", error);
      return [];
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Récupérer l'école du directeur
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single();

      if (!profile) return;

      const schoolId = profile.school_id;

      // Récupérer les statistiques de l'école
      const [
        { data: students },
        { data: teachers },
        { data: classes },
        { data: payments },
        { data: schoolData }
      ] = await Promise.all([
        supabase.from('students').select('id').eq('school_id', schoolId),
        supabase.from('teachers').select('id').eq('school_id', schoolId),
        supabase.from('classes').select('id').eq('school_id', schoolId),
        supabase.from('payments').select('amount, status').eq('school_id', schoolId),
        supabase.from('schools').select('*').eq('id', schoolId).single()
      ]);

      const totalStudents = students?.length || 0;
      const totalTeachers = teachers?.length || 0;
      const totalClasses = classes?.length || 0;
      const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0;
      const totalRevenue = payments
        ?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      setStats({
        totalStudents,
        totalTeachers,
        totalClasses,
        pendingPayments,
        totalRevenue,
        activeStudents: totalStudents
      });

      setSchool(schoolData);

      // Récupérer les activités réelles
      const realActivities = await fetchRecentActivities(schoolId);
      setRecentActivities(realActivities);

      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* En-tête de l'école */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {school?.name || "École"}
        </h1>
        <p className="text-gray-600 mt-2">
          {school?.address || "Adresse non renseignée"}
        </p>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUserGraduate} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Étudiants total</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalStudents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <FontAwesomeIcon icon={faChalkboardTeacher} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Enseignants</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalTeachers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Classes</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalClasses}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Paiements en attente</dt>
                  <dd className="text-lg font-medium text-yellow-600">{stats.pendingPayments}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Étudiants actifs</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeStudents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <FontAwesomeIcon icon={faMoneyBill} className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenus totaux</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalRevenue.toLocaleString()} FCFA
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Actions rapides */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Actions Rapides</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Accédez rapidement aux fonctionnalités principales</p>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4">
                <Link
                  href="/dashboard/director/students"
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
                    <FontAwesomeIcon icon={faUserGraduate} className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">Gérer les étudiants</p>
                    <p className="text-sm text-gray-500">
                      {stats.totalStudents} étudiant(s) inscrit(s)
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>

                <Link
                  href="/dashboard/director/teachers"
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-2">
                    <FontAwesomeIcon icon={faChalkboardTeacher} className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">Gérer les enseignants</p>
                    <p className="text-sm text-gray-500">
                      {stats.totalTeachers} enseignant(s) dans l'école
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>

                <Link
                  href="/dashboard/director/classes"
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <div className="flex-shrink-0 bg-purple-100 rounded-md p-2">
                    <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">Gérer les classes</p>
                    <p className="text-sm text-gray-500">
                      {stats.totalClasses} classe(s) créée(s)
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>

                <Link
                  href="/dashboard/director/payments"
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-2">
                    <FontAwesomeIcon icon={faMoneyBill} className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">Vérifier les paiements</p>
                    <p className="text-sm text-gray-500">
                      {stats.pendingPayments} paiement(s) en attente
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Activités récentes */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Activités Récentes</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Dernières activités dans votre école
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              {recentActivities.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {recentActivities.map((activity, activityIdx) => (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {activityIdx !== recentActivities.length - 1 ? (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${activity.color}`}>
                                <FontAwesomeIcon icon={activity.icon} className="h-5 w-5 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  {activity.message}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time dateTime={activity.time}>{activity.time}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FontAwesomeIcon icon={faSchool} className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune activité récente</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Aucune activité récente dans votre école.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}