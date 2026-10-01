using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CompanyChat.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddConversationDepartment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DepartmentId",
                table: "Conversations",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_DepartmentId",
                table: "Conversations",
                column: "DepartmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Conversations_Departments_DepartmentId",
                table: "Conversations",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Conversations_Departments_DepartmentId",
                table: "Conversations");

            migrationBuilder.DropIndex(
                name: "IX_Conversations_DepartmentId",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "DepartmentId",
                table: "Conversations");
        }
    }
}
