using System.Text;
using CompanyChat.Api.Data;
using CompanyChat.Api.Services;
using CompanyChat.Api.WebSockets;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using CompanyChat.Api.Services.Admin;
using CompanyChat.Api.Authorization;
using CompanyChat.Api.Services.Chat;
using CompanyChat.Api.Services.Notification;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString(
            "DefaultConnection")));

builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<ConversationAccessService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ChatMessageService>();
builder.Services.AddScoped<DashboardService>();

builder.Services.AddScoped<ChatWebSocketHandler>();
builder.Services.AddScoped<PrivateChatHandler>();
builder.Services.AddScoped<DepartmentChatHandler>();

builder.Services.AddSingleton<ConnectionManager>();

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "JWT key is missing.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidAudience = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey))
            };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken =
                    context.Request.Query["access_token"];

                if (!string.IsNullOrEmpty(accessToken) &&
                    context.HttpContext.Request.Path ==
                    "/ws/chat")
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    // ============================================
    // ADMIN
    // ============================================

    options.AddPolicy(
        Policies.ManageUsers,
        policy =>
            policy.RequireRole("Admin"));

    options.AddPolicy(
        Policies.ManageDepartments,
        policy =>
            policy.RequireRole("Admin"));

    // ============================================
    // AUTHENTICATED USER
    // ============================================

    options.AddPolicy(
        Policies.AccessConversation,
        policy =>
            policy.RequireAuthenticatedUser());

    options.AddPolicy(
        Policies.SendMessage,
        policy =>
            policy.RequireAuthenticatedUser());

    options.AddPolicy(
        Policies.DeleteOwnMessage,
        policy =>
            policy.RequireAuthenticatedUser());

    options.AddPolicy(
        Policies.DeleteMessageForEveryone,
        policy =>
            policy.RequireAuthenticatedUser());
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "https://company-chat-eosin.vercel.app"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db);
}

app.UseSwagger();
app.UseSwaggerUI();



app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();

app.UseWebSockets();

app.Map("/ws/chat", async context =>
{
    if (context.User.Identity?.IsAuthenticated != true)
    {
        context.Response.StatusCode =
            StatusCodes.Status401Unauthorized;
        return;
    }

    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode =
            StatusCodes.Status400BadRequest;

        await context.Response.WriteAsync(
            "WebSocket connection required.");

        return;
    }

    var handler = context.RequestServices
        .GetRequiredService<ChatWebSocketHandler>();

    using var socket =
        await context.WebSockets.AcceptWebSocketAsync();

    await handler.HandleAsync(context, socket);
});

app.MapControllers();

// app.MapFallbackToFile("index.html");

app.Run();
