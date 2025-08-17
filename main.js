// =======================================================
// 1. ESTADO CENTRAL (Simulando Zustand)
// =======================================================
const gameState = {
    currentScreen: 'menu', // 'menu', 'loading', 'playing'
    hud: {
        message: '',
        timer: ''
    }
};

const availableGames = [
    {
        id: 'disaster_survival',
        displayName: 'SOBREVIVA AO DESASTRE',
        name: 'Natural Disaster Survival',
        rating: 91,
        players: 12.2
    }
    // Adicione mais jogos aqui no futuro
];


// =======================================================
// 2. COMPONENTES DE UI (Simulando Svelte)
// =======================================================
// Cada função retorna uma string de HTML
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
    const gameCards = games.map(game => `
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
            <div class="games-grid">${gameCards}</div>
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
// 3. RENDERIZAÇÃO E LÓGICA
// =======================================================
const appContainer = document.getElementById('app');
const canvas = document.getElementById('renderCanvas');
const joystickZone = document.getElementById('joystickZone');
let engine;

// A função principal que atualiza a tela
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
    } else if (gameState.currentScreen === 'playing') {
        canvas.classList.remove('hidden');
        joystickZone.classList.remove('hidden');
        appContainer.innerHTML = createHudHTML();
    } else if (gameState.currentScreen === 'loading') {
        appContainer.innerHTML = `<div class="loading-screen"><h1>Carregando...</h1></div>`; // Adicione estilo para .loading-screen se quiser
    }
}

// Função para atualizar o HUD a partir do jogo
function updateHud(message, timer) {
    gameState.hud.message = message;
    gameState.hud.timer = timer;
    render(); // Re-renderiza a UI com as novas informações
}

// Inicia o jogo 3D
async function launchGame(gameId) {
    gameState.currentScreen = 'loading';
    render();

    if (!engine) {
        engine = new BABYLON.Engine(canvas, true);
    }

    // Passamos a função updateHud para o jogo
    const scene = await startDisasterGame(engine, canvas, updateHud);

    engine.runRenderLoop(() => {
        if (scene) scene.render();
    });

    window.addEventListener("resize", () => engine.resize());

    gameState.currentScreen = 'playing';
    render();
}

// =======================================================
// 4. EVENTOS
// =======================================================
// Usamos "event delegation" para ouvir cliques nos cards de jogo
appContainer.addEventListener('click', (event) => {
    const gameCard = event.target.closest('.game-card');
    if (gameCard) {
        const gameId = gameCard.dataset.gameId;
        if (gameId) {
            launchGame(gameId);
        }
    }
});

// Renderização inicial
render();
