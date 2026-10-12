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
        photo_url VARCHAR(255),
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

    await client.query('CREATE INDEX IF NOT EXISTS idx_visits_visitor ON visits(visitor_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_visits_host ON visits(host_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_visits_checkin ON visits(check_in)');

    await client.query('COMMIT');
    console.log('✅ Database migration completed successfully');
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
