# Bigmarket API — pnpm monorepo image
#
# Build from the repository root (not from apps/api-v1):
#   docker build -f apps/api-v1/Dockerfile --build-arg NODE_ENV=testnet -t bigmarket_api:testnet .
#
# Requires: package.json, pnpm-lock.yaml, pnpm-workspace.yaml at repo root; workspace sources under apps/ and packages/.

FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

ARG NODE_ENV=devnet
ENV NODE_ENV=${NODE_ENV}

ENV CI=true

# Workspace deps for api-v1 (@bigmarket/bm-types, sdk, bm-utilities, transitives)
RUN pnpm install --frozen-lockfile --filter @bigmarket/api-v1...

RUN pnpm --filter @bigmarket/bm-types run build \
	&& pnpm --filter @bigmarket/sip18-forum-types run build \
	&& pnpm --filter @bigmarket/bm-utilities run build \
	&& pnpm --filter @bigmarket/sdk run build

# Match package.json build variants (NODE_ENV affects compile-time env where used)
RUN if [ "$NODE_ENV" = "mainnet" ]; then \
		pnpm --filter @bigmarket/api-v1 run build:mainnet; \
	elif [ "$NODE_ENV" = "testnet" ]; then \
		pnpm --filter @bigmarket/api-v1 run build:testnet; \
	else \
		pnpm --filter @bigmarket/api-v1 run build; \
	fi

ARG PORT=6090
ENV PORT=${PORT}

WORKDIR /repo/apps/api-v1

EXPOSE ${PORT}

CMD ["node", "dist/app.js"]
