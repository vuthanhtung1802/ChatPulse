import { FriendsRealtimeService } from "./friends-realtime.service";

describe("FriendsRealtimeService", () => {
  const createServer = () => {
    const emit = jest.fn();
    return {
      server: { to: jest.fn(() => ({ emit })) } as never,
      emit,
    };
  };

  it("acknowledges and publishes a new friend request", async () => {
    const request = {
      _id: { toString: () => "request-id" },
      status: "pending",
    };
    const friendsService = {
      sendRequest: jest.fn().mockResolvedValue(request),
      findRequestById: jest.fn().mockResolvedValue(request),
    };
    const realtime = new FriendsRealtimeService(friendsService as never);
    const { server, emit } = createServer();
    const acknowledge = jest.fn();

    await realtime.sendRequest(server, "user-a", "user-b", acknowledge);

    expect(emit).toHaveBeenCalledWith("friendRequestReceived", { request });
    expect(acknowledge).toHaveBeenCalledWith({ ok: true, data: request });
  });

  it("returns service failures through the acknowledgement", async () => {
    const friendsService = {
      removeFriend: jest.fn().mockRejectedValue(new Error("Not friends")),
    };
    const realtime = new FriendsRealtimeService(friendsService as never);
    const { server } = createServer();
    const acknowledge = jest.fn();

    await realtime.removeFriend(server, "user-a", "user-b", acknowledge);

    expect(acknowledge).toHaveBeenCalledWith({
      ok: false,
      error: "Not friends",
    });
  });
});
