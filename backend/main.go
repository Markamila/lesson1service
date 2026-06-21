package main

import (
	"fmt"
	"net/http"
)

func main() {
	// Маршрут для проверки, что сайт работает
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Привет! Бэкенд на Go успешно запущен внутри общего Docker-compose!")
	})

	fmt.Println("Go-сервер успешно стартовал на порту :8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		panic(err)
	}
}
