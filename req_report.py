import requests
from datetime import datetime, timedelta

WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby7dJRANIxK7w6hzoGfQCw7q2QwyxC53U4D-ATbt8gOVbFNx_cOERJ0nF6JAt3fk31P/exec'  # ใส่ Web App URL
SECRET_KEY = 'SentReportTelegram' #'SentReport01' # ใส่ secret key ที่คุณตั้งใน Google Apps Script
DATE_TO_SEND = (datetime.now() - timedelta(days=14)).strftime('%#d/%#m/%Y')  # ใช้วันที่ของเมื่อวาน 0 = ปัจจุบัน เป็น + คือเพิ่มวันในอนาคต

params = {
    'key': SECRET_KEY,
    'date': DATE_TO_SEND
}

response = requests.post(WEB_APP_URL, data=params)

if response.status_code == 200:
    print("เรียกใช้ Apps Script สำเร็จ:", response.text)
else:
    print("เกิดข้อผิดพลาด:", response.status_code, response.text)
    