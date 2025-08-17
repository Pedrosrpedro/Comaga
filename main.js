// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SEÇÃO 1: CONSOLE DE DEPURAÇÃO MOBILE
// Esta seção cria um console visual dentro da própria página.
// Ele captura todas as mensagens de console.log, console.error, etc.,
// e as exibe na tela, permitindo que você veja os erros no celular.
// Esta é uma função auto-invocada (IIFE) para não poluir o escopo global.
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
(function setupMobileConsole() {
    const consoleContainer = document.getElementById('mobile-console');
    const logContainer = document.getElementById('console-log-container');

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

    // Os eventos de clique para os botões do console serão adicionados mais tarde,
    // quando o DOM estiver totalmente carregado, para garantir que funcionem.

    console.log("Console de depuração iniciado.");
})();


// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SEÇÃO 2: GERENCIADOR DE ÁUDIO (usando Howler.js)
// Centralizamos todos os nossos sons em um único objeto para fácil acesso.
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const sounds = {
    click: new Howl({ src: ['https://cdn.jsdelivr.net/gh/scifilef/hosted-assets/menu-click.wav'] }),
    music: new Howl({
        src: ['https://cdn.jsdelivr.net/gh/scifilef/hosted-assets/pleasant-music.mp3'],
        loop: true,
        volume: 0.3
    }),
    playerFall: new Howl({ src: ['https://cdn.jsdelivr.net/gh/scifilef/hosted-assets/player-fall.wav'] })
};


// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SEÇÃO 3: ESTADO CENTRAL E FUNÇÕES DE UI
// Esta seção define o estado da nossa aplicação e as funções que geram o HTML.
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

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


// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SEÇÃO 4: LÓGICA PRINCIPAL DA APLICAÇÃO
// Gerencia a renderização da UI e a inicialização do jogo.
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const appContainer = document.getElementById('app');
const canvas = document.getElementById('renderCanvas');
const joystickZone = document.getElementById('joystickZone');

let engine;
let player;
let moveX = 0;
let moveZ = 0;

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
        gsap.from(".roblox-container", { duration: 0.5, opacity: 0 });
    } else if (gameState.currentScreen === 'playing') {
        canvas.classList.remove('hidden');
        joystickZone.classList.remove('hidden');
        appContainer.innerHTML = createHudHTML();
        gsap.from(".hud-container", { duration: 0.5, y: -50, opacity: 0, ease: "back.out(1.7)" });
    } else if (gameState.currentScreen === 'loading') {
        appContainer.innerHTML = `<div class="roblox-container"><h1>Carregando Jogo...</h1></div>`;
    }
}

// Função de callback que o jogo de desastre usará para nos enviar atualizações da UI.
function updateHud(message, timer) {
    gameState.hud.message = message;
    gameState.hud.timer = timer;
    if (gameState.currentScreen === 'playing') {
        render();
    }
}

// Função para configurar o Joystick (Nipple.js)
function setupJoystick() {
    console.log("Configurando o joystick virtual...");
    const options = {
        zone: joystickZone,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'white',
        size: 150
    };
    const manager = nipplejs.create(options);

    manager.on('move', (event, data) => {
        const angle = data.angle.radian;
        const force = Math.min(data.force, 2);
        moveZ = Math.cos(angle) * force;
        moveX = Math.sin(angle) * force;
    });

    manager.on('end', () => {
        moveX = 0;
        moveZ = 0;
    });
}

// Função que gerencia a transição do menu para o jogo 3D, com mais logs para depuração.
async function launchGame(gameId) {
    gameState.currentScreen = 'loading';
    render();

    gsap.to(".roblox-container", {
        duration: 0.5,
        opacity: 0,
        onComplete: async () => {
            try {
                console.log("PASSO 1: Iniciando motor de jogo...");
                if (!engine) {
                    engine = new BABYLON.Engine(canvas, true);
                    console.log("Motor Babylon.js criado com sucesso.");
                }

                console.log("PASSO 2: Chamando startDisasterGame...");
                const gameData = await startDisasterGame(engine, canvas, updateHud, sounds);

                // VERIFICAÇÃO CRÍTICA: Garante que o jogo retornou os dados necessários.
                if (!gameData || !gameData.scene || !gameData.player) {
                    throw new Error("A função startDisasterGame não retornou a cena ou o jogador.");
                }
                
                const scene = gameData.scene;
                player = gameData.player;
                console.log("PASSO 3: Cena e jogador recebidos com sucesso.");

                console.log("PASSO 4: Configurando o joystick...");
                setupJoystick();
                console.log("Joystick configurado.");

                console.log("PASSO 5: Iniciando o loop de renderização...");
                engine.runRenderLoop(() => {
                    if (gameState.currentScreen === 'playing' && player && player.physicsImpostor) {
                        const playerSpeed = 7.5;
                        const currentVelocity = player.physicsImpostor.getLinearVelocity();
                        const newVelocity = new BABYLON.Vector3(
                            moveX * playerSpeed,
                            currentVelocity.y,
                            moveZ * playerSpeed
                        );
                        player.physicsImpostor.setLinearVelocity(newVelocity);
                    }
                    scene.render();
                });

                window.addEventListener("resize", () => {
                    engine.resize();
                });

                console.log("PASSO 6: Jogo carregado com sucesso! Mudando para a tela 'playing'.");
                gameState.currentScreen = 'playing';
                sounds.music.play();
                render();

            } catch (error) {
                // Se qualquer um dos passos acima falhar, o erro será exibido aqui
                console.error("FALHA CRÍTICA AO INICIAR O JOGO:", error.message, error.stack);
                gameState.currentScreen = 'menu'; // Volta para o menu para não travar
                render();
            }
        }
    });
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SEÇÃO 5: INICIALIZAÇÃO E EVENT LISTENERS
// Esperamos o DOM estar completamente carregado para adicionar os eventos.
// Isso garante que os botões e outros elementos existam antes de tentarmos manipulá-los.
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
document.addEventListener('DOMContentLoaded', () => {
    
    // Adiciona o listener de clique para o container de jogos (que é recriado a cada render)
    appContainer.addEventListener('click', (event) => {
        const gameCard = event.target.closest('.game-card');
        if (gameCard) {
            sounds.click.play();
            gsap.to(gameCard, {
                scale: 0.95, yoyo: true, repeat: 1, duration: 0.1,
                onComplete: () => {
                    const gameId = gameCard.dataset.gameId;
                    if (gameId) {
                        launchGame(gameId);
                    }
                }
            });
        }
    });

    // Adiciona os listeners para os botões do console (que existem desde o início e não são recriados)
    const consoleContainer = document.getElementById('mobile-console');
    document.getElementById('debug-trigger').addEventListener('click', () => {
        consoleContainer.classList.toggle('hidden');
    });
    document.getElementById('console-close').addEventListener('click', () => {
        consoleContainer.classList.add('hidden');
    });
    document.getElementById('console-clear').addEventListener('click', () => {
        document.getElementById('console-log-container').innerHTML = '';
    });

    // Chama a função render pela primeira vez para desenhar a tela inicial do menu.
    render();
});
