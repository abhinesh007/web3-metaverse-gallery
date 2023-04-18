if (!Detector.webgl) {
    //if no support for WebGL
    alert('Your browser does not support WebGL!');
} else {
    let { userName } = JSON.parse(localStorage.getItem('userDetails') || '');

    var gal = {
        userName: userName,
        isAdmin : userName === 'admin',
        selectedImgObject : null,
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        ),
        renderer: new THREE.WebGLRenderer({
            antialias: false
        }),
        raycaster: new THREE.Raycaster(),
        mouse: new THREE.Vector2(),
        raycastSetUp: function() {
            // gal.mouse.x = 0.5 * 2 - 1;
            // gal.mouse.y = 0.5 * 2 + 1;
        },
        boot: function() {
            //renderer time delta
            gal.prevTime = performance.now();

            gal.initialRender = true;

            gal.scene.fog = new THREE.FogExp2(0x666666, 0.025);

            gal.renderer.setSize(window.innerWidth, window.innerHeight);
            gal.renderer.setClearColor(0xffffff, 1);
            document.body.appendChild(gal.renderer.domElement);

            gal.userBoxGeo = new THREE.BoxGeometry(2, 1, 2);
            gal.userBoxMat = new THREE.MeshBasicMaterial({
                color: 0xeeee99,
                wireframe: true,
            });
            gal.user = new THREE.Mesh(gal.userBoxGeo, gal.userBoxMat);

            //invisible since this will solely be used to determine the size
            //of the bounding box of our boxcollider for the user
            gal.user.visible = false;

            //making Bounding Box and HelperBox
            //boundingbox is used for collisions, Helper box just makes it easier to debug
            gal.user.BBox = new THREE.Box3();

            //make our collision object a child of the camera
            gal.camera.add(gal.user);

            gal.controls = new THREE.PointerLockControls(gal.camera);
            gal.scene.add(gal.controls.getObject());

            gal.pastX = gal.controls.getObject().position.x;
            gal.pastZ = gal.controls.getObject().position.z;

            gal.canvas = document.querySelector('canvas');
            gal.canvas.className = 'gallery';

            //Clicking on either of these will start
            gal.bgMenu = document.querySelector('#background_menu');
            gal.play = document.querySelector('#play_button');
            gal.centreSelector = document.querySelector('#centre');
            gal.centreSelector.hidden = true;

            // file upload modal
            gal.fileContainer = document.querySelector('#file-upload-container');
            gal.fileContainer.style.display = "none";

            gal.fileContainerClose = document.querySelector('#close-upload-btn');
            gal.fileContainerClose.addEventListener('click', function() {
               gal.fileContainer.style.display = "none";
            })

            //enabling/disabling menu based on pointer controls
            gal.menu = document.getElementById('menu');

            //only when pointer is locked will translation controls be allowed: gal.controls.enabled
            gal.moveVelocity = new THREE.Vector3();
            gal.jump = true;
            gal.moveForward = false;
            gal.moveBackward = false;
            gal.moveLeft = false;
            gal.moveRight = false;

            // User Bid element
            gal.userBidContainer = document.getElementById('user-bid');
            gal.userBidContainer.style.display = 'none';

            // Admin Bid element
            gal.adminBidContainer = document.getElementById('admin-bid');
            gal.adminBidContainer.style.display = 'none';

            //Resize if window size change!
            window.addEventListener('resize', function() {
                gal.renderer.setSize(window.innerWidth, window.innerHeight);
                gal.camera.aspect = window.innerWidth / window.innerHeight;
                gal.camera.updateProjectionMatrix();
            });

            // Add new item to Gallery
            document.addEventListener('keyup', function(e) {
                if(e.keyCode === 27) {
                    gal.fileContainer.style.display = "none";
                }

                if (e.altKey && e.keyCode === 78) {
                  console.log('Add new item'); 

                  if(!gal.isAdmin) {
                    alert('Action only allowed to Admins');
                    return;
                  }
                  gal.fileContainer.style.display = "block";
                  document.exitPointerLock();
                  setTimeout(function(){
                    document.getElementById('menu').className = 'hide';
                  }, 0);
                }
            });

            // Image transaction options 
            document.addEventListener('click', function(e) {
                if (gal.selectedImgObject) {
                    document.exitPointerLock();
                    setTimeout(function(){
                        document.getElementById('menu').className = 'hide';
                    }, 0);
                    gal.selectedImgObject.object.material.callback();
                }
            });
         },

        pointerControls: function() {
            // Pointer Lock Controls & Full Screen
            //https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
            //gal.controls;
            //if pointer lock supported in browser:
            if (
                'pointerLockElement' in document ||
                'mozPointerLockElement' in document ||
                'webkitPointerLockElement' in document
            ) {
                //assign the API functions for pointer lock based on browser
                gal.canvas.requestPointerLock =
                    gal.canvas.requestPointerLock ||
                    gal.canvas.mozRequestPointerLock ||
                    gal.canvas.webkitRequestPointerLock;
                //run this function to escape pointer Lock
                gal.canvas.exitPointerLock =
                    gal.canvas.exitPointerLock ||
                    gal.canvas.mozExitPointerLock ||
                    gal.canvas.webkitExitPointerLock;

                document.addEventListener('keydown', function(e) {
                    if (e.keyCode === 102 || e.keyCode === 70) {
                        //F/f for fullscreen mode
                        gal.toggleFullscreen();
                        //refer to below event listener:
                        gal.canvas.requestPointerLock();
                        gal.centreSelector.hidden = true;
                    }
                });

                gal.bgMenu.addEventListener('click', function() {
                    gal.canvas.requestPointerLock();
                    gal.centreSelector.hidden = false;
                });

                gal.play.addEventListener('click', function() {
                    gal.canvas.requestPointerLock();
                    gal.centreSelector.hidden = false;
                });

                //pointer lock state change listener
                document.addEventListener(
                    'pointerlockchange',
                    gal.changeCallback,
                    false
                );
                document.addEventListener(
                    'mozpointerlockchange',
                    gal.changeCallback,
                    false
                );
                document.addEventListener(
                    'webkitpointerlockchange',
                    gal.changeCallback,
                    false
                );

                document.addEventListener('pointerlockerror', gal.errorCallback, false);
                document.addEventListener(
                    'mozpointerlockerror',
                    gal.errorCallback,
                    false
                );
                document.addEventListener(
                    'webkitpointerlockerror',
                    gal.errorCallback,
                    false
                );
            } else {
                alert('Your browser does not support the Pointer Lock API');
            }
        },

        changeCallback: function(event) {
            if (
                document.pointerLockElement === gal.canvas ||
                document.mozPointerLockElement === gal.canvas ||
                document.webkitPointerLockElement === gal.canvas
            ) {
                //pointer is disabled by element
                gal.controls.enabled = true;
                //remove menu element from screen
                gal.menu.className += ' hide';
                gal.bgMenu.className += ' hide';
                //start mouse move listener
                document.addEventListener('mousemove', gal.moveCallback, false);
            } else {
                //pointer is no longer disabled
                gal.controls.enabled = false;
                //remove hidden property from menu
                gal.menu.className = gal.menu.className.replace(
                    /(?:^|\s)hide(?!\S)/g,
                    ''
                );
                gal.bgMenu.className = gal.bgMenu.className.replace(
                    /(?:^|\s)hide(?!\S)/g,
                    ''
                );
                gal.centreSelector.hidden = true;
                document.removeEventListener('mousemove', gal.moveCallback, false);
            }
        },

        errorCallback: function(event) {
            alert('Pointer Lock Failed');
        },

        clickCallback: function(event) {
            console.log('Click on', event)
        },

        moveCallback: function(event) {
            //now that pointer disabled, we get the movement in x and y pos of the mouse
            var movementX =
                event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            var movementY =
                event.movementY || event.mozMovementY || event.webkitMovementY || 0;
            
            gal.raycaster.set( gal.camera.getWorldPosition(), gal.camera.getWorldDirection());
            var intersects = gal.raycaster.intersectObjects(gal.scene.children);

          
            if ( intersects.length > 0 ) {
                // console.log('intersects', intersects);
                if (intersects[0].object.material.userData && intersects[0].object.material.userData.textureType === 'image') {
                    gal.centreSelector.className = 'red';
                    gal.selectedImgObject  = intersects[0] || null;
                    // console.log('intersects', intersects[0].object.material.userData);
                } else {
                    gal.centreSelector.className = '';
                    gal.selectedImgObject  = null;
                    gal.userBidContainer.style.display = 'none';
                }
            } else {
                gal.centreSelector.className = '';
                gal.selectedImgObject  = null;
                gal.userBidContainer.style.display = 'none';
            }
        },

        toggleFullscreen: function() {
            if (!document.fullscreenElement &&
                !document.mozFullScreenElement &&
                !document.webkitFullscreenElement &&
                !document.msFullscreenElement
            ) {
                // current working methods
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                } else if (document.documentElement.msRequestFullscreen) {
                    document.documentElement.msRequestFullscreen();
                } else if (document.documentElement.mozRequestFullScreen) {
                    document.documentElement.mozRequestFullScreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen(
                        Element.ALLOW_KEYBOARD_INPUT
                    );
                }
            } else {
                gal.selectedImgObject  = null;
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
        },

        movement: function() {
            document.addEventListener('keydown', function(e) {
                if (e.keyCode === 87 || e.keyCode === 38) {
                    //w or UP
                    gal.moveForward = true;
                } else if (e.keyCode === 65 || e.keyCode === 37) {
                    //A or LEFT
                    gal.moveLeft = true;
                } else if (e.keyCode === 83 || e.keyCode === 40) {
                    //S or DOWN
                    gal.moveBackward = true;
                } else if (e.keyCode === 68 || e.keyCode === 39) {
                    //D or RIGHT
                    gal.moveRight = true;
                } else if (e.keyCode === 32) {
                    //Spacebar
                    if (gal.jump) {
                        gal.moveVelocity.y += 17;
                        gal.jump = false;
                    }
                }
            });

            document.addEventListener('keyup', function(e) {
                if (e.keyCode === 87 || e.keyCode === 38) {
                    //w or UP
                    gal.moveForward = false;
                } else if (e.keyCode === 65 || e.keyCode === 37) {
                    //A or LEFT
                    gal.moveLeft = false;
                } else if (e.keyCode === 83 || e.keyCode === 40) {
                    //S or DOWN
                    gal.moveBackward = false;
                } else if (e.keyCode === 68 || e.keyCode === 39) {
                    //D or RIGHT
                    gal.moveRight = false;
                }
            });
        },
        bidsCollections: [],
        placeUserBid: function() {
            if(gal.selectedImgObject) {
                let userBidValue = gal.userBidContainer.querySelector('#bid-input').value || null;
                let selectedImage = gal.selectedImgObject.object.material.userData.imageName;
                
                console.log('userBidValue,selectedImage', userBidValue, selectedImage, userName)
                gal.bidsCollections.push({ userBidValue, selectedImage, userName});
                gal.closeUserBid();
                gal.userBidContainer.querySelector('#bid-input').value = '';
                alert('Bid Placed successfully!')

            }
        },
        getBidsForArt: function(imageName) {
            imageName = imageName || intersects[0].object.material.userData.imageName;
            return gal.bidsCollections.filter(bid => bid.selectedImage === imageName) || [];
        },
        currentArtBids: [],
        closeUserBid: function() {
            gal.selectedImgObject = null;
            gal.userBidContainer.style.display = 'none';
        },
        closeAdminBid: function() {
            gal.selectedImgObject = null;
            gal.adminBidContainer.style.display = 'none';
        },
        allotBid: function() {
            gal.closeAdminBid();
        },
        create: function() {
            //let there be light!
            gal.worldLight = new THREE.AmbientLight(0xffffff);
            gal.scene.add(gal.worldLight);
            // add some lights to light all the floor
            gal.light = new THREE.PointLight(0xffffff, 1, 100);
            gal.light.position.set(30, 20, 30);
            gal.scene.add(gal.light);
            // SpotLight lights
            gal.spotLight = new THREE.SpotLight(0xffffff, 1, 50);
            gal.spotLight.position.set(0, 20, 30);
            gal.spotLight.castShadow = true;
            gal.scene.add(gal.spotLight);

            //set the floor up
            gal.floorText = THREE.ImageUtils.loadTexture('img/textures/Floor.jpg');
            gal.floorText.wrapS = THREE.RepeatWrapping;
            gal.floorText.wrapT = THREE.RepeatWrapping;
            gal.floorText.repeat.set(24, 24);

            //Phong is for shiny surfaces
            gal.floorMaterial = new THREE.MeshPhongMaterial({
                map: gal.floorText
            });
            gal.floor = new THREE.Mesh(
                new THREE.PlaneBufferGeometry(45, 45),
                gal.floorMaterial
            );

            gal.floor.rotation.x = Math.PI / 2;
            gal.floor.rotation.y = Math.PI;
            gal.scene.add(gal.floor);

            //Create the walls////
            gal.wallGroup = new THREE.Group();
            gal.scene.add(gal.wallGroup);

            gal.wall1 = new THREE.Mesh(
                new THREE.BoxGeometry(40, 6, 0.001),
                new THREE.MeshLambertMaterial({
                    color: 0xffffff
                })
            );
            gal.wall1.name = 'wall';
            gal.wall1.addEventListener('click', function() {
                console.log( 'wall1' );
            });


            gal.wall2 = new THREE.Mesh(
                new THREE.BoxGeometry(6, 6, 0.001),
                new THREE.MeshLambertMaterial({
                    color: 0xffffff
                })
            );
            gal.wall2.name = 'wall';

            gal.wall3 = new THREE.Mesh(
                new THREE.BoxGeometry(6, 6, 0.001),
                new THREE.MeshLambertMaterial({
                    color: 0xffffff
                })
            );
            gal.wall3.name = 'wall';

            gal.wall4 = new THREE.Mesh(
                new THREE.BoxGeometry(40, 6, 0.001),
                new THREE.MeshLambertMaterial({
                    color: 0xffffff
                })
            );
            gal.wall4.name = 'wall';

            gal.wallGroup.add(gal.wall1, gal.wall2, gal.wall3, gal.wall4);
            gal.wallGroup.position.y = 3;

            gal.wall1.position.z = -3;
            gal.wall2.position.x = -20;
            gal.wall2.rotation.y = Math.PI / 2;
            gal.wall3.position.x = 20;
            gal.wall3.rotation.y = -Math.PI / 2;
            gal.wall4.position.z = 3;
            gal.wall4.rotation.y = Math.PI;

            for (var i = 0; i < gal.wallGroup.children.length; i++) {
                gal.wallGroup.children[i].BBox = new THREE.Box3();
                gal.wallGroup.children[i].BBox.setFromObject(gal.wallGroup.children[i]);
            }

            //Ceiling//
            //gal.ceilMaterial = new THREE.MeshLambertMaterial({color: 0x8DB8A7});
            gal.ceilMaterial = new THREE.MeshLambertMaterial({
                color: 0xeeeeee
            });
            gal.ceil = new THREE.Mesh(
                new THREE.PlaneBufferGeometry(40, 6),
                gal.ceilMaterial
            );
            gal.ceil.position.y = 6;
            gal.ceil.rotation.x = Math.PI / 2;

            gal.scene.add(gal.ceil);

            // Adding Artworks
            gal.artGroup = new THREE.Group();

            gal.num_of_paintings = 6;
            gal.paintings = [];
            for (var i = 0; i < gal.num_of_paintings; i++) {
                (function(index) {
                    //https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/Image
                    var artwork = new Image();
                    var ratiow = 0;
                    var ratioh = 0;

                    var source = './img/artworks/' + index.toString() + '.jpg';
                    artwork.src = source;

                    var texture = THREE.ImageUtils.loadTexture(artwork.src);
                    texture.minFilter = THREE.LinearFilter;
                    var img = new THREE.MeshBasicMaterial({
                        map: texture,
                    });
                    img.userData = {
                        imageName: index,
                        textureType: 'image'
                    };
                    // Image Callback
                    img.callback = function() {
                        console.log('img.userData', img.userData);
                        if(gal.isAdmin) {
                            gal.adminBidContainer.style.display = 'block';
                            gal.currentArtBids =  gal.getBidsForArt(img.userData.imageName);
                        } else {
                            gal.userBidContainer.style.display = 'block';
                        }
                       
                    }

                    artwork.onload = function() {
                        ratiow = artwork.width / 300;
                        ratioh = artwork.height / 300;
                        // plane for artwork
                        var plane = new THREE.Mesh(
                            new THREE.PlaneBufferGeometry(ratiow, ratioh),
                            img
                        ); //width, height
                        plane.overdraw = true;
                        //-1 because index is 0 - n-1 but num of paintings is n
                        if (index <= Math.floor(gal.num_of_paintings / 2) - 1 || index < 15) {
                            //bottom half
                            //plane.rotation.z = Math.PI/2;
                            plane.position.set(2.5 * index - 17.5, 2, -2.96); //y and z kept constant
                        } else {
                            //plane.rotation.z = Math.PI/2;
                            plane.position.set(2.5 * index - 55, 2, 2.96);
                            //plane.position.set(65*i - 75*Math.floor(gal.num_of_paintings/2) - 15*Math.floor(num_of_paintings/2), 48, 90);
                            plane.rotation.y = Math.PI;
                        }
                        gal.scene.add(plane);
                        gal.paintings.push(plane);
                    };

                    img.map.needsUpdate = true; //ADDED
                })(i);
            }
        },
        render: function() {
            requestAnimationFrame(gal.render);

            // Movement controls
            if (gal.controls.enabled === true) {
                gal.initialRender = false;
                var currentTime = performance.now(); //returns time in milliseconds
                //accurate to the thousandth of a millisecond
                //want to get the most accurate and smallest change in time
                var delta = (currentTime - gal.prevTime) / 1000;

                //there's a constant deceleration that needs to be applied
                //only when the object is currently in motion
                gal.moveVelocity.x -= gal.moveVelocity.x * 20.0 * delta;
                //for now
                gal.moveVelocity.y -= 9.8 * 7.0 * delta; // m/s^2 * kg * delta Time
                gal.moveVelocity.z -= gal.moveVelocity.z * 20.0 * delta;

                //need to apply velocity when keys are being pressed
                if (gal.moveForward) {
                    gal.moveVelocity.z -= 20 * delta;
                }
                if (gal.moveBackward) {
                    gal.moveVelocity.z += 20 * delta;
                }
                if (gal.moveLeft) {
                    gal.moveVelocity.x -= 20 * delta;
                }
                if (gal.moveRight) {
                    gal.moveVelocity.x += 20 * delta;
                }

                gal.controls.getObject().translateX(gal.moveVelocity.x * delta);
                gal.controls.getObject().translateY(gal.moveVelocity.y * delta);
                gal.controls.getObject().translateZ(gal.moveVelocity.z * delta);

                if (gal.controls.getObject().position.y < 1.75) {
                    gal.jump = true;
                    gal.moveVelocity.y = 0;
                    gal.controls.getObject().position.y = 1.75;
                }
                if (gal.controls.getObject().position.z < -2) {
                    gal.controls.getObject().position.z = -2;
                }
                if (gal.controls.getObject().position.z > 2) {
                    gal.controls.getObject().position.z = 2;
                }
                if (gal.controls.getObject().position.x < -18) {
                    gal.controls.getObject().position.x = -18;
                }
                if (gal.controls.getObject().position.x > 18) {
                    gal.controls.getObject().position.x = 18;
                }

                for (var i = 0; i < gal.wallGroup.children.length; i++) {
                    if (gal.user.BBox.isIntersectionBox(gal.wallGroup.children[i].BBox)) {
                        gal.user.BBox.setFromObject(gal.user);
                    } else {
                        gal.wallGroup.children[i].material.color.set(0xffffff);
                    }
                }
                gal.pastX = gal.controls.getObject().position.x;
                gal.pastZ = gal.controls.getObject().position.z;

                gal.user.BBox.setFromObject(gal.user);

                gal.prevTime = currentTime;

                gal.renderer.render(gal.scene, gal.camera);
            } else {
                //reset delta time, so when unpausing, time elapsed during pause
                //doesn't affect any variables dependent on time.
                gal.prevTime = performance.now();
            }

            if (gal.initialRender === true) {
                for (var i = 0; i < gal.wallGroup.children.length; i++) {
                    gal.wallGroup.children[i].BBox.setFromObject(
                        gal.wallGroup.children[i]
                    );
                }
                gal.renderer.render(gal.scene, gal.camera);
            }
        },
    };
    var app = new Vue({
        el: '#app',
        data: gal
    });

    gal.boot();
    gal.pointerControls();
    gal.movement();
    gal.create();
    gal.raycastSetUp();
    gal.render();
}