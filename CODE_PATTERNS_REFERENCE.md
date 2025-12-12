# Schema Consolidation: Code Patterns Reference

This document provides before/after code examples for updating your application to use the consolidated `profiles` table.

---

## 1. Basic Queries

### Fetching All Students

**BEFORE** (separate table):
```javascript
const { data: students } = await supabase
  .from('students')
  .select('id, profiles(id, first_name, last_name, email), class_id, matricule, status')
  .eq('school_id', schoolId);

// Access: student.profiles.first_name, student.matricule
```

**AFTER** (consolidated):
```javascript
const { data: students } = await supabase
  .from('profiles')
  .select('id, first_name, last_name, email, class_id, matricule, status, school_id, role')
  .eq('role', 'student')
  .eq('school_id', schoolId);

// Access: student.first_name, student.matricule (no nesting!)
```

---

### Fetching All Teachers

**BEFORE** (separate table):
```javascript
const { data: teachers } = await supabase
  .from('teachers')
  .select('id, profiles(id, first_name, last_name, email), subject, is_active')
  .eq('school_id', schoolId)
  .eq('is_active', true);

// Access: teacher.profiles.first_name, teacher.subject
```

**AFTER** (consolidated):
```javascript
const { data: teachers } = await supabase
  .from('profiles')
  .select('id, first_name, last_name, email, subject, school_id, role')
  .eq('role', 'teacher')
  .eq('school_id', schoolId)
  .is('subject', 'not.is', null);  // Alternative to is_active

// Access: teacher.first_name, teacher.subject (direct!)
```

---

### Fetching Specific User by ID

**BEFORE** (might need join):
```javascript
const { data: student } = await supabase
  .from('students')
  .select('*, profiles(*)')
  .eq('profile_id', userId)
  .single();

// Access: student.profiles.first_name
```

**AFTER** (single table):
```javascript
const { data: student } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .eq('role', 'student')
  .single();

// Access: student.first_name
```

---

## 2. Creating Records

### Creating a New Student

**BEFORE** (two-step process):
```javascript
// Step 1: Create profile
const { data: profile } = await supabase
  .from('profiles')
  .insert({
    external_auth_id: newUser.id,
    email: formData.email,
    first_name: formData.firstName,
    last_name: formData.lastName,
    role: 'student',
    school_id: schoolId
  })
  .select()
  .single();

// Step 2: Create student record with profile_id
const { data: student } = await supabase
  .from('students')
  .insert({
    profile_id: profile.id,
    school_id: schoolId,
    class_id: formData.classId,
    matricule: formData.matricule,
    birth_date: formData.birthDate,
    gender: formData.gender
  })
  .select()
  .single();
```

**AFTER** (single operation):
```javascript
// Single insert into profiles with all student data
const { data: student } = await supabase
  .from('profiles')
  .insert({
    external_auth_id: newUser.id,
    email: formData.email,
    first_name: formData.firstName,
    last_name: formData.lastName,
    role: 'student',
    school_id: schoolId,
    class_id: formData.classId,
    matricule: formData.matricule,
    birth_date: formData.birthDate,
    gender: formData.gender
  })
  .select()
  .single();
```

---

### Creating a New Teacher

**BEFORE** (two-step):
```javascript
const { data: profile } = await supabase
  .from('profiles')
  .insert({
    external_auth_id: newUser.id,
    email: formData.email,
    first_name: formData.firstName,
    last_name: formData.lastName,
    role: 'teacher',
    school_id: schoolId
  })
  .select()
  .single();

const { data: teacher } = await supabase
  .from('teachers')
  .insert({
    profile_id: profile.id,
    school_id: schoolId,
    subject: formData.subject,
    is_active: true
  })
  .select()
  .single();
```

**AFTER** (single operation):
```javascript
const { data: teacher } = await supabase
  .from('profiles')
  .insert({
    external_auth_id: newUser.id,
    email: formData.email,
    first_name: formData.firstName,
    last_name: formData.lastName,
    role: 'teacher',
    school_id: schoolId,
    subject: formData.subject
  })
  .select()
  .single();
```

---

## 3. Updating Records

### Updating Student Information

**BEFORE**:
```javascript
// Might need to update both tables
const { error } = await supabase
  .from('students')
  .update({
    class_id: newClassId,
    matricule: newMatricule
  })
  .eq('profile_id', studentId);

// Also might need profile update
const { error: profileError } = await supabase
  .from('profiles')
  .update({
    first_name: newFirstName,
    email: newEmail
  })
  .eq('id', studentId);
```

