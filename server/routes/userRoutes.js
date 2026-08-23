import express from 'express';
import crypto from 'crypto';
import { pool } from '../config/db.js';

const router = express.Router();

// Users REST API
router.post('/api/users', async (req, res) => {
  const { id, name, email, avatar, globalRole, department, gender, birthday, skills, password, wfhDays } = req.body;
  const cleanName = name ? name.replace(/\s+/g, ' ').trim() : '';
  let pwHash = null;
  try {
    // Check if user already exists to preserve their password_hash, or set default ('password123' hashed)
    const existingUser = await pool.query('SELECT password_hash FROM users WHERE id = $1 OR email = $2', [id, email]);
    if (password && password.trim() !== '') {
      pwHash = crypto.createHash('sha256').update(password).digest('hex');
    } else if (existingUser.rows.length > 0 && existingUser.rows[0].password_hash) {
      pwHash = existingUser.rows[0].password_hash;
    } else {
      pwHash = crypto.createHash('sha256').update('password123').digest('hex');
    }

    await pool.query(
      `INSERT INTO users (id, name, email, avatar, global_role, department, gender, birthday, skills, password_hash, wfh_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         avatar = EXCLUDED.avatar,
         global_role = EXCLUDED.global_role,
         department = EXCLUDED.department,
         gender = EXCLUDED.gender,
         birthday = EXCLUDED.birthday,
         skills = EXCLUDED.skills,
         password_hash = EXCLUDED.password_hash,
         wfh_days = EXCLUDED.wfh_days`,
      [id, cleanName, email, avatar, globalRole, department, gender, birthday, skills, pwHash, wfhDays || []]
    );
    res.json({ success: true });
  } catch (err) {
    // Handle duplicate email (same email, different ID — e.g. LINE re-login)
    if (err.code === '23505' && err.constraint === 'users_email_key') {
      try {
        await pool.query(
          `UPDATE users SET
             id = $1, name = $2, avatar = $3,
             global_role = $4, department = $5,
             gender = $6, birthday = $7, skills = $8,
             password_hash = $9, wfh_days = $10
           WHERE email = $11`,
          [id, cleanName, avatar, globalRole, department, gender, birthday, skills, pwHash, wfhDays || [], email]
        );
        res.json({ success: true, note: 'merged by email' });
      } catch (updateErr) {
        console.error('Error merging user by email:', updateErr.message);
        res.status(500).json({ error: updateErr.message });
      }
    } else {
      console.error('Error saving user:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
});


router.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: err.message });
  }
});



export default router;
