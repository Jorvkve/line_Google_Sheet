const SPREADSHEET_ID = '15A7h62tRxTrbEHzK6UOam3fVn_H7HBxAcGXT4I2ElXM'; // sheetID
const LINE_RECIPIENT_ID = 'U6d7c919f17a1da64a3c50669201f3cc9'; // userID


// --- ฟังก์ชันหลักสำหรับ Web App (doPost) ---
function doPost(e) {
  const SECRET_KEY = PropertiesService.getScriptProperties().getProperty('SECRET_KEY'); 
  const LINE_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_TOKEN');   

  // ตรวจสอบว่า LINE_TOKEN และ SECRET_KEY ได้ถูกตั้งค่าใน Script Properties หรือไม่
  // หากไม่ได้ตั้งค่า จะคืนค่าข้อผิดพลาดกลับไปทันที
  if (!LINE_TOKEN) {
    Logger.log('ERROR: LINE_TOKEN is not set in Script Properties.');
    return ContentService.createTextOutput("Error: LINE_TOKEN not configured.").setMimeType(ContentService.MimeType.TEXT);
  }
  if (!SECRET_KEY) {
    Logger.log('ERROR: SECRET_KEY is not set in Script Properties.');
    return ContentService.createTextOutput("Error: SECRET_KEY not configured.").setMimeType(ContentService.MimeType.TEXT);
  }

  // ตรวจสอบความถูกต้องของ SECRET_KEY ที่ส่งมาในคำขอ POST
  // e.parameter คือออบเจกต์ที่เก็บพารามิเตอร์ที่ส่งมากับคำขอ POST
  // ถ้า 'key' ไม่ตรงกับ SECRET_KEY ที่ตั้งไว้ จะคืนค่าข้อผิดพลาด
  if (!e.parameter || e.parameter.key !== SECRET_KEY) {
    Logger.log('ERROR: Invalid or missing secret key.');
    return ContentService.createTextOutput("Error: Invalid or missing secret key.").setMimeType(ContentService.MimeType.TEXT);
  }

  // ดึงค่า 'date' (วันที่ที่ต้องการส่งรายงาน) จากพารามิเตอร์ในคำขอ POST
  const dateString = e.parameter.date;
  // หากไม่มีพารามิเตอร์ 'date' ส่งมา จะคืนค่าข้อผิดพลาด
  if (!dateString) {
    Logger.log('ERROR: Missing "date" parameter in the request.');
    return ContentService.createTextOutput("Error: Missing 'date' parameter.").setMimeType(ContentService.MimeType.TEXT);
  }

  // บันทึก Log เพื่อติดตามการทำงาน: แสดงวันที่ที่ได้รับคำขอ
  Logger.log('Received request to send report for date: ' + dateString);
  try {
    // เรียกใช้ฟังก์ชัน sendReportByDate เพื่อประมวลผลและส่งรายงาน
    // ส่ง dateString และ LINE_TOKEN ที่ดึงมาเป็นพารามิเตอร์
    sendReportByDate(dateString, LINE_TOKEN);
    return ContentService.createTextOutput("Report processing complete for " + dateString).setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    // ถ้าเกิดข้อผิดพลาดระหว่างการประมวลผล จะบันทึก Log และคืนค่าข้อผิดพลาดกลับไป
    Logger.log('Error processing report: ' + error.message);
    return ContentService.createTextOutput("Error processing report: " + error.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

// --- ฟังก์ชันดึงข้อมูล กรอง และส่งรายงาน (sendReportByDate) ---
function sendReportByDate(dateString, lineToken) {
  // เปิด Google Sheet ด้วย ID ที่กำหนด
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  // เลือกชีท โดย เลือกชื่อชีท
  const sheet = spreadsheet.getSheetByName('06/2025'); 

  // headerOffset: กำหนดจำนวนแถวที่เป็น Header (หัวตาราง) ที่ต้องการข้ามไป
  // ในที่นี้คือ 1 แถวแรก
  const headerOffset = 1;
  // ดึงข้อมูลทั้งหมดจากช่วงข้อมูลที่มีในชีท (ตั้งแต่ A1 ไปจนถึงเซลล์สุดท้ายที่มีข้อมูล)
  const rawData = sheet.getDataRange().getValues();
  // filteredData: อาร์เรย์สำหรับเก็บข้อมูลที่ถูกกรองแล้ว
  // แต่ละรายการในอาร์เรย์นี้จะเป็นออบเจกต์ที่มี rowData (ข้อมูลทั้งแถว) และ sheetRowIndex (เลขแถวจริงในชีท)
  const filteredData = []; 

  // ลูปเพื่อกรองข้อมูลตามวันที่และสถานะการส่งในคอลัมน์ K
  // เริ่มจากแถวถัดจาก Header (i = headerOffset)
  for (let i = headerOffset; i < rawData.length; i++) { 
    const row = rawData[i]; // ข้อมูลของแถวปัจจุบัน
    const cellValue = row[0]; // ค่าในคอลัมน์ A (Index 0) ซึ่งเป็นคอลัมน์วันที่

    // sentStatus: ค่าในคอลัมน์ K (Index 10) ที่ใช้บันทึกสถานะว่าส่งไปแล้วหรือยัง
    const sentStatus = String(row[10] || '').trim(); 

    // ตรวจสอบว่าแถวนี้ถูกใส่ข้อความว่า "ส่งแล้ว" หรือย(ไม่คำนึงถึงตัวพิมพ์เล็ก-ใหญ่)
    // ถ้า "ส่งแล้ว" จะข้ามแถวนี้ไป ไม่นำมารวมในรายงาน
    if (sentStatus.toLowerCase() === 'ส่งแล้ว') {
      Logger.log(`Skipping row ${i + 1} as it's already marked as 'ส่งแล้ว'.`);
      continue; // ข้ามไปรอบถัดไปของลูป
    }

    let cellDateFormatted; // ตัวแปรสำหรับเก็บค่าวันที่ที่ถูกจัดรูปแบบแล้ว
    // ตรวจสอบว่าค่าในเซลล์วันที่เป็นออบเจกต์ Date หรือไม่
    if (cellValue instanceof Date) {
      // ถ้าเป็น Date object ให้จัดรูปแบบเป็น 'd/M/yyyy'
      cellDateFormatted = Utilities.formatDate(cellValue, Session.getScriptTimeZone(), 'd/M/yyyy');
    } else {
      // ถ้าไม่ใช่ Date object (อาจเป็น String หรือ Number)
      try {
        const parsedDate = new Date(cellValue); // พยายามแปลงค่าในเซลล์เป็น Date object
        // ตรวจสอบว่า parsedDate เป็นวันที่ที่ถูกต้อง (ไม่ใช่ 'Invalid Date')
        if (!isNaN(parsedDate.getTime())) {
          // ถ้าแปลงได้ถูกต้อง ให้จัดรูปแบบเป็น 'd/M/yyyy'
          cellDateFormatted = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), 'd/M/yyyy');
        } else {
          // ถ้าแปลงไม่ได้ ให้ใช้ค่าเดิมในเซลล์เป็น String แล้วตัดช่องว่าง
          cellDateFormatted = String(cellValue).trim(); 
        }
      } catch (e) {
        cellDateFormatted = String(cellValue).trim(); 
      }
    }

    // เปรียบเทียบวันที่ที่จัดรูปแบบแล้วกับ dateString ที่ต้องการ
    if (cellDateFormatted === dateString) {
      // หากตรงกัน ให้เพิ่มข้อมูลแถวและเลขแถวจริง (1-indexed) ลงใน filteredData
      filteredData.push({ rowData: row, sheetRowIndex: i + 1 });
    }
  }

  // ถ้าไม่พบข้อมูลสำหรับวันที่ที่ระบุ หรือข้อมูลทั้งหมดถูกส่งไปแล้ว
  if (filteredData.length === 0) {
    const noDataMessage = `📝 รายงานประจำวัน NOC ประจำวันที่ ${dateString}\nไม่มีข้อมูลรายงานสำหรับวันนี้ หรือข้อมูลที่เกี่ยวข้องถูกส่งไปแล้ว`;
    sendLineMessage(LINE_RECIPIENT_ID, noDataMessage, lineToken); // ส่งข้อความแจ้งเตือนไป LINE
    Logger.log('No data found for date ' + dateString + ' or all relevant data has been sent.');
    return; // จบการทำงานของฟังก์ชัน
  }

  // --- สร้างข้อความรายงานสำหรับ LINE ---
  let messageText = `📊 รายงานประจำวัน NOC ประจำวันที่ ${dateString} 📊\n\n`;
  filteredData.forEach((item, index) => {
    const row = item.rowData;
    // ดึงข้อมูลจากแต่ละคอลัมน์ และใช้ ' - ' เป็นค่าเริ่มต้นหากข้อมูลว่างเปล่า
    // เพื่อให้ข้อความดูสะอาดตา
    const date = row[0] ? Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), 'dd/MM/yyyy') : '-';
    const downtime = row[1] || '-';
    const network = row[2] || '-';
    const link = row[3] || '-';
    const ntId = row[4] || '-';
    const ticket = row[5] || '-';
    const uptime = row[6] || '-';
    const causeSolved = row[8] || '-'; // คอลัมน์ I (Index 8)
    const shift = row[9] || '-'; // คอลัมน์ J (Index 9)

    // จัดรูปแบบข้อความในแต่ละเหตุการณ์
    messageText += `--- เหตุการณ์ที่ ${index + 1} ---\n`;
    messageText += `🔹 วันที่: ${date}\n`;
    messageText += `  ⏱️ Downtime: ${downtime}\n`;
    messageText += `  🌐 Network: ${network}\n`;
    messageText += `  🔗 Link: ${link}\n`;
    messageText += `  🆔 NT ID: ${ntId}\n`;
    messageText += `  🎫 Ticket: ${ticket}\n`;
    messageText += `  ⏲️ Uptime: ${uptime}\n`;
    messageText += `  📝 สาเหตุ/แก้ไข: ${causeSolved}\n`;
    messageText += `  👨‍🔧 ผลัด: ${shift}\n`;
    messageText += `--------------------\n\n`; 
  });

  // --- ส่งข้อความไปยัง LINE ---
  const isMessageSent = sendLineMessage(LINE_RECIPIENT_ID, messageText, lineToken);

  // --- อัปเดตสถานะในคอลัมน์ K หากส่งข้อความสำเร็จ ---
  if (isMessageSent) {
    // ถ้าส่งข้อความสำเร็จ ให้ลูปผ่านข้อมูลที่ถูกกรอง
    // และทำเครื่องหมายในคอลัมน์ K ของแต่ละแถวเป็น 'ส่งแล้ว'
    // Column K คือคอลัมน์ที่ 11 (เมื่อนับจาก 1) หรือ Index 10 (เมื่อนับจาก 0)
    // การใช้ getRangeList().setValue() ช่วยให้การอัปเดตมีประสิทธิภาพมากขึ้น (batch update)
    const rangesToUpdate = filteredData.map(item => sheet.getRange(item.sheetRowIndex, 11));
    sheet.getRangeList(rangesToUpdate.map(range => range.getA1Notation())).setValue('ส่งแล้ว');
    Logger.log(`Successfully marked ${filteredData.length} rows as 'ส่งแล้ว' in Column K.`);
  } else {
    // หากส่งข้อความไม่สำเร็จ จะไม่ทำเครื่องหมายในคอลัมน์ K
    Logger.log('LINE message failed to send, not marking rows as "ส่งแล้ว".');
  }
}

