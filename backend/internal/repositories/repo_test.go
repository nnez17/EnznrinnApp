package repositories

import (
	"math"
	"testing"

	"enznrinn/backend/internal/models"
)

func TestDeriveProgress(t *testing.T) {
	cases := []struct {
		name     string
		target   int64
		balance  int64
		wantProg float64
	}{
		{"40 percent", 10_000_000, 4_000_000, 40},
		{"caps at 100", 1_000, 5_000, 100},
		{"zero balance", 10_000, 0, 0},
		{"negative balance clamps to 0", 10_000, -500, 0},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			tr := &models.Target{TargetAmount: tc.target}
			deriveProgress(tr, tc.balance)
			if tr.CurrentAmount != tc.balance {
				t.Fatalf("currentAmount = %d, want %d (derived, not stored)", tr.CurrentAmount, tc.balance)
			}
			if math.Abs(tr.Progress-tc.wantProg) > 1e-9 {
				t.Fatalf("progress = %v, want %v", tr.Progress, tc.wantProg)
			}
		})
	}
}

func TestPtrHelpers(t *testing.T) {
	if derefInt(nil) != nil || derefStr(nil) != nil || derefInt64(nil) != nil || derefTime(nil) != nil {
		t.Fatal("nil pointers must map to SQL NULL (nil)")
	}
	n := 7
	if derefInt(&n) != 7 {
		t.Fatal("value pointers must unwrap")
	}
}
