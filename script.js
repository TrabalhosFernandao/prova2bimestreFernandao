document.addEventListener('DOMContentLoaded', function() {
    const cepInput = document.getElementById('cep-input');
    const searchBtn = document.getElementById('search-btn');
    const newSearchBtn = document.getElementById('new-search-btn');
    const resultContainer = document.getElementById('result-container');
    const errorMessage = document.getElementById('error-message');
    
    //Resultado :
    const cepResult = document.getElementById('cep-result');
    const logradouroResult = document.getElementById('logradouro-result');
    const complementoResult = document.getElementById('complemento-result');
    const bairroResult = document.getElementById('bairro-result');
    const localidadeResult = document.getElementById('localidade-result');
    const ufResult = document.getElementById('uf-result');
    const ibgeResult = document.getElementById('ibge-result');
    const giaResult = document.getElementById('gia-result');
    const dddResult = document.getElementById('ddd-result');
    const siafiResult = document.getElementById('siafi-result');
    
    //Máscara para o CEP (opcional)
    cepInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        e.target.value = value;
    });
    
    //Buscar CEP
    searchBtn.addEventListener('click', buscarCEP);
    cepInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarCEP();
        }
    });
    
    //Nova consulta
    newSearchBtn.addEventListener('click', function() {
        resultContainer.style.display = 'none';
        errorMessage.style.display = 'none';
        cepInput.value = '';
        cepInput.focus();
    });
    
    function buscarCEP() {
        const cep = cepInput.value.trim();
        
        if (cep.length !== 8) {
            mostrarErro('CEP deve conter 8 dígitos');
            return;
        }
        
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro na requisição');
                }
                return response.json();
            })
            .then(data => {
                if (data.erro) {
                    mostrarErro('CEP não encontrado');
                } else {
                    exibirResultado(data);
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                mostrarErro('Erro ao buscar CEP. Tente novamente.');
            });
    }
    
    function exibirResultado(data) {
        //Preencher os campos com os dados
        cepResult.textContent = data.cep || '-';
        logradouroResult.textContent = data.logradouro || '-';
        complementoResult.textContent = data.complemento || '-';
        bairroResult.textContent = data.bairro || '-';
        localidadeResult.textContent = data.localidade || '-';
        ufResult.textContent = data.uf || '-';
        ibgeResult.textContent = data.ibge || '-';
        giaResult.textContent = data.gia || '-';
        dddResult.textContent = data.ddd || '-';
        siafiResult.textContent = data.siafi || '-';
        
        //Mostrar o container de resultados e esconder mensagem de erro
        resultContainer.style.display = 'block';
        errorMessage.style.display = 'none';
    }
    
    function mostrarErro(mensagem) {
        document.getElementById('error-text').textContent = mensagem;
        errorMessage.style.display = 'flex';
        resultContainer.style.display = 'none';
    }
});
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoListPending = document.getElementById('todo-list-pending');
const todoListCompleted = document.getElementById('todo-list-completed');
const tabs = document.querySelectorAll('.tab');

let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentTab = 'pending';

function renderTodos() {
    todoListPending.innerHTML = '';
    todoListCompleted.innerHTML = '';
    
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            
            <span class="">${todo.text}</span>
            <button class="delete-btn" onclick="deleteTodo(${index})">Excluir</button>
        `;
        if (todo.completed) {
            todoListCompleted.appendChild(li);
        } else {
            todoListPending.appendChild(li);
        }
    });
    saveTodos();
}

function showTab(tab) {
    currentTab = tab;
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[onclick="showTab('${tab}')"]`).classList.add('active');
    
    if (tab === 'pending') {
        todoListPending.style.display = 'block';
        todoListCompleted.style.display = 'none';
    } else {
        todoListPending.style.display = 'none';
        todoListCompleted.style.display = 'block';
    }
}

function addTodo() {
    const text = todoInput.value.trim();
    if (text) {
        todos.push({ text, completed: false });
        todoInput.value = '';
        renderTodos();
    }
}

function toggleTodo(index) {
    todos[index].completed = !todos[index].completed;
    renderTodos();
}

function deleteTodo(index) {
    todos.splice(index, 1);
    renderTodos();
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

new Sortable(todoListPending, {
    group: 'todo-lists',
    animation: 150,
    onEnd: updateTodosOrder
});

new Sortable(todoListCompleted, {
    group: 'todo-lists',
    animation: 150,
    onEnd: updateTodosOrder
});


function updateTodosOrder() {
    const newTodos = [];
    const pendingItems = todoListPending.querySelectorAll('.todo-item');
    const completedItems = todoListCompleted.querySelectorAll('.todo-item');
    
    pendingItems.forEach((item) => {
        const index = todos.findIndex(t => t.text === item.querySelector('.todo-text').textContent && !t.completed);
        if (index !== -1) newTodos.push(todos[index]);
    });
    
    completedItems.forEach((item) => {
        const index = todos.findIndex(t => t.text === item.querySelector('.todo-text').textContent && t.completed);
        if (index !== -1) newTodos.push(todos[index]);
    });
    
    todos = newTodos;
    saveTodos();
}

addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

renderTodos();
showTab('pending');
