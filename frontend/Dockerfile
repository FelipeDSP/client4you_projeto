FROM node:20-alpine as builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY yarn.lock* ./

# Instalar dependências
RUN yarn install

# Copiar código fonte
COPY . .

# Definir variável de ambiente para build
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Build
RUN yarn build

# Estágio de produção com Nginx
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
