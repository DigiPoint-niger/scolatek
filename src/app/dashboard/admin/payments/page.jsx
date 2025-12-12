"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faSearch, 
  faFilter,
  faEdit,
  faTrash,
  faEye,
  faCheckCircle,
  faTimesCircle,
  faMoneyBillWave,
  faReceipt,
  faSchool,
  faUserGraduate,
  faPlus,
  faSave,
  faTimes,
  faCalendar,
  faCreditCard,
  faSync
} from '@fortawesome/free-solid-svg-icons'

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [formData, setFormData] = useState({
    school_id: "",
    student_id: "",
    amount: "",
    type: "tuition",
    method: "cash",
    status: "pending",
    transaction_ref: "",
    paid_at: ""
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchPayments();
    fetchSchools();
    fetchStudents();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          schools (
            name
          ),
          students (
            profile:profiles (
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du chargement des paiements");
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des écoles:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          matricule,
          first_name,
          last_name
        `)
        .eq('role', 'student')
        .order('matricule');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des étudiants:", error);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.transaction_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.students?.profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.students?.profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.students?.matricule?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesType = typeFilter === "all" || payment.type === typeFilter;
    const matchesSchool = schoolFilter === "all" || payment.school_id === schoolFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesSchool;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'tuition': return 'bg-blue-100 text-blue-800';
      case 'subscription': return 'bg-purple-100 text-purple-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeDisplayName = (type) => {
    const typeNames = {
      'tuition': 'Scolarité',
      'subscription': 'Abonnement',
      'other': 'Autre'
    };
    return typeNames[type] || type;
  };

  const getMethodDisplayName = (method) => {
    const methodNames = {
      'cash': 'Espèces',
      'card': 'Carte',
      'transfer': 'Virement',
      'mobile': 'Mobile Money'
    };
    return methodNames[method] || method;
  };

  // VALIDATION DU FORMULAIRE
  const validateForm = () => {
    const errors = {};
    
    if (!formData.school_id) {
      errors.school_id = "L'école est requise";
    }
    
    if (!formData.amount || formData.amount <= 0) {
      errors.amount = "Le montant doit être supérieur à 0";
    }
    
    if (!formData.type) {
      errors.type = "Le type est requis";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // CRÉATION D'UN PAIEMENT
  const handleCreatePayment = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setOperationLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            school_id: formData.school_id,
            student_id: formData.student_id || null,
            amount: parseInt(formData.amount),
            type: formData.type,
            method: formData.method,
            status: formData.status,
            transaction_ref: formData.transaction_ref,
            paid_at: formData.status === 'paid' ? (formData.paid_at || new Date().toISOString()) : null
          }
        ])
        .select()
        .single();

      if (error) throw error;

      alert("Paiement créé avec succès !");
      setShowCreateModal(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la création du paiement");
    } finally {
      setOperationLoading(false);
    }
  };

  // MODIFICATION D'UN PAIEMENT
  const handleEditPayment = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setOperationLoading(true);
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          school_id: formData.school_id,
          student_id: formData.student_id || null,
          amount: parseInt(formData.amount),
          type: formData.type,
          method: formData.method,
          status: formData.status,
          transaction_ref: formData.transaction_ref,
          paid_at: formData.status === 'paid' ? (formData.paid_at || new Date().toISOString()) : null
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      alert("Paiement modifié avec succès !");
      setShowEditModal(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la modification du paiement");
    } finally {
      setOperationLoading(false);
    }
  };

  // SUPPRESSION D'UN PAIEMENT
  const handleDeletePayment = async () => {
    setOperationLoading(true);
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', selectedPayment.id);

      if (error) throw error;

      alert("Paiement supprimé avec succès !");
      setShowDeleteModal(false);
      fetchPayments();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la suppression du paiement");
    } finally {
      setOperationLoading(false);
    }
  };

  // CHANGEMENT DE STATUT
  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const updateData = {
        status: newStatus
      };

      if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      } else if (newStatus === 'pending') {
        updateData.paid_at = null;
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;
      
      setPayments(payments.map(payment =>
        payment.id === paymentId ? { ...payment, status: newStatus, paid_at: updateData.paid_at } : payment
      ));
      
      alert(`Paiement marqué comme ${newStatus === 'paid' ? 'payé' : newStatus} avec succès !`);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du changement de statut");
    }
  };

  // OUVRIRE LE MODAL DE MODIFICATION
  const openEditModal = (payment) => {
    setSelectedPayment(payment);
    setFormData({
      school_id: payment.school_id || "",
      student_id: payment.student_id || "",
      amount: payment.amount || "",
      type: payment.type || "tuition",
      method: payment.method || "cash",
      status: payment.status || "pending",
      transaction_ref: payment.transaction_ref || "",
      paid_at: payment.paid_at ? payment.paid_at.split('T')[0] : ""
    });
    setShowEditModal(true);
  };

  // OUVRIRE LE MODAL DE SUPPRESSION
  const openDeleteModal = (payment) => {
    setSelectedPayment(payment);
    setShowDeleteModal(true);
  };

  // RÉINITIALISER LE FORMULAIRE
  const resetForm = () => {
    setFormData({
      school_id: "",
      student_id: "",
      amount: "",
      type: "tuition",
      method: "cash",
      status: "pending",
      transaction_ref: "",
      paid_at: ""
    });
    setFormErrors({});
    setSelectedPayment(null);
  };

  // GESTION DES CHAMPS DU FORMULAIRE
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // CALCUL DES STATISTIQUES
  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Chargement des paiements...</p>
      </div>
    );
  }

  return (
    <div>
      {/* En-tête de page */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Paiements</h1>
        <p className="text-gray-600">Gérez tous les paiements de la plateforme</p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <FontAwesomeIcon icon={faMoneyBillWave} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenu total</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalRevenue.toLocaleString()} FCFA
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
                <FontAwesomeIcon icon={faReceipt} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total paiements</dt>
                  <dd className="text-lg font-medium text-gray-900">{payments.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <FontAwesomeIcon icon={faSync} className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">En attente</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {payments.filter(p => p.status === 'pending').length}
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
                <FontAwesomeIcon icon={faMoneyBillWave} className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Montant en attente</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {pendingAmount.toLocaleString()} FCFA
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par référence, étudiant..."
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
            <option value="paid">Payé</option>
            <option value="pending">En attente</option>
            <option value="failed">Échoué</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="block w-40 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">Tous les types</option>
            <option value="tuition">Scolarité</option>
            <option value="subscription">Abonnement</option>
            <option value="other">Autre</option>
          </select>

          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="block w-40 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">Toutes les écoles</option>
            {schools.map(school => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            Nouveau paiement
          </button>
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 flex items-center gap-2">
            <FontAwesomeIcon icon={faFilter} />
            Exporter
          </button>
        </div>
      </div>

      {/* Tableau des paiements */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Référence
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                École
              </th>
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
                Date de paiement
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {payment.transaction_ref || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {payment.schools?.name || 'Non assigné'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {payment.students ? 
                    `${payment.students.profile?.first_name} ${payment.students.profile?.last_name}` : 
                    'Aucun étudiant'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {payment.amount?.toLocaleString()} FCFA
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(payment.type)}`}>
                    {getTypeDisplayName(payment.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getMethodDisplayName(payment.method)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => updatePaymentStatus(payment.id, 
                      payment.status === 'paid' ? 'pending' : 'paid'
                    )}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}
                  >
                    <FontAwesomeIcon 
                      icon={payment.status === 'paid' ? faCheckCircle : 
                            payment.status === 'pending' ? faSync : faTimesCircle} 
                      className="mr-1" 
                    />
                    {payment.status === 'paid' ? 'Payé' : 
                     payment.status === 'pending' ? 'En attente' : 'Échoué'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment.paid_at ? 
                    new Date(payment.paid_at).toLocaleDateString('fr-FR') : 
                    'Non payé'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openEditModal(payment)}
                      className="text-green-600 hover:text-green-900"
                      title="Modifier"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      onClick={() => openDeleteModal(payment)}
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

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faReceipt} className="text-gray-400 text-4xl mb-4" />
            <p className="text-gray-500">Aucun paiement trouvé</p>
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || schoolFilter !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                  setSchoolFilter("all");
                }}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Affichage de <span className="font-medium">{filteredPayments.length}</span> paiements sur {payments.length}
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Précédent
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Suivant
          </button>
        </div>
      </div>

      {/* MODAL DE CRÉATION */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-xl font-bold text-gray-900">Nouveau Paiement</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-500">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleCreatePayment}>
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
                        {school.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.school_id && <p className="text-red-500 text-xs mt-1">{formErrors.school_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Étudiant (optionnel)</label>
                  <select
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner un étudiant</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.profile?.first_name} {student.profile?.last_name} ({student.matricule})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Montant (FCFA) *</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="50000"
                  />
                  {formErrors.amount && <p className="text-red-500 text-xs mt-1">{formErrors.amount}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.type ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="tuition">Scolarité</option>
                      <option value="subscription">Abonnement</option>
                      <option value="other">Autre</option>
                    </select>
                    {formErrors.type && <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Méthode</label>
                    <select
                      name="method"
                      value={formData.method}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="cash">Espèces</option>
                      <option value="card">Carte</option>
                      <option value="transfer">Virement</option>
                      <option value="mobile">Mobile Money</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">En attente</option>
                      <option value="paid">Payé</option>
                      <option value="failed">Échoué</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date de paiement</label>
                    <input
                      type="date"
                      name="paid_at"
                      value={formData.paid_at}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Référence de transaction</label>
                  <input
                    type="text"
                    name="transaction_ref"
                    value={formData.transaction_ref}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="TRX-123456"
                  />
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
                  {operationLoading ? "Création..." : "Créer le paiement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE MODIFICATION */}
      {showEditModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-xl font-bold text-gray-900">Modifier le paiement</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-500">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleEditPayment}>
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
                        {school.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.school_id && <p className="text-red-500 text-xs mt-1">{formErrors.school_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Étudiant (optionnel)</label>
                  <select
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner un étudiant</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.profile?.first_name} {student.profile?.last_name} ({student.matricule})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Montant (FCFA) *</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="50000"
                  />
                  {formErrors.amount && <p className="text-red-500 text-xs mt-1">{formErrors.amount}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.type ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="tuition">Scolarité</option>
                      <option value="subscription">Abonnement</option>
                      <option value="other">Autre</option>
                    </select>
                    {formErrors.type && <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Méthode</label>
                    <select
                      name="method"
                      value={formData.method}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="cash">Espèces</option>
                      <option value="card">Carte</option>
                      <option value="transfer">Virement</option>
                      <option value="mobile">Mobile Money</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">En attente</option>
                      <option value="paid">Payé</option>
                      <option value="failed">Échoué</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date de paiement</label>
                    <input
                      type="date"
                      name="paid_at"
                      value={formData.paid_at}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Référence de transaction</label>
                  <input
                    type="text"
                    name="transaction_ref"
                    value={formData.transaction_ref}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="TRX-123456"
                  />
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
                  {operationLoading ? "Modification..." : "Modifier le paiement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SUPPRESSION */}
      {showDeleteModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <FontAwesomeIcon icon={faTrash} className="text-red-600 text-xl" />
            </div>
            
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Confirmer la suppression</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer le paiement de <strong>{selectedPayment.amount?.toLocaleString()} FCFA</strong> ?
                  {selectedPayment.transaction_ref && (
                    <span> (Référence: {selectedPayment.transaction_ref})</span>
                  )}
                  Cette action est irréversible.
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
                onClick={handleDeletePayment}
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