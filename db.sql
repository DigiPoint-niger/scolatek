-- ================================================================
-- SCHEMA SUPABASE - SCHOOL MANAGEMENT (VERSION AMELIOREE)
-- ================================================================

-- Extension nécessaire
create extension if not exists "pgcrypto";

-- ===========================
-- ENUMS
-- ===========================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'role_enum') then
    create type role_enum as enum ('admin','director','supervisor','accountant','teacher','student','parent');
  end if;
  if not exists (select 1 from pg_type where typname = 'gender_enum') then
    create type gender_enum as enum ('male','female','other');
  end if;
  if not exists (select 1 from pg_type where typname = 'student_status_enum') then
    create type student_status_enum as enum ('active','transferred','suspended','graduated');
  end if;
  if not exists (select 1 from pg_type where typname = 'invoice_type_enum') then
    create type invoice_type_enum as enum ('tuition','subscription','other');
  end if;
  if not exists (select 1 from pg_type where typname = 'invoice_status_enum') then
    create type invoice_status_enum as enum ('draft','sent','paid','overdue','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status_enum') then
    create type payment_status_enum as enum ('pending','paid','failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_type_enum') then
    create type payment_type_enum as enum ('subscription','tuition','other');
  end if;
  if not exists (select 1 from pg_type where typname = 'grade_type_enum') then
    create type grade_type_enum as enum ('devoir','examen','oral','autre');
  end if;
  if not exists (select 1 from pg_type where typname = 'subscription_status_enum') then
    create type subscription_status_enum as enum ('active','expired','pending');
  end if;
end$$;

-- ===========================
-- FUNCTIONS FOR NUMBERS (KEEP)
-- ===========================
create or replace function public.generate_invoice_number()
returns text as $$
begin
  return 'INV-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(md5(random()::text), 1, 6);
end;
$$ language plpgsql stable;

create or replace function public.generate_receipt_number()
returns text as $$
begin
  return 'REC-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(md5(random()::text), 1, 6);
end;
$$ language plpgsql stable;

-- ===========================
-- TRIGGER: updated_at automation
-- ===========================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ===========================
-- TABLES PRINCIPALES
-- ===========================
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  email text,
  logo_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create trigger schools_set_updated_at
before update on public.schools
for each row execute function public.set_updated_at();

-- Central profiles table (single source of truth for users)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  external_auth_id uuid,
  role role_enum not null,
  school_id uuid references public.schools(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  status text default 'pending' check (status in ('pending','active','rejected')),
  metadata jsonb, -- extensible
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text,
  year text,
  school_id uuid references public.schools(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create trigger classes_set_updated_at before update on public.classes for each row execute function public.set_updated_at();

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  description text,
  school_id uuid references public.schools(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create trigger subjects_set_updated_at before update on public.subjects for each row execute function public.set_updated_at();

-- Students reference profile_id as source of truth; no duplicated school_id
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id),
  matricule text,
  birth_date date,
  gender gender_enum default 'other',
  status student_status_enum default 'active',
  conduct text,
  promoted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create trigger students_set_updated_at before update on public.students for each row execute function public.set_updated_at();

-- ===========================
-- ROLE SPECIFIC METADATA TABLES (validated)
-- ===========================
-- These tables are lightweight metadata holders. They enforce that the linked profile has the correct role.
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id),
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create trigger teachers_set_updated_at before update on public.teachers for each row execute function public.set_updated_at();

create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id),
  relationship text, -- e.g. father/mother/guardian
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create trigger parents_set_updated_at before update on public.parents for each row execute function public.set_updated_at();

create table if not exists public.accountants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create trigger accountants_set_updated_at before update on public.accountants for each row execute function public.set_updated_at();

create table if not exists public.supervisors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create trigger supervisors_set_updated_at before update on public.supervisors for each row execute function public.set_updated_at();

-- Trigger function to enforce that profile.role matches the expected role for metadata tables
create or replace function public.ensure_profile_role()
returns trigger as $$
declare
  expected_role text;
  actual_role role_enum;
begin
  if tg_table_name = 'teachers' then expected_role := 'teacher';
  elsif tg_table_name = 'parents' then expected_role := 'parent';
  elsif tg_table_name = 'accountants' then expected_role := 'accountant';
  elsif tg_table_name = 'supervisors' then expected_role := 'supervisor';
  else expected_role := null;
  end if;

  select role into actual_role from public.profiles where id = NEW.profile_id;
  if expected_role is not null and actual_role is distinct from expected_role then
    raise exception 'profile % role mismatch: expected %, got %', NEW.profile_id, expected_role, actual_role;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger teachers_validate_role before insert or update on public.teachers for each row execute function public.ensure_profile_role();
create trigger parents_validate_role before insert or update on public.parents for each row execute function public.ensure_profile_role();
create trigger accountants_validate_role before insert or update on public.accountants for each row execute function public.ensure_profile_role();
create trigger supervisors_validate_role before insert or update on public.supervisors for each row execute function public.ensure_profile_role();

-- teacher_subjects (many-to-many)
create table if not exists public.teacher_subjects (
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  primary key (teacher_id, subject_id),
  created_at timestamptz default now()
);

