# 医疗影像数据管理平台 MVP

这是一个面向课程演示的本地可运行版本，当前已实现：

- 登录界面
- 医生注册界面
- 登录后的影像管理界面
- 医疗影像图片上传、检索、预览、删除
- 管理员 / 医生账号管理
- 基于 Docker 的后端与 MySQL 部署
- 前后端基础联调

## 项目结构

```text
backend/              Express 后端服务
frontend/             React + Vite 前端
database/             MySQL 初始化脚本
docker-compose.yml    Docker 编排文件
background.jpg        前端背景图资源
```

## 默认账号

- 管理员：`admin / admin123`
- 演示医生：`doctor / doctor123`

## 技术栈

- 前端：React、Vite、React Router
- 后端：Node.js、Express、JWT、Multer
- 数据库：MySQL 8
- 部署：Docker Compose

## 组员如何部署

### 1. 拉取项目

```bash
git clone https://github.com/ecnu-soft/the-medical-project-g18.git
cd the-medical-project-g18/ysx_g18
```

### 2. 启动 Docker Desktop

确认本机已经启动 `Docker Desktop`。

### 3. 启动后端和数据库

在项目目录执行：

```bash
docker compose up --build
```

启动成功后：

- 后端接口：`http://localhost:4000`
- 健康检查：`http://localhost:4000/api/health`
- MySQL 宿主机端口：`3310`

说明：

- Docker 会自动启动 `mysql` 和 `backend`
- 数据库初始化脚本位于 [`database/init.sql`](./database/init.sql)
- 后端镜像构建文件位于 [`backend/Dockerfile`](./backend/Dockerfile)

### 4. 启动前端

新开一个终端，执行：

```bash
cd frontend
npm install
npm run dev
```

如果 PowerShell 阻止 `npm`，请改用：

```powershell
npm.cmd install
npm.cmd run dev
```

启动成功后访问：

- 前端地址：`http://localhost:5173`

## Docker 一起上传到 GitHub 的说明

后端使用 Docker 部署时，不需要上传镜像文件本身，只需要把这些文件提交到 GitHub：

- [`docker-compose.yml`](./docker-compose.yml)
- [`backend/Dockerfile`](./backend/Dockerfile)
- [`backend/package.json`](./backend/package.json)
- [`backend/server.js`](./backend/server.js)
- [`database/init.sql`](./database/init.sql)

组员拉取代码后，只要本机装了 Docker，就可以直接通过：

```bash
docker compose up --build
```

自动构建并启动后端和数据库，不需要你把容器或镜像手动打包上传。

## 已实现接口

- `POST /api/auth/register`：医生注册
- `POST /api/auth/login`：用户登录
- `GET /api/auth/me`：获取当前登录用户
- `GET /api/users`：管理员查看账号列表
- `GET /api/images`：查询影像列表
- `POST /api/images`：上传影像图片
- `DELETE /api/images/:id`：删除影像

## 常见问题

### 1. MySQL 端口冲突怎么办

当前项目已将宿主机端口改为：

```text
3310:3306
```

如果 `3310` 也冲突，可以修改 [`docker-compose.yml`](./docker-compose.yml) 中的端口映射。

### 2. 登录后出现乱码怎么办

请重启后端：

```bash
docker compose restart backend
```

然后退出登录并重新登录。演示账号会在后端启动时自动修正。

### 3. 上传后右侧影像库不显示新记录怎么办

当前前端逻辑已调整为：

- 上传成功后自动清空筛选条件
- 自动重新加载全部影像记录

如果仍有问题，先点击“重置”按钮，再查看左侧影像列表。

## GitHub 提交建议

推荐提交流程：

```bash
git add ysx_g18
git commit -m "feat: add medical imaging MVP with docker deployment"
git push origin master
```

如果仓库默认分支不是 `master`，请改成对应分支名，例如：

```bash
git push origin main
```

## 当前范围说明

- 当前仅实现本地课程演示所需的 MVP
- 暂未接入 AI 模型推理
- 注册功能仅开放医生账号，管理员账号仍由系统初始化
