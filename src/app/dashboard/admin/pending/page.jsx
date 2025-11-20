"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCheckCircle, 
  faTimesCircle, 
  faEye,
  faClock,
  faUser,
  faSchool,
  faEnvelope,
  faPhone,
  faCalendar
} from '@fortawesome/free-solid-svg-icons'

export default function PendingPage() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          schools (
            name,
            email,
            is_active
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error);
      alert("Erreur lors du chargement des demandes en attente");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, isDirector = false, schoolId = null) => {
    setProcessing(userId);
    
    try {
      // Activer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          status: 'active'
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Si c'est un directeur, activer aussi son école
      if (isDirector && schoolId) {
        const { error: schoolError } = await supabase
          .from('schools')
          .update({ is_active: true })
          .eq('id', schoolId);

        if (schoolError) throw schoolError;
      }

      // Créer l'entrée dans la table spécifique au rôle
      await createRoleSpecificEntry(userId);

      // Recharger les demandes
      await fetchPendingRequests();
      alert("Demande approuvée avec succès !");
      
    } catch (error) {
      console.error("Erreur lors de l'approbation:", error);
      alert(`Erreur lors de l'approbation: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const createRoleSpecificEntry = async (profileId) => {
    try {
      // Récupérer le rôle du profil
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, school_id')
        .eq('id', profileId)
        .single();

      if (error) throw error;

      const { role, school_id } = profile;
      let tableName = '';
      
      // Déterminer la table cible selon le rôle
      switch (role) {
        case 'teacher':
          tableName = 'teachers';
          break;
        case 'student':
          tableName = 'students';
          break;
        case 'parent':
          tableName = 'parents';
          break;
        case 'accountant':
          tableName = 'accountants';
          break;
        case 'supervisor':
          tableName = 'supervisors';
          break;
        case 'director':
          // Les directeurs n'ont pas de table spécifique dans votre schéma
          return;
        default:
          console.warn(`Rôle non géré: ${role}`);
          return;
      }

      // Vérifier si l'entrée existe déjà
      const { data: existingEntry, error: checkError } = await supabase
        .from(tableName)
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Créer l'entrée si elle n'existe pas
      if (!existingEntry) {
        const { error: insertError } = await supabase
          .from(tableName)
          .insert({
            profile_id: profileId,
            school_id: school_id
          });

        if (insertError) {
          // Si l'erreur est due à une violation de contrainte, c'est probablement normal
          if (insertError.code !== '23505') { // Code pour violation de contrainte unique
            throw insertError;
          }
        }
      }

    } catch (error) {
      console.error(`Erreur lors de la création de l'entrée spécifique au rôle:`, error);
      // Ne pas bloquer le processus principal pour cette erreur
    }
  };

  const handleReject = async (userId) => {
    if (!confirm("Êtes-vous sûr de vouloir rejeter cette demande ? Cette action est irréversible.")) {
      return;
    }

    setProcessing(userId);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'rejected'
        })
        .eq('id', userId);

      if (error) throw error;
      
      // Recharger les demandes
      await fetchPendingRequests();
      alert("Demande rejetée avec succès !");
      
    } catch (error) {
      console.error("Erreur lors du rejet:", error);
      alert("Erreur lors du rejet de la demande");
    } finally {
      setProcessing(null);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'admin': 'Administrateur',
      'director': 'Directeur',
      'teacher': 'Enseignant',
      'student': 'Étudiant',
      'parent': 'Parent',
      'supervisor': 'Superviseur',
      'accountant': 'Comptable'
    };
    return roleNames[role] || role;
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'director': return faUser;
      case 'teacher': return faUser;
      case 'student': return faUser;
      case 'parent': return faUser;
      case 'supervisor': return faUser;
      case 'accountant': return faUser;
      default: return faUser;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Chargement des demandes...</p>
      </div>
    );
  }

  return (
    <div>
      {/* En-tête de page */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Demandes en Attente</h1>
        <p className="text-gray-600">
          {pendingRequests.length} demande(s) en attente de validation
        </p>
      </div>

      {/* Liste des demandes */}
      <div className="grid gap-6">
        {pendingRequests.map((request) => (
          <div key={request.id} className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={getRoleIcon(request.role)} className="text-blue-600 text-lg" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {request.first_name} {request.last_name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Rôle: <span className="font-medium capitalize">{getRoleDisplayName(request.role)}</span>
                  </p>
                  {request.schools && (
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <FontAwesomeIcon icon={faSchool} className="mr-2 text-gray-400" />
                      École: {request.schools.name}
                      {request.schools.is_active ? (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                      ) : (
                        <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">En attente</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <FontAwesomeIcon icon={faClock} className="mr-2" />
                  En attente
                </span>
              </div>
            </div>
            
            <div className="border-t border-gray-200">
              <dl className="divide-y divide-gray-200">
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-gray-400" />
                    Email
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {request.email}
                  </dd>
                </div>
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FontAwesomeIcon icon={faPhone} className="mr-2 text-gray-400" />
                    Téléphone
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {request.phone || 'Non renseigné'}
                  </dd>
                </div>
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FontAwesomeIcon icon={faCalendar} className="mr-2 text-gray-400" />
                    Date de demande
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(request.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end space-x-3">
              <button
                onClick={() => handleReject(request.id)}
                disabled={processing === request.id}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon 
                  icon={processing === request.id ? faClock : faTimesCircle} 
                  className={`mr-2 ${processing === request.id ? 'animate-spin' : 'text-red-600'}`} 
                />
                {processing === request.id ? 'Traitement...' : 'Rejeter'}
              </button>
              <button
                onClick={() => handleApprove(request.id, request.role === 'director', request.school_id)}
                disabled={processing === request.id}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon 
                  icon={processing === request.id ? faClock : faCheckCircle} 
                  className={`mr-2 ${processing === request.id ? 'animate-spin' : ''}`} 
                />
                {processing === request.id ? 'Traitement...' : 'Approuver'}
              </button>
            </div>
          </div>
        ))}

        {pendingRequests.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow border border-gray-200">
            <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-5xl mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Aucune demande en attente</h3>
            <p className="text-gray-500 mb-4">Toutes les demandes ont été traitées.</p>
            <button 
              onClick={fetchPendingRequests}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FontAwesomeIcon icon={faEye} className="mr-2" />
              Actualiser
            </button>
          </div>
        )}
      </div>

      {/* Statistiques rapides */}
      {pendingRequests.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total en attente</dt>
                    <dd className="text-lg font-medium text-gray-900">{pendingRequests.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <FontAwesomeIcon icon={faUser} className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Directeurs</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pendingRequests.filter(req => req.role === 'director').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <FontAwesomeIcon icon={faUser} className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Enseignants</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pendingRequests.filter(req => req.role === 'teacher').length}
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
                  <FontAwesomeIcon icon={faUser} className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Autres rôles</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pendingRequests.filter(req => !['director', 'teacher'].includes(req.role)).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}