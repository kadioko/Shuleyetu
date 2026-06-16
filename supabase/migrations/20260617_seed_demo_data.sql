-- Comprehensive Demo Data for Shuleyetu Pitch Scenarios

-- VENDORS (6 diverse vendors)
INSERT INTO vendors (id, name, description, region, district, ward, street_address, phone, email, is_active, created_at) VALUES
('demo-vendor-1', 'Mwanza Book Center', 'Your one-stop shop for all school textbooks, stationery, and uniforms. Serving Mwanza families for over 10 years.', 'Mwanza', 'Nyamagana', 'Makongoro', '123 Station Road', '+255 768 123 456', 'info@mwanzabooks.co.tz', true, NOW()),
('demo-vendor-2', 'Dar School Supplies', 'Premium quality school uniforms and textbooks. We specialize in private school requirements.', 'Dar es Salaam', 'Kinondoni', 'Kijitonyama', '45 Morogoro Road', '+255 789 234 567', 'sales@darschoolsupplies.com', true, NOW()),
('demo-vendor-3', 'Arusha EduMart', 'New modern supply store with online ordering and home delivery. Best prices guaranteed.', 'Arusha', 'Arusha City', 'Sakina', '78 Sokoine Road', '+255 754 345 678', 'hello@arushaedumart.co.tz', true, NOW()),
('demo-vendor-4', 'Mbeya Village Books', 'Serving rural communities with affordable school supplies.', 'Mbeya', 'Mbeya City', 'Uyole', 'Near Bus Stand', '+255 767 456 789', 'orders@mbeyabooks.org', true, NOW()),
('demo-vendor-5', 'Elite Academic Stores', 'Premium imported textbooks and designer uniforms. Catering to international schools.', 'Dar es Salaam', 'Ilala', 'Upanga', '12 Garden Avenue', '+255 777 567 890', 'concierge@eliteacademic.co.tz', true, NOW()),
('demo-vendor-6', 'BackToSchool MegaStore', 'Tanzania''s largest school supply warehouse. Bulk discounts available!', 'Dodoma', 'Dodoma City', 'Majengo', 'Warehouse District', '+255 765 678 901', 'bulk@backtoschoolmega.tz', true, NOW());

-- INVENTORY for Mwanza Book Center
INSERT INTO inventory (id, vendor_id, name, description, category, price_tzs, stock_quantity, is_active, created_at) VALUES
('item-mb-001', 'demo-vendor-1', 'Primary Mathematics Book 1', 'Oxford Primary Math textbook for Standard 1', 'textbook', 15000, 45, true, NOW()),
('item-mb-002', 'demo-vendor-1', 'Primary Mathematics Book 2', 'Oxford Primary Math textbook for Standard 2', 'textbook', 16000, 38, true, NOW()),
('item-mb-003', 'demo-vendor-1', 'Primary Mathematics Book 3', 'Oxford Primary Math textbook for Standard 3', 'textbook', 17000, 42, true, NOW()),
('item-mb-004', 'demo-vendor-1', 'English Language Reader Grade 4', 'Comprehensive English reader with exercises', 'textbook', 18500, 35, true, NOW()),
('item-mb-005', 'demo-vendor-1', 'Science for Primary Schools Book 5', 'Science textbook with experiments', 'textbook', 20000, 28, true, NOW()),
('item-mb-006', 'demo-vendor-1', 'Secondary Physics Form 1', 'Advanced physics textbook', 'textbook', 35000, 20, true, NOW()),
('item-mb-007', 'demo-vendor-1', 'Chemistry for Secondary Form 2', 'Complete chemistry textbook', 'textbook', 38000, 18, true, NOW()),
('item-mb-008', 'demo-vendor-1', 'Biology Form 3 Textbook', 'Comprehensive biology textbook', 'textbook', 40000, 25, true, NOW()),
('item-mb-009', 'demo-vendor-1', 'Mathematics for Secondary Form 4', 'O-Level preparation math book', 'textbook', 42000, 30, true, NOW()),
('item-mb-010', 'demo-vendor-1', 'Primary School Uniform Set', 'Complete uniform: shirt, shorts, sweater, socks', 'uniform', 45000, 60, true, NOW()),
('item-mb-011', 'demo-vendor-1', 'Secondary School Uniform Set', 'Complete secondary uniform with tie', 'uniform', 65000, 40, true, NOW()),
('item-mb-012', 'demo-vendor-1', 'Sports Uniform Set', 'PE kit: t-shirt, shorts, track pants', 'uniform', 35000, 50, true, NOW()),
('item-mb-013', 'demo-vendor-1', 'A4 Exercise Book (72 pages)', 'Pack of 12 high quality exercise books', 'stationery', 18000, 200, true, NOW()),
('item-mb-014', 'demo-vendor-1', 'Mathematical Set', 'Complete geometry set with compass', 'stationery', 12000, 80, true, NOW()),
('item-mb-015', 'demo-vendor-1', 'Scientific Calculator', 'Casio fx-991ES PLUS calculator', 'stationery', 45000, 30, true, NOW()),
('item-mb-016', 'demo-vendor-1', 'School Backpack', 'Durable backpack with laptop compartment', 'other', 55000, 25, true, NOW());

