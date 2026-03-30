// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    atualizarRelogio();
    setInterval(atualizarRelogio, 1000);
    carregarProdutos();
    carregarRecheios();
    carregarPedidos();
    atualizarDashboard();
});

// ===== RELOGIO =====
function atualizarRelogio() {
    const agora = new Date();
    document.getElementById('data-hora').textContent = agora.toLocaleString('pt-BR');
}

// ===== NAVEGAÇÃO =====
function mostrarSecao(secao) {
    // Ocultar todas as seções
    document.querySelectorAll('.secao').forEach(s => s.classList.remove('ativa'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('ativo'));

    // Mostrar seção selecionada
    document.getElementById(secao + '-secao').classList.add('ativa');
    event.target.classList.add('ativo');

    // Recarregar dados quando mudar de seção
    if (secao === 'produtos') {
        carregarProdutos();
    } else if (secao === 'recheios') {
        carregarRecheios();
    } else if (secao === 'pedidos') {
        carregarPedidos();
    } else if (secao === 'dashboard') {
        atualizarDashboard();
    }
}

// ===== DASHBOARD =====
function atualizarDashboard() {
    carregarProdutos();
    carregarRecheios();
    carregarPedidos();
    // Os dados são atualizados nas funções correspondentes
}

// ===== PRODUTOS =====
function carregarProdutos() {
    fetch('/api/admin/produtos')
        .then(res => res.json())
        .then(produtos => {
            const lista = document.getElementById('lista-produtos');
            lista.innerHTML = '';

            // Atualizar contador no dashboard
            document.getElementById('total-produtos').textContent = produtos.length;

            if (produtos.length === 0) {
                lista.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Nenhum produto cadastrado</p>';
                return;
            }

            produtos.forEach(produto => {
                const card = document.createElement('div');
                card.className = `card-produto-admin${produto.ativo ? '' : ' pausado'}`;
                const btnPause = produto.ativo
                    ? `<button class="btn btn-warning btn-pequeno" onclick="toggleProduto(${produto.id})">⏸ Pausar</button>`
                    : `<button class="btn btn-success btn-pequeno" onclick="toggleProduto(${produto.id})">▶ Reativar</button>`;
                card.innerHTML = `
                    <div class="imagem">
                        ${produto.imagem.startsWith('/uploads/') ? `<img src="${produto.imagem}" alt="${produto.nome}">` : produto.imagem}
                    </div>
                    ${!produto.ativo ? '<div class="badge-pausado">⏸ Pausado</div>' : ''}
                    <h4>${produto.nome}</h4>
                    <p class="descricao">${produto.descricao || 'Sem descrição'}</p>
                    <p class="preco">R$ ${produto.preco.toFixed(2)}</p>
                    <div class="acoes">
                        <button class="btn btn-primary btn-pequeno" onclick="editarProduto(${produto.id})">✏️ Editar</button>
                        ${btnPause}
                        <button class="btn btn-danger btn-pequeno" onclick="deletarProduto(${produto.id})">🗑️ Deletar</button>
                    </div>
                `;
                lista.appendChild(card);
            });
        })
        .catch(err => console.error('Erro:', err));
}

function mostrarFormProduto() {
    document.getElementById('form-container').classList.remove('hidden');
    document.getElementById('form-produto').reset();
    document.getElementById('form-produto').dataset.editId = '';
}

function cancelarFormProduto() {
    document.getElementById('form-container').classList.add('hidden');
    document.getElementById('form-produto').reset();
}

function salvarProduto(event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append('nome', document.getElementById('nome-produto').value);
    formData.append('descricao', document.getElementById('descricao-produto').value);
    formData.append('preco', document.getElementById('preco-produto').value);
    
    const imagem = document.getElementById('imagem-produto').files[0];
    if (imagem) {
        formData.append('imagem', imagem);
    }

    const editId = document.getElementById('form-produto').dataset.editId;
    const url = editId ? `/api/admin/produtos/${editId}` : '/api/admin/produtos';
    const method = editId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            alert(editId ? 'Produto atualizado!' : 'Produto adicionado!');
            cancelarFormProduto();
            carregarProdutos();
        } else {
            alert('Erro: ' + data.erro);
        }
    })
    .catch(err => {
        console.error('Erro:', err);
        alert('Erro ao salvar produto');
    });
}

function editarProduto(id) {
    fetch(`/api/produtos/${id}`)
        .then(res => res.json())
        .then(produto => {
            document.getElementById('nome-produto').value = produto.nome;
            document.getElementById('descricao-produto').value = produto.descricao;
            document.getElementById('preco-produto').value = produto.preco;
            document.getElementById('form-produto').dataset.editId = id;
            document.getElementById('form-container').classList.remove('hidden');
            document.querySelector('.form-container h3').textContent = 'Editar Produto';
        })
        .catch(err => console.error('Erro:', err));
}

