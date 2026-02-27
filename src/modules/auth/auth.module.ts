/**
 * @file auth.module.ts
 * @description 认证模块，负责认证相关的功能
 * @module auth.module
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Shared
import { SharedModule } from '@/shared/shared.module';

// Local
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { SrpService } from './services/srp.service';
import { JwtStrategy } from './strategys/jwt.strategy';
import { DeviceTrustGuard } from './guard/device-trust.guard';

// External Modules
import { AccountModule } from '../account/account.module';
import { DeviceModule } from '../device/device.module';

@Module({
  imports: [
    SharedModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN'),
          issuer: config.get('JWT_ISSUER'),
          audience: config.get('JWT_AUDIENCE'),
        },
      }),
    }),
    AccountModule,
    DeviceModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, SrpService, JwtStrategy, DeviceTrustGuard],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
