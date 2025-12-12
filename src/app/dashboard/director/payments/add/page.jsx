// /dashboard/director/payments/add/page.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faMoneyBill,
  faArrowLeft,
  faSave
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function AddPayment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    student_id: "",
    amount: "",
    type: "tuition",
    method: "",
    status: "pending",
    transaction_ref: "",
    paid_at: ""
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single();

      if (!profile) return;

      const { data: studentsData } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          matricule,
          class_id
        `)
        .eq('role', 'student')
        .eq('school_id', profile.school_id)
        .order('first_name');

      setStudents(studentsData || []);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single();

      if (!profile) return;

      // Préparer les données pour l'insertion
      const paymentData = {
        student_id: formData.student_id,
        school_id: profile.school_id,
        amount: parseInt(formData.amount),
        type: formData.type,
        method: formData.method || null,
        status: formData.status,
        transaction_ref: formData.transaction_ref || null,
        paid_at: formData.status === 'paid' ? (formData.paid_at || new Date().toISOString()) : null
      };

      const { error } = await supabase
        .from('payments')
        .insert(paymentData);

      if (error) throw error;

      alert("Paiement enregistré avec succès !");
      router.push("/dashboard/director/payments");

    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'enregistrement du paiement");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div>
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard/director/payments"
              className="text-blue-600 hover:text-blue-900 mb-4 inline-flex items-center"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Enregistrer un Paiement</h1>
            <p className="text-gray-600 mt-2">
              Ajouter un nouveau paiement manuellement
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Étudiant */}
              <div className="md:col-span-2">
                <label htmlFor="student_id" className="block text-sm font-medium text-gray-700">
                  Étudiant *
                </label>
                <select
                  id="student_id"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner un étudiant</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} 
                      {student.matricule && ` (${student.matricule})`}
                      {student.class_id && ` - ${student.class_id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Montant */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Montant (FCFA) *
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Type de paiement *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="tuition">Scolarité</option>
                  <option value="subscription">Abonnement</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              {/* Méthode de paiement */}
              <div>
                <label htmlFor="method" className="block text-sm font-medium text-gray-700">
                  Méthode de paiement
                </label>
                <select
                  id="method"
                  name="method"
                  value={formData.method}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner une méthode</option>
                  <option value="cash">Espèces</option>
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="check">Chèque</option>
                  <option value="card">Carte bancaire</option>
                </select>
              </div>

              {/* Statut */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Statut *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="failed">Échoué</option>
                </select>
              </div>

              {/* Référence de transaction */}
              <div>
                <label htmlFor="transaction_ref" className="block text-sm font-medium text-gray-700">
                  Référence de transaction
                </label>
                <input
                  type="text"
                  id="transaction_ref"
                  name="transaction_ref"
                  value={formData.transaction_ref}
                  onChange={handleChange}
                  placeholder="Numéro de transaction"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Date de paiement (si statut = payé) */}
              {formData.status === 'paid' && (
                <div className="md:col-span-2">
                  <label htmlFor="paid_at" className="block text-sm font-medium text-gray-700">
                    Date de paiement
                  </label>
                  <input
                    type="datetime-local"
                    id="paid_at"
                    name="paid_at"
                    value={formData.paid_at}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-3 bg-gray-50 text-right rounded-b-lg">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <FontAwesomeIcon icon={faSave} className="h-4 w-4 mr-2" />
              {loading ? "Enregistrement..." : "Enregistrer le paiement"}
            </button>
          </div>
        </form>
      </div>

      {/* Information */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FontAwesomeIcon icon={faMoneyBill} className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Information importante
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Les paiements enregistrés manuellement nécessitent une validation</li>
                <li>La référence de transaction est recommandée pour le suivi</li>
                <li>Les paiements marqués comme "Payés" seront comptabilisés dans les revenus</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}