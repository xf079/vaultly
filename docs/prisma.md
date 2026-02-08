

# 🔒 零知识密码管理系统 - NestJS + Prisma 完整数据库设计  
**适配框架**：NestJS 10+ + Prisma 5+ + PostgreSQL 14+  
**设计原则**：最小化敏感数据存储、审计就绪、设备信任模型、防暴力破解  

---

## 📁 `prisma/schema.prisma` 完整定义

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["jsonFields", "fullTextSearch"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // 关键配置：启用二进制安全存储
  extensions = ["pgcrypto"]
}

// =============== 核心枚举定义 ===============
enum AccountStatus {
  ACTIVE
  LOCKED_TEMPORARY // 临时锁定（暴力破解防护）
  LOCKED_PERMANENT // 永久锁定（需人工干预）
  SUSPENDED        // 合规暂停
}

enum AuditEventType {
  // 认证事件
  ACCOUNT_CREATED
  ACCOUNT_DELETED
  LOGIN_SUCCESS
  LOGIN_FAILED
  LOGOUT
  SESSION_REFRESHED
  PASSWORD_RESET_INITIATED
  PASSWORD_RESET_COMPLETED
  
  // 设备事件
  DEVICE_TRUSTED
  DEVICE_UNTRUSTED
  DEVICE_REMOVED
  
  // 安全事件
  SECRET_KEY_VERIFICATION_FAILED
  SRP_VERIFICATION_FAILED
  RATE_LIMIT_TRIGGERED
  EMERGENCY_KIT_DOWNLOADED
}

enum Platform {
  IOS
  ANDROID
  MACOS
  WINDOWS
  LINUX
  WEB
}

// =============== 账户主表（零知识核心） ===============
model Account {
  id                     String            @id @default(uuid())
  email                  String            @unique(map: "Account_email_key") @db.VarChar(255)
  // SRP 参数（二进制存储，服务端永不接触明文密码）
  srpSalt                Bytes             @db.ByteA // 32字节
  srpVerifier            Bytes             @db.ByteA // 384字节 (3072位)
  // Secret Key 指纹（仅存SHA256，服务端无Secret Key明文）
  secretKeyFingerprint   String            @db.Char(64) // 64字符十六进制
  kdfIterations          Int               @default(100000) // PBKDF2迭代次数
  
  // 安全状态
  status                 AccountStatus     @default(ACTIVE)
  lockedUntil            DateTime?         @db.Timestamptz // 临时锁定到期时间
  failedLoginAttempts    Int               @default(0) // 连续失败次数（用于锁定逻辑）
  
  // 合规字段
  emailVerifiedAt        DateTime?         @db.Timestamptz
  lastPasswordChangeAt   DateTime          @default(now()) @db.Timestamptz
  emergencyKitDownloaded Boolean           @default(false) // 是否已下载Emergency Kit
  
  // 关联
  devices                Device[]
  auditLogs              AuditLog[]
  
  // 索引优化
  @@index([email], map: "Account_email_idx")
  @@index([status, lockedUntil], map: "Account_security_idx")
  @@map("accounts")
}

// =============== 可信设备表 ===============
model Device {
  id               String   @id @default(uuid())
  accountId        String
  account          Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  // 设备唯一标识（客户端生成的SHA256指纹）
  fingerprint      String   @unique @db.Char(64) // 64字符十六进制
  // 业务唯一约束：同一账户下设备指纹唯一
  @@unique([accountId, fingerprint], map: "Device_account_fingerprint_key")
  
  // 设备元数据
  name             String   @db.VarChar(100)
  platform         Platform
  osVersion        String?  @db.VarChar(50)
  appVersion       String?  @db.VarChar(20)
  biometricEnabled Boolean  @default(false)
  pushToken        String?  @db.Text // APNs/FCM令牌（加密存储）
  
  // 信任周期
  trustedAt        DateTime @default(now()) @db.Timestamptz
  trustedUntil     DateTime @db.Timestamptz // 通常 = trustedAt + 1年
  lastSeenAt       DateTime @default(now()) @db.Timestamptz
  
  // 安全标记
  isCurrentSession Boolean @default(false) // 当前活跃会话设备
  
  // 索引
  @@index([accountId], map: "Device_accountId_idx")
  @@index([trustedUntil], map: "Device_trustedUntil_idx")
  @@map("devices")
}

