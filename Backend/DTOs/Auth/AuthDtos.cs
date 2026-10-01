namespace CompanyChat.Api.DTOs.Auth;
using CompanyChat.Api.DTOs.User;
public record LoginRequest(
    string Username,
    string Password);

public record RegisterRequest(
    string Username,
    string FullName,
    string Email,
    string Password);

public record LoginResponse(
    string Token,
    UserDto User);