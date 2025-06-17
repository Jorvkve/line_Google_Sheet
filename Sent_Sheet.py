import gspread 
import pandas as pd
import schedule
import time
from oauth2client.service_account import ServiceAccountCredentials
from linebot.v3.messaging import MessagingApi, PushMessageRequest, TextMessage, Configuration, FileMessage
from linebot.v3.messaging.api_client import ApiClient
from datetime import datetime

def  authenticate_google_sheets():
    scope = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_name(
    r'E:\Coding\google_sheet\sigma-maker-463203-r9-672bc8ee8ad7.json',
    scope)
    client = gspread.authorize(creds)
    return client

def get_data_from_google_sheet(spreadsheet_id, range_name):
    client = authenticate_google_sheets()
    sheet = client.open_by_key(spreadsheet_id).sheet1
    data = sheet.get(range_name)
    return data

#----line setup----
channel_access_token = \
    'KKADfbAWvHXpa+ndAhrSg3KoGdtDupP9PWXS+P6q+fglyyBCk/fhzPs+YrYWo6Sag0BU5c+PLUI8GBxb8xd8QhFYnsc8K4jzwcydG5TJhMXBHxJuCGWYGP8zgu2Ep1lhsOOZfw9ti+HuWUo8NrEm7AdB04t89/1O/w1cDnyilFU='
user_ids = ['C468fb34d0bdf08e80e8b288bd66c39cd']

def send_line_file(file_path):
    try:
        configuration = Configuration(access_token=channel_access_token)
        with ApiClient(configuration) as api_client:
            line_bot_api = MessagingApi(api_client)
            with open(file_path, 'rb') as file:
                line_bot_api.push_message(user_ids[0], FileMessage(file_name="report.xlsx", file_content=file.read()))
    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการส่งไฟล์ {e}")

def export_to_excel(data, filename="report.xlsx"):
    df = pd.DataFrame(data[1:], columns=data[0])
    df.to_excel(filename, index=False)
    return filename

def daily_report_task():
    spreadsheet_id = '15A7h62tRxTrbEHzK6UOam3fVn_H7HBxAcGXT4I2ElXM'
    range_name = 'A1:Z1000'
    data = get_data_from_google_sheet(spreadsheet_id, range_name)
    filename = export_to_excel(data)
    send_line_file(filename)

#schedule.every().day.at("10:00").do(daily_report_task)
schedule.every(10).seconds.do(daily_report_task)

if __name__ == "__main__":
    print("Start scheduled task...")
    while True:
        schedule.run_pending()
        time.sleep(1)
