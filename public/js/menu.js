document.addEventListener("DOMContentLoaded", () => {
  let currentPage = 1;
  const itemsPerPage = 10;
  let menuItems = [];
  let filteredItems = [];
  let orderItems = [];

  // Function to fetch menu items from the server
  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu');
      menuItems = await response.json();
      filteredItems = menuItems;
      renderTable();
      renderPagination();
      renderCategoryButtons();
    } 
    catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  // Render table items
  const renderTable = () => {
    const tableBody = document.getElementById("menu-table-body");
    tableBody.innerHTML = "";

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredItems.slice(startIndex, endIndex);

    itemsToDisplay.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td data-label="ID">${item.id}</td>
        <td data-label="Item Name">${item.item_name}</td>
        <td data-label="Description">${item.description}</td>
        <td data-label="Price">${item.price}</td>
        <td data-label="Category">${item.category}</td>
        <td class="menuActions" data-label="Actions">
          <div class="menuActionBtns">
            <button class="edit-item" data-id="${item.id}">Edit</button>
            <button class="delete-item" data-id="${item.id}">Delete</button>
            <button class="make-order" data-id="${item.id}">Order</button>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
      
      // Check if this item is already in the orderItems array
      if (orderItems.some(orderItem => orderItem.id === item.id)) {
        row.classList.add('selected'); // Highlight the row if previously selected
        row.querySelector('.make-order').style.display = 'block';
      }
    });

    attachEventListeners();
  };

  // Function to render pagination
  const renderPagination = () => {
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    document.getElementById("current-menu-page").innerText = currentPage;

    document.getElementById("prev-menu").disabled = currentPage === 1;
    document.getElementById("next-menu").disabled = currentPage === totalPages;
  };

  // Function to render category buttons for filtering
  const renderCategoryButtons = () => {
    const categories = [...new Set(menuItems.map(item => item.category))];
    const categoryButtonsDiv = document.getElementById("category-buttons");
    categoryButtonsDiv.innerHTML = ""; // Clear existing buttons

    categories.forEach(category => {
      const button = document.createElement("button");
      button.innerText = category;
      button.addEventListener("click", () => filterByCategory(category));
      categoryButtonsDiv.appendChild(button);
    });
  };

  // Function to filter items by category
  const filterByCategory = (category) => {
    filteredItems = menuItems.filter(item => item.category === category);
    currentPage = 1; // Reset to the first page
    renderTable();
    renderPagination();
  };

  // Function to attach event listeners to edit, delete, and order buttons
  const attachEventListeners = () => {
    document.querySelectorAll(".edit-item").forEach(button => {
      button.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        editMenuItem(id);
      });
    });

    document.querySelectorAll(".delete-item").forEach(button => {
      button.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        deleteMenuItem(id);
      });
    });

    // Disable all order buttons initially
    const orderButtons = document.querySelectorAll('.make-order');
    orderButtons.forEach(button => button.style.display = 'none');

    // Handle 'Make Order' button clicks
    document.querySelectorAll('.make-order').forEach(button => {
      button.addEventListener('click', async () => {
        console.log("Initiating order placement");
        const itemId = button.dataset.id;

        // Fetch item details based on itemId
        const itemDetails = await fetchItemDetails(itemId);
        
        if (!itemDetails) {
          alert('Error fetching item details.');
          return;
        }

        // Add item details to orderItems array if not already present
        if (!orderItems.some(orderItem => orderItem.id === itemId)) {
          orderItems.push({
            id: itemDetails.id,
            name: itemDetails.item_name,
            description: itemDetails.description,
            price: itemDetails.price,
            category: itemDetails.category,
            quantity: 1
          });

          //localStorage.setItem('orderItems', JSON.stringify(orderItems));
        }
      });
    });
  };

  // Function to add a menu item to the server
  const addMenuItem = async (item) => {
    try {
      const response = await fetch('/api/menu', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });

      if (response.ok) {
        alert("Item added successfully");
        location.assign('/menu');
      } 
      else {
        console.error("Failed to add menu item");
      }
    } catch (error) {
      console.error("Error adding menu item:", error);
    }
  };

  // Function to edit a menu item
  const editMenuItem = (id) => {
    const item = menuItems.find(item => item.id === parseInt(id));
    if (item) {
      document.getElementById("menu-item-id").value = item.id;
      document.getElementById("menu-item-name").innerText = item.item_name;
      document.getElementById("menu-item-category").innerText = item.category;
      document.getElementById("menu-item-description").value = item.description;
      document.getElementById("menu-item-price").value = item.price;

      document.querySelector(".menu-item-details").style.display = "block";
      document.querySelector(".menu-stock").style.display = "none";
    }
  };

  // Function to delete a menu item
  const deleteMenuItem = async (id) => {
    const userConfirmed = confirm("Are you sure you want to delete this item?");
    if (!userConfirmed) {
      return; 
    }

    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert("Item deleted successfully");
        location.assign('/menu');
      } 
      else {
        console.error("Failed to delete menu item");
        alert("Failed to delete item. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting menu item:", error);
      alert("An error occurred while deleting the item. Please try again.");
    }
  };

  // Event listeners for pagination buttons
  document.getElementById("prev-menu").addEventListener("click", () => {
    currentPage--;
    renderTable();
    renderPagination();
  });

  document.getElementById("next-menu").addEventListener("click", () => {
    currentPage++;
    renderTable();
    renderPagination();
  });

  // Function to handle the menu item form submission
  document.getElementById("add-menu-item-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newItem = {
      item_name: formData.get("menu-item-name"),
      description: formData.get("menu-item-description"),
      price: parseFloat(formData.get("menu-item-price")),
      category: formData.get("menu-item-category"),
    };

    await addMenuItem(newItem);
    e.target.reset(); // Clear the form
  });

  // Event listener for updating a menu item
  document.getElementById("update-menu-item").addEventListener("click", async () => {
    const id = document.getElementById("menu-item-id").value;
    const updatedItem = {
      id: id,
      item_name: document.getElementById("menu-item-name").innerText,
      description: document.getElementById("menu-item-description").value,
      price: parseFloat(document.getElementById("menu-item-price").value),
      category: document.getElementById("menu-item-category").innerText,
    };

    await updateMenuItem(updatedItem);
  });

  // Function to update a menu item on the server
  const updateMenuItem = async (item) => {
    try {
      const response = await fetch(`/api/menu/${item.id}`, { // Adjust the API endpoint as needed
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });

      if (response.ok) {
        fetchMenuItems(); // Refresh the menu items
        document.querySelector(".menu-item-details").style.display = "none";
        document.querySelector(".menu-stock").style.display = "block";
      } else {
        console.error("Failed to update menu item");
      }
    } catch (error) {
      console.error("Error updating menu item:", error);
    }
  };

  // Back to stock list
  document.getElementById('back-to-menu').addEventListener('click', () => {
    document.querySelector('.menu-stock').style = 'display: block';
    document.querySelector('.menu-item-details').style = 'display: none';
  });

  // Show add-item form
  document.querySelector('.addNewMenuItem').addEventListener('click', () => {
    document.querySelector('.menu-stock').style = 'display: none';
    document.querySelector('.addMenuItem').style = 'display: block';
  })

  //Back to stock from addForm
  document.getElementById('back-to-menu2').addEventListener('click', () => {
    document.querySelector('.menu-stock').style = 'display: block';
    document.querySelector('.addMenuItem').style = 'display: none';
  });

  // -> ORDERS
  // Initiate order
  document.querySelector('.newOrder').addEventListener('click', () => {
    // Enable all order buttons
    const orderButtons = document.querySelectorAll('.make-order');
    orderButtons.forEach(button => button.style.display = 'block');

    // Allow selection of items
    const menuTableRows = document.querySelectorAll('#menu-table-body tr');
    menuTableRows.forEach(row => {
      row.addEventListener('click', function() {
        this.classList.toggle('selected');
      });
    });
  
    // Make 'Process' button visible
    document.querySelector('.processOrderBox').style.display = 'block';
  });

  // Fetch item details from server
  async function fetchItemDetails(itemId) {
    try {
      const response = await fetch(`/api/menu/${itemId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } 
    catch (error) {
      console.error('Error fetching item details:', error);
      return null;
    }
  }

  // Update the order form with selected items
  function updateOrderForm() {
    const orderForm = document.getElementById('order-form');
    const itemContainer = document.createElement('div');
    itemContainer.className = 'order-items';
    
    orderForm.querySelector('.order-items')?.remove();
    orderItems.forEach((item, index) => {
      const itemHTML = `
        <div class="order-item" data-index="${index}">
          <p><strong>Item Name:</strong> ${item.name}</p>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Price:</strong> ${item.price}</p>
          <p><strong>Category:</strong> ${item.category}</p>
          <label for="quantity-${index}">Quantity:</label>
          <input type="number" id="quantity-${index}" name="quantity-${index}" min="1" value="${item.quantity}" required>
          <button type="button" class="remove-item" data-index="${index}">Remove</button>
        </div>
      `;
      itemContainer.innerHTML += itemHTML;
    });

    orderForm.appendChild(itemContainer);

    document.querySelectorAll('.remove-item').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = button.dataset.index;
        removeItemFromOrder(index);
      });
    });

    document.querySelectorAll('input[type="number"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const index = input.id.split('-')[1];
        orderItems[index].quantity = input.value;
      });
    });
  }

  // Remove an item from the order
  function removeItemFromOrder(index) {
    orderItems.splice(index, 1); 
    updateOrderForm(); 
  }

  // Process order
  const processOrder = document.querySelector('.processOrderBox button');

  processOrder.addEventListener('click', () => {
    const selectedItems = document.querySelectorAll('#menu-table-body tr.selected');
    const orderContainer = document.querySelector('.orderContainer .order-items');
    document.querySelector('.menu-stock').style.display = 'none';
    processOrder.style.display = 'none';

    // Clear previous order items
    orderContainer.innerHTML = '';

    // Add selected items to the order container
    selectedItems.forEach(item => {
      const itemName = item.querySelector('td:nth-child(2)').textContent;
      const itemPrice = parseFloat(item.querySelector('td:nth-child(4)').textContent.replace(/[^0-9.-]+/g,"")); // Ensure price is a number

      const orderItem = `
        <div class="order-item">
          <div class="orderItemDetails">
            <p><strong>${itemName}:</strong> $<span class="item-price">${itemPrice.toFixed(2)}</span></p>
            <div class="quantityField">
              <label for="quantity-${itemName}">Quantity:</label>
              <input type="number" class="quantity-input" id="quantity-${itemName}" name="quantity-${itemName}" value="1" min="1" />
            </div>
          </div>
          
          <button class="remove-item">Remove</button>
        </div>
      `;

      orderContainer.innerHTML += orderItem;
    });

    // Show the order container
    document.querySelector('.orderContainer').style.display = 'block';

    // Add event listeners for the remove buttons
    addRemoveListeners();

    // Calculate total amount after adding items
    updateTotalAmount();
  });

  // Function to add remove listeners to each order item
  function addRemoveListeners() {
    const removeButtons = document.querySelectorAll('.remove-item');

    removeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const orderItem = button.closest('.order-item'); 
        if (orderItem) {
          orderItem.remove(); 
          updateTotalAmount(); 
        }
      });
    });

    // Add event listeners to quantity inputs to update total amount on change
    const quantityInputs = document.querySelectorAll('.quantity-input');

    quantityInputs.forEach(input => {
      input.addEventListener('change', () => {
        updateTotalAmount();
      });
    });
  }

  // Function to update the total amount
  function updateTotalAmount() {
    const orderItems = document.querySelectorAll('.order-item');
    let total = 0;

    orderItems.forEach(item => {
      const priceElement = item.querySelector('.item-price');
      const quantityInput = item.querySelector('.quantity-input');

      const price = parseFloat(priceElement.textContent);
      const quantity = parseInt(quantityInput.value, 10);

      total += price * quantity; // Calculate total
    });

    // Update the total amount displayed
    document.querySelector('.totalAmount').textContent = `$${total.toFixed(2)}`;
  }

  // Back to menu from order processing
  document.querySelector('.backToMenuItems').addEventListener('click', () => {
    document.querySelector('.orderContainer').style.display = 'none';
    document.querySelector('.menu-stock').style.display = 'block';
    processOrder.style.display = 'block';
  })

  // Handle form submission
  document.getElementById('order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    // Collect the order items
    let orderItems = [];

    document.querySelectorAll('.order-item').forEach(orderItem => {
      const itemName = orderItem.querySelector('strong').textContent;
      
      // Use a more specific selector for price if possible
      const priceElement = orderItem.querySelector('p:nth-child(1)');
      const quantityInput = orderItem.querySelector('input[type="number"]');
      
      // Ensure priceElement exists before accessing textContent
      if (!priceElement) {
        console.error('Price element not found for item:', itemName);
        return; 
      }
  
      const priceText = priceElement.textContent;
      const quantity = parseInt(quantityInput.value, 10);
      
      // Parse price from the string (e.g., "$12.34" to 12.34)
      const price = parseFloat(priceText.replace(/[^0-9.-]+/g,"")); // This regex removes any non-numeric characters
  
      if (quantity > 0) {
        orderItems.push({
          itemName,
          price,   
          quantity
        });
      }
    });
  
    // Check if there are any order items
    if (orderItems.length === 0) {
      alert('Please select at least one item with a valid quantity.');
      return;
    }
  
    // Collect the selected payment method
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  
    // Send order details to the server
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderItems, paymentMethod }),
      });
  
      if (response.ok) {
        alert('Order placed successfully!');
        location.assign('/orders');
      } 
      else {
        const errorText = await response.text();
        console.error('Failed to place order:', errorText);
      }
    } 
    catch (error) {
      console.error('Error placing order:', error);
    }
  });
  
  // Initial fetch of menu items
  fetchMenuItems();
});