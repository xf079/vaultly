import { Module } from '@nestjs/common';
import { VaultModule } from '@/modules/vault/vault.module';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';

@Module({
  imports: [VaultModule],
  controllers: [ItemController],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemModule {}
