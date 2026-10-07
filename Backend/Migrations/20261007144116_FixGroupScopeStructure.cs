using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CompanyChat.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixGroupScopeStructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ScopeGroups_Conversations_ConversationId",
                table: "ScopeGroups");

            migrationBuilder.DropIndex(
                name: "IX_ScopeGroups_ConversationId",
                table: "ScopeGroups");

            migrationBuilder.DropColumn(
                name: "ConversationId",
                table: "ScopeGroups");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "ScopeGroups",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "ScopeGroups",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "ScopeGroups");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "ScopeGroups");

            migrationBuilder.AddColumn<int>(
                name: "ConversationId",
                table: "ScopeGroups",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_ScopeGroups_ConversationId",
                table: "ScopeGroups",
                column: "ConversationId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ScopeGroups_Conversations_ConversationId",
                table: "ScopeGroups",
                column: "ConversationId",
                principalTable: "Conversations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