-- INVENTORY for Dar School Supplies
INSERT INTO inventory (id, vendor_id, name, description, category, price_tzs, stock_quantity, is_active, created_at) VALUES
('item-ds-001', 'demo-vendor-2', 'Cambridge Primary Math', 'International curriculum mathematics book', 'textbook', 28000, 25, true, NOW()),
('item-ds-002', 'demo-vendor-2', 'Cambridge Science Book', 'Interactive science with online resources', 'textbook', 30000, 20, true, NOW()),
('item-ds-003', 'demo-vendor-2', 'IB Diploma Physics', 'Oxford IB Physics course companion', 'textbook', 85000, 10, true, NOW()),
('item-ds-004', 'demo-vendor-2', 'Private School Uniform (Boys)', 'Premium cotton with embroidered badge', 'uniform', 85000, 30, true, NOW()),
('item-ds-005', 'demo-vendor-2', 'Private School Uniform (Girls)', 'Designer uniform with blazer', 'uniform', 95000, 25, true, NOW()),
('item-ds-006', 'demo-vendor-2', 'Premium Graphing Calculator', 'TI-84 Plus CE color display', 'stationery', 185000, 8, true, NOW()),
('item-ds-007', 'demo-vendor-2', 'Leather School Bag', 'Genuine leather backpack with warranty', 'other', 120000, 15, true, NOW()),
('item-ds-008', 'demo-vendor-2', 'Tablet for Learning', 'Samsung Galaxy Tab with educational apps', 'other', 450000, 10, true, NOW());

-- INVENTORY for Arusha EduMart
INSERT INTO inventory (id, vendor_id, name, description, category, price_tzs, stock_quantity, is_active, created_at) VALUES
('item-ae-001', 'demo-vendor-3', 'Smart Learning Tablet Bundle', '10" tablet with educational content', 'other', 285000, 15, true, NOW()),
('item-ae-002', 'demo-vendor-3', 'Coding for Kids Starter Kit', 'Learn programming with Scratch cards', 'other', 65000, 12, true, NOW()),
('item-ae-003', 'demo-vendor-3', 'Modern Primary Textbook Set', 'Textbooks with QR video lessons', 'textbook', 85000, 35, true, NOW()),
('item-ae-004', 'demo-vendor-3', 'Reusable Smart Notebook', 'Write, scan, erase, reuse!', 'stationery', 55000, 18, true, NOW()),
('item-ae-005', 'demo-vendor-3', 'LED Desk Lamp', 'Study lamp with phone charger', 'other', 35000, 25, true, NOW()),
('item-ae-006', 'demo-vendor-3', 'Modern School Uniform', 'Contemporary stain-resistant design', 'uniform', 58000, 45, true, NOW()),
('item-ae-007', 'demo-vendor-3', 'Solar Power Bank', '20000mAh solar charger for students', 'other', 42000, 22, true, NOW());

-- INVENTORY for Mbeya Village Books
INSERT INTO inventory (id, vendor_id, name, description, category, price_tzs, stock_quantity, is_active, created_at) VALUES
('item-mv-001', 'demo-vendor-4', 'Affordable Exercise Books Pack', 'Pack of 20 at wholesale price', 'stationery', 15000, 500, true, NOW()),
('item-mv-002', 'demo-vendor-4', 'Budget Textbook Set', 'Government school textbook bundle', 'textbook', 65000, 80, true, NOW()),
('item-mv-003', 'demo-vendor-4', 'Basic School Uniform', 'Economy durable uniform set', 'uniform', 32000, 100, true, NOW()),
('item-mv-004', 'demo-vendor-4', 'Student Pen Pack', '50 ballpoint pens bulk pack', 'stationery', 12000, 300, true, NOW()),
('item-mv-005', 'demo-vendor-4', 'School Bag (Economy)', 'Basic durable school bag', 'other', 18000, 60, true, NOW()),
('item-mv-006', 'demo-vendor-4', 'Second-Hand Textbooks', 'Quality used textbooks half price', 'textbook', 8000, 120, true, NOW()),
('item-mv-007', 'demo-vendor-4', 'Battery Study Lamp', 'LED lamp for evening study', 'other', 15000, 45, true, NOW());

