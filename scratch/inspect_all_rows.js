import xlsx from 'xlsx';

async function main() {
  const workbook = xlsx.readFile('scratch/sheet.xlsx');
  const sheet = workbook.Sheets['Phase#1 Timeline 2026'];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  console.log('Row Index | Subject (B) | Activities (C) | Owner (D) | Timeline (E) | Compleate (F) | Status (G) | Remark (H)');
  console.log('---------------------------------------------------------------------------------------------------------');
  
  // Starting from Row 10 (index 10 in 0-based is Row 11)
  for (let i = 10; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    // We offset indices because the range starts at B2, so:
    // B is row[0], C is row[1], D is row[2], E is row[3], F is row[4], G is row[5], H is row[6]
    // Let's verify by checking the header row index. The header row is at row 9 (index 9).
    // Let's print that first to be absolutely sure of offsets.
  }

  // Let's print row by row with cell lookups directly to be extremely accurate and avoid offset bugs
  const range = xlsx.utils.decode_range(sheet['!ref']);
  for (let r = 10; r <= range.e.c; r++) { // wait, range.e.r is rows
  }

  for (let r = 8; r <= range.e.r; r++) {
    const getVal = (colLetter) => {
      const cell = sheet[colLetter + (r + 1)];
      return cell ? (cell.w || cell.v) : '';
    };
    
    const subject = getVal('B');
    const activity = getVal('C');
    const owner = getVal('D');
    const timeline = getVal('E');
    const compleate = getVal('F');
    const status = getVal('G');
    const remark = getVal('H');
    
    if (activity || subject) {
      console.log(`${r + 1} | Subj: ${subject} | Act: ${activity} | Owner: ${owner} | Timeline: ${timeline} | Comp: ${compleate} | Status: ${status} | Rem: ${remark}`);
    }
  }
}

main();
