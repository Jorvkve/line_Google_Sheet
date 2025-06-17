import gspread 
from oauth2client.service_account import ServiceAccountCredentials

scope = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]

creds = ServiceAccountCredentials.from_json_keyfile_name(
    r'E:\Coding\google_sheet\sigma-maker-463203-r9-672bc8ee8ad7.json',
    scope
)

client = gspread.authorize(creds)

sheet = client.open_by_key('15A7h62tRxTrbEHzK6UOam3fVn_H7HBxAcGXT4I2ElXM').sheet1

data = sheet.get_all_records()
print(data)