# 📘 NexTime — System Analyst & Architecture Guide (คู่มือวิเคราะห์และสถาปัตยกรรมระบบ)

> **เอกสารสำหรับ:** System Analyst (SA), Software Engineer, Solutions Architect, Database Administrator (DBA), System Administrator  
> **เวอร์ชันระบบ:** NexTime Enterprise v2.5  
> **ภาษา/เทคโนโลยี:** React 18 + TypeScript + Vite | Node.js (Express ES Modules) | PostgreSQL 15+ | Docker / Nixpacks  
> **วันที่จัดทำ:** สิงหาคม 2026  

---

## 📑 สารบัญ (Table of Contents)

1. [ภาพรวมสถาปัตยกรรมระบบ (System Architecture Overview)](#1-ภาพรวมสถาปัตยกรรมระบบ-system-architecture-overview)
   - 1.1 ไดอะแกรมสถาปัตยกรรม (High-Level Architecture Diagram)
   - 1.2 เทคโนโลยีสแตก (Technology Stack & Tooling)
   - 1.3 โมเดลการประมวลผลและการจัดส่งข้อมูล (Data Flow & State Management)
2. [โครงสร้างฐานข้อมูลและพจนานุกรมข้อมูล (Database Schema & Data Dictionary)](#2-โครงสร้างฐานข้อมูลและพจนานุกรมข้อมูล-database-schema--data-dictionary)
   - 2.1 Entity Relationship Diagram (ERD)
   - 2.2 รายละเอียดตารางและความสัมพันธ์ (Table Definitions & Foreign Keys)
   - 2.3 การออกแบบ Snapshot & Baseline Versioning
   - 2.4 Indexing & Query Optimization Strategies
3. [ข้อกำหนดและสเปกของ API (REST API Specification)](#3-ข้อกำหนดและสเปกของ-api-rest-api-specification)
   - 3.1 มาตรฐานการสื่อสารและการยืนยันตัวตน (Authentication & Headers)
   - 3.2 Authentication & User Endpoints
   - 3.3 Projects & Workflows Endpoints
   - 3.4 Tasks, Subtasks & Sprints Endpoints
   - 3.5 Timesheets & Approvals Endpoints
   - 3.6 Project Chat, Mentions & Notifications Endpoints
   - 3.7 Cost Rates, Permission Schemes & System Endpoints
   - 3.8 Webhooks Integration (GitHub / GitLab)
4. [สถาปัตยกรรมความปลอดภัยและสิทธิ์การเข้าถึง (Security & Permission Architecture)](#4-สถาปัตยกรรมความปลอดภัยและสิทธิ์การเข้าถึง-security--permission-architecture)
   - 4.1 Two-Tiered Role System (Global Roles vs. Project Roles)
   - 4.2 Dynamic Permission Scheme Engine (สิทธิ์ 9 มิติ)
   - 4.3 Workflow State Transition Enforcement
   - 4.4 Data Protection & Password Hashing (SHA-256)
5. [ตรรกะการคำนวณและกฎทางธุรกิจเชิงลึก (Business Logic & Algorithms)](#5-ตรรกะการคำนวณและกฎทางธุรกิจเชิงลึก-business-logic--algorithms)
   - 5.1 Project Baseline Drift & Slippage Calculation
   - 5.2 Progress Rollup & Hour Budgeting Hierarchy
   - 5.3 Labor Cost Calculation (Hourly Rates, MTD, YTD & Burn Rate)
   - 5.4 Timesheet Approval State Machine & Lock Mechanism
   - 5.5 Git Commit Message Parser & Automatic Task Movement
6. [คู่มือการติดตั้งและการนำระบบขึ้นใช้งาน (Deployment & DevOps Guide)](#6-คู่มือการติดตั้งและการนำระบบขึ้นใช้งาน-deployment--devops-guide)
   - 6.1 โครงสร้างไฟล์ในระบบ (Project Directory Structure)
   - 6.2 ตัวแปรสภาพแวดล้อม (Environment Variables `.env`)
   - 6.3 Local Development Setup (Dual-Process Model)
   - 6.4 การ Deploy บน Cloud / VPS ด้วย Nixpacks & Coolify
   - 6.5 Database Migration & Data Seeding
7. [การบำรุงรักษาและการแก้ไขปัญหา (Maintenance & Troubleshooting for SA)](#7-การบำรุงรักษาและการแก้ไขปัญหา-maintenance--troubleshooting-for-sa)
   - 7.1 Diagnostic APIs & Health Checks
   - 7.2 Common Error Scenarios & Resolution Playbook
   - 7.3 Database Reset & Cleanup Protocols

---

## 1. ภาพรวมสถาปัตยกรรมระบบ (System Architecture Overview)

### 1.1 ไดอะแกรมสถาปัตยกรรม (High-Level Architecture Diagram)

```mermaid
graph TD
    Client["💻 Client Browsers (Desktop & Mobile Responsive)"]
    
    subgraph Frontend["🎨 Frontend Tier (Port 5173 / Production Dist)"]
        React["React 18 + TypeScript + Vite SPA"]
        TanStack["TanStack React Query v5 (Data Caching & Polling)"]
        Router["React Router DOM (Client Routing)"]
        Styles["Glassmorphism UI Engine (Vanilla CSS Tokens)"]
        React --> TanStack
        React --> Router
        React --> Styles
    end

    subgraph Gateway["🛡️ Ingress / Proxy Layer"]
        Nginx["Nginx / Coolify Reverse Proxy (Port 80/443 SSL)"]
    end

    subgraph Backend["⚙️ Application Tier (Port 3000)"]
        Express["Express.js Server (Node.js ES Modules)"]
        AuthMiddleware["Header-based Auth & Role Interceptor"]
        RouterModules["Modular Route Handlers (/api/*)"]
        MailService["Nodemailer SMTP Dispatcher"]
        ChatEngine["Polling & Notification Dispatcher"]
        GitWebhook["Git Webhook Parser (GitHub/GitLab)"]
        
        Express --> AuthMiddleware
        AuthMiddleware --> RouterModules
        RouterModules --> MailService
        RouterModules --> ChatEngine
        RouterModules --> GitWebhook
    end

    subgraph External["🌐 External Integrations"]
        LINE["LINE Login OAuth 2.0 API"]
        GitService["GitHub / GitLab Webhooks"]
        GeminiAI["Google Gemini / AI LLM API"]
        SMTP["Corporate SMTP Mail Server"]
    end

    subgraph Database["🗄️ Persistence Tier (PostgreSQL 15+)"]
        PG["PostgreSQL Database (timesheet_db:5432)"]
        Pool["pg.Pool Connection Pooling (20 Max Connections)"]
        Tables["Tables: users, projects, tasks, timesheets, baselines, etc."]
        Pool --> Tables
    end

    Client --> Gateway
    Gateway --> Frontend
    Gateway --> Express
    TanStack <-->|REST JSON APIs| RouterModules
    RouterModules <--> Pool
    Pool <--> PG
    
    Express <--> LINE
    GitService -->|POST Commits| GitWebhook
    Express <--> GeminiAI
    MailService --> SMTP
```

### 1.2 เทคโนโลยีสแตก (Technology Stack & Tooling)

| หมวดหมู่ (Category) | เทคโนโลยีที่เลือกใช้ (Technology) | เวอร์ชัน / รายละเอียด | เหตุผลทางสถาปัตยกรรม (Architectural Rationale) |
|---|---|---|---|
| **Frontend Framework** | React + TypeScript | v18.3.x | Single Page Application (SPA) ที่มี Type Safety สูง ลด Run-time Type Errors |
| **Build & Bundler** | Vite | v6.x | Fast HMR (Hot Module Replacement) และ Production Tree-shaking ที่รวดเร็ว |
| **Server State Mgmt** | @tanstack/react-query | v5.x | จัดการ Caching, Background Refetching, Optimistic Updates และ Invalidations |
| **Styling & Theme** | Vanilla CSS + Tokens | CSS3 / Glassmorphism | ไร้ Dependency ภายนอก (No Tailwind overhead), ควบคุม CSS Custom Variables ได้เบ็ดเสร็จ |
| **Iconography** | Lucide React | v0.4.x | Lightweight SVG Icons ครบถ้วนทุกฟังก์ชันของระบบ |
| **Backend Runtime** | Node.js (ES Modules) | v20+ LTS | รองรับ Native ES Modules (`import/export`), Non-blocking I/O รองรับ Concurrent Requests |
| **Backend Framework** | Express.js | v4.21.x | Minimalist HTTP Framework, Modular Routing ง่ายต่อการ Maintenance |
| **Database** | PostgreSQL | v15 / v16 | Relational DB ที่รองรับ JSONB data types, Transactional Integrity และ Complex Joins |
| **DB Driver / Pool** | `pg` (node-postgres) | v8.11.x | High-performance Connection Pooling พร้อมรองรับ SSL/TLS Connection |
| **External Auth** | LINE Login v2.1 | OAuth 2.0 Authorization Code | สะดวกสบายสำหรับพนักงานองค์กรในประเทศไทย รองรับ Auto-binding ผ่าน Email |
| **Mail Dispatcher** | Nodemailer | v6.9.x | ส่ง Email แจ้งเตือนสถานะใบลงเวลาและงาน Overdue อัตโนมัติ |
| **Container / Deploy** | Nixpacks / Coolify | Containerized | Multi-stage build รองรับทั้ง Static Front + Node Backend ภายใน Instance เดียว |

### 1.3 โมเดลการประมวลผลและการจัดส่งข้อมูล (Data Flow & State Management)

1. **Client Request Lifecycle:**
   - ผู้ใช้ดำเนินการใดๆ บน UI $\rightarrow$ React Query Mutation ส่ง HTTP Request ไปยัง Express API พร้อมแนบ Custom Header `x-user-id` สำหรับ Context การตรวจสอบสิทธิ์
   - Express Route Handler รับ Request $\rightarrow$ ตรวจสอบสิทธิ์ (Global Role / Project Role) ผ่าน Database Query $\rightarrow$ ดำเนินการ Transaction ผ่าน `pg.Pool`
   - Response ข้อมูล JSON ถูกส่งกลับ $\rightarrow$ React Query ทำการ `invalidateQueries()` อัปเดต Cache ใน Client ทันทีโดยไม่ต้อง Reload หน้าเว็บ
2. **Notification & Real-time Synchronization:**
   - Client ทำการ Polling ผ่าน React Query ทุกๆ 5 วินาที สำหรับรายการ `@mentions`, Chat Notifications และ Task Alerts
   - ข้อมูลแจ้งเตือนจะถูกคำนวณและตอบสนองแบบเบา (Lightweight Payload) เพื่อประหยัด Network Bandwidth

---

## 2. โครงสร้างฐานข้อมูลและพจนานุกรมข้อมูล (Database Schema & Data Dictionary)

### 2.1 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o{ projects : "participates via members JSONB"
    users ||--o{ tasks : "assigned_to"
    users ||--o{ timesheets : "logs"
    users ||--o{ project_messages : "sends"
    users ||--o{ chat_notifications : "receives"
    users ||--o{ project_baselines : "creates"

    permission_schemes ||--o{ projects : "governs"
    projects ||--|| project_workflows : "has_custom"
    projects ||--o{ sprints : "contains"
    projects ||--o{ releases : "contains"
    projects ||--o{ tasks : "contains"
    projects ||--o{ timesheets : "contains"
    projects ||--o{ project_baselines : "tracks"
    projects ||--o{ project_messages : "hosts"

    tasks ||--o{ tasks : "parent_of_subtask (parent_id)"
    tasks ||--o{ timesheets : "logged_against"
    tasks ||--o{ task_commits : "referenced_in"
    sprints ||--o{ tasks : "groups"
    releases ||--o{ tasks : "targets"

    project_baselines ||--o{ task_snapshots : "contains"
```

### 2.2 รายละเอียดตารางและความสัมพันธ์ (Table Definitions & Data Dictionary)

#### 1. ตาราง `users` (ผู้ใช้งานระบบ)
จัดเก็บข้อมูลโปรไฟล์พนักงาน สิทธิ์ระดับระบบ และการตั้งค่าส่วนบุคคล
| ชื่อคอลัมน์ (Column) | ชนิดข้อมูล (Type) | Constraints | คำอธิบาย (Description) |
|---|---|---|---|
| `id` | `VARCHAR(50)` | `PRIMARY KEY` | รหัสผู้ใช้งาน (เช่น `u1`, `u_admin`) |
| `name` | `VARCHAR(100)` | `NOT NULL` | ชื่อ-นามสกุลพนักงาน |
| `email` | `VARCHAR(150)` | `NOT NULL, UNIQUE` | อีเมลบริษัท (ใช้เป็น Primary Identity) |
| `avatar` | `TEXT` | `NULL` | ลิงก์ URL รูปโปรไฟล์ |
| `global_role` | `VARCHAR(50)` | `NOT NULL` | สิทธิ์ระดับระบบ (`Admin`, `Manager`, `Employee`, `User`) |
| `department` | `VARCHAR(100)` | `NULL` | แผนก/ฝ่าย (เช่น `Engineering`, `Management`, `Design`) |
| `gender` | `VARCHAR(50)` | `NULL` | เพศ (`Male`, `Female`, `Other`) |
| `birthday` | `VARCHAR(50)` | `NULL` | วันเกิด รูปแบบ `YYYY-MM-DD` |
| `skills` | `TEXT[]` | `DEFAULT '{}'` | รายการทักษะความสามารถ (เช่น `['React', 'PostgreSQL']`) |
| `line_user_id` | `VARCHAR(100)` | `UNIQUE, NULL` | LINE UID สำหรับการยืนยันตัวตนผ่าน LINE Login |
| `password_hash`| `VARCHAR(255)` | `NULL` | รหัสผ่านเข้ารหัสแบบ SHA-256 Hex Digest |
| `wfh_days` | `TEXT[]` | `DEFAULT '{}'` | วันที่กำหนด WFH ประจำสัปดาห์ (เช่น `['Monday', 'Wednesday']`) |

#### 2. ตาราง `permission_schemes` (แผนผังสิทธิ์การใช้งาน)
จัดเก็บโครงสร้างการอนุญาตระดับฟังก์ชันของแต่ละบทบาทในโครงการ
| ชื่อคอลัมน์ (Column) | ชนิดข้อมูล (Type) | Constraints | คำอธิบาย (Description) |
|---|---|---|---|
| `id` | `VARCHAR(50)` | `PRIMARY KEY` | รหัสแผนผังสิทธิ์ (เช่น `scheme_default`) |
| `name` | `VARCHAR(150)` | `NOT NULL` | ชื่อแผนผังสิทธิ์ |
| `description` | `TEXT` | `NULL` | คำอธิบายขอบเขตการใช้งาน |
| `permissions` | `JSONB` | `NOT NULL` | โครงสร้างสิทธิ์ 9 ฟังก์ชันในรูปแบบ JSON Key-Value |

#### 3. ตาราง `projects` (โครงการ)
| ชื่อคอลัมน์ (Column) | ชนิดข้อมูล (Type) | Constraints | คำอธิบาย (Description) |
|---|---|---|---|
| `id` | `VARCHAR(50)` | `PRIMARY KEY` | รหัสโครงการ (เช่น `p1`, `p2`) |
| `name` | `VARCHAR(150)` | `NOT NULL` | ชื่อโครงการ |
| `description` | `TEXT` | `NULL` | ขอบเขตและรายละเอียดโครงการ |
| `status` | `VARCHAR(50)` | `NOT NULL` | สถานะ (`Planning`, `Active`, `On Hold`, `Completed`) |
| `start_date` | `DATE` / `VARCHAR` | `NOT NULL` | วันเริ่มต้นโครงการ (`YYYY-MM-DD`) |
| `end_date` | `DATE` / `VARCHAR` | `NULL` | วันสิ้นสุดโครงการตามแผน (`YYYY-MM-DD`) |
| `budget` | `NUMERIC` | `DEFAULT 0` | งบประมาณโครงการรวม (THB) |
| `members` | `JSONB` | `DEFAULT '[]'` | รายชื่อสมาชิกและบทบาทในโครงการ `[{userId, role}]` |
| `custom_columns`| `JSONB` | `DEFAULT '["To Do", ...]'` | คอลัมน์ Kanban Board ประจำโครงการ |
| `permission_scheme_id` | `VARCHAR(50)` | `REFERENCES permission_schemes(id)` | Scheme สิทธิ์ที่โครงการนี้ผูกใช้งาน |
| `project_type` | `VARCHAR(50)` | `DEFAULT 'dev'` | ประเภทโครงการ (`dev` = พัฒนาซอฟต์แวร์, `support` = งานดูแลระบบ) |
| `support_task_style` | `VARCHAR(50)` | `DEFAULT 'categories'` | รูปแบบการแสดงผลสำหรับ Support Project |

#### 4. ตาราง `tasks` (งานและงานย่อย)
| ชื่อคอลัมน์ (Column) | ชนิดข้อมูล (Type) | Constraints | คำอธิบาย (Description) |
|---|---|---|---|
| `id` | `VARCHAR(50)` | `PRIMARY KEY` | รหัสงาน (เช่น `t1`, `t_1718000000`) |
| `project_id` | `VARCHAR(50)` | `NOT NULL, FK -> projects(id)` | โครงการที่งานนี้สังกัด |
| `assignee_id` | `VARCHAR(50)` | `FK -> users(id) ON DELETE SET NULL` | ผู้รับผิดชอบงาน |
| `title` | `VARCHAR(200)` | `NOT NULL` | ชื่องาน |
| `description` | `TEXT` | `NULL` | รายละเอียด Acceptance Criteria หรือ Scope |
| `status` | `VARCHAR(50)` | `NOT NULL` | สถานะปัจจุบัน (เช่น `To Do`, `In Progress`, `Review`, `Done`) |
| `priority` | `VARCHAR(50)` | `NOT NULL` | ลำดับความสำคัญ (`Urgent`, `High`, `Medium`, `Low`) |
| `estimated_hours` | `NUMERIC` | `DEFAULT 0` | ชั่วโมงที่ประมาณการ (Hours) |
| `parent_id` | `VARCHAR(50)` | `NULL` | รหัส Parent Task หากเป็น Subtask |
| `start_date` | `DATE` / `VARCHAR` | `NULL` | วันที่เริ่มปฏิบัติงาน |
| `end_date` | `DATE` / `VARCHAR` | `NULL` | กำหนดส่งงาน (Due Date) |
| `sprint_id` | `VARCHAR(50)` | `FK -> sprints(id) ON DELETE SET NULL` | สปรินต์ที่งานนี้ถูกจัดวาง |
| `release_id` | `VARCHAR(50)` | `FK -> releases(id) ON DELETE SET NULL` | เวอร์ชันการส่งมอบ |
| `story_points` | `INTEGER` | `DEFAULT 0` | ค่าความยากของงานแบบ Agile SP (1, 2, 3, 5, 8, 13) |
| `issue_type` | `VARCHAR(50)` | `DEFAULT 'Task'` | ประเภท Issue (`Story`, `Task`, `Bug`, `Sub-task`) |
| `created_at` | `TIMESTAMP` | `NOT NULL` | วัน-เวลาที่สร้างงาน |
| `updated_at` | `TIMESTAMP` | `NULL` | วัน-เวลาที่แก้ไขงานล่าสุด |

#### 5. ตาราง `timesheets` (การบันทึกเวลาทำงาน)
| ชื่อคอลัมน์ (Column) | ชนิดข้อมูล (Type) | Constraints | คำอธิบาย (Description) |
|---|---|---|---|
| `id` | `VARCHAR(50)` | `PRIMARY KEY` | รหัสรายการบันทึกเวลา |
| `user_id` | `VARCHAR(50)` | `NOT NULL, FK -> users(id)` | พนักงานผู้บันทึกเวลา |
| `project_id` | `VARCHAR(50)` | `NOT NULL, FK -> projects(id)` | โครงการที่ลงเวลา |
| `task_id` | `VARCHAR(50)` | `FK -> tasks(id) ON DELETE SET NULL` | งานที่ทำ (Optional) |
| `date` | `DATE` | `NOT NULL` | วันที่ปฏิบัติงาน (`YYYY-MM-DD`) |
| `hours` | `NUMERIC` | `NOT NULL` | จำนวนชั่วโมงทำงานจริง (เช่น `8.0`, `4.5`) |
| `start_time` | `VARCHAR(10)` | `NULL` | เวลาเริ่มต้น (เช่น `09:00`) |
| `end_time` | `VARCHAR(10)` | `NULL` | เวลาสิ้นสุด (เช่น `18:00`) |
| `description` | `TEXT` | `NULL` | รายละเอียดกิจกรรมงานที่ปฏิบัติ |
| `status` | `VARCHAR(50)` | `NOT NULL` | สถานะ (`Draft`, `Pending`, `Approved`, `Rejected`) |
| `approved_by` | `VARCHAR(50)` | `FK -> users(id)` | ผู้อนุมัติใบลงเวลา (PM / Manager / Admin) |
| `approved_at` | `TIMESTAMP` | `NULL` | วัน-เวลาที่ได้รับการอนุมัติ |
| `image_url` | `TEXT` | `NULL` | หลักฐานการทำงาน / แนบภาพ Base64 |
| `work_results` | `TEXT` | `NULL` | สรุปผลลัพธ์ของงานหรือ Deliverable |
| `is_wfh` | `BOOLEAN` | `DEFAULT FALSE` | ตัวบ่งชี้การทำงานจากที่พัก (Work From Home) |

#### 6. ตาราง `project_baselines` และ `task_snapshots` (การจัดเก็บเวอร์ชันแผนงาน)
- **`project_baselines`**: จัดเก็บ Snapshot Header โดยมี Unique Constraint: `idx_active_baseline_per_project ON project_baselines(project_id) WHERE is_active = TRUE` เพื่อรับประกันว่าจะมี Active Plan ได้เพียง 1 แผนต่อโครงการ
- **`task_snapshots`**: จัดเก็บข้อมูลจำลองของทุก Task ในโครงการ ณ วินาทีที่กดบันทึก Baseline เพื่อนำมาคำนวณเปรียบเทียบ Drift

#### 7. ตาราง `cost_rates` (อัตราค่าแรงและต้นทุน)
| คอลัมน์ | ชนิดข้อมูล | Constraints | รายละเอียด |
|---|---|---|---|
| `id` | `VARCHAR(50)` | `PRIMARY KEY` | รหัสอัตราต้นทุน |
| `role_name` | `VARCHAR(150)` | `UNIQUE, NOT NULL` | ชื่อตำแหน่งในโครงการ (เช่น `Tech Lead`, `Backend Developer`) |
| `rate_per_day` | `NUMERIC` | `DEFAULT 0` | อัตราค่าแรงต่อวัน (Day Rate - THB) |
| `rate_per_hour`| `NUMERIC` | `DEFAULT 0` | อัตราค่าแรงต่อชั่วโมง (Hour Rate = Day Rate / 8) |
| `currency` | `VARCHAR(10)` | `DEFAULT 'THB'` | สกุลเงิน |

---

## 3. ข้อกำหนดและสเปกของ API (REST API Specification)

### 3.1 มาตรฐานการสื่อสารและการยืนยันตัวตน (Authentication & Headers)
- **Base URL:** `/api`
- **Request Headers:**
  - `Content-Type: application/json`
  - `x-user-id: <user_id>` *(ใช้สำหรับการตรวจสอบสิทธิ์การกระทำในระดับ Application Layer)*
- **Response Format:** JSON มาตรฐาน พร้อม HTTP Status Code (200, 201, 400, 401, 403, 404, 500)

### 3.2 สรุป API Endpoints สำคัญ (Key API Matrix)

```
[Authentication & User Management]
POST   /api/auth/login                  -> ยืนยันตัวตน Email/Password (SHA-256)
POST   /api/auth/line                   -> ยืนยันตัวตนผ่าน LINE OAuth Code
GET    /api/users                       -> ดึงรายชื่อผู้ใช้ทั้งหมด
POST   /api/users                       -> สร้าง/อัปเดตข้อมูลผู้ใช้
DELETE /api/users/:id                   -> ลบผู้ใช้ (Admin Only)

[Projects & Workflow]
GET    /api/projects                    -> ดึงรายการโปรเจกต์ทั้งหมด
POST   /api/projects                    -> สร้าง/แก้ไขโปรเจกต์
DELETE /api/projects/:id                -> ลบโปรเจกต์ (Admin/Manager Only)
GET    /api/project-workflows           -> ดึง Workflows ทั้งหมด
POST   /api/project-workflows           -> กำหนด Workflow และ Transition Rules

[Tasks, Sprints & Baselines]
GET    /api/tasks                       -> ดึงรายการ Tasks ทั้งหมด
POST   /api/tasks                       -> สร้าง/แก้ไข Task หรือ Subtask
DELETE /api/tasks/:id                   -> ลบ Task (ตรวจสอบตาม Permission Scheme)
POST   /api/projects/:id/baselines      -> สร้าง Project Baseline Snapshot ใหม่
GET    /api/projects/:id/baselines      -> ดึงประวัติ Baseline ทั้งหมดของโครงการ
PUT    /api/projects/:id/baselines/:bid/active -> สลับ Active Baseline เพื่อเปรียบเทียบ

[Timesheets & Approvals]
GET    /api/timesheets                  -> ดึงประวัติการลงเวลาทั้งหมด
POST   /api/timesheets                  -> บันทึกเวลาทำงาน (Create/Update Draft/Pending)
POST   /api/timesheets/bulk-approve     -> อนุมัติการลงเวลาแบบกลุ่ม (PM/Admin)
POST   /api/timesheets/bulk-reject      -> ปฏิเสธการลงเวลา
DELETE /api/timesheets/:id              -> ลบรายการลงเวลา (Admin/Manager ลบได้ทุกสถานะ)

[Chat & Real-Time Alerts]
GET    /api/projects/:id/messages       -> ดึงประวัติแชทของโครงการ
POST   /api/projects/:id/messages       -> ส่งข้อความแชท + แจ้งเตือน @mentions อัตโนมัติ
GET    /api/users/:id/chat-notifications -> ดึงแจ้งเตือนของพนักงาน (Polling 5s)
POST   /api/chat-notifications/:id/read -> ปิดสถานะแจ้งเตือนว่าอ่านแล้ว

[Settings & Webhooks]
GET/POST /api/cost-rates                -> จัดการอัตราค่าจ้างตามตำแหน่ง
GET/POST /api/permission-schemes        -> ปรับแต่งสิทธิ์ระดับมิติ
POST     /api/webhooks/github           -> รับ Git Commit Webhook ปรับสถานะงานอัตโนมัติ
POST     /api/webhooks/gitlab           -> รับ GitLab Webhook
GET      /api/health                    -> Health Check สถานะ Node & PostgreSQL
```

---

## 4. สถาปัตยกรรมความปลอดภัยและสิทธิ์การเข้าถึง (Security & Permission Architecture)

### 4.1 Two-Tiered Role System (โครงสร้างสิทธิ์ 2 ระดับ)

ระบบ NexTime แยกความรับผิดชอบของสิทธิ์อย่างเคร่งครัด:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Global Role (ระดับระบบ): Admin | Manager | Employee | User│
└──────────────────────────────┬──────────────────────────────┘
                               │ ควบคุมการเข้าถึงเมนูส่วนกลาง (Settings, Cost Rates)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Project Role (ระดับโครงการ): PM | Team Lead | Member     │
└──────────────────────────────┬──────────────────────────────┘
                               │ ถูกควบคุมโดย Dynamic Permission Scheme ประจำโครงการ
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Permission Scheme Engine: ตรวจสอบสิทธิ์ 9 มิติในการกระทำ  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Dynamic Permission Scheme Engine (ตารางสิทธิ์ 9 มิติ)

ระบบตรวจสอบสิทธิ์ผ่าน Matrix JSON ที่กำหนดไว้ในแต่ละโครงการ:

| สิทธิ์ (Permission Key) | ขอบเขตการทำงาน (Operation Scope) | ค่าเริ่มต้นที่อนุญาต (Default Roles) |
|---|---|---|
| `browse_project` | สิทธิ์ในการมองเห็นและเข้าดูรายละเอียดโครงการ | Admin, Manager, PM, Team Lead, Member |
| `create_task` | สิทธิ์สร้าง Task หลัก และ Subtask | Admin, PM, Team Lead, Member |
| `edit_task` | สิทธิ์แก้ไขหัวข้อ, รายละเอียด, กำหนดการ | Admin, PM, Team Lead, Assignee (ผู้รับผิดชอบงาน) |
| `assign_task` | สิทธิ์มอบหมายผู้รับผิดชอบงานให้ผู้อื่น | Admin, Manager, PM, Team Lead |
| `delete_task` | สิทธิ์ลบงานออกจากระบบอย่างถาวร | Admin, PM, Team Lead |
| `transition_task`| สิทธิ์เลื่อนการ์ดงานเปลี่ยนสถานะ Workflow | Admin, PM, Team Lead, Assignee, Member |
| `manage_sprints` | สิทธิ์สร้าง, เริ่มต้น (Start), และปิด (Complete) Sprint | Admin, PM, Team Lead |
| `manage_releases`| สิทธิ์สร้าง Release Tag และ Deploy Version | Admin, PM, Team Lead |
| `manage_members` | สิทธิ์เพิ่ม-ลดสมาชิก และกำหนด Project Role | Admin, PM, Team Lead |

---

## 5. ตรรกะการคำนวณและกฎทางธุรกิจเชิงลึก (Business Logic & Algorithms)

### 5.1 Project Baseline Drift & Slippage Calculation (สูตรคำนวณส่วนต่างแผนงาน)

เมื่อเปรียบเทียบแผนงานปัจจุบัน (Live Plan) กับ แผนฐานข้อมูลที่เลือก (Active Baseline Snapshot):

$$\text{Schedule Slippage (Days)} = \text{DateDiff}(\text{Live Task End Date}, \text{Baseline Task End Date})$$

$$\text{Estimate Drift (Hours)} = \sum \text{Live Estimated Hours} - \sum \text{Baseline Estimated Hours}$$

$$\text{Story Points Drift} = \sum \text{Live Story Points} - \sum \text{Baseline Story Points}$$

- **การประเมินสถานะโครงการ (Health Indicator):**
  - $\text{Slippage} \le 0$ วัน $\rightarrow$ **On Track (แผนงานปกติ/เร็วกว่ากำหนด)**
  - $1 \le \text{Slippage} \le 7$ วัน $\rightarrow$ **At Risk (มีความเสี่ยงล่าช้า)**
  - $\text{Slippage} > 7$ วัน $\rightarrow$ **Delayed / Critical (ล่าช้ากว่าแผนวิกฤต)**

### 5.2 Progress Rollup & Hour Budgeting Hierarchy

1. **การคำนวณความคืบหน้าของงานหลักที่มีงานย่อย (Rollup Progress):**
   $$\text{Parent Task Progress (\%)} = \left( \frac{\text{Count of Done Subtasks}}{\text{Total Subtasks}} \right) \times 100$$
2. **การควบคุมงบประมาณชั่วโมง (Hour Budget Constraint):**
   $$\sum_{i=1}^{n} \text{Estimated Hours}(\text{Subtask}_i) \le \text{Estimated Hours}(\text{Parent Main Task})$$
   *หากผลรวมชั่วโมงงานย่อยเกินกว่าที่งานหลักตั้งไว้ ระบบจะแจ้งเตือน Validation Warning ทันที*

### 5.3 Labor Cost Calculation (การคำนวณต้นทุนค่าแรงโครงการ)

ต้นทุนของโครงการถูกคำนวณแบบ Dynamic ตามตำแหน่งของสมาชิกที่ระบุไว้ในแต่ละโครงการ:

$$\text{Hourly Rate} = \frac{\text{Role Rate Per Day}}{8 \text{ Hours}}$$

$$\text{Project Cost (Total)} = \sum_{j=1}^{m} \left( \text{Approved Timesheet Hours}_j \times \text{Hourly Rate}(\text{User's Project Role}_j) \right)$$

- **MTD Cost (Month-to-Date):** ผลรวมค่าใช้จ่ายเฉพาะในเดือนและปีปัจจุบัน
- **YTD Cost (Year-to-Date):** ผลรวมค่าใช้จ่ายตั้งแต่ 1 มกราคมของปีปัจจุบัน
- **Budget Burn Rate (\%):** $\left( \frac{\text{Project Cost (Total)}}{\text{Project Budget}} \right) \times 100$

### 5.4 Git Commit Message Parser (กฎการย้ายสถานะงานอัตโนมัติ)

เมื่อ Developer ทำการ Commit Code ผ่าน Git โดยใส่ Tag งาน เช่น `[t12] Fix login authentication bug`:
- **Pattern Match:** `/(?:\[|#)(t_?[a-zA-Z0-9]+)(?:\]|\b)/gi`
- **Keyword Mapping Rules:**
  - คำที่บ่งชี้ว่าเสร็จ: `fix`, `close`, `resolve`, `complete`, `done`, `แก้`, `ปิด` $\rightarrow$ ย้าย Task ไปยังคอลัมน์ **Done** (คอลัมน์สุดท้ายของ Workflow)
  - คำที่บ่งชี้ว่ากำลังทำ: `work`, `progress`, `develop`, `start`, `ทำ`, `เริ่ม` $\rightarrow$ ย้าย Task ไปยังคอลัมน์ **In Progress** (คอลัมน์ที่สองของ Workflow)
- บันทึกประวัติ Commit ลงในตาราง `task_commits` เพื่อแสดงผล Git History ใน Modal ของ Task นั้นๆ

---

## 6. คู่มือการติดตั้งและการนำระบบขึ้นใช้งาน (Deployment & DevOps Guide)

### 6.1 โครงสร้างไฟล์ในระบบ (Project Directory Structure)

```
c:\atgv\time_sheet\
├── docs/                       # เอกสารสถาปัตยกรรมและคู่มือการอบรม
│   ├── SA_SYSTEM_GUIDE.md      # คู่มือฉบับนี้ (System Analyst & Architecture)
│   ├── TRAINER_MANUAL.md       # คู่มือการอบรมสำหรับวิทยากรและผู้ใช้
│   └── screenshots/            # ภาพจับหน้าจอระบบประกอบคู่มือ
├── server/                     # Backend Source Code (Express ES Modules)
│   ├── config/
│   │   └── db.js               # PostgreSQL Pool Connection & Auto-Migration
│   └── routes/                 # API Route Modules
│       ├── authRoutes.js       # ระบบ Login, LINE OAuth, Profile
│       ├── projectRoutes.js    # โครงการ, Baselines, Sprints, Releases
│       ├── taskRoutes.js       # จัดการ Tasks, Subtasks, Workflows
│       ├── timesheetRoutes.js  # ลงเวลา, อนุมัติ Timesheet
│       ├── chatRoutes.js       # แชทโครงการ, แจ้งเตือน @mentions
│       ├── systemRoutes.js     # Permission Schemes, Cost Rates, Settings
│       └── generalRoutes.js    # Health, Initial-Data, Webhooks, File Upload
├── src/                        # Frontend Source Code (React 18 + TypeScript)
│   ├── components/             # UI Components (Dashboard, Tasks, Timesheet, etc.)
│   ├── hooks/                  # TanStack React Query Custom Hooks
│   ├── types/                  # TypeScript Data Type Interfaces
│   ├── App.tsx                 # Root Component, Navigation & Notifications
│   └── index.css               # Global Theme, Variables & Glassmorphism Styles
├── .env                        # Environment Configuration (ห้าม Commit ขึ้น Git)
├── db_schema.sql               # โครงสร้าง DDL Database ดั้งเดิม
├── migrate_db.js               # Script ปรับปรุง Type & Foreign Keys
├── nixpacks.toml               # Configuration สำหรับสร้าง Container บน Coolify
├── package.json                # Dependencies & Build Scripts
├── server.js                   # Entry Point หลักสำหรับ Backend Express
└── vite.config.ts              # Configuration สำหรับ Vite Bundler
```

### 6.2 ตัวแปรสภาพแวดล้อม (Environment Variables `.env`)

ไฟล์ `.env` ต้องวางอยู่ที่ Root Directory ของโปรเจกต์:

```env
# Database Connection (Hostinger VPS / Production PostgreSQL)
DATABASE_URL=postgresql://isara_admin:MySecretPass123!@187.77.147.16:5432/timesheet_db

# Application Server Port
PORT=3000

# LINE Login OAuth 2.0 Credentials (Optional สำหรับ LINE Integration)
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CALLBACK_URL=https://your-domain.com/api/auth/line/callback

# SMTP Mail Server Configuration (สำหรับระบบส่งอีเมลแจ้งเตือน)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notification@company.com
SMTP_PASS=app_specific_password_here

# AI Chatbot Assistant API Key (Google Gemini หรือ OpenAI)
GEMINI_API_KEY=AIzaSy...
```

### 6.3 Local Development Setup

การรันโปรเจกต์บนเครื่องพัฒนา (Development Environment):

```powershell
# 1. ติดตั้ง Dependencies ทั้งหมด
npm install

# 2. เปิด Terminal 1: รัน Express Backend API
npm run start
# Server จะเปิดที่ http://localhost:3000

# 3. เปิด Terminal 2: รัน Vite Development Server
npm run dev
# Frontend จะเปิดที่ http://localhost:5173 พร้อม Proxy ไปยัง Port 3000
```

### 6.4 การ Deploy บน Cloud / VPS ด้วย Coolify & Nixpacks

ไฟล์ `nixpacks.toml` ได้รับการกำหนดค่าให้ทำการ Build ทั้งส่วนหน้าและหลังแบบอัตโนมัติ:

```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.build]
cmds = ["npm install", "npm run build"]

[start]
cmd = "node server.js"
```

1. ใน **Coolify Dashboard** เลือกสร้าง Application จาก Git Repository
2. กำหนด Build Pack เป็น **Nixpacks**
3. ระบุ Port ใน Container Configuration เป็น `3000`
4. ตั้งค่า Environment Variable `DATABASE_URL` ใน Coolify ให้ตรงกับ Production Database
5. กด **Deploy** — Nixpacks จะทำการ Compile TypeScript $\rightarrow$ สร้างโฟลเดอร์ `dist/` $\rightarrow$ และเริ่มรัน Express Server ให้บริการทั้ง Static Files และ API ผ่าน Port 3000 ทันที

---

## 7. การบำรุงรักษาและการแก้ไขปัญหา (Maintenance & Troubleshooting for SA)

### 7.1 Diagnostic APIs & Health Checks

SA สามารถตรวจสอบสถานะการทำงานของระบบได้ผ่าน Endpoint:

- **Health Check API:** `GET /api/health`
  ```json
  {
    "server": "ok",
    "db": "connected",
    "dbHost": "187.77.147.16",
    "time": "2026-08-17T07:30:00.000Z",
    "userCount": 24,
    "taskCount": 182
  }
  ```
- **Database Status API:** `GET /api/db-status`

### 7.2 Common Error Scenarios & Resolution Playbook

| อาการ / ข้อผิดพลาด | สาเหตุที่เป็นไปได้ (Root Cause) | แนวทางแก้ไขสำหรับ SA (Resolution Steps) |
|---|---|---|
| **ล็อกอินไม่สำเร็จ (LINE Login Failed)** | อีเมลของบัญชี LINE ไม่ตรงกับอีเมลในฐานข้อมูล `users` | ตรวจสอบตาราง `users` ว่ามี Email ของพนักงานถูกต้องหรือไม่ หรือให้ User แจ้ง Email บริษัทให้ตรงกัน |
| **Gantt Chart ไม่แสดง Baseline Drift** | โครงการถูกตั้งเป็นประเภท `support` หรือยังไม่ได้กด "Set as Active Plan" | โครงการ Support จะ Bypass Gantt Chart หากเป็นโครงการ Dev ให้ตรวจสอบว่ามี Snapshot ใน `project_baselines` และถูกตั้งค่า `is_active = TRUE` หรือไม่ |
| **บันทึก Timesheet ไม่ได้** | วันที่หรือชั่วโมงมีค่าผิดปกติ หรือ Task ถูกลบไปแล้ว | ตรวจสอบ Data Validation ที่ Client และดู Foreign Key `task_id` ใน Request Payload |
| **ฐานข้อมูลช้า หรือ Connection Timeout** | Connection Pool เต็ม (เกิน 20 connections) หรือมี Long-running query | ตรวจสอบ `pg_stat_activity` ใน PostgreSQL, รีสตาร์ท Node Process หรือปรับค่า `max` ใน `pg.Pool` |

### 7.3 Database Reset & Cleanup Protocols

สำหรับการรีเซ็ตข้อมูลเพื่อเริ่มโครงการใหม่หรือรอบการทดสอบ Admin สามารถเรียกใช้ API:
- `POST /api/clean-tasks` (แนบ Header `x-user-id` ของ Admin)
- ระบบจะทำการลบข้อมูลการปฏิบัติงาน (`tasks`, `timesheets`, `sprints`, `releases`, `baselines`) โดยคงข้อมูลผู้ใช้ (`users`), โครงการ (`projects`), แผนผังสิทธิ์ (`permission_schemes`), และอัตราค่าจ้าง (`cost_rates`) ไว้อย่างปลอดภัย

---
*เอกสารนี้จัดทำขึ้นสำหรับทีมเทคนิคและ System Analyst ของระบบ NexTime สงวนลิขสิทธิ์ พ.ศ. 2569*
