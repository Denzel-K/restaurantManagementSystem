// On page load, get the item ID from the URL
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('itemId');

// Fetch item details based on itemId
async function fetchItemDetails() {
  try {
    const response = await fetch(`/api/menu/${itemId}`);
    
    // Check if the response is OK (status in the range 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const item = await response.json();
    // Populate the form with item details
    document.getElementById('item-name').textContent = item.item_name;
    document.getElementById('item-description').textContent = item.description;
    document.getElementById('item-price').textContent = item.price;
    document.getElementById('item-category').textContent = item.category;
  } 
  catch (error) {
    console.error('Error fetching item details:', error);
  }
}

// Call the function to fetch item details
fetchItemDetails();

// Handle form submission
document.getElementById('order-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const quantity = document.getElementById('quantity').value;

  // Validate quantity
  if (quantity <= 0) {
    alert('Please enter a valid quantity.');
    return;
  }

  // Send order details to the server
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemId: itemId,
        quantity: quantity
      }),
    });

    if (response.ok) {
      alert('Order placed successfully!');
      window.location.href = '/menu';
    } 
    else {
      console.error('Failed to place order:', response.statusText);
    }
  } catch (error) {
    console.error('Error placing order:', error);
  }
});
