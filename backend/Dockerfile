FROM node:20-alpine

WORKDIR /app

# 先复制后端依赖
COPY backend/package*.json ./
RUN npm install

# 复制后端代码
COPY backend/ ./

# 创建 uploads 目录
RUN mkdir -p uploads

EXPOSE 4000

CMD ["npm", "start"]