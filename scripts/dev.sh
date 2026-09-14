#!/bin/sh
# Dev: load .env (value-safe line parsing — no shell eval, so '&' in URLs is fine),
# run Go API in background, Expo in foreground. Ctrl+C stops both.
set -e
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in ''|'#'*) continue ;; esac
    case "$line" in *=*) ;; *) continue ;; esac
    key=${line%%=*}
    val=${line#*=}
    # strip surrounding quotes if present
    val=${val%\"}; val=${val#\"}
    val=${val%\'}; val=${val#\'}
    export "$key=$val"
  done < .env
fi


go -C backend run ./cmd/server &
GO_PID=$!
trap 'kill $GO_PID 2>/dev/null' EXIT INT TERM

npx expo start "$@"
