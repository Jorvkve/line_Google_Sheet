import requests

# ทำให้ URL ผิด
WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw7cPT5xMOZXDaO-05Rtefka8CIVpiF03x7-T7vsXcbZi0Ypd9qjlABA82Rce3wMZOB/exec' # เปลี่ยน /exec เป็นอย่างอื่น
# หรือ
# WEB_APP_URL = 'http://wrong.url.com/exec' # เปลี่ยนโปรโตคอลหรือโดเมน

SECRET_KEY = 'sheetLine2684'

try:
    response = requests.post(WEB_APP_URL, data={'key': SECRET_KEY})
    if response.status_code == 200:
        print("เรียกใช้ Apps Script สำเร็จ:", response.text)
    else:
        print("เกิดข้อผิดพลาด:", response.status_code, response.text)
except requests.exceptions.RequestException as e: # ดักจับ Error ที่เกิดจาก requests
    print(f"เกิดข้อผิดพลาดในการเชื่อมต่อหรือ Request: {e}")