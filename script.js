// Global cart state
let globalCart = [];

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  // Load cart from localStorage
  globalCart = JSON.parse(localStorage.getItem("cart")) || [];
  console.log("Initial cart:", globalCart);

  // Initialize the application
  initApp();
});

function initApp() {
  // Load product data
  fetchData();

  // Initialize theme
  initTheme();

  // Initialize cart
  initCart();

  // Initialize mobile menu
  initMobileMenu();

  // Initialize newsletter form
  initNewsletterForm();

  // Initialize contact form if on about page
  if (document.getElementById("contact-form")) {
    initContactForm();
  }

  // Initialize filter buttons if on products or categories page
  if (document.querySelector(".filter-btn")) {
    initFilterButtons();
  }

  // Set current year in footer
  document.getElementById("current-year").textContent =
    new Date().getFullYear();
}

// Fetch data from JSON file
async function fetchData() {
  try {
    const response = await fetch("data.json");
    const data = await response.json();

    // Initialize products if on relevant pages
    if (document.getElementById("featured-products")) {
      renderFeaturedProducts(data.products);
    }

    if (document.getElementById("products-grid")) {
      renderProductsGrid(data.products);
    }

    if (document.getElementById("categories-preview")) {
      renderCategoriesPreview(data.categories);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Theme functionality
function initTheme() {
  const themeToggle = document.getElementById("theme-toggle");
  const lightIcon = document.getElementById("light-icon");
  const darkIcon = document.getElementById("dark-icon");

  // Check for saved theme preference or use preferred color scheme
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.body.classList.add("dark");
    lightIcon.classList.add("hidden");
    darkIcon.classList.remove("hidden");
  }

  // Toggle theme on click
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    lightIcon.classList.toggle("hidden");
    darkIcon.classList.toggle("hidden");

    // Save preference
    const currentTheme = document.body.classList.contains("dark")
      ? "dark"
      : "light";
    localStorage.setItem("theme", currentTheme);
  });
}

// Cart functionality
function initCart() {
  console.log("Initializing cart");

  // Add event listeners for "Add to Cart" buttons
  document.addEventListener("click", (event) => {
    const target = event.target;

    // Add to cart button
    if (
      target.classList.contains("add-to-cart-btn") ||
      target.closest(".add-to-cart-btn")
    ) {
      const button = target.classList.contains("add-to-cart-btn")
        ? target
        : target.closest(".add-to-cart-btn");
      const productId = button.dataset.id;
      console.log("Add to cart clicked for product:", productId);
      addToCart(productId);
      event.preventDefault();
    }

    // Cart toggle button
    if (target.closest("#cart-toggle")) {
      console.log("Cart toggle clicked");
      toggleCart();
      event.preventDefault();
    }

    // Close cart button
    if (target.closest("#close-cart")) {
      console.log("Close cart clicked");
      closeCart();
      event.preventDefault();
    }

    // Cart overlay
    if (target.id === "overlay") {
      console.log("Overlay clicked");
      closeCart();
    }

    // Checkout button
    if (target.closest("#checkout-btn")) {
      console.log("Checkout clicked");
      processCheckoutWithWhatsApp();
      event.preventDefault();
    }
  });

  // Initial cart UI update
  updateCartCount();
}

// Toggle cart drawer
function toggleCart() {
  const cartDrawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("overlay");

  if (!cartDrawer || !overlay) {
    console.error("Cart drawer or overlay not found");
    return;
  }

  const isCartOpen = !cartDrawer.classList.contains("translate-x-full");

  if (isCartOpen) {
    closeCart();
  } else {
    openCart();
  }
}

// Open cart drawer
function openCart() {
  console.log("Opening cart drawer");

  const cartDrawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("overlay");

  if (!cartDrawer || !overlay) {
    console.error("Cart drawer or overlay not found");
    return;
  }

  // Show cart drawer first
  cartDrawer.classList.remove("translate-x-full");
  overlay.classList.remove("opacity-0");
  overlay.classList.remove("pointer-events-none");

  // Then update cart UI with a small delay to ensure the drawer is visible
  setTimeout(() => {
    renderCartItems();
  }, 100);
}

// Close cart drawer
function closeCart() {
  console.log("Closing cart drawer");

  const cartDrawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("overlay");

  if (!cartDrawer || !overlay) {
    console.error("Cart drawer or overlay not found");
    return;
  }

  // Hide cart drawer
  cartDrawer.classList.add("translate-x-full");
  overlay.classList.add("opacity-0");
  overlay.classList.add("pointer-events-none");
}

