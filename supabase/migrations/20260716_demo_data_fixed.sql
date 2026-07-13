-- Idempotent demo data seed for Shuleyetu
-- Safe to run in production: only inserts when matching demo records do not exist.
-- Note: the demo auth user is created via the /api/demo/setup endpoint so that
-- Supabase Auth state stays consistent and password hashing uses GoTrue directly.

-- ============================================================
-- Demo vendors + inventory (only if no vendors exist)
-- ============================================================
do $$
declare
  v1 uuid := gen_random_uuid();
  v2 uuid := gen_random_uuid();
  v3 uuid := gen_random_uuid();
  v4 uuid := gen_random_uuid();
  v5 uuid := gen_random_uuid();
  v6 uuid := gen_random_uuid();
begin
  if not exists (select 1 from public.vendors) then
    insert into public.vendors (id, name, description, region, district, ward, street_address, phone_number, email, is_active, approval_status)
    values
      (v1, 'Mwanza Book Center', 'Your one-stop shop for all school textbooks, stationery, and uniforms. Serving Mwanza families for over 10 years.', 'Mwanza', 'Nyamagana', 'Makongoro', '123 Station Road', '+255 768 123 456', 'info@mwanzabooks.co.tz', true, 'approved'),
      (v2, 'Dar School Supplies', 'Premium quality school uniforms and textbooks. We specialize in private school requirements.', 'Dar es Salaam', 'Kinondoni', 'Kijitonyama', '45 Morogoro Road', '+255 789 234 567', 'sales@darschoolsupplies.com', true, 'approved'),
      (v3, 'Arusha EduMart', 'New modern supply store with online ordering and home delivery. Best prices guaranteed.', 'Arusha', 'Arusha City', 'Sakina', '78 Sokoine Road', '+255 754 345 678', 'hello@arushaedumart.co.tz', true, 'approved'),
      (v4, 'Mbeya Village Books', 'Serving rural communities with affordable school supplies.', 'Mbeya', 'Mbeya City', 'Uyole', 'Near Bus Stand', '+255 767 456 789', 'orders@mbeyabooks.org', true, 'approved'),
      (v5, 'Elite Academic Stores', 'Premium imported textbooks and designer uniforms. Catering to international schools.', 'Dar es Salaam', 'Ilala', 'Upanga', '12 Garden Avenue', '+255 777 567 890', 'concierge@eliteacademic.co.tz', true, 'approved'),
      (v6, 'BackToSchool MegaStore', 'Tanzania''s largest school supply warehouse. Bulk discounts available!', 'Dodoma', 'Dodoma City', 'Majengo', 'Warehouse District', '+255 765 678 901', 'bulk@backtoschoolmega.tz', true, 'approved');

    insert into public.inventory (vendor_id, name, description, category, price_tzs, stock_quantity, is_active)
    values
      -- Mwanza Book Center
      (v1, 'Primary Mathematics Book 1', 'Oxford Primary Math textbook for Standard 1', 'textbook', 15000, 45, true),
      (v1, 'Primary Mathematics Book 2', 'Oxford Primary Math textbook for Standard 2', 'textbook', 16000, 38, true),
      (v1, 'English Language Reader Grade 4', 'Comprehensive English reader with exercises', 'textbook', 18500, 35, true),
      (v1, 'Secondary Physics Form 1', 'Advanced physics textbook', 'textbook', 35000, 20, true),
      (v1, 'Primary School Uniform Set', 'Complete uniform: shirt, shorts, sweater, socks', 'uniform', 45000, 60, true),
      (v1, 'Secondary School Uniform Set', 'Complete secondary uniform with tie', 'uniform', 65000, 40, true),
      (v1, 'A4 Exercise Book (72 pages)', 'Pack of 12 high quality exercise books', 'stationery', 18000, 200, true),
      (v1, 'Mathematical Set', 'Complete geometry set with compass', 'stationery', 12000, 80, true),
      (v1, 'Scientific Calculator', 'Casio fx-991ES PLUS calculator', 'stationery', 45000, 30, true),
      (v1, 'School Backpack', 'Durable backpack with laptop compartment', 'other', 55000, 25, true),
      -- Dar School Supplies
      (v2, 'Cambridge Primary Math', 'International curriculum mathematics book', 'textbook', 28000, 25, true),
      (v2, 'Cambridge Science Book', 'Interactive science with online resources', 'textbook', 30000, 20, true),
      (v2, 'Private School Uniform (Boys)', 'Premium cotton with embroidered badge', 'uniform', 85000, 30, true),
      (v2, 'Private School Uniform (Girls)', 'Designer uniform with blazer', 'uniform', 95000, 25, true),
      (v2, 'Premium Graphing Calculator', 'TI-84 Plus CE color display', 'stationery', 185000, 8, true),
      (v2, 'Leather School Bag', 'Genuine leather backpack with warranty', 'other', 120000, 15, true),
      -- Arusha EduMart
      (v3, 'Smart Learning Tablet Bundle', '10" tablet with educational content', 'other', 285000, 15, true),
      (v3, 'Coding for Kids Starter Kit', 'Learn programming with Scratch cards', 'other', 65000, 12, true),
      (v3, 'Modern Primary Textbook Set', 'Textbooks with QR video lessons', 'textbook', 85000, 35, true),
      (v3, 'Reusable Smart Notebook', 'Write, scan, erase, reuse!', 'stationery', 55000, 18, true),
      (v3, 'Modern School Uniform', 'Contemporary stain-resistant design', 'uniform', 58000, 45, true),
      -- Mbeya Village Books
      (v4, 'Affordable Exercise Books Pack', 'Pack of 20 at wholesale price', 'stationery', 15000, 500, true),
      (v4, 'Budget Textbook Set', 'Government school textbook bundle', 'textbook', 65000, 80, true),
      (v4, 'Basic School Uniform', 'Economy durable uniform set', 'uniform', 32000, 100, true),
      (v4, 'Student Pen Pack', '50 ballpoint pens bulk pack', 'stationery', 12000, 300, true),
      (v4, 'School Bag (Economy)', 'Basic durable school bag', 'other', 18000, 60, true),
      -- Elite Academic
      (v5, 'Harrow International Curriculum', 'Complete UK curriculum textbooks', 'textbook', 125000, 15, true),
      (v5, 'IB Full Diploma Package', 'All 6 IB subjects with guides', 'textbook', 450000, 8, true),
      (v5, 'Designer School Blazer', 'Tailored wool blazer with gold buttons', 'uniform', 185000, 12, true),
      (v5, 'Italian Leather Shoes', 'Handcrafted leather school shoes', 'uniform', 145000, 18, true),
      (v5, 'Luxury Stationery Set', 'Leather-bound notebooks and fountain pen', 'stationery', 85000, 15, true),
      -- BackToSchool MegaStore
      (v6, 'Bulk Exercise Books (Box of 240)', 'Wholesale box perfect for schools', 'stationery', 280000, 50, true),
      (v6, 'School Textbook Bundle (100)', 'Mixed textbooks for school libraries', 'textbook', 1800000, 20, true),
      (v6, 'Uniform Package (50 students)', 'Complete sets for entire class', 'uniform', 2800000, 15, true),
      (v6, 'Science Lab Starter Kit', 'Equipment for 30 students', 'other', 1200000, 8, true),
      (v6, 'Administrative Stationery Box', 'Pens, staplers, registers, and more', 'stationery', 95000, 40, true);
  end if;
