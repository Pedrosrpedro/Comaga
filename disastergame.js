// =======================================================
// VARIÁVEIS GLOBAIS DO JOGO DE DESASTRE
// Estas variáveis guardam referências importantes para os objetos do jogo
// =======================================================
let player; // Armazena a malha (mesh) do jogador
let isPlayerAlive = true; // Controla se o jogador está vivo ou morto na rodada atual
let lava; // Armazena a malha (mesh) da lava quando ela existir

// =======================================================
// FUNÇÃO PRINCIPAL DO JOGO
// Esta é a função que o main.js chama para iniciar toda a experiência.
// Ela aceita parâmetros para poder se comunicar com o resto do sistema.
// engine: A instância do motor Babylon.js
// canvas: O elemento HTML <canvas> onde o jogo será desenhado
// onHudUpdate: A função de callback do main.js para atualizar a interface
// sounds: O objeto com todos os sons pré-carregados do Howler.js
// =======================================================
async function startDisasterGame(engine, canvas, onHudUpdate, sounds) {
    
    // CORREÇÃO CRÍTICA: Espera o motor de física Ammo.js estar 100% pronto.
    // Sem isso, tentar criar objetos físicos pode causar um erro e impedir o jogo de carregar.
    await window.Ammo();
    
    // Cria a cena principal do jogo, que é o container para todos os objetos, luzes e câmeras.
    const scene = new BABYLON.Scene(engine);
    
    // Configura a física para a cena inteira.
    const gravityVector = new BABYLON.Vector3(0, -9.81, 0); // Define a gravidade (puxando para baixo no eixo Y)
    const physicsPlugin = new BABYLON.AmmoJSPlugin(); // Define qual motor de física usar
    scene.enablePhysics(gravityVector, physicsPlugin);

    // Cria a iluminação da cena. Uma luz hemisférica ilumina tudo de forma geral, como um dia nublado.
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.0;

    // Cria a câmera que seguirá o jogador.
    const camera = new BABYLON.FollowCamera("followCam", new BABYLON.Vector3(0, 15, -25), scene);

    // Cria os elementos visuais e físicos do jogo.
    createDisasterMap(scene);
    createPlayer(scene);

    // Configura a câmera para travar a mira no jogador e define a distância e altura.
    camera.lockedTarget = player;
    camera.radius = 20; // Distância da câmera
    camera.heightOffset = 10; // Altura em relação ao jogador

    // Adiciona um observador que roda uma função a cada frame, ANTES de renderizar a cena.
    // Usamos isso para a lógica de morte do jogador, pois precisa ser verificado constantemente.
    scene.onBeforeRenderObservable.add(() => {
        // Se o jogador está vivo E a lava existe E a posição Y do jogador é menor que a da lava
        if (isPlayerAlive && lava && player.position.y < lava.position.y) {
            playerDied();
        }
    });

    // Função que gerencia o ciclo da rodada (intermissão -> desastre -> fim)
    function startIntermission(scene) {
        let timeLeft = 15;
        onHudUpdate("Intermissão - Prepare-se!", timeLeft);
        
        const countdown = setInterval(() => {
            timeLeft--;
            onHudUpdate("Intermissão - Prepare-se!", timeLeft);
            if (timeLeft <= 0) {
                clearInterval(countdown);
                startLavaDisaster(scene);
            }
        }, 1000);
    }

    // Função que inicia o desastre da lava
    function startLavaDisaster(scene) {
        onHudUpdate("A LAVA ESTÁ SUBINDO! SUBA!", "SOBREVIVA!");
        
        lava = BABYLON.MeshBuilder.CreateGround("lava", {width: 500, height: 500}, scene);
        lava.position.y = -20; // Começa bem abaixo do mapa
        const lavaMaterial = new BABYLON.StandardMaterial("lavaMat", scene);
        lavaMaterial.diffuseColor = new BABYLON.Color3(1, 0.2, 0);
        lavaMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.2, 0); // Faz a lava brilhar
        lava.material = lavaMaterial;

        // Adiciona a função de subida da lava ao loop de renderização
        const lavaRise = () => { lava.position.y += 0.03; };
        scene.onBeforeRenderObservable.add(lavaRise);

        // Define um temporizador para o fim do desastre
        setTimeout(() => {
            scene.onBeforeRenderObservable.removeCallback(lavaRise); // Para de subir a lava
            endRound(scene);
        }, 45000); // 45 segundos de desastre
    }

    // Função chamada quando a rodada acaba
    function endRound(scene) {
        if (isPlayerAlive) {
            onHudUpdate("Você sobreviveu!", "Aguarde a próxima rodada.");
        } else {
            onHudUpdate("Você não sobreviveu...", "Aguarde a próxima rodada.");
        }

        if (lava) {
            lava.dispose(); // Remove a lava da cena para liberar memória
            lava = null;
        }

        // Espera 5 segundos antes de começar uma nova rodada
        setTimeout(() => {
            resetPlayer(scene);
            startIntermission(scene);
        }, 5000);
    }

    // Função chamada quando o jogador morre
    function playerDied() {
        if (!isPlayerAlive) return; // Garante que a função só rode uma vez por morte
        isPlayerAlive = false;
        sounds.playerFall.play(); // Toca o som de morte
        player.physicsImpostor.dispose(); // Remove o corpo físico para que ele não interaja mais
        onHudUpdate("VOCÊ FOI ELIMINADO!", "Espere a próxima rodada");
    }

    // Função para resetar o estado do jogador para uma nova rodada
    function resetPlayer(scene) {
        isPlayerAlive = true;
        player.position = new BABYLON.Vector3(0, 15, 0); // Recoloca o jogador no ponto inicial
        // Recria o corpo físico do jogador, que foi destruído na morte
        player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.CapsuleImpostor, { mass: 1, restitution: 0.1, friction: 0.5 }, scene);
    }
    
    // Inicia o primeiro ciclo do jogo
    startIntermission(scene);

    // Retorna a cena criada para que o main.js possa renderizá-la
    return scene;
}

// =======================================================
// FUNÇÕES DE CRIAÇÃO DE OBJETOS
// Funções auxiliares que mantêm o código principal mais limpo
// =======================================================

// Cria o objeto do jogador
function createPlayer(scene) {
    player = BABYLON.MeshBuilder.CreateCapsule("player", { height: 2, radius: 0.5 }, scene);
    player.position = new BABYLON.Vector3(0, 15, 0); // Posição inicial segura
    // Define o corpo físico (impostor) para o jogador, permitindo que ele colida e seja afetado pela gravidade
    player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.CapsuleImpostor, { mass: 1, restitution: 0.1, friction: 0.5 }, scene);
}

// Cria o mapa com o chão e as torres
function createDisasterMap(scene) {
    // Cria o chão
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene); // Massa 0 o torna estático

    // Cria 15 torres com tamanhos e posições aleatórias usando a biblioteca Lodash
    for (let i = 0; i < 15; i++) {
        const height = _.random(5.0, 25.0, true); // Altura decimal entre 5 e 25
        const width = _.random(8, 12);           // Largura inteira entre 8 e 12
        const depth = _.random(8, 12);           // Profundidade inteira entre 8 e 12
        
        const tower = BABYLON.MeshBuilder.CreateBox(`tower${i}`, { width, depth, height }, scene);
        tower.position.y = height / 2;
        tower.position.x = _.random(-45, 45); // Posição X aleatória
        tower.position.z = _.random(-45, 45); // Posição Z aleatória
        // Define o corpo físico da torre
        tower.physicsImpostor = new BABYLON.PhysicsImpostor(tower, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
    }
}
