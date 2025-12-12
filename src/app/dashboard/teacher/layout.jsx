"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function TeacherLayout({ children }) {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTeacherData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profile || profile.role !== 'teacher' || profile.status !== 'active') {
        router.push("/unauthorized");
        return;
      }

      // Récupérer l'école
      const { data: school } = await supabase
        .from('schools')
        .select('*')
        .eq('id', profile.school_id)
        .single();

      setUser(profile);
      setSchool(school);
      setSubjects(profile.subject ? [profile.subject] : []);
      setLoading(false);
    };
    fetchTeacherData();
  }, [router]);

  const navigation = [
    { name: "Tableau de bord", href: "/dashboard/teacher" },
    { name: "Notes des élèves", href: "/dashboard/teacher/grades" },
    { name: "Devoirs", href: "/dashboard/teacher/homeworks" },
    { name: "Absences", href: "/dashboard/teacher/absences" }
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
          <div className="mt-2">
            <span className="font-semibold">Matières :</span>
            <ul className="ml-2 list-disc">
              {subjects.map((subject, idx) => (
                <li key={idx} className="text-xs text-gray-700">{subject}</li>
              ))}
            </ul>
          </div>
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
