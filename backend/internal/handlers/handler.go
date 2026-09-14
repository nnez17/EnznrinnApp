package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"enznrinn/backend/internal/apperr"
	"enznrinn/backend/internal/models"
	"enznrinn/backend/internal/services"
)

type Handler struct{ svc *services.Service }

func New(svc *services.Service) *Handler { return &Handler{svc: svc} }

func fail(c *gin.Context, err error) { apperr.Fail(c, err) }

// ── DTOs ──

type txDTO struct {
	// User is the display name (Noval/Kharin) — no auth, resolved to users.id server-side.
	User            string    `json:"user" binding:"required"`
	Type            string    `json:"type" binding:"required,oneof=income expense"`
	Amount          int64     `json:"amount" binding:"required,gt=0"`
	Note            string    `json:"note"`
	TransactionDate time.Time `json:"transactionDate"`
}

type txUpdateDTO struct {
	User            *string    `json:"user"`
	Type            *string    `json:"type" binding:"omitempty,oneof=income expense"`
	Amount          *int64     `json:"amount" binding:"omitempty,gt=0"`
	Note            *string    `json:"note"`
	TransactionDate *time.Time `json:"transactionDate"`
}

type targetDTO struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	TargetAmount int64     `json:"targetAmount" binding:"required,gt=0"`
	Deadline     time.Time `json:"deadline" binding:"required"`
}

type targetUpdateDTO struct {
	TargetAmount *int64     `json:"targetAmount" binding:"omitempty,gt=0"`
	Deadline     *time.Time `json:"deadline"`
}

type wishlistDTO struct {
	ID         string `json:"id"`
	Name       string `json:"name" binding:"required"`
	Price      *int64 `json:"price" binding:"omitempty,gte=0"`
	Priority   string `json:"priority" binding:"required,oneof=low medium high"`
	Notes      string `json:"notes"`
	IsAchieved bool   `json:"isAchieved"`
	User       string `json:"user" binding:"required,oneof=Noval Kharin"`
}

type wishlistUpdateDTO struct {
	Name       *string `json:"name"`
	Price      *int64  `json:"price" binding:"omitempty,gte=0"`
	Priority   *string `json:"priority" binding:"omitempty,oneof=low medium high"`
	Notes      *string `json:"notes"`
	IsAchieved *bool   `json:"isAchieved"`
}

type diaryDTO struct {
	Date    time.Time `json:"date" binding:"required"`
	Content string    `json:"content" binding:"required"`
	Mood    string    `json:"mood"`
	User    string    `json:"user" binding:"required,oneof=Noval Kharin"`
}

type diaryUpdateDTO struct {
	Content *string `json:"content"`
	Mood    *string `json:"mood"`
}

type cycleDTO struct {
	LastPeriodStart string `json:"lastPeriodStart" binding:"required"`
	CycleLength     int    `json:"cycleLength" binding:"required,gte=21,lte=35"`
	PeriodDuration  int    `json:"periodDuration" binding:"required,gte=2,lte=10"`
}

// ── Users ──

func (h *Handler) ListUsers(c *gin.Context) {
	users, err := h.svc.ListUsers(c.Request.Context())
	if err != nil {
		fail(c, err)
		return
	}
	if users == nil {
		users = []models.User{}
	}
	c.JSON(http.StatusOK, users)
}

func (h *Handler) GetUser(c *gin.Context) {
	id, ok := pathInt(c, "id")
	if !ok {
		return
	}
	u, err := h.svc.GetUser(c.Request.Context(), id)
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, u)
}

// ── Transactions ──

func (h *Handler) ListTransactions(c *gin.Context) {
	txs, err := h.svc.ListTransactions(c.Request.Context())
	if err != nil {
		fail(c, err)
		return
	}
	if txs == nil {
		txs = []models.Transaction{}
	}
	c.JSON(http.StatusOK, txs)
}

func (h *Handler) CreateTransaction(c *gin.Context) {
	var dto txDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		fail(c, bindError(err))
		return
	}
	userID, err := h.userIDForName(c, dto.User)
	if err != nil {
		fail(c, err)
		return
	}
	t, err := h.svc.CreateTransaction(c.Request.Context(), models.Transaction{
		ID:     uuid(),
		UserID: userID,
		Type:   dto.Type,
		Amount: dto.Amount,
		Note:   dto.Note,
		Date:   dto.TransactionDate,
	})
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusCreated, t)
}

func (h *Handler) GetTransaction(c *gin.Context) {
	t, err := h.svc.GetTransaction(c.Request.Context(), c.Param("id"))
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, t)
}

func (h *Handler) UpdateTransaction(c *gin.Context) {
	var dto txUpdateDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		fail(c, bindError(err))
		return
	}
	var updUserID *int
	if dto.User != nil {
		id, err := h.userIDForName(c, *dto.User)
		if err != nil {
			fail(c, err)
			return
		}
		updUserID = &id
	}
	if err := h.svc.UpdateTransaction(c.Request.Context(), c.Param("id"), models.TransactionUpdate{
		UserID: updUserID, Type: dto.Type, Amount: dto.Amount, Note: dto.Note, Date: dto.TransactionDate,
	}); err != nil {
		fail(c, err)
		return
	}
	t, err := h.svc.GetTransaction(c.Request.Context(), c.Param("id"))
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, t)
}

