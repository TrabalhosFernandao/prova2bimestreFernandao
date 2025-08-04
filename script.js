
let students = [];
let editingId = null;


class StudentManager {
    constructor() {
        this.loadStudentsFromStorage();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCepMask();
        this.renderStudents();
    }

    // Métodos de persistência
    loadStudentsFromStorage() {
        try {
            const storedStudents = localStorage.getItem('ifpr_students');
            if (storedStudents) {
                students = JSON.parse(storedStudents);
            }
        } catch (error) {
            console.error('Erro ao carregar dados do localStorage:', error);
            students = [];
        }
    }

    saveStudentsToStorage() {
        try {
            localStorage.setItem('ifpr_students', JSON.stringify(students));
        } catch (error) {
            console.error('Erro ao salvar dados no localStorage:', error);
            this.showMessage('Erro ao salvar dados localmente', 'error');
        }
    }

    setupEventListeners() {
        // Formulário
        document.getElementById('studentForm').addEventListener('submit', (e) => this.handleSubmit(e));
        
        // CEP
        document.getElementById('cep').addEventListener('blur', (e) => this.handleCepBlur(e));
        document.getElementById('cep').addEventListener('input', (e) => this.handleCepInput(e));
        
        // Busca
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e));
        
        // Autocomplete
        this.setupAutocomplete();
    }

    setupCepMask() {
        const cepInput = document.getElementById('cep');
        cepInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 5) {
                value = value.replace(/^(\d{5})(\d)/, '$1-$2');
            }
            e.target.value = value;
        });
    }

    async handleCepBlur(e) {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length === 8) {
            await this.fetchAddressByCep(cep);
        }
    }

    handleCepInput(e) {
        // Limpa os campos quando o CEP está sendo editado
        if (e.target.value.length < 8) {
            this.clearAddressFields();
        }
    }

    async fetchAddressByCep(cep) {
        const cepInput = document.getElementById('cep');
        const enderecoInput = document.getElementById('endereco');
        const bairroInput = document.getElementById('bairro');
        const cidadeInput = document.getElementById('cidade');
        const ufInput = document.getElementById('uf');

        try {
           
            [enderecoInput, bairroInput, cidadeInput, ufInput].forEach(input => {
                input.classList.add('loading');
                input.value = 'Carregando...';
            });

            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            
            [enderecoInput, bairroInput, cidadeInput, ufInput].forEach(input => {
                input.classList.remove('loading', 'error');
            });

            if (data.erro) {
                throw new Error('CEP não encontrado');
            }

            
            enderecoInput.value = data.logradouro || '';
            bairroInput.value = data.bairro || '';
            cidadeInput.value = data.localidade || '';
            ufInput.value = data.uf || '';

            
            document.getElementById('numero').focus();

        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            
            
            [enderecoInput, bairroInput, cidadeInput, ufInput].forEach(input => {
                input.classList.remove('loading');
                input.classList.add('error');
                input.value = '';
            });

            cepInput.classList.add('error');
            this.showMessage('CEP não encontrado ou inválido', 'error');
        }
    }

    clearAddressFields() {
        const fields = ['endereco', 'bairro', 'cidade', 'uf'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.value = '';
            field.classList.remove('loading', 'error');
        });
    }

    setupAutocomplete() {
        const nomeInput = document.getElementById('nome');
        const suggestions = document.getElementById('nome-suggestions');
        
        nomeInput.addEventListener('input', () => {
            const value = nomeInput.value.toLowerCase();
            if (value.length < 1) {
                suggestions.style.display = 'none';
                return;
            }

            const matches = students.filter(student => 
                student.nome.toLowerCase().includes(value)
            ).slice(0, 3);

            if (matches.length > 0 && !editingId) {
                suggestions.innerHTML = matches.map(student => 
                    `<div class="autocomplete-suggestion" onclick="studentManager.selectSuggestion('${student.nome}')">
                        ${student.nome}
                    </div>`
                ).join('');
                suggestions.style.display = 'block';
            } else {
                suggestions.style.display = 'none';
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.autocomplete-container')) {
                suggestions.style.display = 'none';
            }
        });
    }

    selectSuggestion(nome) {
        document.getElementById('nome').value = nome;
        document.getElementById('nome-suggestions').style.display = 'none';
    }

    handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filteredStudents = students.filter(student =>
            student.nome.toLowerCase().includes(searchTerm)
        );
        this.renderStudents(filteredStudents);
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const studentData = {
            nome: formData.get('nome'),
            email: formData.get('email'),
            cep: formData.get('cep'),
            endereco: formData.get('endereco'),
            numero: formData.get('numero'),
            bairro: formData.get('bairro'),
            cidade: formData.get('cidade'),
            uf: formData.get('uf')
        };

     
        if (!this.validateForm(studentData)) {
            return;
        }

        try {
            if (editingId) {
                
                const index = students.findIndex(s => s.id === editingId);
                if (index !== -1) {
                    students[index] = { ...students[index], ...studentData };
                    this.saveStudentsToStorage();
                    this.showMessage('Aluno atualizado com sucesso!', 'success');
                }
                this.cancelEdit();
            } else {
                
                studentData.id = Date.now();
                students.push(studentData);
                this.saveStudentsToStorage();
                this.showMessage('Aluno cadastrado com sucesso!', 'success');
            }

            e.target.reset();
            this.clearAddressFields();
            this.renderStudents();

        } catch (error) {
            console.error('Erro ao salvar aluno:', error);
            this.showMessage('Erro ao salvar aluno', 'error');
        }
    }

    validateForm(data) {
        const errors = [];

        if (!data.nome.trim()) errors.push('Nome é obrigatório');
        if (!data.email.trim()) errors.push('E-mail é obrigatório');
        if (!data.cep.trim()) errors.push('CEP é obrigatório');
        if (!data.numero.trim()) errors.push('Número é obrigatório');

    
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (data.email && !emailRegex.test(data.email)) {
            errors.push('E-mail inválido');
        }

        
        const existingStudent = students.find(s => s.email === data.email && s.id !== editingId);
        if (existingStudent) {
            errors.push('E-mail já cadastrado');
        }

        if (errors.length > 0) {
            this.showMessage(errors.join('<br>'), 'error');
            return false;
        }

        return true;
    }

    renderStudents(studentsToRender = students) {
        const grid = document.getElementById('studentsGrid');
        
        if (studentsToRender.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>Nenhum aluno cadastrado</h3>
                    <p>Cadastre o primeiro aluno usando o formulário acima.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = studentsToRender.map(student => `
            <div class="student-card">
                <div class="student-name">${student.nome}</div>
                <div class="student-email">
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    ${student.email}
                </div>
                <div class="student-address">
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    ${student.endereco}, ${student.numero} - ${student.bairro}, ${student.cidade} - ${student.uf}
                </div>
                <div class="student-cep">CEP: ${student.cep}</div>
                <div class="student-actions">
                    <button class="btn-editar" onclick="studentManager.editStudent(${student.id})">Editar</button>
                    <button class="btn-remover" onclick="studentManager.removeStudent(${student.id})">Remover</button>
                </div>
            </div>
        `).join('');
    }

    editStudent(id) {
        const student = students.find(s => s.id === id);
        if (!student) return;

        document.getElementById('nome').value = student.nome;
        document.getElementById('email').value = student.email;
        document.getElementById('cep').value = student.cep;
        document.getElementById('endereco').value = student.endereco;
        document.getElementById('numero').value = student.numero;
        document.getElementById('bairro').value = student.bairro;
        document.getElementById('cidade').value = student.cidade;
        document.getElementById('uf').value = student.uf;

        editingId = id;
        
        
        const submitBtn = document.querySelector('.btn-cadastrar');
        submitBtn.textContent = 'Atualizar';
        submitBtn.style.backgroundColor = '#ff9800';

      
        if (!document.getElementById('cancelBtn')) {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.id = 'cancelBtn';
            cancelBtn.textContent = 'Cancelar';
            cancelBtn.className = 'btn-cadastrar';
            cancelBtn.style.backgroundColor = '#757575';
            cancelBtn.style.marginLeft = '10px';
            cancelBtn.onclick = () => this.cancelEdit();
            
            submitBtn.parentNode.appendChild(cancelBtn);
        }

      
        document.querySelector('.form-section').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    cancelEdit() {
        editingId = null;
        
   
        document.getElementById('studentForm').reset();
        this.clearAddressFields();

        const submitBtn = document.querySelector('.btn-cadastrar');
        submitBtn.textContent = 'Cadastrar';
        submitBtn.style.backgroundColor = '';
        
    
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.remove();
        }
    }

    removeStudent(id) {
        if (confirm('Tem certeza que deseja remover este aluno?')) {
            students = students.filter(s => s.id !== id);
            this.saveStudentsToStorage();
            this.renderStudents();
            this.showMessage('Aluno removido com sucesso!', 'success');
        }
    }

    showMessage(message, type) {
   
        const existingMessages = document.querySelectorAll('.error-message, .success-message');
        existingMessages.forEach(msg => msg.remove());

        
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
        messageDiv.innerHTML = message;


        const formSection = document.querySelector('.form-section');
        formSection.insertBefore(messageDiv, formSection.firstChild);


        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}


let studentManager;
document.addEventListener('DOMContentLoaded', () => {
    studentManager = new StudentManager();
});