// --- ฟังก์ชันสำหรับส่งข้อความ LINE (sendLineMessage) ---
function sendLineMessage(recipientId, messageText, lineToken) {
  const message = {
    to: recipientId,
    messages: [{
      type: 'text',
      text: messageText
    }]
  };

  // กำหนด Options สำหรับการเรียกใช้ UrlFetchApp (สำหรับส่ง HTTP Request)
  const lineOptions = {
    method: 'post', // ส่งคำขอ POST
    headers: {
      'Content-Type': 'application/json', // ระบุประเภทเนื้อหาเป็น JSON
      'Authorization': 'Bearer ' + lineToken
    },
    payload: JSON.stringify(message), // แปลง Payload Objectให้เป็น String ในรูปแบบ JSON
    muteHttpExceptions: true
  };

  try {
    // ส่งคำขอ POST ไปยัง LINE Messaging API Endpoint
    const lineResponse = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', lineOptions);
    // ตรวจสอบรหัสสถานะการตอบกลับ (Response Code)
    if (lineResponse.getResponseCode() === 200) {
      Logger.log('Report sent successfully to LINE.');
      return true; // ส่งสำเร็จ
    } else {
      // หากเกิดข้อผิดพลาด (เช่น รหัสสถานะไม่ใช่ 200) บันทึก Log ข้อผิดพลาด
      Logger.log(`Error sending LINE message: ${lineResponse.getResponseCode()} - ${lineResponse.getContentText()}`);
      return false; // ส่งไม่สำเร็จ
    }
  } catch (e) {
    // หากเกิดข้อผิดพลาดในการเชื่อมต่อ (เช่น ไม่มีอินเทอร์เน็ต) บันทึก Log
    Logger.log(`Error connecting to LINE API: ${e.message}`);
    return false; // ส่งไม่สำเร็จ
  }
}


