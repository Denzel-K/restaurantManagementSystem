document.addEventListener("DOMContentLoaded", () => {
  let currentPage = 1;
  const itemsPerPage = 10;
  let orders = [];
  let filteredOrders = [];

  // Function to fetch orders from the server
  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      orders = await response.json();
      filteredOrders = orders;
      renderTable();
      renderPagination();
      renderCategoryButtons();
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchOrderData = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`); 
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching order data:', error);
      return null;
    }
  };

  // Function to render the table items
  const renderTable = () => {
    const tableBody = document.getElementById("orderHistoryBody");
    tableBody.innerHTML = "";
  
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredOrders.slice(startIndex, endIndex);
  
    itemsToDisplay.forEach(order => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td data-label="ID">${order.id}</td>
        <td data-label="Order Number">${order.order_number}</td>
        <td data-label="Total Price">$${order.total_price}</td>
        <td data-label="Payment Method">${order.payment_method}</td>
        <td data-label="Status">${order.status}</td>
        <td data-label="Created At">${new Date(order.created_at).toLocaleString()}</td>
        <td class="orderActions" data-label="Actions">
          <div class="actionBtnBox">
            <button class="view-order orderActioBtn" data-id="${order.id}">Edit</button>
            <button class="orderReceiptView" data-id="${order.id}">Receipt</button>
          </div>
        </td>
      `;
  
      // Append a hidden receipt box for each order
      const receiptBox = document.createElement('div');
      receiptBox.classList.add('receiptBox');
      receiptBox.setAttribute('id', `receiptBox-${order.id}`);
      receiptBox.style.display = 'none'; // Initially hidden
  
      // Receipt box layout with Print button
      receiptBox.innerHTML = `
        <div id="receiptDetails-${order.id}" class="receiptDetails official-receipt">
          <h3>FAMIKE PARK</h3>
          <p><strong>Total Price:</strong> $${order.total_price}</p>
          <p><strong>Payment Method:</strong> ${order.payment_method}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Date:</strong> ${order.created_at}</p>
          <hr>
          <button class="printReceiptBtn" data-id="${order.id}">Print Receipt</button>
        </div>

        <button class="closeReceiptBtn" data-id="${order.id}">Close</button>
      `;
  
      tableBody.appendChild(row);
      tableBody.appendChild(receiptBox);
    });
  
    attachOrderEventListeners();
  };  

  // Function to render pagination
  const renderPagination = () => {
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    document.getElementById("current-page").innerText = currentPage;

    document.getElementById("prev").disabled = currentPage === 1;
    document.getElementById("next").disabled = currentPage === totalPages;
  };

  // Function to render category buttons for filtering
  const renderCategoryButtons = () => {
    const paymentMethods = [...new Set(orders.map(order => order.payment_method))];
    const categoryButtonsDiv = document.getElementById("category-buttons");
    categoryButtonsDiv.innerHTML = ""; // Clear existing buttons

    paymentMethods.forEach(method => {
      const button = document.createElement("button");
      button.innerText = method;
      button.addEventListener("click", () => filterByPaymentMethod(method));
      categoryButtonsDiv.appendChild(button);
    });
  };

  // Function to filter orders by payment method
  const filterByPaymentMethod = (method) => {
    filteredOrders = orders.filter(order => order.payment_method === method);
    currentPage = 1; // Reset to the first page
    renderTable();
    renderPagination();
  };

  // Function to attach event listeners to the view buttons
  const attachOrderEventListeners = () => {
    // Attach event listeners to the Edit buttons
    document.querySelectorAll(".view-order").forEach(button => {
      button.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        showOrderDetails(id);
      });
    });

    // Attach event listeners to the Receipt buttons
    document.querySelectorAll(".orderReceiptView").forEach(button => {
      button.addEventListener("click", async (e) => {
        const orderId = e.target.getAttribute("data-id");
        const receiptBox = document.getElementById(`receiptBox-${orderId}`);
        const receiptDetails = document.getElementById(`receiptDetails-${orderId}`);

        // Show the receiptBox
        receiptBox.style.display = 'block';

        try {
          const response = await fetch(`/api/orders/${orderId}/receipt`);
          const data = await response.json();

          // Inject receipt data into the receiptDetails container
          receiptDetails.innerHTML =  `
            <h3>FAMIKE PARK</h3>

            <p><strong>Order Number: </strong> ${data.order_number}</p>
            <p><strong>Total Price: </strong> $${data.total_price}</p>
            <p><strong>Payment Method: </strong> ${data.payment_method}</p>
            <p><strong>Status:</strong> ${data.status}</p>
            <p><strong>Date:</strong> ${new Date(data.updated_at).toLocaleString()}</p>
            <hr>
            <button class="printReceiptBtn" data-id="${orderId}">Print Receipt</button>
          `;
        } 
        catch (error) {
          console.error("Error fetching receipt:", error);
          receiptDetails.innerHTML = "<p>Error loading receipt.</p>";
        }
      });
    });

  // Function to generate receipt as PDF
