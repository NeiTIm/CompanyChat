using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CompanyChat.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupScope : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ScopeGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConversationId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScopeGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScopeGroups_Conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "Conversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScopeGroupDepartments",
                columns: table => new
                {
                    ScopeGroupId = table.Column<int>(type: "int", nullable: false),
                    DepartmentId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScopeGroupDepartments", x => new { x.ScopeGroupId, x.DepartmentId });
                    table.ForeignKey(
                        name: "FK_ScopeGroupDepartments_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ScopeGroupDepartments_ScopeGroups_ScopeGroupId",
                        column: x => x.ScopeGroupId,
                        principalTable: "ScopeGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScopeGroupMembers",
                columns: table => new
                {
                    ScopeGroupId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScopeGroupMembers", x => new { x.ScopeGroupId, x.UserId });
                    table.ForeignKey(
                        name: "FK_ScopeGroupMembers_ScopeGroups_ScopeGroupId",
                        column: x => x.ScopeGroupId,
                        principalTable: "ScopeGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ScopeGroupMembers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ScopeGroupDepartments_DepartmentId",
                table: "ScopeGroupDepartments",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ScopeGroupMembers_UserId",
                table: "ScopeGroupMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ScopeGroups_ConversationId",
                table: "ScopeGroups",
                column: "ConversationId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ScopeGroupDepartments");

            migrationBuilder.DropTable(
                name: "ScopeGroupMembers");

            migrationBuilder.DropTable(
                name: "ScopeGroups");
        }
    }
}
