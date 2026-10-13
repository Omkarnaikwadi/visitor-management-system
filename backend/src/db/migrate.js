const pool = require('../config/db');

const migrate = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'receptionist' CHECK (role IN ('admin', 'receptionist')),
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hosts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        department VARCHAR(100),
        designation VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20) NOT NULL,
        company VARCHAR(100),
        photo_url TEXT,
        id_type VARCHAR(50),
        id_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        visitor_id INTEGER REFERENCES visitors(id),
        host_id INTEGER REFERENCES hosts(id),
        purpose VARCHAR(255) NOT NULL,
        check_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        check_out TIMESTAMP,
        badge_number VARCHAR(50),
        qr_code TEXT,
        status VARCHAR(20) DEFAULT 'checked_in' CHECK (status IN ('pre_registered', 'checked_in', 'checked_out', 'cancelled')),
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pre_registrations (
        id SERIAL PRIMARY KEY,
        visitor_name VARCHAR(100) NOT NULL,
        visitor_email VARCHAR(100),
        visitor_phone VARCHAR(20) NOT NULL,
        visitor_company VARCHAR(100),
        host_id INTEGER REFERENCES hosts(id),
        purpose VARCHAR(255),
        expected_date DATE NOT NULL,
        expected_time TIME,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(100) UNIQUE NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`ALTER TABLE otp_verifications ALTER COLUMN phone TYPE VARCHAR(100)`).catch(() => {});
    await client.query(`ALTER TABLE visitors ALTER COLUMN photo_url TYPE TEXT`).catch(() => {});

    // Parking slots table
    await client.query(`
      CREATE TABLE IF NOT EXISTS parking_slots (
        id SERIAL PRIMARY KEY,
        slot_number VARCHAR(20) UNIQUE NOT NULL,
        is_occupied BOOLEAN DEFAULT false,
        visit_id INTEGER REFERENCES visits(id) ON DELETE SET NULL
      )
    `);

    // Add parking_slot + qr_token to visits
    await client.query(`ALTER TABLE visits ADD COLUMN IF NOT EXISTS parking_slot VARCHAR(20)`).catch(() => {});
    await client.query(`ALTER TABLE visits ADD COLUMN IF NOT EXISTS qr_token TEXT`).catch(() => {});

    // Add fcm_token to users
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT`).catch(() => {});

    // Add fcm_token to hosts
    await client.query(`ALTER TABLE hosts ADD COLUMN IF NOT EXISTS fcm_token TEXT`).catch(() => {});

    // Snapshot photo per visit (fixes mismatched images from shared visitors.photo_url)
    await client.query(`ALTER TABLE visits ADD COLUMN IF NOT EXISTS photo_url TEXT`).catch(() => {});

    // Seed parking slots A1-A10, B1-B10
    const slots = [...Array(10).keys()].flatMap(i => [`A${i+1}`, `B${i+1}`]);
    for (const s of slots) {
      await client.query(`INSERT INTO parking_slots (slot_number) VALUES ($1) ON CONFLICT (slot_number) DO NOTHING`, [s]);
    }

    await client.query('CREATE INDEX IF NOT EXISTS idx_visits_visitor ON visits(visitor_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_visits_host ON visits(host_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_visits_checkin ON visits(check_in)');

    await client.query('COMMIT');
    console.log('✅ Database migration completed successfully');

    // Seed default data
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING`,
      ['Admin User', 'admin@vms.com', hashedPassword, 'admin']
    );
    const hosts = [
      ['Rajesh Kumar', 'rajesh@company.com', '9876543210', 'Engineering', 'Manager'],
      ['Priya Sharma', 'priya@company.com', '9876543211', 'HR', 'Director'],
      ['Amit Patel', 'amit@company.com', '9876543212', 'Sales', 'Executive'],
      ['Sneha Joshi', 'sneha@company.com', '9876543213', 'Finance', 'Manager'],
      ['Vikram Singh', 'vikram@company.com', '9876543214', 'Operations', 'Head'],
    ];
    for (const h of hosts) {
      await pool.query(
        `INSERT INTO hosts (name, email, phone, department, designation) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING`,
        h
      );
    }
    console.log('✅ Seed data ready');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Allow running directly: node src/db/migrate.js
if (require.main === module) {
  migrate().then(() => pool.end()).catch(() => process.exit(1));
}

module.exports = migrate;
