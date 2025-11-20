"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faSearch, 
  faPlus, 
  faEdit, 
  faTrash, 
  faEye,
  faCheckCircle,
  faTimesCircle,
  faFilter,
  faSchool,
  faSave,
  faTimes,
  faUser
} from '@fortawesome/free-solid-svg-icons'

export default function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [directors, setDirectors] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    director_id: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [operationLoading, setOperationLoading] = useState(false);

  useEffect(() => {
    fetchSchools();
    fetchDirectors();
  }, []);

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select(`
          *,
          profiles!inner (
            id,
            first_name,
            last_name,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du chargement des écoles");
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('role', 'director')
        .eq('status', 'active');

      if (error) throw error;
      setDirectors(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des directeurs:", error);
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // VALIDATION DU FORMULAIRE
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Le nom de l'école est requis";
    }
    
    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Format d'email invalide";
    }
    
    if (!formData.phone.trim()) {
      errors.phone = "Le téléphone est requis";
    }
    
    if (!formData.address.trim()) {
      errors.address = "L'adresse est requise";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // CRÉATION D'UNE ÉCOLE
  const handleCreateSchool = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setOperationLoading(true);
    try {
      const { data, error } = await supabase
        .from('schools')
        .insert([
          {
            name: formData.name,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Si un directeur est sélectionné, l'associer à l'école
      if (formData.director_id) {
        await supabase
          .from('profiles')
          .update({ school_id: data.id })
          .eq('id', formData.director_id);
      }

      alert("École créée avec succès !");
      setShowCreateModal(false);
      resetForm();
      fetchSchools(); // Recharger la liste
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la création de l'école");
    } finally {
      setOperationLoading(false);
    }
  };

  // MODIFICATION D'UNE ÉCOLE
  const handleEditSchool = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setOperationLoading(true);
    try {
      const { error } = await supabase
        .from('schools')
        .update({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email
        })
        .eq('id', selectedSchool.id);

      if (error) throw error;

      // Mettre à jour l'association du directeur si changée
      if (formData.director_id !== selectedSchool.director_id) {
        // Retirer l'ancien directeur s'il existe
        if (selectedSchool.director_id) {
          await supabase
            .from('profiles')
            .update({ school_id: null })
            .eq('id', selectedSchool.director_id);
        }

        // Assigner le nouveau directeur
        if (formData.director_id) {
          await supabase
            .from('profiles')
            .update({ school_id: selectedSchool.id })
            .eq('id', formData.director_id);
        }
      }

      alert("École modifiée avec succès !");
      setShowEditModal(false);
      resetForm();
      fetchSchools(); // Recharger la liste
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la modification de l'école");
    } finally {
      setOperationLoading(false);
    }
  };

  // SUPPRESSION D'UNE ÉCOLE
  const handleDeleteSchool = async () => {
    setOperationLoading(true);
    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', selectedSchool.id);

      if (error) throw error;

      alert("École supprimée avec succès !");
      setShowDeleteModal(false);
      fetchSchools(); // Recharger la liste
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la suppression de l'école");
    } finally {
      setOperationLoading(false);
    }
  };

  // ACTIVATION/DÉSACTIVATION D'UNE ÉCOLE
  const toggleSchoolStatus = async (schoolId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('schools')
        .update({ is_active: !currentStatus })
        .eq('id', schoolId);

      if (error) throw error;
      
      // Mettre à jour l'état local
      setSchools(schools.map(school =>
        school.id === schoolId ? { ...school, is_active: !currentStatus } : school
      ));
      
      alert(`École ${!currentStatus ? 'activée' : 'désactivée'} avec succès !`);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du changement de statut");
    }
  };

  // OUVRIRE LE MODAL DE MODIFICATION
  const openEditModal = (school) => {
    setSelectedSchool(school);
    setFormData({
      name: school.name || "",
      address: school.address || "",
      phone: school.phone || "",
      email: school.email || "",
      director_id: school.profiles?.[0]?.id || ""
    });
    setShowEditModal(true);
  };

  // OUVRIRE LE MODAL DE SUPPRESSION
  const openDeleteModal = (school) => {
    setSelectedSchool(school);
    setShowDeleteModal(true);
  };

  // RÉINITIALISER LE FORMULAIRE
  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      director_id: ""
    });
    setFormErrors({});
    setSelectedSchool(null);
  };

  // GESTION DES CHAMPS DU FORMULAIRE
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur du champ lorsqu'il est modifié
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
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
      {/* En-tête de page */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Écoles</h1>
        <p className="text-gray-600">Gérez toutes les écoles inscrites sur la plateforme</p>
      </div>

      {/* Barre d'actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher une école..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            Nouvelle école
          </button>
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 flex items-center gap-2">
            <FontAwesomeIcon icon={faFilter} />
            Filtres
          </button>
        </div>
      </div>

      {/* Tableau des écoles */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                École
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Directeur
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date d'inscription
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSchools.map((school) => (
              <tr key={school.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={faSchool} className="text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{school.name}</div>
                      <div className="text-sm text-gray-500">{school.address}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{school.email}</div>
                  <div className="text-sm text-gray-500">{school.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {school.profiles?.[0] ? 
                    `${school.profiles[0].first_name} ${school.profiles[0].last_name}` : 
                    'Non assigné'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleSchoolStatus(school.id, school.is_active)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      school.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <FontAwesomeIcon 
                      icon={school.is_active ? faCheckCircle : faTimesCircle} 
                      className="mr-1" 
                    />
                    {school.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(school.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openEditModal(school)}
                      className="text-green-600 hover:text-green-900"
                      title="Modifier"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      onClick={() => openDeleteModal(school)}
                      className="text-red-600 hover:text-red-900"
                      title="Supprimer"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSchools.length === 0 && (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faSchool} className="text-gray-400 text-4xl mb-4" />
            <p className="text-gray-500">Aucune école trouvée</p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Affichage de <span className="font-medium">{filteredSchools.length}</span> écoles
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Précédent
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Suivant
          </button>
        </div>
      </div>

      {/* MODAL DE CRÉATION */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-xl font-bold text-gray-900">Nouvelle École</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-500">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleCreateSchool}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom de l'école *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Téléphone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Directeur</label>
                  <select
                    name="director_id"
                    value={formData.director_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner un directeur</option>
                    {directors.map(director => (
                      <option key={director.id} value={director.id}>
                        {director.first_name} {director.last_name} ({director.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={operationLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={operationLoading ? faTimes : faSave} className={operationLoading ? "animate-spin" : ""} />
                  {operationLoading ? "Création..." : "Créer l'école"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE MODIFICATION */}
      {showEditModal && selectedSchool && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-xl font-bold text-gray-900">Modifier l'école</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-500">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleEditSchool}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom de l'école *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Téléphone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Directeur</label>
                  <select
                    name="director_id"
                    value={formData.director_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner un directeur</option>
                    {directors.map(director => (
                      <option key={director.id} value={director.id}>
                        {director.first_name} {director.last_name} ({director.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Actuel: {selectedSchool.profiles?.[0] ? 
                      `${selectedSchool.profiles[0].first_name} ${selectedSchool.profiles[0].last_name}` : 
                      'Aucun directeur assigné'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={operationLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={operationLoading ? faTimes : faSave} className={operationLoading ? "animate-spin" : ""} />
                  {operationLoading ? "Modification..." : "Modifier l'école"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SUPPRESSION */}
      {showDeleteModal && selectedSchool && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <FontAwesomeIcon icon={faTrash} className="text-red-600 text-xl" />
            </div>
            
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Confirmer la suppression</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer l'école <strong>"{selectedSchool.name}"</strong> ? 
                  Cette action est irréversible et supprimera toutes les données associées.
                </p>
              </div>
            </div>

            <div className="flex justify-center space-x-3 mt-5">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={operationLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteSchool}
                disabled={operationLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={operationLoading ? faTimes : faTrash} className={operationLoading ? "animate-spin" : ""} />
                {operationLoading ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}