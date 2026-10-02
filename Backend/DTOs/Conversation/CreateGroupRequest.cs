namespace CompanyChat.Api.DTOs.Conversation;

public record CreateGroupRequest(
    string Name,
    List<int> MemberIds
);