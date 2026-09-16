import { ChatGateway } from "./chat.gateway";

describe("ChatGateway conversation rooms", () => {
  const createGateway = () => {
    const usersService = {
      resetAllStatuses: jest.fn().mockResolvedValue(undefined),
    };
    const gateway = new ChatGateway(
      {} as never,
      usersService as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const socketsJoin = jest.fn();
    const socketsLeave = jest.fn();
    const emit = jest.fn();
    gateway.server = {
      in: jest.fn(() => ({ socketsJoin, socketsLeave })),
      to: jest.fn(() => ({ emit })),
    } as never;
    return { gateway, usersService, socketsJoin, socketsLeave, emit };
  };

  it("clears stale online statuses when the server starts", async () => {
    const { gateway, usersService } = createGateway();

    await gateway.onApplicationBootstrap();

    expect(usersService.resetAllStatuses).toHaveBeenCalledTimes(1);
  });

  it("notifies every friend when a post is created", () => {
    const { gateway, emit } = createGateway();
    const post = { _id: "post-id", content: "Hello friends" };

    gateway.notifyFriendsOfPost(["user-a", "user-b"], post);

    expect(gateway.server.to).toHaveBeenNthCalledWith(1, "user:user-a");
    expect(gateway.server.to).toHaveBeenNthCalledWith(2, "user:user-b");
    expect(emit).toHaveBeenCalledTimes(2);
    expect(emit).toHaveBeenCalledWith("friendPostCreated", { post });
  });

  it("joins every participant socket and announces a new conversation", () => {
    const { gateway, socketsJoin, emit } = createGateway();
    const conversation = {
      _id: { toString: () => "conversation-id" },
      participants: [
        { _id: { toString: () => "user-a" } },
        { _id: { toString: () => "user-b" } },
      ],
    };

    gateway.notifyConversationCreated(conversation as never);

    expect(socketsJoin).toHaveBeenCalledTimes(2);
    expect(socketsJoin).toHaveBeenNthCalledWith(
      1,
      "conversation:conversation-id",
    );
    expect(socketsJoin).toHaveBeenNthCalledWith(
      2,
      "conversation:conversation-id",
    );
    expect(emit).toHaveBeenCalledTimes(2);
    expect(emit).toHaveBeenCalledWith("conversationCreated", { conversation });
  });

  it("removes all user sockets from a conversation room", () => {
    const { gateway, socketsLeave } = createGateway();

    gateway.removeUserFromConversationRoom("user-a", "conversation-id");

    expect(socketsLeave).toHaveBeenCalledWith("conversation:conversation-id");
  });
});
