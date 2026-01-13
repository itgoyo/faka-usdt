# 自动发卡系统

基于Next.js的自动发卡网站，支持USDT支付。

## 功能特点

- 管理员后台上传卡密
- 用户购买流程，支持USDT支付
- 自动支付验证和卡密交付
- MySQL数据库存储

## 技术栈

- Next.js 16
- TypeScript
- Tailwind CSS
- Prisma + MySQL
- USDT支付集成

## 安装和设置

1. 安装依赖：
```bash
cd web
npm install
```

2. 启动开发服务器（当前使用内存模拟数据）：
```bash
npm run dev
```

## 当前状态

⚠️ **重要**: 当前版本实现了真实的USDT支付验证！

### 支付验证流程

1. **创建订单**: 调用真实的支付API获取钱包地址和订单信息
2. **显示支付界面**: 生成二维码，用户扫描支付
3. **实时验证**: 每15秒检查TRON网络上的USDT转账
4. **自动交付**: 确认支付后立即交付卡密

### 安全特性

- ✅ **区块链验证**: 通过TRON API验证实际交易
- ✅ **金额匹配**: 精确匹配支付金额 (±0.01 USDT)
- ✅ **时间窗口**: 只接受订单创建后10分钟内的交易
- ✅ **一次性交付**: 每个卡密只能被使用一次

### 环境要求

确保 `.env` 文件包含正确的配置：
```env
API_TOKEN="你的支付API密钥"
API_URL="https://pay.tg10000.com/api/v1/order/create-transaction"
TRON_API_URL="https://api.trongrid.io/v1/accounts/钱包地址/transactions/trc20"
```

### 测试说明

#### 开发测试模式
当前版本会调用真实的支付API和TRON网络验证。要进行安全测试：

1. **UI测试**: 启动服务器查看界面和流程
2. **支付API测试**: 检查订单创建是否正常
3. **验证逻辑测试**: 可以暂时修改检查间隔来观察

#### ⚠️ 生产使用注意
- 确保API密钥正确
- 钱包地址配置正确
- 生产环境需要HTTPS
- 定期备份数据库

**重要**: 这会产生真实交易，请谨慎测试！

### 数据库集成

要启用MySQL数据库：
1. 安装MySQL并创建数据库
2. 修改 `DATABASE_URL`
3. 运行 `npx prisma db push`
4. 将API中的模拟数据替换为Prisma查询

## 使用说明

### 管理员操作

1. 访问 `/admin` 页面
2. 填写卡密标题
3. 输入卡密内容（每行一个）
4. 设置价格
5. 点击上传

### 用户购买

1. 访问首页查看可用卡密
2. 点击"立即购买"
3. 扫描USDT二维码或复制地址支付
4. 支付成功后自动显示卡密

## API接口

- `GET /api/cards` - 获取可用卡密列表
- `POST /api/cards` - 上传新卡密
- `POST /api/orders` - 创建支付订单
- `GET /api/orders/[orderId]/check` - 检查支付状态

## 环境变量

```env
DATABASE_URL="mysql://user:password@localhost:3306/faka_usdt"
API_TOKEN="your_payment_api_token"
API_URL="https://pay.tg10000.com/api/v1/order/create-transaction"
NOTIFY_URL="http://your-domain.com/notify"
REDIRECT_URL="http://your-domain.com/success"
TRON_API_URL="https://api.trongrid.io/v1/accounts/TRON_ADDRESS/transactions/trc20"
```

## 数据库结构

### Cards 表
- id: 卡密ID
- title: 卡密标题
- content: 卡密数组 (JSON)
- price: 价格
- availableCount: 可用数量

### Orders 表
- id: 订单ID
- cardId: 关联卡密ID
- status: 订单状态 (pending/paid/delivered)
- paymentTx: 支付交易哈希
- sessionId: 用户会话ID

## 注意事项

- 确保MySQL数据库已创建
- 配置正确的支付API参数
- 生产环境需要HTTPS
- 定期备份数据库
