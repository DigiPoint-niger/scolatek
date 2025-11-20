import { createClient } from '@/lib/supabase';

export async function GET(req) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  const role = searchParams.get('role');
  const schoolId = searchParams.get('schoolId');

  let query = supabase.from('messages').select('*');
  if (profileId) {
    query = query.or(`sender_profile_id.eq.${profileId},receiver_profile_id.eq.${profileId}`);
  }
  if (role) {
    query = query.eq('receiver_role', role);
  }
  if (schoolId) {
    query = query.eq('school_id', schoolId);
  }
  const { data, error } = await query.order('sent_at', { ascending: false });
  if (error) return Response.json({ error }, { status: 500 });
  return Response.json(data);
}

export async function POST(req) {
  const supabase = createClient();
  const body = await req.json();
  const { sender_profile_id, receiver_profile_id, receiver_role, school_id, subject, body: messageBody } = body;
  const { data, error } = await supabase.from('messages').insert([
    {
      sender_profile_id,
      receiver_profile_id,
      receiver_role,
      school_id,
      subject,
      body: messageBody,
    },
  ]);
  if (error) return Response.json({ error }, { status: 500 });
  return Response.json(data[0]);
}

export async function PATCH(req) {
  const supabase = createClient();
  const body = await req.json();
  const { id, is_read } = body;
  const { data, error } = await supabase.from('messages').update({ is_read }).eq('id', id);
  if (error) return Response.json({ error }, { status: 500 });
  return Response.json(data[0]);
}

export async function DELETE(req) {
  const supabase = createClient();
  const body = await req.json();
  const { id } = body;
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) return Response.json({ error }, { status: 500 });
  return Response.json({ success: true });
}
