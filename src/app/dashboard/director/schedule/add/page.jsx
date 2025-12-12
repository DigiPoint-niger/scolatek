// /dashboard/director/schedule/add/page.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCalendarAlt,
  faArrowLeft,
  faSave,
  faBook
} from '@fortawesome/free-solid-svg-icons'
import Link from "next/link";

export default function AddSchedule() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    class_id: "",
    teacher_id: "",
    subject_id: "",
    day_of_week: "1",
    time_slot: "08:00-09:00",
    room: ""
  });

  const daysOfWeek = [
    { id: 1, name: "Lundi" },
    { id: 2, name: "Mardi" },
    { id: 3, name: "Mercredi" },
    { id: 4, name: "Jeudi" },
    { id: 5, name: "Vendredi" },
    { id: 6, name: "Samedi" }
  ];

  const timeSlots = [
    "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
    "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00",
    "16:00-17:00", "17:00-18:00"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single();

      if (!profile) return;

      // Récupérer les classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name, level')
        .eq('school_id', profile.school_id)
        .order('name');

      setClasses(classesData || []);

      // Récupérer les enseignants
      const { data: teachersData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, subject')
        .eq('role', 'teacher')
        .eq('school_id', profile.school_id)
        .order('first_name');

      setTeachers(teachersData || []);

      // Récupérer les matières
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('name');

      setSubjects(subjectsData || []);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single();

      if (!profile) return;

      // Simulation d'ajout de cours
      alert("Cours ajouté avec succès !");
      router.push("/dashboard/director/schedule");

    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'ajout du cours");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div>
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard/director/schedule"
              className="text-blue-600 hover:text-blue-900 mb-4 inline-flex items-center"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
              Retour à l'emploi du temps
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Ajouter un Cours</h1>
            <p className="text-gray-600 mt-2">
              Planifier un nouveau cours dans l'emploi du temps
            </p>
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
                Aucune matière disponible
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

      {/* Formulaire */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Classe */}
              <div>
                <label htmlFor="class_id" className="block text-sm font-medium text-gray-700">
                  Classe *
                </label>
                <select
                  id="class_id"
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name} {classItem.level && `- ${classItem.level}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Enseignant */}
              <div>
                <label htmlFor="teacher_id" className="block text-sm font-medium text-gray-700">
                  Enseignant *
                </label>
                <select
                  id="teacher_id"
                  name="teacher_id"
                  value={formData.teacher_id}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner un enseignant</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                      {teacher.subject && ` - ${teacher.subject}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Matière */}
              <div>
                <label htmlFor="subject_id" className="block text-sm font-medium text-gray-700">
                  Matière *
                </label>
                <select
                  id="subject_id"
                  name="subject_id"
                  value={formData.subject_id}
                  onChange={handleChange}
                  required
                  disabled={subjects.length === 0}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="">Sélectionner une matière</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                      {subject.code && ` (${subject.code})`}
                    </option>
                  ))}
                </select>
                {subjects.length === 0 && (
                  <p className="mt-1 text-sm text-red-600">
                    Aucune matière disponible. Veuillez d'abord créer des matières.
                  </p>
                )}
              </div>

              {/* Jour de la semaine */}
              <div>
                <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700">
                  Jour de la semaine *
                </label>
                <select
                  id="day_of_week"
                  name="day_of_week"
                  value={formData.day_of_week}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day.id} value={day.id}>
                      {day.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Créneau horaire */}
              <div>
                <label htmlFor="time_slot" className="block text-sm font-medium text-gray-700">
                  Créneau horaire *
                </label>
                <select
                  id="time_slot"
                  name="time_slot"
                  value={formData.time_slot}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              {/* Salle */}
              <div>
                <label htmlFor="room" className="block text-sm font-medium text-gray-700">
                  Salle
                </label>
                <input
                  type="text"
                  id="room"
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  placeholder="Ex: Salle 12, Labo de Physique..."
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-3 bg-gray-50 text-right rounded-b-lg">
            <button
              type="submit"
              disabled={loading || subjects.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <FontAwesomeIcon icon={faSave} className="h-4 w-4 mr-2" />
              {loading ? "Ajout..." : "Ajouter le cours"}
            </button>
          </div>
        </form>
      </div>

      {/* Information */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Bonnes pratiques
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Vérifiez les disponibilités des salles et des enseignants</li>
                <li>Évitez les chevauchements de cours pour une même classe</li>
                <li>Respectez les pauses entre les cours</li>
                <li>Consultez les préférences des enseignants pour certains créneaux</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}