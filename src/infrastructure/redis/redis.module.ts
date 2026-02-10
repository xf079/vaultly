import type { DynamicModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

/** 注入 Keyv 实例的 token，在需要缓存/键值存储的 Service 中 @Inject(KEYV_TOKEN) */
export const KEYV_TOKEN = Symbol('KEYV');

@Module({})
export class RedisModule {
  static forRootAsync(options?: {
    imports?: DynamicModule['imports'];
  }): DynamicModule {
    return {
      module: RedisModule,
      global: true,
      imports: [ConfigModule, ...(options?.imports ?? [])],
      providers: [
        {
          provide: KEYV_TOKEN,
          useFactory: (config: ConfigService): Keyv => {
            const useMemory = true;
            const namespace = config.get<string>('REDIS_NAMESPACE', 'vaultly:');
            if (useMemory) {
              return new Keyv({ namespace });
            }
            const url = config.get<string>('REDIS_URL');
            const store = new KeyvRedis(url, { namespace });
            return new Keyv({ store, namespace, useKeyPrefix: false });
          },
          inject: [ConfigService],
        },
      ],
      exports: [KEYV_TOKEN],
    };
  }
}
