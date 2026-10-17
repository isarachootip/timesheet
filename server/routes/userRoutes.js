import express from 'express';
import crypto from 'crypto';
import { pool } from '../config/db.js';

const router = express.Router();

// Users REST API
router.post('/api/users', async (req, res) => {
  const { id, name, email, avatar, globalRole, department, gender, birthday, skills, password, wfhDays, isActive } = req.body;
  const requesterId = req.headers['x-user-id'];
  const cleanName = name ? name.replace(/\s+/g, ' ').trim() : '';
  let pwHash = null;

  try {
    const existingUser = await pool.query('SELECT id, global_role, password_hash, is_active FROM users WHERE id = $1 OR email = $2', [id, email]);
    const existingRow = existingUser.rows[0];

    // Check requester permissions if X-User-Id header is provided
    if (requesterId && requesterId !== id) {
      const reqRes = await pool.query('SELECT global_role FROM users WHERE id = $1', [requesterId]);
      const reqRole = reqRes.rows[0]?.global_role;
      if (reqRole && reqRole !== 'Admin' && reqRole !== 'Manager') {
        return res.status(403).json({ error: 'เฉพาะ Admin หรือ Manager เท่านั้นที่สามารถเพิ่มหรือแก้ไขข้อมูลพนักงานคนอื่นได้' });
      }
    }

    if (password && password.trim() !== '') {
      pwHash = crypto.createHash('sha256').update(password).digest('hex');
    } else if (existingRow && existingRow.password_hash) {
      pwHash = existingRow.password_hash;
    } else {
      pwHash = crypto.createHash('sha256').update('password123').digest('hex');
    }

    const activeFlag = typeof isActive === 'boolean' ? isActive : (existingRow ? existingRow.is_active !== false : true);

    await pool.query(
      `INSERT INTO users (id, name, email, avatar, global_role, department, gender, birthday, skills, password_hash, wfh_days, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
         wfh_days = EXCLUDED.wfh_days,
         is_active = EXCLUDED.is_active`,
      [id, cleanName, email, avatar, globalRole, department, gender, birthday, skills, pwHash, wfhDays || [], activeFlag]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'users_email_key') {
      try {
        const activeFlag = typeof isActive === 'boolean' ? isActive : true;
        await pool.query(
          `UPDATE users SET
             id = $1, name = $2, avatar = $3,
             global_role = $4, department = $5,
             gender = $6, birthday = $7, skills = $8,
             password_hash = $9, wfh_days = $10, is_active = $11
           WHERE email = $12`,
          [id, cleanName, avatar, globalRole, department, gender, birthday, skills, pwHash, wfhDays || [], activeFlag, email]
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

// Admin endpoint to Enable / Disable (Inactive) a user
router.patch('/api/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const requesterId = req.headers['x-user-id'];

  try {
    if (requesterId) {
      const reqRes = await pool.query('SELECT global_role FROM users WHERE id = $1', [requesterId]);
      if (reqRes.rows[0]?.global_role !== 'Admin') {
        return res.status(403).json({ error: 'เฉพาะ Admin เท่านั้นที่สามารถเปิด/ระงับการใช้งานผู้ใช้งานได้' });
      }
      if (requesterId === id && isActive === false) {
        return res.status(400).json({ error: 'ไม่สามารถระงับการใช้งานบัญชีของตัวเองได้' });
      }
    }

    await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [Boolean(isActive), id]);
    res.json({ success: true, id, isActive: Boolean(isActive) });
  } catch (err) {
    console.error('Error updating user status:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete user (Only Admin; blocked if user is still a member of an active project)
router.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'];

  try {
    if (requesterId) {
      const reqRes = await pool.query('SELECT global_role FROM users WHERE id = $1', [requesterId]);
      if (reqRes.rows[0]?.global_role !== 'Admin') {
        return res.status(403).json({ error: 'เฉพาะ Admin เท่านั้นที่สามารถลบผู้ใช้งานได้' });
      }
      if (requesterId === id) {
        return res.status(400).json({ error: 'ไม่สามารถลบบัญชีของตัวเองที่กำลังใช้งานอยู่ได้' });
      }
    }

    // Check if user is still assigned as a member in any existing project
    const projsRes = await pool.query('SELECT id, name, members FROM projects');
    const linkedProjects = projsRes.rows.filter(p =>
      Array.isArray(p.members) && p.members.some(m => m && m.userId === id)
    );

    if (linkedProjects.length > 0) {
      return res.status(400).json({
        error: `ไม่สามารถลบผู้ใช้งานที่ยังอยู่ในโปรเจกต์ (${linkedProjects.map(p => p.name).join(', ')}) ได้ กรุณาใช้การปรับสถานะเป็น Inactive แทน (หรือลบได้หลังจากโปรเจกต์ถูกลบแล้ว)`,
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE tasks SET assignee_id = NULL WHERE assignee_id = $1 AND status != 'Done'`, [id]);
      await client.query('DELETE FROM users WHERE id = $1', [id]);
      await client.query('COMMIT');
      res.json({ success: true, action: 'deleted' });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
