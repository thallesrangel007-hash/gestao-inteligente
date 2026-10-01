// ==========================================
// 1. LÓGICA VISUAL (Alternar Telas)
// ==========================================
const loginContainer = document.getElementById('login-container');
const cadastroContainer = document.getElementById('cadastro-container');
const linkIrCadastro = document.getElementById('link-ir-cadastro');
const linkIrLogin = document.getElementById('link-ir-login');

// Máscara do Telefone
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
    event.preventDefault(); // Evita que o link recarregue a página
    loginContainer.style.display = 'none'; // Esconde o Login
    cadastroContainer.style.display = 'block'; // Mostra o Cadastro
});

// Quando clicar em "Voltar para o Login"
linkIrLogin.addEventListener('click', function(event) {
    event.preventDefault();
    cadastroContainer.style.display = 'none'; // Esconde o Cadastro
    loginContainer.style.display = 'block'; // Mostra o Login
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

    const { data, error } = await clienteSupabase.auth.signUp({
        email: emailDigitado,
        password: senhaDigitada,
    });

    if (error) {
        console.error("Erro ao criar conta:", error.message);
        alert("Erro ao criar conta: " + error.message);
    } else {
        // Agora gravamos o nome e o telefone na tabela profiles!
        const { data: dadosPerfil, error: erroPerfil } = await clienteSupabase
        .from('profiles')
        .insert({
            id: data.user.id, 
            nome_completo: nomeDigitado,
            telefone: telefoneDigitado 
        });

        if(erroPerfil){
            console.error("Erro ao inserir perfil:", erroPerfil.message);
            alert("Erro ao inserir dados do perfil: " + erroPerfil.message);
        } else {
            // Conta e perfil criados! O Supabase já iniciou a sessão automaticamente.
            alert("Conta criada com sucesso! Bem-vindo(a) ao Gestão Inteligente!");
            
            // Redireciona direto para o painel!
            window.location.href = 'dashboard.html';
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
        alert("Erro ao entrar: Verifique seu e-mail e senha.");
        
        // Devolve o botão ao normal
        botaoLogin.textContent = "Entrar";
        botaoLogin.disabled = false;
    } else {
        console.log("Login efetuado com sucesso!", data);
        window.location.href = 'dashboard.html';
    }
});