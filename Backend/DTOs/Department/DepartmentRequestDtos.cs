namespace CompanyChat.Api.DTOs.Department;

public record UpdateDepartmentStatusDto(
    bool IsActive);

public record DepartmentMemberRequestDto(
    int UserId);

public record DepartmentMembersRequestDto(
    int[] UserIds);