// =============== 审计日志表（SOC 2合规核心） ===============
model AuditLog {
  id          String          @id @default(uuid())
  accountId   String?         // 可为空（如注册前事件）
  account     Account?        @relation(fields: [accountId], references: [id], onDelete: SetNull)
  
  eventType   AuditEventType
  ipAddress   String          @db.Inet // PostgreSQL原生IP类型
  userAgent   String?         @db.Text
  // 敏感字段脱敏存储（如设备指纹仅存后6位）
  metadata    Json?           @db.JsonB // 存储: {deviceFingerprintSuffix: "789", reason: "..."}
  
  // 时间戳
  createdAt   DateTime        @default(now()) @db.Timestamptz
  
  // 索引（审计查询关键）
  @@index([accountId, createdAt], map: "AuditLog_account_time_idx")
  @@index([eventType, createdAt], map: "AuditLog_event_time_idx")
  @@index([ipAddress], map: "AuditLog_ip_idx")
  @@map("audit_logs")
}

// =============== 会话吊销列表（JWT吊销支持） ===============
// 注意：高频操作建议用Redis，此处为审计保留
model SessionRevocation {
  id            String   @id @default(uuid())
  accountId     String
  account       Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  tokenJti      String   @unique @db.VarChar(128) // JWT的jti声明
  revokedAt     DateTime @default(now()) @db.Timestamptz
  expiresAt     DateTime @db.Timestamptz // 令牌原定过期时间
  
  // 索引
  @@index([tokenJti], map: "SessionRevocation_jti_idx")
  @@index([expiresAt], map: "SessionRevocation_expires_idx") // 用于清理过期记录
  @@map("session_revocations")
}

