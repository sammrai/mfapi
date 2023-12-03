FROM alpine:latest as base

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

WORKDIR /app
COPY src/ ./src/
COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile && yarn cache clean

RUN rm -rf /var/cache/apk/* /tmp/*

COPY tsconfig.json .eslintignore .eslintrc.yml .
RUN yarn compile

FROM alpine:latest
COPY --from=base /app /app
WORKDIR /app

RUN apk add --no-cache yarn tini

ENV TZ=Asia/Tokyo \
    DISPLAY=:99 \
    CHROMIUM_PATH=/usr/bin/chromium-browser

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh
ENTRYPOINT ["tini", "--"]
CMD ["/app/entrypoint.sh"]