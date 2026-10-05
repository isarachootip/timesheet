import xlsx from 'xlsx';

function indexToColLetter(index) {
  let temp, letter = '';
  while (index > 0) {
    temp = (index - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    index = (index - temp - 1) / 26;
  }
  return letter;
}

async function main() {
  const workbook = xlsx.readFile('scratch/sheet.xlsx');
  const sheet = workbook.Sheets['Phase#1 Timeline 2026'];
  if (!sheet) {
    console.error('Sheet not found');
    return;
  }

  // Use sheet_to_json with raw options or access cell values directly
  const range = xlsx.utils.decode_range(sheet['!ref']);
  console.log('Range:', sheet['!ref']);
  
  for (let r = 8; r <= 35; r++) {
    const rowCells = [];
    for (let c = range.s.c; c <= Math.min(10, range.e.c); c++) {
      const cellRef = xlsx.utils.encode_cell({ r, c });
      const cell = sheet[cellRef];
      rowCells.push(`${indexToColLetter(c + 1)}: ${cell ? (cell.w || cell.v) : ''}`);
    }
    console.log(`Row ${r + 1}:`, rowCells.join(' | '));
  }
}

main();
