async function verificarAcesso() {
    // Pede ao Supabase para verificar se há uma sessão ativa neste navegador
    const { data, error } = await clienteSupabase.auth.getSession();

    // Se houver um erro ou se não existir uma sessão, expulsa o utilizador para o login
    if (error || !data.session) {
        window.location.href = 'index.html';
    } else {
        // Se a sessão existir, permite o acesso e mostra quem é
        console.log("Acesso autorizado para:", data.session.user.email);
        buscarPerfil();
        carregarResumo();
    }
}

verificarAcesso();

async function buscarPerfil() {
    const { data, error } = await clienteSupabase.auth.getUser();

    const { data: dadosPerfil, error: erroPerfil } = await clienteSupabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
        if(erroPerfil){
        console.error("Erro ao buscar perfil:", erroPerfil.message);
        alert("Erro ao buscar perfil: " + erroPerfil.message);
    }
    else{
        console.log("Perfil encontrado com sucesso!", dadosPerfil);
        document.getElementById('nome_completo').value = dadosPerfil.nome_completo;
        document.getElementById('moeda_preferida').value = dadosPerfil.moeda_preferida;
    }
}


const botaoSair = document.getElementById('btn-sair');

botaoSair.addEventListener('click', async function() {
    // Comando oficial do Supabase para encerrar a sessão
    botaoSair.textContent = "Saindo da Conta...";
    botaoSair.disabled = true;
    const { error } = await clienteSupabase.auth.signOut();
    
    if (error) {
        alert("Erro ao tentar sair: " + error.message);
    } else {
        // Redireciona de volta para a tela de login
        window.location.href = 'index.html';
    }

    
});
const botaoEditar = document.getElementById('btn-editar');

botaoEditar.addEventListener('click', async function() {
    const editarNome = document.getElementById('nome_completo').value;
    const editarMoeda = document.getElementById('moeda_preferida').value;

    const { data, error } = await clienteSupabase.auth.getUser();

    const { data: dadosAtualizacao, error: erroAtualizacao } = await clienteSupabase
    .from('profiles')
    .update({nome_completo: editarNome, moeda_preferida: editarMoeda })
    .eq('id',data.user.id);
    if(erroAtualizacao){
        console.error("Erro ao atualizar dados:", erroAtualizacao.message);
        alert("Erro ao atualizar dados: " + erroAtualizacao.message);
    }
    else{
        console.log("Dados atualizados com sucesso!", dadosAtualizacao);
        alert("Dados atualizados com sucesso!")
    }
});

async function carregarResumo() {
    // 1. Descobre quem é o utilizador
    const { data: usuarioData, error: usuarioError } = await clienteSupabase.auth.getUser();
    
    if (usuarioError || !usuarioData.user) {
        return;
    }
    
    const userId = usuarioData.user.id;

    const { data: dadosPerfil } = await clienteSupabase
        .from('profiles')
        .select('moeda_preferida')
        .eq('id', userId)
        .single();
    
    let moedaUsuario = dadosPerfil ? dadosPerfil.moeda_preferida : 'BRL';

    let localeMoeda = 'pt-BR';
    if (moedaUsuario === 'USD') localeMoeda = 'en-US';
    if (moedaUsuario === 'EUR') localeMoeda = 'de-DE';

    // ----------------------------------------------------
    // 3. BUSCA E CÁLCULO DAS TRANSAÇÕES (Receitas/Gastos/Saldo)
    // ----------------------------------------------------
    const { data: dadosTransacao, error: erroTransacao } = await clienteSupabase
        .from('transacoes')
        .select('tipo_transacao, valor')
        .eq('usuario_id', userId);

    let totalReceitas = 0;
    let totalGastos = 0;

    if (!erroTransacao && dadosTransacao) {
        dadosTransacao.forEach(function(transacao) {
            if (transacao.tipo_transacao == 'receita') {
                totalReceitas += Number(transacao.valor);
            } else if (transacao.tipo_transacao == 'gasto') {
                totalGastos += Number(transacao.valor);
            }
        });
    }
    let saldo = totalReceitas - totalGastos;

    // ----------------------------------------------------
    // 4. BUSCA E CÁLCULO DOS EMPRÉSTIMOS PENDENTES
    // ----------------------------------------------------
    const { data: dadosEmprestimos, error: erroEmprestimo } = await clienteSupabase
        .from('emprestimos')
        .select('valor_total, valor_pago, pago')
        .eq('usuario_id', userId);

    let totalEmprestimosPendentes = 0;
    if (!erroEmprestimo && dadosEmprestimos) {
        dadosEmprestimos.forEach(function(emp) {
            // Se não estiver totalmente pago, calcula quanto falta pagar/receber
            if (emp.pago == false) {
                let faltaPagar = Number(emp.valor_total) - Number(emp.valor_pago);
                totalEmprestimosPendentes += faltaPagar;
            }
        });
    }

    // ----------------------------------------------------
    // 5. BUSCA E CÁLCULO DAS METAS
    // ----------------------------------------------------
    const { data: dadosMetas, error: erroMetas } = await clienteSupabase
        .from('metas')
        .select('valor_total, valor_guardado, valor_alcancado')
        .eq('usuario_id', userId);

    let metasTotalAlvo = 0;
    let metasTotalGuardado = 0;
    let metasConcluidas = 0;

    if (!erroMetas && dadosMetas) {
        dadosMetas.forEach(function(meta) {
            metasTotalAlvo += Number(meta.valor_total);
            metasTotalGuardado += Number(meta.valor_guardado);
            if (meta.valor_alcancado == true) {
                metasConcluidas++;
            }
        });
    }

    // ----------------------------------------------------
    // 6. JOGA OS RESULTADOS NOS VISORES DO HTML
    // ----------------------------------------------------
    document.getElementById('visor-receitas').textContent = Number(totalReceitas).toLocaleString(localeMoeda, { style: 'currency', currency: moedaUsuario });
    document.getElementById('visor-gastos').textContent = Number(totalGastos).toLocaleString(localeMoeda, { style: 'currency', currency: moedaUsuario });
    document.getElementById('visor-saldo').textContent = Number(saldo).toLocaleString(localeMoeda, { style: 'currency', currency: moedaUsuario });
    
    const visorEmprestimos = document.getElementById('visor-totalEmprestado');
    if (visorEmprestimos) {
        visorEmprestimos.textContent = Number(totalEmprestimosPendentes).toLocaleString(localeMoeda, { style: 'currency', currency: moedaUsuario });
    }

    document.getElementById('visor-metasAndamento').textContent = Number(metasTotalGuardado).toLocaleString(localeMoeda, { style: 'currency', currency: moedaUsuario });
    document.getElementById('visor-metasAlvo').textContent = Number(metasTotalAlvo).toLocaleString(localeMoeda, { style: 'currency', currency: moedaUsuario });
    document.getElementById('visor-metasConcluidas').textContent = `${metasConcluidas}`;
}