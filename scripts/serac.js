// Load featured products dynamically
fetch("../data/products.serac.json")
  .then(res => res.json())
  .then(products => {
    const container = document.getElementById("featured-products");
    products.slice(0, 4).forEach(product => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="../assets/${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>$${product.price}</p>
      `;
      container.appendChild(card);
    });
  })
  .catch(err => console.error("Error loading products:", err));
