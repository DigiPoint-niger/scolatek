"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [platformSettings, setPlatformSettings] = useState(null);
  const router = useRouter();

  // Charger les paramètres de la plateforme
  useEffect(() => {
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
        }
      } catch (err) {
        //console.error("Erreur chargement paramètres:", err);
      }
    };

    fetchPlatformSettings();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Vérifier le mode maintenance
      if (maintenanceMode) {
        // En mode maintenance, seuls les admins peuvent se connecter
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        // Vérifier le rôle de l'utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('status, role, first_name, school_id')
          .eq('id', authData.user.id)
          .single();

        if (profileError) throw profileError;

        // En mode maintenance, seuls les administrateurs peuvent se connecter
        if (profile.role !== 'admin') {
          await supabase.auth.signOut();
          throw new Error("La plateforme est en maintenance. Seuls les administrateurs peuvent se connecter.");
        }

        if (profile.status !== 'active') {
          await supabase.auth.signOut();
          throw new Error("Votre compte administrateur n'est pas actif.");
        }

        // Redirection vers le dashboard admin
        router.push("/dashboard/admin");
        return;
      }

      // Connexion normale (hors maintenance)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Vérifier le statut du profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status, role, first_name, school_id')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.status !== 'active') {
        // Déconnexion si le compte n'est pas actif
        await supabase.auth.signOut();
        throw new Error(
          profile.status === 'pending' 
            ? "Votre compte est en attente de confirmation. Vous recevrez un email lorsqu'il sera activé."
            : "Votre compte a été rejeté ou suspendu. Contactez l'administrateur."
        );
      }

      // Redirection vers le dashboard approprié
      if (profile.role === 'admin') {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }

    } catch (err) {
      console.error("Erreur connexion:", err);
      setError(err.message || "Erreur de connexion. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  // Écran de maintenance complet
  if (maintenanceMode) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-400 via-gray-600 to-gray-800 px-4 py-8">
        <div className="w-full max-w-md bg-white/90 rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="bg-yellow-100 border border-yellow-400 rounded-full p-4 inline-flex mb-4">
              <svg className="h-12 w-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Maintenance en cours</h1>
            <p className="text-gray-600">La plateforme ScolaTek est temporairement indisponible</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-800 text-center">
              Nous effectuons actuellement une maintenance planifiée. 
              La plateforme sera à nouveau disponible sous peu.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 text-center">Accès administrateur</h3>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email administrateur
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="admin@scolatek.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Votre mot de passe"
                />
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 rounded-xl bg-gray-600 text-white font-semibold shadow hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Connexion..." : "Se connecter (Admin)"}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Pour toute urgence, contactez l'équipe technique.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Login normal
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-blue-400 to-white px-4 py-8">
      <div className="w-full max-w-md bg-white/90 rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Connexion</h1>
          <p className="text-gray-600">Accédez à votre compte ScolaTek</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Votre mot de passe"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold shadow hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Pas de compte ?{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Créer un compte
            </Link>
          </p>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700 text-center">
            <strong>Nouveau ?</strong> Votre compte doit être confirmé avant la première connexion.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            En vous connectant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </p>
        </div>
      </div>
    </main>
  );
}