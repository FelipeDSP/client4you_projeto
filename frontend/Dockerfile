FROM node:20-alpine as builder

WORKDIR /app

# Instalar dependências
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile || yarn install

# Copiar o restante do código
COPY . .

# Variável de ambiente necessária para o build
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Executar o build (Isso vai criar a pasta /app/build)
RUN yarn build

# Estágio de produção
FROM nginx:alpine

# MUDANÇA AQUI: Copiando de 'build' em vez de 'dist'
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
