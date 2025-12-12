"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faFileDownload,
  faSpinner,
  faSchool,
  faUsers,
  faUserGraduate
} from '@fortawesome/free-solid-svg-icons'

export default function GenerateBulletinsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [school, setSchool] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [filterType, setFilterType] = useState('student'); // 'student', 'class', 'school'
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [semester, setSemester] = useState('1');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Get supervisor's school
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single();

      if (!profile?.school_id) return;

      // Fetch school info
      const { data: schoolData } = await supabase
        .from('schools')
        .select('*')
        .eq('id', profile.school_id)
        .single();

      setSchool(schoolData);

      // Fetch classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', profile.school_id)
        .order('name');

      setClasses(classesData || []);

      // Fetch all students in school
      const { data: studentsData } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          matricule,
          class_id
        `)
        .eq('role', 'student')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false });

      setStudents(studentsData || []);
      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  // Filter students based on selected class
  const filteredStudents = selectedClass
    ? students.filter(s => s.id === selectedClass)
    : students;

  const handleGenerateBulletins = async () => {
    if (filterType === 'student' && !selectedStudent) {
      alert('Veuillez sélectionner un élève');
      return;
    }
    if (filterType === 'class' && !selectedClass) {
      alert('Veuillez sélectionner une classe');
      return;
    }

    setGenerating(true);

    try {
      let filterId = null;

      if (filterType === 'student') {
        filterId = selectedStudent;
      } else if (filterType === 'class') {
        filterId = selectedClass;
      } else if (filterType === 'school') {
        filterId = school.id;
      }

      const response = await fetch('/api/bulletins/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filter_type: filterType,
          filter_id: filterId,
          semester: semester,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération');
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulletins_${filterType}_s${semester}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('Bulletins générés avec succès!');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la génération des bulletins');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <FontAwesomeIcon icon={faFileDownload} />
          Génération de Bulletins
        </h1>
        <p className="text-gray-600">École: {school?.name}</p>
      </div>

      {/* Filter Type Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">1. Sélectionner le type de génération</h2>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Student Option */}
          <div
            onClick={() => setFilterType('student')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
              filterType === 'student'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faUserGraduate} className="text-2xl mb-2 text-blue-600" />
            <h3 className="font-bold">Par Élève</h3>
            <p className="text-sm text-gray-600">Un bulletin pour un élève</p>
          </div>

          {/* Class Option */}
          <div
            onClick={() => setFilterType('class')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
              filterType === 'class'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faUsers} className="text-2xl mb-2 text-green-600" />
            <h3 className="font-bold">Par Classe</h3>
            <p className="text-sm text-gray-600">Bulletins pour toute la classe</p>
          </div>

          {/* School Option */}
          <div
            onClick={() => setFilterType('school')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
              filterType === 'school'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faSchool} className="text-2xl mb-2 text-purple-600" />
            <h3 className="font-bold">Par École</h3>
            <p className="text-sm text-gray-600">Bulletins pour toute l'école</p>
          </div>
        </div>
      </div>

      {/* Selection Inputs */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">2. Sélectionner le filtre</h2>

        {filterType === 'student' && (
          <div>
            <label className="block font-semibold mb-2">Élève</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Sélectionner un élève --</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.profiles?.first_name} {student.profiles?.last_name} ({student.classes?.name})
                </option>
              ))}
            </select>
          </div>
        )}

        {filterType === 'class' && (
          <div>
            <label className="block font-semibold mb-2">Classe</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Sélectionner une classe --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {filterType === 'school' && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded">
            <p className="font-semibold text-purple-900">
              ✓ Bulletin pour toute l'école: {school?.name}
            </p>
          </div>
        )}
      </div>

      {/* Semester Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">3. Sélectionner le semestre</h2>

        <div className="grid grid-cols-2 gap-4">
          {['1', '2'].map(sem => (
            <div
              key={sem}
              onClick={() => setSemester(sem)}
              className={`p-4 border-2 rounded-lg cursor-pointer text-center transition ${
                semester === sem
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="text-lg font-bold">Semestre {sem}</h3>
              {sem === '2' && (
                <p className="text-sm text-gray-600">(Moyenne annuelle incluse)</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex gap-4">
        <button
          onClick={handleGenerateBulletins}
          disabled={generating}
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faFileDownload} />
              Générer et Télécharger PDF
            </>
          )}
        </button>

        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-300 text-gray-700 font-bold rounded hover:bg-gray-400"
        >
          Retour
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-bold text-blue-900 mb-2">ℹ️ Information</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Les bulletins sont générés au format PDF</li>
          <li>✓ Chaque élève a une page unique</li>
          <li>✓ Les moyennes sont calculées automatiquement</li>
          <li>✓ Pour le semestre 2, la moyenne annuelle est incluse</li>
          <li>✓ Téléchargement direct du fichier PDF</li>
        </ul>
      </div>
    </div>
  );
}
