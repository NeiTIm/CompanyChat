namespace CompanyChat.Api.Models;

public class ConversationMember
{
    public int ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Thời điểm user xóa lịch sử cuộc trò chuyện.
    // Chỉ áp dụng cho user này, không ảnh hưởng thành viên khác.
    public DateTime? HistoryDeletedAt { get; set; }
}