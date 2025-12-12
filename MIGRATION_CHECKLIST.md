# Complete Code Migration Checklist

## Status: In Progress
- **Completed**: 1/30+ pages
- **Current**: Database consolidation (profiles table ready)
- **Next**: Systematic page-by-page updates

---

## PHASE 1: CRITICAL ⚠️ - MUST DO FIRST

### 1. Apply Database Migration
- [ ] Execute `migrations/001_consolidate_to_profiles_table.sql` in Supabase
- [ ] Verify no errors
- [ ] Confirm all tables and columns created
- [ ] Test helper views work
- **Status**: ⏳ WAITING FOR USER TO EXECUTE IN SUPABASE

---

## PHASE 2: STUDENT-FACING PAGES (HIGH PRIORITY)

These are the most critical pages where students view their data:

### 2.1 Dashboard Pages

#### [ ] `/src/app/dashboard/student/grades/page.jsx`
**Purpose**: Student views their grades
**Changes needed**:
- Query: `from('profiles').eq('role', 'student')` instead of separate query
- Query grades with `student_profile_id` instead of `student_id`
- Access: `student.first_name` instead of `student.profiles.first_name`
**Estimated time**: 10 min
**Priority**: HIGH (student-facing)

#### [ ] `/src/app/dashboard/student/absences/page.jsx`
**Purpose**: Student views absences
**Changes needed**:
- Query absences with `student_profile_id` instead of `student_id`
- Update filters and display logic
**Estimated time**: 10 min
**Priority**: HIGH

#### [ ] `/src/app/dashboard/student/schedule/page.jsx`
**Purpose**: Student views class schedule
**Status**: ✅ Mostly done (export working)
**Changes needed**:
- Verify query works with consolidated schema
- Test schedule display
**Estimated time**: 5 min
**Priority**: HIGH

#### [ ] `/src/app/dashboard/student/homeworks/page.jsx`
**Purpose**: Student views assigned homeworks
**Changes needed**:
- Query: `from('homeworks')` with `teacher_profile_id` instead of `teacher_id`
- Update display to show teacher info from joined profiles
**Estimated time**: 10 min
**Priority**: HIGH

---

### 2.2 Parent Dashboard

#### [ ] `/src/app/dashboard/parent/grades/page.jsx`
**Purpose**: Parent views child's grades
**Changes needed**:
- Query child as `from('profiles').eq('role', 'student')`
- Query grades with student_profile_id
- Update parent-student relationship lookup
**Estimated time**: 15 min
**Priority**: HIGH

#### [ ] `/src/app/dashboard/parent/absences/page.jsx`
**Purpose**: Parent views child's absences
**Changes needed**:
- Query with student_profile_id instead of student_id
**Estimated time**: 10 min
**Priority**: HIGH

#### [ ] `/src/app/dashboard/parent/invoices/page.jsx`
**Purpose**: Parent views school invoices/tuition
**Changes needed**:
- Query invoices with `student_profile_id` instead of `student_id`
- Verify payment relationships
**Estimated time**: 10 min
**Priority**: MEDIUM (financial)

#### [ ] `/src/app/dashboard/parent/schedules/page.jsx`
**Purpose**: Parent views child's schedule
**Changes needed**:
- Query schedule data with correct student reference
**Estimated time**: 10 min
**Priority**: MEDIUM

---

## PHASE 3: TEACHER-FACING PAGES (HIGH PRIORITY)

### 3.1 Teacher Input Pages

#### [ ] `/src/app/dashboard/teacher/absences/page.jsx`
**Purpose**: Teacher marks student absences
**Changes needed**:
- Insert: Use `student_profile_id`, `teacher_profile_id` instead of `student_id`, `teacher_id`
- Get teacher ID from session.user.id
- Update form validation and display
**Estimated time**: 15 min
**Priority**: HIGH

#### [ ] `/src/app/dashboard/teacher/grades/page.jsx`
**Purpose**: Teacher enters student grades
**Status**: ✅ Export working
**Changes needed**:
- Insert: Use `student_profile_id`, `teacher_profile_id`
- Query: Update column references
- Verify grade calculations work
**Estimated time**: 15 min
**Priority**: HIGH

