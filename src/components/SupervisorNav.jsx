"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faFileDownload,
  faChartBar, 
  faUsers,
  faUserGraduate,
  faBook,
  faCalendarAlt,
  faBars,
  faTimes,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons'

export default function SupervisorNav({ sidebarOpen, setSidebarOpen, user, school }) {
  const pathname = usePathname();

  const navigation = [
    { name: "Tableau de bord", href: "/dashboard/supervisor", icon: faChartBar },
    { name: "Étudiants", href: "/dashboard/supervisor/students-list", icon: faUserGraduate },
    { name: "Conduites", href: "/dashboard/supervisor/conduct", icon: faUserGraduate },
    { name: "Absences", href: "/dashboard/supervisor/absences", icon: faUserGraduate },
    { name: "Relevés de notes", href: "/dashboard/supervisor/grades-report", icon: faBook },
    { name: "Emploi du temps", href: "/dashboard/supervisor/schedule", icon: faCalendarAlt },
    { name: "Bulletins", href: "/dashboard/supervisor/bulletins", icon: faFileDownload },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/login");
    }
  };

  return (
    <>
      {/* Sidebar pour mobile */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <FontAwesomeIcon icon={faTimes} className="text-white text-xl" />
            </button>
          </div>
          
          <div className="flex-1 h-0 overflow-y-auto">
            <nav className="px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition ${
                    pathname === item.href
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <FontAwesomeIcon icon={item.icon} className="mr-4 flex-shrink-0 h-6 w-6" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Sidebar fixe pour desktop */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 md:bg-white md:shadow">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-blue-600">
            <h1 className="text-white text-xl font-bold">ScolaTek</h1>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition ${
                  pathname === item.href
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-3 flex-shrink-0 h-6 w-6" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs font-medium text-gray-500">{school?.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top navbar pour mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-xl font-bold text-blue-600">ScolaTek</h1>
          <button
            className="text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <FontAwesomeIcon icon={faBars} className="text-xl" />
          </button>
        </div>
      </div>
    </>
  );
}
