# API Bulletin Generation - Technical Reference

## Endpoint

```
POST /api/bulletins/generate
```

## Request Body

```json
{
  "filter_type": "student|class|school",
  "filter_id": "UUID or string",
  "semester": "1|2"
}
```

### Parameters Details

| Parameter | Type | Required | Values | Example |
|-----------|------|----------|--------|---------|
| `filter_type` | string | Yes | `student`, `class`, `school` | `"student"` |
| `filter_id` | UUID/string | Yes | Valid ID from DB | `"550e8400-e29b-41d4-a716-446655440000"` |
| `semester` | string | Yes | `"1"` or `"2"` | `"1"` |

### Example Requests

#### Generate bulletin for one student
```bash
curl -X POST http://localhost:3000/api/bulletins/generate \
  -H "Content-Type: application/json" \
  -d '{
    "filter_type": "student",
    "filter_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "semester": "1"
  }'
```

#### Generate bulletins for entire class
```bash
curl -X POST http://localhost:3000/api/bulletins/generate \
  -H "Content-Type: application/json" \
  -d '{
    "filter_type": "class",
    "filter_id": "class-uuid-here",
    "semester": "2"
  }'
```

#### Generate bulletins for entire school
```bash
curl -X POST http://localhost:3000/api/bulletins/generate \
  -H "Content-Type: application/json" \
  -d '{
    "filter_type": "school",
    "filter_id": "school-uuid-here",
    "semester": "1"
  }'
```

## Response

### Success (200 OK)
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="bulletins_student_s1.pdf"

[Binary PDF Content]
```

### Error (400 Bad Request)
```json
{
  "error": "Invalid filter_type. Must be 'student', 'class', or 'school'"
}
```

### Error (401 Unauthorized)
```json
{
  "error": "Not authenticated"
}
```

### Error (500 Internal Server Error)
```json
{
  "error": "Error generating bulletin: [detailed error message]"
}
```

## Data Retrieval Flow

```
1. Authenticate user with Supabase session
2. Get user's school_id from profiles table
3. Based on filter_type:
   - STUDENT: Fetch single student from students table
   - CLASS: Fetch all students in specified class
   - SCHOOL: Fetch all students in user's school
4. For each student:
   - Fetch all grades (filtered by semester)
   - Fetch subject info (for coefficients)
   - Calculate averages
   - If semester=2: Fetch semester 1 grades for annual average
5. Generate PDF with all data
6. Return PDF as binary response
```

## Calculation Algorithm

### Step 1: Get all grades for student + semester
```javascript
const grades = await supabase
  .from('grades')
  .select('*')
  .eq('student_id', studentId)
  .eq('semester', semester);
```

### Step 2: Group grades by subject
```javascript
const gradesBySubject = {};
grades.forEach(grade => {
  if (!gradesBySubject[grade.subject_id]) {
    gradesBySubject[grade.subject_id] = {
      classGrades: [],
      compGrades: []
    };
  }
  gradesBySubject[grade.subject_id].classGrades.push(grade.class_grade);
  gradesBySubject[grade.subject_id].compGrades.push(grade.composition_grade);
});
```

### Step 3: Calculate subject averages
```javascript
const subjectAverages = {};
for (const subjectId in gradesBySubject) {
  const data = gradesBySubject[subjectId];
  const classAvg = data.classGrades.reduce((a, b) => a + b, 0) / data.classGrades.length;
  const compAvg = data.compGrades.reduce((a, b) => a + b, 0) / data.compGrades.length;
  
  // Formula: 40% class + 60% composition
  subjectAverages[subjectId] = (classAvg * 0.4) + (compAvg * 0.6);
}
```

### Step 4: Calculate final average (with coefficients)
```javascript
let sumWeighted = 0;
let sumCoefficients = 0;

for (const subjectId in subjectAverages) {
  const coefficient = subjects[subjectId].coefficient || 1;
  sumWeighted += subjectAverages[subjectId] * coefficient;
  sumCoefficients += coefficient;
}

const finalAverage = sumWeighted / sumCoefficients;
```

### Step 5: Calculate annual average (semester 2 only)
```javascript
if (semester === '2') {
  // Fetch S1 average (same calculation as above)
  const s1Average = calculateS1Average(studentId);
  const annualAverage = (s1Average + finalAverage) / 2;
}
```

### Step 6: Determine status
```javascript
const status = finalAverage >= 12 ? "ADMIS" : "À RATTRAPER";
```

## PDF Structure

### Page Layout
```
┌─────────────────────────────────────────────────────────┐
│                   BULLETIN SCOLAIRE                      │
│                    REPORT CARD                           │
│                                                           │
│ École: [School Name]   Année: 2024-2025                 │
│ Élève: [First Name] [Last Name]                         │
│ Classe: [Class Name]   Semestre: [1 or 2]               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Matière         │Coeff│Notes Class│Notes Comp│Moyenne   │
├─────────────────────────────────────────────────────────┤
│ Français        │ 2   │   15.50   │  16.00  │  15.80   │
│ Mathématiques   │ 3   │   14.00   │  13.50  │  13.70   │
│ Anglais         │ 1   │   17.00   │  17.50  │  17.30   │
│ Histoire        │ 1   │   16.00   │  15.50  │  15.70   │
├─────────────────────────────────────────────────────────┤
│ MOYENNE GÉNÉRALE                                 │ 15.68 │
│ STATUS: ADMIS (≥12/20)                                  │
│ Moyenne Annuelle (S2 uniquement)                 │ 15.24 │
└─────────────────────────────────────────────────────────┘
```

### Font & Styling
- **Header**: Arial, 14pt, bold
- **Table headers**: Arial, 11pt, bold, white text on blue background
- **Table data**: Arial, 10pt, regular
- **Averages**: Arial, 10pt, bold
- **Status**: Arial, 12pt, bold, green text if ADMIS, red if À RATTRAPER

## Database Queries Used

### Query 1: Get students by filter
```sql
-- For filter_type = 'student'
SELECT * FROM students 
WHERE id = $1 AND school_id = $2

