function sendGoogleSheetToLineMessagingAPI() {
  // --- การตั้งค่า (Configuration) ---
  const SPREADSHEET_ID = '15A7h62tRxTrbEHzK6UOam3fVn_H7HBxAcGXT4I2ElXM'; // ID ของ Google Sheet
  const SHEET_NAME = 'NOC_Report';         // แทนที่ด้วยชื่อของชีท/แท็บที่คุณต้องการส่ง
  const LINE_CHANNEL_ACCESS_TOKEN = 'KKADfbAWvHXpa+ndAhrSg3KoGdtDupP9PWXS+P6q+fglyyBCk/fhzPs+YrYWo6Sag0BU5c+PLUI8GBxb8xd8QhFYnsc8K4jzwcydG5TJhMXBHxJuCGWYGP8zgu2Ep1lhsOOZfw9ti+HuWUo8NrEm7AdB04t89/1O/w1cDnyilFU='; // Channel Access Token
  const LINE_CHANNEL_SECRET = 'dde0dd09027a0ad7afb1ae504ed7ec0a';     // Channel Secret
  const LINE_RECIPIENT_ID = 'C468fb34d0bdf08e80e8b288bd66c39cd'; // USER ID

  const FOLDER_ID = '1qyJFMSTExpivp6NgmxF8goea0Xcmm_i9'; // ID ของโฟลเดอร์ใน Google Drive

  // --- ดึง Google Sheet และส่งออกเป็น XLSX ---
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    Logger.log('ไม่พบชีท: ' + SHEET_NAME);
    return;
  }

  // สร้าง URL สำหรับส่งออก XLSX ของชีทที่ระบุ
  //const pdfUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=pdf&gid=${sheet.getSheetId()}&portrait=true&fitw=true`; // กรณี PDF
  const xlsxUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx&gid=${sheet.getSheetId()}`;

  const fetchOptions = {
    headers: {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(xlsxUrl, fetchOptions);

  if (response.getResponseCode() !== 200) {
    Logger.log('เกิดข้อผิดพลาดในการส่งออก XLSX: ' + response.getContentText());
    return;
  }

  const xlsxBlob = response.getBlob().setName(`${SHEET_NAME}_Report_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'ddMMyyyy_HHmmss')}.xlsx`);

  // --- อัปโหลด XLSX ไปยัง Google Drive ---
  let file;
  if (FOLDER_ID) {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    file = folder.createFile(xlsxBlob);
  } else {
    file = DriveApp.createFile(xlsxBlob);
  }

  // ตั้งค่าสิทธิ์การเข้าถึงไฟล์ให้เป็น "ใครก็ได้ที่มีลิงก์สามารถดูได้"
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const driveFileUrl = file.getUrl();

  Logger.log('อัปโหลดไฟล์ XLSX ไปยัง Drive แล้ว: ' + driveFileUrl);

  // --- ส่งข้อความพร้อมลิงก์ XLSX ไปยัง LINE Messaging API ---
  const lineApiUrl = 'https://api.line.me/v2/bot/message/push'; // สำหรับส่งแบบ Push Message

  const message = {
    type: 'text',
    text: `รายงานประจำวัน NOC\nสามารถดาวน์โหลดได้ที่: ${driveFileUrl}`
  };

  const linePayload = {
    to: LINE_RECIPIENT_ID,
    messages: [message]
  };

  const lineOptions = {
    'method': 'post',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
    },
    'payload': JSON.stringify(linePayload),
    'muteHttpExceptions': true
  };

  try {
    const lineResponse = UrlFetchApp.fetch(lineApiUrl, lineOptions);
    const lineResponseCode = lineResponse.getResponseCode();
    const lineResponseText = lineResponse.getContentText();

    if (lineResponseCode === 200) {
      Logger.log('ส่งข้อความพร้อมลิงก์รายงานไปยัง LINE Messaging API สำเร็จแล้ว.');
    } else {
      Logger.log('เกิดข้อผิดพลาดในการส่งข้อความไปยัง LINE Messaging API: ' + lineResponseCode + ' - ' + lineResponseText);
      Logger.log('Response body: ' + lineResponseText);
    }
  } catch (e) {
    Logger.log('เกิดข้อผิดพลาดขณะส่งไปยัง LINE Messaging API: ' + e.toString());
  }

  // (Optional) ลบไฟล์ PDF ออกจาก Google Drive หลังจากส่งแล้ว หากไม่ต้องการเก็บไฟล์
  // เพื่อประหยัดพื้นที่และรักษาความเป็นระเบียบ
  // file.setTrashed(true);
  // Logger.log('ลบไฟล์ PDF ออกจาก Google Drive แล้ว.');
}