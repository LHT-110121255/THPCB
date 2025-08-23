# 🛠️ Hệ thống Quản lý THPCB

**Dự án này là một hệ thống web giúp tự động hóa và tối ưu hóa việc quản lý trường THPCB**

## 🚀 Tính năng

### 👥 Quản lý Người dùng
- **Vai trò**: Quản trị viên (Admin), Quản lý thiết bị, Quản lý quà tặng.
- **Chức năng**:
  - Đăng nhập, tạo tài khoản, cập nhật, xóa, kích hoạt/vô hiệu hóa, đổi mật khẩu.
  - Nhập danh sách giảng viên từ file CSV.
- **Quyền quản trị viên**: Toàn quyền kiểm soát tài khoản và thông tin giảng viên.

### 🖥️ Quản lý Thiết bị
- Thêm, cập nhật, xóa, tìm kiếm, nhập thiết bị qua CSV.
- **Theo phòng**: Gán thiết bị, chuyển phòng, theo dõi trạng thái.
- **Mượn/Trả thiết bị**: Ghi nhận trạng thái, lịch sử.
- **Tìm kiếm**: Theo tên, loại, trạng thái, phòng.
- **Báo cáo**: Thống kê theo loại, trạng thái, phòng và lịch sử mượn/trả.

### 🎁 Quản lý Quà tặng
- Thêm, cập nhật, xóa, tìm kiếm, nhập quà từ CSV.
- **Kho**: Theo dõi tồn kho, xuất tặng học viên, đối tác, khách.
- **Yêu cầu xuất kho**: Từ file PDF, có xác nhận và hoàn trả.
- **Cảnh báo tồn kho thấp**.
- **Báo cáo**: Tồn kho, lịch sử, xu hướng sử dụng.

### 📣 Thông báo và Email
- **Thông báo**: Theo thời gian thực (mượn thiết bị, yêu cầu quà, kho cạn...).
- **Email**: Tự động gửi khi tạo tài khoản, đổi mật khẩu, xác nhận mượn/trả.

### 📊 Thống kê và Báo cáo
- **Thiết bị**: Theo loại, trạng thái, phòng, xu hướng mượn.
- **Quà tặng**: Tồn kho, xu hướng, danh sách được yêu cầu nhiều.
- **Biểu đồ**: Cột, đường, tròn để phân tích dữ liệu.

---

## 🧰 Công nghệ Sử dụng

| Module        | Công nghệ/Giải pháp | Mô tả |
|---------------|---------------------|-------|
| Front-end     | Handlebars           | Template engine nhẹ, dễ tích hợp Node.js |
|               | Bootstrap 5          | CSS Framework, responsive |
| Back-end      | Node.js, Express     | Server-side JavaScript |
| Database      | MongoDB              | NoSQL, dễ mở rộng |
| Kiến trúc     | MVC + CQRS           | Tổ chức rõ ràng, tách biệt đọc/ghi |
| Thông báo     | nodemailer (Node.js) | Gửi cảnh báo và email |

---

## ⚙️ Cài đặt

### ✅ Yêu cầu
- Node.js
- Git
- MongoDB (local hoặc online)

### 🧾 Các bước

1. **Tải mã nguồn**
   ```bash
   git clone -b https://github.com/LamHueTrung/tn_da21ttc_110121255_LamHueTrung_tdgm.git 
   ```

2. **Di chuyển đến thư mục**
   ```bash
   cd Victory_LamHueTrung_TeachingDeviceRewardManager
   ```

3. **Tạo file `.env`**
   ```env
   MONGODB_URI_LOCAL=mongodb://localhost:27017/DeviceRewardManager
   MONGODB_URI_ONLINE=<your-online-mongodb-url>
   JWT_SECRET_KEY=110121255lamhuetrung08012003
   AES_SECRET_KEY=3269ceed2bcea81c3c5c7c6955e991b13269ceed2bcea81c3c5c7c6955e991b1
   AES_IV=46682df79d776d8c46682df79d776d8c
   API_URL=http://localhost:3000
   USERNAME_GOOGLE=lamhuetrung@gmail.com
   APP_PASSWORD_GOOGLE=<your-google-app-password>
   ```

4. **Cài đặt thư viện**
   ```bash
   npm install
   ```

5. **Chạy dự án**
   ```bash
   npm start
   ```

6. **Truy cập hệ thống**
   ```
   http://localhost:3000
   ```

---

## 📂 Cấu trúc thư mục

```
src/
├── app/             # Controllers, middlewares, models, database
├── public/          # Tài nguyên công khai (ảnh, file tĩnh)
├── resources/       # Template HBS
├── route/           # Cấu hình định tuyến
├── index.js         # Điểm khởi động ứng dụng
.env                 # Biến môi trường
```

---

## 📡 Tài liệu API

