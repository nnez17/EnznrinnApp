//go:build integration

package repositories

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"enznrinn/backend/internal/models"
)

// Run against a CLEAN Postgres DB (freshly migrated):
// DATABASE_URL=postgres://... go test -tags integration ./internal/repositories/
// Balance is global by design (shared household savings), so assertions need isolation.

func rid() string {
	var b [8]byte
	_, _ = rand.Read(b[:])
	return hex.EncodeToString(b[:])
}

func setup(t *testing.T) (*Repo, context.Context) {
	t.Helper()
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		t.Skip("DATABASE_URL not set")
	}
	pool, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	ctx := context.Background()
	if err := pool.Ping(ctx); err != nil {
		t.Fatal(err)
	}
	var n int
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM transactions`).Scan(&n); err != nil {
		t.Fatal(err)
	}
	if n != 0 {
		t.Skip("database not empty — integration tests require a clean DB")
	}
	return New(pool), ctx
}

func seedUser(t *testing.T, r *Repo, ctx context.Context) int {
	t.Helper()
	var id int
	if err := r.pool.QueryRow(ctx, `INSERT INTO users (name) VALUES ($1) RETURNING id`, "test-"+rid()).Scan(&id); err != nil {
		t.Fatal(err)
	}
	return id
}

func tx(userID int, typ string, amount int64) models.Transaction {
	return models.Transaction{ID: rid(), UserID: userID, Type: typ, Amount: amount, Note: "t", Date: time.Now().UTC()}
}

func TestIncomeThenExpenseBalance(t *testing.T) {
	r, ctx := setup(t)
	u := seedUser(t, r, ctx)

	if err := r.InsertTransaction(ctx, tx(u, "income", 100000)); err != nil {
		t.Fatal(err)
	}
	b, err := r.GetBalance(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if b.Balance != 100000 {
		t.Fatalf("after income balance=%d want 100000", b.Balance)
	}

	if err := r.InsertExpenseWithBalanceCheck(ctx, tx(u, "expense", 30000)); err != nil {
		t.Fatal(err)
	}
	b, _ = r.GetBalance(ctx)
	if b.Balance != 70000 {
		t.Fatalf("after expense balance=%d want 70000", b.Balance)
	}
}

func TestExpenseRejectedWhenOverBalance(t *testing.T) {
	r, ctx := setup(t)
	u := seedUser(t, r, ctx)
	_ = r.InsertTransaction(ctx, tx(u, "income", 50000))

	err := r.InsertExpenseWithBalanceCheck(ctx, tx(u, "expense", 150000))
	if err != ErrInsufficientBalance {
		t.Fatalf("want ErrInsufficientBalance, got %v", err)
	}
	b, _ := r.GetBalance(ctx)
	if b.Balance != 50000 {
		t.Fatalf("balance must stay 50000, got %d", b.Balance)
	}
}

func TestUpdateOneRowDoesNotTouchOthers(t *testing.T) {
	r, ctx := setup(t)
	u := seedUser(t, r, ctx)
	a := tx(u, "income", 100000)
	b := tx(u, "expense", 10000)
	_ = r.InsertTransaction(ctx, a)
	_ = r.InsertTransaction(ctx, b)

	amt, note := int64(20000), "x"
	if err := r.UpdateTransaction(ctx, b.ID, models.TransactionUpdate{Amount: &amt, Note: &note}); err != nil {
		t.Fatal(err)
	}
	txs, _ := r.ListTransactions(ctx)
	if len(txs) != 2 {
		t.Fatalf("update must not delete/duplicate: got %d rows", len(txs))
	}
	bal, _ := r.GetBalance(ctx)
	if bal.Balance != 80000 {
		t.Fatalf("balance=%d want 80000", bal.Balance)
	}
	inc, err := r.GetTransaction(ctx, a.ID)
	if err != nil || inc.Amount != 100000 {
		t.Fatalf("income row altered: %+v err=%v", inc, err)
	}
}

func TestRunningBalanceDerivedNotStored(t *testing.T) {
	r, ctx := setup(t)
	u := seedUser(t, r, ctx)
	old := time.Now().Add(-48 * time.Hour).UTC()
	a := tx(u, "income", 100000)
	a.Date = old
	b := tx(u, "expense", 40000)
	b.Date = old.Add(time.Hour)
	_ = r.InsertTransaction(ctx, a)
	_ = r.InsertTransaction(ctx, b)

	// editing the earlier row must shift the later running balance without rewriting rows
	newAmt := int64(60000)
	if err := r.UpdateTransaction(ctx, a.ID, models.TransactionUpdate{Amount: &newAmt}); err != nil {
		t.Fatal(err)
	}
	later, err := r.GetTransaction(ctx, b.ID)
	if err != nil {
		t.Fatal(err)
	}
	if later.Balance != 20000 { // 60000 income - 40000 expense
		t.Fatalf("running balance not recalculated: %d want 20000", later.Balance)
	}
	var col int
	_ = r.pool.QueryRow(ctx, `SELECT count(*) FROM information_schema.columns WHERE table_name='transactions' AND column_name='balance'`).Scan(&col)
	if col != 0 {
		t.Fatal("transactions.balance must not be a stored column (PRD §10)")
	}
}

func TestDeleteOnlyIntendedRow(t *testing.T) {
	r, ctx := setup(t)
	u := seedUser(t, r, ctx)
	a := tx(u, "income", 100000)
	b := tx(u, "expense", 10000)
	_ = r.InsertTransaction(ctx, a)
	_ = r.InsertTransaction(ctx, b)

	if err := r.DeleteTransaction(ctx, b.ID); err != nil {
		t.Fatal(err)
	}
	txs, _ := r.ListTransactions(ctx)
	if len(txs) != 1 || txs[0].ID != a.ID {
		t.Fatalf("wrong rows remain: %+v", txs)
	}
	bal, _ := r.GetBalance(ctx)
	if bal.Balance != 100000 {
		t.Fatalf("balance=%d want 100000", bal.Balance)
	}
}

func TestTargetProgressDerived(t *testing.T) {
	r, ctx := setup(t)
	u := seedUser(t, r, ctx)
	_ = r.InsertTransaction(ctx, tx(u, "income", 4_000_000))
	tg := models.Target{ID: rid(), TargetAmount: 10_000_000, Deadline: time.Now().Add(30 * 24 * time.Hour)}
	if err := r.UpsertTarget(ctx, tg); err != nil {
		t.Fatal(err)
	}
	bal, _ := r.GetBalance(ctx)
	got, err := r.GetTarget(ctx, tg.ID, bal.Balance)
	if err != nil {
		t.Fatal(err)
	}
	if got.CurrentAmount != 4_000_000 || got.Progress != 40 {
		t.Fatalf("progress=%v current=%v want 40 / 4000000", got.Progress, got.CurrentAmount)
	}
	var col int
	_ = r.pool.QueryRow(ctx, `SELECT count(*) FROM information_schema.columns WHERE table_name='targets' AND column_name='current_amount'`).Scan(&col)
	if col != 0 {
		t.Fatal("targets.current_amount must not be stored (PRD §11)")
	}
}
