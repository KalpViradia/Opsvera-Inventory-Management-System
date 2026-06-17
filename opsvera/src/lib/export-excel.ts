import * as XLSX from "xlsx";

/**
 * Utility to export an array of JSON objects to an Excel (.xlsx) file and trigger download.
 * Must be used on the client-side.
 * 
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @param sheetName Name of the sheet (defaults to "Sheet1")
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToExcel(data: Record<string, any>[], filename: string, sheetName: string = "Sheet1") {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Convert JSON data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Append worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
