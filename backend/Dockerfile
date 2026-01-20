FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt || \
    (sed -i '/emergentintegrations/d' requirements.txt && pip install --no-cache-dir -r requirements.txt)

# Copiar código
COPY . .

# Expor porta
EXPOSE 8001

# Comando para iniciar
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
