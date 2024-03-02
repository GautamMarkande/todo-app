let SKIP = 0;
window.onload = generateTodos();
function generateTodos(){
   
    axios.get(`/read-item?skip=${SKIP}`) // get the first page of todos from the server
    .then((response)=>{
        console.log(response.data.data)
        let todos = response.data.data;
            
        document.getElementById('item_list').innerHTML = ""
        document.getElementById('item_list').insertAdjacentHTML(
        'beforeend',
        todos.map((item)=>{

            return  `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
            <span class="item-text"> ${item.todo}</span>
            <div>
            <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
            <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
            </div>
            </li>`;
        
            }).join("")
    )
    }).catch(Error=>{
        console.log(Error);
        alert(Error)
    })

}
document.addEventListener('click',function(event){
  //edit
//   console.log( event.target)
  if (event.target.classList.contains('edit-me')) {
   const id = event.target.getAttribute('data-id')
   const newData = prompt("Enter new Data")
    axios.post('/edit-item',{id,newData})
    .then((res)=>{
        alert(res.data.message)
        generateTodos()
    }).catch(err=>{
        alert(res.data.message)
    })
  }
  else if(event.target.classList.contains( "delete-me")){
    const id = event.target.getAttribute('data-id')
    axios.post('/delete-item',{id})
    .then((res)=>{
        //  console.log(res)
        generateTodos()
        alert(res.data)
    })
    .catch(Err=>{
        console.log(Err)
        alert(err)
    })
  }
  else if(event.target.classList.contains('add_item')){
    const todo = document.getElementById('create_field').value;
    axios.post('/create-item',{todo})
    .then((res)=>{
        alert(res.data.message)
        generateTodos();
        document.getElementById('create_field').value = ""
    })
    .catch((error)=>alert(res.data.message, error))
    document.getElementById('create_field').value = ""
  }
  else if(event.target.classList.contains('Show_more')){
    console.log("object")
    axios.get(`/read-item?skip=${SKIP}`) // get the first page of todos from the server
    .then((response)=>{
        console.log(response.data.data)
        let todos = response.data.data;
            SKIP+=todos.length
        document.getElementById('item_list').innerHTML = ""
        document.getElementById('item_list').insertAdjacentHTML(
        'beforeend',
        todos.map((item)=>{

            return  `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
            <span class="item-text"> ${item.todo}</span>
            <div>
            <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
            <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
            </div>
            </li>`;
        
            }).join("")
    )
    }).catch(Error=>{
        console.log(Error);
        alert(Error)
    })
  }
})