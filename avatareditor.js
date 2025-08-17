// avatarEditor.js

// Guarda a referência da cena e do loop para que possamos limpá-los depois
let editorScene = null;
let editorRenderLoop = null;

// Função principal para iniciar o editor
async function startAvatarEditor(engine, canvas) {
    // Cria uma cena completamente nova para o editor
    editorScene = new BABYLON.Scene(engine);

    // Cria uma câmera que orbita ao redor do avatar
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 5, new BABYLON.Vector3(0, 1, 0), editorScene);
    camera.attachControl(canvas, true); // Permite controle com mouse/toque
    camera.lowerRadiusLimit = 3; // Impede de chegar perto demais
    camera.upperRadiusLimit = 10; // Impede de se afastar demais

    // Cria uma luz para iluminar o avatar
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), editorScene);
    light.intensity = 1.2;

    // Cria o avatar (cápsula)
    const avatar = BABYLON.MeshBuilder.CreateCapsule("avatar", { height: 2, radius: 0.5 }, editorScene);
    avatar.position.y = 1;

    // --- LÓGICA DA TEXTURA DINÂMICA (PINTURA) ---

    const textureResolution = 512;
    const dynamicTexture = new BABYLON.DynamicTexture("playerTexture", textureResolution, editorScene);
    const textureContext = dynamicTexture.getContext();

    const avatarMaterial = new BABYLON.StandardMaterial("avatarMat", editorScene);
    avatarMaterial.diffuseTexture = dynamicTexture;
    avatar.material = avatarMaterial;

    // Função para carregar a textura salva, se existir
    function loadSavedTexture() {
        const savedTexture = localStorage.getItem("playerAvatarTexture");
        if (savedTexture) {
            const img = new Image();
            img.src = savedTexture;
            img.onload = function() {
                textureContext.drawImage(img, 0, 0);
                dynamicTexture.update();
            }
        } else {
            // Se não houver textura salva, pinta de cinza
            textureContext.fillStyle = "#cccccc";
            textureContext.fillRect(0, 0, textureResolution, textureResolution);
            dynamicTexture.update();
        }
    }
    
    loadSavedTexture(); // Carrega a textura ao iniciar

    // Loop de renderização específico para o editor
    editorRenderLoop = () => editorScene.render();
    engine.runRenderLoop(editorRenderLoop);

    // Retorna a cena e o avatar para que o main.js possa controlá-los
    return { scene: editorScene, avatar: avatar, texture: dynamicTexture };
}

// Função para parar e limpar a cena do editor, evitando vazamento de memória
function stopAvatarEditor(engine) {
    if (engine && editorRenderLoop) {
        engine.stopRenderLoop(editorRenderLoop);
    }
    if (editorScene) {
        editorScene.dispose();
        editorScene = null;
    }
}
