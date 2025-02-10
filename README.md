# Trading API

This is a research project to create a method to handle multiple API calls at once from a large batch of users and handle them on a server efficiently. The manager is able to take in the API request and handle them asynchronously with a large batch at once to reduce the overall time it would take to handle a one-by-one request.

## Objectives

- The API calls manager will be able to perform a minimum of the first three core objectives.
- It must be able to handle more than a couple of requests at once and send them back in the same fraction of time (1 API call == 2 seconds, 100 API calls == 2 seconds).
- It must be able to efficiently use the system's resources.
- It must be able to run the API calls asynchronously in a non-blocking way.
- It should be able to handle API calls of different natures from different languages.

## Prerequisites

- Go 1.23.1 or later
- PostgreSQL
- Redis

## Setup

### PostgreSQL

1. Install PostgreSQL and start the PostgreSQL server.
2. Create a database named `Trading_API`:

   ```sql
   CREATE DATABASE Trading_API;


3. Create the orders table:
   ```sql
   CREATE TABLE orders (
       id SERIAL PRIMARY KEY,
       user_id INT NOT NULL,
       symbol VARCHAR(10) NOT NULL,
       side VARCHAR(4) NOT NULL,
       price NUMERIC(10, 2) NOT NULL,
       quantity NUMERIC(10, 2) NOT NULL,
       status VARCHAR(10) NOT NULL
   );


# Redis
1. Install Redis and start the Redis server

# Go Modules
1. Initialize the Go module:
   ```go
   go mod init <name of project folder>
3. Install the required dependencies
   ```go
   go mod tidy
   
# Running the Service
1. Clone the repository or download the source code
2. Navigate to the directory
3. Run the Go application:
   ```go
   go run main.go
# API Endpoints
Create Order
- URL: /api/order
- Method: POST
- Request Body:
  ```JSON
    {
        "user_id": 1,
        "symbol": "AAPL",
        "side": "buy",
        "price": 150.00,
        "quantity": 10
    }
  
- Response:
  - 202 Accepted: Order received
  - 400 Bad Request: Invalid request
  - 503 Service Unavailable: Server is busy, try again later


# Testing
Using Postman
1. Create a new Postman collection.
2. Add a new request to the collection with the following details:
  - Method: POST
  - URL: https://localhost:3000/api/order
    <vscode_annotation details='%5B%7B%22title%22%3A%22hardcoded-  credentials%22%2C%22description%22%3A%22Embedding%20credentials%20in%20source%20code%20risks%20unauthorized%20access%22%7D%5D'> </vscode_annotation>

Body: Select `raw` and `JSON` format, then add the following JSON data:
     ```JSON
       
       {
           "user_id": 1, 
           "symbol": "AAPL",
           "side": "buy",
           "price": 150.00
           "quantity": 10
       }
    
3. Use the Postman collection Runner to send multiple requests:
    - Click on the three small circle menu icon on the collection name that was created
    - Click on the "Run collection" to open the Collection Runner.
    - Set the number of iterations to 1000.
    - Click the "Run" button to start the test.



# Using Newman
1. Export the Postman collection as a JSON file.
2. Install Newman:
    `npm install -g newman`
3. Run the collection with Newman:
     `newman run path/to/your/collection.json --iteration-count 1000 --delay-request 2000`
       *replace `path/to/your/collection.json` with the actual path to your exported Postman collection file*


# License
This project is licensed under the MIT License.
