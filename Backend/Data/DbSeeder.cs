using CompanyChat.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync())
            return;

        var users = new[]
        {
            new User
            {
                Username = "admin",
                FullName = "System Admin",
                Email = "admin@company.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Liqinan123@"),
                Role = "Admin"
            },
            new User
            {
                Username = "tien",
                FullName = "Vy Trung Tiến",
                Email = "tien@company.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Role = "Admin"
            },
            new User
            {
                Username = "an",
                FullName = "Trần Văn An",
                Email = "an@company.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Role = "Employee"
            },
            new User
            {
                Username = "ngan",
                FullName = "Lê Thị Thu Ngân",
                Email = "ngan@company.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Role = "Employee"
            }
        };

        db.Users.AddRange(users);
        await db.SaveChangesAsync();
    }
}