- **URL**: [https://tdgm-victory.onrender.com/api-docs/](https://tdgm-victory.onrender.com/api-docs/)
- **Số lượng**: 69 API chia thành 8 nhóm:
  - Người dùng
  - Thiết bị
  - Phòng
  - Giảng viên
  - Quà tặng
  - Mượn/Trả
  - Thống kê
  - Thông báo

---

## 🧪 Dữ liệu Thử nghiệm

### 👤 Người dùng

| Vai trò             | Tài khoản             | Mật khẩu              | Họ tên                   | Ngày sinh | SĐT         | Email                         | Địa chỉ   |
|---------------------|-----------------------|------------------------|---------------------------|-----------|-------------|-------------------------------|-----------|
| Quản trị viên       | `LamHueTrung`         | `Lht080103*`           | Lâm Huệ Trung             | 08/01/2003| 0763849007  | lamhuetrung@gmail.com         | Trà Vinh  |
| Quản lý thiết bị     | `NhanMinhPhuc`        | `NhanMinhPhuc*`        | Nhân Minh Phúc            | 01/01/1990| 0714523698  | nhanminhphuc@tvu.edu.vn       | Trà Vinh  |
| Quản lý quà tặng     | `NguyenHoangDuyThien`| `NguyenHoangDuyThien*` | Nguyễn Hoàng Duy Thiện    | 01/01/1990| 0714523697  | thiennhd@tvu.edu.vn           | Trà Vinh  |

### 👨‍🏫 Giảng viên

| Họ tên               | Email                   | SĐT         | Chuyên ngành              | Đơn vị           |
|----------------------|--------------------------|-------------|----------------------------|------------------|
| Lâm Nam Phong        | namphongtctv@gmail.com   | 0965123789  | Công nghệ thông tin        | Phòng HCTH       |
| Trần Thị Minh Thư    | thu.tran@tvu.edu.vn      | 0912345678  | Quản trị kinh doanh        | Phòng Kế hoạch   |
| Lê Văn Hùng          | hung.le@tvu.edu.vn       | 0978456123  | Kỹ thuật điện tử           | Phòng Kỹ thuật   |
| Phạm Quốc Bảo        | bao.pham@tvu.edu.vn      | 0909123456  | Hành chính                 | Phòng HCTH       |
| Nguyễn Thị Kim Oanh  | oanh.nguyen@tvu.edu.vn   | 0987766554  | Marketing                  | Phòng Truyền thông|
| Võ Minh Tâm          | tam.vo@tvu.edu.vn        | 0933445566  | Công nghệ thông tin        | Phòng IT         |
| Đỗ Thị Hồng Hạnh     | hanh.do@tvu.edu.vn       | 0911223344  | Kế toán                   | Phòng Kế toán    |
| Hồ Văn Duy           | duy.ho@tvu.edu.vn        | 0922334455  | Thiết kế đồ họa           | Phòng Thiết kế   |
| Trịnh Quốc Việt      | viet.trinh@tvu.edu.vn    | 0966887788  | Quản lý dự án             | Phòng Dự án      |
| Lý Ngọc Lan          | lan.ly@tvu.edu.vn        | 0944556677  | Nhân sự                   | Phòng Nhân sự    |

### 🖥️ Thiết bị

| Tên thiết bị               | Loại        | SL  | Mô tả                               | Hình ảnh |
|---------------------------|-------------|-----|-------------------------------------|----------|
| Remote máy lạnh Daikin    | Khác        | 10  | Điều khiển máy lạnh treo tường      | `remote_maylanh.jpg` |
| Remote máy chiếu Epson    | Khác        | 10  | Điều khiển từ xa máy chiếu          | `remote_projector.jpg` |
| Ổ cắm điện đa năng        | Khác        | 4   | Cấp nguồn cho thiết bị điện         | `ocam_danang.jpg` |
| Loa SoundMax A500         | Loa         | 20  | Loa treo tường                      | `loa_soundmax.jpg` |
| Máy chiếu Epson X500      | Máy chiếu   | 10  | Trình chiếu gắn trần                | `maychieuepson.jpg` |
| Laptop Dell Latitude      | Máy tính    | 10  | Laptop cho giảng viên               | `laptopdell.jpg` |
| Bảng trắng 1.5m           | Bảng trắng  | 10  | Bảng kính dùng bút lông             | `bangtrang.jpg` |
| Bộ phát Wifi TP-Link      | Thiết bị mạng| 10 | Router wifi cho lớp học             | `wifi_tplink.jpg` |
| Micro không dây           | Khác        | 10  | Micro đeo tai giảng viên            | `micro.jpg` |
| Webcam Full HD            | Khác        | 10  | Webcam học trực tuyến               | `webcam.jpg` |

### 🏫 Phòng học

| Tên phòng   | Vị trí     | Sức chứa |
|-------------|------------|-----------|
| A42.101     | Khu 2 TVU  | 100       |
| A42.102     | Khu 2 TVU  | 90        |
| A42.103     | Khu 2 TVU  | 60        |
| A42.104     | Khu 2 TVU  | 40        |
| A42.201     | Khu 2 TVU  | 50        |
| A42.202     | Khu 2 TVU  | 70        |
| A42.203     | Khu 2 TVU  | 30        |
| A42.204     | Khu 2 TVU  | 35        |
| A42.301     | Khu 2 TVU  | 80        |
| A42.302     | Khu 2 TVU  | 120       |

### 🎁 Quà tặng

| Tên quà tặng              | Loại       | SL  | Giá (VNĐ) | Mô tả                                          | Hình ảnh |
|--------------------------|------------|-----|-----------|------------------------------------------------|----------|
| Áo thun sự kiện          | Học viên   | 100 | 120,000   | Áo cotton dùng trong sự kiện nội bộ           | `aothun_sukien.jpg` |
| Bình giữ nhiệt In Logo   | Học viên   | 80  | 150,000   | Bình 500ml khắc logo trung tâm                | `binhgiunhiet.jpg` |
| Sổ tay da cao cấp        | Đối tác    | 50  | 200,000   | Sổ tay da sang trọng in logo                  | `sotay_da.jpg` |
| Túi canvas đeo chéo      | Học viên   | 70  | 100,000   | Túi vải canvas tặng học viên xuất sắc         | `tuicanvas.jpg` |
| Kỷ niệm chương pha lê    | Đối tác    | 30  | 300,000   | Biểu trưng pha lê tặng đối tác, kỷ niệm       | `phanle_kyniem.jpg` |
