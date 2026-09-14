package models

import "time"

type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Transaction.Balance is derived per row (running total), never stored.
type Transaction struct {
	ID      string    `json:"id"`
	UserID  int       `json:"-"`
	User    string    `json:"user"`
	Type    string    `json:"type"`
	Amount  int64     `json:"amount"`
	Note    string    `json:"note"`
	Date    time.Time `json:"date"`
	Balance int64     `json:"balance"`
}

type TransactionUpdate struct {
	UserID *int
	Type   *string
	Amount *int64
	Note   *string
	Date   *time.Time
}

type Balance struct {
	Balance      int64 `json:"balance"`
	TotalIncome  int64 `json:"totalIncome"`
	TotalExpense int64 `json:"totalExpense"`
	TodayIncome  int64 `json:"todayIncome"`
	TodayExpense int64 `json:"todayExpense"`
}

// Target.CurrentAmount and Progress are derived from the live balance.
type Target struct {
	ID            string    `json:"id"`
	Name          string    `json:"name,omitempty"`
	TargetAmount  int64     `json:"targetAmount"`
	CurrentAmount int64     `json:"currentAmount"`
	Progress      float64   `json:"progress"`
	Deadline      time.Time `json:"deadline"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type TargetUpdate struct {
	TargetAmount *int64
	Deadline     *time.Time
}

type WishlistItem struct {
	ID         string    `json:"id"`
	UserID     int       `json:"-"`
	User       string    `json:"user"`
	Name       string    `json:"name"`
	Price      *int64    `json:"price,omitempty"`
	Priority   string    `json:"priority"`
	Notes      string    `json:"notes,omitempty"`
	IsAchieved bool      `json:"isAchieved"`
	CreatedAt  time.Time `json:"createdAt"`
}

type WishlistUpdate struct {
	Name       *string
	Price      *int64
	Priority   *string
	Notes      *string
	IsAchieved *bool
}

type DiaryEntry struct {
	ID        string    `json:"id"`
	UserID    int       `json:"-"`
	User      string    `json:"user"`
	Date      time.Time `json:"date"`
	Content   string    `json:"content"`
	Mood      string    `json:"mood,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type DiaryUpdate struct {
	Content *string
	Mood    *string
}

type CycleData struct {
	LastPeriodStart string `json:"lastPeriodStart"`
	CycleLength     int    `json:"cycleLength"`
	PeriodDuration  int    `json:"periodDuration"`
}
