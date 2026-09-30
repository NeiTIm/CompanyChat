namespace CompanyChat.Api.DTOs;

public record LoginRequest(string Username, string Password);

public record RegisterRequest(
    string Username,
    string FullName,
    string Email,
    string Password);

public record LoginResponse(string Token, UserDto User);

public record UserDto(
    int Id,
    string Username,
    string FullName,
    string Email,
    string Role,
    bool IsOnline,
    DateTime? LastSeen);
public record ConversationDto(
    int Id,
    string Type,
    UserDto OtherUser,
    DateTime CreatedAt);

