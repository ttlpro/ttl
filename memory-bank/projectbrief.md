# TTL TikTok Live - Tóm tắt dự án

## Tổng quan
TTL TikTok Live là ứng dụng desktop được phát triển với Electron và Next.js, cho phép người dùng quản lý và theo dõi các luồng phát trực tiếp TikTok với nhiều tài khoản cùng lúc. Ứng dụng hỗ trợ quản lý proxy, tài khoản và theo dõi thống kê người xem.

## Mục tiêu chính
- Quản lý nhiều tài khoản TikTok để xem phát trực tiếp
- Quản lý danh sách proxy để luân chuyển giữa các tài khoản
- Phân loại tài khoản và proxy theo thư mục (folders)
- Theo dõi thống kê người xem theo thời gian thực
- Tự động chạy/dừng việc xem theo lịch trình

## Đối tượng người dùng
Người quản lý nhiều tài khoản TikTok cần theo dõi và tương tác với các phòng phát trực tiếp.

## Chức năng cốt lõi
1. **Quản lý tài khoản**
   - Thêm, sửa, xóa tài khoản
   - Nhập danh sách tài khoản từ file
   - Phân loại tài khoản theo thư mục

2. **Quản lý proxy**
   - Thêm, sửa, xóa proxy
   - Kiểm tra trạng thái proxy
   - Nhập/xuất danh sách proxy
   - Phân loại proxy theo thư mục

3. **Theo dõi phòng live**
   - Kết nối nhiều tài khoản vào phòng live
   - Theo dõi số lượng người xem
   - Lưu lịch sử người xem

4. **Tự động hóa**
   - Lên lịch tự động chạy/dừng
   - Tự động làm mới thông tin

## Ràng buộc kỹ thuật
- Xây dựng trên Electron và Next.js
- Sử dụng SQLite để lưu trữ dữ liệu
- Hỗ trợ Windows, macOS
- Giao diện đa ngôn ngữ (Việt, Anh)

## Phạm vi dự án
### Trong phạm vi
- Quản lý và theo dõi tài khoản, proxy, phòng live
- Giao diện người dùng thân thiện
- Lưu trữ và phân tích dữ liệu cơ bản

### Ngoài phạm vi
- Tạo tài khoản TikTok tự động
- Tương tác tự động (bình luận, like, share)
- Chức năng đổi IP tự động

## Metrics thành công
- Có thể quản lý hàng trăm tài khoản và proxy
- Theo dõi được nhiều phòng live cùng lúc
- Giao diện trực quan, dễ sử dụng
- Độ ổn định cao khi chạy trong thời gian dài 