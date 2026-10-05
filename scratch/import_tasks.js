import xlsx from 'xlsx';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

function parseMonth(str) {
  if (!str) return null;
  const s = str.trim().toLowerCase().substring(0, 3);
  return MONTH_MAP[s] || null;
}

function padZero(val) {
  const s = String(val).trim();
  return s.length === 1 ? '0' + s : s;
}

function parseYear(str) {
  if (!str) return '2026';
  let y = str.trim();
  if (y.length === 2) return '20' + y;
  return y;
}

function parseTimeline(timelineStr) {
  if (!timelineStr) return { startDate: null, endDate: null };
  
  let s = timelineStr.trim();
  s = s.replace(/[\u2013\u2014]/g, '-').replace(/\s+/g, ' ');
  
  const singleDateRegex = /^(\d+)-([A-Za-z]+)-(\d+)$/;
  let match = s.match(singleDateRegex);
  if (match) {
    const day = padZero(match[1]);
    const month = parseMonth(match[2]);
    const year = parseYear(match[3]);
    const dStr = `${year}-${month}-${day}`;
    return { startDate: dStr, endDate: dStr };
  }

  const rangeSameMonthRegex = /^(\d+)\s*-\s*(\d+)\s+([A-Za-z]+)\s+(\d+)$/;
  match = s.match(rangeSameMonthRegex);
  if (match) {
    const startDay = padZero(match[1]);
    const endDay = padZero(match[2]);
    const month = parseMonth(match[3]);
    const year = parseYear(match[4]);
    return {
      startDate: `${year}-${month}-${startDay}`,
      endDate: `${year}-${month}-${endDay}`
    };
  }

  const rangeDiffMonthRegex = /^(\d+)\s+([A-Za-z]+)\s*-\s*(\d+)\s+([A-Za-z]+)\s+(\d+)$/;
  match = s.match(rangeDiffMonthRegex);
  if (match) {
    const startDay = padZero(match[1]);
    const startMonth = parseMonth(match[2]);
    const endDay = padZero(match[3]);
    const endMonth = parseMonth(match[4]);
    const year = parseYear(match[5]);
    return {
      startDate: `${year}-${startMonth}-${startDay}`,
      endDate: `${year}-${endMonth}-${endDay}`
    };
  }

  const parts = s.split('-');
  if (parts.length === 2) {
    const startPart = parts[0].trim();
    const endPart = parts[1].trim();
    
    const endWords = endPart.split(' ');
    let endDay = '', endMonth = '', year = '2026';
    if (endWords.length === 3) {
      endDay = padZero(endWords[0]);
      endMonth = parseMonth(endWords[1]);
      year = parseYear(endWords[2]);
    } else if (endWords.length === 2) {
      endDay = padZero(endWords[0]);
      endMonth = parseMonth(endWords[1]);
    }
    
    const startWords = startPart.split(' ');
    let startDay = '', startMonth = '';
    if (startWords.length === 3) {
      startDay = padZero(startWords[0]);
      startMonth = parseMonth(startWords[1]);
      year = parseYear(startWords[2]);
    } else if (startWords.length === 2) {
      startDay = padZero(startWords[0]);
      startMonth = parseMonth(startWords[1]);
    } else if (startWords.length === 1) {
      startDay = padZero(startWords[0]);
      startMonth = endMonth;
    }
    
    return {
      startDate: `${year}-${startMonth}-${startDay}`,
      endDate: `${year}-${endMonth}-${endDay}`
    };
  }

  return { startDate: null, endDate: null };
}

