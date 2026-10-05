using System.ComponentModel.DataAnnotations;

namespace CompanyChat.Api.DTOs.Department;

public record CreateDepartmentDto(
    [param: Required]
    [param: MaxLength(100)]
    string Name,

    [param: MaxLength(500)]
    string? Description);