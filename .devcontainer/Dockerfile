ARG NODE_MAJOR_VERSION

FROM mcr.microsoft.com/devcontainers/typescript-node:1-${NODE_MAJOR_VERSION}-bookworm

ENV EDITOR="code -w" VISUAL="code -w" CHOKIDAR_USEPOLLING="1"

RUN apt-get update && apt-get install -y graphviz

# install additional npm packages
RUN su node -c 'npx playwright install --with-deps'