// =====================
// ELEMENT SELECTORS
// =====================
const tableBody = document.querySelector(".table-body");
const form = document.getElementById("machineForm");
const modal = document.querySelector("#large-modal");
const editSubmitBtn = document.querySelector("#editSubmitBtn");
const closeBtn = document.querySelector("#closeBtn");

let machineData = [];
let overlayElement = document.createElement("div");
let currentPage = 1;
const rowPerPage = 5
let totalPages;

// =====================

// Keep track of pagination code

// =====================





// ==================
// Keep track of sort order
// ==================


let currentSort = {
    column : null,
    order:'asc',  // 'asc' or 'desc'
}



// =====================
// FETCH AND RENDER MACHINE LIST
// =====================
const fetchMachineList = async () => {
    try {
        const response = await fetch("http://localhost:3000/machines");
        machineData = await response.json();
        machineData.sort((a, b) => b.id - a.id); // Default sort by ID desc
        
        renderMachineTable(); // Render once fetched
    } catch (error) {
        console.error("Error fetching machine data:", error);
        alert("Failed to fetch machine list.");
    }
};



const renderMachineTable = () => {debugger
    tableBody.innerHTML = '';

    machineData.forEach(machine => {
        const rowHTML = `
            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                <th scope="row" class="px-4 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white">${machine.id}</th>
                <td class="px-4 py-2">${machine.machineName}</td>
                <td class="px-4 py-2">${machine.modalName}</td>
                <td class="px-4 py-2">${machine.lastService}</td>
                <td class="px-4 py-2">${machine.nextService}</td>
                <td class="px-4 py-2">${machine.technician}</td>
                <td class="px-4 py-2 text-left flex gap-8">
                    <button type="button" data-id="${machine.id}" class="edit-btn text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5">EDIT</button>
                    <button type="button" data-id="${machine.id}" class="delete-btn text-white bg-red-400 hover:bg-red-500 font-medium rounded-lg text-sm px-5 py-2.5">DELETE</button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", rowHTML);
    });



    // Reattach edit/delete listeners
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener("click", editMachine));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener("click", deleteMachine));
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMachine)
        });

        if (!response.ok) throw new Error("Failed to add machine.");

        alert("✅ Machine added successfully!");
        form.reset();
        fetchMachineList(); // Refresh list

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
    const machine = machineData.find(m => m.id === machineId);

    if (!machine) return;

    // Show modal
    modal.classList.add("flex");
    modal.classList.remove("hidden");
    overlayElement.className = 'model-overlay bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40';
    document.body.appendChild(overlayElement);

    // Populate form
    form.elements['machineName'].value = machine.machineName || '';
    form.elements['modalName'].value = machine.modalName || '';
    form.elements['lastService'].value = machine.lastService || '';
    form.elements['nextService'].value = machine.nextService || '';
    form.elements['technician'].value = machine.technician || '';

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
        machineName: form.elements['machineName'].value.trim(),
        modalName: form.elements['modalName'].value.trim(),
        lastService: form.elements['lastService'].value,
        nextService: form.elements['nextService'].value,
        technician: form.elements['technician'].value.trim()
    };

    try {
        const response = await fetch(`http://localhost:3000/machines/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedMachine)
        });

        if (!response.ok) throw new Error("Failed to update machine.");

        alert("✅ Machine updated successfully!");
        closeModal();
        fetchMachineList();

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
        const response = await fetch(`http://localhost:3000/machines/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error("Failed to delete machine.");

        alert("✅ Machine deleted successfully!");
        fetchMachineList();

    } catch (error) {
        console.error(error);
        alert("❌ Failed to delete machine.");
    }
};




// ================== 
// Setup table for sorting
// =================

const setupTableSorting = () => {
    document.querySelectorAll("th[data-sort]").forEach(th => {
        th.addEventListener("click", () => {
            const column = th.dataset.sort;
            console.log(column)
            // Toogle order if same column clicked
            if(currentSort.column === column) {
                currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc'
            }else {
                currentSort.column = column;
                currentSort.order = 'asc'
            }

            sortTable(column, currentSort.order)
        })
    })
}


const sortTable = (column,order) => {
    machineData.sort((a, b) => {
        let valA = a[column] || '';
        let valB = b[column] || '';


        // Convert to lower case  for string comparision
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === ' string') valB = valB.toLowerCase();

        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    })

    // Re-render table after sorting
    displayTable()
    console.log(machineData)
}

const setupPaginationTable = () => {
    totalPages = Math.ceil(machineData.length / rowPerPage)  //  20 / 5 = 4
    displayTable(totalPages)
    console.log(totalPages)
}

const  displayTable  = (page)  => {debugger  
    const start = (page - 1) * rowPerPage;    //  (4 - 1) * 5 = 3 * 15  start = 15

    const end = start + rowPerPage;           //  15 + 5 = 20  end  = 20
    const paginatedData =  machineData.slice(start, end);            

    const renderMachineTable = (data) => {
        tableBody.innerHTML = '';

        data.forEach(machine => {
            const rowHTML = `
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                    <th scope="row" class="px-4 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white">${machine.id}</th>
                    <td class="px-4 py-2">${machine.machineName}</td>
                    <td class="px-4 py-2">${machine.modalName}</td>
                    <td class="px-4 py-2">${machine.lastService}</td>
                    <td class="px-4 py-2">${machine.nextService}</td>
                    <td class="px-4 py-2">${machine.technician}</td>
                    <td class="px-4 py-2 text-left flex gap-8">
                        <button type="button" data-id="${machine.id}" class="edit-btn text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5">EDIT</button>
                        <button type="button" data-id="${machine.id}" class="delete-btn text-white bg-red-400 hover:bg-red-500 font-medium rounded-lg text-sm px-5 py-2.5">DELETE</button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML("beforeend", rowHTML);
        });

        // Reattach edit/delete listeners
        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener("click", editMachine));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener("click", deleteMachine));
    };

    renderMachineTable(paginatedData); // <--- pass only paginated data
}


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
document.addEventListener("DOMContentLoaded", () => {
    fetchMachineList().then(() => setupTableSorting());
});

document.addEventListener("DOMContentLoaded",() => {
    fetchMachineList().then(() => setupPaginationTable())
})


form.addEventListener("submit", (e) => {
    if (form.dataset.editingId) {
        updateMachineData(e);
    } else {
        addMachineListData(e);
    }
});
closeBtn.addEventListener("click", closeModal);











