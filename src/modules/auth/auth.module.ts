import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Shared
import { AuditService } from '@/shared';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { AccountController } from './controllers/account.controller';

// Services
import { AuthService } from './services/auth.service';
import { AccountService } from './services/account.service';
import { SrpService } from './services/srp.service';
import { DeviceService } from './services/device.service';

// Strategies & Guards
import { JwtStrategy } from './strategies/jwt.strategy';
import { DeviceTrustGuard } from './guards/device-trust.guard';

@Module({
  imports: [
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
  ],
  controllers: [AuthController, AccountController],
  providers: [
    AuthService,
    AccountService,
    SrpService,
    DeviceService,
    AuditService,
    JwtStrategy,
    DeviceTrustGuard,
  ],
  exports: [
    AuthService,
    AccountService,
    DeviceService,
    AuditService,
    JwtModule,
  ],
})
export class AuthModule {}
