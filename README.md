# App_Scripts&Python Report Daily

โปรเจกต์นี้เป็นระบบอัตโนมัติสำหรับดึงข้อมูลรายงานประจำวันของแผนก NOC จาก Google Sheet กรองข้อมูลตามวันที่ และส่งรายงานสรุปไปยัง LINE Group หรือ LINE User ที่กำหนดไว้ โดยระบบจะทำงานอัตโนมัติทุกวันตามเวลาที่ตั้งค่าด้วย Task Scheduler (Windows) หรือ Cron Job (Linux/macOS)

## สารบัญ Table of Contents
- [คุณสมบัติหลัก](#%E0%B8%84%E0%B8%B8%E0%B8%93%E0%B8%AA%E0%B8%A1%E0%B8%9A%E0%B8%B1%E0%B8%95%E0%B8%B4%E0%B8%AB%E0%B8%A5%E0%B8%B1%E0%B8%81)
- [หลักการทำงาน](#%E0%B8%AB%E0%B8%A5%E0%B8%B1%E0%B8%81%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%97%E0%B8%B3%E0%B8%87%E0%B8%B2%E0%B8%99)
- การตั้งค่าและเริ่มต้นการใช้งาน

## คุณสมบัติหลัก
-   **ดึงข้อมูลจาก Google Sheet**: อ่านข้อมูลจากชีทที่กำหนด
    
-   **กรองข้อมูลตามวันที่**: กรองเฉพาะข้อมูลของวันที่ที่ต้องการ (เช่น วันที่เมื่อวาน)
    
-   **จัดรูปแบบข้อความ**: จัดรูปแบบข้อความรายงานให้สวยงามและอ่านง่ายใน LINE พร้อม Emoji และการเน้นข้อความ
    
-   **ป้องกันการส่งซ้ำ**: ติดตามสถานะการส่งในคอลัมน์ `K` ของ Google Sheet และจะไม่ส่งข้อมูลที่ถูกทำเครื่องหมายว่า "ส่งแล้ว" ซ้ำอีก
    
-   **การแจ้งเตือน**: ส่งข้อความแจ้งเตือนไปยัง LINE หากไม่พบข้อมูลสำหรับวันที่ที่ระบุ หรือข้อมูลทั้งหมดถูกส่งไปแล้ว
    
-   **การเรียกใช้งานจากภายนอก**: สามารถเรียกใช้งานได้ผ่าน HTTP POST request ทำให้สามารถตั้งเวลาการทำงานได้จากภายนอก (เช่น Task Scheduler, Cron Job)

## หลักการทำงาน

ระบบนี้จะประกอบไปด้วย 2 ส่วนหลักที่ทำงานร่วมกัน :
 1. **Google App Script(Web App)**
	- ทำหน้าที่เป็น"API Endpoint" ที่รับคำขอ HTTP POST จาก Python Script
	- เข้าถึง Google Sheet  เพื่อดึงข้อมูลและกรองข้อมูล
	- จัดการการส่งข้อความไปยัง Line ผ่าน Line Messaging API
	- อัปเดตสถานะ "ส่งแล้ว" ในคอลัมน์ ในทีนี้คือ คอลัมน์ `K` ของ Google Sheet
	 - มีการตรวจสอบ `SECRET_KEY` เพื่อความปลอดภัยในการเรียกใช้งาน
 2. **Python Scripts**
	 - ถูกตั้งเวลาให้รันอัตโนมัติ ( เช่น ทุกวันเวลาเที่ยงคืน 00:00) โดยใช้ Task Scheduler หรือ Cron Job
	 - คำนวณวันที่ที่ต้องการส่งรายงาน (ปกติคือเมื่อวาน)
	 - ส่งคำขอ HTTP POST ไปยัง Google Apps Script Web App พร้อมพารามิเตอร์ `date` และ `Key`(Secret Key)
## การตั้งค่าและเริ่มต้นใช้งาน
ทำตามขั้นตอนเหล่านี้เพื่อตั้งค่าและรันระบบส่งรายงาน

**ขั้นตอนที่ 1 : เตรียม Google Sheet**
สร้าง Google Sheet ใหม่ (หรือใช้ Sheet ที่มีอยู่แล้ว) และเตรียมข้อมูลสำหรับรายงาน NOC ตรวจสอบให้แน่ใจว่ามีคอลัมน์สำหรับ `วันที่` (เช่น คอลัมน์ A) และ เพิ่มคอลัมน์ `K` (คอลัมน์ที่ 11) สำหรับบันทึกสถานะการส่ง
|  คอลัมน์ A   | คอลัมน์ B| ... | คอลัมน์ I |คอลัมน์ J | คอลัมน์ K |
| --- | --- | --- | --- | --- | ---|
| `วันที่` | `Downtime` | `...` | `Cause/Solved` | `Shift` | `สถานะการส่ง` |
| 20/6/2025 | 18.00 น. | ... | แก้ไขเรียบร้อยแล้ว | กลางวัน | - |
| 20/6/2025 | 23.20 น. | ... | อุปกรณ์เสีย| กลางคืน | ส่งแล้ว |
- หมายเหตุ
	- ตรวจสอบให้แน่ใจว่าคอลัมน์ `วันที่` (`row[0]`ในโค้ด ) มีรูปแบบที่สอดคล้อง เช่น  `DD/MM/YYYY` (เช่น 20/06/2025)
	- คอลัมน์ `K` เป็นคอลัมน์สำหรับสถานะการส่ง (ไม่ต้องใส่หัวข้อใน Sheet ก็ได้ แต่ต้องกำหนดคอลัมน์ที่ต้องการจะใส่`สถานะ`)
<!--- BLANKKKKKKKKKKKKKKKKKKKKK--->
**ขั้นตอนที่ 2 : ตั้งค่า Line Bot (Messaging API)**
จะต้องมี Line Bot Channel	 และ Channel Access Token เพื่อส่งข้อความ  :
1. **สร้าง Line Channel	:**
	- ไปที่ [Line Developers Console](https://developers.line.biz/console/) 
	- เข้าสู่ระบบด้วยบัญชี Line 
	- สร้าง New Provider (หากยังไม่มี)
	- สร้าง New Channel เลือก Messaging API (เปิดใช้ Messaging API บน [Line Business](https://manager.line.biz/) ก่อน)
	- ตั้งชื่อ Channel, เลือกหมวดหมู่, อ่านและยอมรับข้อตกลง
2. **รับ Channel Access Token	:**
	- หลังจากสร้าง Channel แล้ว เข้าไปที่ Channel ที่สร้าง
	- ไปที่แท็บ Messaging API
	- เลื่อนลงมาที่ส่วน **Channel Access Token** และ กด **Issue** จากนั้น คัดลอก Token ไว้
3. **ระบุ Line User ID หรือ Group ID ผู้รับ :**
	- สำหรับ User ID : สามารถหาได้จาก การทดสอบส่งข้อความหา Bot จาก Line ส่วนตัว โดยเข้าเว็บ Webhook.site จากนั้น คัดลอก **Your unique URL** ไปใส่ Webhook URL ของ Line Developers Console และกด Use webhook กับ Verify บ หน้าเว็บพอส่งข้อความจะแสดง request และแสดง User ID หรือ Group ID
<!--- BLANKKKKKKKKKKKKKKKKKKKKK --->
**ขั้นตอนที่ 3 : ตั้งค่า Google Apps Script (เป็น Web App)**
1. **เปิด Google Apps Script Editor :**
	- เปิด Google Sheet ที่เตรียมไว้ใน ขั้นตอนที่ 1
	- ไปที่เมนู **ส่วนขยาย (Extension) > App Script**
2. **คัดลอก Apps Scripts :**
3.  **แก้ไขค่าคงที่ในโค้ด Apps Script :** 
	- const SPREADSHEET_ID = ' . . . '; ให้เป็น ID ของ Google Sheet 
	- const LINE_RECIPIENT_ID = ' . . . '; ให้เป็น User ID หรือ Group ID ของ Line ผู้รับ
4. **ตั้งค่า `LINE_TOKEN` และ `SECRET_KEY` ใน Script Properties (สำคัญมาก!) :**
	- ไปที่ Project Setting (ไอคอนฟันเฟืองซ้ายมือ)
	- เลื่อนลงมาที่ส่วน Script Properties
	- คลิก Add Property
		- **สำหรับ LINE_TOKEN :**
			- Property (ชื่อ) : `LINE_TOKEN`
			- Value (ค่า) : (วาง **Channel Access Token** ที่คัดลอกจาก ขั้นตอนที่ 2 ลงไป)
		- **สำหรับ SECRET_KEY :**
			- Property (ชื่อ) : `SECRET_KEY`
			- Value (ค่า) : กำหนดคีย์ลับที่ต้องการ (เช่น `SentReport101`) คีย์นี้ต้องตรงกับที่ใช้ใน Python Script
	- คลิก Save
	- (Option : สามารถรันฟังก์ชัน setLineToken() และ setSecretKey() ใน Apps Script Editor โดยแก้ไขค่าในฟังก์ชันแล้วรันครั้งเดียวได้ หลักจากนั้นสามารถลบฟังกืชันเหล่านี้ออกได้เลย)
5. **บันทึกโปรเจกต์** : กดไอคอนรูปแผ่นดิสก์ บันทึกโปรเกจต์ (Save Project) 
6. **Deploy เป็น Web App :**
	-	คลิกที่เมนู **Deploy (การทำให้ใช้งานได้)**  ที่มุมขวาบน
	-	เลือก **New Deployment (การทำให้ใช้งานได้รายการใหม่)**
	-	ในหน้าต่าง **"Select type"** เลือก **Web App**
	-	ตั้งค่าดังนี้
		-	**Description (คำอธิบาย) :** ใส่คำอธิบายที่ต้องการ  (เช่น `Daily Report API`)
		-	**Execute as (ทำงานในฐานะ) :**  เลือกบัญชี Google ที่ใช้งาน
		-	**Who has access (ใครสามารถเข้าถึงได้) :** เลือก `Anyone`
			-	สำคัญ : ต้องเลือก `Anyone` เพื่อให้ Python Script ที่รันอยู่ภายนอกสามารถเรียก API นี้ได้
	-  คลิก **Deploy (ทำให้ใช้งานได้)**
	- หากเป็นครั้งแรก จะถูกขอให้ **Authorize access ( ให้สิทธิ์การเข้าถึง)** ให้ดำเนินการตามขั้นตอน
	- เมื่อ Deploy สำเร็จ จะได้รับ **Web app URL คัดลอก URL ไว้** เพราะจะต้องใช้ใน ขั้นตอนที่ 4
<!--- BLANKKKKKKKKKKKKKKKKKKKKK--->
**ขั้นตอนที่ 4 : ตั้งค่า Python Script**
1. **ติดตั้งไลบารี `requests` :**
	- เปิด Command Prompt (Windows) หรือ Terminal (Linux/macOS)
	- รันคำสั่ง pip install requests
2. **คัดลอกโค้ด Python :**
	- คัดลอกโค้ดจากไฟล์ `req_report.py`
	- นำไปวางในโปรแกรม เช่น VS Code
3.  **แก้ไขค่าคงที่ในโค้ด Python :**
	- เปลี่ยน `WEB_APP_URL` ให้เป็น **Web app URL**  ที่ได้จาก ขั้นตอนที่ 3
	- เปลี่ยน `SECRET_KEY` ให้ตรงกับค่าที่ตั้งไว้ใน Script Properties ของ Google Apps Script
	- **รูปแบบวันที่ :** บรรทัด`DATE_TO_SEND  = (datetime.now() -  timedelta(days=1)).strftime('%#d/%#m/%Y')` ถูกตั้งค่าให้ดึงข้อมูลของ **เมื่อวาน** และจัดรูปแบบเป็น `DD/MM/YYYY` ตรวจสอบให้แน่ใจว่ารูปแบบนี้ตรงกับในรูปแบบวันที่ในคอลัมน์ A ของ Google Sheet 
4. **บันทึกไฟล์ Python :**
	- บันทึกโค้ดเป็นไฟล์ `.py` (เช่น `send_report.py`) ไว้ในตำแหน่งที่ต้องการ (เช่น `C:\Scripts\send_noc_report.py` บน Windows)
<!--- BLANKKKKKKKKKKKKKKKKKKKKK--->
**ขั้นตอนที่ 5 : ตั้งเวลาด้วย Task Scheduler (สำหรับ Windows)**
1. **เปิด Task Scheduler :** ค้นหา `Task Scheduler` ใน Start Menu
2. **สร้าง Basic Task :**
	- คลิก **Create Basic Task...** ทางด้านขวา
	- **Name (ชื่อ) :** `Send Daily Report To Line`
	- **Description คำอธิบาย :** `Trigger Google Apps Script to send daily report to Line`
	- **คลิก Next**
3. **Trigger (ทริกเกอร์) :**
	-  **When do you want the task to start? (ต้องการให้งานนี้เริ่มต้นเมื่อใด) :** เลือก `Daily`
	-  **คลิก Next**
	- **Start (เริ่มต้น) :** กำหนดวันที่และเวลาที่ต้องการให้เริ่มทำงาน (เช่น ตั้งเวลาเป็น `00:00:00`)
	- **Recur every (เกิดซ้ำทุก) :** `1`days
	- **คลิก Next**
4. **Action (การดำเนินการ) :**
	- **What action do you want the task to perform?  (ต้องการให้งานนี้ดำเนินการอะไร) :** เลือก`Start a program`
	- **คลิก Next**
5. **Start a Program (เริ่มโปรแกรม) :**
	- **Program/script (โปรแกรม/สคลิปต์) :** ใส่พาธเต็มของ Python interpreter (ตัวอย่าง : `C:\Users\YourUser\AppData\Local\Programs\Python\Python39\python.exe` หรือ `python.exe` ถ้ามีการตั้งค่า Path Environment Variable ไว้)
	- **Add arguments (optional) :** ใส่พาธเต็มของไฟล์ Python Script (ตัวอย่าง : `C:\Scripts\send_noc_report.py`)
	- **Start in (Optional) :** เว้นว่างก็ได้
	- **คลิก Next**
6. **Summary (สรุป) :** ตรวจสอบรายละเอียดทั้งหมดและคลิก Finish
ตอนนี้  Task Scheduler จะรัน Python Script ทุกวันตามเวลาที่กำหนด ซึ่ง Python Script จะเรียก Google Apps Script Web App เพื่อดึงข้อมูลและส่งรายงานไปยัง Line

## ⚠️ การแก้ไขปัญหาเบื้องต้น
-   **Python Script ไม่รัน หรือรันแล้วมีข้อผิดพลาด**:
    -   ตรวจสอบพาธของ Python Interpreter และ Python Script ใน Task Scheduler ว่าถูกต้องหรือไม่
    -   ลองรัน Python Script ด้วยตัวเองใน Command Prompt/Terminal เพื่อดูข้อความ Error
    -   ตรวจสอบว่า `WEB_APP_URL` และ `SECRET_KEY` ใน Python Script ถูกต้องและตรงกับ Google Apps Script
-   **รายงานไม่ถูกส่งไป LINE**:
    -   ตรวจสอบ Log ใน Google Apps Script (ไปที่เมนู **Executions (การดำเนินการ)** ใน Apps Script Editor) เพื่อดูว่ามี Error อะไรเกิดขึ้น
    -   ตรวจสอบว่า `LINE_TOKEN` และ `LINE_RECIPIENT_ID` ใน Script Properties และโค้ด Apps Script ถูกต้อง
    -   ตรวจสอบว่า Web App ได้รับการ Deploy ถูกต้องและมีสิทธิ์เข้าถึง `Anyone`
-   **ข้อมูลใน Google Sheet ไม่ถูกทำเครื่องหมายว่า "ส่งแล้ว"**:
    -   ตรวจสอบว่าคอลัมน์ K (Index 10) ถูกต้อง
    -   ตรวจสอบว่าการส่ง LINE สำเร็จ (ดูจาก Log ของ Apps Script ถ้า `sendLineMessage` คืนค่า `true`)
-   **รายงานมีแต่หัวข้อ หรือไม่มีข้อมูล**:
    -   ตรวจสอบว่าวันที่ใน Google Sheet ของคุณมีรูปแบบที่สอดคล้องกับ `'%d/%m/%Y'` ที่ใช้ใน Python Script และ Apps Script
    -   ตรวจสอบว่ามีข้อมูลสำหรับวันที่ที่ต้องการรายงานจริง ๆ ใน Google Sheet
