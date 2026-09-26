const SPREADSHEET_ID = '1DXfKmUFnArpysrQRnxSADNgXYj9LKLDPO8Oya6ThJK8';
const SHEET_NAME = 'Daily Reports';

function doGet() {
	const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
	const formTabs = ['Leads Form', 'Login Form', 'Disbursement Form'];
	const reports = formTabs.flatMap((tabName) => {
		const sheet = spreadsheet.getSheetByName(tabName);
		if (!sheet || sheet.getLastRow() < 2) return [];

		const values = sheet.getDataRange().getValues();
		const headers = values.shift() || [];
		return values.filter((row) => row.some((value) => value !== '')).map((row) => {
			const report = { id: `${tabName}:${row[0]}`, formType: tabName, sourceTab: tabName };
			headers.forEach((header, index) => {
				report[String(header).trim()] = row[index];
			});
			return report;
		});
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

		if (data.action === 'delete') {
			let deletedCount = 0;
			(data.serialNumbers || []).forEach((id) => {
				const [tabName, serial] = String(id).split(':');
				const targetSheet = spreadsheet.getSheetByName(tabName);
				if (!targetSheet || serial === undefined) return;
				for (let rowIndex = targetSheet.getLastRow(); rowIndex >= 2; rowIndex -= 1) {
					if (String(targetSheet.getRange(rowIndex, 1).getValue()) === serial) {
						targetSheet.deleteRow(rowIndex);
						deletedCount += 1;
						break;
					}
				}
			});

			return ContentService
				.createTextOutput(JSON.stringify({ success: true, deletedCount }))
				.setMimeType(ContentService.MimeType.JSON);
		}

		if (data.action === 'update') {
			const [tabName, serial] = String(data.id || '').split(':');
			const allowedTabs = ['Leads Form', 'Login Form', 'Disbursement Form'];
			if (!allowedTabs.includes(tabName) || serial === undefined) throw new Error('Invalid report reference.');
			const sheet = spreadsheet.getSheetByName(tabName);
			if (!sheet) throw new Error('The report tab was not found.');

			const lastColumn = sheet.getLastColumn();
			const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
			let targetRow = 0;
			for (let rowIndex = 2; rowIndex <= sheet.getLastRow(); rowIndex += 1) {
				if (String(sheet.getRange(rowIndex, 1).getValue()) === serial) {
					targetRow = rowIndex;
					break;
				}
			}
			if (!targetRow) throw new Error('The report row was not found.');

			const valuesByHeader = {
				'executive name': data.values.executive || '',
				'date': data.values.date || '',
				'customer name': data.values.customer || '',
				'company name': data.values.companyName || '',
				'net salary': data.values.netSalary ?? '',
				'location': data.values.location || '',
				'obligation': data.values.obligation || '',
				'bt/fresh': data.values.btFresh || '',
				'loan amount': data.values.loanAmount ?? '',
				'login bank': data.values.bank || '',
				'bank': data.values.bank || '',
				'login date': data.values.loginDate || '',
				'login status': data.values.loginStatus || '',
				'disbursement amount': data.values.disbursementAmount ?? '',
				'cash/bank deviation': data.values.cashBankDeviation || '',
				'remark': data.values.remark || '',
			};
			const updatedRow = headers.map((header, index) => index === 0
				? sheet.getRange(targetRow, 1).getValue()
				: valuesByHeader[String(header).toLowerCase()] ?? '');
			sheet.getRange(targetRow, 1, 1, updatedRow.length).setValues([updatedRow]);

			return ContentService
				.createTextOutput(JSON.stringify({ success: true, updated: true }))
				.setMimeType(ContentService.MimeType.JSON);
		}

		const tabByForm = {
			'Leads Form': 'Leads Form',
			'Login Form': 'Login Form',
			'Disbursement Form': 'Disbursement Form',
		};
		const tabName = tabByForm[data.formType];
		if (!tabName) throw new Error('Unknown report form type.');
		let sheet = spreadsheet.getSheetByName(tabName);
		if (!sheet) sheet = spreadsheet.insertSheet(tabName);

		const headersByForm = {
			'Leads Form': ['S.No.', 'Executive Name', 'Date', 'Customer Name', 'Company Name', 'Net Salary', 'Location', 'Obligation', 'BT/FRESH', 'Loan Amount', 'Login Bank', 'Remark'],
			'Login Form': ['S.No.', 'Executive Name', 'Date', 'Customer Name', 'Loan Amount', 'Bank', 'Login Date', 'Login Status', 'Remark'],
			'Disbursement Form': ['S.No.', 'Executive Name', 'Date', 'Customer Name', 'Disbursement Amount', 'Bank', 'Cash/Bank Deviation'],
		};
		const expectedHeaders = headersByForm[tabName];
		sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
		const lastColumn = Math.max(sheet.getLastColumn(), expectedHeaders.length);
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

		const valuesByHeader = {
			's.no.': nextSerial,
			'serial number': nextSerial,
			'executive name': data.executive || '',
			'date': data.date || '',
			'customer name': data.customer || '',
			'company name': data.companyName || '',
			'net salary': data.netSalary || '',
			'location': data.location || '',
			'obligation': data.obligation || '',
			'bt/fresh': data.btFresh || '',
			'loan amount': data.loanAmount || '',
			'login bank': data.bank || '',
			'bank': data.bank || '',
			'login date': data.loginDate || '',
			'login status': data.loginStatus || '',
			'disbursement amount': data.disbursementAmount || '',
			'cash/bank deviation': data.cashBankDeviation || '',
			'remark': data.remark || '',
		};
		const row = expectedHeaders.map((header) => valuesByHeader[String(header).toLowerCase()] ?? '');

		sheet.appendRow(row);

		return ContentService
			.createTextOutput(JSON.stringify({ success: true, serialNumber: nextSerial }))
			.setMimeType(ContentService.MimeType.JSON);
	} finally {
		lock.releaseLock();
	}
}