# Install locked production dependencies in a separate build stage.
FROM node:24-alpine AS dependencies

ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false
WORKDIR /app
COPY package*.json /app/
RUN npm ci --omit=dev

FROM node:24-alpine AS production

LABEL maintainer="Harsh Prajapati"
LABEL description="Authenticated fragment storage and conversion API"

ENV PORT=80
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false
WORKDIR /app

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json /app/
COPY --chown=node:node ./src ./src
# Public test credentials support Compose integration tests; production rejects Basic Auth.
COPY --chown=node:node ./tests/.htpasswd ./tests/.htpasswd

EXPOSE 80
CMD ["npm", "start"]
