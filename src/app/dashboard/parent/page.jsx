"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUserGraduate, 
  faFileInvoiceDollar, 
  faClipboardList,
  faEye,
  faUsers
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function ParentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [stats, setStats] = useState({
    myChildren: 0,
    pendingInvoices: 0,
    totalAbsences: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParentData = async () => {
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
      if (!profile || profile.role !== 'parent' || profile.status !== 'active') {
        router.push("/unauthorized");
        return;
      }
      setUser(profile);
      setSchool(profile.schools);

      // Fetch parent stats
      try {
        const { data: children } = await supabase
          .from('profiles')
          .select('id')
          .eq('parent_profile_id', profile.id)
          .eq('role', 'student');
        const { data: invoices } = await supabase
          .from('invoices')
          .select('id')
          .eq('status', 'pending')
          .eq('school_id', profile.school_id);
        const { data: absences } = await supabase
          .from('absences')
          .select('id');

        setStats({
          myChildren: children?.length || 0,
          pendingInvoices: invoices?.length || 0,
          totalAbsences: absences?.length || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }

      setLoading(false);
    };
    fetchParentData();
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
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Mes enfants</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.myChildren}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Factures en attente</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingInvoices}</dd>
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
      </div>

      {/* Actions rapides */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Actions Rapides</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Suivre le progrès de vos enfants</p>
        </div>
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4">
              <Link
                href="/dashboard/parent/grades"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-2">
                  <FontAwesomeIcon icon={faUserGraduate} className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Notes des enfants</p>
                  <p className="text-sm text-gray-500">Consulter les résultats scolaires</p>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                </div>
              </Link>

              <Link
                href="/dashboard/parent/invoices"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className="flex-shrink-0 bg-orange-100 rounded-md p-2">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Mes factures</p>
                  <p className="text-sm text-gray-500">Consulter et payer les frais de scolarité</p>
                </div>
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                </div>
              </Link>

              <Link
                href="/dashboard/parent/absences"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className="flex-shrink-0 bg-red-100 rounded-md p-2">
                  <FontAwesomeIcon icon={faClipboardList} className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Absences des enfants</p>
                  <p className="text-sm text-gray-500">Consulter l'historique de présence</p>
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
