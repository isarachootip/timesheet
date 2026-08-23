import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import { pool } from '../config/db.js';

const router = express.Router();

// Chatbot API Endpoint
router.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const keyRes = await pool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'gemini_api_key'");
    const apiKey = keyRes.rows[0]?.setting_value;

    if (apiKey) {
      const systemPrompt = `คุณคือ AI Assistant ประจำระบบ NexTime (ระบบบริหารจัดการโปรเจกต์และทรัพยากรบุคคล)
หน้าที่ของคุณคือช่วยเหลือผู้ใช้งาน ตอบคำถามเกี่ยวกับการใช้งานระบบ โดยอ้างอิงจากคู่มือ (FAQ) ต่อไปนี้:
1. ฟีเจอร์หลัก: Agile Task Management, Gantt Chart, Timesheet, Man-Days Tracking, AI Assistant, RBAC
2. การคำนวณ Progress: ถ้าไม่มี Subtask ลากไป In Progress=50%, Review=90%, Done=100%. ถ้ามี Subtask คำนวณจากสัดส่วน Subtask ที่เสร็จ
3. วิธีลบข้อมูล: Timesheet ลบได้ที่หน้าประวัติ, Task ลบได้ที่ไอคอนบนการ์ด หรือหน้า Backlog
4. การย้าย Sprint: ไปที่หน้า Backlog กด Dropdown หลังชื่อ Task เพื่อเปลี่ยน Sprint
5. การเก็บข้อมูล: ข้อมูลแอปเก็บใน PostgreSQL บนเซิร์ฟเวอร์, ความจำ AI เก็บในโฟลเดอร์ .agents
6. Timesheet: Monthly Summary คือชั่วโมงรวมเดือนนี้ (เป้า 160h), Approval Status แสดงชั่วโมงที่อนุมัติแล้วเทียบกับรออนุมัติ (คนอนุมัติคือ Admin, Manager, PM)
7. Issue Type: Story(ฟีเจอร์ลูกค้า), Task(งานเทคนิค), Bug(แก้ข้อผิดพลาด)
8. SP (Story Points): ประเมินความยากง่ายตาม Fibonacci (1,2,3,5,8...) 1 SP คืองานง่ายสุด
9. Timeline & Releases: Timeline คือปฏิทิน Gantt Chart ลากปรับเวลาได้, Releases คือจัดกลุ่มฟีเจอร์อัปเดต
10. Project Roles: ในหน้า Team คือประวัติ(Resume) ว่าใครทำโปรเจกต์อะไรบ้าง ดึงอัตโนมัติ และจะลบอัตโนมัติถ้าถูกเอาชื่อออก
11. แผนงานไม่ขึ้นหลังสร้างโปรเจกต์: ให้รีเฟรชหน้าเว็บ (F5) หรือดูว่าไม่ได้ใส่ End Date ตอนสร้างโปรเจกต์หรือไม่ (ถ้าไม่มี ให้ไปสร้างเองที่เมนู Project Plan)
ตอบคำถามด้วยความสุภาพ เป็นกันเอง เสมือนเป็นเพื่อนร่วมงาน`;

      try {
        const genAI = new GoogleGenerativeAI(apiKey.trim());
        const model = genAI.getGenerativeModel({ 
          model: "gemini-flash-latest",
          systemInstruction: systemPrompt
        });

        const result = await model.generateContent(message);
        const responseText = result.response.text();

        return res.json({ reply: responseText });
      } catch (geminiErr) {
        console.error('Gemini SDK Error:', geminiErr);
        return res.json({ reply: `[Gemini API Error] ${geminiErr.message || 'Unknown SDK Error'}` });
      }



      }

    // Basic Rule-based mock response
    let reply = 'ขออภัยครับ ตอนนี้ผมเป็นเพียงบอททดสอบ ยังไม่สามารถตอบคำถามซับซ้อนได้ครับ (ตั้งค่า API Key เพื่อใช้งาน AI)';
    const msgLower = message.toLowerCase();
    
    if (msgLower.includes('สวัสดี') || msgLower.includes('hello') || msgLower.includes('หวัดดี')) {
      reply = 'สวัสดีครับ! ยินดีต้อนรับสู่ระบบ NexTime มีอะไรให้ผมช่วยเหลือไหมครับ?';
    } else if (msgLower.includes('ราคา') || msgLower.includes('แพ็กเกจ') || msgLower.includes('จ่าย')) {
      reply = 'สำหรับข้อมูลราคาและแพ็กเกจการใช้งาน รบกวนติดต่อทีมฝ่ายขายได้เลยครับ ยินดีให้คำปรึกษาครับ';
    } else if (msgLower.includes('ปัญหา') || msgLower.includes('เข้าไม่ได้') || msgLower.includes('พัง')) {
      reply = 'หากพบปัญหาการใช้งาน สามารถแจ้งเรื่องให้ทีม Support ทราบได้เลยครับ เราจะรีบแก้ไขให้เร็วที่สุด';
    }

    // Simulate AI thinking delay
    setTimeout(() => {
      res.json({ reply });
    }, 1000);
  } catch (err) {
    console.error('Chat Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Project Messages API (Chat)
router.get('/api/projects/:projectId/messages', async (req, res) => {
  const { projectId } = req.params;
  try {
    const messagesRes = await pool.query('SELECT * FROM project_messages WHERE project_id = $1 ORDER BY created_at ASC', [projectId]);
    const messages = messagesRes.rows.map(m => ({
      id: m.id,
      projectId: m.project_id,
      userId: m.user_id,
      text: m.text,
      timestamp: m.created_at,
      attachments: m.attachments || []
    }));
    res.json(messages);
  } catch (err) {
    console.error('Error fetching project messages:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/projects/:projectId/messages', async (req, res) => {
  const { projectId } = req.params;
  const { userId, text, attachments, mentionedUserIds } = req.body;
  
  if (!userId || !text) {
    return res.status(400).json({ error: 'Missing userId or text' });
  }

  const id = 'msg_' + crypto.randomUUID();
  const safeAttachments = attachments || [];
  
  try {
    await pool.query(
      'INSERT INTO project_messages (id, project_id, user_id, text, attachments) VALUES ($1, $2, $3, $4, $5)',
      [id, projectId, userId, text, JSON.stringify(safeAttachments)]
    );
    
    // Create notifications for mentioned users
    if (mentionedUserIds && Array.isArray(mentionedUserIds)) {
      for (const targetUserId of mentionedUserIds) {
        if (targetUserId === userId) continue; // Don't notify self
        
        const notifId = 'notif_' + crypto.randomUUID();
        // Determine type based on message text or sender context if needed. Default to 'chat'
        const type = text.includes('approval') ? 'approval' : (text.includes('system') ? 'system' : 'chat');
        await pool.query(
          'INSERT INTO chat_notifications (id, user_id, project_id, message_id, sender_id, text, type) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [notifId, targetUserId, projectId, id, userId, text, type]
        );
      }
    }
    
    // Fetch and return the inserted message to ensure timestamp is correct
    const newMsgRes = await pool.query('SELECT * FROM project_messages WHERE id = $1', [id]);
    const m = newMsgRes.rows[0];
    
    res.status(201).json({
      id: m.id,
      projectId: m.project_id,
      userId: m.user_id,
      text: m.text,
      timestamp: m.created_at,
      attachments: m.attachments || []
    });
  } catch (err) {
    console.error('Error creating project message:', err);
    res.status(500).json({ error: err.message });
  }
});

// Chat Notifications APIs
router.get('/api/users/:userId/chat-notifications', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(`
      SELECT n.*, u.name as sender_name, u.avatar as sender_avatar, p.name as project_name
      FROM chat_notifications n
      JOIN users u ON n.sender_id = u.id
      JOIN projects p ON n.project_id = p.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
    `, [userId]);
    
    const notifications = result.rows.map(n => ({
      id: n.id,
      userId: n.user_id,
      projectId: n.project_id,
      messageId: n.message_id,
      senderId: n.sender_id,
      senderName: n.sender_name,
      senderAvatar: n.sender_avatar,
      projectName: n.project_name,
      text: n.text,
      isRead: n.is_read,
      type: n.type || 'chat',
      createdAt: n.created_at
    }));
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching chat notifications:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/chat-notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE chat_notifications SET is_read = TRUE WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/users/:userId/projects/:projectId/chat-notifications/read', async (req, res) => {
  const { userId, projectId } = req.params;
  try {
    await pool.query('UPDATE chat_notifications SET is_read = TRUE WHERE user_id = $1 AND project_id = $2', [userId, projectId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking project notifications as read:', err);
    res.status(500).json({ error: err.message });
  }
});



export default router;
