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

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 30;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = (Math.PI / 2) * 0.9;

    createDisasterMap(scene);
    const player = createPlayer(scene);

    scene.onBeforeRenderObservable.add(() => {
        camera.target.copyFrom(player.position);

        if (isPlayerAlive && lava && player.position.y < lava.position.y) {
            playerDied(player, sounds, onHudUpdate);
        }

        if (isPlayerAlive && player.physicsImpostor) {
            // Pega a rotação Y da MALHA (que é controlada pelo main.js para olhar na direção do movimento)
            const yaw = player.rotation.y;
            
            // Cria uma nova rotação que é sempre "em pé" (X e Z zerados), mas
            // usa a rotação Y correta, fazendo o corpo físico olhar para onde a malha está olhando.
            const correctedQuaternion = BABYLON.Quaternion.FromEulerAngles(0, yaw, 0);

            // Aplica a rotação corrigida de volta ao objeto.
            player.rotationQuaternion = correctedQuaternion;
            
            // Também é bom zerar a velocidade angular para garantir que ele pare de tombar.
            player.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero());
        }
    });

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
    
    function playerDied(player, sounds, onHudUpdate) {
        if (!isPlayerAlive) return;
        isPlayerAlive = false;
        sounds.playerFall.play();
        onHudUpdate("VOCÊ FOI ELIMINADO!", "Espere a próxima rodada");
    }

    function resetPlayer(player, scene) {
        isPlayerAlive = true;
        
        if (player.physicsImpostor) {
            player.physicsImpostor.dispose();
        }
        
        player.position = new BABYLON.Vector3(0, 15, 0);
        player.rotation = new BABYLON.Vector3(0, 0, 0);
        player.rotationQuaternion = BABYLON.Quaternion.Identity(); 
        
        player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.CapsuleImpostor, { mass: 1, restitution: 0.1, friction: 0.5 }, scene);
    }

    startIntermission();

    return { scene, player };
}


// =======================================================
// FUNÇÕES DE CRIAÇÃO DE OBJETOS
// =======================================================
function createPlayer(scene) {
    const player = BABYLON.MeshBuilder.CreateCapsule("player", { height: 2, radius: 0.5 }, scene);
    player.position = new BABYLON.Vector3(0, 15, 0);
    
    player.rotationQuaternion = new BABYLON.Quaternion();
    
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
