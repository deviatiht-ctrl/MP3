-- 06_seed_donations.sql
-- Run last. Sample donations for dashboard charts.

INSERT INTO mp3_donations (donor_name, amount, currency, payment_method, cause, status, created_at) VALUES
('Jean Dupont', 1000, 'HTG', 'moncash', 'Fonjeneral MP3', 'confirmed', now() - interval '1 day'),
('Marie Pierre', 25, 'USD', 'stripe', 'Kanpay Elektoral', 'confirmed', now() - interval '2 days'),
('Anonymous', 500, 'HTG', 'natcash', 'Pwogram Sosyal', 'confirmed', now() - interval '3 days'),
('Robert Jean', 50, 'USD', 'paypal', 'Fomasyon Kadè', 'confirmed', now() - interval '4 days'),
('Claire Beaumont', 2500, 'HTG', 'moncash', 'Kanpay Elektoral', 'confirmed', now() - interval '5 days'),
('Louis Martin', 10, 'USD', 'stripe', 'Fonjeneral MP3', 'confirmed', now() - interval '6 days'),
('Sophie Désir', 1500, 'HTG', 'natcash', 'Pwogram Sosyal', 'confirmed', now() - interval '7 days'),
('Pierre Joseph', 100, 'USD', 'paypal', 'Fonjeneral MP3', 'confirmed', now() - interval '8 days'),
('Marie-Louise François', 5000, 'HTG', 'moncash', 'Kanpay Elektoral', 'confirmed', now() - interval '9 days'),
('Jean-Claude Bernard', 75, 'USD', 'stripe', 'Fomasyon Kadè', 'confirmed', now() - interval '10 days');
