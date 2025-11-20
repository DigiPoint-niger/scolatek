"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ParentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParentData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, schools(*)')
        .eq('id', session.user.id)
        .single();
      if (!profile || profile.role !== 'parent' || profile.status !== 'active') {
        router.push("/unauthorized");
        return;
      }
      setUser(profile);
      setSchool(profile.schools);
      setLoading(false);
    };
    fetchParentData();
  }, [router]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tableau de bord Parent</h1>
      <p className="mb-2">Bienvenue, {user?.first_name} {user?.last_name}</p>
      <p className="mb-2">École : {school?.name}</p>
      {/* Ajoutez ici les fonctionnalités spécifiques aux parents */}
    </div>
  );
}
