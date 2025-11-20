// /dashboard/director/classes/add/page.jsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUsers,
  faArrowLeft,
  faSave
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function AddClass() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    level: ""
  });

  const commonLevels = [
    "Préscolaire",
    "CP",
    "CE1",
    "CE2",
    "CM1",
    "CM2",
    "6ème",
    "5ème",
    "4ème",
    "3ème",
    "Seconde",
    "Première",
    "Terminale"
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

      // Créer la classe
      const { error } = await supabase
        .from('classes')
        .insert({
          name: formData.name,
          level: formData.level || null,
          school_id: profile.school_id
        });

      if (error) throw error;

      alert("Classe créée avec succès !");
      router.push("/dashboard/director/classes");

    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la création de la classe");
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
              href="/dashboard/director/classes"
              className="text-blue-600 hover:text-blue-900 mb-4 inline-flex items-center"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Créer une Classe</h1>
            <p className="text-gray-600 mt-2">
              Ajouter une nouvelle classe à votre école
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom de la classe */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nom de la classe *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Terminale A, CM2 B, etc."
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Donnez un nom significatif à votre classe
                </p>
              </div>

              {/* Niveau */}
              <div className="md:col-span-2">
                <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                  Niveau
                </label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner un niveau</option>
                  {commonLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                  <option value="other">Autre niveau</option>
                </select>
              </div>

              {/* Autre niveau (si "Autre" est sélectionné) */}
              {formData.level === 'other' && (
                <div className="md:col-span-2">
                  <label htmlFor="custom_level" className="block text-sm font-medium text-gray-700">
                    Précisez le niveau
                  </label>
                  <input
                    type="text"
                    id="custom_level"
                    name="custom_level"
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Entrez le niveau de la classe"
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
              {loading ? "Création..." : "Créer la classe"}
            </button>
          </div>
        </form>
      </div>

      {/* Information */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FontAwesomeIcon icon={faUsers} className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Bonnes pratiques
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Utilisez des noms clairs et cohérents (ex: "Terminale A", "CM2 B")</li>
                <li>Le niveau aide à organiser les classes par cycle d'études</li>
                <li>Vous pourrez assigner des étudiants à cette classe après sa création</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}