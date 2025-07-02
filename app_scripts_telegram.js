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
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('06/2025');
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

  let fullMessage = `📊 รายงานประจำวัน NOC วันที่ ${dateString} 📊\n\n`;

  filteredData.forEach((item, index) => {
    const r = item.rowData;

    let formattedDate = '-';
    if(r[0] instanceof Date) {
        formattedDate = Utilities.formatDate(r[0], Session.getScriptTimeZone(), 'dd/MM/yyyy');
    } else {
        const parsed = new Date(r[0]);
        if (!isNaN(parsed.getTime())) {
            formattedDate = Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'dd/MM/yyyy');
        } else {
            formattedDate = String(r[0]).trim();
        }
    }
    fullMessage += `--- เหตุการณ์ที่ ${index + 1} ---\n`;
    fullMessage += `🔹 วันที่: ${formattedDate}\n`;
    fullMessage += `⏱️ Downtime: ${r[1] || '-'}\n`;
    fullMessage += `🌐 Network: ${r[2] || '-'}\n`;
    fullMessage += `🔗 Link: ${r[3] || '-'}\n`;
    fullMessage += `🆔 NT ID: ${r[4] || '-'}\n`;
    fullMessage += `🎫 Ticket: ${r[5] || '-'}\n`;
    fullMessage += `⏲️ Uptime: ${r[6] || '-'}\n`;
    fullMessage += `📝 สาเหตุ: ${r[8] || '-'}\n`;
    fullMessage += `👨‍🔧 ผลัด: ${r[9] || '-'}\n`;
    fullMessage += `--------------------\n\n`;
  });

  splitAndSendTelegram(TELEGRAM_CHAT_ID, fullMessage, telegramToken);

  const ranges = filteredData.map(item => sheet.getRange(item.rowIndex, 11));
  sheet.getRangeList(ranges.map(r => r.getA1Notation())).setValue('ส่งแล้ว');
}

function formatCell(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  }
  return value || '-';
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

function splitAndSendTelegram(chatId, longText, token) {
  const max = 4096;
  for (let i = 0; i < longText.length; i += max) {
    const chunk = longText.substring(i, i + max);
    Utilities.sleep(1000);
    sendTelegramMessage(chatId, chunk, token);
  }
}
/**
// ✅ เรียกใช้ครั้งเดียวเพื่อตั้งค่า token และ key
function setTelegramToken() {
  const token = '7200049046:AAEk0c-9yKGrdY9NWiq82MGbwsMQhmJTG0M'; // 🔁 ใส่ token ของคุณ
  PropertiesService.getScriptProperties().setProperty('TELEGRAM_TOKEN', token);
}

function setSecretKey() {
  const key = 'SentSentReportTelegramReport01';
  PropertiesService.getScriptProperties().setProperty('SECRET_KEY', key);
}*/
