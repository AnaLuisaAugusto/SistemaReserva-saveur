const form = document.getElementById('form');
const campos = document.querySelectorAll('.required');
const spans = document.querySelectorAll('.span-required');

// Funções para exibir/ocultar erros
    function setError(index){
        campos[index].style.border = '2px solid #ba181b';
        spans[index].style.display = 'block';
    }

    function removeError(index){
        campos[index].style.border = '';
        spans[index].style.display = 'none';
    }

//validação nome
    function nameValidate(){
        if(campos[0].value.length < 3){
            setError(0);
        }
        else{
            removeError(0);
        }
    }

//validação CPF
    const cpfInput = document.getElementById('cpf');

    // Função para formatar o CPF
    function formatCPF(value) {
        // Remove tudo que não seja número
        value = value.replace(/\D/g, '');

        // Limita a 11 dígitos
        value = value.slice(0, 11);

        // Aplica a máscara de CPF
        if (value.length > 9) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        }

        return value;
    }

    function cpfValidate() {
        const cpf = document.getElementById('cpf').value;
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        const span = document.querySelector('.span-required');
    
        if (!cpfRegex.test(cpf)) {
            span.style.display = 'block';
        } else {
            span.style.display = 'none';
        }
    }

    // Adiciona eventos ao campo de CPF
    cpfInput.addEventListener('input', (event) => {
        const formattedValue = formatCPF(event.target.value);
        event.target.value = formattedValue;
    });

    cpfInput.addEventListener('keydown', (event) => {
        // Permite teclas especiais como Backspace, Tab, Delete
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'];
        if (allowedKeys.includes(event.key)) {
            return;
        }

        // Bloqueia se a tecla não for um número
        if (!/^\d$/.test(event.key)) {
            event.preventDefault();
        }
    });

//Validação qntd Pessoas
    const input = document.getElementById('qtd_pessoas');

    input.addEventListener('input', () => {
        // Verifica se o valor é maior que 15
        if (input.value > 12) {
            input.value = 12; // Limita ao máximo permitido
        }
    });

//validação email 
    //!-- const emailRegex = /^[a-z0-9.]+@[a-z0-9]+\.[a-z]+(\.[a-z]+)?$/i; 
    
    // function emailValidate(){
    //     if(!emailRegex.test(campos[1].value)){
    //         setError(1);
    //     }
    //     else{
    //         removeError(1);
    //     }
    // }