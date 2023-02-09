import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import Stats from 'https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js'
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/FBXLoader.js';

import { player } from './player.js';
import { shoogaGlider } from './shoogaGlider.js';
import { background } from './background.js';
import { progression } from './progression.js';
import { water } from './water.js';
import { soda } from './soda.js';
import { fruitDrink } from './fruitDrink.js';
import { oilSlik } from './OilSlik.js';

const _VS = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;


const _FS = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
varying vec3 vWorldPosition;
void main() {
  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}`;


const _PCSS = `
#define LIGHT_WORLD_SIZE 0.05
#define LIGHT_FRUSTUM_WIDTH 3.75
#define LIGHT_SIZE_UV (LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH)
#define NEAR_PLANE 1.0

#define NUM_SAMPLES 17
#define NUM_RINGS 11
#define BLOCKER_SEARCH_NUM_SAMPLES NUM_SAMPLES
#define PCF_NUM_SAMPLES NUM_SAMPLES

vec2 poissonDisk[NUM_SAMPLES];

void initPoissonSamples( const in vec2 randomSeed ) {
  float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );
  float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );

  // jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
  float angle = rand( randomSeed ) * PI2;
  float radius = INV_NUM_SAMPLES;
  float radiusStep = radius;

  for( int i = 0; i < NUM_SAMPLES; i ++ ) {
    poissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );
    radius += radiusStep;
    angle += ANGLE_STEP;
  }
}

float penumbraSize( const in float zReceiver, const in float zBlocker ) { // Parallel plane estimation
  return (zReceiver - zBlocker) / zBlocker;
}

float findBlocker( sampler2D shadowMap, const in vec2 uv, const in float zReceiver ) {
  // This uses similar triangles to compute what
  // area of the shadow map we should search
  float searchRadius = LIGHT_SIZE_UV * ( zReceiver - NEAR_PLANE ) / zReceiver;
  float blockerDepthSum = 0.0;
  int numBlockers = 0;

  for( int i = 0; i < BLOCKER_SEARCH_NUM_SAMPLES; i++ ) {
    float shadowMapDepth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[i] * searchRadius));
    if ( shadowMapDepth < zReceiver ) {
      blockerDepthSum += shadowMapDepth;
      numBlockers ++;
    }
  }

  if( numBlockers == 0 ) return -1.0;

  return blockerDepthSum / float( numBlockers );
}

float PCF_Filter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius ) {
  float sum = 0.0;
  for( int i = 0; i < PCF_NUM_SAMPLES; i ++ ) {
    float depth = unpackRGBAToDepth( texture2D( shadowMap, uv + poissonDisk[ i ] * filterRadius ) );
    if( zReceiver <= depth ) sum += 1.0;
  }
  for( int i = 0; i < PCF_NUM_SAMPLES; i ++ ) {
    float depth = unpackRGBAToDepth( texture2D( shadowMap, uv + -poissonDisk[ i ].yx * filterRadius ) );
    if( zReceiver <= depth ) sum += 1.0;
  }
  return sum / ( 2.0 * float( PCF_NUM_SAMPLES ) );
}

