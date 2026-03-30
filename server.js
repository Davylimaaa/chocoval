const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.db');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'public', 'uploads');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configurar pasta de uploads
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configurar multer para upload de imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'produto-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Banco de dados
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite');
        inicializarDB();
    }
});

// Promisify para usar async/await
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Inicializar banco de dados
function inicializarDB() {
    db.serialize(() => {
        // Tabela de produtos
        db.run(`
            CREATE TABLE IF NOT EXISTS produtos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                descricao TEXT,
                preco REAL NOT NULL,
                imagem TEXT,
                ativo INTEGER DEFAULT 1,
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela de pedidos
        db.run(`
            CREATE TABLE IF NOT EXISTS pedidos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT NOT NULL,
                telefone TEXT NOT NULL,
                itens TEXT NOT NULL,
                total REAL NOT NULL,
                status TEXT DEFAULT 'pendente',
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela de configurações
        db.run(`
            CREATE TABLE IF NOT EXISTS configuracoes (
                chave TEXT PRIMARY KEY,
                valor TEXT
            )
        `);

        // Tabela de recheios
        db.run(`
            CREATE TABLE IF NOT EXISTS recheios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                ativo INTEGER DEFAULT 1
            )
        `);

        // Inserir recheios padrão se não existirem
        db.get('SELECT COUNT(*) as count FROM recheios', (err, row) => {
            if (err) return;
            if (row.count === 0) {
                const recheiosDefault = [
                    'Sensação', 'Ovomaltine', 'Maracujá', 'Prestígio', 'Brigadeiro',
                    'Nutella', 'Ninho', 'KitKat', 'Napolitano', 'Delícia de Uva'
                ];
                recheiosDefault.forEach(nome => {
                    db.run('INSERT INTO recheios (nome) VALUES (?)', [nome]);
                });
            }
        });

        // Inserir produtos padrão se não existirem
        db.get('SELECT COUNT(*) as count FROM produtos', (err, row) => {
            if (err) return;
            if (row.count === 0) {
                const produtosDefault = [
                    // OVOS DE COLHER
                    { nome: 'Ovo de Colher 250g', descricao: 'Delicioso ovo de colher com sabor customizável', preco: 59.00, categoria: 'colher', tamanho: '250g', imagem: '🥄' },
                    { nome: 'Ovo de Colher 500g', descricao: 'Ovo de colher generoso com múltiplas opções de sabor', preco: 89.00, categoria: 'colher', tamanho: '500g', imagem: '🥄' },
                    
                    // LINHA INFANTIL
                    { nome: 'Ovo Infantil + Chaveiro Pelúcia', descricao: '400g + Surpresa: Stitch ou Capivara', preco: 95.00, categoria: 'infantil', imagem: '🧸' },
                    { nome: 'Ovo Infantil + Chuva de Sabão', descricao: '400g + Chuva de Sabão com pilhas', preco: 85.00, categoria: 'infantil', imagem: '🫧' },
                    { nome: 'Ovo Infantil + Carrinho Corrida', descricao: '400g + Carrinho de Corrida', preco: 75.00, categoria: 'infantil', imagem: '🏎️' },
                    { nome: 'Ovo Infantil + Capimiga', descricao: '400g + Capimiga / Capibolsa', preco: 75.00, categoria: 'infantil', imagem: '👜' },
                    { nome: 'Ovo Infantil + Copo Personagem', descricao: '300g + Copo: Spider-man ou Minnie', preco: 49.99, categoria: 'infantil', imagem: '🥤' },
                    { nome: 'Ovo Infantil + Fábrica Miçangas', descricao: '400g + Fábrica de Miçangas', preco: 75.00, categoria: 'infantil', imagem: '✨' },
                    { nome: 'Ovo Infantil + Squishy Patinha', descricao: '400g + Squishy Patinha', preco: 65.00, categoria: 'infantil', imagem: '🐾' },
                    { nome: 'Ovo Infantil + Labubu', descricao: '400g + Chaveirinho Labubu', preco: 65.00, categoria: 'infantil', imagem: '👾' },
                    
                    // TRADICIONAIS
                    { nome: 'Ovo Tradicional 300g', descricao: 'Chocolate tradicional: Ao Leite, Amargo ou Branco', preco: 38.00, categoria: 'tradicional', tamanho: '300g', imagem: '🍫' },
                    { nome: 'Ovo Tradicional 500g', descricao: 'Chocolate tradicional em tamanho médio', preco: 55.00, categoria: 'tradicional', tamanho: '500g', imagem: '🍫' },
                    { nome: 'Ovo Tradicional 1kg', descricao: 'Chocolate tradicional economia', preco: 92.00, categoria: 'tradicional', tamanho: '1kg', imagem: '🍫' },
                    
                    // CROCANTES
                    { nome: 'Ovo Crocante 300g', descricao: 'Crocante: Cereal, M&M\'s ou Amendoim', preco: 42.00, categoria: 'crocante', tamanho: '300g', imagem: '✨' },
                    { nome: 'Ovo Crocante 500g', descricao: 'Ovo crocante recheado em tamanho médio', preco: 58.00, categoria: 'crocante', tamanho: '500g', imagem: '✨' },
                    { nome: 'Ovo Crocante 1kg', descricao: 'Ovo crocante economia tamanho grande', preco: 99.00, categoria: 'crocante', tamanho: '1kg', imagem: '✨' },
                    
                    // CORAÇÕES
                    { nome: 'Coração Tradicional 500g', descricao: 'Coração de chocolate tradicional', preco: 60.00, categoria: 'coracao', imagem: '❤️' },
                    { nome: 'Coração Crocante 500g', descricao: 'Coração de chocolate crocante', preco: 65.00, categoria: 'coracao', imagem: '❤️' },
                    { nome: 'Coração Trufado 500g', descricao: 'Coração premium com trufas', preco: 85.00, categoria: 'coracao', imagem: '❤️' },
                    
                    // TRUFADOS
                    { nome: 'Ovo Trufado 350g', descricao: 'Ovo premium com deliciosas trufas', preco: 64.00, categoria: 'trufado', tamanho: '350g', imagem: '✨' },
                    { nome: 'Ovo Trufado 500g', descricao: 'Ovo trufado em tamanho generoso', preco: 85.00, categoria: 'trufado', tamanho: '500g', imagem: '✨' },
                    { nome: 'Ovo Trufado 1kg', descricao: 'Ovo trufado extra grande', preco: 130.00, categoria: 'trufado', tamanho: '1kg', imagem: '✨' }
                ];

                produtosDefault.forEach(produto => {
                    db.run(
                        'INSERT INTO produtos (nome, descricao, preco, imagem) VALUES (?, ?, ?, ?)',
                        [produto.nome, produto.descricao, produto.preco, produto.imagem]
                    );
                });
            }
        });
    });
}

// ===== ROTAS API =====

// Obter recheios ativos (storefront)
app.get('/api/recheios', async (req, res) => {
    try {
        const recheios = await dbAll('SELECT * FROM recheios WHERE ativo = 1 ORDER BY id');
        res.json(recheios);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Obter todos os produtos ativos
app.get('/api/produtos', async (req, res) => {
    try {
        const produtos = await dbAll('SELECT * FROM produtos WHERE ativo = 1 ORDER BY id DESC');
        res.json(produtos);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Obter um produto
app.get('/api/produtos/:id', async (req, res) => {
    try {
        const produto = await dbGet('SELECT * FROM produtos WHERE id = ?', [req.params.id]);
        res.json(produto);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Criar pedido
app.post('/api/pedidos', async (req, res) => {
    try {
        const { nome, email, telefone, itens, total } = req.body;
        
        if (!nome || !telefone || !itens || !total) {
            return res.status(400).json({ erro: 'Dados incompletos' });
        }

        const result = await dbRun(
            'INSERT INTO pedidos (nome, email, telefone, itens, total) VALUES (?, ?, ?, ?, ?)',
            [nome, email, telefone, JSON.stringify(itens), total]
        );

        res.json({ sucesso: true, id: result.lastID });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// ===== ROTAS DO PAINEL ADMIN =====

// Healthcheck para deploy (Render)
app.get('/health', (req, res) => {
    res.status(200).json({ ok: true, service: 'chocoval-api' });
});

// Servir página de admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Obter todos os produtos (admin)
app.get('/api/admin/produtos', async (req, res) => {
    try {
        const produtos = await dbAll('SELECT * FROM produtos ORDER BY id DESC');
        res.json(produtos);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Criar produto
app.post('/api/admin/produtos', upload.single('imagem'), async (req, res) => {
    try {
        const { nome, descricao, preco } = req.body;
        const imagem = req.file ? `/uploads/${req.file.filename}` : '🥚';

        if (!nome || !preco) {
            return res.status(400).json({ erro: 'Nome e preço são obrigatórios' });
        }

        const result = await dbRun(
            'INSERT INTO produtos (nome, descricao, preco, imagem) VALUES (?, ?, ?, ?)',
            [nome, descricao, preco, imagem]
        );

        res.json({ sucesso: true, id: result.lastID });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Atualizar produto
app.put('/api/admin/produtos/:id', upload.single('imagem'), async (req, res) => {
    try {
        const { nome, descricao, preco, ativo } = req.body;
        const id = req.params.id;

        let produto = await dbGet('SELECT * FROM produtos WHERE id = ?', [id]);
        
        if (!produto) {
            return res.status(404).json({ erro: 'Produto não encontrado' });
        }

        const imagem = req.file ? `/uploads/${req.file.filename}` : produto.imagem;

        await dbRun(
            'UPDATE produtos SET nome = ?, descricao = ?, preco = ?, imagem = ?, ativo = ? WHERE id = ?',
            [nome, descricao, preco, imagem, ativo !== undefined ? ativo : 1, id]
        );

        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Deletar produto
app.delete('/api/admin/produtos/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Buscar o produto para deletar a imagem
        const produto = await dbGet('SELECT * FROM produtos WHERE id = ?', [id]);
        
        if (produto && produto.imagem && produto.imagem.startsWith('/uploads/')) {
            const caminhoImagem = path.join(__dirname, 'public', produto.imagem);
            if (fs.existsSync(caminhoImagem)) {
                fs.unlinkSync(caminhoImagem);
            }
        }

        await dbRun('DELETE FROM produtos WHERE id = ?', [id]);
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Toggle ativo/pausado de produto
app.put('/api/admin/produtos/:id/toggle', async (req, res) => {
    try {
        const id = req.params.id;
        const produto = await dbGet('SELECT * FROM produtos WHERE id = ?', [id]);
        if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
        const novoAtivo = produto.ativo ? 0 : 1;
        await dbRun('UPDATE produtos SET ativo = ? WHERE id = ?', [novoAtivo, id]);
        res.json({ sucesso: true, ativo: novoAtivo });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Obter todos os recheios (admin)
app.get('/api/admin/recheios', async (req, res) => {
    try {
        const recheios = await dbAll('SELECT * FROM recheios ORDER BY id');
        res.json(recheios);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Adicionar recheio
app.post('/api/admin/recheios', async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
        const result = await dbRun('INSERT INTO recheios (nome) VALUES (?)', [nome]);
        res.json({ sucesso: true, id: result.lastID });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Toggle ativo/pausado de recheio
app.put('/api/admin/recheios/:id/toggle', async (req, res) => {
    try {
        const id = req.params.id;
        const recheio = await dbGet('SELECT * FROM recheios WHERE id = ?', [id]);
        if (!recheio) return res.status(404).json({ erro: 'Recheio não encontrado' });
        const novoAtivo = recheio.ativo ? 0 : 1;
        await dbRun('UPDATE recheios SET ativo = ? WHERE id = ?', [novoAtivo, id]);
        res.json({ sucesso: true, ativo: novoAtivo });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Deletar recheio
app.delete('/api/admin/recheios/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM recheios WHERE id = ?', [req.params.id]);
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Obter pedidos
app.get('/api/admin/pedidos', async (req, res) => {
    try {
        const pedidos = await dbAll('SELECT * FROM pedidos ORDER BY id DESC');
        res.json(pedidos.map(p => ({
            ...p,
            itens: JSON.parse(p.itens)
        })));
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Atualizar status do pedido
app.put('/api/admin/pedidos/:id', async (req, res) => {
    try {
        const { status } = req.body;
        await dbRun('UPDATE pedidos SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Banco SQLite em: ${DB_PATH}`);
    console.log(`Uploads em: ${UPLOADS_DIR}`);
});
