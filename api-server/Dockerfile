# BUILDER STAGE

FROM ubuntu:focal AS builder

RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get upgrade -y
RUN apt-get install -y nodejs
RUN rm -rf /var/lib/apt/lists/*

RUN apt-get install git -y
WORKDIR /home/app
COPY package*.json .
RUN npm ci
COPY . .

RUN npm run build


# PRODUCTION STAGE

FROM ubuntu:focal

RUN apt-get update && apt-get install -y \
    curl \
    && curl -sL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home/app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /home/app/dist ./dist

EXPOSE 9000
CMD ["node", "dist/index.js"]