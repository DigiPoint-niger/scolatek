'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ 
    subject: '', 
    body: '', 
    receiver_profile_id: '', 
    receiver_role: '' 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessagesAndReceivers();
  }, []);

  async function fetchMessagesAndReceivers() {
    setLoading(true);
    try {
      // Récupérer les messages
      const res = await fetch('/api/messages?profileId=ME');
      const data = await res.json();
      setMessages(data);

      // Récupérer tous les utilisateurs pour le select
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .order('first_name');
      
      setReceivers(profiles || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...form, 
          sender_profile_id: 'ME', 
          school_id: 'SCHOOL_ID' 
        }),
      });
      setModalOpen(false);
      setForm({ 
        subject: '', 
        body: '', 
        receiver_profile_id: '', 
        receiver_role: '' 
      });
      fetchMessagesAndReceivers();
    } catch (error) {
      console.error('Erreur envoi:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Messagerie interne</h1>
      
      <button 
        onClick={() => setModalOpen(true)}
        style={{
          padding: '10px 15px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Nouveau message
      </button>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {loading ? (
          <li>Chargement...</li>
        ) : (
          messages.map(msg => (
            <li 
              key={msg.id}
              style={{
                padding: '15px',
                margin: '10px 0',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <b>{msg.subject}</b> - {msg.body}<br />
              <span style={{ color: '#666', fontSize: '0.9em' }}>
                De: {msg.sender_profile_id} | Pour: {msg.receiver_profile_id || msg.receiver_role}
              </span>
            </li>
          ))
        )}
      </ul>

      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              minWidth: '400px'
            }}
          >
            <h2>Nouveau message</h2>
            <form onSubmit={sendMessage}>
              <input
                type="text"
                placeholder="Sujet"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  margin: '5px 0',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                required
              />
              <textarea
                placeholder="Message"
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  margin: '5px 0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '100px'
                }}
                required
              />
              <select
                value={form.receiver_profile_id}
                onChange={e => setForm(f => ({ ...f, receiver_profile_id: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  margin: '5px 0',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Sélectionner un destinataire</option>
                {receivers.map(receiver => (
                  <option key={receiver.id} value={receiver.id}>
                    {receiver.first_name} {receiver.last_name} ({receiver.role})
                  </option>
                ))}
              </select>
              <select
                value={form.receiver_role}
                onChange={e => setForm(f => ({ ...f, receiver_role: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  margin: '5px 0',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                required
              >
                <option value="">Sélectionnez un rôle (alternatif)</option>
                <option value="admin">Admin</option>
                <option value="accountant">Comptable</option>
                <option value="director">Directeur</option>
                <option value="teacher">Enseignant</option>
                <option value="student">Étudiant</option>
                <option value="parent">Parent</option>
                <option value="supervisor">Superviseur</option>
              </select>
              <div style={{ marginTop: '15px', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '8px 15px',
                    marginRight: '10px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: loading ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}