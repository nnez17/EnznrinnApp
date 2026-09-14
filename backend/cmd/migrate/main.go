package main

// Applies database/migrations/*.sql in order, tracked in schema_migrations.
// No psql needed: npm run db:migrate (or go -C backend run ./cmd/migrate)

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5"

	"enznrinn/backend/internal/config"
)

func main() {
	url := config.Get("DATABASE_URL")
	if url == "" {
		fmt.Fprintln(os.Stderr, "DATABASE_URL is not set (export it or put it in .env)")
		os.Exit(1)
	}

	ctx := context.Background()
	conn, err := pgx.Connect(ctx, url)
	if err != nil {
		fmt.Fprintln(os.Stderr, "connect:", err)
		os.Exit(1)
	}
	defer conn.Close(ctx)

	if _, err := conn.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`); err != nil {
		fmt.Fprintln(os.Stderr, "create table:", err)
		os.Exit(1)
	}

	var dir string
	for _, cand := range []string{"database/migrations", "../database/migrations", "../../database/migrations"} {
		if _, err := os.Stat(cand); err == nil {
			dir = cand
			break
		}
	}
	if dir == "" {
		fmt.Fprintln(os.Stderr, "database/migrations not found")
		os.Exit(1)
	}
	files, _ := filepath.Glob(filepath.Join(dir, "*.sql"))
	sort.Strings(files)

	applied := 0
	for _, f := range files {
		ver := filepath.Base(f)
		var exists bool
		if err := conn.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version=$1)`, ver).Scan(&exists); err != nil {
			fmt.Fprintln(os.Stderr, "check:", err)
			os.Exit(1)
		}
		if exists {
			fmt.Println("skip", ver)
			continue
		}

		sqlBytes, err := os.ReadFile(f)
		if err != nil {
			fmt.Fprintln(os.Stderr, "read:", err)
			os.Exit(1)
		}
		// Drizzle style: statements separated by --> statement-breakpoint
		for _, stmt := range strings.Split(string(sqlBytes), "--> statement-breakpoint") {
			stmt = strings.TrimSpace(stmt)
			if stmt == "" {
				continue
			}
			if _, err := conn.Exec(ctx, stmt); err != nil {
				fmt.Fprintf(os.Stderr, "apply %s: %v\n", ver, err)
				os.Exit(1)
			}
		}
		if _, err := conn.Exec(ctx, `INSERT INTO schema_migrations (version) VALUES ($1)`, ver); err != nil {
			fmt.Fprintln(os.Stderr, "track:", err)
			os.Exit(1)
		}
		fmt.Println("applied", ver)
		applied++
	}
	fmt.Printf("done — %d migration(s) applied\n", applied)
}