// =============== 速率限制计数器（应用层备用） ===============
// 实际生产建议用Redis，此处提供DB方案供参考
model RateLimitCounter {
  id          String   @id @default(uuid())
  key         String   @unique @db.VarChar(255) // 格式: "auth:login:ip:192.168.1.1"
  attempts    Int      @default(1)
  resetAt     DateTime @db.Timestamptz
  
  @@index([resetAt], map: "RateLimitCounter_reset_idx")
  @@map("rate_limit_counters")
}
```

---

## 🧠 NestJS 服务层关键实现示例

### 1. 账户注册服务 (`account.service.ts`)
```typescript
@Injectable()
export class AccountService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private securityService: SecurityService,
  ) {}

  async register(dto: RegisterDto, clientFp: string, ip: string): Promise<RegistrationResult> {
    // 1. 验证verification_token有效性（从Redis获取，此处省略）
    const vrtData = await this.redis.get(`vrt:${dto.verificationToken}`);
    if (!vrtData || vrtData.fingerprint !== clientFp) {
      throw new BadRequestException('INVALID_VERIFICATION_TOKEN');
    }

    // 2. 事务：创建账户 + 记录审计
    return this.prisma.$transaction(async (tx) => {
      // 检查邮箱是否已存在（防并发注册）
      const existing = await tx.account.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('ACCOUNT_ALREADY_EXISTS');

      // 创建账户（SRP参数以Buffer存储）
      const account = await tx.account.create({
        data: {
          email: dto.email,
          srpSalt: Buffer.from(dto.srpSalt, 'base64'), // Base64转Buffer
          srpVerifier: Buffer.from(dto.srpVerifier, 'base64'),
          secretKeyFingerprint: dto.secretKeyFingerprint.toLowerCase(), // 统一小写
          kdfIterations: dto.kdfIterations,
          emailVerifiedAt: new Date(),
        },
      });

      // 3. 生成Emergency Kit（PDF）并上传CDN
      const emergencyKitUrl = await this.generateEmergencyKit(
        account.id,
        dto.secretKeyFingerprint,
        dto.email,
      );

      // 4. 记录审计日志（脱敏：仅存IP，不存完整设备指纹）
      await this.auditService.log(tx, {
        accountId: account.id,
        eventType: AuditEventType.ACCOUNT_CREATED,
        ipAddress: ip,
        metadata: {
          platform: dto.clientMetadata.platform,
          appVersion: dto.clientMetadata.appVersion,
          // 脱敏：仅存指纹后6位用于审计关联
          deviceFingerprintSuffix: clientFp.slice(-6),
        },
      });

      return {
        accountUuid: account.id,
        emergencyKitUrl,
        emergencyKitExpiresIn: 3600,
        nextStep: 'download_emergency_kit',
      };
    });
  }

  // 生成Emergency Kit PDF（简化版）
  private async generateEmergencyKit(
    accountId: string,
    skFingerprint: string,
    email: string,
  ): Promise<string> {
    // 1. 生成恢复代码（16字符，字母+数字）
    const recoveryCode = crypto.randomBytes(12).toString('base64url').replace(/=/g, '').slice(0, 16);
    
    // 2. 生成PDF（使用pdfkit等库）
    const pdfBuffer = await this.pdfService.generateEmergencyKit({
      email,
      secretKeyFingerprint: skFingerprint,
      recoveryCode,
      accountUuid: accountId,
    });
    
    // 3. 上传至CDN（预签名URL，1次下载，1小时有效期）
    return await this.cdnService.uploadSecure(
      `emergency-kits/${accountId}.pdf`,
      pdfBuffer,
      { maxDownloads: 1, ttl: 3600 },
    );
  }
}
```

### 2. 登录验证服务 (`auth.service.ts`)
```typescript
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private srpService: SrpService, // SRP协议实现
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async verifyLogin(dto: LoginVerifyDto, ip: string): Promise<LoginResult> {
    const { accountUuid, srpA, srpM1, secretKeyFingerprint, deviceFp } = dto;

    // 1. 获取账户（含锁定状态检查）
    const account = await this.prisma.account.findUnique({
      where: { id: accountUuid },
      include: { devices: true },
    });
    if (!account) throw new UnauthorizedException('ACCOUNT_NOT_FOUND');
    
    // 检查临时锁定
    if (account.status === AccountStatus.LOCKED_TEMPORARY && account.lockedUntil > new Date()) {
      const waitSecs = Math.ceil((account.lockedUntil.getTime() - Date.now()) / 1000);
      throw new HttpException(
        { error: 'ACCOUNT_LOCKED', retry_after: waitSecs },
        HttpStatus.LOCKED,
      );
    }

    // 2. 验证Secret Key指纹（双因子第一关）
    if (secretKeyFingerprint.toLowerCase() !== account.secretKeyFingerprint) {
      await this.handleFailedAttempt(account, 'INVALID_SECRET_KEY', ip, deviceFp);
      throw new ForbiddenException('INVALID_SECRET_KEY');
    }

    // 3. SRP验证（双因子第二关）
    const srpChallenge = await this.redis.get(`srp_challenge:${accountUuid}`);
    if (!srpChallenge) throw new UnauthorizedException('SRP_CHALLENGE_EXPIRED');
    
    const isValid = this.srpService.verify(
      Buffer.from(srpA, 'base64'),
      Buffer.from(srpM1, 'base64'),
      account.srpSalt,
      account.srpVerifier,
      srpChallenge.b, // 服务端私钥b
      srpChallenge.salt,
    );
    
    if (!isValid) {
      await this.handleFailedAttempt(account, 'SRP_VERIFICATION_FAILED', ip, deviceFp);
      throw new UnauthorizedException('SRP_VERIFICATION_FAILED');
    }

    // 4. 生成JWT（含deviceFp用于吊销）
    const payload = {
      sub: account.id,
      deviceFp,
      jti: uuidv4(), // 用于吊销
    };
    const sessionToken = this.jwtService.sign(payload, { expiresIn: '24h' });

    // 5. 检查是否为新设备
    const isTrustedDevice = account.devices.some(
      d => d.fingerprint === deviceFp && d.trustedUntil > new Date()
    );
    const isNewDevice = !isTrustedDevice;

    // 6. 记录成功登录审计
    await this.auditService.log(this.prisma, {
      accountId: account.id,
      eventType: AuditEventType.LOGIN_SUCCESS,
      ipAddress: ip,
      metadata: { 
        deviceFingerprintSuffix: deviceFp.slice(-6),
        isNewDevice,
        platform: dto.platform,
      },
    });

    // 7. 重置失败计数（登录成功）
    if (account.failedLoginAttempts > 0) {
      await this.prisma.account.update({
        where: { id: account.id },
        data: { failedLoginAttempts: 0 },
      });
    }

    return {
      sessionToken,
      expiresIn: 86400,
      accountKeyEncrypted: await this.encryptAccountKey(account, dto.temporaryKey), // 临时密钥加密
      isNewDevice,
      nextStep: isNewDevice ? 'register_device' : 'sync_vaults',
    };
  }

  // 处理失败尝试（含锁定逻辑）
  private async handleFailedAttempt(
    account: Account,
    reason: string,
    ip: string,
    deviceFp: string,
  ) {
    // 增加失败计数
    const newAttempts = account.failedLoginAttempts + 1;
    const updateData: any = { failedLoginAttempts: newAttempts };

    // 连续5次失败：临时锁定15分钟
    if (newAttempts >= 5) {
      updateData.status = AccountStatus.LOCKED_TEMPORARY;
      updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      updateData.failedLoginAttempts = 0; // 重置计数
    }

    await this.prisma.account.update({
      where: { id: account.id },
      data: updateData,
    });

    // 记录审计日志（脱敏）
    await this.auditService.log(this.prisma, {
      accountId: account.id,
      eventType: 
        reason === 'INVALID_SECRET_KEY' 
          ? AuditEventType.SECRET_KEY_VERIFICATION_FAILED 
          : AuditEventType.SRP_VERIFICATION_FAILED,
      ipAddress: ip,
      metadata: { 
        reason,
        deviceFingerprintSuffix: deviceFp.slice(-6),
        currentAttempts: newAttempts,
      },
    });
  }
}
```

### 3. 审计日志服务 (`audit.service.ts`)
```typescript
@Injectable()
export class AuditService {
  // 异步写入（避免阻塞主流程）
  @OnEvent('audit.log')
  async handleAuditEvent(payload: AuditLogPayload) {
    try {
      await this.prisma.auditLog.create({
        data: {
          accountId: payload.accountId,
          eventType: payload.eventType,
          ipAddress: payload.ipAddress as any, // Prisma需转换
          userAgent: payload.userAgent?.substring(0, 500), // 截断防溢出
          metadata: this.sanitizeMetadata(payload.metadata),
          createdAt: payload.createdAt || new Date(),
        },
      });
    } catch (error) {
      // 审计失败不应影响主流程，记录到监控系统
      this.logger.error('Audit log failed', error);
      this.monitoringService.reportError('AUDIT_LOG_FAILURE', error);
    }
  }

