const sequelize = require('./database');

const statements = [
  `ALTER TABLE product ADD COLUMN harga_beli INT NOT NULL DEFAULT 0 AFTER price`,
  `ALTER TABLE orders ADD COLUMN payment_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending' AFTER status`,
  `ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) NULL DEFAULT 'manual' AFTER payment_status`,
  `UPDATE orders SET payment_status = 'verified' WHERE payment_status = 'pending' AND status NOT IN ('pending', 'cancelled')`,
];

async function runMigrations() {
  for (const sql of statements) {
    try {
      await sequelize.query(sql);
    } catch (err) {
      const msg = String(err.message || '');
      if (msg.includes('Duplicate column') || msg.includes('duplicate column')) continue;
      console.warn('Migration skip:', msg.slice(0, 120));
    }
  }
}

module.exports = { runMigrations };
