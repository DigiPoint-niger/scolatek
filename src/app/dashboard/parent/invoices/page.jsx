"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ParentInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Récupérer le profil parent
        const { data: parentProfile } = await supabase
          .from('profiles')
          .select('id, school_id')
          .eq('id', session.user.id)
          .eq('role', 'parent')
          .single();

        if (!parentProfile?.school_id) return;

        // Récupérer les factures de l'école (TODO: implémenter la relation parent-enfant)
        const { data: invoicesData } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            amount,
            due_date,
            status,
            student:student_profile_id(first_name, last_name)
          `)
          .eq('school_id', parentProfile.school_id)
          .order('due_date', { ascending: false });

        setInvoices(invoicesData || []);

        // Récupérer les reçus
        const { data: receiptsData } = await supabase
          .from('receipts')
          .select(`
            id,
            receipt_number,
            amount,
            paid_at,
            student:student_profile_id(first_name, last_name),
            payment:payment_id(amount, paid_at)
          `)
        .in('student_id', studentIds)
        .order('paid_at', { ascending: false });
      setReceipts(receiptsData || []);
      setLoading(false);
    };
    fetchInvoices();
  }, []);

  const handleDownloadReceipt = (receipt) => {
    // Simule le téléchargement, à remplacer par une vraie logique si besoin
    setSelectedReceipt(receipt);
    setShowModal(true);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Factures et reçus de mes enfants</h2>
      <h3 className="text-lg font-semibold mb-2">Factures</h3>
      <table className="min-w-full bg-white mb-8">
        <thead>
          <tr>
            <th>Élève</th>
            <th>Numéro</th>
            <th>Montant</th>
            <th>Date limite</th>
            <th>Status</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.id}>
              <td>{inv.students?.profiles?.first_name} {inv.students?.profiles?.last_name}</td>
              <td>{inv.invoice_number}</td>
              <td>{inv.amount} FCFA</td>
              <td>{new Date(inv.due_date).toLocaleDateString('fr-FR')}</td>
              <td>{inv.status}</td>
              <td>{inv.description || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className="text-lg font-semibold mb-2">Reçus</h3>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th>Élève</th>
            <th>Numéro de reçu</th>
            <th>Montant</th>
            <th>Date de paiement</th>
            <th>Méthode</th>
            <th>Référence</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map(rec => (
            <tr key={rec.id}>
              <td>{rec.students?.profiles?.first_name} {rec.students?.profiles?.last_name}</td>
              <td>{rec.receipt_number}</td>
              <td>{rec.amount} FCFA</td>
              <td>{rec.paid_at ? new Date(rec.paid_at).toLocaleDateString('fr-FR') : '-'}</td>
              <td>{rec.payment_method || '-'}</td>
              <td>{rec.transaction_ref || '-'}</td>
              <td>
                <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => handleDownloadReceipt(rec)}>Télécharger</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Modal de téléchargement */}
      {showModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Télécharger le reçu</h3>
            <p>Numéro de reçu : <strong>{selectedReceipt.receipt_number}</strong></p>
            <p>Montant : <strong>{selectedReceipt.amount} FCFA</strong></p>
            <p>Date de paiement : <strong>{selectedReceipt.paid_at ? new Date(selectedReceipt.paid_at).toLocaleDateString('fr-FR') : '-'}</strong></p>
            <div className="flex justify-end space-x-2 mt-4">
              <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => { setShowModal(false); setSelectedReceipt(null); }}>Fermer</button>
              <a href="#" download className="px-4 py-2 bg-green-600 text-white rounded">Télécharger PDF</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
