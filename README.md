# Rudransh Capital Daily Reports

A React + Vite employee workspace for entering and reviewing daily loan reports.

## Run locally

```bash
npm install
npm run dev
```

The app currently includes employee-only login validation, browser persistence for report history, and the requested fields:

Employee login currently accepts the configured email `Sales@rudranshcapital.com` and password `@rudransh26(?)`. Admin login uses `Narsu.pawar@rudranshcapital.com` with the admin password configured in the app. The username is entered at login and is used throughout the active workspace, including the welcome message, profile, and Executive Name field.

- Executive name
- Report date
- Customer name
- Location
- Loan amount
- Bank name
- Login date
- Disbursement status: Login, Approved, Reject
- Remark

## Google Sheets connection

The front end accepts a Google Apps Script web app URL through `VITE_GOOGLE_SHEETS_WEBHOOK_URL`. Employee submissions route to the `Leads Form`, `Login Form`, or `Disbursement Form` tab according to the selected form. Copy `.env.example` to `.env`, set the deployed `/exec` URL, and restart Vite.

The Apps Script implementation in `google-apps-script/Code.gs` creates/uses the three form tabs and adds a per-tab serial number in column A. It is configured for spreadsheet ID `1DXfKmUFnArpysrQRnxSADNgXYj9LKLDPO8Oya6ThJK8`. Paste the current script into the spreadsheet's Apps Script editor and redeploy the web app to enable the three-tab routing.

The admin portal uses the same `/exec` URL with a `GET` request to load spreadsheet rows. After updating `Code.gs`, deploy a new web-app version so both `POST` submissions and `GET` report loading are active.

For production, move credential validation out of the browser and behind an authenticated server or company identity provider. The current client-side check is suitable for the internal prototype but any credential shipped in a front-end bundle can be inspected by users.
