import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ChatModule } from "./modules/chat/chat.module";
import { PostsModule } from "./modules/posts/posts.module";
import { FriendsModule } from "./modules/friends/friends.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("MONGO_URI"),
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    UsersModule,
    ChatModule,
    PostsModule,
    FriendsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
