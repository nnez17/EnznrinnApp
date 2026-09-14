package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"enznrinn/backend/internal/models"
)

type Repo struct{ pool *pgxpool.Pool }

func New(pool *pgxpool.Pool) *Repo { return &Repo{pool: pool} }

// ── Users ──

func (r *Repo) ListUsers(ctx context.Context) ([]models.User, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, name, created_at, updated_at FROM users ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Name, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

func (r *Repo) UserExists(ctx context.Context, id int) (bool, error) {
	var ok bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)`, id).Scan(&ok)
	return ok, err
}

func (r *Repo) GetUser(ctx context.Context, id int) (models.User, error) {
	var u models.User
	err := r.pool.QueryRow(ctx,
		`SELECT id, name, created_at, updated_at FROM users WHERE id = $1`, id).
		Scan(&u.ID, &u.Name, &u.CreatedAt, &u.UpdatedAt)
	return u, err
}

// ── Transactions ──
// Running balance is derived with a window function — never stored (PRD §10, §22).

const txSelect = `
SELECT t.id, t.user_id, u.name, t.type, t.amount, t.note, t.transaction_date,
       SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END)
         OVER (ORDER BY t.transaction_date, t.id) AS balance
FROM transactions t
LEFT JOIN users u ON u.id = t.user_id`

func scanTx(row pgx.Row) (models.Transaction, error) {
	var t models.Transaction
	var userID *int
	var userName *string
	err := row.Scan(&t.ID, &userID, &userName, &t.Type, &t.Amount, &t.Note, &t.Date, &t.Balance)
	if userID != nil {
		t.UserID = *userID
	}
	if userName != nil {
		t.User = *userName
	}
	return t, err
}

func (r *Repo) ListTransactions(ctx context.Context) ([]models.Transaction, error) {
	rows, err := r.pool.Query(ctx, txSelect+` ORDER BY t.transaction_date DESC, t.id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Transaction
	for rows.Next() {
		t, err := scanTx(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r *Repo) GetTransaction(ctx context.Context, id string) (models.Transaction, error) {
	return scanTx(r.pool.QueryRow(ctx, txSelect+` WHERE t.id = $1`, id))
}

func (r *Repo) InsertTransaction(ctx context.Context, t models.Transaction) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO transactions (id, user_id, type, amount, note, transaction_date)
		 VALUES ($1, NULLIF($2,0), $3, $4, $5, $6)`,
		t.ID, t.UserID, t.Type, t.Amount, t.Note, t.Date)
	return err
}

// UpdateTransaction patches only the target row (PRD §20) — no table rewrite.
// Balance rule for expenses is re-checked inside the same advisory-locked
// transaction as the write, so a concurrent expense can't slip between check
// and update (same guard as InsertExpenseWithBalanceCheck).
func (r *Repo) UpdateTransaction(ctx context.Context, id string, u models.TransactionUpdate) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(1)`); err != nil {
		return err
	}

	var curType string
	var curAmount int64
	if err := tx.QueryRow(ctx, `SELECT type, amount FROM transactions WHERE id = $1`, id).
		Scan(&curType, &curAmount); err != nil {
		return err // pgx.ErrNoRows → 404 upstream
	}

	newType, newAmount := curType, curAmount
	if u.Type != nil {
		newType = *u.Type
	}
	if u.Amount != nil {
		newAmount = *u.Amount
	}
	if newType == "expense" {
		var bal int64
		if err := tx.QueryRow(ctx,
			`SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) FROM transactions`,
		).Scan(&bal); err != nil {
			return err
		}
		signed := curAmount // balance excluding this row: remove its current contribution
		if curType == "expense" {
			signed = -curAmount
		}
		if newAmount > bal-signed {
			return ErrInsufficientBalance
		}
	}

	if _, err := tx.Exec(ctx,
		`UPDATE transactions SET
		   user_id = COALESCE(NULLIF($2, 0), user_id),
		   type    = COALESCE($3, type),
		   amount  = COALESCE($4, amount),
		   note    = COALESCE($5, note),
		   transaction_date = COALESCE($6, transaction_date),
		   updated_at = now()
		 WHERE id = $1`,
		id, derefInt(u.UserID), derefStr(u.Type), derefInt64(u.Amount), derefStr(u.Note), derefTime(u.Date)); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// DeleteTransaction removes exactly one row (PRD §21).