float PCSS ( sampler2D shadowMap, vec4 coords ) {
  vec2 uv = coords.xy;
  float zReceiver = coords.z; // Assumed to be eye-space z in this code

  initPoissonSamples( uv );
  // STEP 1: blocker search
  float avgBlockerDepth = findBlocker( shadowMap, uv, zReceiver );

  //There are no occluders so early out (this saves filtering)
  if( avgBlockerDepth == -1.0 ) return 1.0;

  // STEP 2: penumbra size
  float penumbraRatio = penumbraSize( zReceiver, avgBlockerDepth );
  float filterRadius = penumbraRatio * LIGHT_SIZE_UV * NEAR_PLANE / zReceiver;

  // STEP 3: filtering
  //return avgBlockerDepth;
  return PCF_Filter( shadowMap, uv, zReceiver, filterRadius );
}
`;

const _PCSSGetShadow = `
return PCSS( shadowMap, shadowCoord );
`;


class BasicWorldDemo {
  constructor() {
    this.countdown_ = 6;
    this.intervalId_ = null;
    this._Initialize();
    this._gameStarted = false;
    this.menuMusic = document.getElementById("menu-music");
    this._playMenuMusic();
    document.addEventListener('DOMContentLoaded', () => {
      this._playMenuMusic();
    });
    document.getElementById('game-menu').onclick = (msg) => this._OnStart(msg);

    // swipe gesture variables and event listeners
    this.swipeLeft = false;
    this.swipeRight = false;
    this.swipeUp = false;
    this.swipeDown = false;
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    this.minDistance = 100;
    this.isSwiping = false;
    document.addEventListener('touchstart', (event) => {
      this.handleTouchStart(event);
    }, { passive: false });

    document.addEventListener('touchmove', (event) => {
      this.handleTouchMove(event);
    }, { passive: false });


  }

  _playMenuMusic() {
    this.menuMusic.play();
  }

  _OnStart(msg) {
    this.menuMusic.pause();
    document.getElementById('game-menu').style.display = 'none';
    this._gameStarted = true;
    var gameMusic = document.getElementById("game-music");
    gameMusic.play();
  }

  //swipe gestures, properties: swipe atleast 100 pixels to activate, cannot execute if user holds down on the swipe.


  handleTouchStart(event) {
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
  }

  handleTouchMove(event) {
    if (this.isSwiping) {
      return;
    }
    this.endX = event.changedTouches[0].clientX;
    this.endY = event.changedTouches[0].clientY;

    const deltaX = this.endX - this.startX;
    const deltaY = this.endY - this.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > this.minDistance || absDeltaY > this.minDistance) {
      if (absDeltaX > absDeltaY) {
        if (deltaX > 0) {
          this.swipeRight = true;
          console.log('Right swipe detected');
        } else {
          this.swipeLeft = true;
          console.log('Left swipe detected');
        }
      } else {
        if (deltaY > 0) {
          this.swipeDown = true;
          console.log('Down swipe detected');
        } else {
          this.swipeUp = true;
          console.log('Up swipe detected');
        }
      }
    }

  }


  _Initialize() {
    // overwrite shadowmap code
    let shadowCode = THREE.ShaderChunk.shadowmap_pars_fragment;

    shadowCode = shadowCode.replace(
      '#ifdef USE_SHADOWMAP',
      '#ifdef USE_SHADOWMAP' +
      _PCSS
    );

    shadowCode = shadowCode.replace(
      '#if defined( SHADOWMAP_TYPE_PCF )',
      _PCSSGetShadow +
      '#if defined( SHADOWMAP_TYPE_PCF )'
    );

    THREE.ShaderChunk.shadowmap_pars_fragment = shadowCode;
    // renderer

    this.threejs_ = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.threejs_.outputEncoding = THREE.sRGBEncoding;
    this.threejs_.gammaFactor = 2.2;
    // this.threejs_.toneMapping = THREE.ReinhardToneMapping;
    this.threejs_.shadowMap.enabled = true;
    // this.threejs_.shadowMap.type = THREE.PCFSoftShadowMap;
    this.threejs_.setPixelRatio(window.devicePixelRatio);
    this.threejs_.setSize(window.innerWidth, window.innerHeight);

    document.getElementById('container').appendChild(this.threejs_.domElement);

    window.addEventListener('resize', () => {
      this.OnWindowResize_();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 20000.0;
    this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera_.position.set(-7, 3, 0);
    this.camera_.lookAt(0, 3, 0);

    this.scene_ = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xFFFFFF, 2);
    light.position.set(60, 100, 10);
    light.target.position.set(40, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.far = 200.0;
    light.shadow.camera.near = 1.0;
    light.shadow.camera.left = 50;
    light.shadow.camera.right = -50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;
    this.scene_.add(light);

    light = new THREE.HemisphereLight(0x202020, 0x004080, 0.4);
    this.scene_.add(light);

    this.scene_.background = new THREE.Color(0x808080);
    this.scene_.fog = new THREE.FogExp2(0x89b2eb, 0.00125);

    // const ground = new THREE.Mesh(
    //     new THREE.PlaneGeometry(20000, 20000, 10, 10),
    //     new THREE.MeshStandardMaterial({
    //         color: 0xf6f47f,
    //       }));
    // ground.castShadow = false;
    // ground.receiveShadow = true;
    // ground.rotation.x = -Math.PI / 2;
    // this.scene_.add(ground);

    const loader = new FBXLoader();
    loader.setPath('./resources/Map/FBX/');
    loader.load('piratemap.fbx', (fbx) => {
      fbx.castShadow = true;
      fbx.receiveShadow = true;
      fbx.position.set(-5, 0, 0);
      fbx.rotation.set(0, Math.PI / 2, 0);
      fbx.scale.setScalar(0.01);

      const texturePath = './resources/Map/textures/piratemap/';
      const texture1 = new THREE.TextureLoader().load(texturePath + 'path.png');
      const texture2 = new THREE.TextureLoader().load(texturePath + 'mudside.png');
      const texture3 = new THREE.TextureLoader().load(texturePath + 'plants.png');
      const texture4 = new THREE.TextureLoader().load(texturePath + 'props.png');
      fbx.traverse((child) => {
        if (child.isMesh) {
          if (child.name === "path_GEO") {
            child.material.map = texture1;
          } else if (child.name === "mudside_GEO") {
            child.material.map = texture2;
          } else if (child.name === "plants_GEO") {
            child.material.map = texture3;
          } else if (child.name === "props_GEO") {
            child.material.map = texture4;
          }
        }
      });

      this.mesh = fbx;
      this.scene_.add(this.mesh);
      let animationId;
      let animationStarted = false;

      const animate = () => {
        if (this._gameStarted) {
          const speed = 0.22;
          this.mesh.position.x -= speed;
        }
        if (this.gameOver_) {
          cancelAnimationFrame(animationId);
          return;
        }
        animationId = requestAnimationFrame(animate);
      }

      animate();
      setInterval(() => {
        if (this.gameOver_) {
          cancelAnimationFrame(animationId);
          animationStarted = false;
        }
      }, 10);
    });

    const uniforms = {
      topColor: { value: new THREE.Color(0x0077FF) },
      bottomColor: { value: new THREE.Color(0x89b2eb) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
    };

    const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: _VS,
      fragmentShader: _FS,
      side: THREE.BackSide,
    });

  
    this.scene_.add(new THREE.Mesh(skyGeo, skyMat));



    let arr1 = [];
    let arr2 = [];
    let arr3 = [];
  
    for (let i = 0; i < 6; i++) {
      let value1 = Math.floor(Math.random() * 3) - 1;
      let value2 = Math.floor(Math.random() * 3) - 1;
      let value3 = Math.floor(Math.random() * 3) - 1;
  
      while (value1 === value2) {
        value2 = Math.floor(Math.random() * 3) - 1;
      }
  
      while (value1 === value3 || value2 === value3) {
        value3 = Math.floor(Math.random() * 3) - 1;
      }
  
      arr1.push(value1 * 3);
      arr2.push(value2 * 3);
      arr3.push(value3 * 3);
    }
  
    


    this.shoogaGlider_ = new shoogaGlider.ShoogaGliderManager({ scene: this.scene_ });
    this.water_ = new water.DrinksManager({ scene: this.scene_, position: arr1 })
    this.soda_ = new soda.DrinksManager({ scene: this.scene_, position: arr2 })
    this.fruitDrink_ = new fruitDrink.DrinksManager({ scene: this.scene_, position: arr3 })

    this.player_ = new player.Player({ scene: this.scene_, water: this.water_, soda: this.soda_, fruitDrink: this.fruitDrink_, shoogaGlider: this.shoogaGlider_ });
    this.oilSlik_ = new oilSlik.OilSlik({ scene: this.scene_ });

    this.background_ = new background.Background({ scene: this.scene_ });
    this.progression_ = new progression.ProgressionManager();

    this.gameOver_ = false;
    this.previousRAF_ = null;
    this.RAF_();
    this.OnWindowResize_();

  }

  OnWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();
    this.threejs_.setSize(window.innerWidth, window.innerHeight);
  }

  RAF_() {
    requestAnimationFrame((t) => {
      if (this.previousRAF_ === null) {
        this.previousRAF_ = t;
      }

      this.RAF_();

      this.Step_((t - this.previousRAF_) / 1000.0);
      this.threejs_.render(this.scene_, this.camera_);
      this.previousRAF_ = t;
    });
  }

  Step_(timeElapsed) {
    if (!this.eventAdded) {
      document.addEventListener('score-over', () => {
        this.gameOver_ = true;
        document.getElementById('you-win').classList.toggle('active');
        this.intervalId_ = setInterval(() => {
          this.countdown_--;
          document.getElementById('you-win-countdown-text').textContent = this.countdown_ + ' seconds to main screen';
          if (this.countdown_ === 0) {
            clearInterval(this.intervalId_);
            location.assign(location.href);
          }
        }, 1000);
      });
      this.eventAdded = true;
    }
    if (this.gameOver_ || !this._gameStarted) {
      return;
    }
    this.player_.Update(timeElapsed);
    this.oilSlik_.Update(timeElapsed);

    this.shoogaGlider_.Update(timeElapsed);
    this.background_.Update(timeElapsed);
    this.progression_.Update(timeElapsed);
    this.water_.Update(timeElapsed)
    this.soda_.Update(timeElapsed)
    this.fruitDrink_.Update(timeElapsed)

    if (this.swipeLeft) {
      this.player_.SwipeLeft();
      this.isSwiping = true

      if (this.player_.position_.z == -3 || this.player_.position_.z == 0) {
        this.swipeLeft = false;
        this.isSwiping = false;

      }
    }
    if (this.swipeRight) {
      this.player_.SwipeRight();
      this.isSwiping = true

      if (this.player_.position_.z == 3 || this.player_.position_.z == 0) {
        this.swipeRight = false;
        this.isSwiping = false;

      }
    }
    if (this.swipeUp) {

      this.player_.SwipeUp(timeElapsed);
      this.swipeUp = false;
    }
    if (this.swipeDown) {

      this.player_.SwipeDown(timeElapsed);
      this.swipeDown = false;
    }

    if (this.player_.gameOver && !this.gameOver_) {
      this.gameOver_ = true;
      document.getElementById('game-over').classList.toggle('active');
      this.intervalId_ = setInterval(() => {
        this.countdown_--;
        document.getElementById('countdown-text').textContent = this.countdown_ + ' seconds to main screen';
        if (this.countdown_ === 0) {
          clearInterval(this.intervalId_);
          location.assign(location.href);
        }
      }, 1000);
    }
  }
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new BasicWorldDemo();
});

/*
var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom )

function animate() {

  stats.begin();

  // monitored code goes here

  stats.end();

  requestAnimationFrame( animate );

}

requestAnimationFrame( animate );
*/