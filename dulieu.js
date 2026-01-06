import admin from "firebase-admin";
import { google } from "googleapis";
import fs from "fs";

// Firebase (GIỮ NGUYÊN firebase.json)
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync("./firebase.json"))
  ),
  databaseURL:
    "https://thicuoiky1-ce4da-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const rtdb = admin.database();

// Google Sheets (GIỮ NGUYÊN service.json)
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(fs.readFileSync("./service.json")),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "10yfbkOszYktSZb5AVpVBErGwyuqW1t16vcjJELu3IL8";
const RANGE = "Data!A2";

async function syncMatBang() {
  const snapshot = await rtdb.ref("/matbang").once("value");
  const data = snapshot.val();

  if (!data) {
    console.log("⚠️ Không có dữ liệu matbang");
    return;
  }

  const rows = [];

  for (const id in data) {
    const item = data[id];

    // ⭐ ĐẾM SỐ REVIEW
    const soReview = item.reviews
      ? Object.keys(item.reviews).length
      : 0;

    rows.push([
      id,
      item.ten || "",
      item.thanhpho || "",
      item.diachi || "",
      item.gia || 0,
      item.dientich || 0,
      item.loai || "",
      item.phan_khuc_text || "",
      item.danhgia || 0,
      soReview                // 👈 CỘT MỚI
    ]);
  }

  // Xóa dữ liệu cũ từ A2 trở xuống
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE
  });

  // Ghi lại
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
    valueInputOption: "RAW",
    requestBody: { values: rows }
  });

  console.log("✅ Đã sync Google Sheet + số review");
}

syncMatBang();
