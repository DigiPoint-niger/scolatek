// /dashboard/director/classes/page.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUsers,
  faSearch,
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faFilter,
  faDownload,
  faUserGraduate,
  faChalkboardTeacher
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function DirectorClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [school, setSchool] = useState(null);
  const [studentCounts, setStudentCounts] = useState({});

  useEffect(() => {
    fetchClassesData();
  }, []);

  const fetchClassesData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single();

      if (!profile) return;

      const schoolId = profile.school_id;

      // Récupérer les données de l'école
      const { data: schoolData } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      setSchool(schoolData);

      // Récupérer les classes
      const { data: classesData, error } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', schoolId)
        .order('name');

      if (error) throw error;

      setClasses(classesData || []);

      // Récupérer le nombre d'étudiants par classe
      const studentCountsMap = {};
      for (const classItem of classesData || []) {
        const { data: students } = await supabase
          .from('students')
          .select('id')
          .eq('class_id', classItem.id);
        
        studentCountsMap[classItem.id] = students?.length || 0;
      }

      setStudentCounts(studentCountsMap);
      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = 
      classItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.level?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = levelFilter === "" || classItem.level === levelFilter;

    return matchesSearch && matchesLevel;
  });

  const handleDeleteClass = async (classId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette classe ? Les étudiants de cette classe seront désaffectés.")) {
      return;
    }

    try {
      // Désaffecter les étudiants de cette classe
      const { error: updateError } = await supabase
        .from('students')
        .update({ class_id: null })
        .eq('class_id', classId);

      if (updateError) throw updateError;

      // Supprimer la classe
      const { error: deleteError } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (deleteError) throw deleteError;

      // Mettre à jour la liste des classes
      setClasses(classes.filter(classItem => classItem.id !== classId));
      alert("Classe supprimée avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression de la classe");
    }
  };

  const getLevels = () => {
    const levels = [...new Set(classes.map(classItem => classItem.level).filter(Boolean))];
    return levels.sort();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Classes</h1>
            <p className="text-gray-600 mt-2">
              {school?.name || "École"} - {classes.length} classe(s) créée(s)
            </p>
          </div>
          <Link
            href="/dashboard/director/classes/add"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
            Créer une classe
          </Link>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Barre de recherche */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher une classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtre par niveau */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faFilter} className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les niveaux</option>
              {getLevels().map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton d'export */}
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center">
            <FontAwesomeIcon icon={faDownload} className="h-4 w-4 mr-2" />
            Exporter la liste
          </button>
        </div>
      </div>

      {/* Cartes des classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredClasses.length > 0 ? (
          filteredClasses.map((classItem) => (
            <div key={classItem.id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{classItem.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {classItem.level || "Niveau non défini"}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <FontAwesomeIcon icon={faUserGraduate} className="h-4 w-4 mr-2 text-green-500" />
                    <span>{studentCounts[classItem.id] || 0} étudiant(s)</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FontAwesomeIcon icon={faChalkboardTeacher} className="h-4 w-4 mr-2 text-purple-500" />
                    <span>Enseignants: À assigner</span>
                  </div>

                  <div className="text-xs text-gray-500">
                    Créée le {new Date(classItem.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <Link
                    href={`/dashboard/director/classes/${classItem.id}/students`}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    Voir les étudiants
                  </Link>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/dashboard/director/classes/${classItem.id}`}
                      className="text-blue-600 hover:text-blue-900"
                      title="Voir les détails"
                    >
                      <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/dashboard/director/classes/${classItem.id}/edit`}
                      className="text-green-600 hover:text-green-900"
                      title="Modifier"
                    >
                      <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteClass(classItem.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Supprimer"
                    >
                      <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FontAwesomeIcon icon={faUsers} className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune classe trouvée</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || levelFilter ? "Aucune classe ne correspond aux critères de recherche." : "Commencez par créer votre première classe."}
            </p>
            {!searchTerm && !levelFilter && (
              <div className="mt-6">
                <Link
                  href="/dashboard/director/classes/add"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
                  Créer une classe
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vue tableau (alternative) */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Liste des Classes</h3>
          <p className="mt-1 text-sm text-gray-500">
            Vue détaillée de toutes les classes avec leurs statistiques
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classe
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Niveau
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Étudiants
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de création
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClasses.map((classItem) => (
                <tr key={classItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {classItem.level || "Non défini"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faUserGraduate} className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm text-gray-900">{studentCounts[classItem.id] || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(classItem.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/dashboard/director/classes/${classItem.id}/students`}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Étudiants
                      </Link>
                      <Link
                        href={`/dashboard/director/classes/${classItem.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir les détails"
                      >
                        <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/dashboard/director/classes/${classItem.id}/edit`}
                        className="text-green-600 hover:text-green-900"
                        title="Modifier"
                      >
                        <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClass(classItem.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total classes</dt>
                  <dd className="text-lg font-medium text-gray-900">{classes.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUserGraduate} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total étudiants</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Object.values(studentCounts).reduce((sum, count) => sum + count, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Moyenne par classe</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {classes.length > 0 
                      ? Math.round(Object.values(studentCounts).reduce((sum, count) => sum + count, 0) / classes.length)
                      : 0
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Niveaux différents</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {getLevels().length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}