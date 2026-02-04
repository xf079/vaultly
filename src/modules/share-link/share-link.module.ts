import { Module } from '@nestjs/common';
import { ShareLinkController } from './share-link.controller';
import { ShareLinkService } from './share-link.service';

@Module({
  controllers: [ShareLinkController],
  providers: [ShareLinkService],
  exports: [ShareLinkService],
})
export class ShareLinkModule {}
