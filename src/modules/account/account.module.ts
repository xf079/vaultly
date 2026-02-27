import { Module } from '@nestjs/common';
import { SharedModule } from '@/shared/shared.module';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';

@Module({
  imports: [SharedModule],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
