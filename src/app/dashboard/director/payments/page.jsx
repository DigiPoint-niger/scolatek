// /dashboard/director/payments/page.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faMoneyBill,
  faSearch,
  faFilter,
  faDownload,
  faEye,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faReceipt
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function DirectorPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [school, setSchool] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  const fetchPaymentsData = async () => {
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

      // Récupérer les paiements avec les informations des étudiants
      const { data: paymentsData, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          type,
          method,
          status,
          transaction_ref,
          paid_at,
          created_at,
          students!inner(
            id,
            matricule,
            profiles!inner(
              first_name,
              last_name
            ),
            classes(
              name
            )
          )
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPayments(paymentsData || []);

      // Calculer les statistiques
      const total = paymentsData?.length || 0;
      const paid = paymentsData?.filter(p => p.status === 'paid').length || 0;
      const pending = paymentsData?.filter(p => p.status === 'pending').length || 0;
      const failed = paymentsData?.filter(p => p.status === 'failed').length || 0;
      const totalAmount = paymentsData
        ?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      setStats({
        total,
        paid,
        pending,
        failed,
        totalAmount
      });

      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.students.profiles.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.students.profiles.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.students.matricule?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "" || payment.status === statusFilter;
    const matchesType = typeFilter === "" || payment.type === typeFilter;

    // Filtre par date
    let matchesDate = true;
    if (dateFilter) {
      const paymentDate = new Date(payment.created_at).toISOString().split('T')[0];
      matchesDate = paymentDate === dateFilter;
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;

      // Mettre à jour l'état local
      setPayments(payments.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: newStatus, paid_at: newStatus === 'paid' ? new Date().toISOString() : payment.paid_at }
          : payment
      ));

      // Recalculer les statistiques
      const paid = payments.filter(p => p.id === paymentId ? newStatus === 'paid' : p.status === 'paid').length;
      const pending = payments.filter(p => p.id === paymentId ? newStatus === 'pending' : p.status === 'pending').length;
      const failed = payments.filter(p => p.id === paymentId ? newStatus === 'failed' : p.status === 'failed').length;
      const totalAmount = payments
        .map(p => p.id === paymentId ? { ...p, status: newStatus } : p)
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      setStats(prev => ({
        ...prev,
        paid,
        pending,
        failed,
        totalAmount
      }));

      alert(`Statut du paiement mis à jour: ${newStatus}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour du statut");
    }
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

  const getTypeText = (type) => {
    switch (type) {
      case 'tuition': return 'Scolarité';
      case 'subscription': return 'Abonnement';
      case 'other': return 'Autre';
      default: return type;
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Paiements</h1>
            <p className="text-gray-600 mt-2">
              {school?.name || "École"} - {payments.length} paiement(s) enregistré(s)
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
              <FontAwesomeIcon icon={faDownload} className="h-4 w-4 mr-2" />
              Exporter
            </button>
            <Link
              href="/dashboard/director/payments/add"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <FontAwesomeIcon icon={faMoneyBill} className="h-4 w-4 mr-2" />
              Nouveau paiement
            </Link>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faReceipt} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total paiements</dt>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Payés</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.paid}</dd>
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

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <FontAwesomeIcon icon={faTimesCircle} className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Échoués</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.failed}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Montant total</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalAmount.toLocaleString()} FCFA
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Barre de recherche */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un étudiant, matricule ou référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filtre par statut */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faFilter} className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="paid">Payé</option>
                <option value="pending">En attente</option>
                <option value="failed">Échoué</option>
              </select>
            </div>
          </div>

          {/* Filtre par type */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faFilter} className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les types</option>
                <option value="tuition">Scolarité</option>
                <option value="subscription">Abonnement</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          {/* Filtre par date */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tableau des paiements */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
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
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Méthode
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => {
                  const statusInfo = getStatusIcon(payment.status);
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {payment.students.profiles.first_name?.[0]}{payment.students.profiles.last_name?.[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.students.profiles.first_name} {payment.students.profiles.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.students.matricule || "Sans matricule"}
                            </div>
                            {payment.students.classes && (
                              <div className="text-xs text-gray-400">
                                {payment.students.classes.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.amount?.toLocaleString()} FCFA
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getTypeText(payment.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.method || "Non spécifié"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                          <FontAwesomeIcon icon={statusInfo.icon} className="h-3 w-3 mr-1" />
                          {getStatusText(payment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                        </div>
                        {payment.paid_at && (
                          <div className="text-xs text-gray-400">
                            Payé: {new Date(payment.paid_at).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.transaction_ref || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/dashboard/director/payments/${payment.id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir les détails"
                          >
                            <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                          </Link>
                          
                          {payment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updatePaymentStatus(payment.id, 'paid')}
                                className="text-green-600 hover:text-green-900"
                                title="Marquer comme payé"
                              >
                                <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => updatePaymentStatus(payment.id, 'failed')}
                                className="text-red-600 hover:text-red-900"
                                title="Marquer comme échoué"
                              >
                                <FontAwesomeIcon icon={faTimesCircle} className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-24 text-center">
                    <FontAwesomeIcon icon={faMoneyBill} className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun paiement trouvé</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || statusFilter || typeFilter || dateFilter 
                        ? "Aucun paiement ne correspond aux critères de recherche." 
                        : "Aucun paiement n'a été enregistré pour le moment."
                      }
                    </p>
                    {!searchTerm && !statusFilter && !typeFilter && !dateFilter && (
                      <div className="mt-6">
                        <Link
                          href="/dashboard/director/payments/add"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <FontAwesomeIcon icon={faMoneyBill} className="h-4 w-4 mr-2" />
                          Enregistrer un paiement
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredPayments.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">1</span> à <span className="font-medium">{filteredPayments.length}</span> sur{' '}
                  <span className="font-medium">{filteredPayments.length}</span> paiements
                </p>
              </div>
              <div className="flex space-x-2">
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Précédent
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Suivant
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Résumé financier */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Résumé Financier</h3>
          <p className="mt-1 text-sm text-gray-500">
            Aperçu des revenus et paiements de l'école
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Revenus par type</h4>
              <div className="space-y-2">
                {['tuition', 'subscription', 'other'].map(type => {
                  const typePayments = payments.filter(p => p.type === type && p.status === 'paid');
                  const amount = typePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                  const percentage = stats.totalAmount > 0 ? (amount / stats.totalAmount * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{getTypeText(type)}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{amount.toLocaleString()} FCFA</span>
                        <span className="text-xs text-gray-500">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Taux de réussite</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Taux de paiement</span>
                    <span className="font-medium text-gray-900">
                      {stats.total > 0 ? ((stats.paid / stats.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.paid / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Taux d'échec</span>
                    <span className="font-medium text-gray-900">
                      {stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.failed / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Derniers paiements</h4>
              <div className="space-y-2">
                {payments
                  .filter(p => p.status === 'paid')
                  .slice(0, 3)
                  .map(payment => (
                    <div key={payment.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 truncate">
                        {payment.students.profiles.first_name} {payment.students.profiles.last_name}
                      </span>
                      <span className="font-medium text-green-600">
                        +{payment.amount?.toLocaleString()} FCFA
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}