#### [ ] `/src/app/dashboard/teacher/homeworks/page.jsx`
**Purpose**: Teacher creates homework assignments
**Changes needed**:
- Insert: Use `teacher_profile_id` instead of `teacher_id`
- Query: Verify display logic
**Estimated time**: 15 min
**Priority**: HIGH

---

### 3.2 Teacher View Pages

#### [ ] `/src/app/dashboard/teacher/schedule/page.jsx`
**Purpose**: Teacher views their teaching schedule
**Changes needed**:
- Query teacher's own schedule using profiles
**Estimated time**: 10 min
**Priority**: MEDIUM

---

## PHASE 4: SUPERVISOR & DIRECTOR PAGES (MEDIUM PRIORITY)

### 4.1 Supervisor Pages

#### [✅] `/src/app/dashboard/supervisor/students-list/page.jsx`
**Status**: ✅ COMPLETED
**Changes made**:
- ✅ Query: `from('profiles').eq('role', 'student')`
- ✅ Removed debug info display
- ✅ Fixed field access (.first_name instead of .profiles.first_name)
- ✅ Removed debug endpoint reference
**Last update**: This session

#### [ ] `/src/app/dashboard/supervisor/absences/page.jsx`
**Purpose**: Supervisor reviews student absences
**Changes needed**:
- Query absences with `student_profile_id`, `teacher_profile_id`
- Update joins/relationships
**Estimated time**: 15 min
**Priority**: MEDIUM

#### [ ] `/src/app/dashboard/supervisor/conduct/page.jsx`
**Purpose**: Supervisor reviews student conduct
**Changes needed**:
- Query students using consolidated profiles table
- Access conduct field directly from profiles
**Estimated time**: 10 min
**Priority**: MEDIUM

#### [ ] `/src/app/dashboard/supervisor/grades-report/page.jsx`
**Purpose**: Supervisor views grade statistics
**Changes needed**:
- Query grades with correct column names
- Update calculations
**Estimated time**: 15 min
**Priority**: MEDIUM

#### [ ] `/src/app/dashboard/supervisor/promoted-list/page.jsx`
**Purpose**: Supervisor views promotion list
**Changes needed**:
- Query students with `promoted` field from profiles
- Filter: `.eq('promoted', true)`
**Estimated time**: 10 min
**Priority**: MEDIUM

#### [ ] `/src/app/dashboard/supervisor/schedule/page.jsx`
**Purpose**: Supervisor manages class schedules
**Changes needed**:
- Query with updated schema references
**Estimated time**: 10 min
**Priority**: MEDIUM

---

### 4.2 Director Pages

#### [ ] `/src/app/dashboard/director/students/page.jsx`
**Purpose**: Director manages student records
**Changes needed**:
- Query: `from('profiles').eq('role', 'student')`
- Update create/edit/delete operations
- Remove references to students table
**Estimated time**: 20 min
**Priority**: HIGH

#### [ ] `/src/app/dashboard/director/students/add/page.jsx`
**Purpose**: Director adds new student
**Changes needed**:
- Form submission: Single insert to profiles table
- Include all student fields (class_id, matricule, birth_date, gender)
- Verify no separate students table insert needed
**Estimated time**: 20 min
**Priority**: HIGH

#### [ ] `/src/app/dashboard/director/classes/[id]/students/page.jsx`
**Purpose**: Director views students in class
**Changes needed**:
- Query: Filter profiles by class_id and role='student'
- Update display
**Estimated time**: 15 min
**Priority**: HIGH

#### [ ] `/src/app/dashboard/director/classes/page.jsx`
**Purpose**: Director manages classes
**Changes needed**:
- Classes table unchanged
- But student counts now query profiles with role filter
**Estimated time**: 10 min
**Priority**: MEDIUM

#### [ ] `/src/app/dashboard/director/classes/add/page.jsx`
**Purpose**: Director adds new class
**Changes needed**:
- Classes table unchanged - no changes needed
**Estimated time**: 0 min
**Priority**: LOW

#### [ ] `/src/app/dashboard/director/teachers/page.jsx`
**Purpose**: Director manages teachers
**Changes needed**:
- Query: `from('profiles').eq('role', 'teacher')`
- Update CRUD operations (no separate teachers table)
- Remove profile_id references
**Estimated time**: 20 min
**Priority**: HIGH

