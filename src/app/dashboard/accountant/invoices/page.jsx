// /dashboard/accountant/invoices/page.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faSearch,
  faFilter,
  faEye,
  faDownload,
  faPrint,
  faFileInvoiceDollar,
  faPlus,
  faEdit,
  faEnvelope,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faRefresh,
  faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function InvoicesPage() {
  // Export PDF avec jspdf
  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Liste des factures', 10, 15);
    let y = 25;
    invoices.forEach((inv, i) => {
      doc.text(`${i + 1}. ${inv.student_name || ''} | ${inv.amount}€ | ${inv.status || ''}`, 10, y);
      y += 10;
      if (y > 270) {
        doc.addPage();
        y = 15;
      }
    });
    doc.save('factures.pdf');
  };

  // Export Excel avec xlsx
  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    // On sélectionne les colonnes principales
    const data = invoices.map(inv => ({
      Élève: inv.student_name,
      Montant: inv.amount,
      Statut: inv.status,
      Classe: inv.class_name,
      Date: inv.due_date
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Factures');
    XLSX.writeFile(wb, 'factures.xlsx');
  };
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [school, setSchool] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(null);

  const [newInvoice, setNewInvoice] = useState({
    student_id: "",
    type: "tuition",
    amount: "",
    due_date: "",
    description: "",
    items: [{ description: "Frais de scolarité", amount: "" }]
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter]);

  const fetchData = async () => {
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

      // Récupérer les étudiants de l'école
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          matricule,
          profiles!inner(
            first_name,
            last_name
          ),
          classes!inner(
            name
          )
        `)
        .eq('school_id', schoolId)
        .order('matricule');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Récupérer les factures depuis la base de données
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          students!inner(
            id,
            matricule,
            profiles!inner(
              first_name,
              last_name
            ),
            classes!inner(
              name
            )
          )
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Formater les données pour l'affichage
      const formattedInvoices = (invoicesData || []).map(invoice => ({
        ...invoice,
        student_name: `${invoice.students.profiles.first_name} ${invoice.students.profiles.last_name}`,
        student_matricule: invoice.students.matricule,
        class_name: invoice.students.classes.name
      }));

      setInvoices(formattedInvoices);
      setLoading(false);
  };

  const createInvoice = async () => {
    try {
      // Validation
      if (!newInvoice.student_id || !newInvoice.amount || !newInvoice.due_date) {
        alert("Veuillez remplir tous les champs obligatoires");
        return;
      }
      // Préparer les données pour l'insertion
      const invoiceData = {
        student_id: newInvoice.student_id,
        school_id: school.id,
        type: newInvoice.type,
        amount: parseInt(newInvoice.amount),
        due_date: newInvoice.due_date,
        status: 'draft',
        description: newInvoice.description,
        items: newInvoice.items.filter(item => item.description && item.amount),
        created_by: session.user.id
      };

      // Insérer dans la base de données
      const { data: createdInvoice, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select(`
          *,
          students!inner(
            id,
            matricule,
            profiles!inner(
              first_name,
              last_name
            ),
            classes!inner(
              name
            )
          )
        `)
        .single();

      if (error) throw error;

      // Formater et ajouter à la liste
      const formattedInvoice = {
        ...createdInvoice,
        student_name: `${createdInvoice.students.profiles.first_name} ${createdInvoice.students.profiles.last_name}`,
        student_matricule: createdInvoice.students.matricule,
        class_name: createdInvoice.students.classes.name
      };

      setInvoices(prev => [formattedInvoice, ...prev]);
      setShowCreateModal(false);
      resetNewInvoice();
      
    } catch (error) {
      console.error("Erreur lors de la création de la facture:", error);
      alert("Erreur lors de la création de la facture");
    }
  };

  const sendInvoice = async (invoiceId) => {
    try {
      setSendingInvoice(invoiceId);
      
      // Mettre à jour le statut dans la base de données
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;

      // Mettre à jour l'état local
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? { 
          ...inv, 
          status: 'sent', 
          sent_at: new Date().toISOString() 
        } : inv
      ));
      
    } catch (error) {
      console.error("Erreur lors de l'envoi de la facture:", error);
      alert("Erreur lors de l'envoi de la facture");
    } finally {
      setSendingInvoice(null);
    }
  };

  const markAsPaid = async (invoiceId) => {
    try {
      // Mettre à jour dans la base de données
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;

      // Mettre à jour l'état local
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? { 
          ...inv, 
          status: 'paid', 
          paid_at: new Date().toISOString() 
        } : inv
      ));
      
    } catch (error) {
      console.error("Erreur lors du marquage de la facture:", error);
      alert("Erreur lors du marquage de la facture");
    }
  };

  const cancelInvoice = async (invoiceId) => {
    try {
      // Mettre à jour dans la base de données
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'cancelled'
        })
        .eq('id', invoiceId);

      if (error) throw error;

      // Mettre à jour l'état local
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? { ...inv, status: 'cancelled' } : inv
      ));
      
    } catch (error) {
      console.error("Erreur lors de l'annulation de la facture:", error);
      alert("Erreur lors de l'annulation de la facture");
    }
  };

  const resetNewInvoice = () => {
    setNewInvoice({
      student_id: "",
      type: "tuition",
      amount: "",
      due_date: "",
      description: "",
      items: [{ description: "Frais de scolarité", amount: "" }]
    });
  };

  const addInvoiceItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: "", amount: "" }]
    }));
  };

  const updateInvoiceItem = (index, field, value) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeInvoiceItem = (index) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return { icon: faCheckCircle, color: 'text-green-500', bgColor: 'bg-green-100' };
      case 'sent':
        return { icon: faEnvelope, color: 'text-blue-500', bgColor: 'bg-blue-100' };
      case 'draft':
        return { icon: faClock, color: 'text-gray-500', bgColor: 'bg-gray-100' };
      case 'overdue':
        return { icon: faExclamationTriangle, color: 'text-red-500', bgColor: 'bg-red-100' };
      case 'cancelled':
        return { icon: faTimesCircle, color: 'text-gray-500', bgColor: 'bg-gray-100' };
      default:
        return { icon: faClock, color: 'text-gray-500', bgColor: 'bg-gray-100' };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Payée';
      case 'sent': return 'Envoyée';
      case 'draft': return 'Brouillon';
      case 'overdue': return 'En retard';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'tuition': return 'Scolarité';
      case 'subscription': return 'Inscription';
      case 'other': return 'Autre';
      default: return type;
    }
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString('fr-FR') + ' FCFA';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate, status) => {
    return status !== 'paid' && new Date(dueDate) < new Date();
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.student_matricule?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    const matchesType = typeFilter === "all" || invoice.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => isOverdue(i.due_date, i.status)).length,
    totalAmount: invoices.filter(i => i.status !== 'cancelled').reduce((sum, i) => sum + i.amount, 0),
    pendingAmount: invoices.filter(i => i.status === 'sent' || i.status === 'draft').reduce((sum, i) => sum + i.amount, 0)
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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Factures</h1>
            <p className="text-gray-600 mt-2">
              {school?.name || "École"} - Création et suivi des factures
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faRefresh} className="h-4 w-4 mr-2" />
              Actualiser
            </button>
            <button
              onClick={exportPDF}
              className="inline-flex items-center px-4 py-2 border border-green-600 rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <FontAwesomeIcon icon={faDownload} className="h-4 w-4 mr-2" />
              Exporter PDF
            </button>
            <button
              onClick={exportExcel}
              className="inline-flex items-center px-4 py-2 border border-yellow-600 rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600"
            >
              <FontAwesomeIcon icon={faDownload} className="h-4 w-4 mr-2" />
              Exporter Excel
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
              Nouvelle Facture
            </button>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Factures</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Brouillons</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.draft}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Payées</dt>
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
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">En retard</dt>
                  <dd className="text-lg font-medium text-red-600">{stats.overdue}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de montants */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <FontAwesomeIcon icon={faMoneyBillWave} className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Montant total</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.totalAmount)}
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
                  <dt className="text-sm font-medium text-gray-500 truncate">En attente</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.pendingAmount)}
                  </dd>
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
                  placeholder="Nom étudiant, numéro de facture, matricule..."
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
                <option value="draft">Brouillon</option>
                <option value="sent">Envoyée</option>
                <option value="paid">Payée</option>
                <option value="overdue">En retard</option>
                <option value="cancelled">Annulée</option>
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
                <option value="tuition">Scolarité</option>
                <option value="subscription">Inscription</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des factures */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Factures
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {filteredInvoices.length} facture(s) trouvée(s)
          </p>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facture
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Étudiant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Échéance
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
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => {
                    const statusInfo = getStatusIcon(invoice.status);
                    const isDue = isOverdue(invoice.due_date, invoice.status);
                    
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.invoice_number || `INV-${invoice.id.slice(-8)}`}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {getTypeText(invoice.type)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDate(invoice.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                              {invoice.student_name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {invoice.student_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {invoice.student_matricule} - {invoice.class_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(invoice.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${isDue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                            {formatDate(invoice.due_date)}
                          </div>
                          {isDue && (
                            <div className="text-xs text-red-500">Échue</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            <FontAwesomeIcon icon={statusInfo.icon} className="h-3 w-3 mr-1" />
                            {getStatusText(invoice.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              href={`/dashboard/accountant/invoices/${invoice.id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Voir la facture"
                            >
                              <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                            </Link>
                            
                            {invoice.status === 'draft' && (
                              <button
                                onClick={() => sendInvoice(invoice.id)}
                                disabled={sendingInvoice === invoice.id}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                title="Envoyer par email"
                              >
                                <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
                              </button>
                            )}
                            
                            {(invoice.status === 'sent' || invoice.status === 'draft') && (
                              <button
                                onClick={() => markAsPaid(invoice.id)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Marquer comme payée"
                              >
                                <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4" />
                              </button>
                            )}
                            
                            {(invoice.status === 'draft' || invoice.status === 'sent') && (
                              <button
                                onClick={() => cancelInvoice(invoice.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Annuler la facture"
                              >
                                <FontAwesomeIcon icon={faTimesCircle} className="h-4 w-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => window.print()}
                              className="text-gray-600 hover:text-gray-900"
                              title="Imprimer"
                            >
                              <FontAwesomeIcon icon={faPrint} className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                      {invoices.length === 0 ? 
                        "Aucune facture créée pour le moment" : 
                        "Aucune facture ne correspond à vos critères de recherche"
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de création de facture */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Créer une nouvelle facture
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetNewInvoice();
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Fermer</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 space-y-6">
                {/* Informations de base */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Étudiant *
                    </label>
                    <select
                      value={newInvoice.student_id}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, student_id: e.target.value }))}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Sélectionner un étudiant</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.profiles.first_name} {student.profiles.last_name} - {student.matricule} - {student.classes.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de facture *
                    </label>
                    <select
                      value={newInvoice.type}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, type: e.target.value }))}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="tuition">Frais de scolarité</option>
                      <option value="subscription">Frais d'inscription</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant total (FCFA) *
                    </label>
                    <input
                      type="number"
                      value={newInvoice.amount}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, amount: e.target.value }))}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                      placeholder="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date d'échéance *
                    </label>
                    <input
                      type="date"
                      value={newInvoice.due_date}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, due_date: e.target.value }))}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newInvoice.description}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                    placeholder="Description de la facture..."
                  />
                </div>

                {/* Articles de la facture */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Articles de la facture
                    </label>
                    <button
                      type="button"
                      onClick={addInvoiceItem}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-blue-600 bg-blue-100 hover:bg-blue-200"
                    >
                      <FontAwesomeIcon icon={faPlus} className="h-3 w-3 mr-1" />
                      Ajouter un article
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newInvoice.items.map((item, index) => (
                      <div key={index} className="flex space-x-3 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                            placeholder="Description de l'article"
                          />
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => updateInvoiceItem(index, 'amount', e.target.value)}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                            placeholder="Montant"
                          />
                        </div>
                        {newInvoice.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInvoiceItem(index)}
                            className="mt-2 text-red-600 hover:text-red-800"
                          >
                            <FontAwesomeIcon icon={faTimesCircle} className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetNewInvoice();
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    onClick={createInvoice}
                  >
                    Créer la facture
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}