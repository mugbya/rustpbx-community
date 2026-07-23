FROM python:3.13-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc default-libmysqlclient-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目文件
COPY . .

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
