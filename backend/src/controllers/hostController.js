const pool = require('../config/db');

const getAll = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM hosts WHERE is_active = true ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hosts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Host not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, email, phone, department, designation } = req.body;
    const result = await pool.query(
      'INSERT INTO hosts (name, email, phone, department, designation) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, phone, department, designation]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, email, phone, department, designation, is_active } = req.body;
    const result = await pool.query(
      `UPDATE hosts SET name = $1, email = $2, phone = $3, department = $4, 
       designation = $5, is_active = $6 WHERE id = $7 RETURNING *`,
      [name, email, phone, department, designation, is_active, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Host not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await pool.query('UPDATE hosts SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Host deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const saveFcmToken = async (req, res) => {
  try {
    const { fcm_token } = req.body;
    if (!fcm_token) return res.status(400).json({ error: 'fcm_token is required' });
    const result = await pool.query(
      'UPDATE hosts SET fcm_token = $1 WHERE id = $2 RETURNING id, name, fcm_token',
      [fcm_token, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Host not found' });
    res.json({ message: 'FCM token saved', host: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, saveFcmToken };
