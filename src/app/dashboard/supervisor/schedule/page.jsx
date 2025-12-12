"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarAlt, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'

export default function SupervisorSchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, days: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ class_id: "", day: "", start_time: "", end_time: "", subject_id: "", teacher_profile_id: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', session.user.id)
          .single();

        if (!profile?.school_id) {
          setLoading(false);
          return;
        }

        // Récupérer les emplois du temps
        const { data: schedulesData } = await supabase
          .from('schedules')
          .select('*')
          .order('day, start_time');
        
        // Récupérer les classes
        const { data: classesData } = await supabase
          .from('classes')
          .select('id, name')
          .eq('school_id', profile.school_id)
          .order('name');

        // Récupérer les enseignants
        const { data: teachersData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('role', 'teacher')
          .eq('school_id', profile.school_id)
          .order('first_name');

        // Récupérer les matières
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('id, name')
          .eq('school_id', profile.school_id)
          .order('name');

        const data = schedulesData || [];
        const uniqueDays = new Set(data.map(s => s.day)).size;
        
        setSchedules(data);
        setClasses(classesData || []);
        setTeachers(teachersData || []);
        setSubjects(subjectsData || []);
        setStats({ total: data.length, days: uniqueDays });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('schedules')
        .insert({
          class_id: formData.class_id,
          day: formData.day,
          start_time: formData.start_time,
          end_time: formData.end_time,
          subject_id: formData.subject_id,
          teacher_profile_id: formData.teacher_profile_id
        });
      if (!error) {
        setShowModal(false);
        setFormData({ class_id: "", day: "", start_time: "", end_time: "", subject_id: "", teacher_profile_id: "" });
        window.location.reload();
      } else {
        alert('Erreur lors de l\'ajout du créneau');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de l\'ajout');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (confirm('Êtes-vous sûr?')) {
      await supabase.from('schedules').delete().eq('id', id);
      window.location.reload();
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
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Modifier les emplois du temps</h1>
        <p className="text-gray-600 mt-2">Gestion des horaires de classes</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FontAwesomeIcon icon={faCalendarAlt} className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total créneaux</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <FontAwesomeIcon icon={faCalendarAlt} className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Jours couverts</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.days}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton ajouter */}
      <div className="mb-8">
        <button 
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" /> Ajouter un créneau
        </button>
      </div>

      {/* Modal d'ajout */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Ajouter un créneau</h3>
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classe *</label>
                <select 
                  value={formData.class_id} 
                  onChange={e => setFormData({ ...formData, class_id: e.target.value })} 
                  className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  required 
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jour *</label>
                <select 
                  value={formData.day} 
                  onChange={e => setFormData({ ...formData, day: e.target.value })} 
                  className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  required 
                >
                  <option value="">Sélectionner un jour</option>
                  <option value="Lundi">Lundi</option>
                  <option value="Mardi">Mardi</option>
                  <option value="Mercredi">Mercredi</option>
                  <option value="Jeudi">Jeudi</option>
                  <option value="Vendredi">Vendredi</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure début *</label>
                  <input 
                    type="time" 
                    value={formData.start_time} 
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })} 
                    className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin *</label>
                  <input 
                    type="time" 
                    value={formData.end_time} 
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })} 
                    className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matière *</label>
                <select 
                  value={formData.subject_id} 
                  onChange={e => setFormData({ ...formData, subject_id: e.target.value })} 
                  className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  required 
                >
                  <option value="">Sélectionner une matière</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enseignant *</label>
                <select 
                  value={formData.teacher_profile_id} 
                  onChange={e => setFormData({ ...formData, teacher_profile_id: e.target.value })} 
                  className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  required 
                >
                  <option value="">Sélectionner un enseignant</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.first_name} {teacher.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50" 
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tableau des emplois du temps */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Emplois du temps ({schedules.length})</h3>
        </div>
        <div className="border-t border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horaire</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matière</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enseignant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.class_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.day}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.start_time} - {item.end_time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.teacher}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => handleDeleteSchedule(item.id)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FontAwesomeIcon icon={faTrash} /> Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
