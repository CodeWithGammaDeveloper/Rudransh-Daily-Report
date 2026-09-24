const SPREADSHEET_ID = '1DXfKmUFnArpysrQRnxSADNgXYj9LKLDPO8Oya6ThJK8';
const SHEET_NAME = 'Daily Reports';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const data = JSON.parse(e.postData.contents);
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.getSheets()[0];

    if (!sheet) {
      throw new Error('No sheet tab was found in the spreadsheet.');
    }

    const lastColumn = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    const lastRow = sheet.getLastRow();
    const serialValues = lastRow > 1
      ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat()
      : [];
    const highestSerial = serialValues.reduce((highest, value) => {
      const serial = Number(value);
      return Number.isFinite(serial) ? Math.max(highest, serial) : highest;
    }, 0);
    const nextSerial = highestSerial + 1;

    const valuesByField = {
      executive: data.executive,
      date: data.date,
      customer: data.customer,
      location: data.location,
      loanAmount: data.loanAmount,
      bank: data.bank,
      loginDate: data.loginDate,
      status: data.status,
      remark: data.remark,
    };

    const headerMap = {
      executivename: 'executive',
      date: 'date',
      customername: 'customer',
      location: 'location',
      loanamount: 'loanAmount',
      bankname: 'bank',
      logindate: 'loginDate',
      disbursement: 'status',
      remark: 'remark',
    };

    const row = headers.map((header, index) => {
      if (index === 0) return nextSerial;

      const normalizedHeader = String(header)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const field = headerMap[normalizedHeader];
      return field ? valuesByField[field] || '' : '';
    });

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, serialNumber: nextSerial }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
