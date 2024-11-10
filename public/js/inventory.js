let currentPage = 1;
let itemsPerPage = 10;
let inventoryData = [];
let selectedCategory = '';
let userRoleId;

// Function to fetch userInfo(check role Id for conditional rendering)
const fetchUserInfo = async () => {
  try {
    const response = await fetch('/api/user-info');
    const data = await response.json();
    userRoleId = data.roleId;


    //Conditional rendering
    if((userRoleId === 3) || (userRoleId === 4)){
      document.querySelector('#newBoxConditional').style.display = 'none';
      document.querySelector('.action_col_head').style.display = 'none';
    }
  } 
  catch (error) {
    console.error("Error fetching user info:", error);
  }
};

// Fetch inventory data from the server
async function fetchInventory() {
  try {
    const response = await fetch('/api/inventory');
    inventoryData = await response.json();
    renderCategoryButtons();
    renderInventoryTable();
  } 
  catch (error) {
    console.error('Error fetching inventory:', error);
  }
}

// Dynamically render category buttons
function renderCategoryButtons() {
  const categoryButtonsContainer = document.getElementById('category-buttons');
  categoryButtonsContainer.innerHTML = '';

  const categories = [...new Set(inventoryData.map(item => item.category))];

  const allButton = document.createElement('button');
  allButton.textContent = 'All';
  allButton.addEventListener('click', () => {
    selectedCategory = '';
    currentPage = 1;
    renderInventoryTable();
  });
  categoryButtonsContainer.appendChild(allButton);

  categories.forEach(category => {
    const button = document.createElement('button');
    button.textContent = category;
    button.addEventListener('click', () => {
      selectedCategory = category;
      currentPage = 1;
      renderInventoryTable();
    });
    categoryButtonsContainer.appendChild(button);
  });
}

