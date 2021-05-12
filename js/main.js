window.onload = function () {
    //params
    let cfg = {
        width: 850,
        height: 450,
        centerX: 425,
        centerY: 225,
        pathSrc: './assets/img/path.png',
        trainingPath1Src: './assets/img/path1.png',
        trainingPath2Src: './assets/img/path2.png',
        trainingPath3Src: './assets/img/pathExam.png',
        bgSrc: './assets/img/interaction_bg.jpg',
        modelsPath: './assets/models/',
        penSize: 49,        
        R: 200, //max pixel radius of pen moving
        maxAngle: (26.0) * Math.PI / 180.0,
        touchStep: 5,
        maxParticlesInTrace: 200
    }
    //mouse inforamation
    let mouseObj = {
        isDown: false,
        startX: 0,
        startY: 0,
        endX:   0,
        endY:   0
    }
    //coordinates of the pen
    let penCoords = {
        x: 0,
        y: 0
    }
    let stages = {
        training: true,
        practice: false,
        exam: false
    }
    
    //unseen canvases to draw the pattern and get data from it
    let patternData = []; //data 850x450 of 0 and 1. where 0 - no path in coord, 1 - has path 
    patternData.push(); patternData.push();
    patternData[0] = []; patternData[1] = []; patternData[2] = [];
    let dataIndex = 0; let changeIndex = false;
    //get data from supportingCanvas
    let patternCanvas = document.getElementById('supportingCanvas');
    patternCanvas.setAttribute('width', cfg.width);
    patternCanvas.setAttribute('height', cfg.height);
    let patternCanvasContex = patternCanvas.getContext('2d');
    let imageOfPath1 = new Image(); imageOfPath1.src = cfg.trainingPath1Src;
    imageOfPath1.onload = function () {
        patternCanvasContex.drawImage(imageOfPath1, 0, 0)
        //extended data array have color of each pixel in RGBA
        let patternDataExtended = patternCanvasContex.getImageData(0, 0, cfg.width, cfg.height).data;
        let i = 0;
        do {
            if (patternDataExtended[i] == 0 && 
                patternDataExtended[i + 1] == 0 &&
                patternDataExtended[i + 2] == 0 &&
                patternDataExtended[i + 3] == 0)
                patternData[0].push(0);
            else patternData[0].push(1);
            i += 4;
        } while (i < patternDataExtended.length);
    };
    //get data from supportingCanvas2
    let supportingCanvas2 = document.getElementById('supportingCanvas2');
    supportingCanvas2.setAttribute('width', cfg.width);
    supportingCanvas2.setAttribute('height', cfg.height);
    let patternCanvasContex2 = supportingCanvas2.getContext('2d');
    let imageOfPath2 = new Image(); imageOfPath2.src = cfg.trainingPath2Src; 
    imageOfPath2.onload = function () {
        patternCanvasContex2.drawImage(imageOfPath2, 0, 0)
        //extended data array have color of each pixel in RGBA
        let patternDataExtended = patternCanvasContex2.getImageData(0, 0, cfg.width, cfg.height).data;
        let i = 0;
        do {
            if (patternDataExtended[i] == 0 && 
                patternDataExtended[i + 1] == 0 &&
                patternDataExtended[i + 2] == 0 &&
                patternDataExtended[i + 3] == 0)
                patternData[1].push(0);
            else patternData[1].push(1);
            i += 4;
        } while (i < patternDataExtended.length);
    };
    //full
    let supportingCanvas3 = document.getElementById('supportingCanvas3');
    supportingCanvas3.setAttribute('width', cfg.width);
    supportingCanvas3.setAttribute('height', cfg.height);
    let patternCanvas3Contex = supportingCanvas3.getContext('2d');
    let imageOfPath3 = new Image(); imageOfPath3.src = cfg.trainingPath3Src;
    imageOfPath3.onload = function () {
        patternCanvas3Contex.drawImage(imageOfPath3, 0, 0)
        //extended data array have color of each pixel in RGBA
        let patternDataExtended = patternCanvas3Contex.getImageData(0, 0, cfg.width, cfg.height).data;
        let i = 0;
        do {
            if (patternDataExtended[i] == 0 && 
                patternDataExtended[i + 1] == 0 &&
                patternDataExtended[i + 2] == 0 &&
                patternDataExtended[i + 3] == 0)
                patternData[2].push(0);
            else patternData[2].push(1);
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
    let patternPlaneMesh = new THREE.Mesh(patternPlane, material); 
    //patternPlaneMesh.position.z += 400;
    patternPlaneMesh.scale.set(1.6, 1.6, 1.6);
    //patternPlaneMesh.position.y -= 20;
    //patternPlaneMesh.rotation.x -= 5.0 * Math.PI / 180.0;
    scene.add(patternPlaneMesh);

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

    //trajectory line    
    let trajectoryMaterial = new THREE.LineBasicMaterial({color: 0xff00ff});
    let trajectoryPoints = []; let trajectoryPointsTime = [];
    let trajectoryPoints2 = []; let trajectoryPoints3 = []; let trajectoryPoints4 = [];
    //let curve;   let curvePoints;
    let trajectoryGeometry;
    let trajectoryGeometry2;
    let trajectoryGeometry3;
    let trajectoryGeometry4;
    let splineObject;
    let splineObject2;
    let splineObject3;
    let splineObject4;
    //
    let exam = {
        count: 0,
        maxCount: 5,
        inline: true,
    }

    //-----------------main render loop-------------------------
    function loop() {
        if (stages.practice) {                   
            let time = new Date;
            if (time - trajectoryPointsTime[0] > 5000 && trajectoryPoints.length > 0) {
                trajectoryPoints.shift(); trajectoryPointsTime.shift();
                trajectoryPoints2.shift();  trajectoryPoints3.shift();  trajectoryPoints4.shift();
            }
            scene.remove(splineObject); scene.remove(splineObject2)
            scene.remove(splineObject3); scene.remove(splineObject4)
            //curve = new THREE.CatmullRomCurve3(trajectoryPoints);
            //curvePoints = curve.getPoints(100);
            trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(trajectoryPoints);
            trajectoryGeometry2 = new THREE.BufferGeometry().setFromPoints(trajectoryPoints2);
            trajectoryGeometry3 = new THREE.BufferGeometry().setFromPoints(trajectoryPoints3);
            trajectoryGeometry4 = new THREE.BufferGeometry().setFromPoints(trajectoryPoints4);
            splineObject = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
            splineObject2 = new THREE.Line(trajectoryGeometry2, trajectoryMaterial);
            splineObject3 = new THREE.Line(trajectoryGeometry3, trajectoryMaterial);
            splineObject4 = new THREE.Line(trajectoryGeometry4, trajectoryMaterial);
            scene.add(splineObject);
            scene.add(splineObject2);
            scene.add(splineObject3);
            scene.add(splineObject4);
        }
        renderer.render(scene, camera);
        requestAnimationFrame(loop)
    };
    loop();
        
    //---------------mouse, touch, lock change events------------------
    canvas.addEventListener("mousedown",    mouse_down_handler);
    canvas.addEventListener("mousemove",    mouse_move_handler);
    //canvas.addEventListener("mouseup",      mouse_up_handler);
    
    canvas.addEventListener("touchstart",   touch_start_handler);
    canvas.addEventListener("touchmove",    touch_move_handler);    
    canvas.addEventListener("touchend",     touch_up_handler);
    
    if ("onpointerlockchange" in document) {
        document.addEventListener('pointerlockchange', lockChange, false);
    } else if ("onmozpointerlockchange" in document) {
        document.addEventListener('mozpointerlockchange', lockChange, false);
        } else if ("onwebkitpointerlockchange" in document) {
            document.addEventListener('webkitpointerlockchange', lockChange, false);
    };
    
    function mouse_down_handler() {
        if (!mouseObj.isDown) {//lock and start
            canvas.requestPointerLock = canvas.requestPointerLock ||
                canvas.mozRequestPointerLock ||
                canvas.webkitRequestPointerLock;
            canvas.requestPointerLock();
            //coords of pen`s end
            penCoords.x = cfg.width / 2.0 + penInitialParams.positionX;
            penCoords.y = 75;
            mouseObj.isDown = true;
        }
        else { //unlock
            document.exitPointerLock = document.exitPointerLock    ||
                           document.mozExitPointerLock ||
                           document.webkitExitPointerLock;
            document.exitPointerLock();
            mouseObj.isDown = false;
            startPenObject();
            dataIndex = 0;
            trajectoryPoints.length = 0; trajectoryPoints2.length = 0;
            trajectoryPoints3.length = 0; trajectoryPoints4.length = 0;
            trajectoryPointsTime.length = 0;
        }
    }
    function mouse_move_handler(e) {
        if (!mouseObj.isDown) return; 
        //get movement of the mouse in lock API
        let movementX = e.movementX ||
            e.mozMovementX          ||
            e.webkitMovementX       ||
            0;
        let movementY = e.movementY ||
            e.mozMovementY      ||
            e.webkitMovementY   ||
            0;
        
        //training mode
        if (stages.training) {
            trainingStage(movementX, movementY);
        };//if (stages.training)
        if (stages.practice) {
            practiceStage(movementX, movementY);
        }//if (stages.practice) 
        if (stages.exam) {
            examStage(movementX, movementY);
        }
    }
    function lockChange() {
        if(document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas ||
        document.webkitPointerLockElement === canvas) {
            console.log('The pointer lock status is now locked');
        } else {
            console.log('The pointer lock status is now unlocked');
            mouseObj.isDown = false;
            startPenObject();
            dataIndex = 0;
            trajectoryPoints.length = 0;
            trajectoryPoints2.length = 0;
            trajectoryPoints3.length = 0;
            trajectoryPoints4.length = 0;
            trajectoryPointsTime.length = 0;
            changeIndex = false;
        }
    }

    function touch_start_handler(e) {
        let eps = 15, //pixel gap to get the pen by its end
            getPenX = cfg.width / 2.0 + penInitialParams.positionX, //coords of pen`s end
            getPenY = 75;
        penCoords.x = getPenX;
        penCoords.y = getPenY;
        if (Math.abs(e.touches[0].pageX - getPenX) < eps && Math.abs(e.touches[0].pageY - getPenY) < eps) {
            mouseObj.isDown = true;
            let touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
            mouseObj.startX = touch.pageX;
            mouseObj.startY = touch.pageY;
        }
    }
    function touch_move_handler(e) {
        e.preventDefault();
        if (!mouseObj.isDown) return;        
        //training regime
        
        mouseObj.endX = mouseObj.startX;
        mouseObj.endY = mouseObj.startY;
        
        let touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
        mouseObj.startX = touch.pageX;
        mouseObj.startY = touch.pageY;

        //calculate new potential coords of pen
        //let newPenCoordX = penCoords.x - cfg.touchStep*(mouseObj.endX - mouseObj.startX) / Math.abs(mouseObj.endX - mouseObj.startX);
        //let newPenCoordY = penCoords.y - cfg.touchStep*(mouseObj.endY - mouseObj.startY) / Math.abs(mouseObj.endY - mouseObj.startY);
        
        let movementX = mouseObj.endX - mouseObj.startX;
        let movementY = mouseObj.endY - mouseObj.startY;
        
        //training mode
        if (stages.training) {
            trainingStage(movementX, movementY);
        };//if (stages.training)
        if (stages.practice) {
            practiceStage(movementX, movementY);
        }//if (stages.practice) 
        if (stages.exam) {
            examStage(movementX, movementY);
        }
        
    }
    function touch_up_handler() {
        mouseObj.isDown = false;
        startPenObject();
        dataIndex = 0;
    }       

    let stageBtn = document.getElementById('stageBtn');
    stageBtn.addEventListener('click', () => {
        if (stages.training) {
            stages.training = false;
            stages.practice = true;
            stages.exam = false;
            stageBtn.value = "Перейти к экзамену";
            mouseObj.isDown = false;
        }
        else if (stages.practice) {
                stages.training = false;
                stages.practice = false;
                stages.exam = true;
                stageBtn.style.display = 'none';
                mouseObj.isDown = false;
                let inputText = document.getElementById('inputText');
                inputText.style.display = 'block';
                inputText.value = "Начните экзамен";
            };
    })

    //set of functions
    function mod(x) { //x set -1 or 1 if it is out of interval [-1; 1] 
        return Math.abs(x) > 1 ? 1.0 * x / Math.abs(x) : x;
    }
    //get the rotation angles by the moving coords and rotate the pen
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
    function trainingStage(movementX, movementY) {
        if ((Math.abs(movementX) > 100 || Math.abs(movementY) > 100)) return;
        //запрет перескакивать
        if ((Math.abs(movementX) > 10 || Math.abs(movementY) > 10) &&
            (penCoords.x < 460 && penCoords.x > 300 && penCoords.y > 30 && penCoords.y < 150)) return;
        //change index of the pattern data
        if (penCoords.x < 250 || penCoords.y > 350) {
            changeIndex = true;
        }
        if (penCoords.x > 370 && penCoords.x < 400 && penCoords.y < 120 && penCoords.y > 55 && changeIndex) {
            changeIndex = false;
            dataIndex = dataIndex == 0 ? 1 : 0;
        }

        let newPenCoordX = penCoords.x + movementX;
        let newPenCoordY = penCoords.y + movementY;
        let k = (newPenCoordX + cfg.width * newPenCoordY); //index in data
        if (patternData[dataIndex][k] == 1) 
            movePen(newPenCoordX, newPenCoordY, cfg.R);      
        else {
            k = (newPenCoordX + cfg.width * (newPenCoordY + 3));
            if (patternData[dataIndex][k] == 1) 
                movePen(newPenCoordX, newPenCoordY + 3, cfg.R);
            else {
                k = (newPenCoordX + cfg.width * (newPenCoordY - 3));
                if (patternData[dataIndex][k] == 1) 
                    movePen(newPenCoordX, newPenCoordY - 3, cfg.R);
                else {
                    k = (newPenCoordX + cfg.width * (newPenCoordY + 8));
                    if (patternData[dataIndex][k] == 1) 
                        movePen(newPenCoordX, newPenCoordY + 8, cfg.R);
                }
                }
            }
    }
    function practiceStage(movementX, movementY) {
        let newPenCoordX = penCoords.x + movementX;
        let newPenCoordY = penCoords.y + movementY;
        movePen(newPenCoordX, newPenCoordY, cfg.R);
        //draw line 
        let lineX = 280.0*(penCoords.x - 0.5 * cfg.width) / (0.5 * cfg.width);
        let lineY = -150.0 * (penCoords.y - 0.5 * cfg.height) / (0.5 * cfg.height);
        trajectoryPoints.push(new THREE.Vector3(lineX, lineY, 600));
        trajectoryPoints2.push(new THREE.Vector3(lineX, lineY + 0.5, 600));
        trajectoryPoints3.push(new THREE.Vector3(lineX, lineY - 0.5, 600));
        trajectoryPoints4.push(new THREE.Vector3(lineX - 0.5, lineY, 600));
        trajectoryPointsTime.push(new Date);
    }
    function examStage(movementX, movementY) {
        let newPenCoordX = penCoords.x + movementX;
        let newPenCoordY = penCoords.y + movementY;
        movePen(newPenCoordX, newPenCoordY, cfg.R);
        let inputText = document.getElementById('inputText');
        inputText.value = "В процессе";
        let k = (newPenCoordX + cfg.width * newPenCoordY); //index in data
        if (patternData[2][k] == 0) {
            exam.inline = false;
            inputText.value = "Экзамен не сдан";    
        }
             
    }
}