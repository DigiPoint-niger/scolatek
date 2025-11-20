"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (!session) {
          // Rediriger vers login si non authentifié
          router.push("/login");
          return;
        }

        // Récupérer le profil utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, status, first_name, school_id')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        // Vérifier si le compte est actif
        if (profile.status !== 'active') {
          await supabase.auth.signOut();
          router.push("/login?message=Votre compte est en attente de confirmation");
          return;
        }

        // Rediriger en fonction du rôle
        switch (profile.role) {
          case 'admin':
            router.push("/dashboard/admin");
            break;
          case 'director':
            router.push("/dashboard/director");
            break;
          case 'teacher':
            router.push("/dashboard/teacher");
            break;
          case 'student':
            router.push("/dashboard/student");
            break;
          case 'parent':
            router.push("/dashboard/parent");
            break;
          case 'supervisor':
            router.push("/dashboard/supervisor");
            break;
          case 'accountant':
            router.push("/dashboard/accountant");
            break;
          default:
            router.push("/unauthorized");
        }

      } catch (err) {
        console.error("Erreur de redirection:", err);
        setError("Erreur lors de la redirection");
        setLoading(false);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-blue-400 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Redirection en cours...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-blue-400 to-white">
        <div className="text-center">
          <div className="text-red-600 text-2xl mb-4">Erreur</div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </main>
    );
  }

  return null;
}