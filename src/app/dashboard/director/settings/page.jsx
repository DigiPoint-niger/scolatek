// /dashboard/director/settings/page.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCog,
  faSave,
  faSchool,
  faUser,
  faBell,
  faShield,
  faPalette,
  faDatabase,
  faEye,
  faEyeSlash,
  faUpload
} from '@fortawesome/free-solid-svg-icons'

export default function DirectorSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [school, setSchool] = useState(null);
  const [activeTab, setActiveTab] = useState("school");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    // Informations de l'école
    school: {
      name: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      description: ""
    },
    // Paramètres de sécurité
    security: {
      session_timeout: 60,
      password_policy: "medium",
      two_factor_auth: false
    },
    // Paramètres de notification
    notifications: {
      email_notifications: true,
      payment_reminders: true,
      new_student_alerts: true,
      system_updates: true
    },
    // Paramètres d'apparence
    appearance: {
      theme: "light",
      language: "fr",
      date_format: "DD/MM/YYYY",
      time_format: "24h"
    }
  });

  useEffect(() => {
    fetchSchoolData();
  }, []);

  const fetchSchoolData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single();

      if (!profile) return;

      // Récupérer les données de l'école
      const { data: schoolData } = await supabase
        .from('schools')
        .select('*')
        .eq('id', profile.school_id)
        .single();

      setSchool(schoolData);

      // Pré-remplir le formulaire avec les données de l'école
      if (schoolData) {
        setFormData(prev => ({
          ...prev,
          school: {
            name: schoolData.name || "",
            address: schoolData.address || "",
            phone: schoolData.phone || "",
            email: schoolData.email || "",
            website: schoolData.website || "",
            description: schoolData.description || ""
          }
        }));
      }

      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single();

      if (!profile) return;

      // Mettre à jour les informations de l'école
      const { error } = await supabase
        .from('schools')
        .update({
          name: formData.school.name,
          address: formData.school.address,
          phone: formData.school.phone,
          email: formData.school.email,
          website: formData.school.website,
          description: formData.school.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.school_id);

      if (error) throw error;

      // Ici, vous pourriez aussi sauvegarder les autres paramètres dans une table dédiée
      // Par exemple: supabase.from('school_settings').upsert(...)

      alert("Paramètres sauvegardés avec succès !");
      
      // Recharger les données
      await fetchSchoolData();

    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la sauvegarde des paramètres");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner un fichier image valide");
      return;
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5MB");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single();

      if (!profile) return;

      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.school_id}/logo-${Date.now()}.${fileExt}`;

      // Uploader le fichier vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('school-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('school-logos')
        .getPublicUrl(fileName);

      // Mettre à jour l'école avec la nouvelle URL du logo
      const { error: updateError } = await supabase
        .from('schools')
        .update({ 
          logo_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.school_id);

      if (updateError) throw updateError;

      // Mettre à jour l'état local
      setSchool(prev => ({ ...prev, logo_url: publicUrl }));
      alert("Logo mis à jour avec succès !");

    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      alert("Erreur lors de l'upload du logo");
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    if (!confirm("Êtes-vous sûr de vouloir réinitialiser tous les paramètres ? Cette action est irréversible.")) {
      return;
    }
    
    // Réinitialiser aux valeurs par défaut
    setFormData({
      school: {
        name: school?.name || "",
        address: school?.address || "",
        phone: school?.phone || "",
        email: school?.email || "",
        website: school?.website || "",
        description: school?.description || ""
      },
      security: {
        session_timeout: 60,
        password_policy: "medium",
        two_factor_auth: false
      },
      notifications: {
        email_notifications: true,
        payment_reminders: true,
        new_student_alerts: true,
        system_updates: true
      },
      appearance: {
        theme: "light",
        language: "fr",
        date_format: "DD/MM/YYYY",
        time_format: "24h"
      }
    });
    
    alert("Paramètres réinitialisés");
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
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-2">
          Gérez les paramètres de votre école (Cette partie est encore en cours de developpement)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation latérale */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <nav className="p-4 space-y-2">
              <button
                onClick={() => setActiveTab("school")}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeTab === "school" 
                    ? "bg-blue-50 text-blue-700 border border-blue-200" 
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={faSchool} className="h-5 w-5 mr-3" />
                Informations de l'école
              </button>

              <button
                onClick={() => setActiveTab("security")}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeTab === "security" 
                    ? "bg-blue-50 text-blue-700 border border-blue-200" 
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={faShield} className="h-5 w-5 mr-3" />
                Sécurité
              </button>

              <button
                onClick={() => setActiveTab("notifications")}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeTab === "notifications" 
                    ? "bg-blue-50 text-blue-700 border border-blue-200" 
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={faBell} className="h-5 w-5 mr-3" />
                Notifications
              </button>

              <button
                onClick={() => setActiveTab("appearance")}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeTab === "appearance" 
                    ? "bg-blue-50 text-blue-700 border border-blue-200" 
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={faPalette} className="h-5 w-5 mr-3" />
                Apparence
              </button>

              <button
                onClick={() => setActiveTab("advanced")}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                  activeTab === "advanced" 
                    ? "bg-blue-50 text-blue-700 border border-blue-200" 
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={faDatabase} className="h-5 w-5 mr-3" />
                Paramètres avancés
              </button>
            </nav>
          </div>

          {/* Statistiques rapides */}
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Dernière mise à jour</span>
                <span className="text-sm font-medium">
                  {school?.updated_at 
                    ? new Date(school.updated_at).toLocaleDateString('fr-FR')
                    : "N/A"
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">École créée le</span>
                <span className="text-sm font-medium">
                  {school?.created_at 
                    ? new Date(school.created_at).toLocaleDateString('fr-FR')
                    : "N/A"
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit}>
            <div className="bg-white shadow rounded-lg">
              {/* Informations de l'école */}
              {activeTab === "school" && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Informations de l'école
                    </h2>
                  </div>

                  {/* Logo de l'école */}
                  <div className="border-b border-gray-200 pb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Logo de l'école
                    </label>
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        {school?.logo_url ? (
                          <img
                            src={school.logo_url}
                            alt="Logo de l'école"
                            className="h-20 w-20 rounded-lg object-cover border"
                          />
                        ) : (
                          <div className="h-20 w-20 rounded-lg bg-gray-200 flex items-center justify-center border">
                            <FontAwesomeIcon icon={faSchool} className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="relative cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleLogoUpload}
                          />
                          <span className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                            <FontAwesomeIcon icon={faUpload} className="h-4 w-4 mr-2" />
                            {school?.logo_url ? "Changer le logo" : "Ajouter un logo"}
                          </span>
                        </label>
                        <p className="mt-2 text-sm text-gray-500">
                          PNG, JPG, GIF jusqu'à 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nom de l'école */}
                    <div>
                      <label htmlFor="school-name" className="block text-sm font-medium text-gray-700">
                        Nom de l'école *
                      </label>
                      <input
                        type="text"
                        id="school-name"
                        value={formData.school.name}
                        onChange={(e) => handleChange("school", "name", e.target.value)}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="school-email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        id="school-email"
                        value={formData.school.email}
                        onChange={(e) => handleChange("school", "email", e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Téléphone */}
                    <div>
                      <label htmlFor="school-phone" className="block text-sm font-medium text-gray-700">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        id="school-phone"
                        value={formData.school.phone}
                        onChange={(e) => handleChange("school", "phone", e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Site web */}
                    <div>
                      <label htmlFor="school-website" className="block text-sm font-medium text-gray-700">
                        Site web
                      </label>
                      <input
                        type="url"
                        id="school-website"
                        value={formData.school.website}
                        onChange={(e) => handleChange("school", "website", e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Adresse */}
                    <div className="md:col-span-2">
                      <label htmlFor="school-address" className="block text-sm font-medium text-gray-700">
                        Adresse
                      </label>
                      <textarea
                        id="school-address"
                        rows={3}
                        value={formData.school.address}
                        onChange={(e) => handleChange("school", "address", e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label htmlFor="school-description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="school-description"
                        rows={4}
                        value={formData.school.description}
                        onChange={(e) => handleChange("school", "description", e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Brève description de votre école..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Paramètres de sécurité */}
              {activeTab === "security" && (
                <div className="p-6 space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Paramètres de sécurité
                  </h2>

                  <div className="space-y-6">
                    {/* Timeout de session */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Délai d'expiration de session (minutes)
                      </label>
                      <select
                        value={formData.security.session_timeout}
                        onChange={(e) => handleChange("security", "session_timeout", parseInt(e.target.value))}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 heure</option>
                        <option value={120}>2 heures</option>
                        <option value={240}>4 heures</option>
                        <option value={480}>8 heures</option>
                      </select>
                    </div>

                    {/* Politique de mot de passe */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Politique de mot de passe
                      </label>
                      <select
                        value={formData.security.password_policy}
                        onChange={(e) => handleChange("security", "password_policy", e.target.value)}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Faible (6 caractères minimum)</option>
                        <option value="medium">Moyen (8 caractères, lettres et chiffres)</option>
                        <option value="high">Élevé (12 caractères, lettres, chiffres et symboles)</option>
                      </select>
                    </div>

                    {/* Authentification à deux facteurs */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Authentification à deux facteurs
                        </label>
                        <p className="text-sm text-gray-500">
                          Ajoutez une couche de sécurité supplémentaire à votre compte
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChange("security", "two_factor_auth", !formData.security.two_factor_auth)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          formData.security.two_factor_auth ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            formData.security.two_factor_auth ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Paramètres de notification */}
              {activeTab === "notifications" && (
                <div className="p-6 space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Paramètres de notification
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Notifications par email
                        </label>
                        <p className="text-sm text-gray-500">
                          Recevoir des notifications importantes par email
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChange("notifications", "email_notifications", !formData.notifications.email_notifications)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          formData.notifications.email_notifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            formData.notifications.email_notifications ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Rappels de paiement
                        </label>
                        <p className="text-sm text-gray-500">
                          Notifications pour les paiements en attente
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChange("notifications", "payment_reminders", !formData.notifications.payment_reminders)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          formData.notifications.payment_reminders ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            formData.notifications.payment_reminders ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Alertes nouveaux étudiants
                        </label>
                        <p className="text-sm text-gray-500">
                          Notifications lors de nouvelles inscriptions
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChange("notifications", "new_student_alerts", !formData.notifications.new_student_alerts)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          formData.notifications.new_student_alerts ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            formData.notifications.new_student_alerts ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Mises à jour système
                        </label>
                        <p className="text-sm text-gray-500">
                          Notifications pour les mises à jour et maintenance
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChange("notifications", "system_updates", !formData.notifications.system_updates)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          formData.notifications.system_updates ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            formData.notifications.system_updates ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Paramètres d'apparence */}
              {activeTab === "appearance" && (
                <div className="p-6 space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Paramètres d'apparence
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Thème */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thème
                      </label>
                      <select
                        value={formData.appearance.theme}
                        onChange={(e) => handleChange("appearance", "theme", e.target.value)}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="light">Clair</option>
                        <option value="dark">Sombre</option>
                        <option value="auto">Automatique</option>
                      </select>
                    </div>

                    {/* Langue */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Langue
                      </label>
                      <select
                        value={formData.appearance.language}
                        onChange={(e) => handleChange("appearance", "language", e.target.value)}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>

                    {/* Format de date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Format de date
                      </label>
                      <select
                        value={formData.appearance.date_format}
                        onChange={(e) => handleChange("appearance", "date_format", e.target.value)}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="DD/MM/YYYY">JJ/MM/AAAA</option>
                        <option value="MM/DD/YYYY">MM/JJ/AAAA</option>
                        <option value="YYYY-MM-DD">AAAA-MM-JJ</option>
                      </select>
                    </div>

                    {/* Format d'heure */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Format d'heure
                      </label>
                      <select
                        value={formData.appearance.time_format}
                        onChange={(e) => handleChange("appearance", "time_format", e.target.value)}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="24h">24 heures</option>
                        <option value="12h">12 heures (AM/PM)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Paramètres avancés */}
              {activeTab === "advanced" && (
                <div className="p-6 space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Paramètres avancés
                  </h2>

                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <FontAwesomeIcon icon={faCog} className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Zone de configuration avancée
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>
                              Ces paramètres sont destinés aux utilisateurs avancés. 
                              Modifiez-les avec prudence.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Réinitialisation des paramètres */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Actions dangereuses
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <button
                            type="button"
                            onClick={resetSettings}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
                          >
                            <FontAwesomeIcon icon={faCog} className="h-4 w-4 mr-2" />
                            Réinitialiser tous les paramètres
                          </button>
                          <p className="mt-2 text-sm text-gray-500">
                            Réinitialise tous les paramètres aux valeurs par défaut. Cette action est irréversible.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-between items-center">
                <button
                  type="button"
                  onClick={resetSettings}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Réinitialiser
                </button>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  <FontAwesomeIcon icon={faSave} className="h-4 w-4 mr-2" />
                  {saving ? "Sauvegarde..." : "Sauvegarder les paramètres"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}