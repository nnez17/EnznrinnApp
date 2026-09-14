package config

import (
	"bufio"
	"os"
	"strings"
)

// Get reads an env var, falling back to the repo-root .env file (for `npm run
// db:migrate` / bare `go run`). Quoted values are unwrapped; '&' stays literal.
func Get(key string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	f, err := os.Open(findDotEnv())
	if err != nil {
		return ""
	}
	defer f.Close()
	s := bufio.NewScanner(f)
	for s.Scan() {
		line := strings.TrimSpace(s.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		k, v, ok := strings.Cut(line, "=")
		if !ok || strings.TrimSpace(k) != key {
			continue
		}
		v = strings.TrimSpace(v)
		v = strings.Trim(v, `"'`)
		return v
	}
	return ""
}

func findDotEnv() string {
	for _, p := range []string{"../../.env", "../.env", ".env"} {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ".env"
}
