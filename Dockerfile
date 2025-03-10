FROM node:23.7.0-alpine AS development

# Oracle Instant Client 설치 (TLS 지원 버전)
RUN apk --no-cache add libaio libc6-compat curl unzip

# Oracle Instant Client 21.5 이상 버전 설치 (ARM64 호환)
RUN curl -o /tmp/instantclient.zip https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip && \
    unzip /tmp/instantclient.zip -d /opt && \
    rm /tmp/instantclient.zip && \
    ln -s /opt/instantclient* /opt/instantclient && \
    echo /opt/instantclient > /etc/ld.so.conf.d/oracle-instantclient.conf && \
    ldconfig /opt/instantclient || true

# 환경 변수 설정
ENV LD_LIBRARY_PATH=/opt/instantclient

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 패키지 설치 및 애플리케이션 빌드
COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn build

# 프로덕션 이미지 구성
FROM node:23.7.0-alpine AS production

# Oracle Instant Client 설치 (TLS 지원 버전)
RUN apk --no-cache add libaio libc6-compat curl unzip

# Oracle Instant Client 21.5 이상 버전 설치 (ARM64 호환)
RUN curl -o /tmp/instantclient.zip https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip && \
    unzip /tmp/instantclient.zip -d /opt && \
    rm /tmp/instantclient.zip && \
    ln -s /opt/instantclient* /opt/instantclient && \
    echo /opt/instantclient > /etc/ld.so.conf.d/oracle-instantclient.conf && \
    ldconfig /opt/instantclient || true

# 환경 변수 설정
ENV LD_LIBRARY_PATH=/opt/instantclient
ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install --production

COPY --from=development /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]