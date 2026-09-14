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
});