function deletarProduto(id) {
    if (!confirm('Tem certeza que deseja deletar este produto?')) {
        return;
    }

    fetch(`/api/admin/produtos/${id}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            alert('Produto deletado!');
            carregarProdutos();
        } else {
            alert('Erro: ' + data.erro);
        }
    })
    .catch(err => {
        console.error('Erro:', err);
        alert('Erro ao deletar produto');
    });
}

function toggleProduto(id) {
    fetch(`/api/admin/produtos/${id}/toggle`, { method: 'PUT' })
        .then(res => res.json())
        .then(data => {
            if (data.sucesso) {
                carregarProdutos();
            } else {
                alert('Erro ao alterar produto');
            }
        })
        .catch(err => console.error('Erro:', err));
}

// ===== RECHEIOS =====
function carregarRecheios() {
    fetch('/api/admin/recheios')
        .then(res => res.json())
        .then(recheios => {
            const lista = document.getElementById('lista-recheios');
            if (!lista) return;
            lista.innerHTML = '';

            if (recheios.length === 0) {
                lista.innerHTML = '<p style="text-align:center;color:#999;">Nenhum recheio cadastrado</p>';
                return;
            }

            recheios.forEach(recheio => {
                const card = document.createElement('div');
                card.className = `card-recheio${recheio.ativo ? '' : ' pausado'}`;
                const btnToggle = recheio.ativo
                    ? `<button class="btn btn-warning btn-pequeno" onclick="toggleRecheio(${recheio.id})">⏸ Pausar</button>`
                    : `<button class="btn btn-success btn-pequeno" onclick="toggleRecheio(${recheio.id})">▶ Reativar</button>`;
                card.innerHTML = `
                    <div class="recheio-info">
                        <span class="recheio-nome">${recheio.nome}</span>
                        ${!recheio.ativo ? '<span class="badge-pausado">⏸ Pausado</span>' : '<span class="badge-ativo">✅ Ativo</span>'}
                    </div>
                    <div class="acoes">
                        ${btnToggle}
                        <button class="btn btn-danger btn-pequeno" onclick="deletarRecheio(${recheio.id})">🗑️</button>
                    </div>
                `;
                lista.appendChild(card);
            });
        })
        .catch(err => console.error('Erro:', err));
}

function mostrarFormRecheio() {
    document.getElementById('form-container-recheio').classList.remove('hidden');
    document.getElementById('nome-recheio').value = '';
}

function cancelarFormRecheio() {
    document.getElementById('form-container-recheio').classList.add('hidden');
}

function salvarRecheio(event) {
    event.preventDefault();
    const nome = document.getElementById('nome-recheio').value.trim();
    if (!nome) return;

    fetch('/api/admin/recheios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            cancelarFormRecheio();
            carregarRecheios();
        } else {
            alert('Erro: ' + data.erro);
        }
    })
    .catch(err => console.error('Erro:', err));
}

function toggleRecheio(id) {
    fetch(`/api/admin/recheios/${id}/toggle`, { method: 'PUT' })
        .then(res => res.json())
        .then(data => {
            if (data.sucesso) {
                carregarRecheios();
            } else {
                alert('Erro ao alterar recheio');
            }
        })
        .catch(err => console.error('Erro:', err));
}

function deletarRecheio(id) {
    if (!confirm('Deletar este recheio?')) return;
    fetch(`/api/admin/recheios/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.sucesso) carregarRecheios();
        })
        .catch(err => console.error('Erro:', err));
}

// ===== PEDIDOS =====
let todosPedidos = [];
const whatsappLoja = '5511987711776';

function carregarPedidos() {
    fetch('/api/admin/pedidos')
        .then(res => res.json())
        .then(pedidos => {
            todosPedidos = pedidos;
            exibirPedidos(pedidos);
            atualizarEstatisticasPedidos(pedidos);
        })
        .catch(err => console.error('Erro:', err));
}

function normalizarStatusPedido(status) {
    if (status === 'pendente') return 'fazendo';
    if (status === 'enviado') return 'entregue';
    return status || 'fazendo';
}

function textoStatusPedido(status) {
    const mapa = {
        fazendo: 'FAZENDO',
        confirmado: 'CONFIRMADO',
        entregue: 'ENTREGUE'
    };
    return mapa[status] || (status || 'FAZENDO').toUpperCase();
}

