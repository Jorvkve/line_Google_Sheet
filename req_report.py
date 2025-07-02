import requests
from datetime import datetime, timedelta

# ====== CONFIG SECTION ======
WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzzC_wcG9TXcVd1gbfWAmLrWrJ3ydKEzVaBC-zvQdAYO8AbdPXyUm0YxSIY3jwPxP_M/exec'
SECRET_KEY = 'SentReportTelegram'
DATE_TO_SEND = (datetime.now() - timedelta(days=11)).strftime('%#d/%#m/%Y') # For Linux/macOS

def send_telegram_alert(message):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {
        'chat_id': TELEGRAM_CHAT_ID,
        'text': message
    }
    requests.post(url, json=payload)

try:
    params = {
        'key': SECRET_KEY,
        'date': DATE_TO_SEND
    }

    response = requests.post(WEB_APP_URL, data=params)

    if response.status_code == 200:
        if "Error" in response.text:
            msg = f"❌ ระบบแจ้งเตือน NOC\nเกิดข้อผิดพลาดจาก Apps Script\n📅 วันที่: {DATE_TO_SEND}\n📋 รายละเอียด:\n{response.text}"
            send_telegram_alert(msg)
        else:
            print("✅ เรียกใช้ Apps Script สำเร็จ:", response.text)
    else:
        msg = f"🚨 ระบบแจ้งเตือน NOC\nเรียก Apps Script แล้วได้รหัสผิดพลาด\n📅 วันที่: {DATE_TO_SEND}\n🔴 Status: {response.status_code}\n📋 รายละเอียด:\n{response.text}"
        send_telegram_alert(msg)

except Exception as e:
    msg = f"⚠️ ระบบแจ้งเตือน NOC\nเกิด Exception ระหว่างเรียกใช้งาน\n📅 วันที่: {DATE_TO_SEND}\n💥 ข้อผิดพลาด:\n{str(e)}"
    send_telegram_alert(msg)
