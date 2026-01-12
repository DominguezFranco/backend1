const socket = io();


function renderProducts(products) {
    const container = document.getElementById("products-container");
    container.innerHTML = "";

    products.forEach(prod => {
        const card = document.createElement("div");
        card.className = "product-card";
        
        
        card.innerHTML = `
            ${prod.thumbnail ? `
                <div class="product-image-container">
                    <img src="${prod.thumbnail}" class="product-image" alt="${prod.title}">
                </div>
            ` : ""}

            <h3 class="product-title">${prod.title}</h3>

            <p class="product-price">
                <strong>Precio:</strong> $${prod.price}
            </p>

            <p><strong>Publicado por:</strong> ${prod.user || 'Anónimo'}</p>
            <p><strong>Teléfono:</strong> ${prod.phone || 'N/A'}</p>

            <button class="form-button" onclick="deleteProduct('${prod._id}')">
                Eliminar
            </button>
        `;

        container.appendChild(card);
    });
}

// Escuchar la actualización de productos desde el servidor
socket.on("updateProducts", (products) => {
    renderProducts(products);
});

// Manejo del formulario para crear productos
const form = document.getElementById("product-form");
if (form) {
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
                alert("Error al crear producto: " + data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Error de red al intentar subir el producto");
        }
    });
}

// Función para emitir la eliminación al servidor
function deleteProduct(id) {
    
    if (!confirm("¿Eliminar esta publicación de forma permanente?")) return;
    socket.emit("deleteProduct", id);
}