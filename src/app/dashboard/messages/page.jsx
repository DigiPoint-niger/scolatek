import { useEffect, useState } from 'react';
import { Modal, Button, Input, Select } from '@/components/ui';
import { createClient } from '@/lib/supabase';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '', receiver_profile_id: '', receiver_role: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    const res = await fetch('/api/messages?profileId=ME'); // Remplacer ME par l'ID du profil connecté
    const data = await res.json();
    setMessages(data);
    setLoading(false);
  }

  async function sendMessage(e) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, sender_profile_id: 'ME', school_id: 'SCHOOL_ID' }), // Remplacer par les vraies valeurs
    });
    setModalOpen(false);
    setForm({ subject: '', body: '', receiver_profile_id: '', receiver_role: '' });
    fetchMessages();
  }

  return (
    <div>
      <h1>Messagerie interne</h1>
      <Button onClick={() => setModalOpen(true)}>Nouveau message</Button>
      <ul>
        {loading ? <li>Chargement...</li> : messages.map(msg => (
          <li key={msg.id}>
            <b>{msg.subject}</b> - {msg.body}<br />
            <span>De: {msg.sender_profile_id} | Pour: {msg.receiver_profile_id || msg.receiver_role}</span>
          </li>
        ))}
      </ul>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={sendMessage}>
          <Input placeholder="Sujet" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          <Input placeholder="Message" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          <Input placeholder="ID destinataire" value={form.receiver_profile_id} onChange={e => setForm(f => ({ ...f, receiver_profile_id: e.target.value }))} />
          <Select value={form.receiver_role} onChange={e => setForm(f => ({ ...f, receiver_role: e.target.value }))}>
            <option value="">Rôle destinataire</option>
            <option value="admin">Admin</option>
            <option value="accountant">Accountant</option>
            <option value="director">Director</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
            <option value="supervisor">Supervisor</option>
          </Select>
          <Button type="submit" disabled={loading}>Envoyer</Button>
        </form>
      </Modal>
    </div>
  );
}
