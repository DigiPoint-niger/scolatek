// /dashboard/accountant/page.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faMoneyBill,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faChartLine,
  faDownload,
  faEye,
  faReceipt,
  faFileInvoiceDollar
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function AccountantDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    paidPayments: 0,
    failedPayments: 0,
    monthlyRevenue: 0,
    averagePayment: 0
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single();

      if (!profile) return;

      const schoolId = profile.school_id;

      // Récupérer les données de l'école
      const { data: schoolData } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      setSchool(schoolData);

      // Récupérer tous les paiements de l'école
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          status,
          type,
          method,
          paid_at,
          created_at,
          students!inner(
            profiles!inner(
              first_name,
              last_name
            )
          )
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculer les statistiques
      const totalRevenue = payments
        ?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0;
      const paidPayments = payments?.filter(p => p.status === 'paid').length || 0;
      const failedPayments = payments?.filter(p => p.status === 'failed').length || 0;

      // Revenu du mois en cours
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = payments
        ?.filter(p => p.status === 'paid' && 
          new Date(p.paid_at || p.created_at).getMonth() === currentMonth &&
          new Date(p.paid_at || p.created_at).getFullYear() === currentYear
        )
        .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Paiement moyen
      const averagePayment = paidPayments > 0 ? totalRevenue / paidPayments : 0;

      setStats({
        totalRevenue,
        pendingPayments,
        paidPayments,
        failedPayments,
        monthlyRevenue,
        averagePayment
      });

      // Récupérer les 5 derniers paiements
      setRecentPayments(payments?.slice(0, 5) || []);

      // Générer des données de revenus pour les 6 derniers mois
      generateRevenueData(payments || []);

      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  const generateRevenueData = (payments) => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      
      const monthRevenue = payments
        .filter(p => p.status === 'paid' && 
          new Date(p.paid_at || p.created_at).getMonth() === date.getMonth() &&
          new Date(p.paid_at || p.created_at).getFullYear() === date.getFullYear()
        )
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      months.push({
        name: monthName,
        revenue: monthRevenue
      });
    }

    setRevenueData(months);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return { icon: faCheckCircle, color: 'text-green-500', bgColor: 'bg-green-100' };
      case 'pending':
        return { icon: faClock, color: 'text-yellow-500', bgColor: 'bg-yellow-100' };
      case 'failed':
        return { icon: faTimesCircle, color: 'text-red-500', bgColor: 'bg-red-100' };
      default:
        return { icon: faClock, color: 'text-gray-500', bgColor: 'bg-gray-100' };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Payé';
      case 'pending': return 'En attente';
      case 'failed': return 'Échoué';
      default: return status;
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
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Comptable</h1>
        <p className="text-gray-600 mt-2">
          {school?.name || "École"} - Aperçu financier
        </p>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <FontAwesomeIcon icon={faMoneyBill} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenu total</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalRevenue.toLocaleString()} FCFA
                  </dd>
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
                  <dd className="text-lg font-medium text-yellow-600">{stats.pendingPayments}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Payés</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.paidPayments}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <FontAwesomeIcon icon={faChartLine} className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ce mois</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.monthlyRevenue.toLocaleString()} FCFA
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Derniers paiements */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Derniers Paiements</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Transactions récentes
              </p>
            </div>
            <Link
              href="/dashboard/accountant/payments"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Voir tout
            </Link>
          </div>
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Étudiant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentPayments.length > 0 ? (
                    recentPayments.map((payment) => {
                      const statusInfo = getStatusIcon(payment.status);
                      return (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.students.profiles.first_name} {payment.students.profiles.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.amount?.toLocaleString()} FCFA
                            </div>
                            <div className="text-sm text-gray-500 capitalize">
                              {payment.type}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                              <FontAwesomeIcon icon={statusInfo.icon} className="h-3 w-3 mr-1" />
                              {getStatusText(payment.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              href={`/dashboard/accountant/payments/${payment.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">
                        Aucun paiement récent
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Évolution des revenus */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Évolution des Revenus</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Revenus des 6 derniers mois
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {revenueData.map((month, index) => (
                <div key={month.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{month.name}</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {month.revenue.toLocaleString()} FCFA
                  </div>
                </div>
              ))}
            </div>
            
            {/* Barres de progression */}
            <div className="mt-6 space-y-3">
              {revenueData.map((month) => {
                const maxRevenue = Math.max(...revenueData.map(m => m.revenue));
                const percentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={month.name} className="flex items-center">
                    <div className="w-24 text-sm text-gray-600 truncate">{month.name}</div>
                    <div className="flex-1 ml-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm font-medium text-gray-900">
                      {month.revenue.toLocaleString()} FCFA
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides et statistiques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Actions rapides */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Actions Rapides</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Accès rapide aux fonctionnalités
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <Link
                  href="/dashboard/accountant/payments"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faMoneyBill} className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Gérer les paiements</div>
                    <div className="text-sm text-gray-500">
                      {stats.pendingPayments} paiement(s) en attente
                    </div>
                  </div>
                </Link>

                <Link
                  href="/dashboard/accountant/receipts"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faReceipt} className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Générer des reçus</div>
                    <div className="text-sm text-gray-500">Créer et envoyer des reçus</div>
                  </div>
                </Link>

                <Link
                  href="/dashboard/accountant/reports"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Rapports financiers</div>
                    <div className="text-sm text-gray-500">Analyses et statistiques détaillées</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques détaillées */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg lg:col-span-2">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Statistiques Détaillées</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Aperçu complet des performances financières
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.paidPayments}</div>
                  <div className="text-sm text-gray-500">Transactions réussies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.failedPayments}</div>
                  <div className="text-sm text-gray-500">Transactions échouées</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.averagePayment.toLocaleString()} FCFA
                  </div>
                  <div className="text-sm text-gray-500">Paiement moyen</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalRevenue > 0 && stats.paidPayments > 0 
                      ? Math.round((stats.paidPayments / (stats.paidPayments + stats.pendingPayments + stats.failedPayments)) * 100)
                      : 0
                    }%
                  </div>
                  <div className="text-sm text-gray-500">Taux de réussite</div>
                </div>
              </div>

              {/* Indicateurs de performance */}
              <div className="mt-6 grid grid-cols-1 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Taux de conversion</span>
                    <span className="font-medium text-gray-900">
                      {stats.totalRevenue > 0 ? 'Excellent' : 'À améliorer'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${stats.totalRevenue > 0 ? 85 : 30}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Croissance mensuelle</span>
                    <span className="font-medium text-gray-900">
                      {revenueData.length > 1 && revenueData[revenueData.length - 1].revenue > revenueData[revenueData.length - 2].revenue 
                        ? '+12%' 
                        : '-5%'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${revenueData.length > 1 && revenueData[revenueData.length - 1].revenue > revenueData[revenueData.length - 2].revenue ? 75 : 40}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}