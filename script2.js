// =====================
// ELEMENT SELECTORS
// =====================
const tableBody = document.querySelector(".table-body");
const form = document.getElementById("machineForm");
const modal = document.querySelector("#large-modal");
const editSubmitBtn = document.querySelector("#editSubmitBtn");
const closeBtn = document.querySelector("#closeBtn");
const paginationContainer = document.querySelector("#paginationNumber");
const paginationCount = document.querySelector("#pagination-count");

let machineData = [];
let overlayElement = document.createElement("div");

// Pagination state
let currentPage = 1;
const rowPerPage = 10;
let totalPages = 1;

// Keep track of sort order
let currentSort = {
  column: null,
  order: "asc", // 'asc' or 'desc'
};

// =====================
// FETCH AND RENDER MACHINE LIST
// =====================
// fetchMachineList accepts optional offset but usually you call without args
// offset will default to (currentPage - 1) * rowPerPage
const fetchMachineList = async (offset = (currentPage - 1) * rowPerPage) => {
  try {
    const response = await fetch("http://localhost:3000/machines");
    machineData = await response.json();

    // default sort by id desc (if no explicit sort)
    if (!currentSort.column) {
      machineData.sort((a, b) => {
        // If id numeric-like, try numeric compare; otherwise string compare
        const aId = String(a.id).replace(/\D/g, "") || String(a.id);
        const bId = String(b.id).replace(/\D/g, "") || String(b.id);
        if (!isNaN(aId) && !isNaN(bId)) {
          return Number(bId) - Number(aId);
        }
        return String(b.id).localeCompare(String(a.id));
      });
    }

    // ensure currentPage is valid (useful after deletions)
    totalPages = Math.max(1, Math.ceil(machineData.length / rowPerPage));
    if (currentPage > totalPages) currentPage = totalPages;

    renderMachineTable(offset);
  } catch (error) {
    console.error("Error fetching machine data:", error);
    alert("Failed to fetch machine list.");
  }
};

const renderMachineTable = (offset = (currentPage - 1) * rowPerPage) => {
  const paginated = setDataAsPerPagination(offset);

  // render rows
  tableBody.innerHTML = "";
  paginated.forEach((machine) => {
    const rowHTML = `
      <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
        <th scope="row" class="px-4 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white">${machine.id}</th>
        <td class="px-4 py-2">${machine.machineName}</td>
        <td class="px-4 py-2">${machine.modalName}</td>
        <td class="px-4 py-2">${machine.lastService}</td>
        <td class="px-4 py-2">${machine.nextService}</td>
        <td class="px-4 py-2">${machine.technician}</td>
        <td class="px-4 py-2 text-left flex gap-4">
          <button type="button" data-id="${machine.id}" class="edit-btn text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-4 py-2">EDIT</button>
          <button type="button" data-id="${machine.id}" class="delete-btn text-white bg-red-400 hover:bg-red-500 font-medium rounded-lg text-sm px-4 py-2">DELETE</button>
        </td>
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", rowHTML);
  });

  // Attach edit/delete listeners (only to current elements)
  tableBody.querySelectorAll(".edit-btn").forEach((btn) => btn.addEventListener("click", editMachine));
  tableBody.querySelectorAll(".delete-btn").forEach((btn) => btn.addEventListener("click", deleteMachine));

  // Render pagination UI
  renderPaginationUI();
};

// =====================
// ADD NEW MACHINE
// =====================
const addMachineListData = async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  let newMachine = Object.fromEntries(formData.entries());
  newMachine.id = `M-${Math.random().toString(36).substring(2, 10)}`;

  try {
    const response = await fetch("http://localhost:3000/machines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMachine),
    });

    if (!response.ok) throw new Error("Failed to add machine.");

    alert("✅ Machine added successfully!");
    form.reset();

    // After add, go to last page to show the new entry (optional)
    totalPages = Math.ceil((machineData.length + 1) / rowPerPage);
    currentPage = totalPages;
    await fetchMachineList();
  } catch (error) {
    console.error(error);
    alert("❌ Failed to add machine.");
  }
};

// =====================
// EDIT MACHINE
// =====================
const editMachine = (e) => {
  const machineId = e.target.dataset.id;
  const machine = machineData.find((m) => m.id === machineId);
  if (!machine) return;

  // Show modal
  modal.classList.add("flex");
  modal.classList.remove("hidden");
  overlayElement.className = "model-overlay bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40";
  document.body.appendChild(overlayElement);

  // Populate form
  form.elements["machineName"].value = machine.machineName || "";
  form.elements["modalName"].value = machine.modalName || "";
  form.elements["lastService"].value = machine.lastService || "";
  form.elements["nextService"].value = machine.nextService || "";
  form.elements["technician"].value = machine.technician || "";

  // Store editing id
  form.dataset.editingId = machineId;
};

// =====================
// UPDATE MACHINE
// =====================
const updateMachineData = async (e) => {
  e.preventDefault();
  const id = form.dataset.editingId;
  if (!id) return alert("No machine selected for update.");

  const updatedMachine = {
    machineName: form.elements["machineName"].value.trim(),
    modalName: form.elements["modalName"].value.trim(),
    lastService: form.elements["lastService"].value,
    nextService: form.elements["nextService"].value,
    technician: form.elements["technician"].value.trim(),
  };

  try {
    const response = await fetch(`http://localhost:3000/machines/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedMachine),
    });

    if (!response.ok) throw new Error("Failed to update machine.");

    alert("✅ Machine updated successfully!");
    closeModal();

    // keep same page where update happened
    await fetchMachineList();
  } catch (error) {
    console.error(error);
    alert(`❌ Update failed: ${error.message}`);
  }
};