// --- ฟังก์ชันสำหรับตั้งค่า Script Properties (รันเพียงครั้งเดียว) ---

function setLineToken() {
  const token = 'Jx3G+BdFqybi6bxsnpw/LR6Gi8JR5ATraUG/Oi+6sJ/hzo3be9dvVGSAORWuG9dRg0BU5c+PLUI8GBxb8xd8QhFYnsc8K4jzwcydG5TJhMVq3JIbK+/5cLp0/c8nYZzG1gfYMe45FeypS1DZHMc6PwdB04t89/1O/w1cDnyilFU='; 
  PropertiesService.getScriptProperties().setProperty('LINE_TOKEN', token);
  Logger.log('LINE_TOKEN has been set.');
}

/**
 * ฟังก์ชัน setSecretKey() ใช้สำหรับตั้งค่า SECRET_KEY ใน Script Properties
 * ควรเรียกใช้ฟังก์ชันนี้เพียงครั้งเดียวหลังจากกำหนด Secret Key ที่ถูกต้องแล้ว
 */
function setSecretKey() {
  // แทนที่ 'YOUR_SECRET_KEY_HERE' ด้วย Secret Key ที่คุณต้องการใช้
  // คีย์นี้ต้องตรงกับที่ใช้ใน Python script เพื่อให้สามารถเรียกใช้ Web App ได้
  const key = 'SentReport01'; 
  PropertiesService.getScriptProperties().setProperty('SECRET_KEY', key);
  Logger.log('SECRET_KEY has been set.');
}