namespace CompanyChat.Api.Models;

public class MessageUserState
{
    public int Id { get; set; }

    public long MessageId { get; set; }

    public int UserId { get; set; }

    /*
     * Receiver đã nhận được message
     * qua WebSocket hay chưa.
     */
    public bool IsDelivered { get; set; }

    public DateTime? DeliveredAt { get; set; }

    /*
     * User đã đọc message hay chưa.
     */
    public bool IsRead { get; set; }

    public DateTime? ReadAt { get; set; }

    /*
     * Xóa riêng với user này.
     */
    public bool IsDeletedForMe { get; set; }

    public DateTime? DeletedForMeAt { get; set; }

    public Message Message { get; set; } = null!;

    public User User { get; set; } = null!;
}