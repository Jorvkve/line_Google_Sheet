from linebot.v3.messaging import MessagingApi, PushMessageRequest, TextMessage, Configuration, ContentApi # เพิ่ม ContentApi
from linebot.v3.messaging.api_client import ApiClient

def send_line_file(file_path):
    try:
        configuration = Configuration(access_token=channel_access_token)
        with ApiClient(configuration) as api_client:
            messaging_api = MessagingApi(api_client)
            content_api = ContentApi(api_client) # สร้าง ContentApi instance

            # 1. อัปโหลดไฟล์ไปยัง LINE Storage
            with open(file_path, 'rb') as file:
                file_content_bytes = file.read()
                # ต้องตรวจสอบ Line API Documentation สำหรับการอัปโหลดไฟล์จริง
                # ปัจจุบัน Messaging API v3 ยังไม่มีเมธอดตรงๆ สำหรับอัปโหลดไฟล์จากไคลเอนต์เพื่อส่งผ่าน FileMessage โดยตรง
                # โดยทั่วไปแล้ว การส่งไฟล์ผ่าน FileMessage มักจะใช้ mediaFileId ที่ได้จากการอัปโหลดไฟล์ไปที่ LINE OA Manager
                # หรือใช้ Rich Menu/Flex Message ที่ลิงก์ไปยัง URL ของไฟล์

                # ***สำคัญ: LINE Messaging API v3 (ณ ปัจจุบันที่ผมทราบ) ไม่ได้มี API สำหรับอัปโหลดไฟล์เพื่อใช้กับ FileMessage โดยตรงผ่าน SDK เหมือนการส่งรูปภาพหรือวิดีโอ***
                # หากต้องการส่งไฟล์ Excel จริงๆ คุณอาจจะต้องพิจารณาตัวเลือกอื่น เช่น:
                #    a) โฮสต์ไฟล์บนเซิร์ฟเวอร์ของคุณเองและส่ง URL ของไฟล์ใน TextMessage หรือ FlexMessage
                #    b) อัปโหลดไฟล์ผ่าน LINE Official Account Manager ด้วยมือ และใช้ mediaFileId ที่ได้
                #    c) หากเป็นรูปภาพ/วิดีโอ สามารถใช้ `ContentApi.issue_upload_url()` แต่สำหรับไฟล์ประเภทอื่นอาจไม่รองรับโดยตรง

                # สำหรับวัตถุประสงค์ของการตรวจสอบโค้ดนี้ สมมติว่ามีวิธีการอัปโหลดที่ถูกต้องและได้ media_file_id มาแล้ว
                # หากคุณต้องการให้โค้ดทำงานได้จริง คุณต้องหาวิธีอัปโหลดไฟล์ไปยัง LINE ที่เหมาะสม
                print("คำเตือน: การส่ง FileMessage ด้วย file_content โดยตรงไม่รองรับใน LINE Messaging API v3 SDK คุณต้องอัปโหลดไฟล์ไปยัง LINE ก่อนและใช้ media_file_id หรือ URL")
                # ตัวอย่างการส่ง TextMessage แทน ถ้าไม่สามารถส่ง FileMessage ได้
                messaging_api.push_message(PushMessageRequest(
                    to=user_ids[0],
                    messages=[
                        TextMessage(text=f"รายงานพร้อมแล้ว: {file_path}. กรุณาดาวน์โหลดจากลิงก์: [Your_File_URL_Here]")
                    ]
                ))

    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการส่งไฟล์: {e}")