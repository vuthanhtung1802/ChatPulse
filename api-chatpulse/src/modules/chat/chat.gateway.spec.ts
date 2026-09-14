import { ChatGateway } from "./chat.gateway";

describe("ChatGateway conversation rooms", () => {
  const createGateway = () => {
    const gateway = new ChatGateway(
      {} as never,
      {} as never,
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
    return { gateway, socketsJoin, socketsLeave, emit };
  };

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
