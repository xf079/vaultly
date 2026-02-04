import { Module } from '@nestjs/common';
import { PrismaModule } from '@/shared/prisma/prisma.module';
import { UserModule } from '@/modules/user/user.module';
import { TokenModule } from '@/modules/token/token.module';
import { ItemModule } from '@/modules/item/item.module';
import { DeviceModule } from '@/modules/device/device.module';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { ShareLinkModule } from '@/modules/share-link/share-link.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    TokenModule,
    ItemModule,
    DeviceModule,
    AuditLogModule,
    ShareLinkModule,
  ],
})
export class AppModule {}
