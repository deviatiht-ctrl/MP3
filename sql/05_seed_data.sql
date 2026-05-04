-- 05_seed_data.sql
-- Run fifth. Demo content for homepage display.

-- Causes for donations
INSERT INTO mp3_causes (name, description, icon, goal_amount, display_order) VALUES
('Kanpay Elektoral', 'Soutni kanpay elektoral pati a nan tout peyi a', 'Vote', 500000, 1),
('Fomasyon Kadè', 'Fòme nouvo lidè politik nan tout depatman yo', 'GraduationCap', 200000, 2),
('Fonjeneral MP3', 'Kontribiye nan fonksyònman jeneral pati a', 'Building2', null, 3),
('Pwogram Sosyal', 'Ede kominote ki nan bezwen atravè pwogram sosyal', 'Heart', 300000, 4);

-- Sample candidates (no photos — admin uploads)
INSERT INTO mp3_candidats (full_name, position, department, bio, is_featured, is_active, display_order) VALUES
('Jean-Baptiste Emmanuel', 'Kandida Prezidan', 'Tout Ayiti', 'Yon lidè ekspèriyanse ak yon vizyon klè pou devlopman Ayiti. Li travay pandan 20 an nan sektè piblik la.', true, true, 1),
('Marie-Flore Desrosiers', 'Kandida Senatè', 'Lwès', 'Avoka ak defansè dwa moun. Li defann dwa fanm ak jèn nan tout peyi a pandan plis pase 15 an.', true, true, 2),
('Pierre-Louis Clément', 'Kandida Depite', 'Nò', 'Agronòm ki dedye lavi l pou devlopman agrikòl nan nò Ayiti. Fonde 3 kooperativ agrikòl.', true, true, 3),
('Nadège Beaumont', 'Kandida Majistra', 'Sid', 'Antreprenè sosyal ak fondatè plizyè ONG lokal nan depatman Sid la.', true, true, 4);

-- Sample news articles
INSERT INTO mp3_actualites (title, slug, content, excerpt, category, is_published, published_at) VALUES
('MP3 lanse kanpay nasyonal li nan 10 depatman yo', 'mp3-lanse-kanpay-nasyonal', 
 '<p>Mouvman Pèp pou Pwosperite ak Pwogrè (MP3) ofisyèlman lanse kanpay nasyonal li jounen jodi a, nan yon seremoni grandioz ki fèt nan Delmas.</p><p>Pati a anonse prezans li nan 10 depatman peyi a, ak plis pase 500 militan aktif ki pre pou chanje Ayiti.</p>', 
 'MP3 ofisyèlman lanse kanpay nasyonal li nan yon seremoni grandioz nan Delmas.', 'kanpay', true, now() - interval '2 days'),
('MP3 prezante pwogram ekonomik 5 an li', 'mp3-pwogram-ekonomik',
 '<p>Nan yon konfèrans pèsad, MP3 prezante pwogram ekonomik senkan li, ki gen ladan kreyasyon 100,000 travay pou jèn yo.</p>',
 'MP3 prezante yon pwogram ekonomik ambisize pou 5 an k ap vini yo.', 'ekonomi', true, now() - interval '5 days'),
('MP3 ak kominote Sid la: yon rankont istorik', 'mp3-kominote-sid',
 '<p>Lidè pati a vizite kominote nan depatman Sid la pou koute bezwen popilasyon an dirèkteman.</p>',
 'Lidè pati a nan depatman Sid la pou yon rankont dirèk ak popilasyon an.', 'rejyon', true, now() - interval '8 days');

-- Sample events
INSERT INTO mp3_agenda (title, description, event_date, location, rsvp_enabled, is_published) VALUES
('Gran Rasanbleman MP3 — Pòtoprens', 'Premye gran rasanbleman ofisyèl pati a nan kapital la. Tout manm ak sipòtè yo envite.', now() + interval '7 days', 'Champ de Mars, Pòtoprens', true, true),
('Fòmasyon Lidèchip — Nò', 'Sesyon fòmasyon pou nouvo lidè ak militan nan depatman Nò a.', now() + interval '14 days', 'Cap-Haïtien', true, true),
('Konferans Pès: Pwogram Agrikòl MP3', 'Prezantasyon ofisyèl pwogram agrikòl pati a pou depatman Atibonit ak Latibonit.', now() + interval '21 days', 'Gonaïves', false, true);