#### [ ] `/src/app/dashboard/director/teachers/add/page.jsx`
**Purpose**: Director adds new teacher
**Changes needed**:
- Form: Single insert to profiles with role='teacher' and subject field
- No separate teachers table insert
**Estimated time**: 20 min
**Priority**: HIGH

#### [ ] `/src/app/dashboard/director/subjects/page.jsx`
**Purpose**: Director manages subjects
**Changes needed**:
- Subjects table unchanged - no changes needed
**Estimated time**: 0 min
**Priority**: LOW

#### [ ] `/src/app/dashboard/director/subjects/add/page.jsx`
**Purpose**: Director adds new subject
**Changes needed**:
- Subjects table unchanged - no changes needed
**Estimated time**: 0 min
**Priority**: LOW

#### [ ] `/src/app/dashboard/director/payments/page.jsx`
**Purpose**: Director views payment records
**Changes needed**:
- Query payments with `student_profile_id` instead of `student_id`
- Update joins to get student names from profiles
**Estimated time**: 15 min
**Priority**: MEDIUM

#### [ ] `/src/app/dashboard/director/payments/add/page.jsx`
**Purpose**: Director records payment
**Changes needed**:
- Insert: Use `student_profile_id` instead of `student_id`
- Update validation
**Estimated time**: 15 min
**Priority**: MEDIUM

#### [ ] `/src/app/dashboard/director/schedule/page.jsx`
**Purpose**: Director views/manages schedule
**Changes needed**:
- Schedule queries - update references if needed
**Estimated time**: 10 min
**Priority**: MEDIUM

#### [ ] `/src/app/dashboard/director/schedule/add/page.jsx`
**Purpose**: Director adds schedule entry
**Changes needed**:
- Insert: Verify FK references
**Estimated time**: 10 min
**Priority**: MEDIUM

---

## PHASE 5: ACCOUNTANT PAGES (MEDIUM PRIORITY)

### 5.1 Accountant Dashboard

#### [ ] `/src/app/dashboard/accountant/invoices/page.jsx`
**Purpose**: Accountant manages invoices
**Changes needed**:
- Query invoices with `student_profile_id` instead of `student_id`
- Update student name access
**Estimated time**: 15 min
**Priority**: MEDIUM

#### [ ] `/src/app/dashboard/accountant/payments/page.jsx`
**Purpose**: Accountant processes payments
**Changes needed**:
- Query payments with `student_profile_id`
- Update joins to get student info from profiles
**Estimated time**: 15 min
**Priority**: MEDIUM

#### [ ] `/src/app/dashboard/accountant/receipts/page.jsx`
**Purpose**: Accountant generates receipts
**Changes needed**:
- Query receipts with `student_profile_id` instead of `student_id`
- Update generated_by field (already uses profile reference)
**Estimated time**: 15 min
**Priority**: MEDIUM

#### [✅] `/src/app/dashboard/accountant/reports/page.jsx`
**Status**: ✅ Export working
**Changes needed**:
- Verify query uses correct column names
- Update if needed for invoice/payment filtering
**Estimated time**: 10 min
**Priority**: MEDIUM

---

## PHASE 6: ADMIN PAGES (LOW PRIORITY)

### 6.1 Admin Dashboard

#### [ ] `/src/app/dashboard/admin/users/page.jsx`
**Purpose**: Admin views all users
**Changes needed**:
- Now queries from single profiles table
- Can filter by role: 'student', 'teacher', 'parent', 'supervisor', 'accountant', 'director', 'admin'
- Much simpler query!
**Estimated time**: 15 min
**Priority**: MEDIUM

#### [ ] `/src/app/dashboard/admin/payments/page.jsx`
**Purpose**: Admin reviews payment system
**Changes needed**:
- Query payments with `student_profile_id`
**Estimated time**: 10 min
**Priority**: LOW

#### [ ] `/src/app/dashboard/admin/pending/page.jsx`
**Purpose**: Admin reviews pending approvals
**Changes needed**:
- Query profiles with `.eq('status', 'pending')`
- Update display
**Estimated time**: 10 min
**Priority**: LOW

#### [ ] `/src/app/dashboard/admin/schools/page.jsx`
**Purpose**: Admin manages schools
**Changes needed**:
- Schools table unchanged - no changes needed
**Estimated time**: 0 min
**Priority**: LOW

#### [ ] `/src/app/dashboard/admin/settings/page.jsx`
**Purpose**: Admin system settings
**Changes needed**:
- Likely no database query changes
**Estimated time**: 0 min
**Priority**: LOW

