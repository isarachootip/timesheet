import express from 'express';
import { pool } from '../config/db.js';
import { sendEmail } from '../../mailService.js';

const router = express.Router();

// Timesheets REST API
router.post('/api/timesheets', async (req, res) => {
  const { id, userId, projectId, taskId, date, hours, plannedHours, startTime, endTime, description, status, approvedBy, approvedAt, imageUrl, workResults, isWfh } = req.body;
  const updatedAt = new Date().toISOString();
  try {
    // Check existing status before update to detect transitions
    const existingTimesheet = await pool.query('SELECT status FROM timesheets WHERE id = $1', [id]);
    const oldStatus = existingTimesheet.rows[0]?.status;

    await pool.query(
      `INSERT INTO timesheets (id, user_id, project_id, task_id, date, hours, planned_hours, start_time, end_time, description, status, approved_by, approved_at, image_url, work_results, updated_at, is_wfh)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         project_id = EXCLUDED.project_id,
         task_id = EXCLUDED.task_id,
         date = EXCLUDED.date,
         hours = EXCLUDED.hours,
         planned_hours = EXCLUDED.planned_hours,
         start_time = EXCLUDED.start_time,
         end_time = EXCLUDED.end_time,
         description = EXCLUDED.description,
         status = EXCLUDED.status,
         approved_by = EXCLUDED.approved_by,
         approved_at = EXCLUDED.approved_at,
         image_url = EXCLUDED.image_url,
         work_results = EXCLUDED.work_results,
         updated_at = EXCLUDED.updated_at,
         is_wfh = EXCLUDED.is_wfh`,
      [id, userId, projectId, taskId, date, hours, plannedHours ?? null, startTime || null, endTime || null, description, status, approvedBy, approvedAt, imageUrl || null, workResults || null, updatedAt, isWfh ?? false]
    );

    // Send email notifications asynchronously (non-blocking)
    if (oldStatus !== status) {
      (async () => {
        try {
          // Fetch employee details
          const employeeRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [userId]);
          const employee = employeeRes.rows[0];
          if (!employee) return;

          // Fetch project details
          const projectRes = await pool.query('SELECT name, members FROM projects WHERE id = $1', [projectId]);
          const project = projectRes.rows[0];
          if (!project) return;

          if (status === 'Pending') {
            // Find PM of this project
            const members = project.members || [];
            const pmMember = members.find(m => m.role === 'PM' || m.role === 'Team Lead' || m.role === 'Leader');
            if (pmMember) {
              const pmRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [pmMember.userId]);
              const pm = pmRes.rows[0];
              if (pm && pm.email) {
                // Send email to PM
                const subject = `[NexTime] Timesheet Pending Approval: ${employee.name} - ${project.name}`;
                const html = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fdfdfd;">
                    <div style="text-align: center; border-bottom: 2px solid #06C755; padding-bottom: 15px; margin-bottom: 20px;">
                      <h2 style="color: #333; margin: 0;">NexTime Project Management</h2>
                      <span style="color: #666; font-size: 0.9em;">Timesheet Approval Request</span>
                    </div>
                    <p>Dear <strong>${pm.name}</strong>,</p>
                    <p>A new timesheet entry has been submitted for your approval by <strong>${employee.name}</strong>.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                      <tr style="background-color: #f2f2f2;">
                        <th style="text-align: left; padding: 10px; border: 1px solid #ddd; width: 30%;">Project</th>
                        <td style="padding: 10px; border: 1px solid #ddd;">${project.name}</td>
                      </tr>
                      <tr>
                        <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Date</th>
                        <td style="padding: 10px; border: 1px solid #ddd;">${date}</td>
                      </tr>
                      <tr style="background-color: #f2f2f2;">
                        <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Hours</th>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>${hours} hours</strong></td>
                      </tr>
                      <tr>
                        <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Description</th>
                        <td style="padding: 10px; border: 1px solid #ddd;">${description || 'No description provided.'}</td>
                      </tr>
                    </table>
                    <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
                      <a href="https://vibeproject.online" style="background-color: #06C755; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Team Approvals</a>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
                    <p style="font-size: 0.8em; color: #999; text-align: center;">This is an automated email from NexTime. Please do not reply directly to this message.</p>
                  </div>
                `;
                await sendEmail({ to: pm.email, subject, html });
              }
            }
          } else if (status === 'Approved' || status === 'Rejected') {
            if (employee.email) {
              // Fetch PM name who approved/rejected
              let pmName = 'Project Manager';
              if (approvedBy) {
                const pmRes = await pool.query('SELECT name FROM users WHERE id = $1', [approvedBy]);
                if (pmRes.rows[0]) {
                  pmName = pmRes.rows[0].name;
                }
              }
              
              const isApproved = status === 'Approved';
              const statusColor = isApproved ? '#06C755' : '#ff4d4f';
              
              const subject = `[NexTime] Timesheet ${status}: ${project.name}`;
              const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fdfdfd;">
                  <div style="text-align: center; border-bottom: 2px solid ${statusColor}; padding-bottom: 15px; margin-bottom: 20px;">
                    <h2 style="color: #333; margin: 0;">NexTime Project Management</h2>
                    <span style="color: ${statusColor}; font-size: 1.1em; font-weight: bold;">Timesheet Entry ${status}</span>
                  </div>
                  <p>Dear <strong>${employee.name}</strong>,</p>
                  <p>Your timesheet entry for project <strong>${project.name}</strong> has been <strong><span style="color: ${statusColor};">${status.toLowerCase()}</span></strong> by ${pmName}.</p>
                  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background-color: #f2f2f2;">
                      <th style="text-align: left; padding: 10px; border: 1px solid #ddd; width: 30%;">Project</th>
                      <td style="padding: 10px; border: 1px solid #ddd;">${project.name}</td>
                    </tr>
                    <tr>
                      <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Date</th>
                      <td style="padding: 10px; border: 1px solid #ddd;">${date}</td>
                    </tr>
                    <tr style="background-color: #f2f2f2;">
                      <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Hours</th>
                      <td style="padding: 10px; border: 1px solid #ddd;"><strong>${hours} hours</strong></td>
                    </tr>
                    <tr>
                      <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Description</th>
                      <td style="padding: 10px; border: 1px solid #ddd;">${description || 'No description provided.'}</td>
                    </tr>
                  </table>
                  <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
                    <a href="https://vibeproject.online" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View My Timesheet</a>
                  </div>
                  <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
                  <p style="font-size: 0.8em; color: #999; text-align: center;">This is an automated email from NexTime. Please do not reply directly to this message.</p>
                </div>
              `;
              await sendEmail({ to: employee.email, subject, html });
            }
          }
        } catch (mailErr) {
          console.error('⚠️ Failed to process notification emails:', mailErr.message);
        }
      })();
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error saving timesheet:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/api/timesheets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM timesheets WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting timesheet:', err);
    res.status(500).json({ error: err.message });
  }
});



export default router;
