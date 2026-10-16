import { describe, expect, test } from 'bun:test';
import { parseCsv, parseCsvRecords } from '../../../src/services/linkedin/csv.ts';

describe('parseCsv', () => {
  test('handles quoted commas, escaped quotes and line breaks', () => {
    expect(parseCsv('a,"b, c","say ""hi""\nthere"\r\nd,e,f')).toEqual([
      ['a', 'b, c', 'say "hi"\nthere'],
      ['d', 'e', 'f'],
    ]);
  });

  test('keeps empty fields', () => {
    expect(parseCsv('a,,c\n')).toEqual([['a', '', 'c']]);
  });
});

describe('parseCsvRecords', () => {
  test('maps rows to header names and skips blank rows and the BOM', () => {
    const { header, records } = parseCsvRecords('﻿Date,Text\n2024-01-01,hi\n\n');

    expect(header).toEqual(['Date', 'Text']);
    expect(records).toEqual([{ Date: '2024-01-01', Text: 'hi' }]);
  });
});