-- For filter_type = 'class'
SELECT * FROM students 
WHERE class_id = $1 AND school_id = $2

-- For filter_type = 'school'
SELECT * FROM students 
WHERE school_id = $1
```

### Query 2: Get grades for student
```sql
SELECT * FROM grades 
WHERE student_id = $1 
  AND semester = $2 
ORDER BY subject_id
```

### Query 3: Get subject info
```sql
SELECT id, name, coefficient FROM subjects 
WHERE school_id = $1
```

### Query 4: Get school info
```sql
SELECT * FROM schools 
WHERE id = $1
```

## Performance Metrics

### Generation Time (approximate)
| Scenario | Time | Size |
|----------|------|------|
| Single student | 200-300ms | 50KB |
| Small class (20 students) | 2-3s | 500KB |
| Large class (50 students) | 5-8s | 1.2MB |
| Entire school (500 students) | 60-90s | 12MB |

### Optimization Recommendations
1. **Index grades on**: `(student_id, semester)`
2. **Index subjects on**: `school_id`
3. **Index students on**: `class_id, school_id`
4. **Cache school data**: Use 1-hour TTL for school info

## Error Handling

### Validation Checks
```javascript
if (!filter_type || !['student', 'class', 'school'].includes(filter_type)) {
  return { error: "Invalid filter_type" };
}

if (!filter_id) {
  return { error: "filter_id is required" };
}

if (!semester || !['1', '2'].includes(semester)) {
  return { error: "semester must be '1' or '2'" };
}

if (!students || students.length === 0) {
  return { error: "No students found for the given filter" };
}

if (!grades || grades.length === 0) {
  return { error: "No grades found for the students" };
}
```

### Exception Handling
```javascript
try {
  // PDF generation code
} catch (error) {
  console.error("Error generating bulletins:", error);
  return Response.json(
    { error: `Error generating bulletin: ${error.message}` },
    { status: 500 }
  );
}
```

## Security Headers

Response includes:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="bulletins_..."
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

## Rate Limiting Recommendations

For production deployment, consider:
```javascript
// Limit to 10 requests per hour per user
const RATE_LIMIT = {
  max: 10,
  windowMs: 60 * 60 * 1000  // 1 hour
};
```

## Monitoring & Logging

Implement logging for:
```javascript
console.log({
  timestamp: new Date().toISOString(),
  user_id: user.id,
  filter_type: filter_type,
  filter_id: filter_id,
  semester: semester,
  student_count: students.length,
  grade_count: grades.length,
  generation_time_ms: endTime - startTime,
  status: 'success|error'
});
```

## Integration Example (Frontend)

```javascript
async function generateBulletins() {
  try {
    const response = await fetch('/api/bulletins/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter_type: 'student',
        filter_id: studentId,
        semester: '1'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    // Download PDF
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulletins_student_s1.pdf';
    link.click();
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Generation failed:', error);
    alert(`Error: ${error.message}`);
  }
}
```

## Testing Scenarios

### Test Case 1: Single Student with Full Grades
```javascript
// Expected: PDF with one page showing all subjects and averages
```

### Test Case 2: Class with Missing Grades
```javascript
// Expected: Only students with grades appear; those without grades are skipped
```

### Test Case 3: Semester 2 Annual Average
```javascript
// Expected: Annual average = (S1_avg + S2_avg) / 2
```

### Test Case 4: Large Batch (500+ students)
```javascript
// Expected: Multi-page PDF, generation completes in <120s
```

### Test Case 5: Invalid Session
```javascript
// Expected: 401 error, no PDF generated
```

## Deployment Checklist

- [ ] Database has indexes on grades(student_id, semester)
- [ ] pdfkit package installed: `npm list pdfkit`
- [ ] Environment variables configured
- [ ] Supabase connection tested
- [ ] PDF generation tested locally
- [ ] Error handling verified
- [ ] Rate limiting implemented
- [ ] Logging configured
- [ ] Backup strategy for generated bulletins
- [ ] User documentation created
