package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/jackc/pgx/v4/pgxpool"
)

var db *pgxpool.Pool // PostgreSQL connection pool
var rdb *redis.Client
var orderBook = sync.Map{}       // Concurrent in-memory order book
var orderChan = make(chan Order) // Unbuffered channel for fast processing

type Order struct {
	UserID   int
	Symbol   string
	Side     string
	Price    float64
	Quantity float64
	Status   string
}

func main() {
	port := flag.String("port", "3000", "Port to run the server on")
	flag.Parse()

	app := fiber.New(fiber.Config{Prefork: true}) // Enable Prefork mode for performance

	// Initialize connections
	initPostgres()
	initRedis()

	// Start a worker pool with multiple goroutines
	for i := 0; i < 10; i++ { // 10 workers
		go orderMatchingEngine()
	}

	// Rate limiting: Allow **200 requests per second**
	app.Use(limiter.New(limiter.Config{
		Max:        200,
		Expiration: 1 * time.Second,
	}))

	// API route for handling trade messages
	app.Post("/api/order", handleOrder)

	log.Fatal(app.Listen(":" + *port))
}

// Initialize PostgreSQL connection pool
func initPostgres() {
	connString := "postgres://postgres:Macbayprince05@localhost:5432/Trading_API"
	var err error
	db, err = pgxpool.Connect(context.Background(), connString)
	if err != nil {
		log.Fatal("Unable to connect to PostgreSQL:", err)
	}
	fmt.Println("✅ Connected to PostgreSQL")
}

// Initialize Redis connection
func initRedis() {
	rdb = redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})
	fmt.Println("✅ Connected to Redis")
}

// Handle API orders
func handleOrder(c *fiber.Ctx) error {
	var order Order
	if err := c.BodyParser(&order); err != nil {
		return c.Status(fiber.StatusBadRequest).SendString("Invalid request")
	}

	order.Status = "pending"

	// Send order to worker pool
	select {
	case orderChan <- order:
		return c.Status(fiber.StatusAccepted).SendString("Order received")
	default:
		return c.Status(fiber.StatusServiceUnavailable).SendString("Server is busy, try again later")
	}
}

// Order matching engine with workers
func orderMatchingEngine() {
	for order := range orderChan {
		// Insert trade order into PostgreSQL
		orderID, err := insertOrder(order)
		if err != nil {
			fmt.Println("❌ Error inserting order:", err)
			continue
		}

		// Add order to the in-memory order book
		addOrderToBook(order)

		// Cache order in Redis (Async)
		go cacheOrderInRedis(order)

		// Simulate order execution
		fmt.Printf("✅ Order %d executed successfully\n", orderID)

		// Update order status to "completed" in DB (Async)
		go func(orderID int) {
			err := updateOrderStatus(orderID, "completed")
			if err != nil {
				fmt.Println("❌ Error updating order status:", err)
			} else {
				fmt.Printf("✅ Order %d completed\n", orderID)
			}
		}(orderID)
	}
}

// Insert Order into PostgreSQL
func insertOrder(order Order) (int, error) {
	sql := `INSERT INTO orders (user_id, symbol, side, price, quantity, status)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`

	var orderID int
	err := db.QueryRow(context.Background(), sql, order.UserID, order.Symbol, order.Side, order.Price, order.Quantity, order.Status).Scan(&orderID)
	if err != nil {
		return 0, err
	}
	return orderID, nil
}

// Update Order Status in PostgreSQL
func updateOrderStatus(orderID int, status string) error {
	sql := `UPDATE orders SET status = $1 WHERE id = $2`
	_, err := db.Exec(context.Background(), sql, status, orderID)
	return err
}

// Add order to concurrent in-memory order book
func addOrderToBook(order Order) {
	orderBook.Store(order.Symbol, appendOrder(order.Symbol, order))
}

// Append orders without mutex
func appendOrder(symbol string, order Order) []Order {
	value, _ := orderBook.Load(symbol)
	existingOrders, _ := value.([]Order)
	return append(existingOrders, order)
}

// Cache order in Redis (Async with expiration)
func cacheOrderInRedis(order Order) {
	key := fmt.Sprintf("order:%d", order.UserID)
	orderJSON, err := json.Marshal(order)
	if err != nil {
		fmt.Println("❌ Error marshaling order:", err)
		return
	}

	// Set expiration to auto-remove stale data
	err = rdb.Set(context.Background(), key, orderJSON, 10*time.Minute).Err()
	if err != nil {
		fmt.Println("❌ Error caching order in Redis:", err)
	} else {
		fmt.Println("✅ Order cached in Redis:", key)
	}
}
