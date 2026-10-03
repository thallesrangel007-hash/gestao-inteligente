// ==========================================
// 1. LÓGICA VISUAL (Alternar Telas)
// ==========================================
const loginContainer = document.getElementById('login-container');
const cadastroContainer = document.getElementById('cadastro-container');
const linkIrCadastro = document.getElementById('link-ir-cadastro');
const linkIrLogin = document.getElementById('link-ir-login');

//Proibições básicas
const inputTelefone = document.getElementById('cadastro-telefone');

inputTelefone.addEventListener('input', function(event) {
    // 1. Remove tudo o que não for número (letras, símbolos)
    let valor = event.target.value.replace(/\D/g, ''); 
    
    // 2. Coloca os parênteses nos 2 primeiros dígitos (DDD)
    valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2'); 
    
    // 3. Coloca o traço antes dos últimos 4 dígitos
    valor = valor.replace(/(\d)(\d{4})$/, '$1-$2'); 
    
    // 4. Devolve o valor formatado para a tela
    event.target.value = valor;
});

// Quando clicar em "Cadastre-se aqui"
linkIrCadastro.addEventListener('click', function(event) {
    event.preventDefault();
    loginContainer.style.display = 'none';
    cadastroContainer.style.display = 'block';
});

// Quando clicar em "Voltar para o Login"
linkIrLogin.addEventListener('click', function(event) {
    event.preventDefault();
    cadastroContainer.style.display = 'none';
    loginContainer.style.display = 'block';
});

// ==========================================
// 2. LÓGICA DE CRIAR CONTA
// ==========================================
const botaoCadastrar = document.getElementById('btn-cadastrar');

botaoCadastrar.addEventListener('click', async function() {
    // Pegando os novos IDs do HTML
    const nomeDigitado = document.getElementById('cadastro-nome').value;
    const telefoneDigitado = document.getElementById('cadastro-telefone').value; 
    const emailDigitado = document.getElementById('cadastro-email').value;
    const senhaDigitada = document.getElementById('cadastro-senha').value;
    const confirmaSenha = document.getElementById('cadastro-confirma-senha').value;

    if (senhaDigitada !== confirmaSenha) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'As senhas não coincidem. Por favor, digite senhas iguais.',
            confirmButtonColor: '#1a5c3d' 
        });
        return; // CORREÇÃO 1: Interrompe o código aqui se a senha estiver errada
    }

    const { data, error } = await clienteSupabase.auth.signUp({
        email: emailDigitado,
        password: senhaDigitada,
    });

    if (error) {
        console.error("Erro ao criar conta:", error.message);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Falha no Cadastro',
            confirmButtonColor: '#1a5c3d'
        });
    } else {
        const { data: dadosPerfil, error: erroPerfil } = await clienteSupabase
        .from('profiles')
        .insert({
            id: data.user.id, 
            nome_completo: nomeDigitado,
            telefone: telefoneDigitado 
        });

        if(erroPerfil){
            console.error("Erro ao inserir perfil:", erroPerfil.message);
            Swal.fire({
                icon: 'warning',
                title: 'Aviso',
                text: 'Conta criada, mas houve um erro ao salvar o perfil',
                confirmButtonColor: '#1a5c3d'
            });
        } else {
            // Conta e perfil criados! O Supabase já iniciou a sessão automaticamente.
            Swal.fire({
                icon: 'success', 
                title: 'Bem-vindo(a)!',
                text: 'Conta criada com sucesso no Gestão Inteligente',
                confirmButtonColor: '#1a5c3d'
            }).then((resultado) => { 
                if(resultado.isConfirmed){
                    window.location.href = 'dashboard.html';
                }
            });
        }
    }
});

// ==========================================
// 3. LÓGICA DE LOGIN
// ==========================================
const botaoLogin = document.getElementById('btn-login');

botaoLogin.addEventListener('click', async function(event) {
    // Pegando os novos IDs do HTML
    const emailDigitado = document.getElementById('login-email').value;
    const senhaDigitada = document.getElementById('login-senha').value;

    event.preventDefault();
    botaoLogin.textContent = "Entrando...";
    botaoLogin.disabled = true;

    const { data, error } = await clienteSupabase.auth.signInWithPassword({
        email: emailDigitado,
        password: senhaDigitada,
    });

    if (error) {
        console.error("Erro ao entrar:", error.message);
        Swal.fire({
                icon: 'error',
                title: 'Opps...',
                text: 'Erro ao entrar, confirme seu email e senha',
                confirmButtonColor: '#1a5c3d'
        });
        // Devolve o botão ao normal
        botaoLogin.textContent = "Entrar";
        botaoLogin.disabled = false;
    } else {
        console.log("Login efetuado com sucesso!", data);
        Swal.fire({
                icon: 'success', 
                title: 'Bem-vindo(a)!',
                text: 'Login Efetuado com sucesso!',
                confirmButtonColor: '#1a5c3d'
            }).then((resultado) => { 
                if(resultado.isConfirmed){
                    window.location.href = 'dashboard.html';
                }
            });
    }
});

// Função para alternar visibilidade da senha com ícones profissionais
function configurarVisualizacaoSenha(idInput, idBotao) {
    const input = document.getElementById(idInput);
    const botao = document.getElementById(idBotao);

    if (input && botao) {
        botao.addEventListener('click', function(e) {
            e.preventDefault(); 
            if (input.type === 'password') {
                input.type = 'text';
                // Ícone de olho cortado (senha visível)
                botao.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                // Ícone de olho normal (senha oculta)
                botao.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    }
}

configurarVisualizacaoSenha('login-senha', 'toggle-login-senha');
configurarVisualizacaoSenha('cadastro-senha', 'toggle-cadastro-senha');
configurarVisualizacaoSenha('cadastro-confirma-senha', 'toggle-cadastro-confirma');