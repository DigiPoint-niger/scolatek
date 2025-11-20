"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faSearch, 
  faPlus, 
  faEdit, 
  faTrash, 
  faEye,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faMoneyBill,
  faCalendar,
  faSchool,
  faSave,
  faTimes,
  faFilter,
  faDownload
} from '@fortawesome/free-solid-svg-icons'

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [formData, setFormData] = useState({
    school_id: "",
    plan: "annual",
    price: 150000,
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    status: "active"
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchSubscriptions();
    fetchSchools();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          schools (
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du chargement des abonnements");
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, email')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des écoles:", error);
    }
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = 
      subscription.schools?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.schools?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || subscription.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // VALIDATION DU FORMULAIRE
  const validateForm = () => {
    const errors = {};
    
    if (!formData.school_id) {
      errors.school_id = "L'école est requise";
    }
    
    if (!formData.plan) {
      errors.plan = "Le plan est requis";
    }
    
    if (!formData.price || formData.price <= 0) {
      errors.price = "Le prix doit être supérieur à 0";
    }
    
    if (!formData.start_date) {
      errors.start_date = "La date de début est requise";
    }

    if (!formData.status) {
      errors.status = "Le statut est requis";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // CRÉATION D'UN ABONNEMENT
  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setOperationLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([
          {
            school_id: formData.school_id,
            plan: formData.plan,
            price: formData.price,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            status: formData.status
          }
        ])
        .select(`
          *,
          schools (
            name,
            email
          )
        `)
        .single();

      if (error) throw error;

      alert("Abonnement créé avec succès !");
      setShowCreateModal(false);
      resetForm();
      fetchSubscriptions(); // Recharger la liste
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la création de l'abonnement");
    } finally {
      setOperationLoading(false);
    }
  };

  // MODIFICATION D'UN ABONNEMENT
  const handleEditSubscription = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setOperationLoading(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          school_id: formData.school_id,
          plan: formData.plan,
          price: formData.price,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          status: formData.status
        })
        .eq('id', selectedSubscription.id);

      if (error) throw error;

      alert("Abonnement modifié avec succès !");
      setShowEditModal(false);
      resetForm();
      fetchSubscriptions(); // Recharger la liste
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la modification de l'abonnement");
    } finally {
      setOperationLoading(false);
    }
  };

  // SUPPRESSION D'UN ABONNEMENT
  const handleDeleteSubscription = async () => {
    setOperationLoading(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', selectedSubscription.id);

      if (error) throw error;

      alert("Abonnement supprimé avec succès !");
      setShowDeleteModal(false);
      fetchSubscriptions(); // Recharger la liste
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la suppression de l'abonnement");
    } finally {
      setOperationLoading(false);
    }
  };

  // CHANGEMENT DE STATUT
  const updateSubscriptionStatus = async (subscriptionId, newStatus) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: newStatus })
        .eq('id', subscriptionId);

      if (error) throw error;
      
      setSubscriptions(subscriptions.map(sub =>
        sub.id === subscriptionId ? { ...sub, status: newStatus } : sub
      ));
      
      alert(`Abonnement ${newStatus === 'active' ? 'activé' : newStatus === 'expired' ? 'expiré' : 'mis en attente'} avec succès !`);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du changement de statut");
    }
  };

  // OUVRIRE LE MODAL DE MODIFICATION
  const openEditModal = (subscription) => {
    setSelectedSubscription(subscription);
    setFormData({
      school_id: subscription.school_id || "",
      plan: subscription.plan || "annual",
      price: subscription.price || 150000,
      start_date: subscription.start_date ? new Date(subscription.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      end_date: subscription.end_date ? new Date(subscription.end_date).toISOString().split('T')[0] : "",
      status: subscription.status || "active"
    });
    setShowEditModal(true);
  };

  // OUVRIRE LE MODAL DE SUPPRESSION
  const openDeleteModal = (subscription) => {
    setSelectedSubscription(subscription);
    setShowDeleteModal(true);
  };

  // RÉINITIALISER LE FORMULAIRE
  const resetForm = () => {
    setFormData({
      school_id: "",
      plan: "annual",
      price: 150000,
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      status: "active"
    });
    setFormErrors({});
    setSelectedSubscription(null);
  };

  // GESTION DES CHAMPS DU FORMULAIRE
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseInt(value) || 0 : value
    }));
    
    // Effacer l'erreur du champ lorsqu'il est modifié
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // CALCULER LA DATE DE FIN BASÉE SUR LE PLAN
  const calculateEndDate = (startDate, plan) => {
    const start = new Date(startDate);
    let endDate = new Date(start);
    
    switch (plan) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'annual':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        return null;
    }
    
    return endDate.toISOString().split('T')[0];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return faCheckCircle;
      case 'pending': return faClock;
      case 'expired': return faTimesCircle;
      default: return faClock;
    }
  };

  const getPlanDisplayName = (plan) => {
    const planNames = {
      'monthly': 'Mensuel',
      'quarterly': 'Trimestriel',
      'annual': 'Annuel',
      'custom': 'Personnalisé'
    };
    return planNames[plan] || plan;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Chargement des abonnements...</p>
      </div>
    );
  }

  // Calcul des statistiques
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
  const pendingSubscriptions = subscriptions.filter(sub => sub.status === 'pending').length;
  const expiredSubscriptions = subscriptions.filter(sub => sub.status === 'expired').length;
  const totalRevenue = subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + (sub.price || 0), 0);
  const averageRevenue = activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;

  return (
    <div>
      {/* En-tête de page */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Abonnements</h1>
        <p className="text-gray-600">Suivez et gérez les abonnements des écoles</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Abonnements actifs</dt>
                  <dd className="text-lg font-medium text-gray-900">{activeSubscriptions}</dd>
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
                  <dd className="text-lg font-medium text-gray-900">{pendingSubscriptions}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Expirés</dt>
                  <dd className="text-lg font-medium text-gray-900">{expiredSubscriptions}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenus mensuels</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalRevenue.toLocaleString()} FCFA
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher une école..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-40 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="pending">En attente</option>
            <option value="expired">Expirés</option>
          </select>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            Nouvel abonnement
          </button>
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 flex items-center gap-2">
            <FontAwesomeIcon icon={faDownload} />
            Exporter
          </button>
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 flex items-center gap-2">
            <FontAwesomeIcon icon={faFilter} />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Tableau des abonnements */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                École
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Période
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubscriptions.map((subscription) => (
              <tr key={subscription.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faSchool} className="text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.schools?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subscription.schools?.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {getPlanDisplayName(subscription.plan)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(subscription.price || 0).toLocaleString()} FCFA
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faCalendar} className="mr-2 text-gray-400" />
                    <div>
                      <div>Début: {new Date(subscription.start_date).toLocaleDateString('fr-FR')}</div>
                      {subscription.end_date && (
                        <div>Fin: {new Date(subscription.end_date).toLocaleDateString('fr-FR')}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                      <FontAwesomeIcon icon={getStatusIcon(subscription.status)} className="mr-1" />
                      {subscription.status === 'active' ? 'Actif' : 
                      subscription.status === 'pending' ? 'En attente' : 'Expiré'}
                    </span>
                    {subscription.end_date && new Date(subscription.end_date) < new Date() && subscription.status === 'active' && (
                      <span className="text-xs text-red-600">Expiration imminente</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openEditModal(subscription)}
                      className="text-green-600 hover:text-green-900"
                      title="Modifier"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      onClick={() => openDeleteModal(subscription)}
                      className="text-red-600 hover:text-red-900"
                      title="Supprimer"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faMoneyBill} className="text-gray-400 text-4xl mb-4" />
            <p className="text-gray-500">Aucun abonnement trouvé</p>
            {(searchTerm || statusFilter !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Statistiques supplémentaires */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faMoneyBill} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenu moyen</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {averageRevenue.toLocaleString()} FCFA
                  </dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Taux d'activation</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {subscriptions.length > 0 ? Math.round((activeSubscriptions / subscriptions.length) * 100) : 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Prochains renouvellements</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {subscriptions.filter(sub => 
                      sub.status === 'active' && 
                      sub.end_date && 
                      new Date(sub.end_date) > new Date() &&
                      new Date(sub.end_date) <= new Date(new Date().setDate(new Date().getDate() + 30))
                    ).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CRÉATION */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-xl font-bold text-gray-900">Nouvel Abonnement</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-500">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleCreateSubscription}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">École *</label>
                  <select
                    name="school_id"
                    value={formData.school_id}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.school_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionner une école</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>
                        {school.name} - {school.email}
                      </option>
                    ))}
                  </select>
                  {formErrors.school_id && <p className="text-red-500 text-xs mt-1">{formErrors.school_id}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan *</label>
                    <select
                      name="plan"
                      value={formData.plan}
                      onChange={(e) => {
                        handleInputChange(e);
                        // Calculer automatiquement la date de fin
                        if (formData.start_date) {
                          const endDate = calculateEndDate(formData.start_date, e.target.value);
                          setFormData(prev => ({ ...prev, end_date: endDate || "" }));
                        }
                      }}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.plan ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="monthly">Mensuel</option>
                      <option value="quarterly">Trimestriel</option>
                      <option value="annual">Annuel</option>
                      <option value="custom">Personnalisé</option>
                    </select>
                    {formErrors.plan && <p className="text-red-500 text-xs mt-1">{formErrors.plan}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prix (FCFA) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date de début *</label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={(e) => {
                        handleInputChange(e);
                        // Recalculer la date de fin si le plan est défini
                        if (formData.plan && formData.plan !== 'custom') {
                          const endDate = calculateEndDate(e.target.value, formData.plan);
                          setFormData(prev => ({ ...prev, end_date: endDate || "" }));
                        }
                      }}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.start_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.start_date && <p className="text-red-500 text-xs mt-1">{formErrors.start_date}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.status ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="active">Actif</option>
                    <option value="pending">En attente</option>
                    <option value="expired">Expiré</option>
                  </select>
                  {formErrors.status && <p className="text-red-500 text-xs mt-1">{formErrors.status}</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={operationLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={operationLoading ? faTimes : faSave} className={operationLoading ? "animate-spin" : ""} />
                  {operationLoading ? "Création..." : "Créer l'abonnement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE MODIFICATION */}
      {showEditModal && selectedSubscription && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-xl font-bold text-gray-900">Modifier l'abonnement</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-500">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleEditSubscription}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">École *</label>
                  <select
                    name="school_id"
                    value={formData.school_id}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.school_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionner une école</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>
                        {school.name} - {school.email}
                      </option>
                    ))}
                  </select>
                  {formErrors.school_id && <p className="text-red-500 text-xs mt-1">{formErrors.school_id}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan *</label>
                    <select
                      name="plan"
                      value={formData.plan}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.plan ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="monthly">Mensuel</option>
                      <option value="quarterly">Trimestriel</option>
                      <option value="annual">Annuel</option>
                      <option value="custom">Personnalisé</option>
                    </select>
                    {formErrors.plan && <p className="text-red-500 text-xs mt-1">{formErrors.plan}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prix (FCFA) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date de début *</label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.start_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.start_date && <p className="text-red-500 text-xs mt-1">{formErrors.start_date}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.status ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="active">Actif</option>
                    <option value="pending">En attente</option>
                    <option value="expired">Expiré</option>
                  </select>
                  {formErrors.status && <p className="text-red-500 text-xs mt-1">{formErrors.status}</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={operationLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={operationLoading ? faTimes : faSave} className={operationLoading ? "animate-spin" : ""} />
                  {operationLoading ? "Modification..." : "Modifier l'abonnement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SUPPRESSION */}
      {showDeleteModal && selectedSubscription && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <FontAwesomeIcon icon={faTrash} className="text-red-600 text-xl" />
            </div>
            
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Confirmer la suppression</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer l'abonnement de <strong>"{selectedSubscription.schools?.name}"</strong> ? 
                  Cette action est irréversible.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Plan: {getPlanDisplayName(selectedSubscription.plan)} - {(selectedSubscription.price || 0).toLocaleString()} FCFA
                </p>
              </div>
            </div>

            <div className="flex justify-center space-x-3 mt-5">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={operationLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteSubscription}
                disabled={operationLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={operationLoading ? faTimes : faTrash} className={operationLoading ? "animate-spin" : ""} />
                {operationLoading ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}