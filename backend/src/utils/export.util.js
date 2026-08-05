/**
 * Export Utility for CSV, Excel (.xlsx compatible), and PDF report generation
 */

/**
 * Generate CSV string from columns and data rows
 */
const generateCSV = (columns, rows) => {
  if (!rows || rows.length === 0) {
    return columns.map((c) => `"${c.header}"`).join(',') + '\n';
  }

  const headerRow = columns.map((c) => `"${c.header}"`).join(',');
  const dataRows = rows.map((row) => {
    return columns
      .map((col) => {
        let val = row[col.key];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        // Escape quotes
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Generate Excel compatible XML/HTML spreadsheet buffer from columns and rows
 */
const generateExcelBuffer = (title, columns, rows) => {
  const tableHeaders = columns.map((col) => `<th style="background-color:#e11d48;color:#ffffff;font-weight:bold;padding:8px;border:1px solid #cccccc;">${col.header}</th>`).join('');
  const tableRows = rows.map((row) => {
    const cells = columns
      .map((col) => {
        let val = row[col.key];
        if (val === null || val === undefined) val = '';
        return `<td style="padding:6px;border:1px solid #dddddd;">${val}</td>`;
      })
      .join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${title}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <style>
        body { font-family: Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        h2 { color: #e11d48; }
      </style>
    </head>
    <body>
      <h2>Madurai Food Corner ERP - ${title}</h2>
      <p>Generated Date: ${new Date().toLocaleString()}</p>
      <table>
        <thead><tr>${tableHeaders}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </body>
    </html>
  `;

  return Buffer.from(htmlContent, 'utf-8');
};

/**
 * Generate PDF report printable document HTML buffer
 */
const generatePDFBuffer = (title, columns, rows) => {
  const tableHeaders = columns.map((col) => `<th>${col.header}</th>`).join('');
  const tableRows = rows.map((row) => {
    const cells = columns
      .map((col) => {
        let val = row[col.key];
        if (val === null || val === undefined) val = '';
        return `<td>${val}</td>`;
      })
      .join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 30px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e11d48; padding-bottom: 10px; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #e11d48; }
        .report-title { font-size: 18px; color: #555; }
        .meta { margin-bottom: 20px; font-size: 12px; color: #777; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #e11d48; color: white; text-align: left; padding: 10px; font-size: 12px; }
        td { border-bottom: 1px solid #ddd; padding: 10px; font-size: 12px; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Madurai Food Corner ERP</div>
        <div class="report-title">${title}</div>
      </div>
      <div class="meta">
        <strong>Generated On:</strong> ${new Date().toLocaleString()}
      </div>
      <table>
        <thead><tr>${tableHeaders}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="footer">
        Confidential Report - Madurai Food Corner ERP Internal Business Analytics
      </div>
    </body>
    </html>
  `;

  return Buffer.from(htmlContent, 'utf-8');
};

module.exports = {
  generateCSV,
  generateExcelBuffer,
  generatePDFBuffer,
};
