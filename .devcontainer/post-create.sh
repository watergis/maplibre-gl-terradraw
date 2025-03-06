#!/usr/bin/env bash

set -eo pipefail

# when in a VS Code or GitHub Codespaces devcontainer
if [ -n "${REMOTE_CONTAINERS}" ] || [ -n "${CODESPACES}" ]; then
    npm install -g npm-check-updates
    npm install -g pnpm
    # install dependencies
    pnpm install --frozen-lockfile
fi