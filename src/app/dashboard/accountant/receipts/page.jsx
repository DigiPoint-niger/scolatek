// /dashboard/accountant/receipts/page.jsx
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
  faFilePdf,
  faPlus,
  faReceipt,
  faMoneyBill,
  faCalendar,
  faUserGraduate,
  faRefresh,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [school, setSchool] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [sendingReceipt, setSendingReceipt] = useState(null);

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  const fetchData = async () => {
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

      // Récupérer les paiements payés pour générer des reçus
      const { data: paymentsData, error: paymentsError } = await supabase
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
              last_name,
              email
            ),
            classes!inner(
              name
            )
          )
        `)
        .eq('school_id', schoolId)
        .eq('status', 'paid')
        .order('paid_at', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

      // Récupérer les reçus existants depuis la base de données
      const { data: receiptsData, error: receiptsError } = await supabase
        .from('receipts')
        .select(`
          *,
          students!inner(
            id,
            matricule,
            profiles!inner(
              first_name,
              last_name,
              email
            ),
            classes!inner(
              name
            )
          ),
          payments!inner(
            id,
            type,
            method
          ),
          profiles!generated_by(
            first_name,
            last_name
          )
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (receiptsError) throw receiptsError;

      // Formater les données pour l'affichage
      const formattedReceipts = (receiptsData || []).map(receipt => ({
        ...receipt,
        student_name: `${receipt.students.profiles.first_name} ${receipt.students.profiles.last_name}`,
        student_email: receipt.students.profiles.email,
        student_matricule: receipt.students.matricule,
        class_name: receipt.students.classes.name,
        type: receipt.payments.type,
        payment_method: receipt.payments.method,
        generated_by_name: receipt.profiles ? `${receipt.profiles.first_name} ${receipt.profiles.last_name}` : 'Système'
      }));

      setReceipts(formattedReceipts);
      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  const generateReceipt = async (payment) => {
    try {
      setGenerating(true);
      
      const { data: { session } } = await supabase.auth.getSession();

      // Générer un numéro de reçu séquentiel
      const receiptCount = receipts.length + 1;
      const receiptNumber = `REC-${new Date().getFullYear()}-${String(receiptCount).padStart(4, '0')}`;

      // Préparer les données pour l'insertion
      const receiptData = {
        receipt_number: receiptNumber,
        payment_id: payment.id,
        student_id: payment.students.id,
        school_id: school.id,
        amount: payment.amount,
        payment_method: payment.method,
        transaction_ref: payment.transaction_ref,
        paid_at: payment.paid_at || payment.created_at,
        generated_by: session.user.id
      };

      // Insérer dans la base de données
      const { data: createdReceipt, error } = await supabase
        .from('receipts')
        .insert(receiptData)
        .select(`
          *,
          students!inner(
            id,
            matricule,
            profiles!inner(
              first_name,
              last_name,
              email
            ),
            classes!inner(
              name
            )
          ),
          payments!inner(
            id,
            type,
            method
          ),
          profiles!generated_by(
            first_name,
            last_name
          )
        `)
        .single();

      if (error) throw error;

      // Formater et ajouter à la liste
      const formattedReceipt = {
        ...createdReceipt,
        student_name: `${createdReceipt.students.profiles.first_name} ${createdReceipt.students.profiles.last_name}`,
        student_email: createdReceipt.students.profiles.email,
        student_matricule: createdReceipt.students.matricule,
        class_name: createdReceipt.students.classes.name,
        type: createdReceipt.payments.type,
        payment_method: createdReceipt.payments.method,
        generated_by_name: createdReceipt.profiles ? `${createdReceipt.profiles.first_name} ${createdReceipt.profiles.last_name}` : 'Système'
      };

      setReceipts(prev => [formattedReceipt, ...prev]);
      setShowGenerateModal(false);
      setSelectedPayment(null);
      
      // Afficher un message de succès
      alert(`Reçu ${receiptNumber} généré avec succès !`);
      
    } catch (error) {
      console.error("Erreur lors de la génération du reçu:", error);
      alert("Erreur lors de la génération du reçu");
    } finally {
      setGenerating(false);
    }
  };

  const sendReceipt = async (receipt) => {
    try {
      setSendingReceipt(receipt.id);
      
      // Simuler l'envoi par email
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Ici, vous intégreriez votre service d'email
      console.log("Envoi du reçu par email à:", receipt.student_email);
      
      alert(`Reçu ${receipt.receipt_number} envoyé à ${receipt.student_email}`);
      
    } catch (error) {
      console.error("Erreur lors de l'envoi du reçu:", error);
      alert("Erreur lors de l'envoi du reçu");
    } finally {
      setSendingReceipt(null);
    }
  };

  const printReceipt = (receipt) => {
    const receiptWindow = window.open('', '_blank');
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reçu de Paiement - ${receipt.receipt_number}</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #000;
            padding: 30px;
            position: relative;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px double #333; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .school-name { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          .school-info {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
          }
          .receipt-title { 
            font-size: 20px; 
            margin: 20px 0;
            text-decoration: underline;
          }
          .receipt-number {
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
          }
          .section { 
            margin-bottom: 25px; 
          }
          .section-title { 
            font-weight: bold; 
            border-bottom: 1px solid #ddd; 
            padding-bottom: 8px; 
            margin-bottom: 15px;
            font-size: 16px;
          }
          .row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
          }
          .label { 
            font-weight: bold; 
            flex: 1;
          }
          .value { 
            flex: 2;
            text-align: right;
          }
          .amount-section { 
            background: #f8f9fa; 
            padding: 20px; 
            margin: 30px 0;
            border: 1px solid #dee2e6;
            text-align: center;
          }
          .amount { 
            font-size: 24px; 
            font-weight: bold; 
            color: #28a745;
          }
          .footer { 
            margin-top: 40px; 
            border-top: 1px solid #ddd; 
            padding-top: 20px; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 80px;
            color: rgba(0,0,0,0.1);
            pointer-events: none;
            z-index: -1;
          }
          @media print { 
            body { margin: 0; }
            .container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="watermark">PAYE</div>
          
          <div class="header">
            <div class="school-name">${school?.name || 'ÉCOLE'}</div>
            <div class="school-info">
              ${school?.address || ''} ${school?.phone ? ' | Tél: ' + school.phone : ''}
              ${school?.email ? ' | Email: ' + school.email : ''}
            </div>
            <div class="receipt-title">REÇU DE PAIEMENT OFFICIEL</div>
            <div class="receipt-number">${receipt.receipt_number}</div>
          </div>

          <div class="section">
            <div class="section-title">INFORMATIONS ÉTUDIANT</div>
            <div class="row">
              <span class="label">Nom complet:</span>
              <span class="value">${receipt.student_name}</span>
            </div>
            <div class="row">
              <span class="label">Matricule:</span>
              <span class="value">${receipt.student_matricule || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="label">Classe:</span>
              <span class="value">${receipt.class_name}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">DÉTAILS DU PAIEMENT</div>
            <div class="row">
              <span class="label">Type de paiement:</span>
              <span class="value">${getTypeText(receipt.type)}</span>
            </div>
            <div class="row">
              <span class="label">Méthode de paiement:</span>
              <span class="value">${receipt.payment_method || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="label">Référence transaction:</span>
              <span class="value">${receipt.transaction_ref || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="label">Date de paiement:</span>
              <span class="value">${formatDate(receipt.paid_at)}</span>
            </div>
            <div class="row">
              <span class="label">Date d'émission:</span>
              <span class="value">${formatDate(receipt.created_at)}</span>
            </div>
          </div>

          <div class="amount-section">
            <div>MONTANT PAYÉ</div>
            <div class="amount">${formatCurrency(receipt.amount)}</div>
          </div>

          <div class="section">
            <div class="section-title">INFORMATIONS COMPLÉMENTAIRES</div>
            <div class="row">
              <span class="label">Généré par:</span>
              <span class="value">${receipt.generated_by_name}</span>
            </div>
            <div style="margin-top: 30px; text-align: center;">
              <div style="border-top: 1px solid #000; width: 200px; margin: 0 auto; padding-top: 5px;">
                Signature & Cachet
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>Ce reçu est généré électroniquement et a valeur légale.</strong></p>
            <p>En cas de doute, veuillez contacter l'administration au ${school?.phone || 'N/A'}</p>
            <p>${school?.name || 'École'} - ${school?.address || ''}</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => {
              window.close();
            }, 1000);
          }
        </script>
      </body>
      </html>
    `;
    
    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
  };

  const downloadReceipt = async (receipt) => {
    try {
      // Créer un Blob avec le contenu HTML du reçu
      const receiptHTML = `
        <html>
          <head>
            <title>Reçu ${receipt.receipt_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .amount { font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${school?.name || 'École'}</h2>
              <h3>REÇU DE PAIEMENT</h3>
              <p>${receipt.receipt_number}</p>
            </div>
            <div class="section">
              <div class="row"><strong>Étudiant:</strong> ${receipt.student_name}</div>
              <div class="row"><strong>Matricule:</strong> ${receipt.student_matricule || 'N/A'}</div>
              <div class="row"><strong>Classe:</strong> ${receipt.class_name}</div>
            </div>
            <div class="section">
              <div class="row"><strong>Type:</strong> ${getTypeText(receipt.type)}</div>
              <div class="row"><strong>Méthode:</strong> ${receipt.payment_method || 'N/A'}</div>
              <div class="row"><strong>Date paiement:</strong> ${formatDate(receipt.paid_at)}</div>
            </div>
            <div class="amount">${formatCurrency(receipt.amount)}</div>
            <div class="section">
              <div class="row"><strong>Émis le:</strong> ${formatDate(receipt.created_at)}</div>
              <div class="row"><strong>Par:</strong> ${receipt.generated_by_name}</div>
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([receiptHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recu-${receipt.receipt_number}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      alert("Erreur lors du téléchargement du reçu");
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

  const formatSimpleDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const filteredReceipts = receipts.filter(receipt => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      receipt.student_name.toLowerCase().includes(searchLower) ||
      receipt.receipt_number.toLowerCase().includes(searchLower) ||
      receipt.student_matricule?.toLowerCase().includes(searchLower) ||
      receipt.transaction_ref?.toLowerCase().includes(searchLower);

    // Filtre par date
    if (dateFilter !== "all") {
      const receiptDate = new Date(receipt.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          return matchesSearch && receiptDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return matchesSearch && receiptDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
          return matchesSearch && receiptDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(now.getFullYear(), 0, 1);
          return matchesSearch && receiptDate >= yearAgo;
        default:
          return matchesSearch;
      }
    }

    return matchesSearch;
  });

  const availablePayments = payments.filter(payment => 
    !receipts.some(receipt => receipt.payment_id === payment.id)
  );

  const stats = {
    total: receipts.length,
    thisMonth: receipts.filter(r => {
      const receiptDate = new Date(r.created_at);
      const now = new Date();
      return receiptDate.getMonth() === now.getMonth() && 
             receiptDate.getFullYear() === now.getFullYear();
    }).length,
    totalAmount: receipts.reduce((sum, r) => sum + r.amount, 0),
    uniqueStudents: new Set(receipts.map(r => r.student_id)).size
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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Reçus</h1>
            <p className="text-gray-600 mt-2">
              {school?.name || "École"} - Génération et gestion des reçus de paiement
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
              onClick={() => setShowGenerateModal(true)}
              disabled={availablePayments.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
              Générer un reçu
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
                <FontAwesomeIcon icon={faReceipt} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Reçus générés</dt>
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
                <FontAwesomeIcon icon={faMoneyBill} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Paiements éligibles</dt>
                  <dd className="text-lg font-medium text-gray-900">{availablePayments.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <FontAwesomeIcon icon={faCalendar} className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ce mois</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.thisMonth}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUserGraduate} className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Étudiants concernés</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.uniqueStudents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                  placeholder="Nom étudiant, numéro de reçu, matricule, référence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filtre date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Période
              </label>
              <select
                id="date"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">Toutes les périodes</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des reçus */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Reçus Générés
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {filteredReceipts.length} reçu(s) trouvé(s) • Montant total: {formatCurrency(stats.totalAmount)}
          </p>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reçu
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
                    Date génération
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReceipts.length > 0 ? (
                  filteredReceipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {receipt.receipt_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          Ref: {receipt.transaction_ref || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">
                          Par: {receipt.generated_by_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                            {receipt.student_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {receipt.student_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {receipt.student_matricule || 'N/A'} - {receipt.class_name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {receipt.student_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(receipt.amount)}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {receipt.payment_method || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {getTypeText(receipt.type)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatSimpleDate(receipt.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => printReceipt(receipt)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Imprimer le reçu"
                          >
                            <FontAwesomeIcon icon={faPrint} className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => downloadReceipt(receipt)}
                            className="text-green-600 hover:text-green-900"
                            title="Télécharger PDF"
                          >
                            <FontAwesomeIcon icon={faFilePdf} className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => sendReceipt(receipt)}
                            disabled={sendingReceipt === receipt.id}
                            className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                            title="Envoyer par email"
                          >
                            <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => printReceipt(receipt)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Voir le reçu"
                          >
                            <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                      {receipts.length === 0 ? 
                        "Aucun reçu généré pour le moment" : 
                        "Aucun reçu ne correspond à vos critères de recherche"
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
            <FontAwesomeIcon icon={faReceipt} className="h-6 w-6 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Gestion des reçus
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Les reçus sont générés automatiquement à partir des paiements validés. 
                Chaque reçu possède un numéro unique et peut être imprimé, téléchargé ou envoyé par email.
              </p>
              <p className="mt-2">
                <strong>Paiements éligibles:</strong> {availablePayments.length} paiement(s) payé(s) sans reçu associé.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de génération de reçu */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Générer un nouveau reçu
                </h3>
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setSelectedPayment(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Fermer</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sélectionner un paiement pour générer le reçu
                </label>
                
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  {availablePayments.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {availablePayments.map((payment) => (
                        <div
                          key={payment.id}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedPayment?.id === payment.id
                              ? 'bg-blue-50 border-l-4 border-blue-500'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {payment.students.profiles.first_name[0]}{payment.students.profiles.last_name[0]}
                                </div>
                                <div className="ml-3">
                                  <div className="font-medium text-gray-900">
                                    {payment.students.profiles.first_name} {payment.students.profiles.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {payment.students.matricule} • {payment.students.classes.name}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {formatCurrency(payment.amount)}
                              </div>
                              <div className="text-sm text-gray-500 capitalize">
                                {getTypeText(payment.type)}
                              </div>
                              <div className="text-xs text-gray-400">
                                {formatDate(payment.paid_at || payment.created_at)}
                              </div>
                            </div>
                          </div>
                          {payment.transaction_ref && (
                            <div className="mt-2 text-sm text-gray-600">
                              Référence: {payment.transaction_ref}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <FontAwesomeIcon icon={faReceipt} className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-lg font-medium">Aucun paiement éligible</p>
                      <p className="text-sm mt-1">Tous les paiements payés ont déjà un reçu associé</p>
                      <p className="text-xs mt-2">Les nouveaux reçus apparaîtront ici après validation des paiements</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    onClick={() => {
                      setShowGenerateModal(false);
                      setSelectedPayment(null);
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={!selectedPayment || generating}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => generateReceipt(selectedPayment)}
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Génération...
                      </>
                    ) : (
                      'Générer le reçu'
                    )}
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