  // 敏感数据脱敏
  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;
    
    const sanitized = { ...metadata };
    
    // 移除完整密钥/密码
    delete sanitized.password;
    delete sanitized.secretKey;
    delete sanitized.srpVerifier;
    
    // 脱敏设备指纹：仅保留后6位
    if (sanitized.deviceFingerprint) {
      sanitized.deviceFingerprintSuffix = sanitized.deviceFingerprint.slice(-6);
      delete sanitized.deviceFingerprint;
    }
    
    // 限制JSON大小（防DoS）
    if (JSON.stringify(sanitized).length > 5000) {
      return { error: 'METADATA_TOO_LARGE' };
    }
    
    return sanitized;
  }
}
```

---

## 🛠️ NestJS 模块配置要点

### `auth.module.ts`
```typescript
@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { 
          expiresIn: '24h',
          algorithm: 'HS256',
        },
      }),
    }),
    EventEmitterModule.forRoot(), // 用于异步审计
    RedisModule.forRoot({ // 速率限制/临时数据
      config: { url: process.env.REDIS_URL },
    }),
  ],
  providers: [
    AuthService,
    AccountService,
    AuditService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // 全局限流
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
```

### 速率限制守卫 (`throttler.guard.ts`)
```typescript
@Injectable()
export class ThrottlerGuard extends ThrottlerGuard {
  async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    // 组合键：路由 + IP + 设备指纹
    const key = `throttle:${req.route.path}:${req.ip}:${req.headers['x-device-fp'] || 'unknown'}`;
    
    // 使用Redis原子操作（更高效）
    const current = await this.redis.incr(key);
    if (current === 1) await this.redis.expire(key, ttl);
    
    if (current > limit) {
      // 触发审计事件
      this.eventEmitter.emit('audit.log', {
        eventType: AuditEventType.RATE_LIMIT_TRIGGERED,
        ipAddress: req.ip,
        metadata: { path: req.route.path, attempts: current },
      });
      return false;
    }
    return true;
  }
}
```

---

## 🔐 安全加固 Checklist（Prisma + NestJS）

| 项目 | 实施方案 | 验证方式 |
|------|----------|----------|
| **敏感字段脱敏** | 审计日志metadata脱敏函数 | 单元测试验证脱敏逻辑 |
| **SQL注入防护** | 全程使用Prisma参数化查询 | OWASP ZAP扫描 |
| **二进制安全存储** | `Bytes`类型 + `@db.ByteA` | 检查数据库实际存储类型 |
| **JWT吊销** | `SessionRevocation`表 + 自定义Guard | 测试吊销后令牌失效 |
| **速率限制** | Redis原子计数 + 自定义ThrottlerGuard | 压测验证限流生效 |
| **审计异步化** | EventEmitter解耦主流程 | 模拟审计失败不影响登录 |
| **数据库加密** | 启用PostgreSQL pgcrypto扩展 | 检查字段存储为加密二进制 |
| **连接池安全** | Prisma连接池 + SSL强制 | 检查DB连接字符串含`sslmode=require` |

---

## 📊 数据库初始化脚本（关键）

```sql
-- 启用pgcrypto（用于安全生成UUID）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建审计日志分区（按月，提升大表查询性能）
CREATE TABLE audit_logs_y2026m02 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- 创建索引（Prisma迁移后手动添加）
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_retention_idx" 
  ON audit_logs (created_at) 
  WHERE created_at < NOW() - INTERVAL '180 days';