**AFTER** (single table):
```javascript
// Everything in one update!
const { error } = await supabase
  .from('profiles')
  .update({
    first_name: newFirstName,
    email: newEmail,
    class_id: newClassId,
    matricule: newMatricule
  })
  .eq('id', studentId)
  .eq('role', 'student');
```

---

## 4. Deleting Records

### Deleting a Student

**BEFORE** (might need to handle separately):
```javascript
// Delete from students (might cascade or might need manual delete)
await supabase
  .from('students')
  .delete()
  .eq('profile_id', studentId);

// Profile might still exist - depends on FK constraints
```

**AFTER** (single delete):
```javascript
// Single delete - cascades to grades, absences, payments, etc. automatically
const { error } = await supabase
  .from('profiles')
  .delete()
  .eq('id', studentId)
  .eq('role', 'student');
```

---

## 5. Complex Queries

### Students with Their Current Grades (Teacher View)

**BEFORE**:
```javascript
const { data: students } = await supabase
  .from('students')
  .select(`
    id,
    profiles(first_name, last_name),
    class_id,
    grades(value, subject_id)
  `)
  .eq('class_id', classId)
  .eq('school_id', schoolId);

// students[0].profiles.first_name
```

**AFTER**:
```javascript
const { data: students } = await supabase
  .from('profiles')
  .select(`
    id,
    first_name,
    last_name,
    class_id,
    grades(value, subject_id)
  `)
  .eq('role', 'student')
  .eq('class_id', classId)
  .eq('school_id', schoolId);

// students[0].first_name (much cleaner!)
```

---

### Teachers and Their Homeworks

**BEFORE**:
```javascript
const { data: teachers } = await supabase
  .from('teachers')
  .select(`
    id,
    profiles(first_name, last_name, email),
    subject,
    homeworks(title, due_date, class_id)
  `)
  .eq('school_id', schoolId);

// teachers[0].profiles.first_name
```

**AFTER**:
```javascript
const { data: teachers } = await supabase
  .from('profiles')
  .select(`
    id,
    first_name,
    last_name,
    email,
    subject,
    homeworks(title, due_date, class_id)
  `)
  .eq('role', 'teacher')
  .eq('school_id', schoolId);

// teachers[0].first_name
```

---

## 6. Filtering & Searching

### Find Student by Email and School

**BEFORE**:
```javascript
const { data: student } = await supabase
  .from('students')
  .select('*, profiles(*)')
  .eq('school_id', schoolId)
  // Couldn't directly filter by email - needed nested query or post-processing
  .then(data => data.find(s => s.profiles.email === email));
```

**AFTER** (direct filter):
```javascript
const { data: student } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'student')
  .eq('school_id', schoolId)
  .eq('email', email)  // Direct filter!
  .single();
```

---

### Search Students by Name in School

**BEFORE**:
```javascript
const { data: students } = await supabase
  .from('students')
  .select('*, profiles(first_name, last_name)')
  .eq('school_id', schoolId)
  // Had to filter names in JavaScript
  .then(data => data.filter(s => 
    s.profiles.first_name.includes(search) || 
    s.profiles.last_name.includes(search)
  ));
```

**AFTER** (use ilike):
```javascript
const { data: students } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'student')
  .eq('school_id', schoolId)
  .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
```

---

## 7. Aggregations & Statistics

### Count Students per Class

**BEFORE**:
```javascript
const { data: classes } = await supabase
  .from('classes')
  .select('id, name, students(id)');

const classStats = classes.map(c => ({
  name: c.name,
  count: c.students.length
}));
```

**AFTER** (use count):
```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('class_id')
  .eq('role', 'student')
  .eq('school_id', schoolId);

const classStats = data.reduce((acc, student) => {
  const existing = acc.find(c => c.class_id === student.class_id);
  if (existing) existing.count++;
  else acc.push({ class_id: student.class_id, count: 1 });
  return acc;
}, []);
```

---

## 8. Using Helper Views (Optional)

The migration creates helper views for backward compatibility. You can use them if preferred (though direct query is better):

```javascript
// Using view instead of filtering
const { data: students } = await supabase
  .from('students_view')  // Uses: SELECT * FROM profiles WHERE role = 'student'
  .select('*')
  .eq('school_id', schoolId);

// But direct query is clearer:
const { data: students } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'student')
  .eq('school_id', schoolId);
```

---

## 9. Foreign Key Updates in Data Tables

### Inserting Grades (Updated Column Names)

