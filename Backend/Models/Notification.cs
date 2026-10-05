using System.ComponentModel.DataAnnotations.Schema;

namespace CompanyChat.Api.Models;

public class Notification
{
    public long Id { get; set; }

    // Người nhận notification
    public int UserId { get; set; }

    // Loại notification
    // Message
    // DepartmentMessage
    // System
    // Admin
    public string Type { get; set; } = string.Empty;

    // Tiêu đề
    public string Title { get; set; } = string.Empty;

    // Nội dung
    public string Content { get; set; } = string.Empty;

    // Conversation liên quan
    public int? ConversationId { get; set; }

    // Message liên quan
    public long? MessageId { get; set; }

    // Đã đọc chưa
    public bool IsRead { get; set; }

    // Thời điểm đọc
    public DateTime? ReadAt { get; set; }

    // Thời điểm tạo
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /*
     * =========================================================
     * DEPARTMENT NAME
     * =========================================================
     *
     * Không lưu DB.
     *
     * Dùng cho:
     * - realtime notification
     * - frontend hiển thị tên phòng ban
     *
     * Giá trị được lấy từ:
     *
     * Notification
     *     -> Conversation
     *     -> Department
     *     -> Department.Name
     */
    [NotMapped]
    public string? DepartmentName { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;

    public Conversation? Conversation { get; set; }

    public Message? Message { get; set; }
}