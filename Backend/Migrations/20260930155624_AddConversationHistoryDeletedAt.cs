using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CompanyChat.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddConversationHistoryDeletedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "HistoryDeletedAt",
                table: "ConversationMembers",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HistoryDeletedAt",
                table: "ConversationMembers");
        }
    }
}
