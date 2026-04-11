// src/modules/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Controllers
import { AuthController } from '../controller/auth.controller';

// Services
import { AuthService } from '../services/auth.service';

// Repositories
import { UserRepository } from '../repository/user.repository';

// Guards & Strategies
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { UserModule } from './user.module';
import { StudentModule } from './student.module';

@Module({
  imports: [
    PassportModule,
    UserModule,
    StudentModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // UserRepository,
    JwtAuthGuard,
    RolesGuard,
    JwtStrategy,
  ],
  exports: [JwtAuthGuard, RolesGuard, JwtStrategy], // Export cho modules khác dùng
})
export class AuthModule {}