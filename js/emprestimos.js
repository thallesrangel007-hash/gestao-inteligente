let idEmprestimo = null;

async function verificarAcesso() {
    // Pede ao Supabase para verificar se há uma sessão ativa neste navegador
    const { data, error } = await clienteSupabase.auth.getSession();

    // Se houver um erro ou se não existir uma sessão, expulsa o utilizador para o login
    if (error || !data.session) {
        window.location.href = 'index.html';
    } else {
        // Se a sessão existir, permite o acesso e mostra quem é
        console.log("Acesso autorizado para:", data.session.user.email);
        buscarEmprestimo();
    }
}

verificarAcesso();

async function buscarEmprestimo() {
    const { data, error } = await clienteSupabase.auth.getUser();

    const { data: dadosPerfil } = await clienteSupabase
    .from('profiles')
    .select('moeda_preferida')
    .eq('id', data.user.id)
    .single();

    let moedaUsuario = dadosPerfil.moeda_preferida;
    
    const { data: dadosEmprestimo, error: erroEmprestimo } = await clienteSupabase
    .from('emprestimos')
    .select('*')
    .eq('usuario_id', data.user.id)
    .order('data_hora_inicio', { ascending: false })
    if(erroEmprestimo){
        console.error("Erro ao buscar empréstimo:", erroEmprestimo.message);
        alert("Erro ao buscar empréstimo: " + erroEmprestimo.message);
    }
    else{
        const lista = document.getElementById('lista-emprestimos');
        lista.textContent = ''
        dadosEmprestimo.forEach(function(emprestimo) {
    
            const momentoInicial = new Date(emprestimo.data_hora_inicio).toLocaleString('pt-BR');
            const momentoFinal = new Date(emprestimo.data_hora_fim).toLocaleString('pt-BR');

            let localeMoeda = 'pt-BR';
            if (moedaUsuario === 'USD') localeMoeda = 'en-US';
            if (moedaUsuario === 'EUR') localeMoeda = 'de-DE';

            const valorFormatado = new Number(emprestimo.valor_total).toLocaleString(localeMoeda, {
                style: 'currency', 
                currency: moedaUsuario
            });
            const ValorQuitado = new Number(emprestimo.valor_pago).toLocaleString(localeMoeda, {
                style: 'currency',
                currency: moedaUsuario
            });

            let statusPagamento = "Pendente";
            if (emprestimo.pago == true) {
                statusPagamento = "Quitado";
            }
    
            const linha = document.createElement('p');
            
            const infoTexto = document.createElement('div');
            infoTexto.style.lineHeight = "1.5"; 
            
            //innerHTML para organizar os dados com negrito, cores e quebras de linha
            infoTexto.innerHTML = `
                <strong style="font-size: 16px; color: #2c3e50;">👤 ${emprestimo.pessoa_envolvida}</strong> 
                <span style="background: #ecf0f1; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 5px; color: #7f8c8d; text-transform: uppercase;">
                    ${emprestimo.tipo_emprestimo}
                </span><br>
                <span style="font-size: 14px; color: #333;">
                    <strong>Total:</strong> ${valorFormatado} &nbsp;|&nbsp; <strong>Pago:</strong> ${ValorQuitado}
                </span><br>
                <small style="color: #95a5a6;">📅 De: ${momentoInicial} &nbsp; Até: ${momentoFinal}</small><br>
                <strong style="color: ${emprestimo.pago ? '#27ae60' : '#e67e22'}; font-size: 13px;">
                    Status: ${statusPagamento}
                </strong>
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
                .from('emprestimos')
                .delete()
                .eq('id', emprestimo.id);
                
                if (erroExcluir) {
                    console.error("Erro ao excluir empréstimo:", erroExcluir.message);
                    alert("Erro ao excluir empréstimo: " + erroExcluir.message);
                } else {
                    alert("Empréstimo excluído com sucesso!");
                    buscarEmprestimo(); // Recarrega a lista atualizada
                }
            });
            
            const botaoEditar = document.createElement('button');
            botaoEditar.textContent = 'Editar';
            
            botaoEditar.addEventListener('click', function() {
                idEmprestimo = emprestimo.id;
                document.getElementById('valor_total').value = emprestimo.valor_total;
                document.getElementById('pessoa_envolvida').value = emprestimo.pessoa_envolvida;
                document.getElementById('data_hora_inicio').value = emprestimo.data_hora_inicio.slice(0,16);
                document.getElementById('data_hora_fim').value = emprestimo.data_hora_fim.slice(0,16);
                document.getElementById('tipo_emprestimo').value = emprestimo.tipo_emprestimo;
            });

            const botaoPagar = document.createElement('button');
            botaoPagar.textContent = 'Registrar Pagamento';
            
            botaoPagar.addEventListener('click', async function() {
               let valorDigitado = prompt("Qual valor recebido/pago?");

               if(valorDigitado == null || valorDigitado == "") {
                return;
               }

               let numDigitado = Number(valorDigitado);
               let valorFaltante = Number(emprestimo.valor_total) - Number(emprestimo.valor_pago);
               
               if (isNaN(numDigitado) || numDigitado <= 0) {
                    alert("Por favor, digite um valor numérico válido.");
                    return; 
                }
    
                if (numDigitado > valorFaltante) {
                    alert("Erro: O valor ultrapassa a dívida! Falta pagar apenas: " + valorFaltante);
                    return; 
                }
               
               let novoValorPago = Number(emprestimo.valor_pago) + numDigitado;
               let dividaQuitada = false;

               if (novoValorPago >= Number(emprestimo.valor_total)) {
                    dividaQuitada = true;
                }

                const { data: dadosPagamento, error: erroPagamento } = await clienteSupabase
                .from('emprestimos')
                .update({ valor_pago: novoValorPago, pago: dividaQuitada })
                .eq('id', emprestimo.id) 
                .select();

                if (erroPagamento) {
                    alert("Erro ao registrar pagamento: " + erroPagamento.message);
                    console.error("Erro:", erroPagamento.message);
                } else {
                    alert("Pagamento registrado com sucesso!");
                    await buscarEmprestimo(); 
                }
            });
            
            grupoBotoes.appendChild(botaoExcluir);
            grupoBotoes.appendChild(botaoEditar);
            grupoBotoes.appendChild(botaoPagar);

            linha.appendChild(infoTexto);
            linha.appendChild(grupoBotoes);
            
            lista.appendChild(linha);
        });
            
    }
}

const botaoSalvar = document.getElementById('btn-salvar');

botaoSalvar.addEventListener('click', async function() {
    const salvarValorTotal = document.getElementById('valor_total').value;
    const salvarPessoaEnvolvida = document.getElementById('pessoa_envolvida').value;
    const salvarTipo = document.getElementById('tipo_emprestimo').value;
    const salvarDataHoraInicio = document.getElementById('data_hora_inicio').value;
    const salvarDataHoraFim = document.getElementById('data_hora_fim').value;
    
    const { data, error } = await clienteSupabase.auth.getUser();
    
    if(salvarValorTotal <= 0 || salvarPessoaEnvolvida == "" || salvarDataHoraInicio == "" || salvarDataHoraFim == "")
        {
            alert("Entrada Inválida.");
            return;
        }
    const dataConvertidaInicio = new Date(salvarDataHoraInicio).toISOString();
    const dataConvertidaFim = new Date(salvarDataHoraFim).toISOString();

    
    let dadosSalvos, erroSalvar;

    if (idEmprestimo == null) {
    const resultado = await clienteSupabase
        .from('emprestimos')
        .insert({ usuario_id: data.user.id, valor_total: salvarValorTotal, pessoa_envolvida: salvarPessoaEnvolvida, tipo_emprestimo: salvarTipo, data_hora_inicio: dataConvertidaInicio, data_hora_fim: dataConvertidaFim, valor_pago: 0, pago: false });
    dadosSalvos = resultado.data;
    erroSalvar = resultado.error;
    }
     else
    {
        const resultado = await clienteSupabase
        .from('emprestimos')
        .update({ valor_total: salvarValorTotal, pessoa_envolvida: salvarPessoaEnvolvida, tipo_emprestimo: salvarTipo, data_hora_inicio: dataConvertidaInicio, data_hora_fim: dataConvertidaFim })
        .eq('id',idEmprestimo);
        dadosSalvos = resultado.data;
        erroSalvar = resultado.error;
    }   
    if(erroSalvar){
        console.error("Erro ao salvar empréstimo:", erroSalvar.message);
        alert("Erro ao salvar empréstimo: " + erroSalvar.message);
    }
    else{
        console.log("Empréstimo salvo com sucesso!", dadosSalvos);
        alert("Empréstimo salvo com sucesso!");
        buscarEmprestimo();
        document.getElementById('valor_total').value = '';
        document.getElementById('pessoa_envolvida').value = '';
        document.getElementById('data_hora_inicio').value = '';
        document.getElementById('data_hora_fim').value = '';
        
        idEmprestimo = null;
    }
});

const botaoSair = document.getElementById('btn-sair');

if (botaoSair) {
    botaoSair.addEventListener('click', async function(event) {
        event.preventDefault(); // Evita que o link recarregue a página abruptamente
        
        const { error } = await clienteSupabase.auth.signOut();
        
        if (error) {
            alert("Erro ao sair: " + error.message);
        } else {
            // Sessão encerrada no banco, devolve o utilizador para a tela de login
            window.location.href = 'index.html'; 
        }
    });
}