-- INVENTORY for Elite Academic
INSERT INTO inventory (id, vendor_id, name, description, category, price_tzs, stock_quantity, is_active, created_at) VALUES
('item-ea-001', 'demo-vendor-5', 'Harrow International Curriculum', 'Complete UK curriculum textbooks', 'textbook', 125000, 15, true, NOW()),
('item-ea-002', 'demo-vendor-5', 'IB Full Diploma Package', 'All 6 IB subjects with guides', 'textbook', 450000, 8, true, NOW()),
('item-ea-003', 'demo-vendor-5', 'Designer School Blazer', 'Tailored wool blazer with gold buttons', 'uniform', 185000, 12, true, NOW()),
('item-ea-004', 'demo-vendor-5', 'Italian Leather Shoes', 'Handcrafted leather school shoes', 'uniform', 145000, 18, true, NOW()),
('item-ea-005', 'demo-vendor-5', 'Luxury Stationery Set', 'Leather-bound notebooks and fountain pen', 'stationery', 85000, 15, true, NOW()),
('item-ea-006', 'demo-vendor-5', 'Apple iPad Air Education', 'iPad with Apple Pencil for learning', 'other', 1200000, 6, true, NOW()),
('item-ea-007', 'demo-vendor-5', 'Robotics Learning Kit', 'Arduino-based STEM robotics kit', 'other', 385000, 8, true, NOW());

-- INVENTORY for BackToSchool MegaStore
INSERT INTO inventory (id, vendor_id, name, description, category, price_tzs, stock_quantity, is_active, created_at) VALUES
('item-bs-001', 'demo-vendor-6', 'Bulk Exercise Books (Box of 240)', 'Wholesale box perfect for schools', 'stationery', 280000, 50, true, NOW()),
('item-bs-002', 'demo-vendor-6', 'School Textbook Bundle (100)', 'Mixed textbooks for school libraries', 'textbook', 1800000, 20, true, NOW()),
('item-bs-003', 'demo-vendor-6', 'Uniform Package (50 students)', 'Complete sets for entire class', 'uniform', 2800000, 15, true, NOW()),
('item-bs-004', 'demo-vendor-6', 'Science Lab Starter Kit', 'Equipment for 30 students', 'other', 1200000, 8, true, NOW()),
('item-bs-005', 'demo-vendor-6', 'Computer Lab Package', '10 desktops with monitors and software', 'other', 8500000, 4, true, NOW()),
('item-bs-006', 'demo-vendor-6', 'Library Setup Package', '500 books, shelves, catalog system', 'other', 4500000, 5, true, NOW());

-- VENDOR REVIEWS
INSERT INTO vendor_reviews (id, vendor_id, reviewer_name, rating, title, comment, is_approved, created_at) VALUES
('rev-001', 'demo-vendor-1', 'Grace Mwangi', 5, 'Excellent selection!', 'Found all textbooks my children needed. Staff was helpful.', true, NOW() - INTERVAL '45 days'),
('rev-002', 'demo-vendor-1', 'John Kamau', 4, 'Good quality', 'Books are in great condition. Wish they had more stock in peak season.', true, NOW() - INTERVAL '32 days'),
('rev-003', 'demo-vendor-1', 'Mary Ochieng', 5, 'Best in Mwanza', 'Been coming here for 5 years. Always reliable!', true, NOW() - INTERVAL '60 days'),
('rev-004', 'demo-vendor-1', 'Peter Njoroge', 4, 'Fast service', 'Order ready in 2 hours. Uniforms fit perfectly.', true, NOW() - INTERVAL '15 days'),
('rev-005', 'demo-vendor-1', 'Sarah Kimani', 5, 'Lifesaver', 'They have everything! One-stop solution.', true, NOW() - INTERVAL '8 days'),

('rev-006', 'demo-vendor-2', 'Amina Hassan', 5, 'Premium quality', 'Private school uniforms are exceptional. You can feel the difference!', true, NOW() - INTERVAL '20 days'),
('rev-007', 'demo-vendor-2', 'Robert Chen', 5, 'IB materials experts', 'Stock Cambridge and IB materials. Hard to find elsewhere.', true, NOW() - INTERVAL '40 days'),
('rev-008', 'demo-vendor-2', 'Fatima Ali', 4, 'Great but pricey', 'Top quality but be prepared to pay more.', true, NOW() - INTERVAL '55 days'),

('rev-009', 'demo-vendor-3', 'Lucas Johnson', 4, 'Love the tech', 'Tablet bundle perfect for modern learning.', true, NOW() - INTERVAL '18 days'),
('rev-010', 'demo-vendor-3', 'Emma Taylor', 5, 'Coding kit brilliant', 'My 10-year-old learned programming!', true, NOW() - INTERVAL '35 days'),
('rev-011', 'demo-vendor-3', 'Sophia Martinez', 5, 'Fast delivery', 'Same day delivery in Arusha!', true, NOW() - INTERVAL '10 days'),

