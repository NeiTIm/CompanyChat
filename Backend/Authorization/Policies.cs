namespace CompanyChat.Api.Authorization;

public static class Policies
{
    public const string ManageUsers = "ManageUsers";

    public const string ManageDepartments = "ManageDepartments";

    public const string AccessConversation = "AccessConversation";

    public const string SendMessage = "SendMessage";

    public const string DeleteOwnMessage = "DeleteOwnMessage";

    public const string DeleteMessageForEveryone =
        "DeleteMessageForEveryone";
}