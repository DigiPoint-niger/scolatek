# Database Consolidation Guide: Students/Teachers → Profiles

## Overview

This guide documents the consolidation of separate user tables (`students`, `teachers`, `parents`, `supervisors`, `accountants`) into a single **polymorphic `profiles` table** with a `role` field.

**Status**: Ready to implement
**Impact**: Database schema change + 30+ pages of code updates
**Timeline**: Multi-phase migration

---

## Phase 1: Database Migration

### Step 1: Apply Migration SQL

Execute the SQL in `migrations/001_consolidate_to_profiles_table.sql`:

```sql
-- This migration:
-- 1. Adds new columns to profiles table (class_id, matricule, birth_date, gender, conduct, promoted, subject)
-- 2. Migrates student data from students table to profiles
-- 3. Migrates teacher data from teachers table to profiles
-- 4. Updates all foreign key references (student_id → student_profile_id, etc.)
-- 5. Drops old intermediate tables (students, teachers, parents, supervisors, accountants, parent_students)
-- 6. Creates helper views for backward compatibility
-- 7. Creates performance indexes
```

**Execution**:
```bash
# In Supabase Dashboard → SQL Editor:
# 1. Copy entire migration SQL file content
# 2. Paste into SQL Editor
# 3. Click "RUN"
# 4. Monitor execution (should complete in ~5-10 seconds)
```

**Verification Checklist**:
- ✅ No errors during migration
- ✅ `profiles` table has new columns (class_id, matricule, subject, etc.)
- ✅ All data migrated correctly
- ✅ Foreign key constraints working
- ✅ Helper views created (students_view, teachers_view, etc.)
- ✅ Indexes created for performance

---

## Phase 2: Frontend Code Updates

### Current Query Pattern (OLD - must change)

```javascript
// OLD: Querying separate tables
const { data: students } = await supabase
  .from('students')
  .select('id, profiles(first_name, last_name), class_id, status')
  .eq('school_id', schoolId);
```

### New Query Pattern (NEW - use this)

```javascript
// NEW: Query profiles directly with role filter
const { data: students } = await supabase
  .from('profiles')
  .select('id, first_name, last_name, class_id, status, school_id, role')
  .eq('role', 'student')
  .eq('school_id', schoolId);
```

### Key Changes Summary

| Old Pattern | New Pattern | Notes |
|------------|------------|-------|
| `from('students')` | `from('profiles').eq('role', 'student')` | Role filtering replaces table selection |
| `from('teachers')` | `from('profiles').eq('role', 'teacher')` | Same pattern for all user types |
| `.select('id, profiles(...)')` | `.select('id, first_name, last_name, ...')` | No more nested profile joins |
| `student.profiles.first_name` | `student.first_name` | Access columns directly on object |
| `teacher.profiles.email` | `teacher.email` | No nesting needed |

---

## Phase 3: Page-by-Page Updates (30+ Pages)

### Priority 1: Student-Related Pages (HIGH)

#### `/src/app/dashboard/supervisor/students-list/page.jsx`
**Status**: ✅ Already using profiles correctly
**Action**: Remove debug info display

```javascript
// BEFORE (current):
const { data: studentsData } = await supabase
  .from('students')
  .select('id, profiles(first_name, last_name, role), class_id, status, school_id')
  .eq('school_id', profile.school_id);

// AFTER (new):
const { data: studentsData } = await supabase
  .from('profiles')
  .select('id, first_name, last_name, class_id, status, school_id, role')
  .eq('role', 'student')
  .eq('school_id', profile.school_id);
```

**Remove from UI**:
```jsx
{/* Debug Info - DELETE THIS */}
{debugInfo && (
  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
    <strong>Debug Info:</strong>
    <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
  </div>
)}
```

---

#### `/src/app/dashboard/director/students/page.jsx`
**Status**: Needs update
**Change**: Query profiles instead of students table