-- parent_students relationship (keep but validate student/profile)
create table if not exists public.parent_students (
  parent_id uuid not null references public.parents(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (parent_id, student_id)
);

-- ===========================
-- FINANCE (WITH CONSISTENCY TRIGGERS)
-- ===========================
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null default generate_invoice_number() unique,
  student_id uuid references public.students(id),
  school_id uuid references public.schools(id),
  type invoice_type_enum not null default 'tuition',
  amount integer not null check (amount >= 0),
  due_date timestamptz not null,
  status invoice_status_enum default 'draft',
  description text,
  items jsonb default '[]'::jsonb,
  sent_at timestamptz,
  paid_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create trigger invoices_set_updated_at before update on public.invoices for each row execute function public.set_updated_at();

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id),
  student_id uuid references public.students(id),
  invoice_id uuid references public.invoices(id),
  amount integer not null check (amount >= 0),
  type payment_type_enum,
  method text,
  status payment_status_enum default 'pending',
  transaction_ref text,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null default generate_receipt_number() unique,
  payment_id uuid unique references public.payments(id),
  invoice_id uuid references public.invoices(id),
  student_id uuid references public.students(id),
  school_id uuid references public.schools(id),
  amount integer not null check (amount >= 0),
  payment_method text,
  transaction_ref text,
  paid_at timestamptz not null,
  generated_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create trigger receipts_set_updated_at before update on public.receipts for each row execute function public.set_updated_at();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id),
  plan text default 'annual',
  price integer default 150000 check (price >= 0),
  start_date timestamptz default now(),
  end_date timestamptz,
  status subscription_status_enum default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

-- Finance integrity trigger: ensure school/student/invoice coherence
create or replace function public.finance_consistency()
returns trigger as $$
declare
  invoice_school uuid;
  invoice_student uuid;
  payment_school uuid;
  payment_student uuid;
begin
  -- if operating on payments
  if TG_TABLE_NAME = 'payments' then
    if NEW.invoice_id is not null then
      select school_id, student_id into invoice_school, invoice_student from public.invoices where id = NEW.invoice_id;
      if invoice_school is not null and NEW.school_id is not null and invoice_school <> NEW.school_id then
        raise exception 'payment.school_id (%) does not match invoice.school_id (%)', NEW.school_id, invoice_school;
      end if;
      if invoice_student is not null and NEW.student_id is not null and invoice_student <> NEW.student_id then
        raise exception 'payment.student_id (%) does not match invoice.student_id (%)', NEW.student_id, invoice_student;
      end if;
    end if;
  end if;

  -- if operating on receipts
  if TG_TABLE_NAME = 'receipts' then
    if NEW.payment_id is not null then
      select school_id, student_id into payment_school, payment_student from public.payments where id = NEW.payment_id;
      if payment_school is not null and NEW.school_id is not null and payment_school <> NEW.school_id then
        raise exception 'receipt.school_id (%) does not match payment.school_id (%)', NEW.school_id, payment_school;
      end if;
      if payment_student is not null and NEW.student_id is not null and payment_student <> NEW.student_id then
        raise exception 'receipt.student_id (%) does not match payment.student_id (%)', NEW.student_id, payment_student;
      end if;
      if NEW.invoice_id is not null then
        select school_id into invoice_school from public.invoices where id = NEW.invoice_id;
        if invoice_school is not null and NEW.school_id is not null and invoice_school <> NEW.school_id then
          raise exception 'receipt.school_id (%) does not match invoice.school_id (%)', NEW.school_id, invoice_school;
        end if;
      end if;
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql;

create trigger payments_finance_check before insert or update on public.payments for each row execute function public.finance_consistency();
create trigger receipts_finance_check before insert or update on public.receipts for each row execute function public.finance_consistency();

-- ===========================
-- NOTES / ABSENCES / DEVOIRS
-- ===========================
create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id),
  teacher_id uuid not null references public.teachers(id),
  subject_id uuid not null references public.subjects(id),
  value numeric not null,
  type grade_type_enum,
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create trigger grades_set_updated_at before update on public.grades for each row execute function public.set_updated_at();

create table if not exists public.homeworks (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id),
  teacher_id uuid not null references public.teachers(id),
  subject_id uuid not null references public.subjects(id),
  title text not null,
  description text,
  due_date timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create trigger homeworks_set_updated_at before update on public.homeworks for each row execute function public.set_updated_at();

create table if not exists public.absences (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id),
  teacher_id uuid references public.teachers(id),
  subject_id uuid references public.subjects(id),
  class_id uuid references public.classes(id),
  date date not null,
  reason text,
  justified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create trigger absences_set_updated_at before update on public.absences for each row execute function public.set_updated_at();

-- ===========================
-- MESSAGING & AUDIT
-- ===========================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_profile_id uuid not null references public.profiles(id),
  receiver_profile_id uuid references public.profiles(id),
  receiver_role role_enum,
  school_id uuid references public.schools(id),
  subject text,
  body text not null,
  is_read boolean default false,
  sent_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb,
  created_at timestamptz default now()
);

-- ===========================
-- INDEXES UTILES
-- ===========================
create index if not exists idx_profiles_school on public.profiles (school_id);
create index if not exists idx_students_profile on public.students (profile_id);
create index if not exists idx_invoices_school on public.invoices (school_id);
create index if not exists idx_payments_school on public.payments (school_id);
create index if not exists idx_payments_invoice on public.payments (invoice_id);

-- ================================================================
-- NOTES:
-- 1) Les tables metadata (teachers/parents/accountants/supervisors) sont conservées
--    mais valident le role via trigger. Cela permet retrocompatibilite avec
--    references existantes (grades, homeworks, etc.) tout en évitant les incoherences.
-- 2) La logique soft-delete utilise deleted_at; adapte ta RLS/queries pour l'ignorer.
-- 3) Ajoute des RLS policies sur chaque table selon besoins (Supabase).
-- 4) Si tu veux, j'ajoute des vues (e.g. student_full_profile) et des fonctions helper pour report.
-- ================================================================
-- Table for platform settings
create table if not exists public.platform_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create trigger platform_settings_set_updated_at before update on public.platform_settings for each row execute function public.set_updated_at();