namespace CompanyChat.Api.DTOs.Department;

public record DepartmentStatisticsDto(
    int DepartmentId,
    string DepartmentName,
    int MemberCount,
    int ActiveMemberCount,
    int InactiveMemberCount,
    int PrimaryMemberCount,
    int AdditionalMemberCount,
    int OnlineMemberCount,
    int MessageCount);