// /dashboard/director/layout.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChartBar, 
  faUsers,
  faUserGraduate,
  faChalkboardTeacher,
  faMoneyBill,
  faCalendarAlt,
  faCog,
  faBars,
  faBook,
  faTimes,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons'

export default function DirectorLayout({ children }) {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkDirectorAccess = async () => {
      try {
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

        if (!profile || profile.role !== 'director' || profile.status !== 'active') {
          router.push("/unauthorized");
          return;
        }

        setUser(profile);
        setSchool(profile.schools);
        setLoading(false);
      } catch (error) {
        console.error("Erreur:", error);
        router.push("/login");
      }
    };

    checkDirectorAccess();
  }, [router]);

  const navigation = [
    { name: "Tableau de bord", href: "/dashboard/director", icon: faChartBar },
    { name: "Étudiants", href: "/dashboard/director/students", icon: faUserGraduate },
    { name: "Enseignants", href: "/dashboard/director/teachers", icon: faChalkboardTeacher },
    { name: "Classes", href: "/dashboard/director/classes", icon: faUsers },
    { name: "Matières", href: "/dashboard/director/subjects", icon: faBook },
    { name: "Paiements", href: "/dashboard/director/payments", icon: faMoneyBill },
    { name: "Emploi du temps", href: "/dashboard/director/schedule", icon: faCalendarAlt },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar pour mobile */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Fermer la sidebar</span>
              <FontAwesomeIcon icon={faTimes} className="text-white text-xl" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">{school?.name || "École"}</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <FontAwesomeIcon 
                    icon={item.icon} 
                    className={`mr-4 flex-shrink-0 h-6 w-6 ${
                      pathname === item.href ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs font-medium text-gray-500 capitalize">Directeur</p>
                <p className="text-xs text-gray-400">{school?.name}</p>
              </div>
              <button
                onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                className="ml-2 text-gray-400 hover:text-gray-500"
                title="Déconnexion"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar pour desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">{school?.name || "École"}</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      pathname === item.href
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <FontAwesomeIcon 
                      icon={item.icon} 
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        pathname === item.href ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs font-medium text-gray-500 capitalize">Directeur</p>
                  <p className="text-xs text-gray-400 truncate">{school?.name}</p>
                </div>
                <button
                  onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                  className="ml-2 text-gray-400 hover:text-gray-500"
                  title="Déconnexion"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Barre du haut */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Ouvrir la sidebar</span>
            <FontAwesomeIcon icon={faBars} className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {navigation.find(item => item.href === pathname)?.name || 'Directeur'}
              </h2>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <span className="text-sm text-gray-500">
                Bonjour, <span className="font-medium">{user?.first_name}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Contenu de la page */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}