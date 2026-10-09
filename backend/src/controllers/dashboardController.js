const pool = require('../config/db');
const { cache } = require('../config/redis');

const getStats = async (req, res) => {
  try {
    // Try cache first
    const cached = await cache.get('dashboard_stats');
    if (cached) return res.json(cached);

    const today = new Date().toISOString().split('T')[0];
    
    const [activeVisitors, todayVisitors, totalVisitors, totalHosts] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM visits WHERE status = 'checked_in'"),
      pool.query("SELECT COUNT(*) FROM visits WHERE DATE(check_in) = $1", [today]),
      pool.query("SELECT COUNT(*) FROM visitors"),
      pool.query("SELECT COUNT(*) FROM hosts WHERE is_active = true"),
    ]);

    const stats = {
      activeVisitors: parseInt(activeVisitors.rows[0].count),
      todayVisitors: parseInt(todayVisitors.rows[0].count),
      totalVisitors: parseInt(totalVisitors.rows[0].count),
      totalHosts: parseInt(totalHosts.rows[0].count),
    };

    await cache.set('dashboard_stats', stats, 60); // Cache for 60 seconds
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecentVisits = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.id, v.check_in, v.status, vis.name as visitor_name, vis.photo_url, h.name as host_name
      FROM visits v
      JOIN visitors vis ON v.visitor_id = vis.id
      JOIN hosts h ON v.host_id = h.id
      ORDER BY v.check_in DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getVisitsByDepartment = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.department, COUNT(*) as count
      FROM visits v
      JOIN hosts h ON v.host_id = h.id
      WHERE v.check_in >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY h.department
      ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getVisitsTrend = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DATE(check_in) as date, COUNT(*) as count
      FROM visits
      WHERE check_in >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(check_in)
      ORDER BY date
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getStats, getRecentVisits, getVisitsByDepartment, getVisitsTrend };
