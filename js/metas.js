let idMetas = null;

async function verificarAcesso() {
    // Pede ao Supabase para verificar se há uma sessão ativa neste navegador
    const { data, error } = await clienteSupabase.auth.getSession();

    // Se houver um erro ou se não existir uma sessão, expulsa o utilizador para o login
    if (error || !data.session) {
        window.location.href = 'index.html';
    } else {
        // Se a sessão existir, permite o acesso e mostra quem é
        console.log("Acesso autorizado para:", data.session.user.email);
        buscarMeta();
    }
}

verificarAcesso();

async function buscarMeta() {
    const { data, error } = await clienteSupabase.auth.getUser();

    const { data: dadosPerfil } = await clienteSupabase
    .from('profiles')
    .select('moeda_preferida')
    .eq('id', data.user.id)
    .single();

    let moedaUsuario = dadosPerfil.moeda_preferida;
    
    const { data: dadosMeta, error: erroMeta } = await clienteSupabase
    .from('metas')
    .select('*')
    .eq('usuario_id', data.user.id)
    .order('data_hora_inicio', { ascending: false })
    if(erroMeta){
        console.error("Erro ao buscar meta:", erroMeta.message);
        alert("Erro ao buscar meta: " + erroMeta.message);
    }
    else{
        const lista = document.getElementById('lista-metas');
        lista.textContent = ''
        dadosMeta.forEach(function(meta) {
    
            const momentoInicial = new Date(meta.data_hora_inicio).toLocaleString('pt-BR');
            let localeMoeda = 'pt-BR';
            if (moedaUsuario === 'USD') localeMoeda = 'en-US';
            if (moedaUsuario === 'EUR') localeMoeda = 'de-DE';
            
            const valorFormatado = new Number(meta.valor_total).toLocaleString(localeMoeda, {
                style: 'currency', 
                currency: moedaUsuario
            });
            const ValorGuardado = new Number(meta.valor_guardado).toLocaleString(localeMoeda, {
                style: 'currency',
                currency: moedaUsuario
            });

            const metaAlcancada = meta.valor_alcancado;
            const corStatus = metaAlcancada ? '#27ae60' : '#3498db';
            const textoStatus = metaAlcancada ? 'Meta Alcançada 🎉' : 'Pendente...';
    
            const linha = document.createElement('p');

            const infoTexto = document.createElement('div');
            infoTexto.style.lineHeight = "1.5";

            infoTexto.innerHTML = `
                <strong style="font-size: 16px; color: #2c3e50;">🎯 ${meta.objetivo}</strong><br>
                <span style="font-size: 14px; color: #333;">
                    <strong>Objetivo:</strong> ${valorFormatado} &nbsp;|&nbsp; <strong>Guardado:</strong> ${ValorGuardado}
                </span><br>
                <small style="color: #95a5a6;">📅 Data de Início: ${momentoInicial}</small><br>
                <strong style="color: ${corStatus}; font-size: 13px;">
                    Status: ${textoStatus}
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
                .from('metas')
                .delete()
                .eq('id', meta.id);
                
                if (erroExcluir) {
                    console.error("Erro ao excluir meta:", erroExcluir.message);
                    alert("Erro ao excluir meta: " + erroExcluir.message);
                } else {
                    alert("Meta excluída com sucesso!");
                    buscarMeta(); // Recarrega a lista atualizada
                }
            });
            
            const botaoEditar = document.createElement('button');
            botaoEditar.textContent = 'Editar';
            
            botaoEditar.addEventListener('click', function() {
                idMetas = meta.id;
                document.getElementById('valor_total').value = meta.valor_total;
                document.getElementById('objetivo').value = meta.objetivo;
                document.getElementById('data_hora_inicio').value = meta.data_hora_inicio.slice(0,16);
            });

            const botaoGuardar = document.createElement('button');
            botaoGuardar.textContent = 'Guardar Dinheiro';
            
            botaoGuardar.addEventListener('click', async function() {
               let valorDigitado = prompt("Qual valor quer guardar?");

               if(valorDigitado == null || valorDigitado == "")
               {
                return;
               }
               let numDigitado = Number(valorDigitado);
               let valorFaltante = Number(meta.valor_total) - Number(meta.valor_guardado);
               if (isNaN(numDigitado) || numDigitado <= 0) {
                    alert("Por favor, digite um valor numérico válido.");
                    return; 
                }
    
                if (numDigitado > valorFaltante) {
                    alert("Erro: O valor ultrapassa o objetivo! Falta pagar apenas: " + valorFaltante);
                    return; // O 'return' cancela tudo e impede de ir para o banco de dados
                }

               let novoValorGuardado = Number(meta.valor_guardado) + numDigitado;
               let metaAtingida = false;

               if (novoValorGuardado >= Number(meta.valor_total)) 
                {
                    metaAtingida = true;
                }

                const { data: dadosGuardar, error: erroGuardar } = await clienteSupabase
                .from('metas')
                .update({ valor_guardado: novoValorGuardado, valor_alcancado: metaAtingida })
                .eq('id', meta.id) 
                .select();

                if (erroGuardar) {
                    alert("Erro ao guardar dinheiro: " + erroGuardar.message);
                    console.error("Erro:", erroGuardar.message);
                } else {
                    alert("Dinheiro guardado com sucesso!");
                    await buscarMeta(); 
                }

            });
            
            grupoBotoes.appendChild(botaoExcluir);
            grupoBotoes.appendChild(botaoEditar);
            grupoBotoes.appendChild(botaoGuardar);

            linha.appendChild(infoTexto);
            linha.appendChild(grupoBotoes);
            
            lista.appendChild(linha);
        });
    }
}

const botaoSalvar = document.getElementById('btn-salvar');

botaoSalvar.addEventListener('click', async function() {
    const salvarValorTotal = document.getElementById('valor_total').value;
    const salvarObjetivo = document.getElementById('objetivo').value;
    const salvarDataHoraInicio = document.getElementById('data_hora_inicio').value;
    
    const { data, error } = await clienteSupabase.auth.getUser();
    
    if(salvarValorTotal <= 0 || salvarObjetivo == "" || salvarDataHoraInicio == "")
        {
            alert("Entrada Inválida.");
            return;
        }
    const dataConvertidaInicio = new Date(salvarDataHoraInicio).toISOString();
    
    let dadosSalvos, erroSalvar;

    if (idMetas == null) {
    const resultado = await clienteSupabase
        .from('metas')
        .insert({ usuario_id: data.user.id, valor_total: salvarValorTotal, objetivo: salvarObjetivo, data_hora_inicio: dataConvertidaInicio, valor_guardado: 0, valor_alcancado: false });
    dadosSalvos = resultado.data;
    erroSalvar = resultado.error;
    }
     else
    {
        const resultado = await clienteSupabase
        .from('metas')
        .update({ valor_total: salvarValorTotal, objetivo: salvarObjetivo, data_hora_inicio: dataConvertidaInicio})
        .eq('id',idMetas);
        dadosSalvos = resultado.data;
        erroSalvar = resultado.error;
    }   
    if(erroSalvar){
        console.error("Erro ao salvar meta:", erroSalvar.message);
        alert("Erro ao salvar meta: " + erroSalvar.message);
    }
    else{
        console.log("Meta salva com sucesso!", dadosSalvos);
        alert("Meta salva com sucesso!");
        buscarMeta();
        document.getElementById('valor_total').value = '';
        document.getElementById('objetivo').value = '';
        document.getElementById('data_hora_inicio').value = '';
        
        idMetas = null;
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