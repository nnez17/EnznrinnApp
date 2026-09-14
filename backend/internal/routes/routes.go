package routes

import (
	"embed"
	"net/http"

	"github.com/gin-gonic/gin"

	"enznrinn/backend/internal/config"
	"enznrinn/backend/internal/handlers"
	"enznrinn/backend/internal/middleware"
)

//go:embed openapi.yaml
var specs embed.FS

const docsHTML = `<!doctype html><html><head><title>enznrinn API</title><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0"><script id="api-reference" data-url="/openapi.yaml" data-configuration='{"theme":"saturn","customCss":":root{--scalar-color-accent:#FC809F;--scalar-color-link:#007AFF;--scalar-radius:12px}.t-docs-sidebar,._sidebar,.scalar-api-reference{font-family:ui-sans-serif,-apple-system,Segoe UI,Roboto,sans-serif}"}'></script><script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script></body></html>`

func Register(r *gin.Engine, cfg config.Config, h *handlers.Handler) {
	r.Use(middleware.Recover(), middleware.Logger(), middleware.CORS(cfg.CORSOrigins),
		middleware.SecurityHeaders(), middleware.BodyLimit(1<<20))

	api := r.Group("/api/v1")
	{
		api.GET("/users", h.ListUsers)
		api.GET("/users/:id", h.GetUser)

		api.GET("/transactions", h.ListTransactions)
		api.POST("/transactions", h.CreateTransaction)
		api.GET("/transactions/:id", h.GetTransaction)
		api.PUT("/transactions/:id", h.UpdateTransaction)
		api.DELETE("/transactions/:id", h.DeleteTransaction)

		api.GET("/balance", h.GetBalance)

		api.GET("/targets", h.ListTargets)
		api.POST("/targets", h.CreateTarget)
		api.GET("/targets/:id", h.GetTarget)
		api.PUT("/targets/:id", h.UpdateTarget)
		api.DELETE("/targets/:id", h.DeleteTarget)

		// Extended data from the current app (wishlist, diary, cycle) — same
		// Firestore replacement, kept out of the PRD's core list but needed
		// to preserve existing features (PRD §2 "preserve all user-facing features").
		api.GET("/wishlist", h.ListWishlist)
		api.POST("/wishlist", h.CreateWishlist)
		api.PUT("/wishlist/:id", h.UpdateWishlist)
		api.DELETE("/wishlist/:id", h.DeleteWishlist)

		api.GET("/diary", h.ListDiary)
		api.POST("/diary", h.CreateDiary)
		api.PUT("/diary/:id", h.UpdateDiary)
		api.DELETE("/diary/:id", h.DeleteDiary)

		api.GET("/cycle", h.GetCycle)
		api.PUT("/cycle", h.SaveCycle)
	}

	r.GET("/healthz", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })

	// API playground (Scalar) — try every endpoint in the browser at /docs
	spec, _ := specs.ReadFile("openapi.yaml")
	r.GET("/openapi.yaml", func(c *gin.Context) {
		c.Data(http.StatusOK, "application/yaml", spec)
	})
	r.GET("/docs", func(c *gin.Context) {
		// data-configuration values: customCss wins over the preset theme.
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(docsHTML))
	})
}
