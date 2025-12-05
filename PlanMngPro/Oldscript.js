
const tableRow = document.querySelector(".table-body");
const form  =  document.getElementById("machineForm");
const modal = document.querySelector("#large-modal")
const EditSubmitBtn = document.querySelector("#editSubmitBtn")
const CloseBtn = document.querySelector("#closeBtn")
const DeleteBtns = document.querySelectorAll(".delete-btn")
let machineData = []
let overlyElement = document.createElement("div");



const getMachineListData = async () => {
     tableRow.innerHTML = ''
     const response = await fetch("http://localhost:3000/machines");
      machineData = await response.json();
     
     let htmlTableRow = ''
     machineData.sort((a,b) => b.id - a.id)

     machineData.forEach(machine => {
     htmlTableRow = `<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                    <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                       ${machine.id}
                    </th>
                    <td class="px-6 py-4">
                         ${machine.machineName}
                    </td>
                    <td class="px-6 py-4">
                        ${machine.modalName}
                    </td>
                    <td class="px-6 py-4">
                          ${machine.lastService}

                    </td>
                     <td class="px-6 py-4">
                         ${machine.nextService}
                    </td>
                      <td class="px-6 py-4">
                         ${machine.technician}
                    </td>
                    
                    <td class="px-6 py-4 text-left flex gap-8">
                      <button type="button" data-id="${machine.id}" class="edit-btn text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">EDIT</button>

                     <button type="button" data-id="${machine.id}" class="delete-btn text-white bg-red-400 hover:bg-red-400 focus:ring-4 focus:ring-red-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-400 dark:hover:bg-red-400 focus:outline-none dark:focus:ring-red-400">Delete</button>
                    </td>
                  
                </tr>`
                    //  console.log(machine)
         tableRow.insertAdjacentHTML("afterbegin", htmlTableRow)


     });
    
     document.querySelectorAll('.edit-btn').forEach(btn => {
         btn.addEventListener("click", editMachineList)
    })
   
     document.querySelectorAll('.delete-btn').forEach(btn => {
         btn.addEventListener("click", deleteMachine)
    })

}




const addMachineListData = (e) => {
    e.preventDefault();
 
    const formData = new FormData(form);
    let machineData = Object.fromEntries(formData.entries())
    let newMachineId = `M-${Math.random().toString(36).substring(2, 10)}`;
    machineData.id = newMachineId

    postMachineData(machineData)
}

const postMachineData = async (data) => {
  await  fetch("http://localhost:3000/machines", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then((res) => {
        return res.json()
    }).then((data) => {
        alert("Machine Added Succefully")
    }).catch((e) => {
        alert(e)
    })
}


const editMachineList = (e) => {
    modal.classList.add("flex");
    modal.classList.remove("hidden")
    modal.setAttribute('role', 'dialog');
   
    overlyElement.className = 'model-overly bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40';
    document.body.appendChild(overlyElement)
    EditSubmitBtn.textContent = 'Edit User'


    let uniqMid = e.target.dataset.id;
    let editMachine  = machineData.find(machine => machine.id == uniqMid)
    
    
    if (editMachine) {
        form.elements['machineName'].value = editMachine.machineName || '';
        form.elements['modalName'].value = editMachine.modalName || '';
        form.elements['lastService'].value = editMachine.lastService || '';
        form.elements['nextService'].value = editMachine.nextService || '';
        form.elements['technician'].value = editMachine.technician || '';
    } else {
        form.elements['machineName'].value = '';
        form.elements['modalName'].value = '';
        form.elements['lastService'].value = '';
        form.elements['nextService'].value = '';
        form.elements['technician'].value = '';
    }
    
    // Optional: store ID so we know which record to update later
    form.dataset.editingId = uniqMid;

    // console.log("Editing machine:", editMachine);
   
    EditSubmitBtn.addEventListener("click", onUpdateMachineData)

}

const onUpdateMachineData = async (event) => {
    event.preventDefault();

    const id = form.dataset.editingId;
    if (!id) {
        alert("No machine ID found for update.");
        return;
    }

    const updatedMachine = {
        machineName: form.elements['machineName'].value.trim(),
        modalName: form.elements['modalName'].value.trim(),
        lastService: form.elements['lastService'].value,
        nextService: form.elements['nextService'].value,
        technician: form.elements['technician'].value.trim(),
    };

    fetch(`http://localhost:3000/machines/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMachine),
    })
        .then(async (res) => {
            if (!res.ok) {
                // Explicitly handle HTTP errors
                return res.text().then((msg) => {
                    throw new Error(`Error ${res.status}: ${msg}`);
                });
            }
            return res.json();
        })
        .then((data) => {
            alert("✅ Machine updated successfully!");
            console.log("Updated machine:", data);

            // Optionally close modal or refresh list
            modal.classList.remove("flex");
            modal.classList.add("hidden");
            

        })
        .catch((error) => {
            console.error("Update failed:", error);
            alert(`❌ Update failed: ${error.message}`);
        });
};



const closeModel = () => {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
    if(overlyElement && document.body.contains(overlyElement)) {
      overlyElement.remove()
    }
          form.elements['machineName'].value =   '';
    form.elements['modalName'].value ='';
    form.elements['lastService'].value =  '';
    form.elements['nextService'].value =  '';
    form.elements['technician'].value =  '';
     
}


const deleteMachine = (e) => {debugger
    let uniqMid = e.target.dataset.id;

    if(!uniqMid) return ;

 // ✅ Ask user for confirmation
    const confirmDelete = window.confirm("Are you sure you want to delete this machine?");
    if (!confirmDelete) return; // user clicked "Cancel", stop here
    // remove machine from backend end

    fetch(`http://localhost:3000/machines/${uniqMid}`, {
        method:'DELETE',
    }).then(res => {
        if(!res.ok) throw new Error(`Failed to delete machine with id ${uniqMid}`);
        return res.json()
    }).then((res) => {debugger
       alert("Machine deleted successfully!");

    }).catch(err => {
        console.error(err);
        alert("Failed to delete machine.");
    });
}






document.addEventListener("DOMContentLoaded", getMachineListData)
form.addEventListener("submit", addMachineListData);
CloseBtn.addEventListener("click", closeModel);
