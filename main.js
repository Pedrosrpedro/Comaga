// =======================================================
// SEÇÃO 1: CONSOLE DE DEPURAÇÃO MOBILE
// Esta seção cria um console visual dentro da própria página.
// Ele captura todas as mensagens de console.log, console.error, etc.,
// e as exibe na tela, permitindo que você veja os erros no celular.
// Esta é uma função auto-invocada (IIFE) para não poluir o escopo global.
// =======================================================
(function setupMobileConsole() {
    const trigger = document.getElementById('debug-trigger');
    const consoleContainer = document.getElementById('mobile-console');
    const logContainer = document.getElementById('console-log-container');
    const closeBtn = document.getElementById('console-close');
    const clearBtn = document.getElementById('console-clear');
    let clickCount = 0;

    // Função interna para adicionar uma mensagem formatada ao console visual
    function logToScreen(message, type = 'log') {
        const msgElement = document.createElement('div');
        msgElement.className = `log-message ${type}`;
        // Formata a mensagem para incluir o tipo (LOG, ERROR, etc.)
        msgElement.textContent = `[${type.toUpperCase()}] ${message}`;
        logContainer.appendChild(msgElement);
        // Rola automaticamente para a mensagem mais recente
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // Guarda uma referência às funções originais do console
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    // Sobrescreve a função console.log
    console.log = function(...args) {
        logToScreen(args.join(' '), 'log'); // Manda a mensagem para nosso console visual
        originalLog.apply(console, args); // Executa a função original do navegador
    };

    // Sobrescreve a função console.error
    console.error = function(...args) {
        logToScreen(args.join(' '), 'error');
        originalError.apply(console, args);
    };

    // Sobrescreve a função console.warn
    console.warn = function(...args) {
        logToScreen(args.join(' '), 'warn');
        originalWarn.apply(console, args);
    };

    // Captura erros globais não tratados que poderiam quebrar o script
    window.onerror = function(message, source, lineno, colno, error) {
        console.error(`ERRO NÃO TRATADO: "${message}" em ${source} na linha ${lineno}`);
        return true; // Impede que o erro padrão apareça no console do navegador
    };

    // Lógica do botão escondido: clique 5 vezes rapidamente no canto inferior direito
    trigger.addEventListener('click', () => {
        clickCount++;
        if (clickCount >= 5) {
            consoleContainer.classList.remove('hidden');
            clickCount = 0;
        }
        // Reseta a contagem se o usuário demorar mais de 2 segundos entre os cliques
        setTimeout(() => { clickCount = 0; }, 2000);
    });

    closeBtn.addEventListener('click', () => consoleContainer.classList.add('hidden'));
    clearBtn.addEventListener('click', () => logContainer.innerHTML = '');

    console.log("Console de depuração iniciado. Clique 5x no canto inferior direito para abrir.");
})();


// =======================================================
// SEÇÃO 2: GERENCIADOR DE ÁUDIO (usando Howler.js)
// Centralizamos todos os nossos sons em um único objeto para fácil acesso.
// =======================================================
const sounds = {
    // Usamos URLs de um CDN para os sons, para que funcionem online sem precisar de arquivos locais.
    click: new Howl({ src: ['https://cdn.jsdelivr.net/gh/scifilef/hosted-assets/menu-click.wav'] }),
    music: new Howl({
        src: ['https://cdn.jsdelivr.net/gh/scifilef/hosted-assets/pleasant-music.mp3'],
        loop: true,
        volume: 0.3
    }),
    playerFall: new Howl({ src: ['https://cdn.jsdelivr.net/gh/scifilef/hosted-assets/player-fall.wav'] })
};


// =======================================================
// SEÇÃO 3: ESTADO CENTRAL E FUNÇÕES DE UI
// Esta seção define o estado da nossa aplicação e as funções que geram o HTML.
// =======================================================

// O "cérebro" da aplicação. Guarda todas as informações importantes.
const gameState = {
    currentScreen: 'menu', // Pode ser 'menu', 'loading', ou 'playing'
    hud: {
        message: '',
        timer: ''
    }
};

// Uma lista dos jogos que existem. A UI será construída a partir daqui.
const availableGames = [
    {
        id: 'disaster_survival',
        displayName: 'SOBREVIVA AO DESASTRE',
        name: 'Natural Disaster Survival',
        rating: 91,
        players: 12.2
    }
    // Quando você criar um novo jogo, basta adicioná-lo aqui.
];

// Funções que geram blocos de HTML (simulando "componentes")
function createHeaderHTML() {
    return `
        <header class="main-header">
            <nav class="main-nav">
                <a href="#" class="nav-item active"><i class="fa-solid fa-house"></i> Home</a>
                <a href="#" class="nav-item"><i class="fa-solid fa-user-astronaut"></i> Avatar</a>
                <a href="#" class="nav-item"><i class="fa-solid fa-users"></i> Connect</a>
            </nav>
        </header>
    `;
}

function createFriendsListHTML() {
    return `
        <section class="content-row">
            <h2>Friends (0)</h2>
            <div class="friends-list">
               <p style="color: #b8b8b8;">Sistema de amigos em desenvolvimento.</p>
            </div>
        </section>
    `;
}

function createGamesGridHTML(games) {
    const gameCardsHTML = games.map(game => `
        <div class="game-card" data-game-id="${game.id}">
            <div class="game-image-placeholder ${game.id}">${game.displayName}</div>
            <div class="game-info">
                <h3>${game.name}</h3>
                <div class="game-stats">
                    <span><i class="fa-solid fa-thumbs-up"></i> ${game.rating}%</span>
                    <span><i class="fa-solid fa-users"></i> ${game.players}K</span>
                </div>
            </div>
        </div>
    `).join('');

    return `
        <section class="content-row">
            <h2>Continue</h2>
            <div class="games-grid">${gameCardsHTML}</div>
        </section>
    `;
}

function createHudHTML() {
    return `
        <div class="hud-container">
            <p>${gameState.hud.message}</p>
            <p id="hudTimer">${gameState.hud.timer}</p>
        </div>
    `;
}


// =======================================================
// SEÇÃO 4: LÓGICA PRINCIPAL DA APLICAÇÃO
// Gerencia a renderização da UI e a inicialização do jogo.
// =======================================================
const appContainer = document.getElementById('app');
const canvas = document.getElementById('renderCanvas');
const joystickZone = document.getElementById('joystickZone');
let engine; // A engine do Babylon.js

// A função mais importante: lê o gameState e atualiza o HTML da página.
function render() {
    if (gameState.currentScreen === 'menu') {
        canvas.classList.add('hidden');
        joystickZone.classList.add('hidden');
        appContainer.innerHTML = `
            <div class="roblox-container">
                ${createHeaderHTML()}
                <main class="main-content">
                    ${createFriendsListHTML()}
                    ${createGamesGridHTML(availableGames)}
                </main>
            </div>
        `;
        // Animação GSAP para o menu aparecer suavemente
        gsap.from(".roblox-container", { duration: 0.5, opacity: 0 });

    } else if (gameState.currentScreen === 'playing') {
        canvas.classList.remove('hidden');
        joystickZone.classList.remove('hidden');
        appContainer.innerHTML = createHudHTML();
        // Animação GSAP para o HUD "nascer" na tela
        gsap.from(".hud-container", { duration: 0.5, y: -50, opacity: 0, ease: "back.out(1.7)" });

    } else if (gameState.currentScreen === 'loading') {
        appContainer.innerHTML = `<div class="roblox-container"><h1>Carregando Jogo...</h1></div>`;
    }
}

// Função de callback que o jogo de desastre usará para nos enviar atualizações da UI.
function updateHud(message, timer) {
    gameState.hud.message = message;
    gameState.hud.timer = timer;
    // Somente renderiza se já estivermos na tela de jogo, para evitar piscar a tela
    if (gameState.currentScreen === 'playing') {
        render();
    }
}

// Função que gerencia a transição do menu para o jogo 3D.
async function launchGame(gameId) {
    gameState.currentScreen = 'loading';
    render();

    // Animação GSAP para o menu desaparecer
    gsap.to(".roblox-container", {
        duration: 0.5,
        opacity: 0,
        // onComplete garante que o código pesado do jogo só rode DEPOIS que a animação terminar.
        onComplete: async () => {
            // Bloco TRY...CATCH para capturar qualquer erro durante a inicialização do jogo.
            try {
                console.log("Iniciando motor de jogo...");
                if (!engine) {
                    engine = new BABYLON.Engine(canvas, true);
                }

                console.log("Iniciando jogo: 'Sobreviva ao Desastre'...");
                // Passamos a função updateHud e o objeto de sons para o jogo
                const scene = await startDisasterGame(engine, canvas, updateHud, sounds);
                
                if (!scene) {
                    throw new Error("A cena do jogo retornou nula. Falha na criação.");
                }

                engine.runRenderLoop(() => {
                    scene.render();
                });

                window.addEventListener("resize", () => {
                    engine.resize();
                });

                console.log("Jogo carregado com sucesso!");
                gameState.currentScreen = 'playing';
                sounds.music.play(); // Toca a música de fundo
                render();

            } catch (error) {
                console.error("FALHA CRÍTICA AO INICIAR O JOGO:", error.message, error.stack);
                // Volta para o menu em caso de erro, para que o usuário não fique preso
                gameState.currentScreen = 'menu';
                render();
            }
        }
    });
}

// =======================================================
// SEÇÃO 5: EVENT LISTENERS
// Ouve as ações do usuário e dispara a lógica correspondente.
// =======================================================
appContainer.addEventListener('click', (event) => {
    // Procura pelo elemento .game-card mais próximo do local onde o usuário clicou
    const gameCard = event.target.closest('.game-card');
    if (gameCard) {
        sounds.click.play(); // Toca o som de clique
        // Animação GSAP no card clicado para dar feedback visual
        gsap.to(gameCard, { 
            scale: 0.95, 
            yoyo: true, 
            repeat: 1, 
            duration: 0.1, 
            onComplete: () => {
                const gameId = gameCard.dataset.gameId;
                if (gameId) {
                    launchGame(gameId);
                }
            }
        });
    }
});

// =======================================================
// INICIALIZAÇÃO
// =======================================================
// Chama a função render pela primeira vez para desenhar a tela inicial do menu.
render();
