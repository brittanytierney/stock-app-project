const apiKey = "RDCLUILTONYT9GHR"; 

// watchlist and portfolio from localStorage
let watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
let portfolio = JSON.parse(localStorage.getItem("portfolio") || "{}");

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const searchButton = document.querySelector("#search-btn");
    const stockSymbolInput = document.querySelector("#search-input");
    const stockDetailsSection = document.querySelector("#stock-details");
    const stockName = document.querySelector("#stock-name");
    const stockPrice = document.querySelector("#stock-price");
    const stockChange = document.querySelector("#stock-change");
    const stockPercent = document.querySelector("#stock-percent");
    const addWatchBtn = document.querySelector("#add-watch-btn");
    const sharesInput = document.querySelector("#shares-input");
    const updateSharesBtn = document.querySelector("#update-shares-btn");
    const positionValue = document.querySelector("#position-value");
    const portfolioTotal = document.querySelector("#portfolio-total");

    // Search for a stock
    searchButton.addEventListener("click", async () => {
      const symbol = stockSymbolInput.value.trim().toUpperCase();
      if (!symbol) return alert("Please enter a stock symbol");

      try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}`;
        console.log("Fetching data from:", url + "&apikey=XXXXX"); // Log URL without API key
        
        const response = await fetch(`${url}&apikey=${apiKey}`);
        console.log("Response status:", response.status);
        
        const data = await response.json();
        console.log("API Response data:", JSON.stringify(data, null, 2));

        if (data.Note) {
          console.log("API limit message:", data.Note);
          alert("API rate limit reached. Please wait a minute before trying again.");
          return;
        }

        if (data["Error Message"]) {
          console.log("API error:", data["Error Message"]);
          alert("Error: " + data["Error Message"]);
          return;
        }

        if (
          !data["Global Quote"] ||
          Object.keys(data["Global Quote"]).length === 0
        ) {
          alert(
            "Stock symbol not found. Please check the symbol and try again."
          );
          return;
        }

        if (!data["Global Quote"]["01. symbol"]) {
          alert("Invalid API response. Please try again in a moment.");
          return;
        }

        displayStockData(data["Global Quote"]);
      } catch (error) {
        alert("Network error. Please try again later.");
      }
    });

    // Displaying the stock data on the page
    function displayStockData(stock) {
      const symbol = stock["01. symbol"];
      const price = parseFloat(stock["05. price"]).toFixed(2);
      const change = parseFloat(stock["09. change"]).toFixed(2);
      const percent = stock["10. change percent"];

      stockDetailsSection.hidden = false;
      stockName.textContent = symbol;
      stockPrice.textContent = `$${price}`;
      stockChange.textContent = `${change > 0 ? "+" : ""}${change}`;
      stockPercent.textContent = percent;

      // Update shares input with any existing shares
      sharesInput.value = portfolio[symbol] || "";

      // Update position value
      updatePositionValue(symbol, price);

      // Update Add to Watchlist button state
      const isInWatchlist = watchlist.includes(symbol);
      addWatchBtn.textContent = isInWatchlist
        ? "⭐ Remove from Watchlist"
        : "⭐ Add to Watchlist";

      // Apply color based on change
      stockChange.className = change >= 0 ? "positive" : "negative";
      stockPercent.className = change >= 0 ? "positive" : "negative";
    }

    // Handle adding/removing from watchlist
    addWatchBtn.addEventListener("click", () => {
      const symbol = stockName.textContent;
      const isInWatchlist = watchlist.includes(symbol);

      if (isInWatchlist) {
        // Remove from watchlist
        watchlist = watchlist.filter((s) => s !== symbol);
        addWatchBtn.textContent = "⭐ Add to Watchlist";
      } else {
        // Add to watchlist
        watchlist.push(symbol);
        addWatchBtn.textContent = "⭐ Remove from Watchlist";
      }

      // Save to localStorage and update display
      localStorage.setItem("watchlist", JSON.stringify(watchlist));
      updateWatchlistDisplay();
    });

    // Handle updating shares
    updateSharesBtn.addEventListener("click", () => {
      const symbol = stockName.textContent;
      const shares = parseFloat(sharesInput.value) || 0;

      if (shares > 0) {
        portfolio[symbol] = shares;
      } else {
        delete portfolio[symbol];
      }

      // Save to localStorage
      localStorage.setItem("portfolio", JSON.stringify(portfolio));

      // Update position and total portfolio value
      const price = parseFloat(stockPrice.textContent.replace("$", ""));
      updatePositionValue(symbol, price);
      updatePortfolioTotal();
    });

    // Function to update position value
    function updatePositionValue(symbol, price) {
      const shares = portfolio[symbol] || 0;
      const value = shares * price;
      positionValue.textContent = `$${value.toFixed(2)}`;
    }

    // Function to update total portfolio value
    async function updatePortfolioTotal() {
      let total = 0;

      for (const [symbol, shares] of Object.entries(portfolio)) {
        try {
          const response = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
          );
          const data = await response.json();
          const quote = data["Global Quote"];

          if (quote) {
            const price = parseFloat(quote["05. price"]);
            total += price * shares;
          }
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
        }
      }

      portfolioTotal.textContent = `$${total.toFixed(2)}`;
    }

    // Function to update the watchlist display
    async function updateWatchlistDisplay() {
      const watchlistElement = document.querySelector("#watchlist");
      watchlistElement.innerHTML = ""; // Clear current list

      for (const symbol of watchlist) {
        try {
          // Fetch current data for the stock
          const response = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
          );
          const data = await response.json();
          const quote = data["Global Quote"];

          if (quote) {
            const price = parseFloat(quote["05. price"]).toFixed(2);
            const change = parseFloat(quote["09. change"]).toFixed(2);
            const changePercent = quote["10. change percent"];

            // Create list item
            const li = document.createElement("li");
            li.className = "watchlist-item";
            li.innerHTML = `
              <div class="watchlist-symbol">${symbol}</div>
              <div class="watchlist-price">$${price}</div>
              <div class="watchlist-change ${
                change >= 0 ? "positive" : "negative"
              }">
                ${change >= 0 ? "+" : ""}${change} (${changePercent})
              </div>
              <button class="remove-watch-btn" data-symbol="${symbol}">❌</button>
            `;

            // Add click handler to remove button
            const removeBtn = li.querySelector(".remove-watch-btn");
            removeBtn.addEventListener("click", (e) => {
              const symbolToRemove = e.target.dataset.symbol;
              watchlist = watchlist.filter((s) => s !== symbolToRemove);
              localStorage.setItem("watchlist", JSON.stringify(watchlist));
              updateWatchlistDisplay();

              // Update main display button if this is the current stock
              if (symbolToRemove === stockName.textContent) {
                addWatchBtn.textContent = "⭐ Add to Watchlist";
              }
            });

            watchlistElement.appendChild(li);
          }
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
        }
      }
    }

    // Initial load of watchlist and portfolio value
    updateWatchlistDisplay();
    updatePortfolioTotal();
  });
} else {
  // Running under Node — no DOM available. Export minimal items for tests if needed.
  // This prevents a ReferenceError when someone runs `node app.js`.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { apiKey };
  }
}
