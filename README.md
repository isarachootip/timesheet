# ⏱️ NexTime — Project & Timesheet Management System

> **NexTime** เป็นระบบเว็บแอปพลิเคชันระดับองค์กรสำหรับบริหารจัดการโครงการ (Project Management), บันทึกเวลาทำงาน (Timesheet Logging), วางแผนการทำงานแบบอไจล์ (Agile Kanban Board, Sprints & Releases), และการตรวจสอบอนุมัติเวลางานของทีมงานอย่างมีประสิทธิภาพ มาพร้อมระบบ **Chatbot** ผู้ช่วยอัจฉริยะ, **Permission Schemes** สำหรับปรับแต่งสิทธิ์การใช้งานแบบยืดหยุ่น, **Cost Rates** สำหรับคำนวณต้นทุนโครงการ, **Project Baselines** สำหรับเปรียบเทียบแผนงาน และ **Notification Bell** สำหรับแจ้งเตือนงานที่ครบกำหนด พร้อมดีไซน์สุดพรีเมียมในรูปแบบ Dark Mode และ Glassmorphism

---

## 📚 เอกสารคู่มือระบบ (Documentation & Manuals)

| เอกสาร | สำหรับกลุ่มผู้ใช้งาน | รายละเอียดและลิงก์ |
|---|---|---|
| 📘 **[SA System & Architecture Guide](docs/SA_SYSTEM_GUIDE.md)** | System Analysts, Developers, DevOps, DBA | สถาปัตยกรรมระบบ, โครงสร้างฐานข้อมูล (ERD/Data Dictionary), REST API Spec, Security & Permission Schemes, ตรรกะการคำนวณเชิงลึก, การ Deploy บน Nixpacks/Coolify |
| 🎓 **[Trainer & Training Courseware Manual](docs/TRAINER_MANUAL.md)** | Trainers, PMs, Team Leads, Users | แผนการสอน (Curriculum), การอบรมแบ่งตาม Role (Employee, PM, Executive, Admin), แบบฝึกหัดภาคปฏิบัติ (Labs 1-4), สรุปขั้นตอนและเทคนิคสำหรับวิทยากร |
| 📖 **[User Manual (End-User)](user_manual.md)** | พนักงานและผู้ใช้งานทั่วไปทุกคน | คู่มือการใช้งานระบบฉบับเต็มทีละขั้นตอนพร้อมภาพประกอบ |
| ⚙️ **[System Setup Guide](system_setup.md)** | ผู้ดูแลระบบและผู้พัฒนาระบบ | การรันระบบในเครื่อง Development, การตั้งค่า `.env`, การเชื่อมต่อ PostgreSQL |
| 🗄️ **[Database Setup Guide](database_setup_guide.md)** | DBA & System Administrators | การตั้งค่าและสร้างฐานข้อมูล PostgreSQL บน VPS |

---

## 🚀 การเริ่มต้นใช้งานในสภาพแวดล้อม Development

### 1. ติดตั้ง Dependencies
```powershell
npm install
```

### 2. กำหนดค่าไฟล์ `.env`
สร้างไฟล์ `.env` ใน Root Directory:
```env
DATABASE_URL=postgresql://isara_admin:MySecretPass123!@187.77.147.16:5432/timesheet_db
PORT=3000
```

### 3. รันระบบ (ต้องเปิด 2 Terminals)
```powershell
# Terminal 1: Backend Express Server (Port 3000)
npm run start

# Terminal 2: Frontend Vite Server (Port 5173)
npm run dev
```

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend:** React 18, TypeScript, Vite, TanStack React Query v5, Lucide React, Glassmorphism CSS
- **Backend:** Node.js (ES Modules), Express.js, PostgreSQL (`pg` pool), Nodemailer, LINE Login API, Gemini AI
- **Database:** PostgreSQL 15+ Hosted on VPS
- **Deployment:** Nixpacks, Docker, Coolify
