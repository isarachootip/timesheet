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
