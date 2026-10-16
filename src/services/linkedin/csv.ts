const QUOTE = '"';

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (inQuotes) {
      if (character === QUOTE && text[index + 1] === QUOTE) {
        field += QUOTE;
        index++;
      } else if (character === QUOTE) {
        inQuotes = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === QUOTE) {
      inQuotes = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') {
        index++;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function parseCsvRecords(text: string): { header: string[]; records: Record<string, string>[] } {
  const [header = [], ...rows] = parseCsv(text.replace(/^﻿/, ''));
  const records = rows
    .filter((row) => row.some((value) => value.trim()))
    .map((row) => Object.fromEntries(header.map((name, column) => [name, row[column] ?? ''])));
  return { header, records };
}
