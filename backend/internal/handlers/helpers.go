package handlers

import (
	"crypto/rand"
	"errors"
	"fmt"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"enznrinn/backend/internal/apperr"
)

func uuid() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		panic(err)
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

func pathInt(c *gin.Context, key string) (int, bool) {
	n, err := strconv.Atoi(c.Param(key))
	if err != nil || n <= 0 {
		apperr.Validation("ID tidak valid.").Abort(c)
		return 0, false
	}
	return n, true
}

// bindError maps Gin binding/validation failures to VALIDATION_ERROR.
func bindError(err error) *apperr.AppError {
	var verrs validator.ValidationErrors
	if errors.As(err, &verrs) && len(verrs) > 0 {
		return apperr.Validation("Data tidak valid: " + verrs[0].Field())
	}
	return apperr.Validation("Request tidak valid.")
}

// userIDForName resolves the legacy user-name field to a users.id (0 = unassigned).
func (h *Handler) userIDForName(c *gin.Context, name string) (int, error) {
	if name == "" {
		return 0, nil
	}
	users, err := h.svc.ListUsers(c.Request.Context())
	if err != nil {
		return 0, err
	}
	for _, u := range users {
		if u.Name == name {
			return u.ID, nil
		}
	}
	return 0, apperr.Validation("User tidak ditemukan.")
}
