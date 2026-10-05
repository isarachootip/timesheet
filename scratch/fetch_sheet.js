import fs from 'fs';
import xlsx from 'xlsx';

async function main() {
  const url = 'https://docs.google.com/spreadsheets/d/1z3C2H-73KrYBAowIkzWj3f3u1jgJQnyT/export?format=xlsx';
  console.log('Fetching sheet from', url);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('Fetch failed with status:', res.status, res.statusText);
      const text = await res.text();
      console.error('Response text:', text.substring(0, 500));
      return;
    }
    const buffer = await res.arrayBuffer();
    fs.writeFileSync('scratch/sheet.xlsx', Buffer.from(buffer));
    console.log('Saved to scratch/sheet.xlsx successfully.');

    // Now let's inspect the sheets in the workbook
    const workbook = xlsx.readFile('scratch/sheet.xlsx');
    console.log('Sheet names in workbook:', workbook.SheetNames);
  } catch (err) {
    console.error('Error fetching/parsing:', err);
  }
}

main();
