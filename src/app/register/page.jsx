"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "student",
    password: "",
    confirmPassword: "",
    schoolId: "",
    schoolName: "",
    schoolAddress: "",
    schoolPhone: "",
    schoolEmail: ""
  });
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [platformSettings, setPlatformSettings] = useState(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const router = useRouter();

  // Charger les paramètres de la plateforme
  const fetchPlatformSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const settings = {};
        data.forEach(item => {
          settings[item.key] = item.value;
        });
        setPlatformSettings(settings);
        setMaintenanceMode(settings.maintenance_mode === true);
        
        // Vérifier si le rôle par défaut est disponible
        if (!settings.student_registration && formData.role === "student") {
          setFormData(prev => ({ ...prev, role: "teacher" }));
        }
      }
    } catch (err) {
      console.error("Erreur chargement paramètres:", err);
    }
  };

  // Charger la liste des écoles actives
  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSchools(data || []);
    } catch (err) {
      console.error("Erreur chargement écoles:", err);
    }
  };

  useEffect(() => {
    fetchPlatformSettings();
    fetchSchools();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const isRoleEnabled = (role) => {
    if (!platformSettings) return true;
    
    switch (role) {
      case 'student':
        return platformSettings.student_registration === true;
      case 'teacher':
        return platformSettings.teacher_registration === true;
      case 'parent':
        return platformSettings.parent_registration === true;
      case 'director':
      case 'supervisor':
      case 'accountant':
        return true; // Ces rôles sont toujours autorisés
      default:
        return false;
    }
  };

  const getAvailableRoles = () => {
    const allRoles = [
      { value: 'student', label: 'Étudiant' },
      { value: 'teacher', label: 'Enseignant' },
      { value: 'parent', label: 'Parent' },
      { value: 'director', label: 'Directeur d\'école' },
      { value: 'supervisor', label: 'Superviseur' },
      { value: 'accountant', label: 'Comptable' }
    ];

    return allRoles.filter(role => isRoleEnabled(role.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Vérifier le mode maintenance
    if (maintenanceMode) {
      setError("La plateforme est en maintenance. Les inscriptions sont temporairement désactivées.");
      setLoading(false);
      return;
    }

    // Vérifier si le rôle est autorisé
    if (!isRoleEnabled(formData.role)) {
      setError("L'inscription pour ce rôle est temporairement désactivée.");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    try {
      // 1. Créer l'utilisateur dans l'auth Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: formData.role
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erreur lors de la création du compte");

      let schoolIdToUse = formData.schoolId;

      // 2. Si c'est un directeur, créer l'école
      if (formData.role === "director") {
        const autoApprove = platformSettings?.auto_approve_schools === true;
        
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .insert({
            name: formData.schoolName,
            address: formData.schoolAddress,
            phone: formData.schoolPhone,
            email: formData.schoolEmail,
            is_active: autoApprove // Auto-activation si paramétré
          })
          .select()
          .single();

        if (schoolError) throw schoolError;
        schoolIdToUse = schoolData.id;
      }

      // 3. Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          school_id: schoolIdToUse || null,
          status: formData.role === "director" && platformSettings?.auto_approve_schools ? 'active' : 'pending'
        });

      if (profileError) throw profileError;

      // 4. Créer l'entrée dans la table spécifique au rôle si nécessaire
      if (['teacher', 'parent', 'accountant', 'supervisor'].includes(formData.role)) {
        const roleTable = formData.role + 's'; // teachers, parents, etc.
        const { error: roleError } = await supabase
          .from(roleTable)
          .insert({
            profile_id: authData.user.id,
            school_id: schoolIdToUse
          });

        if (roleError) console.error("Erreur création rôle spécifique:", roleError);
      }

      // Message de succès adapté
      let successMessage = "";
      if (formData.role === "director") {
        if (platformSettings?.auto_approve_schools) {
          successMessage = "Votre école et votre compte ont été créés avec succès ! Vous pouvez maintenant vous connecter.";
        } else {
          successMessage = "Votre demande a été envoyée ! Votre école et votre compte seront activés après confirmation par l'administrateur ScolaTek.";
        }
      } else {
        successMessage = "Votre demande d'inscription a été envoyée ! Votre compte sera activé après confirmation par le directeur de l'école.";
      }

      setSuccess(successMessage);

      // Redirection après succès (seulement si auto-approval)
      if ((formData.role === "director" && platformSettings?.auto_approve_schools) || formData.role !== "director") {
        setTimeout(() => {
          router.push("/login");
        }, 4000);
      }

    } catch (err) {
      console.error("Erreur inscription:", err);
      setError(err.message || "Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const isDirector = formData.role === "director";
  const needsSchoolSelection = !isDirector && formData.role !== "admin" && formData.role !== "supervisor" && formData.role !== "accountant";
  const availableRoles = getAvailableRoles();

  // Mode maintenance
  if (maintenanceMode) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-blue-400 to-white px-4 py-8">
        <div className="w-full max-w-2xl bg-white/90 rounded-3xl shadow-xl p-8 text-center">
          <div className="bg-yellow-100 border border-yellow-400 rounded-xl p-6 mb-6">
            <h1 className="text-3xl font-bold text-yellow-800 mb-4">Maintenance en cours</h1>
            <p className="text-yellow-700 mb-4">
              La plateforme ScolaTek est actuellement en maintenance. 
              Les inscriptions sont temporairement désactivées.
            </p>
            <p className="text-yellow-600">
              Veuillez réessayer ultérieurement.
            </p>
          </div>
          <Link 
            href="/" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-blue-400 to-white px-4 py-8">
      <div className="w-full max-w-2xl bg-white/90 rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Créer un compte</h1>
          <p className="text-gray-600">Rejoignez la plateforme ScolaTek</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {availableRoles.length === 0 && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            Les inscriptions sont temporairement fermées pour tous les rôles. 
            Veuillez contacter l'administrateur.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Prénom *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Votre prénom"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="+227 XX XX XX XX"
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Rôle *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {availableRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {isDirector 
                ? `Les directeurs ${platformSettings?.auto_approve_schools ? 'sont automatiquement approuvés' : 'doivent attendre la confirmation de l\'administrateur'}`
                : "Votre compte devra être confirmé par le directeur de l'école"
              }
            </p>
          </div>

          {/* Sélection de l'école pour les non-directeurs */}
          {needsSchoolSelection && (
            <div>
              <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700 mb-1">
                École *
              </label>
              <select
                id="schoolId"
                name="schoolId"
                value={formData.schoolId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Sélectionnez votre école</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              {schools.length === 0 && (
                <p className="text-xs text-yellow-600 mt-1">
                  Aucune école active disponible. Contactez l'administrateur.
                </p>
              )}
            </div>
          )}

          {/* Création d'école pour les directeurs */}
          {isDirector && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-3">Informations de l'école</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'école *
                  </label>
                  <input
                    id="schoolName"
                    name="schoolName"
                    type="text"
                    value={formData.schoolName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nom de votre établissement"
                  />
                </div>

                <div>
                  <label htmlFor="schoolAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse de l'école *
                  </label>
                  <input
                    id="schoolAddress"
                    name="schoolAddress"
                    type="text"
                    value={formData.schoolAddress}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Adresse complète"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="schoolPhone" className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone de l'école *
                    </label>
                    <input
                      id="schoolPhone"
                      name="schoolPhone"
                      type="tel"
                      value={formData.schoolPhone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="+227 XX XX XX XX"
                    />
                  </div>

                  <div>
                    <label htmlFor="schoolEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Email de l'école *
                    </label>
                    <input
                      id="schoolEmail"
                      name="schoolEmail"
                      type="email"
                      value={formData.schoolEmail}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="contact@ecole.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Minimum 6 caractères"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Retaper le mot de passe"
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Confirmation requise
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    {isDirector 
                      ? platformSettings?.auto_approve_schools
                        ? "Votre école sera automatiquement activée après création."
                        : "Votre compte et votre école devront être approuvés par l'administrateur ScolaTek avant activation."
                      : "Votre compte devra être confirmé par le directeur de l'école sélectionnée avant activation."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || availableRoles.length === 0}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold shadow hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Création du compte..." : "Soumettre la demande"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Se connecter
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            En créant un compte, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </p>
        </div>
      </div>
    </main>
  );
}