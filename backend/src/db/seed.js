const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const seed = async () => {
  const client = await pool.connect();
  
  try {
    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Admin User', 'admin@vms.com', hashedPassword, 'admin']);

    // Create sample hosts
    const hosts = [
      ['John Smith', 'john@company.com', '1234567890', 'Engineering', 'Manager'],
      ['Jane Doe', 'jane@company.com', '0987654321', 'HR', 'Director'],
      ['Bob Wilson', 'bob@company.com', '5555555555', 'Sales', 'Executive'],
    ];

    for (const host of hosts) {
      await client.query(`
        INSERT INTO hosts (name, email, phone, department, designation)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING
      `, host);
    }

    console.log('✅ Seed data inserted successfully');
    console.log('📧 Admin login: admin@vms.com / admin123');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
