# Estágio de construção
FROM node:20-alpine as builder

WORKDIR /app

# O repositório contém package-lock.json, então usamos npm
COPY package*.json ./
RUN npm ci

COPY . .

# O Vite exige o prefixo VITE_ para expor variáveis ao código frontend.
# Se o seu código usa 'import.meta.env.VITE_BACKEND_URL', altere aqui:
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Executa o build usando o script definido no seu package.json
RUN npm run build

# Estágio de produção com Nginx
FROM nginx:alpine

# O seu vite.config.ts define 'build' como pasta de saída
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
