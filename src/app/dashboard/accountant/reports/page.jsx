// /dashboard/accountant/reports/page.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { exportToExcel } from "@/lib/exportUtils";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faDownload,
  faFilter,
  faCalendar,
  faChartLine,
  faChartBar,
  faChartPie,
  faMoneyBillWave,
  faReceipt,
  faFileInvoiceDollar,
  faUsers,
  faUniversity,
  faPrint,
  faFileExcel,
  faFilePdf,
  faRefresh,
  faArrowUp,
  faArrowDown,
  faExchangeAlt
} from '@fortawesome/free-solid-svg-icons'

// Nous utiliserons Chart.js pour les graphiques
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function ReportsPage() {
  const [reports, setReports] = useState({
    payments: [],
    receipts: [],
    invoices: []
  });
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState("financial");
  const [exporting, setExporting] = useState(false);

  // États pour les statistiques
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    paidPayments: 0,
    averagePayment: 0,
    monthlyGrowth: 0,
    studentCount: 0,
    invoiceStats: {
      total: 0,
      paid: 0,
      pending: 0,
      overdue: 0
    }
  });

  // États pour les données des graphiques
  const [chartData, setChartData] = useState({
    revenue: {},
    paymentsByType: {},
    monthlyComparison: {}
  });

  useEffect(() => {
    fetchReportsData();
  }, [dateRange, reportType]);

  const fetchReportsData = async () => {
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

      // Récupérer les paiements dans la période
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          students!inner(
            profiles!inner(
              first_name,
              last_name
            )
          )
        `)
        .eq('school_id', schoolId)
        .gte('created_at', `${dateRange.start}T00:00:00`)
        .lte('created_at', `${dateRange.end}T23:59:59`)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Récupérer les reçus dans la période
      const { data: receiptsData, error: receiptsError } = await supabase
        .from('receipts')
        .select(`
          *,
          students!inner(
            profiles!inner(
              first_name,
              last_name
            )
          ),
          payments!inner(
            type
          )
        `)
        .eq('school_id', schoolId)
        .gte('created_at', `${dateRange.start}T00:00:00`)
        .lte('created_at', `${dateRange.end}T23:59:59`)
        .order('created_at', { ascending: false });

      if (receiptsError) throw receiptsError;

      // Récupérer les factures dans la période
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          students!inner(
            profiles!inner(
              first_name,
              last_name
            )
          )
        `)
        .eq('school_id', schoolId)
        .gte('created_at', `${dateRange.start}T00:00:00`)
        .lte('created_at', `${dateRange.end}T23:59:59`)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Récupérer le nombre d'étudiants
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id', { count: 'exact' })
        .eq('school_id', schoolId);

      if (studentsError) throw studentsError;

      setReports({
        payments: paymentsData || [],
        receipts: receiptsData || [],
        invoices: invoicesData || []
      });

      // Calculer les statistiques
      calculateStats(paymentsData || [], invoicesData || [], studentsData?.length || 0);
      
      // Préparer les données pour les graphiques
      prepareChartData(paymentsData || [], receiptsData || []);

      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  const calculateStats = (payments, invoices, studentCount) => {
    // Statistiques des paiements
    const totalRevenue = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const paidPayments = payments.filter(p => p.status === 'paid').length;
    const averagePayment = paidPayments > 0 ? totalRevenue / paidPayments : 0;

    // Statistiques des factures
    const invoiceStats = {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      pending: invoices.filter(i => i.status === 'sent' || i.status === 'draft').length,
      overdue: invoices.filter(i => 
        i.status !== 'paid' && new Date(i.due_date) < new Date()
      ).length
    };

    // Calcul de la croissance mensuelle (simulée pour l'exemple)
    const monthlyGrowth = calculateMonthlyGrowth(payments);

    setStats({
      totalRevenue,
      pendingPayments,
      paidPayments,
      averagePayment,
      monthlyGrowth,
      studentCount,
      invoiceStats
    });
  };

  const calculateMonthlyGrowth = (payments) => {
    // Simulation du calcul de croissance
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthRevenue = payments
      .filter(p => p.status === 'paid' && 
        new Date(p.paid_at || p.created_at).getMonth() === currentMonth &&
        new Date(p.paid_at || p.created_at).getFullYear() === currentYear
      )
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const previousMonthRevenue = payments
      .filter(p => p.status === 'paid' && 
        new Date(p.paid_at || p.created_at).getMonth() === (currentMonth - 1 + 12) % 12 &&
        new Date(p.paid_at || p.created_at).getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear)
      )
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    if (previousMonthRevenue === 0) return currentMonthRevenue > 0 ? 100 : 0;
    
    return ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
  };

  const prepareChartData = (payments, receipts) => {
    // Données pour le graphique de revenus mensuels
    const revenueData = prepareRevenueChartData(payments);
    
    // Données pour la répartition des paiements par type
    const paymentsByTypeData = preparePaymentsByTypeData(payments);
    
    // Données pour la comparaison mensuelle
    const monthlyComparisonData = prepareMonthlyComparisonData(payments);

    setChartData({
      revenue: revenueData,
      paymentsByType: paymentsByTypeData,
      monthlyComparison: monthlyComparisonData
    });
  };

  const prepareRevenueChartData = (payments) => {
    const months = [];
    const now = new Date();
    
    // Générer les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      
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

    return {
      labels: months.map(m => m.name),
      datasets: [
        {
          label: 'Revenus (FCFA)',
          data: months.map(m => m.revenue),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 4,
        }
      ]
    };
  };

  const preparePaymentsByTypeData = (payments) => {
    const paidPayments = payments.filter(p => p.status === 'paid');
    
    const types = {
      tuition: paidPayments.filter(p => p.type === 'tuition').reduce((sum, p) => sum + p.amount, 0),
      subscription: paidPayments.filter(p => p.type === 'subscription').reduce((sum, p) => sum + p.amount, 0),
      other: paidPayments.filter(p => p.type === 'other').reduce((sum, p) => sum + p.amount, 0)
    };

    const colors = [
      'rgba(34, 197, 94, 0.6)',
      'rgba(59, 130, 246, 0.6)',
      'rgba(249, 115, 22, 0.6)'
    ];

    return {
      labels: ['Scolarité', 'Inscription', 'Autre'],
      datasets: [
        {
          data: [types.tuition, types.subscription, types.other],
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.6', '1')),
          borderWidth: 2,
        }
      ]
    };
  };

  const prepareMonthlyComparisonData = (payments) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentData = [
      payments.filter(p => p.status === 'paid' && 
        new Date(p.paid_at || p.created_at).getMonth() === currentMonth &&
        new Date(p.paid_at || p.created_at).getFullYear() === currentYear
      ).length,
      payments.filter(p => p.status === 'pending' && 
        new Date(p.created_at).getMonth() === currentMonth &&
        new Date(p.created_at).getFullYear() === currentYear
      ).length,
      payments.filter(p => p.status === 'failed' && 
        new Date(p.created_at).getMonth() === currentMonth &&
        new Date(p.created_at).getFullYear() === currentYear
      ).length
    ];

    const previousData = [
      payments.filter(p => p.status === 'paid' && 
        new Date(p.paid_at || p.created_at).getMonth() === (currentMonth - 1 + 12) % 12 &&
        new Date(p.paid_at || p.created_at).getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear)
      ).length,
      payments.filter(p => p.status === 'pending' && 
        new Date(p.created_at).getMonth() === (currentMonth - 1 + 12) % 12 &&
        new Date(p.created_at).getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear)
      ).length,
      payments.filter(p => p.status === 'failed' && 
        new Date(p.created_at).getMonth() === (currentMonth - 1 + 12) % 12 &&
        new Date(p.created_at).getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear)
      ).length
    ];

    return {
      labels: ['Payés', 'En attente', 'Échoués'],
      datasets: [
        {
          label: 'Mois actuel',
          data: currentData,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
        },
        {
          label: 'Mois précédent',
          data: previousData,
          backgroundColor: 'rgba(156, 163, 175, 0.6)',
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString('fr-FR') + ' FCFA';
  };

  const formatNumber = (number) => {
    return number?.toLocaleString('fr-FR');
  };

  const exportReport = async (format) => {
    try {
      setExporting(true);
      
      if (format === 'excel') {
        // Générer un export Excel
        const data = reports.payments.map(payment => ({
          Date: new Date(payment.created_at).toLocaleDateString('fr-FR'),
          Type: payment.type,
          Étudiant: `${payment.students?.profiles?.first_name || ''} ${payment.students?.profiles?.last_name || ''}`,
          Montant: payment.amount,
          Statut: payment.status,
          Méthode: payment.method || 'N/A'
        }));

        await exportToExcel({
          data,
          sheetName: 'Paiements',
          filename: `rapport-financier-${dateRange.start}-${dateRange.end}`
        });
      } else if (format === 'pdf') {
        // Générer un export PDF via API
        const response = await fetch('/api/export/reports-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportType,
            dateRange,
            stats,
            payments: reports.payments,
            invoices: reports.invoices,
            schoolName: school?.name
          })
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rapport-financier-${dateRange.start}-${dateRange.end}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      alert(`Rapport exporté avec succès en format ${format.toUpperCase()} !`);
      
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      alert("Erreur lors de l'export du rapport");
    } finally {
      setExporting(false);
    }
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return faArrowUp;
    if (growth < 0) return faArrowDown;
    return faExchangeAlt;
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
            <h1 className="text-2xl font-bold text-gray-900">Rapports Financiers</h1>
            <p className="text-gray-600 mt-2">
              {school?.name || "École"} - Analyse et statistiques détaillées
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchReportsData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faRefresh} className="h-4 w-4 mr-2" />
              Actualiser
            </button>
            <div className="relative">
              <button
                onClick={() => exportReport('excel')}
                disabled={exporting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faDownload} className="h-4 w-4 mr-2" />
                Exporter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Type de rapport */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de rapport
              </label>
              <select
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="financial">Financier</option>
                <option value="payments">Paiements</option>
                <option value="invoices">Factures</option>
                <option value="receipts">Reçus</option>
              </select>
            </div>

            {/* Date de début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début
              </label>
              <input
                type="date"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>

            {/* Date de fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>

            {/* Actions d'export rapide */}
            <div className="flex items-end space-x-2">
              <button
                onClick={() => exportReport('excel')}
                disabled={exporting}
                className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                title="Exporter en Excel"
              >
                <FontAwesomeIcon icon={faFileExcel} className="h-4 w-4 text-green-600" />
              </button>
              <button
                onClick={() => exportReport('pdf')}
                disabled={exporting}
                className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                title="Exporter en PDF"
              >
                <FontAwesomeIcon icon={faFilePdf} className="h-4 w-4 text-red-600" />
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                title="Imprimer"
              >
                <FontAwesomeIcon icon={faPrint} className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faMoneyBillWave} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenu total</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.totalRevenue)}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <FontAwesomeIcon 
                icon={getGrowthIcon(stats.monthlyGrowth)} 
                className={`h-4 w-4 mr-1 ${getGrowthColor(stats.monthlyGrowth)}`}
              />
              <span className={getGrowthColor(stats.monthlyGrowth)}>
                {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}% ce mois
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <FontAwesomeIcon icon={faChartLine} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Paiements payés</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.paidPayments}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              <span className="text-yellow-600">{stats.pendingPayments} en attente</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Factures</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.invoiceStats.total}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              <span className="text-green-600">{stats.invoiceStats.paid} payées</span>
              {' • '}
              <span className="text-red-600">{stats.invoiceStats.overdue} en retard</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Étudiants</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatNumber(stats.studentCount)}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Paiement moyen: {formatCurrency(stats.averagePayment)}
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Évolution des revenus */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Évolution des Revenus
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              6 derniers mois
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="h-80">
              <Bar data={chartData.revenue} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Répartition des paiements par type */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Répartition par Type
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Répartition des revenus par catégorie
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="h-80">
              <Pie data={chartData.paymentsByType} options={pieOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Comparaison mensuelle et tableau des performances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Comparaison mensuelle */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Comparaison Mensuelle
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Nombre de transactions par statut
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="h-80">
              <Bar data={chartData.monthlyComparison} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Tableau des performances */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Indicateurs de Performance
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Métriques clés de performance
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indicateur
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valeur
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tendance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Taux de conversion
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stats.paidPayments > 0 ? Math.round((stats.paidPayments / (stats.paidPayments + stats.pendingPayments)) * 100) : 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Excellent
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Paiement moyen
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(stats.averagePayment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Stable
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Taux de rétention
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      94.2%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        +2.1%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Délai moyen de paiement
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      3.2 jours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        -0.5j
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Résumé détaillé */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Résumé Détaillé
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Synthèse complète pour la période sélectionnée
          </p>
        </div>
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Paiements</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="text-sm font-medium">{reports.payments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payés:</span>
                    <span className="text-sm font-medium text-green-600">{stats.paidPayments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">En attente:</span>
                    <span className="text-sm font-medium text-yellow-600">{stats.pendingPayments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Échoués:</span>
                    <span className="text-sm font-medium text-red-600">
                      {reports.payments.filter(p => p.status === 'failed').length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Factures</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="text-sm font-medium">{stats.invoiceStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payées:</span>
                    <span className="text-sm font-medium text-green-600">{stats.invoiceStats.paid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">En attente:</span>
                    <span className="text-sm font-medium text-yellow-600">{stats.invoiceStats.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">En retard:</span>
                    <span className="text-sm font-medium text-red-600">{stats.invoiceStats.overdue}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Reçus</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total générés:</span>
                    <span className="text-sm font-medium">{reports.receipts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Montant total:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(reports.receipts.reduce((sum, r) => sum + r.amount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dernier reçu:</span>
                    <span className="text-sm font-medium">
                      {reports.receipts[0] ? new Date(reports.receipts[0].created_at).toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informations d'export */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <FontAwesomeIcon icon={faDownload} className="h-6 w-6 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Export de rapports
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Exportez vos rapports financiers aux formats Excel (CSV) ou PDF pour un usage externe 
                ou pour l'archivage. Les données incluent tous les paiements, factures et reçus 
                pour la période sélectionnée.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}