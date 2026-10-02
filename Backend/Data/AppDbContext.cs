using CompanyChat.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<Department> Departments => Set<Department>();

    public DbSet<Conversation> Conversations => Set<Conversation>();

    public DbSet<ConversationMember> ConversationMembers
        => Set<ConversationMember>();

    public DbSet<Message> Messages => Set<Message>();

    public DbSet<MessageUserState> MessageUserStates
    {
        get;
        set;
    }
    public DbSet<Notification> Notifications => Set<Notification>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // =====================================================
        // USER
        // =====================================================

        modelBuilder.Entity<User>()
            .HasIndex(x => x.Username)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(x => x.Email)
            .IsUnique();

        // =====================================================
        // DEPARTMENT
        // =====================================================

        modelBuilder.Entity<Department>()
            .HasIndex(x => x.Name)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasOne(x => x.Department)
            .WithMany(x => x.Users)
            .HasForeignKey(x => x.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Conversation>()
            .HasOne(x => x.Department)
            .WithMany(x => x.Conversations)
            .HasForeignKey(x => x.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);
        // =====================================================
        // CONVERSATION MEMBER
        // =====================================================

        modelBuilder.Entity<ConversationMember>()
            .HasKey(x => new
            {
                x.ConversationId,
                x.UserId
            });

        modelBuilder.Entity<ConversationMember>()
            .HasOne(x => x.Conversation)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ConversationMember>()
            .HasOne(x => x.User)
            .WithMany(x => x.ConversationMembers)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // =====================================================
        // MESSAGE
        // =====================================================

        modelBuilder.Entity<Message>()
            .HasOne(x => x.Conversation)
            .WithMany(x => x.Messages)
            .HasForeignKey(x => x.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Message>()
            .HasOne(x => x.Sender)
            .WithMany(x => x.Messages)
            .HasForeignKey(x => x.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Message>()
            .HasOne(x => x.ReplyToMessage)
            .WithMany()
            .HasForeignKey(x => x.ReplyToMessageId)
            .OnDelete(DeleteBehavior.NoAction);

        // =====================================================
        // MESSAGE USER STATE
        // =====================================================

        modelBuilder.Entity<MessageUserState>()
            .HasIndex(x => new
            {
                x.MessageId,
                x.UserId
            })
            .IsUnique();

        modelBuilder.Entity<MessageUserState>()
            .HasOne(x => x.Message)
            .WithMany(x => x.UserStates)
            .HasForeignKey(x => x.MessageId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MessageUserState>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
        // Notification thuộc về User
        // Không cho xóa User nếu còn Notification
        modelBuilder.Entity<Notification>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Notification liên quan đến Conversation
        // Không tự động xóa Notification khi xóa Conversation
        modelBuilder.Entity<Notification>()
            .HasOne(x => x.Conversation)
            .WithMany()
            .HasForeignKey(x => x.ConversationId)
            .OnDelete(DeleteBehavior.NoAction);

        // Notification liên quan đến Message
        // Không tự động xóa Notification khi xóa Message
        modelBuilder.Entity<Notification>()
            .HasOne(x => x.Message)
            .WithMany()
            .HasForeignKey(x => x.MessageId)
            .OnDelete(DeleteBehavior.NoAction);

        // Index giúp tìm Notification chưa đọc của User nhanh hơn
        modelBuilder.Entity<Notification>()
            .HasIndex(x => new
            {
                x.UserId,
                x.IsRead
            });

        // Index giúp lấy Notification mới nhất của User nhanh hơn
        modelBuilder.Entity<Notification>()
            .HasIndex(x => new
            {
                x.UserId,
                x.CreatedAt
            });
    }
}