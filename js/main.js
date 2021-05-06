window.onload = function () {
    //params
    let cfg = {
        width: 850,
        height: 450,
        pathSrc: './assets/img/path.png',
        bgSrc: './assets/img/interaction_bg.jpg',
        modelsPath: './assets/models/',
        penSize: 53,
        centerX: 425,
        centerY: 225,
        R: 200, //max pixel radius of pen moving
        maxAngle: (26.0) * Math.PI / 180.0
    }
    
    //unseen canvas to draw the pattern and get data from it
    let patternData = []; //data 850x450 of 0 and 1. where 0 - no path in coord, 1 - has path 
    let patternCanvas = document.getElementById('patternCanvas');
    patternCanvas.setAttribute('width', cfg.width);
    patternCanvas.setAttribute('height', cfg.height);
    let patternCanvasContex = patternCanvas.getContext('2d');
    let image = new Image(); image.src = cfg.pathSrc;
    image.onload = function () {
        patternCanvasContex.drawImage(image, 0, 0)
        //extended data array have color of each pixel in RGBA
        let patternDataExtended = patternCanvasContex.getImageData(0, 0, cfg.width, cfg.height).data;
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
    };

    //main canvas to draw the scene
    let canvas = document.getElementById('canvas');
    canvas.setAttribute('width',  cfg.width);
    canvas.setAttribute('height', cfg.height);

    //renderer
    let renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setClearColor(0x000000);
    //scene and camera
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(40.0, cfg.width / cfg.height, 0.1, 5000); 
    camera.position.set(0, 0, 1000);
    //light
    let light = new THREE.AmbientLight(0xffffff);
    scene.add(light);
    //Load background texture
    let loader = new THREE.TextureLoader();
    loader.load(cfg.bgSrc, function (texture) {
        texture.minFilter = THREE.LinearFilter;
        scene.background = texture;  
    });
    //pattern
    const patternPlane = new THREE.PlaneGeometry(cfg.width, cfg.height, 10.0);
    loader = new THREE.TextureLoader();
    let material = new THREE.MeshBasicMaterial({
        map: loader.load(cfg.pathSrc, function (texture) {
            texture.minFilter = THREE.LinearFilter; }),
        transparent: true
    });    
    let mesh = new THREE.Mesh(patternPlane, material); 
    //mesh.position.z += 400;
    mesh.scale.set(1.6, 1.6, 1.6);
    scene.add(mesh);

    //objects
    let penObj = new THREE.Object3D();
    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath(cfg.modelsPath);
    //load pen
    mtlLoader.load('bovie.mtl', function(materials) {
        materials.preload();
        let objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(cfg.modelsPath);
        objLoader.load('bovie.obj', function (object) {
            object.scale.set(cfg.penSize, cfg.penSize, cfg.penSize);
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
    let penCoords = {
        x: 0,
        y: 0
    }
    canvas.addEventListener("mousemove", mouse_move_handler);
    window.addEventListener("touchmove", touch_move_handler);
    canvas.addEventListener("mousedown", mouse_down_handler);
    canvas.addEventListener("touchstart", touch_start_handler);
    canvas.addEventListener("mouseup", mouse_up_handler);
    canvas.addEventListener("touchend", mouse_up_handler);
    
    function mouse_move_handler(e) {
        if (!mouseObj.isDown) return;        
        //training regime
        /*
        let mouseAngle = (mouseObj.endX - mouseObj.startX) * (e.x - mouseObj.endX) +
            (mouseObj.endY - mouseObj.startY) * (e.y - mouseObj.endY);
        console.log(Math.abs(mouseAngle) < 0.1);*/
        //if (Math.abs(mouseAngle) == 0) { console.log('forbiden'); return;}
        mouseObj.endX = mouseObj.startX;
        mouseObj.endY = mouseObj.startY;
        mouseObj.startX = e.x;
        mouseObj.startY = e.y;
        //calculate new potential coords of pen
        let newPenCoordX = penCoords.x - (mouseObj.endX - mouseObj.startX);
        let newPenCoordY = penCoords.y - (mouseObj.endY - mouseObj.startY);

        //k - index in patternData
        let i = 0;
        do {
            let obj;
            obj = isRotatedPointInPath(penCoords.x, penCoords.y, newPenCoordX, newPenCoordY, i * 10);
            if (obj[0]) {
                newPenCoordX = obj[1];
                newPenCoordY = obj[2];
                movePen(newPenCoordX, newPenCoordY, cfg.R);
                i = 10;
                break;
            }
            obj = isRotatedPointInPath(penCoords.x, penCoords.y, newPenCoordX, newPenCoordY, i * -10);
            if (obj[0]) {
                newPenCoordX = obj[1];
                newPenCoordY = obj[2];
                movePen(newPenCoordX, newPenCoordY, cfg.R);
                i = 10;
                break;
            }
            i += 1;
        } while (i < 10);
        /*
        let k = (newPenCoordX + cfg.width * newPenCoordY);
        if (patternData[k] == 1) movePen(newPenCoordX, newPenCoordY);
            
        else {
            let obj = isRotatedPointInPath(penCoords.x, penCoords.y, newPenCoordX, newPenCoordY, 10);
            if (obj[0]) {
                newPenCoordX = obj[1];
                newPenCoordY = obj[2];
                movePen(newPenCoordX, newPenCoordY);
            };
        }   */  
            
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
        //e.preventDefault();
        if (!mouseObj.isDown) return;        
        //training regime
        mouseObj.endX = mouseObj.startX;
        mouseObj.endY = mouseObj.startY;
        
        //mouseObj.startX = e.touches[0].pageX;
        //mouseObj.startY = e.touches[0].pageY;
        mouseObj.startX = e.changedTouches[0].clientX;
        mouseObj.startY = e.changedTouches[0].clientY;
        //calculate new potential coords of pen
        let newPenCoordX = penCoords.x - (mouseObj.endX - mouseObj.startX);
        let newPenCoordY = penCoords.y - (mouseObj.endY - mouseObj.startY);
        //k - index in patternData
        let i = 0;
        do {
            let obj;
            obj = isRotatedPointInPath(penCoords.x, penCoords.y, newPenCoordX, newPenCoordY, i * 10);
            if (obj[0]) {
                newPenCoordX = obj[1];
                newPenCoordY = obj[2];
                movePen(newPenCoordX, newPenCoordY, cfg.R);
                i = 10;
                break;
            }
            obj = isRotatedPointInPath(penCoords.x, penCoords.y, newPenCoordX, newPenCoordY, i * -10);
            if (obj[0]) {
                newPenCoordX = obj[1];
                newPenCoordY = obj[2];
                movePen(newPenCoordX, newPenCoordY, cfg.R);
                i = 10;
                break;
            }
            i += 1;
        } while (i < 10); 
    }
    function isRotatedPointInPath(startX, startY, endX, endY, angle) {
        let alfa = angle * Math.PI / 180.0;
        let x = (endX - startX) * Math.cos(alfa) + (endY - startY) * Math.sin(alfa);
        let y = (endY - startY) * Math.cos(alfa) - (endX - startX) * Math.sin(alfa);
        x += startX; y += startY;
        let k = (x + cfg.width * y); 
        return [(patternData[k] == 1), x, y];
    }
    function movePen(newPenCoordX, newPenCoordY, radius) {
        penCoords.x = newPenCoordX; penCoords.y = newPenCoordY;
        //caclulate rotation angle around y and x axises
        let yAngle = cfg.maxAngle * mod((cfg.centerX - penCoords.x) / radius);
        let xAngle = cfg.maxAngle * mod((penCoords.y - cfg.centerY) / radius);
        //angle correction based on non centered obj position
        yAngle *= (penCoords.x - cfg.centerX - penInitialParams.positionX) / (penCoords.x - cfg.centerX);        
        xAngle *= (penCoords.y - cfg.centerY + penInitialParams.positionY) / (penCoords.y - cfg.centerY);
            
        if (!Number.isNaN(yAngle))
            penObj.rotation.y = -yAngle;
        if (!Number.isNaN(xAngle))
            penObj.rotation.x = xAngle;
    }

    function mouse_down_handler(e) {
        e.preventDefault();
        let eps = 10, //pixel gap to get the pen by its end
            getPenX = cfg.width / 2.0 + penInitialParams.positionX, //coords of pen`s end
            getPenY = 75;
        penCoords.x = getPenX;
        penCoords.y = getPenY;
        if (Math.abs(e.x - getPenX) < eps && Math.abs(e.y - getPenY) < eps) {
            mouseObj.isDown = true;
            mouseObj.startX = e.x;
            mouseObj.startY = e.y;
        }
    }

    function touch_start_handler(e) {
        let eps = 10, //pixel gap to get the pen by its end
            getPenX = cfg.width / 2.0 + penInitialParams.positionX, //coords of pen`s end
            getPenY = 75;
        penCoords.x = getPenX;
        penCoords.y = getPenY;
        if (Math.abs(e.changedTouches[0].clientX - getPenX) < eps && Math.abs(e.changedTouches[0].clientY - getPenY) < eps)
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