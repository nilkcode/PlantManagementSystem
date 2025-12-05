

const loadComponent = async (id, file) => {debugger
    try {
      const response = await fetch(file);
      if(!response.ok) {
        throw new Error (`Count not load ${file}`);
      }
       const html= await response.text()
       document.getElementById(id).innerHTML = html

    }catch(error) {
      console.error(error)
    }
}

window.addEventListener('DOMContentLoaded',() => {
    loadComponent("header", "./layouts/header.html");
  loadComponent("sidebar", "./layouts/sidebar.html");
  loadComponent("footer", "./layouts/footer.html");
})

