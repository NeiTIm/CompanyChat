namespace CompanyChat.Api.Models;

public class ScopeGroupMember
{
    public int ScopeGroupId { get; set; }

    public ScopeGroup ScopeGroup { get; set; } = null!;

    public int UserId { get; set; }

    public User User { get; set; } = null!;
}