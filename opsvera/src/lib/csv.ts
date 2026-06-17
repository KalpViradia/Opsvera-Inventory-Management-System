/**
 * CSV parsing and generation utilities.
 * Handles escaping and standard CSV formatting.
 */

export function generateCSV(headers: string[], rows: unknown[][]): string {
  const processCell = (cell: unknown) => {
    if (cell === null || cell === undefined) return "";
    
    let cellString = String(cell);
    
    // If cell contains quotes, commas, or newlines, escape it
    if (cellString.includes('"') || cellString.includes(",") || cellString.includes("\n")) {
      cellString = `"${cellString.replace(/"/g, '""')}"`;
    }
    
    return cellString;
  };

  const headerRow = headers.map(processCell).join(",");
  const dataRows = rows.map(row => row.map(processCell).join(","));

  return [headerRow, ...dataRows].join("\n");
}

export function parseCSV(csvString: string): { headers: string[]; rows: Record<string, string>[] } {
  if (!csvString.trim()) {
    return { headers: [], rows: [] };
  }

  // Handle both \r\n and \n
  const normalizedCsv = csvString.replace(/\r\n/g, "\n");
  
  // A simple but robust regex approach for CSV parsing
  // Handles quotes and escaped quotes
  const parseRow = (rowStr: string): string[] => {
    const result: string[] = [];
    let currentCell = "";
    let inQuotes = false;
    
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      const nextChar = rowStr[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i++; // skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of cell
        result.push(currentCell);
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    
    // Push the last cell
    result.push(currentCell);
    return result;
  };

  const lines = normalizedCsv.split("\n");
  
  // Find first non-empty line for headers
  let headerLineIndex = 0;
  while (headerLineIndex < lines.length && !lines[headerLineIndex].trim()) {
    headerLineIndex++;
  }
  
  if (headerLineIndex >= lines.length) {
    return { headers: [], rows: [] };
  }
  
  const headers = parseRow(lines[headerLineIndex]).map(h => h.trim());
  const rows: Record<string, string>[] = [];
  
  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines at the end
    if (!line.trim() && i === lines.length - 1) continue;
    
    // We process even empty lines in the middle if they're there, 
    // as they might be legitimate empty records depending on the system
    if (!line.trim()) continue;
    
    const rowValues = parseRow(line);
    const rowObj: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      rowObj[header] = rowValues[index] || "";
    });
    
    rows.push(rowObj);
  }

  return { headers, rows };
}
