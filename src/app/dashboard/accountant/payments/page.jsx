// /dashboard/accountant/payments/page.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faSearch,
  faFilter,
  faEye,
  faEdit,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faDownload,
  faRefresh,
  faMoneyBill,
  faReceipt
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [school, setSchool] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    failed: 0
  });

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, typeFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
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

      // Construire la requête avec les filtres
      let query = supabase
        .from('payments')
        .select(`
          id,
          amount,
          status,
          type,
          method,
          transaction_ref,
          paid_at,
          created_at,
          students!inner(
            id,
            matricule,
            profiles!inner(
              first_name,
              last_name
            )
          )
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }
      if (typeFilter !== "all") {
        query = query.eq('type', typeFilter);
      }

      const { data: paymentsData, error } = await query;

      if (error) throw error;

      setPayments(paymentsData || []);

      // Calculer les statistiques
      const total = paymentsData?.length || 0;
      const pending = paymentsData?.filter(p => p.status === 'pending').length || 0;
      const paid = paymentsData?.filter(p => p.status === 'paid').length || 0;
      const failed = paymentsData?.filter(p => p.status === 'failed').length || 0;

      setStats({ total, pending, paid, failed });

      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

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

      // Rafraîchir la liste
      fetchPayments();
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
      case 'subscription': return 'Abonnement';
      case 'tuition': return 'Scolarité';
      case 'other': return 'Autre';
      default: return type;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const studentName = `${payment.students.profiles.first_name} ${payment.students.profiles.last_name}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return studentName.includes(searchLower) ||
           payment.transaction_ref?.toLowerCase().includes(searchLower) ||
           payment.students.matricule?.toLowerCase().includes(searchLower);
  });

  const formatCurrency = (amount) => {
    return amount?.toLocaleString('fr-FR') + ' FCFA';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              {school?.name || "École"} - Gestion et suivi des transactions
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchPayments}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faRefresh} className="h-4 w-4 mr-2" />
              Actualiser
            </button>
            <Link
              href="/dashboard/accountant/receipts"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <FontAwesomeIcon icon={faReceipt} className="h-4 w-4 mr-2" />
              Générer un reçu
            </Link>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faMoneyBill} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
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
                  <dd className="text-lg font-medium text-yellow-600">{stats.pending}</dd>
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
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <FontAwesomeIcon icon={faTimesCircle} className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Échoués</dt>
                  <dd className="text-lg font-medium text-red-600">{stats.failed}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Recherche */}
            <div className="sm:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faSearch} className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Nom, matricule, référence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filtre statut */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                id="status"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="paid">Payé</option>
                <option value="failed">Échoué</option>
              </select>
            </div>

            {/* Filtre type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                id="type"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Tous les types</option>
                <option value="subscription">Abonnement</option>
                <option value="tuition">Scolarité</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des paiements */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Liste des Paiements
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {filteredPayments.length} paiement(s) trouvé(s)
          </p>
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
                              {payment.students.profiles.first_name[0]}{payment.students.profiles.last_name[0]}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {payment.students.profiles.first_name} {payment.students.profiles.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {payment.students.matricule || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {getTypeText(payment.type)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {payment.method || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            <FontAwesomeIcon icon={statusInfo.icon} className="h-3 w-3 mr-1" />
                            {getStatusText(payment.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.paid_at ? formatDate(payment.paid_at) : formatDate(payment.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              href={`/dashboard/accountant/payments/${payment.id}`}
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
                            
                            <button
                              className="text-gray-600 hover:text-gray-900"
                              title="Télécharger le reçu"
                            >
                              <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                      {payments.length === 0 ? 
                        "Aucun paiement trouvé pour votre école" : 
                        "Aucun paiement ne correspond à vos critères de recherche"
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <FontAwesomeIcon icon={faMoneyBill} className="h-6 w-6 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Gestion des paiements
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Vous pouvez modifier le statut des paiements en attente en cliquant sur les icônes correspondantes.
                Les paiements marqués comme "payés" seront automatiquement datés et enregistrés.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}