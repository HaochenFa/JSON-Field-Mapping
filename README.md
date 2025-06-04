# JSON 字段映射工具

一个直观的前端工具，用于将远程数据库的 JSON 数据字段映射到其他数据库的字段名称。

## 功能特性

- 🔗 **数据库连接**: 支持连接远程数据库/API 获取 JSON 数据
- 📊 **数据可视化**: JSON 和表格两种格式展示数据
- 🎯 **拖拽映射**: 通过拖拽方式建立字段映射关系
- 📄 **分页处理**: 自动处理 JSON 分页数据
- 💾 **配置管理**: 保存和加载映射配置
- 📤 **导出功能**: 导出映射配置和转换脚本

## 技术栈

- **前端框架**: React 18 + TypeScript
- **UI 组件库**: Ant Design
- **拖拽功能**: react-dnd
- **状态管理**: Redux Toolkit
- **HTTP 客户端**: Axios
- **构建工具**: Vite

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

## 项目结构

```text
src/
├── components/          # 可复用组件
├── pages/              # 页面组件
├── store/              # Redux状态管理
├── types/              # TypeScript类型定义
├── utils/              # 工具函数
├── services/           # API服务
└── styles/             # 样式文件

tests/
├── setup.ts            # 测试环境配置
├── fixtures/           # 测试数据和模拟
│   └── testData.ts     # 测试数据
├── unit/               # 单元测试
│   ├── components/     # 组件测试
│   ├── services/       # 服务测试
│   ├── store/          # Redux状态测试
│   └── utils/          # 工具函数测试
└── integration/        # 集成测试
    └── fieldMapping.test.tsx  # 字段映射流程测试
```

## 使用说明

1. **配置连接**: 在顶部配置区输入数据库 URL、密钥和表名
2. **获取数据**: 点击连接按钮获取 JSON 数据
3. **查看数据**: 在左侧面板查看源数据，支持 JSON 和表格视图切换
4. **建立映射**: 通过拖拽将左侧字段映射到右侧目标字段
5. **管理映射**: 在底部查看和管理映射关系
6. **保存导出**: 保存配置或导出映射结果

## 开发计划

- [x] 项目初始化和环境搭建
- [x] 基础 UI 布局实现
- [x] 数据库连接功能
- [x] JSON 数据获取和解析
- [x] 拖拽映射功能
- [x] 配置保存/加载
- [x] 测试框架搭建
- [x] 单元测试实现
- [x] 集成测试实现
- [ ] 导出功能

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
