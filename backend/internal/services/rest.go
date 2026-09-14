package services

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"

	"enznrinn/backend/internal/apperr"
	"enznrinn/backend/internal/models"
)

// ── Targets ──

func (s *Service) CreateTarget(ctx context.Context, t models.Target) (models.Target, error) {
	if t.TargetAmount <= 0 {
		return t, apperr.Validation("Target amount harus lebih dari 0.")
	}
	if t.Deadline.IsZero() {
		return t, apperr.Validation("Deadline wajib diisi.")
	}
	if err := s.repo.UpsertTarget(ctx, t); err != nil {
		return t, apperr.Database()
	}
	return s.GetTarget(ctx, t.ID)
}

func (s *Service) GetTarget(ctx context.Context, id string) (models.Target, error) {
	bal, err := s.repo.GetBalance(ctx)
	if err != nil {
		return models.Target{}, apperr.Database()
	}
	t, err := s.repo.GetTarget(ctx, id, bal.Balance)
	if errors.Is(err, pgx.ErrNoRows) {
		return t, apperr.NotFound()
	}
	if err != nil {
		return t, apperr.Database()
	}
	return t, nil
}

func (s *Service) ListTargets(ctx context.Context) ([]models.Target, error) {
	bal, err := s.repo.GetBalance(ctx)
	if err != nil {
		return nil, apperr.Database()
	}
	out, err := s.repo.ListTargets(ctx, bal.Balance)
	if err != nil {
		return nil, apperr.Database()
	}
	return out, nil
}

func (s *Service) UpdateTarget(ctx context.Context, id string, u models.TargetUpdate) error {
	if u.TargetAmount != nil && *u.TargetAmount <= 0 {
		return apperr.Validation("Target amount harus lebih dari 0.")
	}
	err := s.repo.UpdateTarget(ctx, id, u)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperr.NotFound()
	}
	if err != nil {
		return apperr.Database()
	}
	return nil
}

func (s *Service) DeleteTarget(ctx context.Context, id string) error {
	err := s.repo.DeleteTarget(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperr.NotFound()
	}
	if err != nil {
		return apperr.Database()
	}
	return nil
}

// ── Balance / users passthrough ──

func (s *Service) GetBalance(ctx context.Context) (models.Balance, error) {
	b, err := s.repo.GetBalance(ctx)
	if err != nil {
		return b, apperr.Database()
	}
	return b, nil
}

func (s *Service) ListUsers(ctx context.Context) ([]models.User, error) {
	out, err := s.repo.ListUsers(ctx)
	if err != nil {
		return nil, apperr.Database()
	}
	return out, nil
}

func (s *Service) GetUser(ctx context.Context, id int) (models.User, error) {
	u, err := s.repo.GetUser(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return u, apperr.NotFound()
	}
	if err != nil {
		return u, apperr.Database()
	}
	return u, nil
}

// ── Wishlist ──

var priorities = map[string]bool{"low": true, "medium": true, "high": true}

func (s *Service) ListWishlist(ctx context.Context) ([]models.WishlistItem, error) {
	out, err := s.repo.ListWishlist(ctx)
	if err != nil {
		return nil, apperr.Database()
	}
	return out, nil
}

func (s *Service) CreateWishlist(ctx context.Context, w models.WishlistItem) (models.WishlistItem, error) {
	if w.Name == "" {
		return w, apperr.Validation("Nama wajib diisi.")
	}
	if !priorities[w.Priority] {
		return w, apperr.Validation("Prioritas tidak valid.")
	}
	if w.Price != nil && *w.Price < 0 {
		return w, apperr.Validation("Budget tidak valid.")
	}
	if err := s.repo.InsertWishlist(ctx, w); err != nil {
		return w, apperr.Database()
	}
	out, err := s.repo.GetWishlist(ctx, w.ID)
	if err != nil {
		return w, apperr.Database()
	}
	return out, nil
}

