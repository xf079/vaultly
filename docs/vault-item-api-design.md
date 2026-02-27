# Vault / Item API 与 DTO 设计

零知识设计：名称、描述、主钥、条目 payload 均为客户端加密，服务端仅存储密文与分类/元数据。

---

## 一、Vault（保险库）API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/vaults` | 列表：当前用户的保险库（不含已软删） |
| POST | `/vaults` | 创建保险库 |
| GET | `/vaults/:id` | 单个保险库详情（需为拥有者或已接受共享） |
| PATCH | `/vaults/:id` | 更新保险库（仅密文与元数据） |
| DELETE | `/vaults/:id` | 软删除（设置 `deletedAt`，可走回收站流程） |
| POST | `/vaults/:id/restore` | 从软删除恢复（清空 `deletedAt`） |

### Vault Request DTO

```ts
// CreateVaultDto
{
  nameEncrypted: string;           // 必填，AES-GCM + Base64
  descriptionEncrypted?: string;    // 可选
  type: VaultType;                 // PERSONAL | SHARED | ORGANIZATION
  vaultKeyEncrypted: string;       // 必填，由 Account Key 加密的主钥
  isFavorite?: boolean;
  isArchived?: boolean;
}

// UpdateVaultDto (PartialType of Create，至少一项)
{
  nameEncrypted?: string;
  descriptionEncrypted?: string;
  type?: VaultType;
  vaultKeyEncrypted?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
}
```

### Vault Response DTO

```ts
// VaultResponseDto（单条）
{
  id: string;
  accountId: string;
  nameEncrypted: string;
  descriptionEncrypted: string | null;
  type: VaultType;
  vaultKeyEncrypted: string;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  _count?: { items: number; shares: number };  // 可选
}

// VaultListResponseDto
{
  vaults: VaultResponseDto[];
  total?: number;  // 可选，分页时
}
```

---

## 二、Item（保险库条目）API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/vaults/:vaultId/items` | 列表：该保险库下的条目（可筛选 category、favorite，排除已软删） |
| POST | `/vaults/:vaultId/items` | 创建条目 |
| GET | `/vaults/:vaultId/items/:id` | 单条详情 |
| PATCH | `/vaults/:vaultId/items/:id` | 更新条目（可写版本历史） |
| DELETE | `/vaults/:vaultId/items/:id` | 软删除条目 |
| POST | `/vaults/:vaultId/items/:id/restore` | 从软删除恢复 |
| GET | `/vaults/:vaultId/items/:id/versions` | 条目版本列表 |
| GET | `/vaults/:vaultId/items/:id/versions/:versionNumber` | 指定版本内容（密文） |

### Item Request DTO

```ts
// CreateItemDto
{
  dataEncrypted: string;    // 必填，完整条目 JSON 加密
  category: ItemCategory;   // LOGIN | CREDIT_CARD | SECURE_NOTE | ...
  favorite?: boolean;
}

// UpdateItemDto
{
  dataEncrypted?: string;
  category?: ItemCategory;
  favorite?: boolean;
  changeReason?: string;    // 写入 ItemVersion 的 changeReason
}
```

### Item Response DTO

```ts
// ItemResponseDto（单条）
{
  id: string;
  vaultId: string;
  dataEncrypted: string;
  category: ItemCategory;
  favorite: boolean;
  currentVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// ItemListResponseDto
{
  items: ItemResponseDto[];
  total?: number;
}

// ItemVersionResponseDto
{
  id: string;
  itemId: string;
  dataEncrypted: string;
  versionNumber: number;
  changedBy: string;
  changeReason: string | null;
  createdAt: Date;
}
```

---

## 三、Trash（回收站）API（可选扩展）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/trash` | 当前账户的回收站列表（Vault + Item，可筛 itemType） |
| POST | `/trash/:id/restore` | 恢复（根据 itemType 恢复 vault 或 item） |
| DELETE | `/trash/:id` | 彻底清除（purge） |

### Trash Response DTO

```ts
// TrashEntryResponseDto
{
  id: string;
  itemType: 'VAULT' | 'ITEM';
  itemId: string;
  vaultId: string | null;
  nameEncrypted: string | null;
  dataEncrypted: string | null;
  deletedBy: string;
  deletedAt: Date;
  purgedAt: Date | null;
  isRestored: boolean;
}
```

---

## 四、Share（保险库共享）API（可选扩展）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/vaults/:id/shares` | 发起共享（需 vaultKeyEncrypted + publicKeyUsed） |
| GET | `/vaults/:id/shares` | 该保险库的共享列表 |
| PATCH | `/vaults/:id/shares/:shareId` | 更新权限或撤销 |
| GET | `/shares/received` | 我收到的共享邀请（PENDING） |
| POST | `/shares/received/:shareId/accept` | 接受共享 |
| POST | `/shares/received/:shareId/decline` | 拒绝共享 |

---

## 五、权限与校验约定

- 所有接口需 `JwtAuthGuard`，使用 `@CurrentAccount()` 取 `accountId`。
- Vault：创建者即 `accountId`；GET/PATCH/DELETE 需校验当前用户为拥有者或具有该保险库的已接受共享。
- Item：通过 `vaultId` 校验对保险库的访问权后再操作条目。
- 软删除：列表默认排除 `deletedAt != null`；恢复接口仅允许恢复自己账户下的数据。

---

## 六、枚举引用

- **VaultType**：`@/generated/prisma/enums` → `PERSONAL` | `SHARED` | `ORGANIZATION`
- **ItemCategory**：`@/generated/prisma/enums` → `LOGIN` | `CREDIT_CARD` | `SECURE_NOTE` | `IDENTITY` | `BANK_ACCOUNT` | `SERVER` | `DATABASE` | `API_KEY` | `WIFI` | `PASSPORT` | `LICENSE`
- **TrashItemType**：`VAULT` | `ITEM`
- **VaultPermission** / **ShareStatus**：共享相关接口使用