#### [ ] `/src/app/dashboard/admin/subscriptions/page.jsx`
**Purpose**: Admin manages subscriptions
**Changes needed**:
- Subscriptions table unchanged - no changes needed
**Estimated time**: 0 min
**Priority**: LOW

---

## PHASE 7: API ROUTES (15+ ENDPOINTS)

### 7.1 User Management APIs

#### [ ] `/src/app/api/users/route.js`
**Purpose**: CRUD for user profiles
**Changes needed**:
- GET: Query from profiles table only
- POST: Insert into profiles with all fields including role
- PUT/DELETE: Update/delete profiles directly
**Estimated time**: 20 min
**Priority**: CRITICAL

---

### 7.2 Messages API

#### [ ] `/src/app/api/messages/route.js`
**Purpose**: Handle messages
**Changes needed**:
- Use `sender_profile_id` and `receiver_profile_id` if columns renamed
- Likely minimal changes
**Estimated time**: 10 min
**Priority**: LOW

---

### 7.3 Export APIs

#### [ ] `/src/app/api/export/grades-pdf/route.js`
**Status**: ✅ Likely working
**Changes needed**:
- Verify it handles new column names correctly
**Estimated time**: 5 min
**Priority**: LOW

#### [ ] `/src/app/api/export/students-pdf/route.js`
**Purpose**: Export student list to PDF
**Changes needed**:
- Handle new field structure
- Verify names access directly (not nested)
**Estimated time**: 5 min
**Priority**: LOW

#### [ ] `/src/app/api/export/schedule-pdf/route.js`
**Status**: ✅ Likely working
**Changes needed**:
- Verify compatibility
**Estimated time**: 5 min
**Priority**: LOW

#### [ ] `/src/app/api/export/reports-pdf/route.js`
**Status**: ✅ Likely working
**Changes needed**:
- Verify compatibility
**Estimated time**: 5 min
**Priority**: LOW

---

### 7.4 Bulletin API

#### [ ] `/src/app/api/bulletins/generate/route.js`
**Purpose**: Generate student report cards
**Changes needed**:
- Query students using consolidated profiles
- Query grades with correct column names
- Verify calculations work
**Estimated time**: 20 min
**Priority**: MEDIUM

---

## PHASE 8: COMPONENTS (4 components)

### 8.1 Navigation Components

#### [ ] `/src/components/StudentNav.jsx`
**Purpose**: Student navigation menu
**Changes needed**:
- May query student's own profile info
- Likely minimal changes or none
**Estimated time**: 5 min
**Priority**: LOW

#### [ ] `/src/components/TeacherNav.jsx`
**Purpose**: Teacher navigation
**Changes needed**:
- May query teacher's own profile
- Likely minimal changes
**Estimated time**: 5 min
**Priority**: LOW

#### [ ] `/src/components/DirectorNav.jsx`
**Purpose**: Director navigation
**Changes needed**:
- May query director's school info
- Likely minimal changes
**Estimated time**: 5 min
**Priority**: LOW

#### [ ] `/src/components/SupervisorNav.jsx`
**Purpose**: Supervisor navigation
**Changes needed**:
- May query supervisor's school info
- Likely minimal changes
**Estimated time**: 5 min
**Priority**: LOW

---

## Summary Statistics

**Total Pages to Update**: 30+
**Total API Routes**: 15+
**Total Components**: 4

**By Priority**:
- CRITICAL: 2 pages
- HIGH: 15 pages
- MEDIUM: 10 pages
- LOW: 8+ pages

**Estimated Total Time**: 
- Database migration: 10 min (+ user action)
- Code changes: ~6-8 hours (spread over multiple days)
- Testing: ~4-6 hours
- **Total**: ~1 week of work

---

## Next Steps

1. **User executes migration SQL** in Supabase (CRITICAL BLOCKER)
2. **Verify migration successful** (check database tables and columns)
3. **Start with Phase 2** (student-facing pages) - highest priority
4. **Test each page** before moving to next
5. **Document any issues** encountered
6. **Deploy to production** after comprehensive testing

---

**Tracking Status**: Last updated this session
**Completed**: 1/30+ pages (3%)
**In Progress**: Database migration (user action required)
**Remaining**: 29+ pages
