// ===== VARIÁVEIS GLOBAIS =====
let carrinho = [];
let produtoConfigurandoNome = '';
let produtoConfigurandoPreco = 0;
let tipoEntregaSelecionado = '';
let dataSelecionada = '';
const TAXA_UBER = 15; // Taxa fixa de Uber Moto

// Dados da marca
const marcaConfig = {
    whatsapp: '5511987711776',
    instagram: '@chocoval_',
    dataLimite: '31/03/2026'
};

// ===== NOTIFICAÇÕES =====
function mostrarNotificacao(mensagem, tipo = 'info') {
    const container = document.getElementById('notificacoes-site');
    if (!container) {
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast-site toast-${tipo}`;
    toast.textContent = mensagem;

    container.appendChild(toast);

    // Ativa animação de entrada
    requestAnimationFrame(() => {
        toast.classList.add('visivel');
    });

    // Remove após alguns segundos
    setTimeout(() => {
        toast.classList.remove('visivel');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 250);
    }, 2500);
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    verificarDataLimite();
    atualizarContadorCarrinho();
    sincronizarCardsCatalogo();
    
    // Definir data mínima no picker
    const dataInput = document.getElementById('data-entrega');
    if (dataInput) {
        const hoje = new Date().toISOString().split('T')[0];
        dataInput.min = hoje;
    }
});

function renderImagemCard(container, imagem, fallback = '🍫') {
    if (!container) return;
    if (imagem && imagem.startsWith('/uploads/')) {
        container.innerHTML = `<img src="${imagem}" alt="Produto">`;
    } else {
        container.textContent = imagem || fallback;
    }
}

function sincronizarCardsCatalogo() {
    fetch('/api/produtos')
        .then(res => res.json())
        .then(produtos => {
            const colher250 = produtos.find(p => p.nome && p.nome.includes('Colher 250g'));
            const colher500 = produtos.find(p => p.nome && p.nome.includes('Colher 500g'));

            atualizarCardColher('[data-categoria="colher"][data-tamanho="250g"]', colher250, 250);
            atualizarCardColher('[data-categoria="colher"][data-tamanho="500g"]', colher500, 500);
        })
        .catch(() => {
            // Mantém layout estático em caso de falha de rede.
        });
}

function atualizarCardColher(seletor, produto, tamanhoPadrao) {
    if (!produto) return;
    const card = document.querySelector(seletor);
    if (!card) return;

    const imagemEl = card.querySelector('.card-imagem');
    const tituloEl = card.querySelector('h3');
    const precoEl = card.querySelector('.preco');
    const botaoEl = card.querySelector('button');

    renderImagemCard(imagemEl, produto.imagem, '🥄');

    if (tituloEl) {
        tituloEl.textContent = produto.nome.includes('Ovo de Colher') ? 'Ovo de Colher' : produto.nome;
    }

    if (precoEl) {
        precoEl.textContent = `R$ ${Number(produto.preco).toFixed(2).replace('.', ',')}`;
    }

    if (botaoEl) {
        botaoEl.setAttribute('onclick', `abrirConfigurador('${produto.nome}', ${Number(produto.preco)})`);
    }

    card.setAttribute('data-preco', String(Number(produto.preco)));
    if (!card.getAttribute('data-tamanho')) {
        card.setAttribute('data-tamanho', `${tamanhoPadrao}g`);
    }
}

// ===== VERIFICAR DATA LIMITE =====
function verificarDataLimite() {
    const hoje = new Date();
    const dataLimite = new Date('2026-03-31');
    const diasRestantes = Math.ceil((dataLimite - hoje) / (1000 * 60 * 60 * 24));
    
    const statusElement = document.getElementById('status-pedidos');
    if (diasRestantes <= 0) {
        statusElement.innerHTML = '❌ Pedidos Fechados';
        statusElement.style.background = 'rgba(244, 67, 54, 0.3)';
        statusElement.style.borderColor = '#f44336';
    } else if (diasRestantes === 1) {
        statusElement.innerHTML = '⚠️ Último dia para pedir!';
        statusElement.style.background = 'rgba(255, 152, 0, 0.3)';
        statusElement.style.borderColor = '#ff9800';
    }
}

// ===== SELEÇÃO DE TIPO DE ENTREGA =====
function selecionarTipoEntrega(tipo) {
    tipoEntregaSelecionado = tipo;
    
    // Atualizar botões
    document.getElementById('btn-retirada').classList.remove('ativo');
    document.getElementById('btn-uber').classList.remove('ativo');
    
    if (tipo === 'retirada') {
        document.getElementById('btn-retirada').classList.add('ativo');
        document.getElementById('aviso-taxa').style.display = 'none';
        document.getElementById('info-tipo-entrega').textContent = '🏪 Retirada Local em São Paulo';
    } else if (tipo === 'uber') {
        document.getElementById('btn-uber').classList.add('ativo');
        document.getElementById('aviso-taxa').style.display = 'block';
        document.getElementById('info-tipo-entrega').textContent = '🚗 Entrega via Uber Moto (Taxa: +R$ ' + TAXA_UBER.toFixed(2) + ')';
    }
    
    // Abrir modal de data
    document.getElementById('modal-data-entrega').style.display = 'block';
}

function fecharModalData() {
    document.getElementById('modal-data-entrega').style.display = 'none';
    tipoEntregaSelecionado = '';
    dataSelecionada = '';
}

function confirmarData() {
    const dataInput = document.getElementById('data-entrega').value;
    
    if (!dataInput) {
        mostrarNotificacao('Selecione uma data para continuar.', 'warning');
        return;
    }
    
    dataSelecionada = dataInput;
    
    // Preencher campo oculto com informação completa
    const entregaTipo = tipoEntregaSelecionado === 'retirada' 
        ? 'Retirada em São Paulo' 
        : 'Entrega via Uber Moto';
    
    document.getElementById('entrega-tipo').value = entregaTipo + ' - ' + new Date(dataInput).toLocaleDateString('pt-BR');
    
    fecharModalData();
}

// ===== MODAL CONFIGURADOR =====
let modoBase = 'simples'; // 'simples' ou 'meio'

function abrirConfigurador(nomeProduto, precoProduto) {
    produtoConfigurandoNome = nomeProduto;
    produtoConfigurandoPreco = precoProduto;
    
    document.getElementById('produto-nome-modal').textContent = nomeProduto;
    document.getElementById('produto-preco-modal').textContent = `R$ ${precoProduto.toFixed(2)}`;
    
    // Limpar formulário
    document.querySelectorAll('input[name="base"]').forEach(input => input.checked = false);
    document.querySelectorAll('input[name="base-meio"]').forEach(input => {
        input.checked = false;
        input.disabled = false;
    });
    atualizarContadorBaseMeio();
    
    // Resetar para base simples
    alternarModoBase('simples');

    // Carregar recheios ativos da API
    const grid = document.getElementById('grid-sabores');
    grid.innerHTML = '<p style="color:#999;font-size:0.9rem;">Carregando sabores...</p>';
    fetch('/api/recheios')
        .then(res => res.json())
        .then(recheios => {
            grid.innerHTML = '';
            recheios.forEach(r => {
                const label = document.createElement('label');
                label.className = 'sabor-label';
                label.innerHTML = `<input type="checkbox" name="sabores" value="${r.nome}"><span>${r.nome}</span>`;
                grid.appendChild(label);
            });
            // Resetar contador e listeners após popular
            atualizarContadorSabores();
            document.querySelectorAll('input[name="sabores"]').forEach(input => {
                input.addEventListener('change', atualizarContadorSabores);
            });
            document.querySelectorAll('input[name="base-meio"]').forEach(input => {
                input.addEventListener('change', atualizarContadorBaseMeio);
            });
        })
        .catch(() => {
            grid.innerHTML = '<p style="color:#f44336;">Erro ao carregar sabores. Tente novamente.</p>';
        });
    
    document.getElementById('modal-configurador').style.display = 'block';
}

function alternarModoBase(modo) {
    modoBase = modo;

    const btnSimples = document.getElementById('btn-base-simples');
    const btnMeio = document.getElementById('btn-base-meio');
    const opcoesSimples = document.getElementById('opcoes-base-simples');
    const opcoesMeio = document.getElementById('opcoes-base-meio');

    if (modo === 'simples') {
        btnSimples.classList.add('ativo');
        btnMeio.classList.remove('ativo');
        opcoesSimples.style.display = 'flex';
        opcoesMeio.style.display = 'none';
        // Limpar meio a meio
        document.querySelectorAll('input[name="base-meio"]').forEach(input => {
            input.checked = false;
            input.disabled = false;
        });
        atualizarContadorBaseMeio();
    } else {
        btnMeio.classList.add('ativo');
        btnSimples.classList.remove('ativo');
        opcoesSimples.style.display = 'none';
        opcoesMeio.style.display = 'block';
        // Desmarcar radios
        document.querySelectorAll('input[name="base"]').forEach(i => i.checked = false);
        atualizarContadorBaseMeio();
    }
}

function atualizarContadorBaseMeio() {
    const basesMeio = document.querySelectorAll('input[name="base-meio"]');
    const selecionadas = Array.from(basesMeio).filter(input => input.checked).length;

    basesMeio.forEach(input => {
        if (selecionadas >= 2 && !input.checked) {
            input.disabled = true;
        } else {
            input.disabled = false;
        }
    });

    const contador = document.getElementById('contador-base-meio');
    if (contador) {
        contador.textContent = `(${selecionadas}/2)`;
    }
}

function atualizarContadorSabores() {
    const saboresElements = document.querySelectorAll('input[name="sabores"]');
    let selecionados = 0;
    
    saboresElements.forEach(elem => {
        if (elem.checked) {
            selecionados++;
        }
        // Desabilitar se já tem 3 selecionados e este não está marcado
        if (selecionados >= 3 && !elem.checked) {
            elem.disabled = true;
        } else {
            elem.disabled = false;
        }
    });
    
    // Atualizar contador visual
    document.getElementById('contador-sabores').textContent = `(${selecionados}/3)`;
    
    // Mostrar/esconder aviso
    const avisoElement = document.getElementById('aviso-sabores');
    if (selecionados >= 3) {
        avisoElement.style.display = 'block';
    } else {
        avisoElement.style.display = 'none';
    }
}

function fecharConfigurador() {
    // Remover listeners para evitar múltiplas chamadas
    document.querySelectorAll('input[name="sabores"]').forEach(input => {
        input.removeEventListener('change', atualizarContadorSabores);
    });
    document.querySelectorAll('input[name="base-meio"]').forEach(input => {
        input.removeEventListener('change', atualizarContadorBaseMeio);
    });
    document.getElementById('modal-configurador').style.display = 'none';
}

function adicionarConfigurado(event) {
    event.preventDefault();
    
    // Pegar base selecionada
    const baseElements = document.querySelectorAll('input[name="base"]');
    let baseEscolhida = '';
    for (let elem of baseElements) {
        if (elem.checked) {
            baseEscolhida = elem.value;
            break;
        }
    }
    // (meio a meio é resolvido logo abaixo, antes da validação)
    
    // Pegar sabores selecionados
    const saboresElements = document.querySelectorAll('input[name="sabores"]');
    let saboresEscolhidos = [];
    for (let elem of saboresElements) {
        if (elem.checked) {
            saboresEscolhidos.push(elem.value);
        }
    }
    
    // Se modo meio a meio, montar base combinada
    if (modoBase === 'meio') {
        const basesSelecionadas = Array.from(document.querySelectorAll('input[name="base-meio"]:checked'));
        if (basesSelecionadas.length !== 2) {
            mostrarNotificacao('Escolha exatamente 2 bases para o meio a meio.', 'warning');
            return;
        }
        const nomesBases = basesSelecionadas.map(input => input.value);
        baseEscolhida = `${nomesBases[0]} + ${nomesBases[1]} (Meio a Meio)`;
    }

    if (!baseEscolhida) {
        mostrarNotificacao('Escolha uma base de chocolate.', 'warning');
        return;
    }
    
    if (saboresEscolhidos.length === 0) {
        mostrarNotificacao('Escolha pelo menos um sabor.', 'warning');
        return;
    }
    
    // Validar máximo 3 sabores para Ovos de Colher
    if (produtoConfigurandoNome.includes('Colher') && saboresEscolhidos.length > 3) {
        mostrarNotificacao('Maximo de 3 sabores para Ovos de Colher.', 'warning');
        return;
    }
    
    // Criar descrição do produto configurado
    const descricao = `Base: ${baseEscolhida} | Sabores: ${saboresEscolhidos.join(', ')}`;
    
    // Adicionar ao carrinho
    carrinho.push({
        nome: produtoConfigurandoNome,
        preco: produtoConfigurandoPreco,
        descricao: descricao,
        id: Date.now()
    });
    
    mostrarNotificacao(`${produtoConfigurandoNome} adicionado ao carrinho.`, 'success');
    fecharConfigurador();
    atualizarCarrinho();
}

// ===== ADICIONAR SIMPLES AO CARRINHO =====
function adicionarAoCarrinho(nomeProduto, precoProduto, descricao) {
    carrinho.push({
        nome: nomeProduto,
        preco: precoProduto,
        descricao: descricao || '',
        id: Date.now()
    });
    
    mostrarNotificacao(`${nomeProduto} adicionado ao carrinho.`, 'success');
    atualizarCarrinho();
}

// ===== CARRINHO =====
function atualizarCarrinho() {
    // Atualizar contador
    atualizarContadorCarrinho();
    
    // Atualizar items
    const carrinhoItems = document.getElementById('carrinho-items');
    carrinhoItems.innerHTML = '';
    
    let total = 0;
    
    if (carrinho.length === 0) {
        carrinhoItems.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Seu carrinho está vazio</p>';
        document.getElementById('total').textContent = '0,00';
        return;
    }
    
    carrinho.forEach((item, index) => {
        total += item.preco;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'carrinho-item';
        itemDiv.innerHTML = `
            <div>
                <strong>${item.nome}</strong>
                ${item.descricao ? `<div style="font-size: 0.8rem; color: #666; margin: 0.3rem 0;">${item.descricao}</div>` : ''}
                <span class="preco-item">R$ ${item.preco.toFixed(2)}</span>
            </div>
            <button class="btn btn-secondary" onclick="removerDoCarrinho(${index})" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                🗑️ Remover
            </button>
        `;
        carrinhoItems.appendChild(itemDiv);
    });
    
    document.getElementById('total').textContent = total.toFixed(2);
}

function atualizarContadorCarrinho() {
    document.getElementById('contador-carrinho').textContent = carrinho.length;
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarCarrinho();
}

function abrirCarrinho() {
    if (carrinho.length === 0) {
        mostrarNotificacao('Seu carrinho esta vazio. Adicione alguns ovos.', 'info');
        return;
    }
    document.getElementById('modal-carrinho').style.display = 'block';
    atualizarCarrinho();
}

function fecharCarrinho() {
    document.getElementById('modal-carrinho').style.display = 'none';
}

// ===== FINALIZAR PEDIDO =====
function finalizarPedido(event) {
    event.preventDefault();
    
    if (carrinho.length === 0) {
        mostrarNotificacao('Seu carrinho esta vazio.', 'warning');
        return;
    }
    
    const nomeCliente = document.getElementById('nome-cliente').value.trim();
    const tipoEntrega = document.getElementById('entrega-tipo').value;
    
    if (!nomeCliente || !tipoEntrega) {
        mostrarNotificacao('Preencha nome e forma de entrega.', 'warning');
        return;
    }
    
    // Calcular total com taxa de Uber Moto se necessário
    let total = carrinho.reduce((sum, item) => sum + item.preco, 0);
    let taxaUber = 0;
    
    if (tipoEntrega.includes('Uber Moto')) {
        taxaUber = TAXA_UBER;
        total += taxaUber;
    }
    
    let totalSemTaxa = carrinho.reduce((sum, item) => sum + item.preco, 0);
    
    // Salvar pedido no banco de dados
    const pedidoData = {
        nome: nomeCliente,
        email: document.getElementById('email-cliente')?.value || '',
        telefone: document.getElementById('telefone-cliente')?.value || '',
        itens: carrinho,
        total: total
    };
    
    // Enviar pedido para o servidor
    fetch('/api/pedidos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pedidoData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            console.log('✅ Pedido salvo no sistema! ID:', data.id);

            // Limpar e mostrar modal de sucesso
            setTimeout(() => {
                carrinho = [];
                document.getElementById('nome-cliente').value = '';
                document.getElementById('entrega-tipo').value = '';
                document.getElementById('email-cliente').value = '';
                document.getElementById('telefone-cliente').value = '';
                fecharCarrinho();
                atualizarCarrinho();
                
                // Mostrar modal de sucesso com informações
                let mensagemSucesso = `✅ Seu pedido foi recebido com sucesso!\n\n`;
                mensagemSucesso += `📋 ID do Pedido: #${data.id}\n`;
                mensagemSucesso += `💰 Valor Total: R$ ${total.toFixed(2)}\n\n`;
                mensagemSucesso += `⏳ Agora vamos analisar seu pedido no painel.\n`;
                mensagemSucesso += `📱 O WhatsApp só será aberto após aprovação do pedido no admin.`;
                
                mostrarModalSucesso(mensagemSucesso);
            }, 500);
        } else {
            mostrarNotificacao('Erro ao salvar pedido. Tente novamente.', 'error');
        }
    })
    .catch(err => {
        console.error('Erro:', err);
        mostrarNotificacao('Erro ao enviar pedido. Tente novamente.', 'error');
    });
}

// ===== MODAL DE SUCESSO =====
function mostrarModalSucesso(mensagem) {
    document.getElementById('msg-sucesso').textContent = mensagem;
    document.getElementById('modal-sucesso').style.display = 'block';
}

function fecharModalSucesso() {
    document.getElementById('modal-sucesso').style.display = 'none';
}

// ===== FECHAR MODAIS AO CLICAR FORA =====
window.onclick = function(event) {
    const modalConfigurador = document.getElementById('modal-configurador');
    const modalCarrinho = document.getElementById('modal-carrinho');
    const modalDataEntrega = document.getElementById('modal-data-entrega');
    const modalSucesso = document.getElementById('modal-sucesso');
    
    if (event.target === modalConfigurador) {
        fecharConfigurador();
    }
    if (event.target === modalCarrinho) {
        fecharCarrinho();
    }
    if (event.target === modalDataEntrega) {
        fecharModalData();
    }
    if (event.target === modalSucesso) {
        fecharModalSucesso();
    }
}

// ===== FECHAR MODAIS COM ESC =====
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        fecharConfigurador();
        fecharCarrinho();
        fecharModalData();
        fecharModalSucesso();
    }
});