const generatePDF = async (orderId) => {
  const data = await fetchOrderData(orderId);
  if (!data) return; // Exit if no data is fetched

  const receiptContent = `
    <div class="receiptDetails" style="padding: 1.5rem 1rem; border-radius: 8px; max-width: 500px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h3 style="text-align: center; margin-bottom: 15px;">RMS</h3>
      <p><strong>Order Number:</strong> ${data.order_number}</p>
      <p><strong>Total Price:</strong> $${data.total_price}</p>
      <p><strong>Payment Method:</strong> ${data.payment_method}</p>
      <p><strong>Status:</strong> ${data.status}</p>
      <p><strong>Date:</strong> ${new Date(data.updated_at).toLocaleString()}</p>
      <hr style="margin: 15px 0;">
      <p class="thank-you" style="text-align: right; font-weight: bold;">Thank you for your order!</p>
    </div>
  `;

  const pdf = new jsPDF();

  pdf.html(receiptContent, {
    callback: function (doc) {
      doc.save(`receipt-${orderId}.pdf`);
    },
    x: 10,
    y: 10,
    html2canvas: {
      scale: 2
    }
  });
};

// Attach event listeners to the Print buttons inside the receipts
document.querySelectorAll(".printReceiptBtn").forEach(button => {
  button.addEventListener("click", (e) => {
    const orderId = e.target.getAttribute("data-id");
    generatePDF(orderId);
  });
});

  // Attach event listeners to the Close buttons inside the receipts
  document.querySelectorAll(".closeReceiptBtn").forEach(button => {
    button.addEventListener("click", (e) => {
      const orderId = e.target.getAttribute("data-id");
      const receiptBox = document.getElementById(`receiptBox-${orderId}`);

      // Hide the receiptBox
      receiptBox.style.display = 'none';
    });
  });
  };

  // Function to show order details
  const showOrderDetails = (orderId) => {
    const order = orders.find(o => o.id == orderId);
    const orderDetailsContainer = document.querySelector(".orderDetails");
    orderDetailsContainer.style.display = "block";
    document.querySelector('.orderHistory').style.display = "none";
    
    // Populate order details here (make it viewable but not editable)
    orderDetailsContainer.innerHTML = `
      <div class="backBox">
        <button id="back-to-orders">Back</button>
      </div>

      <h3>Order Details</h3>
      <p><strong>Order Number:</strong> ${order.order_number}</p>
      <p><strong>Total Price:</strong> $${order.total_price}</p>
      <p><strong>Payment Method:</strong> ${order.payment_method}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Created At:</strong> ${new Date(order.created_at).toLocaleString()}</p>

      <div class="satusUpdateBox">
        <label for="status">Status:</label>
        <div>
          <label><input type="radio" name="status" value="pending" ${order.status === 'pending' ? 'checked' : ''}> Pending</label>
          <label><input type="radio" name="status" value="completed" ${order.status === 'completed' ? 'checked' : ''}> Completed</label>
          <label><input type="radio" name="status" value="cancelled" ${order.status === 'cancelled' ? 'checked' : ''}> Cancelled</label>
        </div>
      </div>

      <button id="update-order-status" data-id="${order.id}">Update Status</button>
    `;

    document.getElementById("update-order-status").addEventListener("click", () => {
      updateOrderStatus(order.id);
    });

    document.getElementById("back-to-orders").addEventListener("click", () => {
      orderDetailsContainer.style.display = "none";
      document.querySelector('.orderHistory').style.display = "block";
    });
  };

  // Function to update order status
  const updateOrderStatus = async (orderId) => {
    const selectedStatus = document.querySelector('input[name="status"]:checked').value;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (response.ok) {
        alert("Order status updated successfully!");
        location.assign('/orders')
      } else {
        alert("Failed to update order status.");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  // Event listeners for pagination
  document.getElementById("prev").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      renderPagination();
    }
  });

  document.getElementById("next").addEventListener("click", () => {
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
      renderPagination();
    }
  });

  document.querySelector('.newOrderRedirect').addEventListener('click', () => {
    window.location.href = '/menu';
  })

  // Initial fetch of orders
  fetchOrders();
});