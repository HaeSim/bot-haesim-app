FROM node:20-alpine AS development

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 패키지 파일 복사 및 의존성 설치
COPY package.json yarn.lock ./
RUN yarn install

# 소스 코드 복사
COPY . .

# 애플리케이션 빌드
RUN yarn build

FROM node:20-alpine AS production

# 노드 환경 설정
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 패키지 파일 복사 및 프로덕션 의존성만 설치
COPY package.json yarn.lock ./
RUN yarn install --production

# 빌드된 애플리케이션 복사
COPY --from=development /usr/src/app/dist ./dist

# 포트 노출
EXPOSE 3000

# 애플리케이션 실행
CMD ["node", "dist/main"]