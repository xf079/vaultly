import { Module } from '@nestjs/common';
import { DevicesController } from './device.controller';
import { DeviceService } from './device.service';

@Module({
  imports: [],
  controllers: [DevicesController],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class DeviceModule {}
