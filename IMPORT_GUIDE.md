# Hướng dẫn Import Tài khoản - TTL TikTok Live Viewer

## Tổng quan
Chức năng import đã được nâng cấp để hỗ trợ 2 định dạng dữ liệu:

## 🔹 Định dạng 1: Chỉ tài khoản
**Format:** `username|password|email|emailpass|cookie`

### Ví dụ:
```
user1|pass123|user1@gmail.com|emailpass123|cookie_session_1
user2|pass456|user2@yahoo.com|emailpass456|cookie_session_2
user3|pass789|user3@outlook.com|emailpass789|cookie_session_3
```

### Mô tả các trường:
- `username`: Tên đăng nhập TikTok
- `password`: Mật khẩu tài khoản TikTok  
- `email`: Email liên kết với tài khoản (có thể để trống)
- `emailpass`: Mật khẩu email (có thể để trống)
- `cookie`: Cookie session TikTok (có thể để trống)

---

## 🔹 Định dạng 2: Tài khoản + Proxy
**Format:** `username|password|email|emailpass|cookie|proxy`

### Ví dụ:
```
user4|pass123|user4@gmail.com|emailpass123|cookie_session_4|192.168.1.1:8080:proxyuser:proxypass
user5|pass456|user5@yahoo.com|emailpass456|cookie_session_5|192.168.1.2:8080:proxyuser2:proxypass2
user6|pass789|user6@outlook.com|emailpass789|cookie_session_6|192.168.1.3:8080:proxyuser3:proxypass3
```

### Mô tả các trường:
- `username`: Tên đăng nhập TikTok
- `password`: Mật khẩu tài khoản TikTok
- `email`: Email liên kết với tài khoản (có thể để trống)
- `emailpass`: Mật khẩu email (có thể để trống)
- `cookie`: Cookie session TikTok (có thể để trống)
- `proxy`: Proxy theo format `ip:port:username:password`

---

## 📋 Cách sử dụng

### Bước 1: Mở trang Quản lý Tài khoản
- Điều hướng đến trang "Accounts" trong ứng dụng

### Bước 2: Mở modal Import
- Nhấn nút "Import Text" hoặc icon import

### Bước 3: Chọn định dạng
- **"Chỉ tài khoản"**: Cho dữ liệu 5 trường
- **"Tài khoản + Proxy"**: Cho dữ liệu 6 trường (bao gồm proxy)

### Bước 4: Chọn thư mục đích
- Chọn thư mục muốn lưu tài khoản đã import

### Bước 5: Dán dữ liệu
- Copy dữ liệu theo đúng định dạng đã chọn
- Paste vào textarea

### Bước 6: Kiểm tra validation
- Hệ thống sẽ hiển thị cảnh báo nếu định dạng không đúng
- Màu vàng: Cảnh báo định dạng
- Màu đỏ: Lỗi nghiêm trọng

### Bước 7: Thực hiện Import
- Nhấn "Import tài khoản" để bắt đầu
- Xem kết quả import (thành công/thất bại)

---

## ✅ Kết quả Import

### Thông tin hiển thị:
- **Tổng số dòng**: Số dòng dữ liệu đã xử lý
- **Import thành công**: Số tài khoản được tạo thành công
- **Proxy được tạo**: Số proxy được tạo (chỉ với định dạng 2)
- **Lỗi**: Danh sách chi tiết các lỗi (nếu có)

### Xử lý lỗi:
- Dòng thiếu trường bắt buộc: Bỏ qua
- Username/password trống: Bỏ qua
- Định dạng sai: Hiển thị cảnh báo cụ thể

---

## 🔧 Lưu ý quan trọng

### Định dạng dữ liệu:
- **Bắt buộc**: Username và password không được để trống
- **Tùy chọn**: Email, emailpass, cookie có thể để trống
- **Phân cách**: Sử dụng ký tự `|` (pipe) để phân cách các trường
- **Dòng mới**: Mỗi tài khoản trên một dòng riêng

### Proxy format:
- **Format**: `ip:port:username:password`
- **Ví dụ**: `192.168.1.1:8080:proxyuser:proxypass`
- **Lưu ý**: Proxy sẽ được tạo riêng trong thư mục tương ứng

### Performance:
- Khuyến nghị import tối đa 1000 tài khoản/lần
- Dữ liệu lớn nên chia nhỏ để import

---

## 🚀 Ví dụ thực tế

### Test data 1 (Chỉ tài khoản):
```
testuser1|testpass1|test1@gmail.com|emailpass1|session_cookie_1
testuser2|testpass2|test2@gmail.com|emailpass2|session_cookie_2
testuser3|testpass3||emailpass3|
```

### Test data 2 (Tài khoản + Proxy):
```
testuser4|testpass4|test4@gmail.com|emailpass4|session_cookie_4|192.168.1.1:8080:user:pass
testuser5|testpass5|test5@gmail.com|emailpass5|session_cookie_5|192.168.1.2:8080:user2:pass2
testuser6|testpass6|||session_cookie_6|192.168.1.3:8080:user3:pass3
```

---

## ❗ Troubleshooting

### Lỗi thường gặp:
1. **"Định dạng không hợp lệ"**: Kiểm tra số lượng ký tự `|`
2. **"Username/password trống"**: Đảm bảo 2 trường đầu có dữ liệu
3. **"Import thất bại"**: Kiểm tra quyền ghi file và dung lượng đĩa

### Giải pháp:
- Sử dụng text editor để kiểm tra ký tự ẩn
- Copy từng phần nhỏ để test
- Kiểm tra encoding file (UTF-8 recommended)

---

*Cập nhật: v1.0 - Hỗ trợ đầy đủ 2 định dạng import với validation realtime*
