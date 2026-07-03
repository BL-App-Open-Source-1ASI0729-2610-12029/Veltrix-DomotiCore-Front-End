export function downloadJsonFile(filename: string, data: unknown): void {
  downloadBlob(filename, JSON.stringify(data, null, 2), 'application/json');
}

export function downloadCsvFile(filename: string, rows: string[][]): void {
  const csv = rows
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  downloadBlob(filename, csv, 'text/csv;charset=utf-8;');
}

export function downloadExcelFile(filename: string, rows: string[][]): void {
  const csv = rows
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const bom = '\uFEFF';
  downloadBlob(filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`, bom + csv, 'application/vnd.ms-excel;charset=utf-8;');
}

export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8;'): void {
  downloadBlob(filename, content, mimeType);
}

function downloadBlob(filename: string, content: string, mimeType: string): void {
  if (typeof document === 'undefined') return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
