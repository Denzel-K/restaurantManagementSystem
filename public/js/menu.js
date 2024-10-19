document.addEventListener("DOMContentLoaded", () => {
  let currentPage = 1;
  const itemsPerPage = 10;
  let menuItems = [];
  let filteredItems = [];

  // Function to fetch menu items from the server
  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu');
      menuItems = await response.json();
      filteredItems = menuItems;
      renderTable();
      renderPagination();
      renderCategoryButtons();
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  // Function to render the table items
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
          </div>
        </td>
      `;
      tableBody.appendChild(row);
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

  // Function to attach event listeners to edit and delete buttons
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

  // Initial fetch of menu items
  fetchMenuItems();
});