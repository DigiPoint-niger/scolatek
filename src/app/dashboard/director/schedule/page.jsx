// /dashboard/director/schedule/page.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCalendarAlt,
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faFilter,
  faClock,
  faUsers,
  faChalkboardTeacher,
  faMapMarkerAlt,
  faBook
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function DirectorSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [school, setSchool] = useState(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [viewMode, setViewMode] = useState("weekly");

  const daysOfWeek = [
    { id: 1, name: "Lundi", short: "LUN" },
    { id: 2, name: "Mardi", short: "MAR" },
    { id: 3, name: "Mercredi", short: "MER" },
    { id: 4, name: "Jeudi", short: "JEU" },
    { id: 5, name: "Vendredi", short: "VEN" },
    { id: 6, name: "Samedi", short: "SAM" }
  ];

  const timeSlots = [
    "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
    "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00",
    "16:00-17:00", "17:00-18:00"
  ];

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const fetchScheduleData = async () => {
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
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name, level')
        .eq('school_id', schoolId)
        .order('name');

      setClasses(classesData || []);

      // Récupérer les enseignants
      const { data: teachersData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, subject')
        .eq('role', 'teacher')
        .eq('school_id', schoolId)
        .order('first_name');

      setTeachers(teachersData || []);

      // Récupérer les matières
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('school_id', schoolId)
        .order('name');

      setSubjects(subjectsData || []);

      // Générer l'emploi du temps avec les matières réelles
      const mockSchedule = generateMockSchedule(classesData || [], teachersData || [], subjectsData || []);
      setSchedule(mockSchedule);

      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  // Fonction pour générer des données d'emploi du temps avec les matières réelles
  const generateMockSchedule = (classes, teachers, subjects) => {
    if (subjects.length === 0) return [];

    const schedule = [];

    classes.forEach(classItem => {
      daysOfWeek.forEach(day => {
        // Générer 4-6 cours par jour
        const coursesPerDay = 4 + Math.floor(Math.random() * 3);
        const usedTimeSlots = new Set();

        for (let i = 0; i < coursesPerDay; i++) {
          let timeSlot;
          do {
            timeSlot = timeSlots[Math.floor(Math.random() * (timeSlots.length - 3))];
          } while (usedTimeSlots.has(timeSlot));
          
          usedTimeSlots.add(timeSlot);

          const teacher = teachers[Math.floor(Math.random() * teachers.length)];
          const subject = subjects[Math.floor(Math.random() * subjects.length)];

          schedule.push({
            id: `${classItem.id}-${day.id}-${i}`,
            class_id: classItem.id,
            class_name: classItem.name,
            day_of_week: day.id,
            day_name: day.name,
            time_slot: timeSlot,
            subject_id: subject.id,
            subject_name: subject.name,
            teacher_id: teacher?.id,
            teacher_name: teacher ? `${teacher.profiles.first_name} ${teacher.profiles.last_name}` : "Non assigné",
            room: `Salle ${Math.floor(Math.random() * 20) + 1}`
          });
        }
      });
    });

    return schedule;
  };

  const filteredSchedule = schedule.filter(course => {
    const matchesClass = selectedClass === "" || course.class_id === selectedClass;
    const matchesDay = selectedDay === "" || course.day_of_week === parseInt(selectedDay);
    return matchesClass && matchesDay;
  });

  const getCoursesForDayAndTime = (classId, dayId, timeSlot) => {
    return filteredSchedule.filter(course => 
      course.class_id === classId && 
      course.day_of_week === dayId && 
      course.time_slot === timeSlot
    );
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce cours ?")) {
      return;
    }

    try {
      setSchedule(schedule.filter(course => course.id !== courseId));
      alert("Cours supprimé avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression du cours");
    }
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
      {/* En-tête avec navigation vers les matières */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Emploi du Temps</h1>
            <p className="text-gray-600 mt-2">
              {school?.name || "École"} - Gestion des plannings des classes
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/dashboard/director/subjects"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
            >
              <FontAwesomeIcon icon={faBook} className="h-4 w-4 mr-2" />
              Gérer les matières
            </Link>
            <Link
              href="/dashboard/director/schedule/add"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
              Ajouter un cours
            </Link>
          </div>
        </div>
      </div>

      {/* Filtres et contrôles */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Sélection de la classe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Classe
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les classes</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sélection du jour */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jour
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les jours</option>
              {daysOfWeek.map((day) => (
                <option key={day.id} value={day.id}>
                  {day.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode d'affichage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vue
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="weekly">Hebdomadaire</option>
              <option value="daily">Quotidienne</option>
              <option value="class">Par classe</option>
            </select>
          </div>

          {/* Bouton d'export */}
          <div className="flex items-end">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center w-full justify-center">
              <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Avertissement si pas de matières */}
      {subjects.length === 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faBook} className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Aucune matière définie
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Vous devez d'abord créer des matières avant de pouvoir planifier des cours.
                </p>
                <Link
                  href="/dashboard/director/subjects/add"
                  className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-100 hover:bg-yellow-200"
                >
                  Créer une matière
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vue Hebdomadaire */}
      {viewMode === "weekly" && (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Emploi du Temps Hebdomadaire
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Vue d'ensemble de tous les cours de la semaine
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horaires / Classes
                  </th>
                  {daysOfWeek.map(day => (
                    <th key={day.id} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {day.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeSlots.map(timeSlot => (
                  <tr key={timeSlot} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                      {timeSlot}
                    </td>
                    {daysOfWeek.map(day => {
                      const classCourses = {};
                      classes.forEach(classItem => {
                        const courses = getCoursesForDayAndTime(classItem.id, day.id, timeSlot);
                        if (courses.length > 0) {
                          classCourses[classItem.name] = courses[0];
                        }
                      });

                      return (
                        <td key={day.id} className="px-2 py-2 align-top">
                          <div className="space-y-1 min-h-[80px]">
                            {Object.entries(classCourses).map(([className, course]) => (
                              <div
                                key={course.id}
                                className="bg-blue-50 border border-blue-200 rounded p-2 text-xs hover:bg-blue-100 cursor-pointer"
                                title={`${course.subject_name} - ${course.teacher_name} - ${course.room}`}
                              >
                                <div className="font-medium text-blue-800 truncate">
                                  {className}
                                </div>
                                <div className="text-blue-600 truncate">
                                  {course.subject_name}
                                </div>
                                <div className="text-blue-500 text-xs truncate">
                                  {course.teacher_name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vue par Classe */}
      {viewMode === "class" && (
        <div className="space-y-6">
          {classes.map(classItem => (
            <div key={classItem.id} className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Emploi du temps - {classItem.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Planning hebdomadaire de la classe {classItem.name}
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Horaire
                      </th>
                      {daysOfWeek.map(day => (
                        <th key={day.id} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {day.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeSlots.map(timeSlot => (
                      <tr key={timeSlot} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                          {timeSlot}
                        </td>
                        {daysOfWeek.map(day => {
                          const courses = getCoursesForDayAndTime(classItem.id, day.id, timeSlot);
                          
                          return (
                            <td key={day.id} className="px-2 py-2 align-top">
                              {courses.map(course => (
                                <div
                                  key={course.id}
                                  className="bg-green-50 border border-green-200 rounded p-2 text-xs hover:bg-green-100 cursor-pointer group relative"
                                >
                                  <div className="font-medium text-green-800">
                                    {course.subject_name}
                                  </div>
                                  <div className="text-green-600 text-xs">
                                    {course.teacher_name}
                                  </div>
                                  <div className="text-green-500 text-xs flex items-center">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="h-3 w-3 mr-1" />
                                    {course.room}
                                  </div>
                                  
                                  {/* Actions au survol */}
                                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                    <Link
                                      href={`/dashboard/director/schedule/${course.id}/edit`}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Modifier"
                                    >
                                      <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
                                    </Link>
                                    <button
                                      onClick={() => handleDeleteCourse(course.id)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Supprimer"
                                    >
                                      <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vue Quotidienne */}
      {viewMode === "daily" && selectedDay && (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Emploi du Temps - {daysOfWeek.find(d => d.id === parseInt(selectedDay))?.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Planning détaillé pour la journée sélectionnée
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horaire
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classe
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matière
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enseignant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salle
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSchedule
                  .sort((a, b) => timeSlots.indexOf(a.time_slot) - timeSlots.indexOf(b.time_slot))
                  .map(course => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {course.time_slot}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.class_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.subject_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.teacher_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.room}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/dashboard/director/schedule/${course.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faCalendarAlt} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total cours</dt>
                  <dd className="text-lg font-medium text-gray-900">{schedule.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Classes actives</dt>
                  <dd className="text-lg font-medium text-gray-900">{classes.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <FontAwesomeIcon icon={faChalkboardTeacher} className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Enseignants</dt>
                  <dd className="text-lg font-medium text-gray-900">{teachers.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Créneaux/jour</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {classes.length > 0 ? Math.round(schedule.length / (classes.length * 6)) : 0}
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