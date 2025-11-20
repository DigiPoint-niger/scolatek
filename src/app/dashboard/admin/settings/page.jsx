"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faSave,
  faCog,
  faShieldAlt,
  faUserPlus,
  faPowerOff,
  faCheckCircle,
  faTimes
} from '@fortawesome/free-solid-svg-icons'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    auto_approve_schools: false,
    subscription_price: 150000,
    student_registration: true,
    teacher_registration: false,
    parent_registration: false
  });

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');

      if (error) {
        console.error("Erreur lors du chargement des paramètres:", error);
        await createSettingsTable();
      } else if (data && data.length > 0) {
        const settingsData = {};
        data.forEach(item => {
          settingsData[item.key] = item.value;
        });
        setSettings(prev => ({ ...prev, ...settingsData }));
      }
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error);
    } finally {
      setLoading(false);
    }
  };

  const createSettingsTable = async () => {
    try {
      const { error } = await supabase
        .from('platform_settings')
        .insert([
          { key: 'maintenance_mode', value: false },
          { key: 'auto_approve_schools', value: false },
          { key: 'subscription_price', value: 150000 },
          { key: 'student_registration', value: true },
          { key: 'teacher_registration', value: false },
          { key: 'parent_registration', value: false }
        ]);

      if (error) {
        console.error("Erreur création table settings:", error);
      }
    } catch (error) {
      console.error("Erreur création table settings:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('platform_settings')
        .upsert(settingsArray, { 
          onConflict: 'key',
          ignoreDuplicates: false 
        });

      if (error) throw error;
      
      setSaveMessage("Paramètres sauvegardés avec succès !");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setSaveMessage("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div>
      {/* En-tête de page */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres de la Plateforme</h1>
        <p className="text-gray-600">Configuration des options principales de ScolaTek</p>
      </div>

      {saveMessage && (
        <div className={`mb-6 border rounded-md p-4 ${
          saveMessage.includes("Erreur") 
            ? "bg-red-50 border-red-200" 
            : "bg-green-50 border-green-200"
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <FontAwesomeIcon 
                icon={saveMessage.includes("Erreur") ? faTimes : faCheckCircle} 
                className={`h-5 w-5 ${saveMessage.includes("Erreur") ? "text-red-400" : "text-green-400"}`} 
              />
            </div>
            <div className="ml-3">
              <p className={`text-sm ${saveMessage.includes("Erreur") ? "text-red-800" : "text-green-800"}`}>
                {saveMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Statut de la plateforme */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6 flex items-center">
              <FontAwesomeIcon icon={faPowerOff} className="mr-2 text-blue-500" />
              Statut de la Plateforme
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faShieldAlt} className="mr-3 text-gray-400" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Mode Maintenance</h4>
                    <p className="text-sm text-gray-500">
                      {settings.maintenance_mode 
                        ? "La plateforme est en maintenance - Accès restreint" 
                        : "Plateforme active - Tous les services disponibles"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleChange('maintenance_mode', !settings.maintenance_mode)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    settings.maintenance_mode ? 'bg-red-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings.maintenance_mode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {settings.maintenance_mode && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FontAwesomeIcon icon={faShieldAlt} className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Mode maintenance activé
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Seuls les administrateurs peuvent accéder à la plateforme. 
                          Les autres utilisateurs verront une page de maintenance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inscriptions et approbation */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6 flex items-center">
              <FontAwesomeIcon icon={faUserPlus} className="mr-2 text-blue-500" />
              Inscriptions et Approbation
            </h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Approbation automatique des écoles</h4>
                  <p className="text-sm text-gray-500">
                    {settings.auto_approve_schools 
                      ? "Les nouvelles écoles sont automatiquement approuvées" 
                      : "Approbation manuelle requise pour les nouvelles écoles"}
                  </p>
                </div>
                <button
                  onClick={() => handleChange('auto_approve_schools', !settings.auto_approve_schools)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    settings.auto_approve_schools ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings.auto_approve_schools ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Prix de l'abonnement */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label htmlFor="subscription_price" className="block text-sm font-medium text-gray-700 mb-2">
                  Prix de l'abonnement annuel (FCFA)
                </label>
                <input
                  type="number"
                  id="subscription_price"
                  value={settings.subscription_price}
                  onChange={(e) => handleChange('subscription_price', parseInt(e.target.value) || 0)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Prix par école pour un abonnement d'un an
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Inscriptions par rôle */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6 flex items-center">
              <FontAwesomeIcon icon={faUserPlus} className="mr-2 text-blue-500" />
              Inscriptions par Rôle
            </h3>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Définissez quels rôles peuvent s'inscrire directement sur la plateforme
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Étudiants */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">Étudiants</h4>
                    <button
                      onClick={() => handleChange('student_registration', !settings.student_registration)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        settings.student_registration ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings.student_registration ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Permettre aux étudiants de créer un compte
                  </p>
                </div>

                {/* Enseignants */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">Enseignants</h4>
                    <button
                      onClick={() => handleChange('teacher_registration', !settings.teacher_registration)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        settings.teacher_registration ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings.teacher_registration ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Permettre aux enseignants de créer un compte
                  </p>
                </div>

                {/* Parents */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">Parents</h4>
                    <button
                      onClick={() => handleChange('parent_registration', !settings.parent_registration)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        settings.parent_registration ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings.parent_registration ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Permettre aux parents de créer un compte
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faUserPlus} className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Gestion des inscriptions
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Les rôles désactivés ne pourront pas créer de compte directement. 
                        Ils devront être invités par une école existante.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Appliquer les modifications
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Les paramètres seront appliqués immédiatement
                </p>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faSave} className={`mr-2 ${saving ? 'animate-spin' : ''}`} />
                {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}