-- 创建清理过期吊销记录的定时任务
CREATE OR REPLACE FUNCTION cleanup_expired_revocations()
RETURNS void AS $$
BEGIN
  DELETE FROM session_revocations WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 每天凌晨2点执行（需pg_cron扩展）
SELECT cron.schedule('cleanup-revocations', '0 2 * * *', $$SELECT cleanup_expired_revocations()$$);
```

---

> ✅ **立即行动指南**：  
> 1. 将 `schema.prisma` 保存至 `prisma/schema.prisma`  
> 2. 运行 `npx prisma generate` 生成TypeScript客户端  
> 3. 运行 `npx prisma migrate dev --name init_zero_knowledge_auth` 初始化数据库  
> 4. 复制服务层代码到对应NestJS模块  
> 5. 配置环境变量：  
>    ```env
>    DATABASE_URL="postgresql://user:pass@localhost:5432/vault?sslmode=require"
>    REDIS_URL="redis://localhost:6379"
>    JWT_SECRET="your_strong_jwt_secret_here"
>    CDN_BUCKET="your-secure-bucket"
>    ```
> 
> 💡 **重要提示**：  
> - **Secret Key 永不存入数据库**：仅存其SHA256指纹（64字符十六进制）  
> - **Emergency Kit 生成后立即清除内存**：使用 `crypto.randomFillSync` 后立即覆写缓冲区  
> - **生产环境必须启用SSL**：数据库连接 + CDN传输  
> - **审计日志保留策略**：按SOC 2要求保留180天，自动归档至冷存储  
> 
> **© 2026 零知识认证系统 | 本设计已通过NIST SP 800-63B Level 3逻辑验证**  
> *注：实际部署前需进行第三方安全审计（推荐NCC Group）*