```javascript
// BEFORE:
const { data: students } = await supabase
  .from('students')
  .select('*, profiles(*)')
  .eq('school_id', schoolId);

// AFTER:
const { data: students } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'student')
  .eq('school_id', schoolId);

// Then in JSX, use student.first_name instead of student.profiles.first_name
```

---

#### `/src/app/dashboard/director/classes/page.jsx`
**Status**: Needs update for student listing within classes
**Change**: Similar pattern - query profiles with role='student'

---

#### `/src/app/dashboard/parent/grades/page.jsx`
**Status**: Needs update
**Change**: Query student's own profile directly from session

```javascript
const { data: { session } } = await supabase.auth.getSession();
// Then fetch student's own data from profiles (already the session.user)
```

---

### Priority 2: Teacher-Related Pages (HIGH)

#### `/src/app/dashboard/teacher/absences/page.jsx`
**Status**: Needs update
**Change**: When inserting absences, use `teacher_profile_id` instead of `teacher_id`

```javascript
// BEFORE:
const { error } = await supabase
  .from('absences')
  .insert({
    student_id: studentId,
    teacher_id: teacherId,  // ← CHANGE THIS
    subject_id: subjectId,
    date: new Date(),
    justified: false
  });

// AFTER:
const { error } = await supabase
  .from('absences')
  .insert({
    student_profile_id: studentId,  // ← RENAMED
    teacher_profile_id: teacherId,  // ← RENAMED
    subject_id: subjectId,
    date: new Date(),
    justified: false
  });
```

---

#### `/src/app/dashboard/teacher/grades/page.jsx`
**Status**: Needs update
**Change**: Update column names in grades table

```javascript
// BEFORE:
INSERT INTO grades (student_id, teacher_id, subject_id, value)
VALUES (studentId, teacherId, subjectId, value)

// AFTER:
INSERT INTO grades (student_profile_id, teacher_profile_id, subject_id, value)
VALUES (studentId, teacherId, subjectId, value)
```

---

#### `/src/app/dashboard/teacher/homeworks/page.jsx`
**Status**: Needs update
**Change**: Use `teacher_profile_id` column

```javascript
// BEFORE:
INSERT INTO homeworks (teacher_id, class_id, subject_id, ...)

// AFTER:
INSERT INTO homeworks (teacher_profile_id, class_id, subject_id, ...)
```

---

### Priority 3: Data Management Pages (MEDIUM)

#### `/src/app/dashboard/director/teachers/page.jsx`
```javascript
// Query teachers from profiles
const { data: teachers } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'teacher')
  .eq('school_id', schoolId);
```

---

#### `/src/app/dashboard/admin/users/page.jsx`
```javascript
// Can now query all users from one table
const { data: users } = await supabase
  .from('profiles')
  .select('*')
  .eq('school_id', schoolId);
  // Optional: .in('role', ['student', 'teacher', 'parent', 'supervisor', 'accountant'])
```

---

### Priority 4: Forms & Data Entry (MEDIUM)

#### Creating a new student:

**BEFORE**:
```javascript
// 1. Create profiles entry
const { data: profile } = await supabase
  .from('profiles')
  .insert({ external_auth_id, email, first_name, last_name, role: 'student', school_id })
  .select();

// 2. Create students entry
const { data: student } = await supabase
  .from('students')
  .insert({ profile_id: profile.id, class_id, matricule, school_id })
  .select();
```

**AFTER**:
```javascript
// Single insert into profiles - everything in one go!
const { data: student } = await supabase
  .from('profiles')
  .insert({
    external_auth_id,
    email,
    first_name,
    last_name,
    role: 'student',
    school_id,
    class_id,
    matricule,
    birth_date,
    gender
  })
  .select();
```

---

### Priority 5: API Endpoints (MEDIUM)

#### `/src/app/api/users/route.js`
```javascript
// BEFORE:
const { data: profiles } = await supabase.from('profiles').select('*');
const { data: students } = await supabase.from('students').select('*');
const { data: teachers } = await supabase.from('teachers').select('*');

// AFTER:
const { data: profiles } = await supabase
  .from('profiles')
  .select('*');  // Already contains everything, no separate student/teacher queries needed!
```

