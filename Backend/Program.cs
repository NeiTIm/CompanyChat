using System.Security.Claims;
using System.Text;

using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using CompanyChat.Api.Services;
using CompanyChat.Api.Services.Authorization;
using CompanyChat.Api.Services.Admin;
using CompanyChat.Api.Services.Chat;
using CompanyChat.Api.Services.Notification;
using CompanyChat.Api.WebSockets;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

// Console.WriteLine(
//     "PASSWORD HASH: " +
//     BCrypt.Net.BCrypt.HashPassword("123456")
// );


var builder = WebApplication.CreateBuilder(args);


/* =========================================================
   SERVICES
========================================================= */

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();


/* =========================================================
   DATABASE
========================================================= */

builder.Services.AddDbContext<AppDbContext>(
    options =>
        options.UseSqlServer(
            builder.Configuration.GetConnectionString(
                "DefaultConnection")));


/* =========================================================
   APPLICATION SERVICES
========================================================= */

builder.Services.AddScoped<JwtService>();

builder.Services.AddScoped<PermissionService>();
builder.Services.AddScoped<DepartmentScopeService>();
builder.Services.AddScoped<ScopeService>();

builder.Services.AddScoped<
    ConversationAccessService>();

builder.Services.AddScoped<
    INotificationService,
    NotificationService>();

builder.Services.AddScoped<
    ChatMessageService>();

builder.Services.AddScoped<
    DashboardService>();

/* =========================================================
   AUTHORIZATION SERVICES
========================================================= */

builder.Services.AddScoped<
    IAuthorizationHandler,
    PermissionAuthorizationHandler>();

builder.Services.AddSingleton<
    IAuthorizationPolicyProvider,
    PermissionPolicyProvider>();

/* =========================================================
   WEBSOCKET SERVICES
========================================================= */

builder.Services.AddScoped<
    ChatWebSocketHandler>();

builder.Services.AddScoped<
    PrivateChatHandler>();

builder.Services.AddScoped<
    DepartmentChatHandler>();

builder.Services.AddScoped<
    GroupChatHandler>();


/* =========================================================
   CONNECTION MANAGER

   Singleton vì phải giữ danh sách WebSocket
   đang kết nối trong toàn bộ application.
========================================================= */

builder.Services.AddSingleton<
    ConnectionManager>();


/* =========================================================
   JWT KEY
========================================================= */

var jwtKey =
    builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "JWT key is missing.");


/* =========================================================
   AUTHENTICATION
========================================================= */

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(
        options =>
        {
            /* =================================================
               JWT VALIDATION
            ================================================= */

            options.TokenValidationParameters =
                new TokenValidationParameters
                {
                    ValidateIssuer = true,

                    ValidateAudience = true,

                    ValidateLifetime = true,

                    ValidateIssuerSigningKey = true,

                    ValidIssuer =
                        builder.Configuration[
                            "Jwt:Issuer"],

                    ValidAudience =
                        builder.Configuration[
                            "Jwt:Audience"],

                    IssuerSigningKey =
                        new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(
                                jwtKey))
                };


            options.Events =
                new JwtBearerEvents
                {
                    /* ==========================================
                       WEBSOCKET JWT

                       Frontend:

                       /ws/chat?access_token=JWT
                    ========================================== */

                    OnMessageReceived =
                        context =>
                        {
                            var accessToken =
                                context.Request.Query[
                                    "access_token"];


                            if (
                                !string.IsNullOrEmpty(
                                    accessToken) &&

                                context.HttpContext
                                    .Request
                                    .Path ==
                                    "/ws/chat")
                            {
                                context.Token =
                                    accessToken;
                            }


                            return Task.CompletedTask;
                        },


                    /* ==========================================
                       CHECK USER IN DATABASE

                       JWT còn hạn chưa đủ.

                       Phải kiểm tra:

                       User tồn tại
                       User chưa bị xóa
                       User đang active
                    ========================================== */

                    OnTokenValidated =
                        async context =>
                        {
                            /* ==================================
                               LẤY USER ID TỪ JWT
                            ================================== */

                            var userIdClaim =
                                context.Principal?
                                    .FindFirst(
                                        ClaimTypes
                                            .NameIdentifier);


                            /* ==================================
                               INVALID USER ID
                            ================================== */

                            if (
                                userIdClaim == null ||

                                !int.TryParse(
                                    userIdClaim.Value,
                                    out var userId))
                            {
                                context.Fail(
                                    "Invalid user.");

                                return;
                            }


                            /* ==================================
                               LẤY DATABASE CONTEXT
                            ================================== */

                            var db =
                                context
                                    .HttpContext
                                    .RequestServices
                                    .GetRequiredService<
                                        AppDbContext>();


                            /* ==================================
                               TÌM USER
                            ================================== */

                            var user =
                                await db.Users
                                    .AsNoTracking()
                                    .FirstOrDefaultAsync(
                                        x =>
                                            x.Id ==
                                            userId);


                            /* ==================================
                               USER KHÔNG TỒN TẠI
                            ================================== */

                            if (user == null)
                            {
                                context.Fail(
                                    "User does not exist.");

                                return;
                            }


                            /* ==================================
                               USER ĐÃ BỊ XÓA
                            ================================== */

                            if (user.IsDeleted)
                            {
                                context.Fail(
                                    "User account is deleted.");

                                return;
                            }


                            /* ==================================
                               USER ĐÃ BỊ KHÓA
                            ================================== */

                            if (!user.IsActive)
                            {
                                context.Fail(
                                    "User account is inactive.");

                                return;
                            }
                        }
                };
        });


