let idTransacao = null;

async function verificarAcesso() {
    // Pede ao Supabase para verificar se há uma sessão ativa neste navegador
    const { data, error } = await clienteSupabase.auth.getSession();

    // Se houver um erro ou se não existir uma sessão, expulsa o utilizador para o login
    if (error || !data.session) {
        window.location.href = 'index.html';
    } else {
        // Se a sessão existir, permite o acesso e mostra quem é
        console.log("Acesso autorizado para:", data.session.user.email);
        buscarTransacao();
    }
}

verificarAcesso();

async function buscarTransacao() {
    const { data, error } = await clienteSupabase.auth.getUser();

    const { data: dadosPerfil } = await clienteSupabase
    .from('profiles')
    .select('moeda_preferida')
    .eq('id', data.user.id)
    .single();

    let moedaUsuario = dadosPerfil.moeda_preferida;
    
    const { data: dadosTransacao, error: erroTransacao } = await clienteSupabase
    .from('transacoes')
    .select('*')
    .eq('usuario_id', data.user.id)
    .order('data_hora', { ascending: false })
    if(erroTransacao){
        console.error("Erro ao buscar transação:", erroTransacao.message);
        alert("Erro ao buscar transação: " + erroTransacao.message);
    }
    else{
        const lista = document.getElementById('lista-transacoes');
        lista.textContent = ''
        dadosTransacao.forEach(function(transacao) {
    
            const momento = new Date(transacao.data_hora).toLocaleString('pt-BR');
            let localeMoeda = 'pt-BR';
            if (moedaUsuario === 'USD') localeMoeda = 'en-US';
            if (moedaUsuario === 'EUR') localeMoeda = 'de-DE';

            const valorFormatado = new Number(transacao.valor).toLocaleString(localeMoeda, {
                style: 'currency', 
                currency: moedaUsuario
            });
    
            // 1. CRIAMOS O CARTÃO PRINCIPAL DA LINHA
            const linha = document.createElement('p');

            // 2. TEXTO FORMATADO DA TRANSAÇÃO
            const infoTexto = document.createElement('div');
            infoTexto.style.lineHeight = "1.5";

            // Define a cor baseado no tipo (Receita = Verde, Gasto = Vermelho)
            const corTipo = transacao.tipo_transacao === 'receita' ? '#27ae60' : '#e74c3c';
            const fundoTipo = transacao.tipo_transacao === 'receita' ? '#eafaf1' : '#fdedec';

            infoTexto.innerHTML = `
                <strong style="font-size: 16px; color: #2c3e50;">🏷️ ${transacao.loja_compra || 'Transação'}</strong> 
                <span style="background: ${fundoTipo}; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 5px; color: ${corTipo}; text-transform: uppercase;">
                    ${transacao.tipo_transacao}
                </span><br>
                <span style="font-size: 14px; color: #333;">
                    <strong>Valor:</strong> ${valorFormatado}
                </span><br>
                <small style="color: #95a5a6;">📅 Data: ${momento}</small>
            `;

            const grupoBotoes = document.createElement('div');
            grupoBotoes.style.display = 'flex';
            grupoBotoes.style.gap = '8px';
            grupoBotoes.style.flexWrap = 'wrap';
            grupoBotoes.style.justifyContent = 'flex-end';

            const botaoExcluir = document.createElement('button');
            botaoExcluir.textContent = 'Excluir';
            
            botaoExcluir.addEventListener('click', async function() {
                const {data: dadosExcluidos, error: erroExcluir } = await clienteSupabase
                .from('transacoes')
                .delete()
                .eq('id', transacao.id);
                
                if (erroExcluir) {
                    console.error("Erro ao excluir transação:", erroExcluir.message);
                    alert("Erro ao excluir transação: " + erroExcluir.message);
                } else {
                    alert("Transação excluída com sucesso!");
                    buscarTransacao(); // Recarrega a lista atualizada
                }
            });
            
            const botaoEditar = document.createElement('button');
            botaoEditar.textContent = 'Editar';
            
            botaoEditar.addEventListener('click', function() {
                idTransacao = transacao.id;
                document.getElementById('valor').value = transacao.valor;
                document.getElementById('loja_compra').value = transacao.loja_compra;
                document.getElementById('data_hora').value = transacao.data_hora.slice(0,16);
                document.getElementById('tipo_transacao').value = transacao.tipo_transacao;
            });
            
            grupoBotoes.appendChild(botaoExcluir);
            grupoBotoes.appendChild(botaoEditar);

            linha.appendChild(infoTexto);
            linha.appendChild(grupoBotoes);
            
            lista.appendChild(linha);
        });
    }
}

const botaoSalvar = document.getElementById('btn-salvar');

botaoSalvar.addEventListener('click', async function() {
    const salvarValor = Number(document.getElementById('valor').value);
    const salvarLocal = document.getElementById('loja_compra').value.trim();
    const salvarTipo = document.getElementById('tipo_transacao').value;
    const salvarDataHora = document.getElementById('data_hora').value;
    
    const { data, error: userError } = await clienteSupabase.auth.getUser();
    
    if (userError || !data.user) {
        alert("Erro de autenticação. Por favor, faça login novamente.");
        return;
    }

    if (isNaN(salvarValor) || salvarValor <= 0 || salvarLocal === "" || salvarDataHora === "") {
        alert("Por favor, preencha todos os campos corretamente com valores válidos.");
        return;
    }

    const dataConvertida = new Date(salvarDataHora).toISOString();
    
    let dadosSalvos, erroSalvar;

    if (idTransacao == null) {
        const resultado = await clienteSupabase
            .from('transacoes')
            .insert({ 
                usuario_id: data.user.id, 
                valor: salvarValor, 
                loja_compra: salvarLocal, 
                tipo_transacao: salvarTipo, 
                data_hora: dataConvertida 
            });
        dadosSalvos = resultado.data;
        erroSalvar = resultado.error;
    } else {
        const resultado = await clienteSupabase
            .from('transacoes')
            .update({ 
                valor: salvarValor, 
                loja_compra: salvarLocal, 
                tipo_transacao: salvarTipo, 
                data_hora: dataConvertida 
            })
            .eq('id', idTransacao);
        dadosSalvos = resultado.data;
        erroSalvar = resultado.error;
    }   

    if (erroSalvar) {
        console.error("Erro ao salvar transação:", erroSalvar.message);
        alert("Erro ao salvar transação: " + erroSalvar.message);
    } else {
        console.log("Transação salva com sucesso!", dadosSalvos);
        alert("Transação salva com sucesso!");
        buscarTransacao();
        
        // Limpa os campos
        document.getElementById('valor').value = '';
        document.getElementById('loja_compra').value = '';
        document.getElementById('data_hora').value = '';
        idTransacao = null;
    }
});