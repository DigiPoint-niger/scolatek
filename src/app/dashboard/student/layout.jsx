"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function StudentLayout({ children }) {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStudentData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, schools(*), students(*)')
        .eq('id', session.user.id)
        .single();
      if (!profile || profile.role !== 'student' || profile.status !== 'active') {
        router.push("/unauthorized");
        return;
      }
      setUser(profile);
      setSchool(profile.schools);
      setLoading(false);
    };
    fetchStudentData();
  }, [router]);

  const navigation = [
    { name: "Tableau de bord", href: "/dashboard/student" },
    { name: "Notes", href: "/dashboard/student/grades" },
    { name: "Devoirs", href: "/dashboard/student/homeworks" },
    { name: "Absences", href: "/dashboard/student/absences" },
    { name: "Emploi du temps", href: "/dashboard/student/schedule" }
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r">
        <div className="p-4">
          <h2 className="text-xl font-bold">{school?.name || "École"}</h2>
          <p className="text-sm text-gray-600">{user?.first_name} {user?.last_name}</p>
        </div>
        <nav className="mt-4">
          {navigation.map(item => (
            <Link key={item.name} href={item.href} className="block px-4 py-2 text-gray-700 hover:bg-blue-100 rounded">
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
