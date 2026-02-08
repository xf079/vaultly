import { Module } from '@nestjs/common';
import { CoreModule } from '@/core/core.module';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [CoreModule, PrismaModule, AuthModule],
})
export class AppModule {}