// Render inventory table with pagination and filtering
function renderInventoryTable() {
  const tableBody = document.getElementById('inventory-table-body');
  tableBody.innerHTML = '';

  const filteredData = filterInventoryByCategory();
  const paginatedData = paginateInventory(filteredData);

  paginatedData.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td data-label="ID">${item.id}</td>
      <td data-label="Item Name">${item.item_name}</td>
      <td data-label="Quantity">${item.quantity}</td>
      <td data-label="Unit Price">${item.unit_price}</td>
      <td data-label="Reorder Level">${item.reorder_level}</td>
      ${userRoleId === 1 || userRoleId === 2 ? `<td data-label="Action"><button class="actionBtn" onclick="showItemDetails(${item.id})">View</button></td>`: ''}
    `;
    tableBody.appendChild(row);
  });

  document.getElementById('current-page').textContent = currentPage;

  // Update pagination button states
  updatePaginationButtons(filteredData.length);
}

// Filter inventory by selected category
function filterInventoryByCategory() {
  if (!selectedCategory) {
    return inventoryData; // If no category selected, show all items
  }
  return inventoryData.filter(item => item.category === selectedCategory);
}

// Paginate the filtered inventory data
function paginateInventory(filteredData) {
  const start = (currentPage - 1) * itemsPerPage;
  return filteredData.slice(start, start + itemsPerPage);
}

// Update pagination button states based on the filtered data length
function updatePaginationButtons(filteredCount) {
  document.getElementById('prev').disabled = currentPage === 1;
  document.getElementById('next').disabled = currentPage * itemsPerPage >= filteredCount;
}

// Date formating
function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

// Show item details
function showItemDetails(itemId) {
  const item = inventoryData.find(item => item.id === itemId);

  if(item) {     
    document.querySelector('.stock').style = 'display: none';
    document.querySelector('.item-details').style = 'display: block';

    document.getElementById('item-name').textContent = item.item_name;
    document.getElementById('item-category').textContent = item.category;
    document.getElementById('item-quantity').value = item.quantity;
    document.getElementById('item-unit-price').value = item.unit_price;
    document.getElementById('item-reorder-level').value = item.reorder_level;
    document.getElementById('item-created-at').textContent = formatDate(item.created_at);

    // Update item
    document.getElementById('update-item').onclick = async () => {
      const updatedData = {
        quantity: document.getElementById('item-quantity').value,
        unit_price: document.getElementById('item-unit-price').value,
        reorder_level: document.getElementById('item-reorder-level').value,
      };

      try {
        const response = await fetch(`/api/inventory/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedData),
        });

        if (response.ok) {
          alert('Item updated successfully');
          fetchInventory();
        } 
        else {
          alert('Failed to update item');
        }
      } 
      catch (error) {
        console.error('Error updating item:', error);
      }
    };

    // Delete item
    document.getElementById('delete-item').onclick = async () => {
      if (confirm('Are you sure you want to delete this item?')) {
        try {
          const response = await fetch(`/api/inventory/${itemId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            alert('Item deleted successfully');
            fetchInventory(); 
          } 
          else {
            alert('Failed to delete item');
          }
        } 
        catch (error) {
          console.error('Error deleting item:', error);
        }
      }
    };
  }
}
  
// Back to stock list
document.getElementById('back-to-stock').addEventListener('click', () => {
  document.querySelector('.stock').style = 'display: block';
  document.querySelector('.item-details').style = 'display: none';
});

// Show add-item form
function revealAddNewItemForm(){
  document.querySelector('.stock').style = 'display: none';
  document.querySelector('.addItem').style = 'display: block';
}


//Back to stock from addForm
document.getElementById('back-to-stock2').addEventListener('click', () => {
  document.querySelector('.stock').style = 'display: block';
  document.querySelector('.addItem').style = 'display: none';
});

// Pagination buttons
document.getElementById('prev').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderInventoryTable();
  }
});

document.getElementById('next').addEventListener('click', () => {
  if (currentPage * itemsPerPage < inventoryData.length) {
    currentPage++;
    renderInventoryTable();
  }
});

// Initial fetch of inventory items and role_id check
const initialize = async () => {
  await fetchUserInfo();
  await fetchInventory();
};

initialize();


// Function to handle form submissions
const handleFormSubmission = async (formId, url, method, bodyData, successMessage, errorMessage) => {
  try {
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });

    if (response.ok) {
      alert(successMessage);
      location.assign('/inventory');
    } 
    else {
      alert(errorMessage);
    }
  } catch (error) {
    console.error(errorMessage, error);
  }
};

// Add item form submission
document.getElementById('add-item-form').onsubmit = async (event) => {
  event.preventDefault();
  const newItem = {
    item_name: document.getElementById('item_name').value,
    category: document.getElementById('category').value,
    quantity: document.getElementById('quantity').value,
    unit_price: document.getElementById('unit-price').value,
    reorder_level: document.getElementById('reorder-level').value
  };

  console.log(newItem);

  await handleFormSubmission(
    'add-item-form',
    '/api/addItem',
    'POST',
    newItem,
    'Item added successfully!',
    'Failed to add item.'
  );
};

// Clear add item form
document.getElementById('clear-form').onclick = () => {
  document.getElementById('add-item-form').reset();
};

const loadItemDetails = (item) => {
  document.getElementById('item-id').value = item.id;
  document.getElementById('item-name').textContent = item.name;
  document.getElementById('item-category').textContent = item.category;
  document.getElementById('item-created-at').textContent = item.created_at;
  document.getElementById('item-quantity').value = item.quantity;
  document.getElementById('item-unit-price').value = item.unit_price;
  document.getElementById('item-reorder-level').value = item.reorder_level;
  document.getElementById('item-notes').value = item.special_notes;
};

// Update item logic
document.getElementById('update-item').onclick = async () => {
  const updatedItem = {
    quantity: document.getElementById('item-quantity').value,
    unit_price: document.getElementById('item-unit-price').value,
    reorder_level: document.getElementById('item-reorder-level').value,
    special_notes: document.getElementById('item-notes').value,
  };

  const itemId = document.getElementById('item-id').value;

  await handleFormSubmission(
    'item-form',
    `/api/inventory/${itemId}`,
    'PUT',
    updatedItem,
    'Item updated successfully!',
    'Failed to update item.'
  );

  location.assign('/inventory');
};

// Delete item logic
document.getElementById('delete-item').onclick = async () => {
  const itemId = document.getElementById('item-id').value;

  if (confirm('Are you sure you want to delete this item?')) {
    await handleFormSubmission(
      'item-form',
      `/api/inventory/${itemId}`,
      'DELETE',
      null,
      'Item removed successfully!',
      'Failed to remove item.'
    );

    location.assign('/inventory');
  }
};