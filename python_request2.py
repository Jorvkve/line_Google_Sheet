"""import requests

WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw9gs5paErwjb0uMax06BTNLq2rjaOrfvGWkpieLsX9n_eSmHQlvGREIv6ytsKGqsaM/exec'
SECRET_KEY = 'sheetLine2685'
DATE_TO_SEND = '17/6/2025'  # วันที่ที่ต้องการส่งรายงาน (ตามฟอร์แมตในชีท)

params_to_send = {
    'key': SECRET_KEY,
    'date': DATE_TO_SEND
}

response = requests.post(WEB_APP_URL, data=params_to_send)

if response.status_code == 200:
    print("เรียกใช้ Apps Script สำเร็จ:", response.text)
else:
    print("เกิดข้อผิดพลาด:", response.status_code, response.text)"""

from datetime import datetime, timedelta
import requests

# ใช้วันที่เมื่อวาน
yesterday = datetime.now() - timedelta(days=1) #วันที่ 18 - 1 คือ วันที่17
DATE_TO_SEND = yesterday.strftime('%#d/%#m/%Y')

WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw9gs5paErwjb0uMax06BTNLq2rjaOrfvGWkpieLsX9n_eSmHQlvGREIv6ytsKGqsaM/exec'
SECRET_KEY = 'sheetLine2685'

params = {
    'key': SECRET_KEY,
    'date': DATE_TO_SEND
}

response = requests.post(WEB_APP_URL, data=params)

if response.status_code == 200:
    print("เรียกใช้ Apps Script สำเร็จ:", response.text)
else:
    print("เกิดข้อผิดพลาด:", response.status_code, response.text)
