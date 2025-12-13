
const socket = io();

function renderProducts(products) {
  const container = document.getElementById("products-container");
  container.innerHTML = "";

  products.forEach(prod => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      ${prod.image ? `
        <div class="product-image-container">
          <img src="${prod.image}" class="product-image">
        </div>
      ` : ""}

      <h3 class="product-title">${prod.title}</h3>

      <p class="product-price">
        <strong>Precio:</strong> $${prod.price}
      </p>

      <p><strong>Publicado por:</strong> ${prod.user}</p>
      <p><strong>Teléfono:</strong> ${prod.phone}</p>

      <button class="form-button" onclick="deleteProduct('${prod.id}')">
        Eliminar
      </button>
    `;


    container.appendChild(card);
  });
}


socket.on("updateProducts", (products) => {
  renderProducts(products);
});


const form = document.getElementById("product-form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fd = new FormData(form);

  try {
    const resp = await fetch("/api/live-products", {
      method: "POST",
      body: fd
    });
    const data = await resp.json();
    if (data.status === "success") {
      
      form.reset();
    } else {
      alert("Error al crear producto");
    }
  } catch (err) {
    console.error(err);
    alert("Error de red");
  }
});

function deleteProduct(id) {
  if (!confirm("¿Eliminar esta publicación?")) return;
  socket.emit("deleteProduct", id);
}

