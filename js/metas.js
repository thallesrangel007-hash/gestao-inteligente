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
        Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Erro ao buscar meta!',
                    confirmButtonColor: '#1a5c3d'
                    }); 
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
            
            botaoExcluir.addEventListener('click', function() {
                Swal.fire({
                    title: 'Tem certeza?',
                    text: "Você não poderá reverter a exclusão desta meta!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#e74c3c', 
                    cancelButtonColor: '#7f8c8d', 
                    confirmButtonText: 'Sim, excluir!',
                    cancelButtonText: 'Cancelar'
                }).then(async (result) => {
                    // Só executa a exclusão se o botão "Sim, excluir!" for clicado
                    if (result.isConfirmed) {
                        const {data: dadosExcluidos, error: erroExcluir } = await clienteSupabase
                        .from('metas')
                        .delete()
                        .eq('id', meta.id);
                        
                        if (erroExcluir) {
                            console.error("Erro ao excluir meta:", erroExcluir.message);
                            Swal.fire({
                                icon: 'error',
                                title: 'Oops...',
                                text: 'Erro ao excluir meta!',
                                confirmButtonColor: '#1a5c3d'
                            }); 
                        } else {
                            Swal.fire({
                                icon: 'success',
                                title: 'Excluído!',
                                text: 'A meta foi excluída com sucesso.',
                                confirmButtonColor: '#1a5c3d'
                            });
                            buscarMeta(); // Recarrega a lista atualizada
                        }
                    }
                });
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
               const { value: valorDigitado } = await Swal.fire({
                    title: 'Guardar Dinheiro',
                    input: 'number',
                    inputLabel: 'Qual valor quer guardar?',
                    inputPlaceholder: 'Ex: 50.00',
                    showCancelButton: true,
                    confirmButtonColor: '#1a5c3d',
                    cancelButtonColor: '#e74c3c',
                    confirmButtonText: 'Confirmar',
                    cancelButtonText: 'Cancelar'
                });

               if(valorDigitado == null || valorDigitado == "")
               {
                return;
               }
               let numDigitado = Number(valorDigitado);
               let valorFaltante = Number(meta.valor_total) - Number(meta.valor_guardado);
               if (isNaN(numDigitado) || numDigitado <= 0) {
                    Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Erro! Digite um valor numérico válido',
                    confirmButtonColor: '#1a5c3d'
                    }); 
                    return; 
                }
    
                if (numDigitado > valorFaltante) {
                     const valorFormatado = Number(valorFaltante).toLocaleString(localeMoeda, { style: 'currency', currency: moedaUsuario});
                    Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: `O valor ultrapassa a meta! Falta pagar apenas: ${valorFormatado}`,
                    confirmButtonColor: '#1a5c3d'
                    }); 
                    return; 
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
                    Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Erro ao guardar dinheiro!',
                    confirmButtonColor: '#1a5c3d'
                });
                    console.error("Erro:", erroGuardar.message);
                } else {
                    Swal.fire({
                    icon: 'success', 
                    title: 'Sucesso!',
                    text: 'Dinheiro guardado com êxito!',
                    confirmButtonColor: '#1a5c3d'
                });
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
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Entrada Inválida!',
                confirmButtonColor: '#1a5c3d'
        });
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
        Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Erro ao salvar meta!',
                confirmButtonColor: '#1a5c3d'
        });
    }
    else{
        console.log("Meta salva com sucesso!", dadosSalvos);
        Swal.fire({
                icon: 'success', 
                title: 'Sucesso!',
                text: 'Meta salva com êxito!',
                confirmButtonColor: '#1a5c3d'
            });
        buscarMeta();
        document.getElementById('valor_total').value = '';
        document.getElementById('objetivo').value = '';
        document.getElementById('data_hora_inicio').value = '';
        
        idMetas = null;
    }
});

const botaoSair = document.getElementById('btn-sair');

if (botaoSair) {
    // Retiramos o 'async' daqui
    botaoSair.addEventListener('click', function(event) {
        event.preventDefault(); // Evita que o link recarregue a página abruptamente
        
        Swal.fire({
            title: 'Tem certeza?',
            text: "Você precisará fazer login novamente para acessar o painel.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c', 
            cancelButtonColor: '#7f8c8d',  
            confirmButtonText: 'Sim, sair da conta!', 
            cancelButtonText: 'Cancelar'
        }).then(async (result) => { 
            
            if (result.isConfirmed) {
                const { error } = await clienteSupabase.auth.signOut();
        
                if (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'Erro ao sair!',
                        confirmButtonColor: '#1a5c3d'
                    });
                } else {
                    // Sessão encerrada no banco, devolve o utilizador para a tela de login
                    window.location.href = 'index.html'; 
                }
            } 
            
        });
    });
}