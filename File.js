export function parseExcelData(data) {
    const workbook = XLSX.read(data, { type: "array" });
  
    // Assume the first sheet contains the data
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
    // Convert the sheet data to a JSON object
    const excelData = XLSX.utils.sheet_to_json(sheet);
  
    // Continue with the rest of your code to group and create charts
    // ...
  
    console.log(excelData); // This will log the parsed data to the console
  
    return excelData;
  }