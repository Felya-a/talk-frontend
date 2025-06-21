# Билд React-приложения
FROM node:22 AS client-builder
WORKDIR /build

COPY ./package.json ./
RUN npm i --force --loglevel=error

COPY . .
RUN npm run build

# ----------------------------------------------------------------------------------------

# Образ nginx и статическими файлами React
FROM nginx:latest

EXPOSE 3000

COPY --from=client-builder /build/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=client-builder /build/build/ /usr/share/nginx/html/