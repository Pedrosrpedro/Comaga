// =======================================================
// VARIÁVEIS GLOBAIS DO JOGO DE DESASTRE
// =======================================================
let isPlayerAlive = true;
let lava;

// =======================================================
// FUNÇÃO PRINCIPAL DO JOGO
// =======================================================
async function startDisasterGame(engine, canvas, onHudUpdate, sounds) {
    await window.Ammo();
    
    const scene = new BABYLON.Scene(engine);
    
    const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
    const physicsPlugin = new BABYLON.AmmoJSPlugin();
    scene.enablePhysics(gravityVector, physicsPlugin);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.0;

    // A câmera agora é uma ArcRotateCamera para dar controle ao jogador
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    
    // Limites da câmera para uma melhor experiência
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 30;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = (Math.PI / 2) * 0.9;

    createDisasterMap(scene);
    const player = createPlayer(scene);

    scene.onBeforeRenderObservable.add(() => {
        // A cada frame, o alvo da câmera é atualizado para a posição do jogador
        camera.target.copyFrom(player.position);

        // Lógica de morte por lava
        if (isPlayerAlive && lava && player.position.y < lava.position.y) {
            playerDied(player, sounds, onHudUpdate);
        }

        // Lógica para manter o jogador em pé
        if (isPlayerAlive && player.physicsImpostor) {
            const currentAngularVelocity = player.physicsImpostor.getAngularVelocity();
            const correctedAngularVelocity = new BABYLON.Vector3(0, currentAngularVelocity.y, 0);
            player.physicsImpostor.setAngularVelocity(correctedAngularVelocity);
        }
    });

    // Função que gerencia a intermissão (tempo de preparação)
    function startIntermission() {
        let timeLeft = 15;
        onHudUpdate("Intermissão - Prepare-se!", timeLeft);
        
        const countdown = setInterval(() => {
            timeLeft--;
            onHudUpdate("Intermissão - Prepare-se!", timeLeft);
            if (timeLeft <= 0) {
                clearInterval(countdown);
                startLavaDisaster();
            }
        }, 1000);
    }

    // Função que inicia o desastre da lava
    function startLavaDisaster() {
        onHudUpdate("A LAVA ESTÁ SUBINDO! SUBA!", "SOBREVIVA!");
        
        lava = BABYLON.MeshBuilder.CreateGround("lava", {width: 500, height: 500}, scene);
        lava.position.y = -20;
        const lavaMaterial = new BABYLON.StandardMaterial("lavaMat", scene);
        lavaMaterial.diffuseColor = new BABYLON.Color3(1, 0.2, 0);
        lavaMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.2, 0);
        lava.material = lavaMaterial;

        const lavaRise = () => { lava.position.y += 0.03; };
        scene.onBeforeRenderObservable.add(lavaRise);

        setTimeout(() => {
            scene.onBeforeRenderObservable.removeCallback(lavaRise);
            endRound();
        }, 45000);
    }

    // Função chamada quando a rodada acaba
    function endRound() {
        if (isPlayerAlive) {
            onHudUpdate("Você sobreviveu!", "Aguarde a próxima rodada.");
        } else {
            onHudUpdate("Você não sobreviveu...", "Aguarde a próxima rodada.");
        }

        if (lava) {
            lava.dispose();
            lava = null;
        }

        setTimeout(() => {
            resetPlayer(player, scene);
            startIntermission();
        }, 5000);
    }
    
    // Função chamada quando o jogador morre
    function playerDied(player, sounds, onHudUpdate) {
        if (!isPlayerAlive) return;
        isPlayerAlive = false;
        sounds.playerFall.play();
        onHudUpdate("VOCÊ FOI ELIMINADO!", "Espere a próxima rodada");
    }

    // Função para resetar o estado do jogador para uma nova rodada
    function resetPlayer(player, scene) {
        isPlayerAlive = true;
        
        if (player.physicsImpostor) {
            player.physicsImpostor.dispose();
        }
        
        player.position = new BABYLON.Vector3(0, 15, 0);
        player.rotation = new BABYLON.Vector3(0, 0, 0);
        player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.CapsuleImpostor, { mass: 1, restitution: 0.1, friction: 0.5 }, scene);
    }

    // Inicia o primeiro ciclo do jogo
    startIntermission();

    // Retorna a cena e o jogador para o main.js poder controlá-los
    return { scene, player };
}


// =======================================================
// FUNÇÕES DE CRIAÇÃO DE OBJETOS
// =======================================================
function createPlayer(scene) {
    const player = BABYLON.MeshBuilder.CreateCapsule("player", { height: 2, radius: 0.5 }, scene);
    player.position = new BABYLON.Vector3(0, 15, 0);
    
    const playerMaterial = new BABYLON.StandardMaterial("playerMat", scene);
    const savedTexture = localStorage.getItem("playerAvatarTexture");

    if (savedTexture) {
        const texture = new BABYLON.Texture(savedTexture, scene);
        playerMaterial.diffuseTexture = texture;
    } else {
        playerMaterial.diffuseColor = new BABYLON.Color3.FromHexString("#cccccc");
    }
    player.material = playerMaterial;
    
    player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.CapsuleImpostor, { mass: 1, restitution: 0.1, friction: 0.5 }, scene);
    return player;
}

function createDisasterMap(scene) {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    for (let i = 0; i < 15; i++) {
        const height = _.random(5.0, 25.0, true);
        const width = _.random(8, 12);
        const depth = _.random(8, 12);
        
        const tower = BABYLON.MeshBuilder.CreateBox(`tower${i}`, { width, depth, height }, scene);
        tower.position.y = height / 2;
        tower.position.x = _.random(-45, 45);
        tower.position.z = _.random(-45, 45);
        tower.physicsImpostor = new BABYLON.PhysicsImpostor(tower, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
    }
}
