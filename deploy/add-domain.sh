#!/bin/bash
#====================================================================================================
# SCRIPT PARA ADICIONAR DOMÍNIO
# Execute este script DEPOIS que já estiver funcionando com IP
#
# COMO USAR:
# 1. Configure o DNS do seu domínio apontando para o IP da VPS (registro A)
# 2. Edite a variável DOMINIO abaixo
# 3. Execute: chmod +x add-domain.sh && sudo ./add-domain.sh
#====================================================================================================

# ⚠️ CONFIGURE AQUI O SEU DOMÍNIO
DOMINIO="seudominio.com.br"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}     ADICIONANDO DOMÍNIO + SSL         ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Por favor, execute como root (sudo)${NC}"
    exit 1
fi

# Verificar se domínio foi configurado
if [ "$DOMINIO" = "seudominio.com.br" ]; then
    echo -e "${RED}ERRO: Você precisa editar este arquivo e colocar seu domínio!${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/4] Instalando Certbot...${NC}"
apt install -y certbot python3-certbot-nginx

echo -e "${YELLOW}[2/4] Atualizando configuração do Nginx...${NC}"
cat > /etc/nginx/sites-available/disparador << EOF
server {
    listen 80;
    server_name ${DOMINIO};

    # Frontend (arquivos estáticos)
    root /var/www/disparador/frontend/dist;
    index index.html;

    # Tamanho máximo de upload
    client_max_body_size 50M;

    # Rotas do React SPA
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy para API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

nginx -t && systemctl reload nginx

echo -e "${YELLOW}[3/4] Atualizando arquivos .env...${NC}"

# Atualizar backend .env
cat > /var/www/disparador/backend/.env << EOF
SUPABASE_URL="https://owlignktsqlrqaqhzujb.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjUzMzAsImV4cCI6MjA4MzkwMTMzMH0.B9UhTYi8slAx2UWsSckys55O9VQHdkYIHyqhSeFy8Z0"
CORS_ORIGINS="https://${DOMINIO},http://${DOMINIO}"
EOF

# Atualizar frontend .env e rebuild
cat > /var/www/disparador/frontend/.env << EOF
REACT_APP_BACKEND_URL="https://${DOMINIO}"
EOF

echo -e "${YELLOW}Reconstruindo frontend...${NC}"
cd /var/www/disparador/frontend
yarn build

# Reiniciar backend
systemctl restart disparador-backend

echo -e "${YELLOW}[4/4] Obtendo certificado SSL...${NC}"
certbot --nginx -d ${DOMINIO} --non-interactive --agree-tos --email admin@${DOMINIO} --redirect

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}     DOMÍNIO CONFIGURADO! 🎉           ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Acesse: ${YELLOW}https://${DOMINIO}${NC}"
echo ""
echo -e "${YELLOW}O certificado SSL será renovado automaticamente.${NC}"
echo ""