// Add to cart function
function addToCart(productId) {
  console.log("Adding to cart:", productId);

  // Convert productId to number to ensure consistent comparison
  const productIdNum = Number.parseInt(productId, 10);
  if (isNaN(productIdNum)) {
    console.error("Invalid product ID:", productId);
    return;
  }

  fetch("data.json")
    .then((response) => response.json())
    .then((data) => {
      const product = data.products.find((p) => p.id === productIdNum);

      if (!product) {
        console.error("Product not found:", productIdNum);
        return;
      }

      // Check if product already exists in cart
      const existingItemIndex = globalCart.findIndex(
        (item) => item.id === productIdNum
      );
      console.log(
        "Existing item index:",
        existingItemIndex,
        "for product ID:",
        productIdNum
      );

      if (existingItemIndex !== -1) {
        // Update existing item
        globalCart[existingItemIndex].quantity += 1;
        console.log(
          "Updated existing item quantity for",
          globalCart[existingItemIndex].name,
          "to",
          globalCart[existingItemIndex].quantity
        );
      } else {
        // Add new item
        globalCart.push({
          id: productIdNum,
          name: product.name,
          price: product.sale
            ? product.salePrice || product.price
            : product.price,
          image: product.image,
          quantity: 1,
        });
        console.log("Added new item to cart:", product.name);
      }

      // Save to localStorage
      saveCart();

      // Update cart count
      updateCartCount();

      // Open cart drawer
      openCart();
    })
    .catch((error) => {
      console.error("Error adding to cart:", error);
    });
}

// Update cart item quantity
function updateCartItemQuantity(productId, change) {
  console.log(
    "Updating quantity for product ID:",
    productId,
    "Change:",
    change
  );

  // Convert productId to number to ensure consistent comparison
  const productIdNum = Number.parseInt(productId, 10);
  if (isNaN(productIdNum)) {
    console.error("Invalid product ID:", productId);
    return;
  }

  const itemIndex = globalCart.findIndex((item) => item.id === productIdNum);

  if (itemIndex === -1) {
    console.error("Item not found in cart:", productIdNum);
    return;
  }

  globalCart[itemIndex].quantity += change;
  console.log(
    `Updated quantity for ${globalCart[itemIndex].name} to ${globalCart[itemIndex].quantity}`
  );

  if (globalCart[itemIndex].quantity <= 0) {
    // Remove item if quantity is 0 or less
    console.log(
      `Removing ${globalCart[itemIndex].name} from cart due to zero quantity`
    );
    globalCart.splice(itemIndex, 1);
  }

  // Save to localStorage
  saveCart();

  // Update cart count
  updateCartCount();

  // Re-render cart items
  renderCartItems();
}

// Remove item from cart
function removeFromCart(productId) {
  console.log("Removing from cart:", productId);

  // Convert productId to number to ensure consistent comparison
  const productIdNum = Number.parseInt(productId, 10);
  if (isNaN(productIdNum)) {
    console.error("Invalid product ID:", productId);
    return;
  }

  const itemIndex = globalCart.findIndex((item) => item.id === productIdNum);

  if (itemIndex === -1) {
    console.error("Item not found in cart:", productIdNum);
    return;
  }

  const itemName = globalCart[itemIndex].name;
  globalCart.splice(itemIndex, 1);
  console.log(`Removed ${itemName} from cart`);

  // Save to localStorage
  saveCart();

  // Update cart count
  updateCartCount();

  // Re-render cart items
  renderCartItems();
}

// Save cart to localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(globalCart));
  console.log("Cart saved to localStorage:", globalCart);
}

// Update cart count
function updateCartCount() {
  const cartCount = document.getElementById("cart-count");
  if (cartCount) {
    const totalItems = globalCart.reduce(
      (total, item) => total + item.quantity,
      0
    );
    cartCount.textContent = totalItems.toString();
    console.log("Updated cart count:", totalItems);
  }
}

