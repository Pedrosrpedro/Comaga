// =======================================================
// SEÇÃO 1: FUNÇÕES GLOBAIS DO CONSOLE
// Estas funções estão no escopo global para serem chamadas pelo 'onclick' no HTML.
// Isso garante que os botões do console sempre funcionem.
// =======================================================
function toggleConsole() {
    document.getElementById('mobile-console').classList.toggle('hidden');
}
function closeConsole() {
    document.getElementById('mobile-console').classList.add('hidden');
}
function clearConsole() {
    document.getElementById('console-log-container').innerHTML = '';
}


// =======================================================
// SEÇÃO 2: LÓGICA DE CAPTURA DO CONSOLE
// Esta função auto-invocada (IIFE) sobrescreve as funções padrão do console
// para redirecionar todas as mensagens para o nosso console visual na tela.
// =======================================================
(function setupMobileConsole() {
    const logContainer = document.getElementById('console-log-container');

    // Função interna para adicionar uma mensagem formatada ao console visual
    function logToScreen(message, type = 'log') {
        const msgElement = document.createElement('div');
        msgElement.className = `log-message ${type}`;
        msgElement.textContent = `[${type.toUpperCase()}] ${message}`;
        logContainer.appendChild(msgElement);
        logContainer.scrollTop = logContainer.scrollHeight; // Rola para a mensagem mais recente
    }

    // Guarda referências às funções originais para não perdê-las
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    // Sobrescreve a função console.log
    console.log = function(...args) {
        logToScreen(args.join(' '), 'log');
        originalLog.apply(console, args);
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
    window.onerror = function(message, source, lineno) {
        console.error(`ERRO NÃO TRATADO: "${message}" em ${source} na linha ${lineno}`);
        return true;
    };

    console.log("Console de depuração iniciado.");
})();


// =======================================================
// SEÇÃO 3: GERENCIADOR DE ÁUDIO (usando Howler.js)
// =======================================================
const sounds = {
    click: new Howl({ src: ['https://cdn.jsdelivr.net/gh/scifilef/hosted-assets/menu-click.wav'] }),
    music: new Howl({
        src: ['https://cdn.jsdelivr.net/gh/scifilef/hosted-assets/pleasant-music.mp3'],
        loop: true,
        volume: 0.3
    }),
    playerFall: new Howl({ src: ['https://cdn.jsdelivr.net/gh/scifilef/hosted-assets/player-fall.wav'] })
};


// =======================================================
// SEÇÃO 4: ESTADO CENTRAL E FUNÇÕES DE UI
// =======================================================
const gameState = {
    currentScreen: 'menu',
    hud: { message: '', timer: '' }
};

const availableGames = [
    { id: 'disaster_survival', displayName: 'SOBREVIVA AO DESASTRE', name: 'Natural Disaster Survival', rating: 91, players: 12.2 }
];

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
// SEÇÃO 5: LÓGICA PRINCIPAL DA APLICAÇÃO
// =======================================================
const appContainer = document.getElementById('app');
const canvas = document.getElementById('renderCanvas');
const joystickZone = document.getElementById('joystickZone');
let engine;
let player;
let moveX = 0;
let moveZ = 0;

function render() {
    if (gameState.currentScreen === 'menu') {
        canvas.classList.add('hidden');
        joystickZone.classList.add('hidden');
        appContainer.innerHTML = `<div class="roblox-container">${createHeaderHTML()}<main class="main-content">${createFriendsListHTML()}${createGamesGridHTML(availableGames)}</main></div>`;
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

function updateHud(message, timer) {
    gameState.hud.message = message;
    gameState.hud.timer = timer;
    if (gameState.currentScreen === 'playing') {
        render();
    }
}

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
                        const newVelocity = new BABYLON.Vector3(moveX * playerSpeed, currentVelocity.y, moveZ * playerSpeed);
                        player.physicsImpostor.setLinearVelocity(newVelocity);
                    }
                    scene.render();
                });
                window.addEventListener("resize", () => { engine.resize(); });
                console.log("PASSO 6: Jogo carregado com sucesso! Mudando para a tela 'playing'.");
                gameState.currentScreen = 'playing';
                sounds.music.play();
                render();
            } catch (error) {
                console.error("FALHA CRÍTICA AO INICIAR O JOGO:", error.message, error.stack);
                gameState.currentScreen = 'menu';
                render();
            }
        }
    });
}

// =======================================================
// SEÇÃO 6: INICIALIZAÇÃO E EVENT LISTENERS
// Esperamos o DOM carregar completamente para adicionar os eventos de clique.
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
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
    // Renderização inicial
    render();
});