func (r *Repo) DeleteTransaction(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM transactions WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// ── Balance ──
// Single SQL aggregate; never loads all transactions into memory (PRD §22, §38).

func (r *Repo) GetBalance(ctx context.Context) (models.Balance, error) {
	var b models.Balance
	err := r.pool.QueryRow(ctx, `
SELECT
  COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0),
  COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0),
  COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0),
  COALESCE(SUM(CASE WHEN type='income' AND transaction_date::date = CURRENT_DATE THEN amount ELSE 0 END), 0),
  COALESCE(SUM(CASE WHEN type='expense' AND transaction_date::date = CURRENT_DATE THEN amount ELSE 0 END), 0)
FROM transactions`).Scan(&b.Balance, &b.TotalIncome, &b.TotalExpense, &b.TodayIncome, &b.TodayExpense)
	return b, err
}

// ── Expense race guard ──
// A transaction-scoped advisory lock serializes expense checks against concurrent
// writes so two expenses can't both pass the balance check.

func (r *Repo) InsertExpenseWithBalanceCheck(ctx context.Context, t models.Transaction) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(1)`); err != nil {
		return err
	}

	var bal int64
	if err := tx.QueryRow(ctx,
		`SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) FROM transactions`,
	).Scan(&bal); err != nil {
		return err
	}
	// Existing rule: reject only when expense strictly exceeds balance (PRD §19).
	if bal < t.Amount {
		return ErrInsufficientBalance
	}

	if _, err := tx.Exec(ctx,
		`INSERT INTO transactions (id, user_id, type, amount, note, transaction_date)
		 VALUES ($1, NULLIF($2,0), $3, $4, $5, $6)`,
		t.ID, t.UserID, t.Type, t.Amount, t.Note, t.Date); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

var ErrInsufficientBalance = errors.New("insufficient balance")

// ── Targets ──
// current_amount is NOT stored — derived from live balance (PRD §11, §23).

const targetSelect = `
SELECT tg.id, COALESCE(tg.name, ''), tg.target_amount, tg.deadline, tg.created_at, tg.updated_at
FROM targets tg`

func scanTarget(row pgx.Row) (models.Target, error) {
	var t models.Target
	err := row.Scan(&t.ID, &t.Name, &t.TargetAmount, &t.Deadline, &t.CreatedAt, &t.UpdatedAt)
	return t, err
}

func (r *Repo) ListTargets(ctx context.Context, currentBalance int64) ([]models.Target, error) {
	rows, err := r.pool.Query(ctx, targetSelect+` ORDER BY tg.created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Target
	for rows.Next() {
		t, err := scanTarget(rows)
		if err != nil {
			return nil, err
		}
		deriveProgress(&t, currentBalance)
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r *Repo) GetTarget(ctx context.Context, id string, currentBalance int64) (models.Target, error) {
	t, err := scanTarget(r.pool.QueryRow(ctx, targetSelect+` WHERE tg.id = $1`, id))
	if err != nil {
		return t, err
	}
	deriveProgress(&t, currentBalance)
	return t, nil
}

func deriveProgress(t *models.Target, balance int64) {
	t.CurrentAmount = balance
	if balance <= 0 {
		t.Progress = 0
	} else {
		t.Progress = float64(balance) / float64(t.TargetAmount) * 100
		if t.Progress > 100 {
			t.Progress = 100
		}
	}
}