function exibirPedidos(pedidos) {
    const lista = document.getElementById('lista-pedidos');
    lista.innerHTML = '';

    if (pedidos.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Nenhum pedido recebido</p>';
        return;
    }

    pedidos.forEach(pedido => {
        const itensList = pedido.itens.map(item => `${item.nome} - R$ ${item.preco.toFixed(2)}`).join('<br>');
        const statusAtual = normalizarStatusPedido(pedido.status);
        
        const card = document.createElement('div');
        card.className = 'pedido-card';
        card.innerHTML = `
            <div class="pedido-header">
                <div class="pedido-info">
                    <h4>Pedido #${pedido.id}</h4>
                    <p><strong>${pedido.nome}</strong></p>
                    <p>📧 ${pedido.email}</p>
                    <p>📱 ${pedido.telefone}</p>
                    <p style="font-size: 0.8rem; color: #999;">📅 ${new Date(pedido.criado_em).toLocaleString('pt-BR')}</p>
                </div>
                <div class="pedido-status">
                    <span class="status-badge status-${statusAtual}">${textoStatusPedido(statusAtual)}</span>
                    <div class="status-actions">
                        <button class="status-btn ${statusAtual === 'fazendo' ? 'ativo' : ''}" onclick="atualizarStatusPedido(${pedido.id}, 'fazendo')">👩‍🍳 Fazendo</button>
                        <button class="status-btn ${statusAtual === 'confirmado' ? 'ativo' : ''}" onclick="atualizarStatusPedido(${pedido.id}, 'confirmado')">✅ Confirmado</button>
                        <button class="status-btn ${statusAtual === 'entregue' ? 'ativo' : ''}" onclick="atualizarStatusPedido(${pedido.id}, 'entregue')">📦 Entregue</button>
                    </div>
                </div>
            </div>
            <div class="pedido-itens">
                <h5>📦 Itens do Pedido:</h5>
                <ul>${itensList.split('<br>').map(item => `<li>• ${item}</li>`).join('')}</ul>
            </div>
            <div class="pedido-total">💰 Total: R$ ${pedido.total.toFixed(2)}</div>
        `;
        lista.appendChild(card);
    });
}

function atualizarStatusPedido(id, novoStatus) {
    fetch(`/api/admin/pedidos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            if (novoStatus === 'confirmado') {
                const pedido = todosPedidos.find(p => p.id === id);
                if (pedido) {
                    const urlWhatsApp = montarLinkWhatsAppPedido(pedido);
                    window.open(urlWhatsApp, '_blank');
                }
            }
            carregarPedidos();
        } else {
            alert('Erro ao atualizar pedido');
        }
    })
    .catch(err => {
        console.error('Erro:', err);
        alert('Erro ao atualizar pedido');
    });
}

function montarLinkWhatsAppPedido(pedido) {
    const itens = (pedido.itens || []).map((item, index) => {
        const linhaBase = `${index + 1}. ${item.nome} - R$ ${Number(item.preco).toFixed(2)}`;
        return item.descricao ? `${linhaBase}\n   - ${item.descricao}` : linhaBase;
    }).join('\n');

    const mensagem =
        `🍫 *PEDIDO CONFIRMADO - CHOCOVAL* 🍫\n\n` +
        `📋 Pedido #${pedido.id}\n` +
        `👤 Cliente: ${pedido.nome || '-'}\n` +
        `📧 Email: ${pedido.email || '-'}\n` +
        `📱 Telefone: ${pedido.telefone || '-'}\n\n` +
        `🛒 Itens:\n${itens}\n\n` +
        `💵 Total: R$ ${Number(pedido.total || 0).toFixed(2)}`;

    return `https://wa.me/${whatsappLoja}?text=${encodeURIComponent(mensagem)}`;
}

function filtrarPedidos() {
    const filtro = document.getElementById('filtro-status').value;
    
    if (filtro === '') {
        exibirPedidos(todosPedidos);
    } else {
        const pedidosFiltrados = todosPedidos.filter(p => normalizarStatusPedido(p.status) === filtro);
        exibirPedidos(pedidosFiltrados);
    }
}

function atualizarEstatisticasPedidos(pedidos) {
    // Total de pedidos
    document.getElementById('total-pedidos').textContent = `${pedidos.length} pedido(s)`;

    // Receita total
    const receita = pedidos.reduce((sum, p) => sum + p.total, 0);
    document.getElementById('receita-total').textContent = `R$ ${receita.toFixed(2)}`;
}

// ===== FECHAR QUANDO CLICAR FORA DE INPUTS =====
document.addEventListener('click', (e) => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
        // Pode fazer algo aqui se necessário
    }
});
