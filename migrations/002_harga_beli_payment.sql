-- Jalankan di MySQL minimarket_db sebelum menggunakan fitur baru

ALTER TABLE product
  ADD COLUMN harga_beli INT NOT NULL DEFAULT 0 AFTER price;

ALTER TABLE orders
  ADD COLUMN payment_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending' AFTER status;

ALTER TABLE orders
  ADD COLUMN payment_method VARCHAR(50) NULL DEFAULT 'manual' AFTER payment_status;

-- Pesanan lama dianggap sudah terverifikasi agar alur tidak terblokir
UPDATE orders SET payment_status = 'verified' WHERE payment_status = 'pending' AND status NOT IN ('pending', 'cancelled');
