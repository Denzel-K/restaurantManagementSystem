let currentPage = 1;
const itemsPerPage = 10;

async function fetchUsers(page) {
  const response = await fetch(`/api/users?page=${page}&limit=${itemsPerPage}`);
  const data = await response.json();
  renderTable(data.users);
  updatePagination(data.totalPages);
}

function renderTable(users) {
  const tableBody = document.getElementById("userAccountsBody");
  tableBody.innerHTML = '';

  users.forEach(user => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="Id">${user.id}</td>
      <td data-label="Name">${user.name}</td>
      <td data-label="Email">${user.email}</td>
      <td data-label="Role ID">${user.role_id}</td>
      <td data-label="Phone">${user.phone}</td>
      <td data-label="Created At">${new Date(user.created_at).toLocaleString()}</td>
      <td data-label="Actions">
        <div class="accountsActionBtns">
          <button class="edit-btn" data-id="${user.id}">Edit</button>
          <button class="delete-btn" data-id="${user.id}">Remove</button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });

  attachEventListeners();
}

function updatePagination(totalPages) {
  document.getElementById("prev").disabled = currentPage === 1;
  document.getElementById("next").disabled = currentPage === totalPages;
  document.getElementById("current-page").innerText = currentPage;
}

document.getElementById("prev").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    fetchUsers(currentPage);
  }
});

document.getElementById("next").addEventListener("click", () => {
  currentPage++;
  fetchUsers(currentPage);
});

document.querySelector('.backToUserAccounts').addEventListener('click', () => {
  document.querySelector(".accountDetails").style.display = "none";
  document.querySelector(".userAccounts").style.display = "block";
})

function attachEventListeners() {
  document.querySelectorAll(".edit-btn").forEach(button => {
    button.addEventListener("click", handleEdit);
  });
  
  document.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", handleDelete);
  });
}

function handleEdit(event) {
  const userId = event.target.getAttribute("data-id");
  document.querySelector(".accountDetails").style.display = "block";
  document.querySelector(".userAccounts").style.display = "none";
  loadUserDetails(userId);
}

function handleDelete(event) {
  const userId = event.target.getAttribute("data-id");

  if (confirm("Are you sure you want to delete this user?")) {
    deleteUser(userId);
  }
}

async function loadUserDetails(userId) {
  const response = await fetch(`/api/users/${userId}`);
  const user = await response.json();

  document.querySelector(".userDetails").innerHTML = `
    <form id="editUserForm">
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Phone:</strong> ${user.phone}</p>
      <div class="roleIdField">
        <label>Role ID:</label>
        <input type="number" name="role_id" value="${user.role_id}">
      </div>

      <button class="updateRoleId" type="submit">Update Role</button>
    </form>
  `;

  document.getElementById("editUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const role_id = e.target.role_id.value;
    await updateUser(userId, role_id);
  });
}

async function updateUser(userId, role_id) {
  await fetch(`/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role_id })
  });
  location.reload();
}

async function deleteUser(userId) {
  await fetch(`/api/users/${userId}`, { method: "DELETE" });
  location.reload();
}

// Initial fetch
fetchUsers(currentPage);