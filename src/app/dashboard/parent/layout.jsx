"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ParentLayout({ children }) {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [childrenList, setChildrenList] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchParentData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, schools(*), parents(*)')
        .eq('id', session.user.id)
        .single();
      if (!profile || profile.role !== 'parent' || profile.status !== 'active') {
        router.push("/unauthorized");
        return;
      }
      setUser(profile);
      setSchool(profile.schools);
      // Récupérer les enfants
      const { data: parentStudents } = await supabase
        .from('parent_students')
        .select('student_id, students(*, profiles(*), classes(*))')
        .eq('parent_id', profile.parents.id);
      setChildrenList(parentStudents?.map(ps => ps.students) || []);
      setLoading(false);
    };
    fetchParentData();
  }, [router]);

  const navigation = [
    { name: "Tableau de bord", href: "/dashboard/parent" },
    { name: "Emplois du temps", href: "/dashboard/parent/schedules" },
    { name: "Factures & Reçus", href: "/dashboard/parent/invoices" },
    { name: "Absences", href: "/dashboard/parent/absences" },
    { name: "Notes", href: "/dashboard/parent/grades" }
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
            <span className="font-semibold">Enfants :</span>
            <ul className="ml-2 list-disc">
              {childrenList.map(child => (
                <li key={child.id} className="text-xs text-gray-700">{child.profiles?.first_name} {child.profiles?.last_name} ({child.classes?.name})</li>
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