('rev-012', 'demo-vendor-4', 'Grace Mwakipesile', 5, 'Affordable', 'Finally a bookshop for rural families!', true, NOW() - INTERVAL '22 days'),
('rev-013', 'demo-vendor-4', 'Emmanuel Mwakalinga', 5, 'Community help', 'Library card lets my children read more books.', true, NOW() - INTERVAL '38 days'),
('rev-014', 'demo-vendor-4', 'Joseph Mwakavuta', 5, 'Life-changing', 'Battery lamp means study even without electricity.', true, NOW() - INTERVAL '15 days'),

('rev-015', 'demo-vendor-5', 'Catherine Montgomery', 5, 'Exceptional', 'Blazer looks like it belongs at Eton!', true, NOW() - INTERVAL '30 days'),
('rev-016', 'demo-vendor-5', 'Richard Ashworth', 5, 'IB materials', 'Saved me a trip to Nairobi.', true, NOW() - INTERVAL '45 days'),

('rev-017', 'demo-vendor-6', 'Headmaster Mwalimu', 5, 'Perfect for schools', 'Ordered uniforms for 200 students. Excellent pricing!', true, NOW() - INTERVAL '25 days'),
('rev-018', 'demo-vendor-6', 'PTA Chairperson', 5, 'Library package', 'Transformed our school completely.', true, NOW() - INTERVAL '60 days');

-- SAMPLE ORDERS
INSERT INTO orders (id, vendor_id, customer_name, customer_phone, student_name, school_name, total_amount_tzs, status, payment_status, public_access_token, created_at) VALUES
('ord-001', 'demo-vendor-1', 'Alice Johnson', '+255 712 345 678', 'Tom Johnson', 'Mwanza Primary School', 125000, 'pending', 'unpaid', gen_random_uuid(), NOW() - INTERVAL '2 hours'),
('ord-002', 'demo-vendor-2', 'Bob Williams', '+255 723 456 789', 'Sarah Williams', 'International School', 450000, 'pending', 'unpaid', gen_random_uuid(), NOW() - INTERVAL '5 hours'),
('ord-003', 'demo-vendor-1', 'Carol Mwangi', '+255 734 567 890', 'Peter Mwangi', 'Nyamagana Secondary', 78000, 'awaiting_payment', 'pending', gen_random_uuid(), NOW() - INTERVAL '1 day'),
('ord-004', 'demo-vendor-3', 'Daniel Kimaro', '+255 745 678 901', 'Lisa Kimaro', 'Arusha Modern School', 125000, 'awaiting_payment', 'pending', gen_random_uuid(), NOW() - INTERVAL '30 minutes'),
('ord-005', 'demo-vendor-1', 'Emma Mushi', '+255 756 789 012', 'James Mushi', 'St. Augustine Primary', 95000, 'paid', 'paid', gen_random_uuid(), NOW() - INTERVAL '2 days'),
('ord-006', 'demo-vendor-2', 'Frank Daudi', '+255 767 890 123', 'Maria Daudi', 'Haven of Peace Academy', 280000, 'paid', 'paid', gen_random_uuid(), NOW() - INTERVAL '3 days'),
('ord-007', 'demo-vendor-4', 'Grace Mwansasu', '+255 778 901 234', 'John Mwansasu', 'Mbeya Day School', 42000, 'paid', 'paid', gen_random_uuid(), NOW() - INTERVAL '1 day');

-- ORDER ITEMS
INSERT INTO order_items (id, order_id, inventory_id, quantity, unit_price_tzs, total_price_tzs) VALUES
('oi-001', 'ord-001', 'item-mb-001', 2, 15000, 30000),
('oi-002', 'ord-001', 'item-mb-010', 1, 45000, 45000),
('oi-003', 'ord-001', 'item-mb-013', 3, 18000, 54000),

('oi-004', 'ord-002', 'item-ds-005', 2, 85000, 170000),
('oi-005', 'ord-002', 'item-ds-008', 1, 450000, 450000),

('oi-006', 'ord-003', 'item-mb-006', 1, 35000, 35000),
('oi-007', 'ord-003', 'item-mb-007', 1, 38000, 38000),
('oi-008', 'ord-003', 'item-mb-015', 1, 45000, 45000),

('oi-009', 'ord-004', 'item-ae-001', 1, 285000, 285000),

('oi-010', 'ord-005', 'item-mb-004', 1, 18500, 18500),
('oi-011', 'ord-005', 'item-mb-011', 1, 65000, 65000),

('oi-012', 'ord-006', 'item-ds-003', 1, 85000, 85000),
('oi-013', 'ord-006', 'item-ds-006', 1, 185000, 185000),

('oi-014', 'ord-007', 'item-mv-003', 1, 32000, 32000),
('oi-015', 'ord-007', 'item-mv-006', 1, 8000, 8000);