/* =========================================================
   AUTHORIZATION
========================================================= */

builder.Services.AddAuthorization(
    options =>
    {
        /* ==================================================
           ADMIN
        ================================================== */

        options.AddPolicy(
            Policies.ManageUsers,
            policy =>
                policy.RequireRole("Admin"));


        options.AddPolicy(
            Policies.ManageDepartments,
            policy =>
                policy.RequireRole("Admin"));


        /* ==================================================
           AUTHENTICATED USER
        ================================================== */

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


/* =========================================================
   CORS
========================================================= */

builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            "Frontend",
            policy =>
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


/* =========================================================
   DATABASE MIGRATION + SEED
========================================================= */

using (var scope =
       app.Services.CreateScope())
{
    var db =
        scope.ServiceProvider
            .GetRequiredService<
                AppDbContext>();


    await db.Database.MigrateAsync();

    // await DbSeeder.SeedAsync(db);
}


/* =========================================================
   RESET ONLINE STATUS

   Khi server restart:

   WebSocket cũ không còn tồn tại.

   Vì vậy tất cả user phải trở về Offline.
========================================================= */

using (var scope =
       app.Services.CreateScope())
{
    var db =
        scope.ServiceProvider
            .GetRequiredService<
                AppDbContext>();


    var onlineUsers =
        await db.Users
            .Where(x => x.IsOnline)
            .ToListAsync();


    foreach (var user in onlineUsers)
    {
        user.IsOnline = false;
    }


    await db.SaveChangesAsync();
}


/* =========================================================
   SWAGGER
========================================================= */

app.UseSwagger();

app.UseSwaggerUI();


/* =========================================================
   CORS
========================================================= */

app.UseCors("Frontend");


/* =========================================================
   AUTHENTICATION
========================================================= */

app.UseAuthentication();


/* =========================================================
   AUTHORIZATION
========================================================= */

app.UseAuthorization();


/* =========================================================
   WEBSOCKET
========================================================= */

app.UseWebSockets();


/* =========================================================
   WEBSOCKET ENDPOINT

   URL:

   /ws/chat?access_token=JWT
========================================================= */

app.Map(
    "/ws/chat",
    async context =>
    {
        /* ==================================================
           CHECK AUTHENTICATION
        ================================================== */

        if (
            context.User.Identity?
                .IsAuthenticated != true)
        {
            context.Response.StatusCode =
                StatusCodes.Status401Unauthorized;

            return;
        }


        /* ==================================================
           CHECK WEBSOCKET REQUEST
        ================================================== */

        if (
            !context.WebSockets
                .IsWebSocketRequest)
        {
            context.Response.StatusCode =
                StatusCodes.Status400BadRequest;


            await context.Response.WriteAsync(
                "WebSocket connection required.");

            return;
        }


        /* ==================================================
           GET HANDLER
        ================================================== */

        var handler =
            context.RequestServices
                .GetRequiredService<
                    ChatWebSocketHandler>();


        /* ==================================================
           ACCEPT WEBSOCKET
        ================================================== */

        using var socket =
            await context.WebSockets
                .AcceptWebSocketAsync();


        /* ==================================================
           HANDLE CONNECTION
        ================================================== */

        await handler.HandleAsync(
            context,
            socket);
    });


/* =========================================================
   CONTROLLERS
========================================================= */

app.MapControllers();


/* =========================================================
   OPTIONAL SPA FALLBACK

   Nếu deploy frontend cùng ASP.NET:
   có thể bật lại.

   Hiện tại Vercel chạy frontend riêng
   nên giữ nguyên comment.
========================================================= */

// app.MapFallbackToFile("index.html");


/* =========================================================
   RUN
========================================================= */

app.Run();