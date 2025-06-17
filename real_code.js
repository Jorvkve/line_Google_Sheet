function sendGoogleSheetToLine() {
  const SPREADSHEET_ID = '15A7h62tRxTrbEHzK6UOam3fVn_H7HBxAcGXT4I2ElXM';
  const LINE_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_TOKEN');
  const LINE_RECIPIENT_ID = 'C468fb34d0bdf08e80e8b288bd66c39cd';
  const FOLDER_ID = '1qyJFMSTExpivp6NgmxF8goea0Xcmm_i9';

   const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const spreadsheetName = spreadsheet.getName();

  // ดึงชื่อชีทล่าสุด
  const sheets = spreadsheet.getSheets();
  const latestSheet = sheets[sheets.length - 1];
  const latestSheetName = latestSheet.getName();

  // สร้าง timestamp รูปแบบ dd-MM-yyyy HH:mm:ss
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MM-yyyy HH:mm:ss');

  // สำหรับตั้งชื่อไฟล์ ต้องเปลี่ยน : เป็น - เพื่อไม่ให้เกิดปัญหา
  const safeTimestamp = timestamp.replace(/:/g, '-');
  const fileName = `${spreadsheetName}_${safeTimestamp}.xlsx`;

  // Export .xlsx ทั้งไฟล์
  const xlsxUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`;
  const response = UrlFetchApp.fetch(xlsxUrl, {
    headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    sendLineError(`❌ Export XLSX ไม่สำเร็จ\nCODE: ${response.getResponseCode()}`);
    return;
  }

  const xlsxBlob = response.getBlob().setName(fileName);

  // อัปโหลดไฟล์ไปยัง Google Drive
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const file = folder.createFile(xlsxBlob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // ลิงก์เปิดดูไฟล์ Google Sheets บนเว็บ
  const fileUrl = `https://docs.google.com/spreadsheets/d/${file.getId()}/edit?usp=sharing`;

  // ส่งข้อความผ่าน LINE Messaging API
  const message = {
    to: LINE_RECIPIENT_ID,
    messages: [{
      type: 'text',
      text: `📊 รายงานประจำวัน NOC\n📄 ชีทล่าสุด: "${latestSheetName}"\n🕘 เวลา: ${timestamp}\n🔗 เปิดดูไฟล์: ${fileUrl}`
    }]
  };

  const lineOptions = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + LINE_TOKEN
    },
    payload: JSON.stringify(message),
    muteHttpExceptions: true
  };

  const lineResponse = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', lineOptions);

  if (lineResponse.getResponseCode() !== 200) {
    sendLineError(`❌ ส่ง LINE ไม่สำเร็จ\nCODE: ${lineResponse.getResponseCode()}\nข้อความ: ${lineResponse.getContentText()}`);
    return;
  }

  // เขียน Log ลงชีท "Log"
  /*const logSheet = getOrCreateLogSheet(spreadsheet);
  logSheet.appendRow([
    new Date(),
    latestSheetName,
    timestamp,
    fileName,
    fileUrl
  ]);
}*/

// ฟังก์ชันแจ้งเตือนเมื่อเกิดข้อผิดพลาด
function sendLineError(errorText) {
  const LINE_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_TOKEN');
  const LINE_RECIPIENT_ID = 'C468fb34d0bdf08e80e8b288bd66c39cd';
  const payload = {
    to: LINE_RECIPIENT_ID,
    messages: [{ type: 'text', text: errorText }]
  };
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + LINE_TOKEN
    },
    payload: JSON.stringify(payload)
  });
}

// ฟังก์ชันสร้างชีท "Log" ถ้ายังไม่มี
/*function getOrCreateLogSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName('Log');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Log');
    sheet.appendRow(['วันที่', 'ชื่อชีทล่าสุด', 'เวลาที่ส่ง', 'ชื่อไฟล์', 'ลิงก์ไฟล์']);
  }
  return sheet;
}*/
}