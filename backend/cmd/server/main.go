package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"enznrinn/backend/internal/config"
	"enznrinn/backend/internal/database"
	"enznrinn/backend/internal/handlers"
	"enznrinn/backend/internal/repositories"
	"enznrinn/backend/internal/routes"
	"enznrinn/backend/internal/services"
)

func main() {
	cfg := config.Load()

	pool, err := database.Connect(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}
	defer pool.Close()

	r := gin.New() // Register adds recovery + logging middleware
	// No proxy assumed: ClientIP is unused, and trusting forwarded headers would
	// only enable spoofing. Set TRUSTED_PROXIES (comma list) behind a CDN/LB.
	r.SetTrustedProxies(splitList(os.Getenv("TRUSTED_PROXIES")))
	routes.Register(r, cfg, handlers.New(services.New(repositories.New(pool))))

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second, // Slowloris guard
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
	}

	go func() {
		log.Printf("listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("shutdown: %v", err)
	}
}

func splitList(s string) []string {
	var out []string
	for _, p := range strings.Split(s, ",") {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
