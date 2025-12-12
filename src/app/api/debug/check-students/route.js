/**
 * Debug endpoint to check students in database
 * Usage: POST /api/debug/check-students
 */

import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    // Note: In production, use the request context to get session
    // For debugging only - remove before deploying to production
    const { school_id } = await request.json();

    if (!school_id) {
      return Response.json({ error: 'school_id is required' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check students in database
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*, profiles(first_name, last_name, role)')
      .eq('school_id', school_id);

    if (studentsError) {
      return Response.json({ error: studentsError }, { status: 500 });
    }

    // Check all students regardless of school
    const { data: allStudents, error: allError } = await supabase
      .from('students')
      .select('*, profiles(first_name, last_name, role)');

    if (allError) {
      return Response.json({ error: allError }, { status: 500 });
    }

    return Response.json({
      school_id,
      students_in_school: students || [],
      total_students: students?.length || 0,
      all_students_count: allStudents?.length || 0,
      debug: {
        students_query: 'Querying students with school_id filter',
        columns_checked: ['id', 'school_id', 'class_id', 'status', 'profiles'],
        note: 'Check if profiles.role = "student"'
      }
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