func (s *Service) UpdateWishlist(ctx context.Context, id string, u models.WishlistUpdate) (models.WishlistItem, error) {
	if u.Priority != nil && !priorities[*u.Priority] {
		return models.WishlistItem{}, apperr.Validation("Prioritas tidak valid.")
	}
	err := s.repo.UpdateWishlist(ctx, id, u)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.WishlistItem{}, apperr.NotFound()
	}
	if err != nil {
		return models.WishlistItem{}, apperr.Database()
	}
	out, err := s.repo.GetWishlist(ctx, id)
	if err != nil {
		return models.WishlistItem{}, apperr.Database()
	}
	return out, nil
}

func (s *Service) DeleteWishlist(ctx context.Context, id string) error {
	err := s.repo.DeleteWishlist(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperr.NotFound()
	}
	if err != nil {
		return apperr.Database()
	}
	return nil
}

// ── Diary ──

func (s *Service) ListDiary(ctx context.Context) ([]models.DiaryEntry, error) {
	out, err := s.repo.ListDiary(ctx)
	if err != nil {
		return nil, apperr.Database()
	}
	return out, nil
}

// SaveDiary implements the existing one-entry-per-day rule: same date → update.
func (s *Service) SaveDiary(ctx context.Context, d models.DiaryEntry) (models.DiaryEntry, bool, error) {
	if d.Content == "" {
		return d, false, apperr.Validation("Isi jurnal wajib diisi.")
	}
	if d.Date.IsZero() {
		d.Date = time.Now().UTC()
	}
	updated := false
	if id, found, err := s.repo.FindDiaryByDate(ctx, d.Date); err != nil {
		return d, false, apperr.Database()
	} else if found {
		u := models.DiaryUpdate{Content: &d.Content}
		if d.Mood != "" {
			u.Mood = &d.Mood
		}
		if err := s.repo.UpdateDiary(ctx, id, u); err != nil {
			return d, false, apperr.Database()
		}
		d.ID = id
		updated = true
	} else if err := s.repo.InsertDiary(ctx, d); err != nil {
		return d, false, apperr.Database()
	}
	saved, err := s.repo.GetDiary(ctx, d.ID)
	if err != nil {
		return d, updated, apperr.Database()
	}
	return saved, updated, nil
}

func (s *Service) UpdateDiary(ctx context.Context, id string, u models.DiaryUpdate) (models.DiaryEntry, error) {
	err := s.repo.UpdateDiary(ctx, id, u)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.DiaryEntry{}, apperr.NotFound()
	}
	if err != nil {
		return models.DiaryEntry{}, apperr.Database()
	}
	out, err := s.repo.GetDiary(ctx, id)
	if err != nil {
		return models.DiaryEntry{}, apperr.Database()
	}
	return out, nil
}

func (s *Service) DeleteDiary(ctx context.Context, id string) error {
	err := s.repo.DeleteDiary(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperr.NotFound()
	}
	if err != nil {
		return apperr.Database()
	}
	return nil
}

// ── Cycle ──

func (s *Service) LoadCycle(ctx context.Context) (*models.CycleData, error) {
	c, err := s.repo.LoadCycle(ctx)
	if err != nil {
		return nil, apperr.Database()
	}
	return c, nil
}

func (s *Service) SaveCycle(ctx context.Context, c models.CycleData) error {
	if c.LastPeriodStart == "" {
		return apperr.Validation("Tanggal HPHT wajib diisi.")
	}
	if c.CycleLength < 21 || c.CycleLength > 35 {
		return apperr.Validation("Panjang siklus harus 21-35 hari.")
	}
	if c.PeriodDuration < 2 || c.PeriodDuration > 10 {
		return apperr.Validation("Durasi haid harus 2-10 hari.")
	}
	if err := s.repo.SaveCycle(ctx, c); err != nil {
		return apperr.Database()
	}
	return nil
}