func (h *Handler) DeleteTransaction(c *gin.Context) {
	if err := h.svc.DeleteTransaction(c.Request.Context(), c.Param("id")); err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": c.Param("id")})
}

// ── Balance ──

func (h *Handler) GetBalance(c *gin.Context) {
	b, err := h.svc.GetBalance(c.Request.Context())
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, b)
}

// ── Targets ──

func (h *Handler) ListTargets(c *gin.Context) {
	tg, err := h.svc.ListTargets(c.Request.Context())
	if err != nil {
		fail(c, err)
		return
	}
	if tg == nil {
		tg = []models.Target{}
	}
	c.JSON(http.StatusOK, tg)
}

func (h *Handler) CreateTarget(c *gin.Context) {
	var dto targetDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		fail(c, bindError(err))
		return
	}
	id := dto.ID
	if id == "" {
		id = uuid()
	}
	t, err := h.svc.CreateTarget(c.Request.Context(), models.Target{
		ID: id, Name: dto.Name, TargetAmount: dto.TargetAmount, Deadline: dto.Deadline,
	})
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusCreated, t)
}

func (h *Handler) GetTarget(c *gin.Context) {
	t, err := h.svc.GetTarget(c.Request.Context(), c.Param("id"))
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, t)
}

func (h *Handler) UpdateTarget(c *gin.Context) {
	var dto targetUpdateDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		fail(c, bindError(err))
		return
	}
	if err := h.svc.UpdateTarget(c.Request.Context(), c.Param("id"), models.TargetUpdate{
		TargetAmount: dto.TargetAmount, Deadline: dto.Deadline,
	}); err != nil {
		fail(c, err)
		return
	}
	t, err := h.svc.GetTarget(c.Request.Context(), c.Param("id"))
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, t)
}

func (h *Handler) DeleteTarget(c *gin.Context) {
	if err := h.svc.DeleteTarget(c.Request.Context(), c.Param("id")); err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": c.Param("id")})
}

// ── Wishlist ──

func (h *Handler) ListWishlist(c *gin.Context) {
	out, err := h.svc.ListWishlist(c.Request.Context())
	if err != nil {
		fail(c, err)
		return
	}
	if out == nil {
		out = []models.WishlistItem{}
	}
	c.JSON(http.StatusOK, out)
}

func (h *Handler) CreateWishlist(c *gin.Context) {
	var dto wishlistDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		fail(c, bindError(err))
		return
	}
	userID, err := h.userIDForName(c, dto.User)
	if err != nil {
		fail(c, err)
		return
	}
	id := dto.ID
	if id == "" {
		id = uuid()
	}
	w := models.WishlistItem{
		ID: id, UserID: userID, Name: dto.Name, Price: dto.Price,
		Priority: dto.Priority, Notes: dto.Notes, IsAchieved: dto.IsAchieved,
	}
	saved, err := h.svc.CreateWishlist(c.Request.Context(), w)
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusCreated, saved)
}

func (h *Handler) UpdateWishlist(c *gin.Context) {
	var dto wishlistUpdateDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		fail(c, bindError(err))
		return
	}
	saved, err := h.svc.UpdateWishlist(c.Request.Context(), c.Param("id"), models.WishlistUpdate(dto))
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, saved)
}

func (h *Handler) DeleteWishlist(c *gin.Context) {
	if err := h.svc.DeleteWishlist(c.Request.Context(), c.Param("id")); err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": c.Param("id")})
}

// ── Diary ──

func (h *Handler) ListDiary(c *gin.Context) {
	out, err := h.svc.ListDiary(c.Request.Context())
	if err != nil {
		fail(c, err)
		return
	}
	if out == nil {
		out = []models.DiaryEntry{}
	}
	c.JSON(http.StatusOK, out)
}

func (h *Handler) CreateDiary(c *gin.Context) {
	var dto diaryDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		fail(c, bindError(err))
		return
	}
	userID, err := h.userIDForName(c, dto.User)
	if err != nil {
		fail(c, err)
		return
	}
	d := models.DiaryEntry{ID: uuid(), UserID: userID, Date: dto.Date, Content: dto.Content, Mood: dto.Mood}
	saved, updated, err := h.svc.SaveDiary(c.Request.Context(), d)
	if err != nil {
		fail(c, err)
		return
	}
	if updated {
		c.JSON(http.StatusOK, saved)
		return
	}
	c.JSON(http.StatusCreated, saved)
}

func (h *Handler) UpdateDiary(c *gin.Context) {
	var dto diaryUpdateDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		fail(c, bindError(err))
		return
	}
	saved, err := h.svc.UpdateDiary(c.Request.Context(), c.Param("id"), models.DiaryUpdate(dto))
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, saved)
}

func (h *Handler) DeleteDiary(c *gin.Context) {
	if err := h.svc.DeleteDiary(c.Request.Context(), c.Param("id")); err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": c.Param("id")})
}

// ── Cycle ──

func (h *Handler) GetCycle(c *gin.Context) {
	cd, err := h.svc.LoadCycle(c.Request.Context())
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, cd) // null when unset — matches current app behavior
}

func (h *Handler) SaveCycle(c *gin.Context) {
	var dto cycleDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		fail(c, bindError(err))
		return
	}
	if err := h.svc.SaveCycle(c.Request.Context(), models.CycleData(dto)); err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, dto)
}
