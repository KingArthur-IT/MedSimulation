window.onload = function () {
    //canvas params
    let width = 850;
    let height = 450;
    let pathSrc = './assets/img/path.png';
    
    //unseen canvas to draw the pattern and get data from it
    let patternData = [];
    let patternCanvas = document.getElementById('patternCanvas');
    patternCanvas.setAttribute('width', width);
    patternCanvas.setAttribute('height', height);
    let patternCanvasContex = patternCanvas.getContext('2d');
    let image = new Image(); image.src = pathSrc;
    image.onload = function () {
        patternCanvasContex.drawImage(image, 0, 0)
        let patternDataExtended = patternCanvasContex.getImageData(0, 0, width, height).data;
        let i = 0;
        do {
            if (patternDataExtended[i] == 0 &&
                patternDataExtended[i + 1] == 0 &&
                patternDataExtended[i + 2] == 0 &&
                patternDataExtended[i + 3] == 0)
                patternData.push(0);
            else patternData.push(1);
            i += 4;
        } while (i < patternDataExtended.length);
        //console.log(patternData);
    };

    //main canvas to draw the scene
    let canvas = document.getElementById('canvas');
    canvas.setAttribute('width',  width);
    canvas.setAttribute('height', height);

    //renderer
    let renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setClearColor(0x000000);
    //scene and camera
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000); //width / height
    camera.position.set(0, 0, 1000);
    //light
    let light = new THREE.AmbientLight(0xffffff);
    scene.add(light);
    //Load background texture
    let loader = new THREE.TextureLoader();
    loader.load('./assets/img/interaction_bg.jpg', function (texture) {
        texture.minFilter = THREE.LinearFilter;
        scene.background = texture;  
    });
    //pattern
    const patternPlane = new THREE.PlaneGeometry(850.0, 450.0, 10.0);
    loader = new THREE.TextureLoader();
    let material = new THREE.MeshBasicMaterial({
        map: loader.load('./assets/img/path.png', function (texture) {
            texture.minFilter = THREE.LinearFilter; }),
        transparent: true
    });    
    let mesh = new THREE.Mesh(patternPlane, material); 
    mesh.position.z += 400;
    mesh.rotation.x = 0.0;// * Math.PI / 180.0;
    scene.add(mesh);

    //objects
    let penObj = new THREE.Object3D();
    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath("./assets/models/");
    //load pen
    mtlLoader.load('bovie.mtl', function(materials) {
        materials.preload();
        let objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath("./assets/models/");
        objLoader.load('bovie.obj', function (object) {
            object.scale.set(50, 50, 50);
            object.position.set(0, 0, 0);
            object.rotation.set(Math.PI / 2.0, 10, 0);
            penObj.add(object);
            scene.add(penObj);
        });
    });
    //initial params of pen obj
    let penInitialParams = {
        angleX: - (25.0) * Math.PI / 180.0,
        angleY: 0.0,
        angleZ: 0.0,
        positionX: 6,
        positionY: -40,
        positionZ: 0
    }
    //set pen to initial state func
    function startPenObject() {
        penObj.rotation.x = penInitialParams.angleX;
        penObj.rotation.y = penInitialParams.angleY;
        penObj.rotation.z = penInitialParams.angleZ;
        penObj.position.x = penInitialParams.positionX;
        penObj.position.y = penInitialParams.positionY;
        penObj.position.z = penInitialParams.positionZ;        
    }; 
    startPenObject();
    
    //main render loop
    function loop() {
        renderer.render(scene, camera);
        requestAnimationFrame(loop)
    };
    loop();
        
    //mouse
    let mouseObj = {
        isDown: false,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0
    }
    canvas.addEventListener("mousemove", mouse_move_handler);
    canvas.addEventListener("touchmove", touch_move_handler);
    canvas.addEventListener("mousedown", mouse_down_handler);
    canvas.addEventListener("touchstart", touch_start_handler);
    canvas.addEventListener("mouseup", mouse_up_handler);
    canvas.addEventListener("touchend", mouse_up_handler);
    
    function mouse_move_handler(e) {
        //let k = (e.x + width * e.y);
        if (!mouseObj.isDown) return;
        let centerX = width / 2.0,
            centerY = height / 2.0,
            R = 200, //max pixel radius of pen moving
            maxAngle = (28.0) * Math.PI / 180.0; //max angle of pen rotate in radians
        
        //training regime
        mouseObj.endX = mouseObj.startX;
        mouseObj.endY = mouseObj.startY;
        mouseObj.startX = e.x;
        mouseObj.startY = e.y;
        let k = (e.x + width * e.y);
        if (patternData[k] == 1) {
            //caclulate rotation angle around y and x axises
            let yAngle = maxAngle * mod((centerX - e.x) / R);
            let xAngle = maxAngle * mod((e.y - centerY) / R);
            //angle correction based on non centered obj position
            yAngle *= (e.x - centerX - penInitialParams.positionX) / (e.x - centerX);        
            xAngle *= (e.y - centerY + penInitialParams.positionY) / (e.y - centerY);
            
            penObj.rotation.y = -yAngle;
            penObj.rotation.x = xAngle;
        }
            
        /*
        //caclulate rotation angle around y and x axises
        let yAngle = maxAngle * mod((centerX - e.x) / R);
        let xAngle = maxAngle * mod((e.y - centerY) / R);
        //angle correction based on non centered obj position
        yAngle *= (e.x - centerX - penInitialParams.positionX) / (e.x - centerX);        
        xAngle *= (e.y - centerY + penInitialParams.positionY) / (e.y - centerY);
        
        penObj.rotation.y = -yAngle;
        penObj.rotation.x = xAngle;
        */
    }
    function touch_move_handler(e) {
        if (!mouseObj.isDown) return;
        let centerX = width / 2.0,
            centerY = height / 2.0,
            R = 200, //max pixel radius of pen moving
            maxAngle = (28.0) * Math.PI / 180.0; //max angle of pen rotate in radians
        
        //caclulate rotation angle around y and x axises
        let yAngle = maxAngle * mod((centerX - e.touches[0].pageX) / R);
        let xAngle = maxAngle * mod((e.touches[0].pageY - centerY) / R);
        //angle correction based on non centered obj position
        yAngle *= (e.touches[0].pageX - centerX - penInitialParams.positionX) / (e.touches[0].pageX - centerX);        
        xAngle *= (e.touches[0].pageY - centerY + penInitialParams.positionY) / (e.touches[0].pageY - centerY);
        
        penObj.rotation.y = -yAngle;
        penObj.rotation.x = xAngle;
    }

    function mouse_down_handler(e) {
        let eps = 10, //pixel gap to get the pen by its end
            getPenX = width / 2.0 + penInitialParams.positionX, //coords of pen`s end
            getPenY = 85;
        if (Math.abs(e.x - getPenX) < eps && Math.abs(e.y - getPenY) < eps) {
            mouseObj.isDown = true;
            mouseObj.startX = e.x;
            mouseObj.startY = e.y;
        }
    }

    function touch_start_handler(e) {
        let eps = 10, //pixel gap to get the pen by its end
            getPenX = width / 2.0 + penInitialParams.positionX, //coords of pen`s end
            getPenY = 85;
        if (Math.abs(e.touches[0].pageX - getPenX) < eps && Math.abs(e.touches[0].pageY - getPenY) < eps)
            mouseObj.isDown = true;
    }
    
    function mouse_up_handler() {
        mouseObj.isDown = false;
        startPenObject();
    }

    function mod(x) { //x set -1 or 1 if it is out of interval [-1; 1] 
        return Math.abs(x) > 1 ? 1.0 * x / Math.abs(x) : x;
    }
}