// =====================
// DELETE MACHINE
// =====================
const deleteMachine = async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  const confirmed = window.confirm("Are you sure you want to delete this machine?");
  if (!confirmed) return;

  try {
    const response = await fetch(`http://localhost:3000/machines/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete machine.");

    alert("✅ Machine deleted successfully!");

    // After deletion, refetch and ensure page indexes correct
    await fetchMachineList();
  } catch (error) {
    console.error(error);
    alert("❌ Failed to delete machine.");
  }
};

// ================== 
// Setup table for sorting
// ==================
const setupTableSorting = () => {
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const column = th.dataset.sort;

      // Toggle order if same column clicked
      if (currentSort.column === column) {
        currentSort.order = currentSort.order === "asc" ? "desc" : "asc";
      } else {
        currentSort.column = column;
        currentSort.order = "asc";
      }

      sortTable(column, currentSort.order);
    });
  });
};

const sortTable = (column, order) => {
  machineData.sort((a, b) => {
    let valA = a[column] ?? "";
    let valB = b[column] ?? "";

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return order === "asc" ? -1 : 1;
    if (valA > valB) return order === "asc" ? 1 : -1;
    return 0;
  });

  // After sorting, show the first page (or keep current page)
  currentPage = 1;
  fetchMachineList();
};

// =====================
// PAGINATION HELPERS
// =====================
const setDataAsPerPagination = (offset = (currentPage - 1) * rowPerPage) => {
  totalPages = Math.max(1, Math.ceil(machineData.length / rowPerPage));
  const start = offset;
  const end = start + rowPerPage;
  const paginatedData = machineData.slice(start, end);

  // update the "Showing X of Y" text (clamp end to length)
  const showingStart = machineData.length === 0 ? 0 : start + 1;
  const showingEnd = Math.min(end, machineData.length);
  paginationCount.innerHTML = ` Showing <span class="font-semibold text-heading">${showingStart}</span> of <span class="font-semibold text-heading">${showingEnd}</span>`;

  return paginatedData;
};

const renderPaginationUI = () => {
  // build pagination markup: Prev, pages..., Next
  let html = "";

  // Previous
  html += `
    <li>
      <a href="#" data-action="prev" class="flex items-center justify-center text-body bg-neutral-secondary-medium !rounded-lg box-border hover:bg-neutral-tertiary-medium hover:text-heading font-medium rounded-lg text-sm px-3 h-9 focus:outline-none ${currentPage === 1 ? "opacity-50 pointer-events-none" : ""} rounded-r">
        Previous
      </a>
    </li>
  `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const activeClasses = i === currentPage ? "bg-blue-600 text-white border-blue-600" : "";
    html += `
      <li >
        <a href="#" data-page="${i}" class="flex items-center justify-center text-body bg-neutral-secondary-medium box-border hover:bg-neutral-tertiary-medium hover:text-heading font-medium text-sm w-9 h-9 focus:outline-none ${activeClasses}">
          ${i}
        </a>
      </li>
    `;
  }

  // Next
  html += `
    <li>
      <a href="#" data-action="next" class="flex items-center justify-center text-body bg-neutral-secondary-medium box-border hover:bg-neutral-tertiary-medium hover:text-heading font-medium rounded-e-base text-sm px-3 h-9 focus:outline-none rounded-lg rounded-l ${currentPage === totalPages ? "opacity-50 pointer-events-none" : ""}">
        Next
      </a>
    </li>
  `;

  paginationContainer.innerHTML = html;
};

// Use event delegation for pagination clicks
paginationContainer.addEventListener("click", (ev) => {
  ev.preventDefault();
  const anchor = ev.target.closest("a");
  if (!anchor) return;

  const page = anchor.dataset.page;
  const action = anchor.dataset.action;

  if (page) {
    const pageNum = Number(page);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      currentPage = pageNum;
      fetchMachineList((currentPage - 1) * rowPerPage);
    }
  } else if (action === "prev") {
    if (currentPage > 1) {
      currentPage--;
      fetchMachineList((currentPage - 1) * rowPerPage);
    }
  } else if (action === "next") {
    if (currentPage < totalPages) {
      currentPage++;
      fetchMachineList((currentPage - 1) * rowPerPage);
    }
  }
});

// =====================
// CLOSE MODAL
// =====================
const closeModal = () => {
  modal.classList.remove("flex");
  modal.classList.add("hidden");

  if (overlayElement && document.body.contains(overlayElement)) {
    overlayElement.remove();
  }

  form.reset();
  delete form.dataset.editingId;
};

// =====================
// EVENT LISTENERS
// =====================
document.addEventListener("DOMContentLoaded", async () => {
  // Single initialization: fetch, setup sorting
  await fetchMachineList();
  setupTableSorting();
});

// Form submit: either add or update
form.addEventListener("submit", (e) => {
  if (form.dataset.editingId) {
    updateMachineData(e);
  } else {
    addMachineListData(e);
  }
});

// Modal close
closeBtn.addEventListener("click", closeModal);

// If you have an explicit editSubmitBtn inside modal form (optional)
if (editSubmitBtn) {
  editSubmitBtn.addEventListener("click", (e) => {
    // submit the form programmatically if needed
    form.requestSubmit();
  });
}
