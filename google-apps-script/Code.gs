const SPREADSHEET_ID = '1DXfKmUFnArpysrQRnxSADNgXYj9LKLDPO8Oya6ThJK8';
const SHEET_NAME = 'Daily Reports';

function doGet() {
	const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
	const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.getSheets()[0];
	const values = sheet.getDataRange().getValues();
	const headers = values.shift() || [];
	const reports = values.filter((row) => row.some((value) => value !== '')).map((row) => {
		const report = {};
		headers.forEach((header, index) => {
			report[String(header).trim()] = row[index];
		});
		return report;
	});

	return ContentService
		.createTextOutput(JSON.stringify({ success: true, reports }))
		.setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
	const lock = LockService.getScriptLock();
	lock.waitLock(10000);

	try {
		if (!e || !e.postData || !e.postData.contents) {
			throw new Error('The request body is empty.');
		}

		const data = JSON.parse(e.postData.contents);
		const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
		const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.getSheets()[0];

		if (!sheet) {
			throw new Error('No sheet tab was found in the spreadsheet.');
		}

		if (data.action === 'delete') {
			const serialNumbers = new Set((data.serialNumbers || []).map(String));
			const lastRow = sheet.getLastRow();
			let deletedCount = 0;

			for (let rowIndex = lastRow; rowIndex >= 2; rowIndex -= 1) {
				const serial = String(sheet.getRange(rowIndex, 1).getValue());
				if (serialNumbers.has(serial)) {
					sheet.deleteRow(rowIndex);
					deletedCount += 1;
				}
			}

			return ContentService
				.createTextOutput(JSON.stringify({ success: true, deletedCount }))
				.setMimeType(ContentService.MimeType.JSON);
		}

		const lastColumn = Math.max(sheet.getLastColumn(), 1);
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
			executive: data.executive || '',
			date: data.date || '',
			customer: data.customer || '',
			location: data.location || '',
			companyName: data.companyName || '',
			netSalary: data.netSalary || '',
			loanAmount: data.loanAmount || '',
			bank: data.bank || '',
			loginDate: data.loginDate || '',
			status: data.status || '',
			obligation: data.obligation || '',
			btFresh: data.btFresh || '',
			remark: data.remark || '',
		};

		const headerMap = {
			executivename: 'executive',
			date: 'date',
			customername: 'customer',
			location: 'location',
			companyname: 'companyName',
			netsalary: 'netSalary',
			loanamount: 'loanAmount',
			bankname: 'bank',
			logindate: 'loginDate',
			disbursement: 'status',
			disbursementstatus: 'status',
			obligation: 'obligation',
			btfresh: 'btFresh',
			btorfresh: 'btFresh',
			remark: 'remark',
		};

		const requiredHeaders = [
			['companyname', 'Company Name'],
			['netsalary', 'Net Salary'],
			['obligation', 'Obligation'],
			['btfresh', 'BT/FRESH'],
		];
		requiredHeaders.forEach(([key, label]) => {
			const hasHeader = headers.some((header) => String(header).toLowerCase().replace(/[^a-z0-9]/g, '') === key);
			if (!hasHeader) headers.push(label);
		});
		sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

		const row = headers.map((header, index) => {
			if (index === 0) return nextSerial;

			const normalizedHeader = String(header)
				.toLowerCase()
				.replace(/[^a-z0-9]/g, '');
			const field = headerMap[normalizedHeader];
			return field ? valuesByField[field] : '';
		});

		sheet.appendRow(row);

		return ContentService
			.createTextOutput(JSON.stringify({ success: true, serialNumber: nextSerial }))
			.setMimeType(ContentService.MimeType.JSON);
	} finally {
		lock.releaseLock();
	}
}