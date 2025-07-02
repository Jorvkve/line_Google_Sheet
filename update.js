const SPREADSHEET_ID = '1EGNI-kzmiG6bj_Org3MJtyKzVlFo-K20vusFpTaEd-o';
const TELEGRAM_CHAT_ID = '-4800912172'; // 🔁 แก้เป็น chat_id ของคุณ

function doPost(e) {
  const SECRET_KEY = PropertiesService.getScriptProperties().getProperty('SECRET_KEY');
  const TELEGRAM_TOKEN = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');

  if (!TELEGRAM_TOKEN || !SECRET_KEY) {
    return ContentService.createTextOutput("Error: Missing configuration.").setMimeType(ContentService.MimeType.TEXT);
  }

  if (!e.parameter || e.parameter.key !== SECRET_KEY) {
    return ContentService.createTextOutput("Error: Invalid or missing secret key.").setMimeType(ContentService.MimeType.TEXT);
  }

  const dateString = e.parameter.date;
  if (!dateString) {
    return ContentService.createTextOutput("Error: Missing 'date' parameter.").setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    sendReportByDate(dateString, TELEGRAM_TOKEN);
    return ContentService.createTextOutput("Report sent for " + dateString).setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput("Error processing report: " + error.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

function sendReportByDate(dateString, telegramToken) {
  // แปลง dateString เช่น "2/7/2568" ให้ได้ชื่อชีท "07/2568"
  const parts = dateString.split('/');
  if(parts.length < 3) {
    throw new Error("Invalid date format, expected d/M/yyyy");
  }
  const month = parts[1].padStart(2, '0');
  const year = parts[2];
  const sheetName = `${month}/${year}`;

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet named "${sheetName}" not found`);
  }

  const data = sheet.getDataRange().getValues();
  const filteredData = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dateCell = row[0];
    const status = String(row[10] || '').trim().toLowerCase();

    if (status === 'ส่งแล้ว') continue;

    let formattedDate;
    if (dateCell instanceof Date) {
      formattedDate = Utilities.formatDate(dateCell, Session.getScriptTimeZone(), 'd/M/yyyy');
    } else {
      const parsed = new Date(dateCell);
      formattedDate = !isNaN(parsed.getTime()) ? Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'd/M/yyyy') : String(dateCell).trim();
    }

    if (formattedDate === dateString) {
      filteredData.push({ rowData: row, rowIndex: i + 1 });
    }
  }

  if (filteredData.length === 0) {
    const noDataMsg = `📝 รายงานประจำวันที่ ${dateString}\nไม่มีข้อมูล หรือข้อมูลถูกส่งแล้วทั้งหมด`;
    sendTelegramMessage(TELEGRAM_CHAT_ID, noDataMsg, telegramToken);
    return;
  }

  filteredData.forEach((item, index) => {
    const r = item.rowData;

    let formattedDate = '-';
    if (r[0] instanceof Date) {
      formattedDate = Utilities.formatDate(r[0], Session.getScriptTimeZone(), 'dd/MM/yyyy');
    } else {
      const parsed = new Date(r[0]);
      if (!isNaN(parsed.getTime())) {
        formattedDate = Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'dd/MM/yyyy');
      } else {
        formattedDate = String(r[0]).trim();
      }
    }

    let message = `📌 เหตุการณ์ที่ ${index + 1} 📌\n`;
    message += `🔹 วันที่: ${formattedDate}\n`;
    message += `⏱️ Downtime: ${r[1] || '-'}\n`;
    message += `🌐 Network: ${r[2] || '-'}\n`;
    message += `🔗 Link: ${r[3] || '-'}\n`;
    message += `🆔 NT ID: ${r[4] || '-'}\n`;
    message += `🎫 Ticket: ${r[5] || '-'}\n`;
    message += `⏲️ Uptime: ${r[6] || '-'}\n`;
    message += `📝 สาเหตุ: ${r[8] || '-'}\n`;
    message += `👨‍🔧 ผลัด: ${r[9] || '-'}\n`;

    sendTelegramMessage(TELEGRAM_CHAT_ID, message, telegramToken);

    // ทำเครื่องหมาย "ส่งแล้ว" แถวที่ส่ง
    sheet.getRange(item.rowIndex, 11).setValue('ส่งแล้ว');

    Utilities.sleep(1000); // หน่วงเวลาป้องกัน Telegram API block
  });
}

function sendTelegramMessage(chatId, messageText, telegramToken) {
  const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: messageText
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const res = UrlFetchApp.fetch(url, options);
    Logger.log(`Telegram response [${res.getResponseCode()}]: ${res.getContentText()}`);
    return res.getResponseCode() === 200;
  } catch (e) {
    Logger.log("Telegram send error: " + e.message);
    return false;
  }
}
