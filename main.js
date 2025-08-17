// Elementos Globais da UI
const mainMenu = document.getElementById("mainMenu");
const canvas = document.getElementById("renderCanvas");
const joystickZone = document.getElementById("joystickZone");
const gameHud = document.getElementById("gameHud");

// Engine Global do Babylon
const engine = new BABYLON.Engine(canvas, true);
let scene; // Variável para a cena atual

// Adiciona o evento de clique para os botões do menu
document.querySelectorAll('.game-button').forEach(button => {
    button.addEventListener('click', () => {
        const gameId = button.getAttribute('data-game');
        startGame(gameId);
    });
});

async function startGame(gameId) {
    // Esconde o menu e mostra os elementos do jogo
    mainMenu.classList.add("hidden");
    canvas.classList.remove("hidden");
    joystickZone.classList.remove("hidden");
    gameHud.classList.remove("hidden");

    // Limpa a cena anterior, se houver
    if (scene) {
        scene.dispose();
    }

    // Chama a função de inicialização do jogo escolhido
    switch(gameId) {
        case 'disaster_survival':
            // A função startDisasterGame virá do arquivo disasterGame.js
            scene = await startDisasterGame(engine, canvas);
            break;
        case 'jogo_aventura':
            // Aqui você chamaria a função do jogo de aventura se o movesse para seu próprio arquivo
            alert("Este jogo ainda não foi modularizado!");
            // Reverter para o menu
            mainMenu.classList.remove("hidden");
            canvas.classList.add("hidden");
            joystickZone.classList.add("hidden");
            gameHud.classList.add("hidden");
            break;
    }

    // Inicia o loop de renderização se uma cena válida foi criada
    if (scene) {
        engine.runRenderLoop(() => {
            scene.render();
        });
    }
}

// Redimensiona a tela
window.addEventListener("resize", () => {
    engine.resize();
});
