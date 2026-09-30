using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CompanyChat.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMessageDeliveryStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveredAt",
                table: "MessageUserStates",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDelivered",
                table: "MessageUserStates",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveredAt",
                table: "MessageUserStates");

            migrationBuilder.DropColumn(
                name: "IsDelivered",
                table: "MessageUserStates");
        }
    }
}
