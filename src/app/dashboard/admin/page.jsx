"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faSchool, 
  faClock, 
  faCheckCircle, 
  faMoneyBill,
  faUser,
  faUserTie,
  faUserGraduate,
  faUsers,
  faEye,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalSchools: 0,
    pendingRequests: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalUsers: 0,
    activeUsers: 0
  });
  const [roleStats, setRoleStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Récupérer les statistiques principales
      const [
        { data: schools },
        { data: pendingProfiles },
        { data: subscriptions },
        { data: users },
        { data: activeUsers }
      ] = await Promise.all([
        supabase.from('schools').select('id, is_active'),
        supabase.from('profiles').select('id').eq('status', 'pending'),
        supabase.from('subscriptions').select('price, status'),
        supabase.from('profiles').select('id'),
        supabase.from('profiles').select('id').eq('status', 'active')
      ]);

      const totalSchools = schools?.length || 0;
      const pendingRequests = pendingProfiles?.length || 0;
      const activeSubscriptions = subscriptions?.filter(sub => sub.status === 'active').length || 0;
      const totalRevenue = subscriptions
        ?.filter(sub => sub.status === 'active')
        .reduce((sum, sub) => sum + (sub.price || 0), 0) || 0;
      const totalUsersCount = users?.length || 0;
      const activeUsersCount = activeUsers?.length || 0;

      setStats({
        totalSchools,
        pendingRequests,
        activeSubscriptions,
        totalRevenue,
        totalUsers: totalUsersCount,
        activeUsers: activeUsersCount
      });

      // Récupérer les statistiques par rôle
      await fetchRoleStats();

      // Récupérer les activités récentes (exemple)
      setRecentActivities([
        {
          id: 1,
          type: 'school_registration',
          message: 'Nouvelle école "Lycée Excellence" inscrite',
          time: 'Il y a 2 heures',
          icon: faSchool,
          color: 'text-blue-500'
        },
        {
          id: 2,
          type: 'user_approval',
          message: 'Compte de Moussa Diallo approuvé',
          time: 'Il y a 5 heures',
          icon: faUser,
          color: 'text-green-500'
        },
        {
          id: 3,
          type: 'payment_received',
          message: 'Paiement de 150,000 FCFA reçu',
          time: 'Il y a 1 jour',
          icon: faMoneyBill,
          color: 'text-purple-500'
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  const fetchRoleStats = async () => {
    try {
      // Récupérer les statistiques par rôle depuis la base de données
      const { data: roleData, error } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('status', 'active');

      if (error) throw error;

      // Compter les utilisateurs par rôle
      const roleCounts = {};
      roleData?.forEach(profile => {
        roleCounts[profile.role] = (roleCounts[profile.role] || 0) + 1;
      });

      // Mapper les rôles avec leurs icônes et couleurs
      const roleStatsData = [
        { 
          role: 'director', 
          count: roleCounts.director || 0, 
          icon: faUserTie, 
          color: 'bg-blue-500',
          label: 'Directeurs'
        },
        { 
          role: 'teacher', 
          count: roleCounts.teacher || 0, 
          icon: faUserGraduate, 
          color: 'bg-green-500',
          label: 'Enseignants'
        },
        { 
          role: 'student', 
          count: roleCounts.student || 0, 
          icon: faUser, 
          color: 'bg-yellow-500',
          label: 'Étudiants'
        },
        { 
          role: 'parent', 
          count: roleCounts.parent || 0, 
          icon: faUsers, 
          color: 'bg-purple-500',
          label: 'Parents'
        },
        { 
          role: 'supervisor', 
          count: roleCounts.supervisor || 0, 
          icon: faUser, 
          color: 'bg-indigo-500',
          label: 'Superviseurs'
        },
        { 
          role: 'accountant', 
          count: roleCounts.accountant || 0, 
          icon: faUser, 
          color: 'bg-pink-500',
          label: 'Comptables'
        }
      ].filter(role => role.count > 0); // Filtrer les rôles sans utilisateurs

      setRoleStats(roleStatsData);
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques par rôle:", error);
      // Données par défaut en cas d'erreur
      setRoleStats([
        { role: 'director', count: 0, icon: faUserTie, color: 'bg-blue-500', label: 'Directeurs' },
        { role: 'teacher', count: 0, icon: faUserGraduate, color: 'bg-green-500', label: 'Enseignants' },
        { role: 'student', count: 0, icon: faUser, color: 'bg-yellow-500', label: 'Étudiants' },
        { role: 'parent', count: 0, icon: faUsers, color: 'bg-purple-500', label: 'Parents' }
      ]);
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
      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faSchool} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Écoles totales</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalSchools}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Demandes en attente</dt>
                  <dd className="text-lg font-medium text-yellow-600">{stats.pendingRequests}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Abonnements actifs</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeSubscriptions}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <FontAwesomeIcon icon={faMoneyBill} className="h-6 w-6 text-purple-600" />
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
        {/* Statistiques des utilisateurs par rôle */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Utilisateurs par Rôle</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Répartition des utilisateurs selon leur rôle</p>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                {roleStats.length > 0 ? (
                  roleStats.map((roleStat) => (
                    <div key={roleStat.role} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${roleStat.color} flex items-center justify-center`}>
                          <FontAwesomeIcon icon={roleStat.icon} className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {roleStat.label}
                          </div>
                          <div className="text-sm text-gray-500">{roleStat.count} utilisateurs</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {stats.totalUsers > 0 ? Math.round((roleStat.count / stats.totalUsers) * 100) : 0}%
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Aucun utilisateur trouvé</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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
                  href="/dashboard/admin/pending"
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-2">
                    <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">Vérifier les demandes</p>
                    <p className="text-sm text-gray-500">
                      {stats.pendingRequests} demande(s) en attente d'approbation
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>

                <Link
                  href="/dashboard/admin/schools"
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
                    <FontAwesomeIcon icon={faSchool} className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">Gérer les écoles</p>
                    <p className="text-sm text-gray-500">
                      {stats.totalSchools} école(s) inscrite(s) sur la plateforme
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>

                <Link
                  href="/dashboard/admin/users"
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-2">
                    <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">Gérer les utilisateurs</p>
                    <p className="text-sm text-gray-500">
                      {stats.totalUsers} utilisateur(s) sur la plateforme
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
      </div>

      {/* Activités récentes */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Activités Récentes</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Dernières actions sur la plateforme
            </p>
          </div>
          <Link
            href="/dashboard/admin/activities"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Voir tout
          </Link>
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
                <FontAwesomeIcon icon={faCheck} className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune activité</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Aucune activité récente sur la plateforme.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques de performance */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <FontAwesomeIcon icon={faCheck} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Taux d'activation</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faSchool} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Écoles actives</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalSchools} / {stats.totalSchools}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <FontAwesomeIcon icon={faMoneyBill} className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenu moyen</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeSubscriptions > 0 ? 
                      (stats.totalRevenue / stats.activeSubscriptions).toLocaleString() : 
                      0
                    } FCFA
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}