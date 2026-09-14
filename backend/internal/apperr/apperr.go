package apperr

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Stable API error codes (PRD §28). Raw DB errors are never exposed.
const (
	CodeValidation      = "VALIDATION_ERROR"
	CodeNotFound        = "NOT_FOUND"
	CodeInsufficientBal = "INSUFFICIENT_BALANCE"
	CodeDatabase        = "DATABASE_ERROR"
	CodeUnauthorized    = "UNAUTHORIZED"
	CodeInternal        = "INTERNAL_ERROR"
)

type AppError struct {
	Status  int
	Code    string
	Message string
}

func (e *AppError) Error() string { return e.Code + ": " + e.Message }

// Abort writes the standard error envelope and stops the chain.
func (e *AppError) Abort(c *gin.Context) {
	c.AbortWithStatusJSON(e.Status, gin.H{"error": gin.H{"code": e.Code, "message": e.Message}})
}

func New(status int, code, msg string) *AppError {
	return &AppError{Status: status, Code: code, Message: msg}
}

func NotFound() *AppError             { return New(http.StatusNotFound, CodeNotFound, "Data tidak ditemukan.") }
func Validation(msg string) *AppError { return New(http.StatusBadRequest, CodeValidation, msg) }
func InsufficientBalance() *AppError {
	return New(http.StatusBadRequest, CodeInsufficientBal, "Saldo tidak mencukupi.")
}
func Database() *AppError {
	return New(http.StatusInternalServerError, CodeDatabase, "Terjadi kesalahan pada server.")
}

// Fail writes {"error":{"code","message"}}. Unrecognized errors log as internal
// and return a generic message so PostgreSQL details never reach the client.
func Fail(c *gin.Context, err error) {
	var ae *AppError
	if !errors.As(err, &ae) {
		log.Printf("internal error: %v", err)
		ae = New(http.StatusInternalServerError, CodeInternal, "Terjadi kesalahan pada server.")
	}
	c.AbortWithStatusJSON(ae.Status, gin.H{"error": gin.H{"code": ae.Code, "message": ae.Message}})
}
