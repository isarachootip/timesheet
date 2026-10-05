import xlsx from 'xlsx';

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
  // Normalize dashes (replace en-dash, em-dash, and multiple spaces with a single hyphen)
  s = s.replace(/[\u2013\u2014]/g, '-').replace(/\s+/g, ' ');
  
  // Case 1: Simple date like "2-Jul-26" or "13-Aug-26" (D-MMM-YY)
  // Let's test with regex
  const singleDateRegex = /^(\d+)-([A-Za-z]+)-(\d+)$/;
  let match = s.match(singleDateRegex);
  if (match) {
    const day = padZero(match[1]);
    const month = parseMonth(match[2]);
    const year = parseYear(match[3]);
    const dStr = `${year}-${month}-${day}`;
    return { startDate: dStr, endDate: dStr };
  }

  // Case 2: Range like "02-06 Jul 2026" or "13 - 14 Aug 2026" (DD - DD MMM YYYY)
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

  // Case 3: Range like "10 Jul - 7 Aug 2026" or "28 Aug - 11 Sep 2026" (DD MMM - DD MMM YYYY)
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

  // Case 4: range like "06 Jul - 24 Aug 2026" (extra spaces/hyphens)
  // Let's see if we can do a general splitting
  const parts = s.split('-');
  if (parts.length === 2) {
    const startPart = parts[0].trim();
    const endPart = parts[1].trim();
    
    // Parse endPart first because it usually contains the year
    // e.g. "24 Aug 2026" or "06 Jul" (if start contains year - unlikely)
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
      // Just day number, meaning same month as end
      startDay = padZero(startWords[0]);
      startMonth = endMonth;
    }
    
    return {
      startDate: `${year}-${startMonth}-${startDay}`,
      endDate: `${year}-${endMonth}-${endDay}`
    };
  }

  // Fallback
  console.log('Unrecognized pattern:', timelineStr);
  return { startDate: null, endDate: null };
}

async function main() {
  const workbook = xlsx.readFile('scratch/sheet.xlsx');
  const sheet = workbook.Sheets['Phase#1 Timeline 2026'];
  const range = xlsx.utils.decode_range(sheet['!ref']);
  
  for (let r = 11; r <= 37; r++) {
    const cell = sheet['E' + (r + 1)];
    const val = cell ? (cell.w || cell.v) : '';
    if (val) {
      const parsed = parseTimeline(val);
      console.log(`Original: "${val}" -> Parsed: Start: ${parsed.startDate}, End: ${parsed.endDate}`);
    }
  }
}

main();
export { parseTimeline };
