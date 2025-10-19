Tôi muốn xây dựng một ứng dụng web cho phép người dùng có thể thi thử các bài thi từ kho câu hỏi có sẵn.
Không cần sử dụng backend, tất cả dữ liệu người dùng sẽ được lưu bằng local storage.
Các câu hỏi được lưu dưới dạng JSON ở thư mục question-pool, mỗi file sẽ là một bộ câu hỏi.
Khi người dùng vào trang web thì sẽ có một số tuỳ chọn sau:
1. Chọn bộ câu hỏi, cho phép user chọn bộ câu hỏi muốn thi thử, hãy lấy tên file JSON làm label.
2. Chọn số lượng câu hỏi mỗi bài thi, default là tổng số câu hỏi trong file.
3. Chọn thời gian làm bài tính bằng phút, default là số phút bằng số lượng câu hỏi.
4. Khi nộp bài, cần lưu lại hết các câu trả lời của user vào local storage, key sẽ là tên của JSON file, value sẽ có dạng sau: [
    {
        questionId: 1,
        countTrue: 2,
        countFalse: 1
    }
], mỗi lần làm bài thì sẽ cập nhật lại vào storage, nếu làm đúng thì tăng countTrue, làm sai thì tăng countFalse.
5. Khi tạo bài test, các câu hỏi sẽ là ngẫu nhiên trong bộ câu hỏi, nhưng phải tạo ra thuật toán để ưu tiên các câu chưa làm và câu làm sai nhiều lần được tính dựa trên hiệu của countTrue và countFalse, nếu hiệu là số Âm thì nên ưu tiên hiện các câu đó trong bài thi.
6. Sau khi làm bài thi thì sẽ có thể preview lại các câu đã làm và kết quả.
7. Nếu hết giờ mà làm chưa xong thì sẽ tự động nộp bài.
8. Thời gian đếm ngược phải dễ thấy, 1 phút cuối cùng thì hãy hiển thị số giây to hơn và hiển thị màu đỏ, bình thường sẽ là xanh lá.
9. Danh sách câu hỏi cần hiển thị rõ ràng để người dùng có thể dễ dàng chuyển qua lại các câu hỏi, các câu chưa làm thì sẽ có viền màu đỏ, làm rồi thì sẽ màu xanh. 
10. UI phải được thiết kế bắt mắt, có các hiệu ứng animation, và phải responsive hỗ trợ mobile dễ dàng thao tác.
11. Code phải dễ bảo trì, phát triển và reuseable.