func (r *Repo) UpsertTarget(ctx context.Context, t models.Target) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO targets (id, name, target_amount, deadline)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (id) DO UPDATE
		   SET name = EXCLUDED.name, target_amount = EXCLUDED.target_amount,
		       deadline = EXCLUDED.deadline, updated_at = now()`,
		t.ID, t.Name, t.TargetAmount, t.Deadline)
	return err
}

func (r *Repo) UpdateTarget(ctx context.Context, id string, u models.TargetUpdate) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE targets SET
		   target_amount = COALESCE($2, target_amount),
		   deadline      = COALESCE($3, deadline),
		   updated_at    = now()
		 WHERE id = $1`,
		id, derefInt64(u.TargetAmount), derefTime(u.Deadline))
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *Repo) DeleteTarget(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM targets WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// ── Wishlist ──

const wishlistSelect = `
SELECT w.id, w.user_id, u.name, w.name, w.price, w.priority, w.notes, w.is_achieved, w.created_at
FROM wishlist w
LEFT JOIN users u ON u.id = w.user_id`

func scanWishlist(row pgx.Row) (models.WishlistItem, error) {
	var (
		w      models.WishlistItem
		userID *int
		name   *string
		notes  *string
	)
	err := row.Scan(&w.ID, &userID, &name, &w.Name, &w.Price, &w.Priority, &notes, &w.IsAchieved, &w.CreatedAt)
	if userID != nil {
		w.UserID = *userID
	}
	if name != nil {
		w.User = *name
	}
	if notes != nil {
		w.Notes = *notes
	}
	return w, err
}

func (r *Repo) ListWishlist(ctx context.Context) ([]models.WishlistItem, error) {
	rows, err := r.pool.Query(ctx, wishlistSelect+` ORDER BY w.created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.WishlistItem
	for rows.Next() {
		w, err := scanWishlist(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, w)
	}
	return out, rows.Err()
}

func (r *Repo) GetWishlist(ctx context.Context, id string) (models.WishlistItem, error) {
	return scanWishlist(r.pool.QueryRow(ctx, wishlistSelect+` WHERE w.id = $1`, id))
}

func (r *Repo) InsertWishlist(ctx context.Context, w models.WishlistItem) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO wishlist (id, user_id, name, price, priority, notes, is_achieved)
		 VALUES ($1, NULLIF($2,0), $3, $4, $5, NULLIF($6,''), $7)`,
		w.ID, w.UserID, w.Name, w.Price, w.Priority, w.Notes, w.IsAchieved)
	return err
}

func (r *Repo) UpdateWishlist(ctx context.Context, id string, u models.WishlistUpdate) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE wishlist SET
		   name = COALESCE($2, name), price = COALESCE($3, price),
		   priority = COALESCE($4, priority), notes = COALESCE($5, notes),
		   is_achieved = COALESCE($6, is_achieved)
		 WHERE id = $1`,
		id, derefStr(u.Name), u.Price, derefStr(u.Priority), derefStr(u.Notes), u.IsAchieved)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *Repo) DeleteWishlist(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM wishlist WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// ── Diary ──

const diarySelect = `
SELECT d.id, d.user_id, u.name, d.date, d.content, COALESCE(d.mood,''), d.created_at, d.updated_at
FROM diary d
LEFT JOIN users u ON u.id = d.user_id`

func scanDiary(row pgx.Row) (models.DiaryEntry, error) {
	var (
		d      models.DiaryEntry
		userID *int
		name   *string
	)
	err := row.Scan(&d.ID, &userID, &name, &d.Date, &d.Content, &d.Mood, &d.CreatedAt, &d.UpdatedAt)
	if userID != nil {
		d.UserID = *userID
	}
	if name != nil {
		d.User = *name
	}
	return d, err
}

func (r *Repo) ListDiary(ctx context.Context) ([]models.DiaryEntry, error) {
	rows, err := r.pool.Query(ctx, diarySelect+` ORDER BY d.date DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.DiaryEntry
	for rows.Next() {
		d, err := scanDiary(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func (r *Repo) GetDiary(ctx context.Context, id string) (models.DiaryEntry, error) {
	return scanDiary(r.pool.QueryRow(ctx, diarySelect+` WHERE d.id = $1`, id))
}

func (r *Repo) InsertDiary(ctx context.Context, d models.DiaryEntry) error {
	// diary_date_day_uniq (one entry per day): a concurrent same-day insert races
	// the service's FindDiaryByDate check — upsert instead of 500 on conflict.
	_, err := r.pool.Exec(ctx,
		`INSERT INTO diary (id, user_id, date, content, mood)
		 VALUES ($1, NULLIF($2,0), $3, $4, NULLIF($5,''))
		 ON CONFLICT (CAST(date AT TIME ZONE 'UTC' AS date)) DO UPDATE
		   SET content = EXCLUDED.content, mood = EXCLUDED.mood, updated_at = now()`,
		d.ID, d.UserID, d.Date, d.Content, d.Mood)
	return err
}

func (r *Repo) UpdateDiary(ctx context.Context, id string, u models.DiaryUpdate) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE diary SET content = COALESCE($2, content), mood = COALESCE($3, mood), updated_at = now()
		 WHERE id = $1`,
		id, derefStr(u.Content), derefStr(u.Mood))
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// FindDiaryByDate supports the app's one-entry-per-day rule (update instead of insert).
// Expression must match diary_date_day_uniq exactly so the index is used.
func (r *Repo) FindDiaryByDate(ctx context.Context, date time.Time) (string, bool, error) {
	var id string
	err := r.pool.QueryRow(ctx,
		`SELECT id FROM diary WHERE CAST(date AT TIME ZONE 'UTC' AS date) = CAST($1 AT TIME ZONE 'UTC' AS date)`,
		date).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", false, nil
	}
	return id, err == nil, err
}

func (r *Repo) DeleteDiary(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM diary WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// ── Cycle (singleton row, id = 1) ──

func (r *Repo) LoadCycle(ctx context.Context) (*models.CycleData, error) {
	var c models.CycleData
	err := r.pool.QueryRow(ctx,
		`SELECT last_period_start, cycle_length, period_duration FROM cycle WHERE id = 1`).
		Scan(&c.LastPeriodStart, &c.CycleLength, &c.PeriodDuration)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *Repo) SaveCycle(ctx context.Context, c models.CycleData) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO cycle (id, last_period_start, cycle_length, period_duration)
		 VALUES (1, $1, $2, $3)
		 ON CONFLICT (id) DO UPDATE
		   SET last_period_start = EXCLUDED.last_period_start,
		       cycle_length = EXCLUDED.cycle_length,
		       period_duration = EXCLUDED.period_duration,
		       updated_at = now()`,
		c.LastPeriodStart, c.CycleLength, c.PeriodDuration)
	return err
}

// ── ptr helpers ──

func derefInt(p *int) any {
	if p == nil {
		return nil
	}
	return *p
}
func derefInt64(p *int64) any {
	if p == nil {
		return nil
	}
	return *p
}
func derefStr(p *string) any {
	if p == nil {
		return nil
	}
	return *p
}
func derefTime(p *time.Time) any {
	if p == nil {
		return nil
	}
	return *p
}
