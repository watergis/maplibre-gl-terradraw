#!/usr/bin/env bash

set -eo pipefail

# when in a VS Code or GitHub Codespaces devcontainer
if [ -n "${REMOTE_CONTAINERS}" ] || [ -n "${CODESPACES}" ]; then
    # install dependencies
    pnpm install --frozen-lockfile
fi