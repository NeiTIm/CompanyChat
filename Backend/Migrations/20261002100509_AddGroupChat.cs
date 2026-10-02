using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CompanyChat.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupChat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "Conversations",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Conversations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "ConversationMembers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "ConversationMembers");
        }
    }
}
