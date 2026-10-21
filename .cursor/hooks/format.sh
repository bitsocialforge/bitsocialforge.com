#!/bin/bash

repo_root="$(cd "$(dirname "$0")/../.." && pwd -P)" || exit 1
exec node --experimental-strip-types --disable-warning=ExperimentalWarning "$repo_root/scripts/agent-hooks/format.mts"
