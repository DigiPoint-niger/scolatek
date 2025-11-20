"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function SupervisorDashboard() {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupervisorData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, schools(*)')
        .eq('id', session.user.id)
        .single();
      if (!profile || profile.role !== 'supervisor' || profile.status !== 'active') return;
      setUser(profile);
      setSchool(profile.schools);
      setLoading(false);
    };
    fetchSupervisorData();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tableau de bord Surveillant</h1>
      <p className="mb-2">Bienvenue, {user?.first_name} {user?.last_name}</p>
      <p className="mb-2">École : {school?.name}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Link href="/dashboard/supervisor/grades-report" className="block p-6 bg-blue-100 rounded shadow hover:bg-blue-200">Gérer les relevés de notes</Link>
        <Link href="/dashboard/supervisor/conduct" className="block p-6 bg-green-100 rounded shadow hover:bg-green-200">Remplir la conduite</Link>
        <Link href="/dashboard/supervisor/students-list" className="block p-6 bg-yellow-100 rounded shadow hover:bg-yellow-200">Impression des listes d'élèves</Link>
        <Link href="/dashboard/supervisor/promoted-list" className="block p-6 bg-purple-100 rounded shadow hover:bg-purple-200">Liste des élèves promus</Link>
        <Link href="/dashboard/supervisor/absences" className="block p-6 bg-red-100 rounded shadow hover:bg-red-200">Justifier les absences</Link>
        <Link href="/dashboard/supervisor/schedule" className="block p-6 bg-gray-100 rounded shadow hover:bg-gray-200">Modifier les emplois du temps</Link>
      </div>
    </div>
  );
}