**BEFORE**:
```javascript
const { data: grade } = await supabase
  .from('grades')
  .insert({
    student_id: studentId,
    teacher_id: teacherId,
    subject_id: subjectId,
    value: 15,
    type: 'examen'
  })
  .select()
  .single();
```

**AFTER** (renamed columns):
```javascript
const { data: grade } = await supabase
  .from('grades')
  .insert({
    student_profile_id: studentId,  // ← Renamed!
    teacher_profile_id: teacherId,  // ← Renamed!
    subject_id: subjectId,
    value: 15,
    type: 'examen'
  })
  .select()
  .single();
```

---

### Recording an Absence

**BEFORE**:
```javascript
const { error } = await supabase
  .from('absences')
  .insert({
    student_id: studentId,
    teacher_id: teacherId,
    subject_id: subjectId,
    class_id: classId,
    date: new Date().toISOString().split('T')[0],
    justified: false,
    reason: null
  });
```

**AFTER** (renamed columns):
```javascript
const { error } = await supabase
  .from('absences')
  .insert({
    student_profile_id: studentId,  // ← Renamed!
    teacher_profile_id: teacherId,  // ← Renamed!
    subject_id: subjectId,
    class_id: classId,
    date: new Date().toISOString().split('T')[0],
    justified: false,
    reason: null
  });
```

---

### Creating Homework

**BEFORE**:
```javascript
const { data: homework } = await supabase
  .from('homeworks')
  .insert({
    class_id: classId,
    teacher_id: teacherId,
    subject_id: subjectId,
    title: 'Math Exercise',
    due_date: dueDate
  })
  .select()
  .single();
```

**AFTER** (renamed column):
```javascript
const { data: homework } = await supabase
  .from('homeworks')
  .insert({
    class_id: classId,
    teacher_profile_id: teacherId,  // ← Renamed!
    subject_id: subjectId,
    title: 'Math Exercise',
    due_date: dueDate
  })
  .select()
  .single();
```

---

## 10. Migration Checklist by Page

Use this table to track which pages have been updated:

| Page | Old Pattern | New Pattern | Status |
|------|------------|-----------|--------|
| `supervisor/students-list` | `from('students')` | `from('profiles').eq('role', 'student')` | ✅ DONE |
| `director/students` | `from('students')` | `from('profiles').eq('role', 'student')` | ⏳ TODO |
| `director/teachers` | `from('teachers')` | `from('profiles').eq('role', 'teacher')` | ⏳ TODO |
| `teacher/grades` | Insert with `teacher_id` | Insert with `teacher_profile_id` | ⏳ TODO |
| `teacher/absences` | Insert with `student_id`, `teacher_id` | Insert with `student_profile_id`, `teacher_profile_id` | ⏳ TODO |
| `teacher/homeworks` | Insert with `teacher_id` | Insert with `teacher_profile_id` | ⏳ TODO |
| `student/grades` | Query grades with student_id | Query grades with student_profile_id | ⏳ TODO |
| `student/absences` | Query absences with student_id | Query absences with student_profile_id | ⏳ TODO |
| `parent/grades` | Query child grades | Query child grades | ⏳ TODO |
| `admin/users` | Separate student/teacher queries | Single profiles query | ⏳ TODO |
| `accountant/reports` | Filter by student_id | Filter by student_profile_id | ⏳ TODO |

---

## Quick Reference: Column Renames in Data Tables

These columns in data tables have been renamed for consistency:

| Table | Old Column Name | New Column Name | Why |
|-------|-----------------|-----------------|-----|
| `grades` | `student_id` | `student_profile_id` | Clarity |
| `grades` | `teacher_id` | `teacher_profile_id` | Clarity |
| `absences` | `student_id` | `student_profile_id` | Clarity |
| `absences` | `teacher_id` | `teacher_profile_id` | Clarity |
| `homeworks` | `teacher_id` | `teacher_profile_id` | Clarity |
| `invoices` | `student_id` | `student_profile_id` | Clarity |
| `payments` | `student_id` | `student_profile_id` | Clarity |
| `receipts` | `student_id` | `student_profile_id` | Clarity |

---

## Tips for Migration

1. **Always test in development first** - Use a development database clone
2. **Replace one page at a time** - Don't do all pages at once
3. **Test each page after updating** - Verify data displays correctly
4. **Remove `.profiles()` nesting** - No more nested profile objects
5. **Update field access** - Change `student.profiles.first_name` → `student.first_name`
6. **Check all FK references** - Update `_id` columns in insert/update statements
7. **Use direct filters** - Leverage the simplified schema for better queries

---

**Last Updated**: Current session
**Migration Status**: In Progress
**Pages Updated**: 1/30+
