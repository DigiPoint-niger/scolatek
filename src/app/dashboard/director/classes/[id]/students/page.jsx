// /dashboard/director/classes/[id]/students/page.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUserGraduate,
  faArrowLeft,
  faPlus,
  faTrash,
  faUsers
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function ClassStudents() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id;
  
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const fetchClassData = async () => {
    try {
      // Récupérer les informations de la classe
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (classError) throw classError;
      setClassInfo(classData);

      // Récupérer les étudiants de cette classe
      const { data: classStudents, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          matricule,
          profiles!inner(
            first_name,
            last_name,
            phone
          )
        `)
        .eq('class_id', classId)
        .order('created_at');

      if (studentsError) throw studentsError;
      setStudents(classStudents || []);

      // Récupérer les étudiants sans classe
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        const { data: unassignedStudents, error: unassignedError } = await supabase
          .from('students')
          .select(`
            id,
            matricule,
            profiles!inner(
              first_name,
              last_name
            )
          `)
          .eq('school_id', profile.school_id)
          .is('class_id', null)
          .order('created_at');

        if (unassignedError) throw unassignedError;
        setAvailableStudents(unassignedStudents || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  const assignStudentToClass = async (studentId) => {
    setAssigning(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ class_id: classId })
        .eq('id', studentId);

      if (error) throw error;

      // Recharger les données
      await fetchClassData();
      alert("Étudiant assigné à la classe avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'assignation de l'étudiant");
    } finally {
      setAssigning(false);
    }
  };

  const removeStudentFromClass = async (studentId) => {
    if (!confirm("Retirer cet étudiant de la classe ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .update({ class_id: null })
        .eq('id', studentId);

      if (error) throw error;

      // Recharger les données
      await fetchClassData();
      alert("Étudiant retiré de la classe avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du retrait de l'étudiant");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="text-center py-12">
        <FontAwesomeIcon icon={faUsers} className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Classe non trouvée</h3>
        <p className="mt-1 text-sm text-gray-500">
          La classe que vous recherchez n'existe pas.
        </p>
        <Link
          href="/dashboard/director/classes"
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
          Retour aux classes
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard/director/classes"
              className="text-blue-600 hover:text-blue-900 mb-4 inline-flex items-center"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
              Retour aux classes
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Étudiants de {classInfo.name}
            </h1>
            <p className="text-gray-600 mt-2">
              {classInfo.level ? `Niveau: ${classInfo.level} • ` : ""}
              {students.length} étudiant(s) dans cette classe
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Étudiants assignés */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Étudiants dans la classe
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Liste des étudiants actuellement assignés à cette classe
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {students.length > 0 ? (
              students.map((student) => (
                <div key={student.id} className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {student.profiles.first_name?.[0]}{student.profiles.last_name?.[0]}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {student.profiles.first_name} {student.profiles.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.matricule || "Sans matricule"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeStudentFromClass(student.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Retirer de la classe"
                  >
                    <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="px-4 py-12 text-center">
                <FontAwesomeIcon icon={faUserGraduate} className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun étudiant</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Aucun étudiant n'est assigné à cette classe pour le moment.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Étudiants disponibles */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Étudiants disponibles
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Étudiants sans classe assignée
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {availableStudents.length > 0 ? (
              availableStudents.map((student) => (
                <div key={student.id} className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                      {student.profiles.first_name?.[0]}{student.profiles.last_name?.[0]}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {student.profiles.first_name} {student.profiles.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.matricule || "Sans matricule"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => assignStudentToClass(student.id)}
                    disabled={assigning}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    <FontAwesomeIcon icon={faPlus} className="h-3 w-3 mr-1" />
                    Assigner
                  </button>
                </div>
              ))
            ) : (
              <div className="px-4 py-12 text-center">
                <FontAwesomeIcon icon={faUserGraduate} className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun étudiant disponible</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tous les étudiants ont déjà une classe assignée.
                </p>
                <Link
                  href="/dashboard/director/students/add"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
                  Ajouter un étudiant
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}