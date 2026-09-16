import { BadRequestException } from "@nestjs/common";
import { FriendsService } from "./friends.service";

describe("FriendsService request transitions", () => {
  const userId = "507f1f77bcf86cd799439011";
  const requesterId = "507f191e810c19729de860ea";

  const createService = (request: Record<string, unknown>) => {
    const model = {
      findById: jest.fn().mockResolvedValue(request),
    };
    return new FriendsService(model as never, {} as never);
  };

  it("rejects accepting a request that is no longer pending", async () => {
    const request = {
      addressee: { toString: () => userId },
      requester: { toString: () => requesterId },
      status: "rejected",
      save: jest.fn(),
    };

    await expect(
      createService(request).acceptRequest("request-id", userId),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(request.save).not.toHaveBeenCalled();
  });

  it("rejects declining an accepted friendship", async () => {
    const request = {
      addressee: { toString: () => userId },
      requester: { toString: () => requesterId },
      status: "accepted",
      save: jest.fn(),
    };

    await expect(
      createService(request).declineRequest("request-id", userId),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(request.save).not.toHaveBeenCalled();
  });

  it("removes an accepted friendship in either direction", async () => {
    const exec = jest.fn().mockResolvedValue({ _id: "friendship-id" });
    const model = {
      findOne: jest.fn().mockReturnValue({ exec }),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    };
    const service = new FriendsService(model as never, {} as never);

    await service.removeFriend(userId, requesterId);

    expect(model.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ status: "accepted" }),
    );
    expect(model.deleteMany).toHaveBeenCalledTimes(1);
  });

  it("rejects removing a user who is not a friend", async () => {
    const model = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      deleteMany: jest.fn(),
    };
    const service = new FriendsService(model as never, {} as never);

    await expect(service.removeFriend(userId, requesterId)).rejects.toThrow(
      "You are not friends with this user",
    );
    expect(model.deleteMany).not.toHaveBeenCalled();
  });
});
