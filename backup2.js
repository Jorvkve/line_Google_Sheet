function sendGoogleSheetUrlToLine() { // เปลี่ยนชื่อฟังก์ชันเพื่อให้แยกแยะได้
  // --- การตั้งค่า (Configuration) ---
  const SPREADSHEET_ID = '15A7h62tRxTrbEHzK6UOam3fVn_H7HBxAcGXT4I2ElXM'; // ID ของ Google Sheet
  const LINE_CHANNEL_ACCESS_TOKEN = 'KKADfbAWvHXpa+ndAhrSg3KoGdtDupP9PWXS+P6q+fglyyBCk/fhzPs+YrYWo6Sag0BU5c+PLUI8GBxb8xd8QhFYnsc8K4jzwcydG5TJhMXBHxJuCGWYGP8zgu2Ep1lhsOOZfw9ti+HuWUo8NrEm7AdB04t89/1O/w1cDnyilFU='; // Channel Access Token
  const LINE_CHANNEL_SECRET = 'dde0dd09027a0ad7afb1ae504ed7ec0a';     // Channel Secret
  const LINE_RECIPIENT_ID = 'C468fb34d0bdf08e80e8b288bd66c39cd'; // USER ID

  // --- ดึง URL ของ Google Sheet ---
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const spreadsheetUrl = spreadsheet.getUrl(); // นี่คือ URL ของ Google Sheet นั้นๆ โดยตรง
  const spreadsheetName = spreadsheet.getName(); // ดึงชื่อ Spreadsheet มาใช้ในข้อความ

  Logger.log('URL ของ Google Sheet: ' + spreadsheetUrl);

  // --- ส่งข้อความพร้อม URL ของ Google Sheet ไปยัง LINE Messaging API ---
  const lineApiUrl = 'https://api.line.me/v2/bot/message/push'; // สำหรับส่งแบบ Push Message

  const message = {
    type: 'text',
    text: `รายงานประจำวัน NOC\nสามารถดูรายงานล่าสุดได้ที่ Google Sheet: ${spreadsheetName}\n${spreadsheetUrl}`
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
      Logger.log('ส่ง URL Google Sheet ไปยัง LINE Messaging API สำเร็จแล้ว.');
    } else {
      Logger.log('เกิดข้อผิดพลาดในการส่งข้อความไปยัง LINE Messaging API: ' + lineResponseCode + ' - ' + lineResponseText);
      Logger.log('Response body: ' + lineResponseText);
    }
  } catch (e) {
    Logger.log('เกิดข้อผิดพลาดขณะส่งไปยัง LINE Messaging API: ' + e.toString());
  }
}