// Render cart items
function renderCartItems() {
  console.log("Rendering cart items");

  // Add a small delay to ensure the DOM is fully updated
  setTimeout(() => {
    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const emptyCartMessage = document.getElementById("empty-cart-message");
    const checkoutBtn = document.getElementById("checkout-btn");

    // Check each element individually and log which one is missing
    if (!cartItemsContainer) console.error("Cart items container not found");
    if (!cartTotal) console.error("Cart total element not found");
    if (!emptyCartMessage) console.error("Empty cart message not found");
    if (!checkoutBtn) console.error("Checkout button not found");

    if (
      !cartItemsContainer ||
      !cartTotal ||
      !emptyCartMessage ||
      !checkoutBtn
    ) {
      console.error("Some cart elements are missing, cannot render cart items");
      return;
    }

    // Handle empty cart
    if (globalCart.length === 0) {
      emptyCartMessage.classList.remove("hidden");
      checkoutBtn.disabled = true;
      cartItemsContainer.innerHTML = "";
      cartTotal.textContent = "$0.00";
      console.log("Cart is empty");
      return;
    }

    // Cart has items
    emptyCartMessage.classList.add("hidden");
    checkoutBtn.disabled = false;

    // Calculate total
    const total = globalCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    cartTotal.textContent = `$${total.toFixed(2)}`;

    // Clear existing cart items
    cartItemsContainer.innerHTML = "";

    // Add each item to the cart
    globalCart.forEach((item) => {
      const cartItem = document.createElement("div");
      cartItem.className = "cart-item flex items-center gap-4 py-3 border-b";
      cartItem.innerHTML = `
        <img src="${
          item.image || "/placeholder.svg?height=60&width=60"
        }" alt="${item.name}" class="w-16 h-16 object-cover rounded">
        <div class="flex-grow">
          <h4 class="font-bold">${item.name}</h4>
          <div class="flex items-center mt-1">
            <button class="decrease-btn text-gray-500 hover:text-accent">
              <i class="fas fa-minus"></i>
            </button>
            <span class="mx-2">${item.quantity}</span>
            <button class="increase-btn text-gray-500 hover:text-accent">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
        <div class="text-right">
          <div class="font-bold">$${(item.price * item.quantity).toFixed(
            2
          )}</div>
          <button class="remove-btn text-gray-500 hover:text-red-500 mt-1">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;

      // Add the cart item to the container
      cartItemsContainer.appendChild(cartItem);

      // Add event listeners directly to the buttons
      const decreaseBtn = cartItem.querySelector(".decrease-btn");
      const increaseBtn = cartItem.querySelector(".increase-btn");
      const removeBtn = cartItem.querySelector(".remove-btn");

      decreaseBtn.addEventListener("click", () => {
        console.log("Decrease button clicked for", item.name);
        updateCartItemQuantity(item.id, -1);
      });

      increaseBtn.addEventListener("click", () => {
        console.log("Increase button clicked for", item.name);
        updateCartItemQuantity(item.id, 1);
      });

      removeBtn.addEventListener("click", () => {
        console.log("Remove button clicked for", item.name);
        removeFromCart(item.id);
      });
    });

    console.log("Rendered", globalCart.length, "cart items");
  }, 50); // Small delay to ensure DOM is ready
}

// Process checkout with WhatsApp
function processCheckoutWithWhatsApp() {
  if (globalCart.length === 0) {
    alert("Your cart is empty. Please add items before checking out.");
    return;
  }

  // Calculate total
  const subtotal = globalCart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingCost = 30; // 30 DH shipping cost
  const total = subtotal + shippingCost;

  // Create message for WhatsApp
  let message = "Hello, I would like to place an order for:\n\n";

  // Add each item to the message
  globalCart.forEach((item) => {
    message += `${item.name} x${item.quantity} - ${(
      item.price * item.quantity
    ).toFixed(2)} DH\n`;
  });

  // Add subtotal, shipping, and total
  message += `\nSubtotal: ${subtotal.toFixed(2)} DH`;
  message += `\nShipping: ${shippingCost.toFixed(2)} DH`;
  message += `\nTotal: ${total.toFixed(2)} DH`;
  message += `\n\nPayment Method: Cash on Delivery (COD)`;

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);

  // WhatsApp phone number - replace with your actual number
  const phoneNumber = "212600000000"; // Replace with your WhatsApp number

  // Create WhatsApp URL
  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  // Open WhatsApp in a new tab
  window.open(whatsappURL, "_blank");
}

// Mobile menu functionality
function initMobileMenu() {
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  mobileMenuToggle.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// Newsletter form functionality
function initNewsletterForm() {
  const newsletterForm = document.getElementById("newsletter-form");
  if (!newsletterForm) return;

  const newsletterMessage = document.getElementById("newsletter-message");

  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Simulate form submission
    newsletterMessage.textContent =
      "Thank you for subscribing to our newsletter!";
    newsletterMessage.classList.remove("hidden", "text-red-500");
    newsletterMessage.classList.add("text-green-500");

    // Reset form
    newsletterForm.reset();
  });
}

// Contact form functionality
function initContactForm() {
  const contactForm = document.getElementById("contact-form");
  const contactMessage = document.getElementById("contact-message");

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Simulate form submission
    contactMessage.textContent =
      "Thank you for your message! We will get back to you soon.";
    contactMessage.classList.remove("hidden", "text-red-500");
    contactMessage.classList.add("text-green-500");

    // Reset form
    contactForm.reset();
  });
}

// Filter buttons functionality
function initFilterButtons() {
  const filterButtons = document.querySelectorAll(".filter-btn");

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      filterButtons.forEach((btn) => {
        btn.classList.remove("active", "bg-primary", "text-white");
        btn.classList.add(
          "bg-white",
          "dark:bg-dark-card",
          "text-dark-text",
          "dark:text-white"
        );
      });

      // Add active class to clicked button
      this.classList.add("active", "bg-primary", "text-white");
      this.classList.remove(
        "bg-white",
        "dark:bg-dark-card",
        "text-dark-text",
        "dark:text-white"
      );

      // Filter items
      const category = this.dataset.category || this.dataset.filter;

      if (document.querySelector(".category-item")) {
        filterCategories(category);
      } else if (document.getElementById("products-grid")) {
        filterProducts(category);
      }
    });
  });
}

// Filter categories
function filterCategories(category) {
  const categoryItems = document.querySelectorAll(".category-item");

  categoryItems.forEach((item) => {
    if (category === "all" || item.dataset.category === category) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

// Filter products
function filterProducts(category) {
  const productItems = document.querySelectorAll(".product-item");

  productItems.forEach((item) => {
    if (category === "all" || item.dataset.category === category) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

// Render featured products
function renderFeaturedProducts(products) {
  const featuredProductsContainer =
    document.getElementById("featured-products");
  if (!featuredProductsContainer) return;

  // Get featured products
  const featuredProducts = products
    .filter((product) => product.featured)
    .slice(0, 3);

  // Clear loading placeholders
  featuredProductsContainer.innerHTML = "";

  // Render products
  featuredProducts.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.className =
      "product-card bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all";
    productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${
                  product.image || "/placeholder.svg?height=300&width=400"
                }" alt="${
      product.name
    }" class="product-image w-full h-48 object-cover">
            </div>
            <div class="p-4">
                <h3 class="text-xl font-bold mb-2">${product.name}</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">${product.description.substring(
                  0,
                  80
                )}...</p>
                <div class="flex justify-between items-center">
                    <span class="text-lg font-bold">$${product.price.toFixed(
                      2
                    )}</span>
                    <button class="add-to-cart-btn bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors" data-id="${
                      product.id
                    }">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    featuredProductsContainer.appendChild(productCard);
  });
}

// Render products grid
function renderProductsGrid(products) {
  const productsGrid = document.getElementById("products-grid");
  if (!productsGrid) return;

  // Get URL parameters for filtering
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get("category");

  // Filter products if category parameter exists
  let filteredProducts = products;
  if (categoryParam) {
    filteredProducts = products.filter(
      (product) => product.category === categoryParam
    );

    // Activate the corresponding filter button
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((btn) => {
      if (btn.dataset.category === categoryParam) {
        btn.click();
      }
    });
  }

  // Clear loading placeholders
  productsGrid.innerHTML = "";

  // Render products
  filteredProducts.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.className =
      "product-item product-card bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all";
    productCard.dataset.category = product.category;
    productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${
                  product.image || "/placeholder.svg?height=300&width=400"
                }" alt="${
      product.name
    }" class="product-image w-full h-64 object-cover">
                ${
                  product.sale
                    ? '<span class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm">SALE</span>'
                    : ""
                }
            </div>
            <div class="p-4">
                <h3 class="text-xl font-bold mb-2">${product.name}</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">${product.description.substring(
                  0,
                  80
                )}...</p>
                <div class="flex justify-between items-center">
                    <div>
                        ${
                          product.sale
                            ? `
                            <span class="text-lg font-bold">$${product.salePrice.toFixed(
                              2
                            )}</span>
                            <span class="text-sm text-gray-500 line-through ml-2">$${product.price.toFixed(
                              2
                            )}</span>
                        `
                            : `
                            <span class="text-lg font-bold">$${product.price.toFixed(
                              2
                            )}</span>
                        `
                        }
                    </div>
                    <button class="add-to-cart-btn bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors" data-id="${
                      product.id
                    }">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    productsGrid.appendChild(productCard);
  });
}

// Render categories preview
function renderCategoriesPreview(categories) {
  const categoriesPreview = document.getElementById("categories-preview");
  if (!categoriesPreview) return;

  // Get first 4 categories
  const previewCategories = categories.slice(0, 4);

  // Clear loading placeholders
  categoriesPreview.innerHTML = "";

  // Render categories
  previewCategories.forEach((category) => {
    const categoryCard = document.createElement("div");
    categoryCard.className =
      "bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1 duration-300";
    categoryCard.innerHTML = `
            <a href="categories.html?filter=${category.id}" class="block">
                <div class="relative">
                    <img src="${
                      category.image || "/placeholder.svg?height=200&width=300"
                    }" alt="${category.name}" class="w-full h-40 object-cover">
                    <div class="absolute inset-0 bg-primary bg-opacity-30 flex items-center justify-center">
                        <h3 class="text-xl font-bold text-white">${
                          category.name
                        }</h3>
                    </div>
                </div>
            </a>
        `;
    categoriesPreview.appendChild(categoryCard);
  });
}
