package config

import (
	"log"
)

type Config struct {
	DatabaseURL string
	Port        string
	CORSOrigins string // comma-separated, "*" allows all
}

func Load() Config {
	cfg := Config{
		DatabaseURL: Get("DATABASE_URL"),
		Port:        Get("PORT"),
		CORSOrigins: Get("CORS_ORIGINS"),
	}
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if cfg.CORSOrigins == "" {
		cfg.CORSOrigins = "*"
	}
	return cfg
}