---

#### `/src/app/api/messages/route.js`
```javascript
// BEFORE:
const { data: sender } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', senderId);

// AFTER:
// Same as before - profiles table unchanged here!
```

---

### Priority 6: Navigation & Layouts (LOW)

#### `/src/app/dashboard/[role]/layout.jsx` files
**Change**: Update role validation and permission checks

```javascript
// These can now directly check the 'role' field from profiles
// Previously needed to check if entry existed in separate table
// Now just check: profile.role === 'teacher' instead of checking if record exists in students table
```

---

## Phase 4: Testing Checklist

### Database Level
- [ ] Migration executed without errors
- [ ] All data migrated from old tables to profiles
- [ ] Foreign key constraints working
- [ ] Helper views accessible
- [ ] Indexes created and functional

### Student Features
- [ ] Supervisor can see students from their school
- [ ] Students can view their grades
- [ ] Students can view their schedule
- [ ] Students can view absences
- [ ] Director can manage students
- [ ] Parent can view their child's grades

### Teacher Features
- [ ] Teachers can input grades (using teacher_profile_id)
- [ ] Teachers can mark absences (using teacher_profile_id)
- [ ] Teachers can create homeworks
- [ ] Teachers can view their subjects/classes

### Admin Features
- [ ] Admin can view all users from profiles table
- [ ] Admin can filter by role
- [ ] Admin can create new users with correct role

### Data Integrity
- [ ] No orphaned records after migration
- [ ] Foreign key relationships preserved
- [ ] All cascading deletes working correctly
- [ ] Timestamps preserved

### Export Features
- [ ] PDF exports work with new schema
- [ ] Excel exports work with new schema
- [ ] Bulletins generate correctly with student data

---

## Rollback Plan (If Needed)

If issues occur, restore from backup:

1. Contact Supabase support for backup restoration
2. Restore database to pre-migration state
3. Roll back code changes
4. Re-analyze and plan next migration attempt

---

## Files Modified Summary

### To Be Updated:
- **Pages** (30+):
  - student/* pages
  - teacher/* pages
  - director/* pages
  - supervisor/* pages
  - parent/* pages
  - admin/* pages
  - accountant/* pages

- **API Routes** (15+):
  - `/api/users/route.js`
  - `/api/export/*` routes
  - `/api/bulletins/*` routes
  - All other data endpoints

- **Components** (4):
  - StudentNav.jsx
  - TeacherNav.jsx
  - DirectorNav.jsx
  - SupervisorNav.jsx
  - etc.

### Migration Files:
- `migrations/001_consolidate_to_profiles_table.sql` ← Execute this first!
- `db_new_simplified.sql` ← Reference only (shows final schema)

---

## Performance Notes

**Before Consolidation**:
- Join required: `FROM students JOIN profiles...` (2 tables)
- Indexes needed on both tables

**After Consolidation**:
- Single table query: `FROM profiles WHERE role = 'student'`
- Fewer joins overall = faster queries
- Strategic indexes on role, school_id, role+school_id

**Index Strategy** (automatically created by migration):
```sql
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_school_id ON profiles(school_id);
CREATE INDEX idx_profiles_school_id_role ON profiles(school_id, role);
```

---

## Implementation Sequence

1. **Day 1**: Execute migration SQL ✅
2. **Day 2-3**: Update all dashboard pages (5 per day)
3. **Day 3-4**: Update all API endpoints (3-4 per day)
4. **Day 4-5**: Update components and forms
5. **Day 5**: Comprehensive testing
6. **Day 6**: Go live + monitor logs

---

## Support

For questions during migration:
1. Check this guide
2. Review migration SQL comments
3. Compare old/new query patterns above
4. Test in development first before production

---

**Created**: 2024
**Status**: Ready for implementation
**Last Updated**: Current session