async function main() {
  const projectId = 'p_1783325978838'; // 3cx_voicebot
  const workbook = xlsx.readFile('scratch/sheet.xlsx');
  const sheet = workbook.Sheets['Phase#1 Timeline 2026'];
  const range = xlsx.utils.decode_range(sheet['!ref']);

  const subTasks = [];
  let currentSubject = '';
  let currentGroupHeader = '';
  const today = '2026-08-21';

  // Start from Row 11 (index 10) to skip header rows
  for (let r = 10; r <= range.e.r; r++) {
    const getVal = (colLetter) => {
      const cell = sheet[colLetter + (r + 1)];
      return cell ? (cell.w || cell.v) : '';
    };

    const subject = getVal('B').trim();
    const activity = getVal('C').trim();
    const owner = getVal('D').trim();
    const timeline = getVal('E').trim();
    const compleate = getVal('F').trim();
    const statusVal = getVal('G').trim();
    const remark = getVal('H').trim();

    if (subject) {
      currentSubject = subject;
      currentGroupHeader = ''; // Reset group header on subject change
    }

    if (!activity) continue;

    // Clean up activity for prefix matching (e.g. remove Sara I typo 'ิ' from 'ิb)')
    const cleanedActivity = activity.replace(/^[^\w\s]*/, '').trim();

    // Check if it's a letter group header (like "a)", "b)", "c)" but NOT roman numeral "i)", "ii)")
    const isRoman = /^[ivx]+\)/i.test(cleanedActivity);
    const isLetterGroup = /^[a-zA-Z]\)/.test(cleanedActivity) && !isRoman;

    if (isLetterGroup) {
      currentGroupHeader = cleanedActivity;
    }

    // Filter tasks strictly by valid status: 'Done' or 'On Plan'
    const statusLower = statusVal.toLowerCase();
    if (statusLower !== 'done' && statusLower !== 'on plan') {
      continue;
    }

    // Parse dates
    const { startDate, endDate } = parseTimeline(timeline);

    // Map Status
    let status = 'To Do';
    if (statusLower === 'done') {
      status = 'Done';
    } else if (statusLower === 'on plan') {
      if (startDate && today >= startDate) {
        status = 'In Progress';
      } else {
        status = 'To Do';
      }
    }

    // Prepended title
    let title = activity;
    const isSubIndented = /^\s+/.test(getVal('C')) || isRoman;
    if (isSubIndented && currentGroupHeader && cleanedActivity !== currentGroupHeader) {
      title = `${currentGroupHeader} - ${activity.trim()}`;
    }

    subTasks.push({
      subject: currentSubject,
      title,
      owner,
      startDate,
      endDate,
      status,
      remark,
      rowNum: r + 1
    });
  }

  // Group by Subject
  const subjectsMap = {};
  for (const task of subTasks) {
    if (!subjectsMap[task.subject]) {
      subjectsMap[task.subject] = [];
    }
    subjectsMap[task.subject].push(task);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Transaction started.');

    let taskCounter = 0;
    const baseTimestamp = Date.now();

    for (const subj of Object.keys(subjectsMap)) {
      const tasks = subjectsMap[subj];
      
      // Calculate Subject Start Date and End Date based on subtasks
      const startDates = tasks.map(t => t.startDate).filter(Boolean);
      const endDates = tasks.map(t => t.endDate).filter(Boolean);
      const subjStartDate = startDates.length > 0 ? startDates.reduce((min, d) => d < min ? d : min, startDates[0]) : null;
      const subjEndDate = endDates.length > 0 ? endDates.reduce((max, d) => d > max ? d : max, endDates[0]) : null;

      // Calculate Subject Status
      const allDone = tasks.every(t => t.status === 'Done');
      const anyDone = tasks.some(t => t.status === 'Done' || t.status === 'In Progress');
      const subjStatus = allDone ? 'Done' : (anyDone ? 'In Progress' : 'To Do');

      // Create unique Main Task ID
      taskCounter++;
      const mainTaskId = `t_main_${baseTimestamp}_${taskCounter}`;
      const createdAt = new Date().toISOString();

      console.log(`Inserting Main Task: "${subj}" (ID: ${mainTaskId}, Status: ${subjStatus})`);
      await client.query(
        `INSERT INTO tasks (id, project_id, assignee_id, title, description, status, priority, estimated_hours, created_at, parent_id, start_date, end_date, sprint_id, release_id, story_points, issue_type, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          mainTaskId,
          projectId,
          null, // assignee_id
          subj,
          `Group task for ${subj}`, // description
          subjStatus,
          'Medium', // priority
          0, // estimated_hours
          createdAt,
          null, // parent_id
          subjStartDate,
          subjEndDate,
          null, // sprint_id
          null, // release_id
          0, // story_points
          'Task', // issue_type
          createdAt // updated_at
        ]
      );

      // Insert Subtasks under this Main Task
      for (const t of tasks) {
        taskCounter++;
        const subTaskId = `t_sub_${baseTimestamp}_${taskCounter}`;
        console.log(`  -> Inserting Subtask: "${t.title}" (ID: ${subTaskId}, Status: ${t.status}, Parent: ${mainTaskId})`);
        
        await client.query(
          `INSERT INTO tasks (id, project_id, assignee_id, title, description, status, priority, estimated_hours, created_at, parent_id, start_date, end_date, sprint_id, release_id, story_points, issue_type, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            subTaskId,
            projectId,
            null, // assignee_id
            t.title,
            t.remark || `Task from sheet row ${t.rowNum}`, // description
            t.status,
            'Medium', // priority
            0, // estimated_hours
            createdAt,
            mainTaskId, // parent_id
            t.startDate,
            t.endDate,
            null, // sprint_id
            null, // release_id
            0, // story_points
            'Task', // issue_type
            createdAt // updated_at
          ]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Transaction committed successfully.');
    console.log(`Successfully imported ${taskCounter} tasks (including main and sub tasks).`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back due to error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
