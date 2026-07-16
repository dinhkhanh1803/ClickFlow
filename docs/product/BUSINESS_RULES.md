# Business Rules

- Workspace có nhiều project; project có nhiều section và task; task chỉ thuộc một project và có thể có parent task.
- Task có đúng một status tại một thời điểm; status cấu hình theo project; deadline tùy chọn; hoàn thành ghi `completedAt`.
- Priority, tag, comment, attachment và checklist gắn với task theo domain model; activity log chỉ hệ thống ghi, người dùng không sửa trực tiếp.
- Mỗi user chỉ có một timer đang chạy; time entry stopped phải có duration dương hợp lệ.
- Project health tính từ deadline, tiến độ và task quá hạn; là chỉ báo, không thay thế quyết định người dùng.
- Archive là trạng thái mềm, không hiển thị trong danh sách mặc định; xóa vĩnh viễn phải xác nhận rõ.
- Template sao chép cấu trúc, không sao chép lịch sử; reports dựa trên dữ liệu còn truy cập được.
