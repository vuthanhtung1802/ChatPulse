import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { MailService } from "../mail/mail.service";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";

describe("AuthService", () => {
  let service: AuthService;
  let usersService: UsersService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    setRefreshToken: jest.fn(),
    removeAllRefreshTokens: jest.fn(),
    updateRefreshToken: jest.fn(),
    findByVerificationToken: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue("test-token"),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: "test-secret",
        JWT_EXPIRES_IN: "15m",
        JWT_REFRESH_SECRET: "test-refresh-secret",
        JWT_REFRESH_EXPIRES_IN: "7d",
      };
      return config[key];
    }),
  };

  const mockMailService = {
    sendVerificationEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("register", () => {
    it("should throw if email already exists", async () => {
      mockUsersService.findByEmail.mockResolvedValue({ _id: "existing" });
      await expect(
        service.register({ name: "Test", email: "test@test.com", password: "123456" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should create user and send verification email", async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        _id: "new-id",
        name: "Test",
        email: "test@test.com",
      });

      const result = await service.register({
        name: "Test",
        email: "test@test.com",
        password: "123456",
      });

      expect(result).toBeDefined();
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should throw if user not found", async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: "test@test.com", password: "123456" }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
