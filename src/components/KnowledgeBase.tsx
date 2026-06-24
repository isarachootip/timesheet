import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight, BookOpen, Database, BarChart3, Clock, Languages } from 'lucide-react';

type Lang = 'en' | 'th';

const KnowledgeBase: React.FC = () => {
  const [lang, setLang] = useState<Lang>('th');
  const [expandedId, setExpandedId] = useState<string | null>('q1');

  const content = {
    en: {
      title: "Help & FAQ",
      subtitle: "System documentation and frequently asked questions.",
      needHelpTitle: "Need more help?",
      needHelpDesc: "If you have additional questions or need technical support, you can access the Chat Widget in the bottom right corner of your screen to communicate with the AI assistant.",
      faqs: [
        {
          id: 'q1',
          question: 'How is the Milestone Progress calculated?',
          icon: BarChart3,
          answer: (
            <div>
              <p style={{ marginBottom: '0.5rem' }}>The progress calculation depends on whether a task has subtasks:</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}><strong>Tasks WITHOUT Subtasks:</strong> Progress is strictly 0% or 100%. If the task is in "In Progress", it becomes 50%. If in "Review", it is 90%. It only reaches 100% when moved to "Done".</li>
                <li><strong>Tasks WITH Subtasks:</strong> Progress is calculated purely by the percentage of its subtasks that are in "Done" status (e.g., 2 out of 4 subtasks done = 50%), regardless of which column the main task is in.</li>
              </ul>
            </div>
          )
        },
        {
          id: 'q2',
          question: 'How do I delete Timesheets, Tasks, or Subtasks?',
          icon: Clock,
          answer: (
            <div>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}><strong>Timesheets:</strong> Go to the "Timesheet" menu. In your logged time history list, look for the red trash bin icon at the end of the row and click it to delete.</li>
                <li style={{ marginBottom: '0.25rem' }}><strong>Tasks (Board View):</strong> On the "Tasks" board, hover over the task card and click the small red trash bin icon in the top right corner.</li>
                <li><strong>Tasks (Bulk Delete):</strong> Go to the "Backlog" or "Summary" view under Tasks, check the boxes next to multiple items, and click the red "Delete Selected" button at the top.</li>
              </ul>
            </div>
          )
        },
        {
          id: 'q3',
          question: 'How do I move Tasks between Sprints?',
          icon: BookOpen,
          answer: (
            <div>
              <p style={{ marginBottom: '0.5rem' }}>You can move tasks to different sprints easily:</p>
              <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}>Go to the <strong>Backlog</strong> tab under Tasks.</li>
                <li style={{ marginBottom: '0.25rem' }}>Find the task you want to move. On the right side of the row, there is a dropdown menu displaying its current Sprint.</li>
                <li>Click the dropdown and select the desired Sprint, or select "Backlog" to remove it from all sprints. You can also select multiple tasks using the checkboxes on the left and use the Bulk Action button at the top to reassign them simultaneously.</li>
              </ol>
            </div>
          )
        },
        {
          id: 'q4',
          question: 'Where is my application data stored?',
          icon: Database,
          answer: (
            <div>
              <p style={{ marginBottom: '0.5rem' }}>All system data and user configurations are stored safely on your VPS server:</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}><strong>Application Data:</strong> Tasks, Projects, Timesheets, and Sprints are permanently stored in a <strong>PostgreSQL Database</strong> on your Coolify server.</li>
                <li><strong>Agent Memory:</strong> Any special rules or knowledge taught to the AI Agent (e.g., via the <code>/learn</code> command) are stored as customized rules in a local <code>.agents</code> folder on your device.</li>
              </ul>
            </div>
          )
        },
        {
          id: 'q5',
          question: 'What do Monthly Summary and Approval Status mean on the Timesheet page?',
          icon: Clock,
          answer: (
            <div>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}><strong>Monthly Summary:</strong> This shows the total hours you have logged during the <strong>current month</strong> (not week). The "Target: 160h" represents a standard full-time working month (e.g., 40 hours/week &times; 4 weeks).</li>
                <li><strong>Approval Status:</strong> This breaks down your logged hours for the current month into "Approved" (accepted) and "Pending" (awaiting approval). <br/><br/><em>* Note: Timesheets can be approved by anyone with an <strong>Admin</strong>, <strong>Manager</strong>, or <strong>Project Manager (PM)</strong> role.</em></li>
              </ul>
            </div>
          )
        },
        {
          id: 'q6',
          question: 'What do the Issue Types (Task, Story, Bug) mean?',
          icon: BookOpen,
          answer: (
            <div>
              <p style={{ marginBottom: '0.5rem' }}>These are standard Agile categories used to organize work:</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}><strong>Story (Green):</strong> Stands for "User Story". It represents a new feature or requirement that delivers direct value to the user (e.g., "Login Page", "Export Report").</li>
                <li style={{ marginBottom: '0.25rem' }}><strong>Task (Blue):</strong> Represents technical work, chores, or background tasks that need to be done but aren't necessarily user-facing features (e.g., "Setup Database", "Configure Server").</li>
                <li><strong>Bug (Red):</strong> Represents a defect or error in the system that needs to be fixed (e.g., "App crashes on login").</li>
              </ul>
            </div>
          )
        },
        {
          id: 'q7',
          question: 'What does "1 SP" or "Story Points" mean?',
          icon: BarChart3,
          answer: (
            <div>
              <p style={{ marginBottom: '0.5rem' }}><strong>SP (Story Points)</strong> is a unit of measure used in Agile to estimate the overall effort, complexity, and risk of a task.</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}>It uses the Fibonacci sequence (1, 2, 3, 5, 8, 13...) because estimating exact hours for complex tasks is often inaccurate.</li>
                <li style={{ marginBottom: '0.25rem' }}><strong>1 SP</strong> represents the smallest, simplest baseline task (e.g., changing a text label).</li>
                <li>If a new task feels about twice as complex or takes twice as much effort as your baseline "1 SP" task, you would estimate it as "2 SP". If it's much harder, maybe "5 SP", and so on.</li>
              </ul>
            </div>
          )
        },
        {
          id: 'q8',
          question: 'What do Timeline, Releases/Versions, and Backlog Grooming mean in the Tasks page?',
          icon: BookOpen,
          answer: (
            <div>
              <p style={{ marginBottom: '0.5rem' }}>These are different views and tools for planning your project:</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}><strong>Timeline:</strong> A visual roadmap (Gantt chart) showing when tasks start and end. It helps you see the overall schedule and how tasks overlap.</li>
                <li style={{ marginBottom: '0.25rem' }}><strong>Releases / Versions:</strong> A way to group tasks that will be launched or delivered together. For example, all features needed for "Version 1.0".</li>
                <li><strong>Backlog Grooming:</strong> A dedicated view to review, estimate (SP), and prioritize unassigned tasks so they are ready for upcoming sprints.</li>
              </ul>
            </div>
          )
        }
      ]
    },
    th: {
      title: "คู่มือการใช้งาน (FAQ)",
      subtitle: "เอกสารคู่มือและคำถามที่พบบ่อยของระบบ",
      needHelpTitle: "ต้องการความช่วยเหลือเพิ่มเติม?",
      needHelpDesc: "หากคุณมีคำถามเพิ่มเติมหรือต้องการความช่วยเหลือด้านเทคนิค สามารถกดไอคอนแชทที่มุมขวาล่างเพื่อสอบถามผู้ช่วย AI ได้ตลอดเวลาครับ",
      faqs: [
        {
          id: 'q1',
          question: 'เปอร์เซ็นต์ความคืบหน้า (Progress) คำนวณอย่างไร?',
          icon: BarChart3,
          answer: (
            <div>
              <p style={{ marginBottom: '0.5rem' }}>ระบบจะคำนวณ % ความคืบหน้าต่างกัน ขึ้นอยู่กับว่า Task นั้นมีงานย่อย (Subtasks) หรือไม่:</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}><strong>Task ที่ไม่มีงานย่อย:</strong> ถ้าลากไปช่อง "In Progress" จะนับเป็น 50%, ลากไป "Review" นับเป็น 90% และจะเป็น 100% ก็ต่อเมื่อลากไปช่อง "Done" ครับ</li>
                <li><strong>Task ที่มีงานย่อย:</strong> ระบบจะไม่สนใจว่าตัว Task หลักอยู่ช่องไหน แต่จะคำนวณจากสัดส่วนของ Subtask ที่เสร็จแล้วเท่านั้น (เช่น มี 4 งานย่อย ทำเสร็จไป 2 งานย่อย = 50%)</li>
              </ul>
            </div>
          )
        },
        {
          id: 'q2',
          question: 'วิธีลบข้อมูล Timesheet, Task และ Subtask ทำอย่างไร?',
          icon: Clock,
          answer: (
            <div>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}><strong>Timesheet:</strong> ไปที่เมนู "Timesheet" ด้านซ้ายมือ เลื่อนลงมาที่ตารางประวัติ จะมีไอคอนถังขยะสีแดงอยู่ขวาสุดของแต่ละรายการครับ</li>
                <li style={{ marginBottom: '0.25rem' }}><strong>Task (หน้า Board):</strong> เอาเมาส์ไปชี้ที่การ์ดงาน จะมีไอคอนถังขยะสีแดงเล็กๆ โผล่ขึ้นมาที่มุมขวาบนของการ์ดครับ</li>
                <li><strong>Task (ลบทีละหลายๆ อัน):</strong> ไปที่แท็บ "Backlog" หรือ "Summary" ติ๊กถูกที่ช่องสี่เหลี่ยมด้านหน้า Task ที่ต้องการลบ แล้วกดปุ่ม "Delete Selected" สีแดงที่ด้านบนครับ</li>
              </ul>
            </div>
          )
        },
        {
          id: 'q3',
          question: 'สามารถย้าย Task ไปอยู่ Sprint อื่นได้ไหม?',
          icon: BookOpen,
          answer: (
            <div>
              <p style={{ marginBottom: '0.5rem' }}>สามารถทำได้ง่ายๆ ตามนี้เลยครับ:</p>
              <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}>ไปที่เมนู Tasks แล้วเลือกแท็บ <strong>Backlog</strong></li>
                <li style={{ marginBottom: '0.25rem' }}>ตรงด้านขวาสุดของแต่ละบรรทัด จะมีปุ่ม Dropdown ระบุชื่อ Sprint ปัจจุบันอยู่</li>
                <li>คลิกที่ Dropdown นั้นเพื่อเลือก Sprint ใหม่ หรือเลือกคำว่า "Backlog" เพื่อถอดงานออกจาก Sprint ครับ (สามารถติ๊กถูกด้านหน้าหลายๆ งานเพื่อย้ายพร้อมกันได้ด้วย)</li>
              </ol>
            </div>
          )
        },
        {
          id: 'q4',
          question: 'ข้อมูลต่างๆ ถูกเก็บไว้ที่ไหน?',
          icon: Database,
          answer: (
            <div>
              <p style={{ marginBottom: '0.5rem' }}>ข้อมูลในระบบถูกแบ่งการจัดเก็บออกเป็น 2 ส่วนหลักๆ ครับ:</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}><strong>ข้อมูลแอปพลิเคชัน:</strong> พวก Task, Timesheet, Project จะถูกบันทึกไว้อย่างถาวรใน <strong>PostgreSQL Database</strong> บนเซิร์ฟเวอร์ Coolify ของคุณครับ</li>
                <li><strong>ความจำของ AI:</strong> กฎระเบียบและวิธีคิดที่ AI เรียนรู้ (เช่น ผ่านคำสั่ง <code>/learn</code>) จะถูกเก็บไว้เป็นไฟล์ระบบในโฟลเดอร์ <code>.agents</code> บนคอมพิวเตอร์ของคุณเองครับ</li>
              </ul>
            </div>
          )
        },
        {
          id: 'q5',
          question: 'ช่อง Monthly Summary และ Approval Status ในหน้า Timesheet คืออะไร?',
          icon: Clock,
          answer: (
            <div>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}><strong>Monthly Summary (สรุปรายเดือน):</strong> แสดงจำนวนชั่วโมงทั้งหมดที่คุณลงเวลาไว้ใน <strong>เดือนนี้</strong> (ไม่ใช่รายสัปดาห์ครับ) โดยตัวเลข Target: 160h คือเป้าหมายเวลาทำงานมาตรฐานต่อเดือน (เช่น สัปดาห์ละ 40 ชม. &times; 4 สัปดาห์)</li>
                <li><strong>Approval Status (สถานะอนุมัติ):</strong> แสดงยอดรวมชั่วโมงในเดือนนี้ที่ "ผ่านการอนุมัติแล้ว" (Approved) เทียบกับชั่วโมงที่ "กำลังรอการอนุมัติ" (Pending) ครับ <br/><br/><em>* หมายเหตุ: ผู้ที่มีสิทธิ์กดอนุมัติ Timesheet ได้คือคนที่มีตำแหน่ง <strong>Admin</strong>, <strong>Manager</strong> หรือ <strong>Project Manager (PM)</strong> ครับ</em></li>
              </ul>
            </div>
          )
        },
        {
          id: 'q6',
          question: 'ประเภทของงาน (Issue Type) อย่าง Task, Story, Bug หมายความว่าอย่างไร?',
          icon: BookOpen,
          answer: (
            <div>
              <p style={{ marginBottom: '0.5rem' }}>เป็นหมวดหมู่งานตามหลักการทำงานแบบ Agile ครับ:</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}><strong>Story (สีเขียว):</strong> ย่อมาจาก "User Story" หมายถึงฟีเจอร์ใหม่หรือความต้องการจากมุมมองของผู้ใช้งาน (เช่น "สร้างหน้า Login", "ระบบออกรายงาน") ซึ่งมักจะเป็นงานที่ส่งมอบ Value ให้ลูกค้าโดยตรง</li>
                <li style={{ marginBottom: '0.25rem' }}><strong>Task (สีฟ้า):</strong> หมายถึงงานด้านเทคนิค, งานเตรียมการ, หรืองานย่อยๆ ที่ไม่ได้เป็นฟีเจอร์โดยตรง แต่จำเป็นต้องทำเพื่อให้ระบบสมบูรณ์ (เช่น "ติดตั้ง Database", "คอนฟิกเซิร์ฟเวอร์")</li>
                <li><strong>Bug (สีแดง):</strong> หมายถึงข้อผิดพลาดหรือจุดบกพร่องของระบบที่ต้องได้รับการแก้ไข (เช่น "กดปุ่มแล้วแอปค้าง", "ตัวเลขคำนวณผิด")</li>
              </ul>
            </div>
          )
        },
        {
          id: 'q7',
          question: '1 SP (Story Points) คืออะไร?',
          icon: BarChart3,
          answer: (
            <div>
              <p style={{ marginBottom: '0.5rem' }}><strong>SP (Story Points)</strong> คือหน่วยวัดในระบบ Agile ที่ใช้ประเมิน "ขนาดความยาก-ง่าย ความซับซ้อน และแรงงาน" ที่ต้องใช้ในการทำงานชิ้นนั้นๆ ครับ</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}>ตัวเลขจะเรียงตามลำดับฟีโบนัชชี (1, 2, 3, 5, 8, 13...) เพราะงานยิ่งใหญ่ความไม่แน่นอนยิ่งสูง จึงไม่กะเกณฑ์เป็นตัวเลขเรียงกันตรงๆ</li>
                <li style={{ marginBottom: '0.25rem' }}><strong>1 SP</strong> มักจะถูกใช้ตั้งเป็นเกณฑ์มาตรฐานของ "งานที่เล็กและง่ายที่สุด" (เช่น แก้ไขคำผิดบนหน้าเว็บ)</li>
                <li>เวลาประเมินงานชิ้นใหม่ ทีมจะเปรียบเทียบกับงาน 1 SP เช่น "งานนี้ดูยากและใช้แรงมากกว่างาน 1 SP ประมาณ 3 เท่า" ก็จะตีค่าประเมินงานนั้นเป็น "3 SP" ครับ</li>
              </ul>
            </div>
          )
        },
        {
          id: 'q8',
          question: 'เมนู Timeline, Releases/Versions และ Backlog Grooming ในหน้า Tasks คืออะไร?',
          icon: BookOpen,
          answer: (
            <div>
              <p style={{ marginBottom: '0.5rem' }}>ทั้ง 3 เมนูนี้เป็นเครื่องมือที่ช่วยในการวางแผนโปรเจกต์ครับ:</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
                <li style={{ marginBottom: '0.25rem' }}><strong>Timeline:</strong> คือหน้าจอที่แสดงแผนงานในรูปแบบของปฏิทินยาว (Gantt Chart) ทำให้เห็นภาพรวมว่าแต่ละงานเริ่มและจบเมื่อไหร่ หรืองานไหนทับซ้อนกันอยู่บ้างครับ</li>
                <li style={{ marginBottom: '0.25rem' }}><strong>Releases / Versions:</strong> คือการจัดกลุ่ม Task หลายๆ อันรวมกัน เพื่อกำหนดว่าจะปล่อยอัปเดตระบบพร้อมกันในเวอร์ชันไหน (เช่น ฟีเจอร์ทั้งหมดนี้คือของอัปเดต Version 1.0)</li>
                <li><strong>Backlog Grooming:</strong> เป็นหน้าจอสำหรับใช้เคลียร์งานที่ยังค้างอยู่ (Backlog) โดยเฉพาะ เพื่อนำมาจัดลำดับความสำคัญ ประเมินคะแนนความยาก (SP) และเตรียมความพร้อมก่อนที่จะดึงเข้า Sprint ถัดไปครับ</li>
              </ul>
            </div>
          )
        }
      ]
    }
  };

  const current = content[lang];

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: 'var(--text-primary)' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HelpCircle size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }} className="text-gradient">{current.title}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{current.subtitle}</p>
          </div>
        </div>

        {/* Language Switcher Button */}
        <button
          onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}
          className="hover-lift"
        >
          <Languages size={18} />
          {lang === 'en' ? '🇹🇭 ภาษาไทย' : '🇬🇧 English'}
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {current.faqs.map(faq => {
          const Icon = faq.icon;
          const isExpanded = expandedId === faq.id;
          
          return (
            <div 
              key={faq.id} 
              style={{ 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '12px', 
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-primary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '8px', 
                    background: isExpanded ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <Icon size={18} color={isExpanded ? '#818cf8' : 'var(--text-secondary)'} />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: isExpanded ? 'white' : 'var(--text-primary)' }}>
                    {faq.question}
                  </h3>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </button>
              
              {isExpanded && (
                <div style={{ 
                  padding: '0 1.25rem 1.5rem 1.25rem',
                  marginLeft: '44px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  fontSize: '0.95rem'
                }}>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0 0 1rem 0' }} />
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <HelpCircle size={24} color="#818cf8" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#e0e7ff', margin: '0 0 0.5rem 0' }}>{current.needHelpTitle}</h4>
          <p style={{ color: '#c7d2fe', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
            {current.needHelpDesc}
          </p>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
