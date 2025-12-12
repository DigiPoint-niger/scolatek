// /dashboard/director/teachers/add/page.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChalkboardTeacher,
  faArrowLeft,
  faSave
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function AddTeacher() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    subject: ""
  });

  const commonSubjects = [
    "Mathématiques",
    "Physique-Chimie",
    "Sciences de la Vie et de la Terre",
    "Histoire-Géographie",
    "Français",
    "Anglais",
    "Espagnol",
    "Allemand",
    "Philosophie",
    "Éducation Physique et Sportive",
    "Sciences Économiques et Sociales",
    "Technologie",
    "Musique",
    "Arts Plastiques",
    "Informatique"
  ];

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

      // 1. Créer l'utilisateur dans auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: "password123", // Mot de passe temporaire
        email_confirm: true,
        user_metadata: {
          first_name: formData.first_name,
          last_name: formData.last_name
        }
      });

      if (authError) throw authError;

      // 2. Créer/Mettre à jour le profil avec le rôle teacher
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          external_auth_id: authData.user.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: 'teacher',
          school_id: profile.school_id,
          status: 'active',
          subject: formData.subject || null
        });

      if (profileError) throw profileError;

      alert("Enseignant créé avec succès !");
      router.push("/dashboard/director/teachers");

    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la création de l'enseignant");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div>
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard/director/teachers"
              className="text-blue-600 hover:text-blue-900 mb-4 inline-flex items-center"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Ajouter un enseignant</h1>
            <p className="text-gray-600 mt-2">
              Créer un nouveau compte enseignant
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prénom */}
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  Prénom *
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Nom */}
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Nom *
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Téléphone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Téléphone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Matière */}
              <div className="md:col-span-2">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Matière enseignée
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner une matière</option>
                  {commonSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                  <option value="other">Autre matière</option>
                </select>
              </div>

              {/* Autre matière (si "Autre" est sélectionné) */}
              {formData.subject === 'other' && (
                <div className="md:col-span-2">
                  <label htmlFor="custom_subject" className="block text-sm font-medium text-gray-700">
                    Précisez la matière
                  </label>
                  <input
                    type="text"
                    id="custom_subject"
                    name="custom_subject"
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Entrez le nom de la matière"
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
              {loading ? "Création..." : "Créer l'enseignant"}
            </button>
          </div>
        </form>
      </div>

      {/* Information */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FontAwesomeIcon icon={faChalkboardTeacher} className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Information importante
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Un mot de passe temporaire sera généré pour l'enseignant. Il pourra le modifier lors de sa première connexion.
              </p>
              <p className="mt-1">
                L'enseignant aura accès aux fonctionnalités dédiées aux enseignants dans l'application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}