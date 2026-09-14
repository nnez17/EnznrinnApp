package services

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"

	"enznrinn/backend/internal/apperr"
	"enznrinn/backend/internal/models"
	"enznrinn/backend/internal/repositories"
)

type Service struct{ repo *repositories.Repo }

func New(repo *repositories.Repo) *Service { return &Service{repo: repo} }

// ── Transactions ──

var txTypes = map[string]bool{"income": true, "expense": true}

func validateTx(t *models.Transaction) error {
	if !txTypes[t.Type] {
		return apperr.Validation("Tipe transaksi tidak valid.")
	}
	if t.Amount <= 0 {
		return apperr.Validation("Jumlah harus lebih dari 0.")
	}
	if t.Date.IsZero() {
		t.Date = time.Now().UTC()
	}
	return nil
}

func (s *Service) ListTransactions(ctx context.Context) ([]models.Transaction, error) {
	out, err := s.repo.ListTransactions(ctx)
	if err != nil {
		return nil, apperr.Database()
	}
	return out, nil
}

func (s *Service) GetTransaction(ctx context.Context, id string) (models.Transaction, error) {
	t, err := s.repo.GetTransaction(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return t, apperr.NotFound()
	}
	if err != nil {
		return t, apperr.Database()
	}
	return t, nil
}

func (s *Service) CreateTransaction(ctx context.Context, t models.Transaction) (models.Transaction, error) {
	if err := validateTx(&t); err != nil {
		return t, err
	}
	if t.UserID == 0 {
		return t, apperr.Validation("User wajib diisi.")
	}
	ok, err := s.repo.UserExists(ctx, t.UserID)
	if err != nil {
		return t, apperr.Database()
	}
	if !ok {
		return t, apperr.Validation("User tidak ditemukan.")
	}

	if t.Type == "expense" {
		// Authoritative balance check server-side (PRD §19), race-safe.
		err = s.repo.InsertExpenseWithBalanceCheck(ctx, t)
		if errors.Is(err, repositories.ErrInsufficientBalance) {
			return t, apperr.InsufficientBalance()
		}
	} else {
		err = s.repo.InsertTransaction(ctx, t)
	}
	if err != nil && !errors.Is(err, repositories.ErrInsufficientBalance) {
		return t, apperr.Database()
	}
	created, err := s.repo.GetTransaction(ctx, t.ID)
	if err != nil {
		return t, apperr.Database()
	}
	return created, nil
}

func (s *Service) UpdateTransaction(ctx context.Context, id string, u models.TransactionUpdate) error {
	if u.Type != nil && !txTypes[*u.Type] {
		return apperr.Validation("Tipe transaksi tidak valid.")
	}
	if u.Amount != nil && *u.Amount <= 0 {
		return apperr.Validation("Jumlah harus lebih dari 0.")
	}
	if u.UserID != nil && *u.UserID != 0 {
		ok, err := s.repo.UserExists(ctx, *u.UserID)
		if err != nil {
			return apperr.Database()
		}
		if !ok {
			return apperr.Validation("User tidak ditemukan.")
		}
	}
	// Balance rule for expenses is re-checked race-safely inside the repo write.
	err := s.repo.UpdateTransaction(ctx, id, u)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperr.NotFound()
	}
	if errors.Is(err, repositories.ErrInsufficientBalance) {
		return apperr.InsufficientBalance()
	}
	if err != nil {
		return apperr.Database()
	}
	return nil
}

func (s *Service) DeleteTransaction(ctx context.Context, id string) error {
	err := s.repo.DeleteTransaction(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperr.NotFound()
	}
	if err != nil {
		return apperr.Database()
	}
	return nil
}
