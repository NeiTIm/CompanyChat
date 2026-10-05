namespace CompanyChat.Api.DTOs.Department;

public record DepartmentActivityDto(
    DateTime Date,
    int MessageCount,
    int ActiveMemberCount);