end $$;

-- ============================================================
-- Demo school data (only if no demo school exists)
-- ============================================================
do $$
declare
  demo_school_id uuid := gen_random_uuid();
  c1 uuid := gen_random_uuid();
  c2 uuid := gen_random_uuid();
  c3 uuid := gen_random_uuid();
  stu1 uuid := gen_random_uuid();
  stu2 uuid := gen_random_uuid();
  stu3 uuid := gen_random_uuid();
  staff1 uuid := gen_random_uuid();
begin
  if not exists (select 1 from public.schools where email = 'demo@shuleyetu.test') then
    insert into public.schools (id, name, region, district, ward, address, phone, email, is_active)
    values (demo_school_id, 'Demo Secondary School', 'Dar es Salaam', 'Ilala', 'Upanga', '123 Education Street', '+255 700 111 222', 'demo@shuleyetu.test', true);

    insert into public.school_classes (id, school_id, name, grade, stream, room, capacity)
    values
      (c1, demo_school_id, 'Form 1A', 'Form 1', 'A', 'Room 101', 40),
      (c2, demo_school_id, 'Form 2A', 'Form 2', 'A', 'Room 201', 40),
      (c3, demo_school_id, 'Form 3A', 'Form 3', 'A', 'Room 301', 40);

    insert into public.school_students (id, school_id, admission_number, first_name, last_name, gender, class_id, parent_name, parent_phone, parent_email, address, status)
    values
      (stu1, demo_school_id, 'DSS-001', 'Juma', 'Mwalimu', 'male', c1, 'Asha Juma', '+255 711 222 333', 'asha@example.com', 'Dar es Salaam', 'active'),
      (stu2, demo_school_id, 'DSS-002', 'Grace', 'Mushi', 'female', c1, 'Peter Mushi', '+255 722 333 444', 'peter@example.com', 'Dar es Salaam', 'active'),
      (stu3, demo_school_id, 'DSS-003', 'Baraka', 'Omondi', 'male', c2, 'Faith Omondi', '+255 733 444 555', 'faith@example.com', 'Dar es Salaam', 'active');

    insert into public.school_staff (id, school_id, employee_id, first_name, last_name, role, phone, email, status)
    values (staff1, demo_school_id, 'DSS-STAFF-001', 'Anna', 'Kibona', 'admin', '+255 744 555 666', 'anna@shuleyetu.test', 'active');
  end if;
end $$;
