function sendGoogleSheetToLineMessagingAPI() {
  // --- การตั้งค่า (Configuration) ---
  const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // แทนที่ด้วย ID ของ Google Sheet ของคุณ
  const SHEET_NAME = 'YOUR_SHEET_NAME_HERE';         // แทนที่ด้วยชื่อของชีท/แท็บที่คุณต้องการส่ง
  const LINE_CHANNEL_ACCESS_TOKEN = 'YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE'; // แทนที่ด้วย Channel Access Token
  const LINE_CHANNEL_SECRET = 'YOUR_LINE_CHANNEL_SECRET_HERE';     // แทนที่ด้วย Channel Secret (ปกติไม่ใช้ในการส่งข้อความ แต่เผื่อต้องใช้)
  const LINE_RECIPIENT_ID = 'YOUR_USER_OR_GROUP_ID_HERE'; // แทนที่ด้วย User ID, Group ID หรือ Room ID ที่คุณต้องการส่งไป

  const FOLDER_ID = 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE'; // ID ของโฟลเดอร์ใน Google Drive ที่คุณต้องการบันทึกไฟล์ (ถ้าไม่ระบุ จะบันทึกใน My Drive)

  // --- ดึง Google Sheet และส่งออกเป็น PDF ---
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    Logger.log('ไม่พบชีท: ' + SHEET_NAME);
    return;
  }

  // สร้าง URL สำหรับส่งออก PDF ของชีทที่ระบุ
  const pdfUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=pdf&gid=${sheet.getSheetId()}&portrait=true&fitw=true`;

  const fetchOptions = {
    headers: {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(pdfUrl, fetchOptions);

  if (response.getResponseCode() !== 200) {
    Logger.log('เกิดข้อผิดพลาดในการส่งออก PDF: ' + response.getContentText());
    return;
  }

  const pdfBlob = response.getBlob().setName(`${SHEET_NAME}_Report_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss')}.pdf`);

  // --- อัปโหลด PDF ไปยัง Google Drive ---
  let file;
  if (FOLDER_ID) {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    file = folder.createFile(pdfBlob);
  } else {
    file = DriveApp.createFile(pdfBlob);
  }

  // ตั้งค่าสิทธิ์การเข้าถึงไฟล์ให้เป็น "ใครก็ได้ที่มีลิงก์สามารถดูได้"
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const driveFileUrl = file.getUrl();

  Logger.log('อัปโหลดไฟล์ PDF ไปยัง Drive แล้ว: ' + driveFileUrl);

  // --- ส่งข้อความพร้อมลิงก์ PDF ไปยัง LINE Messaging API ---
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