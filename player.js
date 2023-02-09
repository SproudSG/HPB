import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/FBXLoader.js';


export const player = (() => {

  class Player {
    constructor(params) {
      //player properties
      this.position_ = new THREE.Vector3(0, 0, 0);
      this.velocity_ = 0.0;
      this.leftMovementSpeed = -0.3;
      this.rightMovementSpeed = 0.3;
      this.jumping_ = false;
      this.inAir_ = false;
      this.sliding_ = false;
      this.slideAnimation_ = false;
      this.playerBox_ = new THREE.Box3();

      //water variables
      this.waterID = null;
      //this.prevWaterID = null;
      //this.waterVisibilityID = 0;
      this.processedWaterIDs = [];

      //soda variables
      this.sodaID = null;
      this.processedSodaIDs = [];

      //fruit drink variables
      this.fruitID = null;
      this.processedFruitIDs = [];

      //sugarcrash variables
      this.stamina_ = 100;
      this.sugarDrinks = 0;

      this.params_ = params;
      this.LoadModel_();
      this.InitInput_();
    }

    LoadModel_() {
      const loader = new FBXLoader();
      loader.setPath('./resources/Player/FBX/');
      loader.load('baileycompile.fbx', (fbx) => {
        fbx.scale.setScalar(0.01);
        fbx.quaternion.setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), Math.PI / 2);

        this.mesh_ = fbx;
        this.params_.scene.add(this.mesh_);

        const texturePath = './resources/Player/textures/bailey/';
        const texture1 = new THREE.TextureLoader().load(texturePath + 'clothes_Color.jpg');
        const texture2 = new THREE.TextureLoader().load(texturePath + 'goggles_Color.jpg');
        const texture3 = new THREE.TextureLoader().load(texturePath + 'hat_Color.jpg');
        const texture4 = new THREE.TextureLoader().load(texturePath + 'skin_Color.jpg');
        const texture5 = new THREE.TextureLoader().load(texturePath + 'hair_Color.jpg');
        const texture6 = new THREE.TextureLoader().load(texturePath + 'boots_Color.jpg');
        fbx.traverse((child) => {
          if (child.isMesh) {
            if (child.name === "shirt_GEO" || child.name === "pants_GEO" || child.name === "bagback_GEO" || child.name === "bagfront_GEO" || child.name === "belt_GEO") {
              child.material.map = texture1;
            } else if (child.name === "goggles_GEO" || child.name === "redstrap_GEO") {
              child.material.map = texture2;
            } else if (child.name === "hat_base_GEO" || child.name === "hatpart_GEO") {
              child.material.map = texture3;
            } else if (child.name === "body_transfer_GEO" || child.name === "ear_R_GEO" || child.name === "ear_L_GEO" || child.name === "leg_L_GEO" || child.name === "leg_R_GEO") {
              child.material.map = texture4;
            } else if (child.isMesh && child.name.startsWith("hair_")) {
              child.material.map = texture5;
            } else if (child.isMesh && child.name.startsWith("boot_")) {
              child.material.map = texture6;
            }
          }
        });

        const m = new THREE.AnimationMixer(fbx);
        this.mixer_ = m;

        for (let i = 0; i < fbx.animations.length; ++i) {
          if (fbx.animations[i].name.includes('Run')) {
            const clip = fbx.animations[i];
            const action = this.mixer_.clipAction(clip);
            action.play();
          }
        }
      });
    }

    UpdateAnimations_() {
      if (!this.mixer_) {
        return;

      }

      // if (this.sliding_) {
      //   for (let i = 0; i < this.mesh_.animations.length; ++i) {
      //     if (this.mesh_.animations[i].name.includes('Slide')) {
      //       const clip = this.mesh_.animations[i];
      //       const action = this.mixer_.clipAction(clip);
      //       action.play();
      //       action.setLoop(THREE.LoopOnce);
      //       action.clampWhenFinished = true;

      //       action.onLoop = function (event) {
      //         action.timeScale = 0;
      //       };
      //       break;
      //     }
      //   }
      // } else {
      //   for (let i = 0; i < this.mesh_.animations.length; ++i) {
      //     if (this.mesh_.animations[i].name.includes('Run')) {
      //       const clip = this.mesh_.animations[i];
      //       const action = this.mixer_.clipAction(clip);
      //       action.play();
      //       break;
      //     }
      //   }
      // }

    }

    InitInput_() {
      this.keys_ = {
        left: false,
        right: false,
        space: false,
        down: false,
      };

      document.addEventListener('keydown', (event) => {
        if (event.keyCode === 37) {
          this.keys_.left = true;
        } else if (event.keyCode === 39) {
          this.keys_.right = true;
        } else if (event.keyCode === 32) {
          this.keys_.space = true;
        } else if (event.keyCode === 40) {
          this.keys_.down = true;
        }
      });

      document.addEventListener('keyup', (event) => {
        if (event.keyCode === 32) {
          this.keys_.space = false;
        } else if (event.keyCode === 40) {
          this.keys_.down = false;
        }
      });
    }

    //checks if player collides with any other mesh
    CheckCollisions_() {
      const shoogaGlider = this.params_.shoogaGlider.GetColliders();
      const water = this.params_.water.GetColliders();
      const fruitDrink = this.params_.fruitDrink.GetColliders();
      const soda = this.params_.soda.GetColliders();


      this.playerBox_.setFromObject(this.mesh_);

      //check for shooga glider monster collision
      for (let c of shoogaGlider) {
        const cur = c.collider;

        if (cur.intersectsBox(this.playerBox_)) {
          this.gameOver = true;
        }
      }

      //if player collides with water
      for (let c of water) {
        // const cur = c.collider;

        // if (cur.intersectsBox(this.playerBox_)) {
        //   this.waterID = c.mesh.uuid;

        //   var newStamina = this.stamina_ * 1.05;
        //   newStamina = Math.min(newStamina, 100)
        //   this.stamina_ = newStamina
        //   this.params_.water.ToggleVisible(this.waterVisibilityID);

        //   if (this.prevWaterID !== this.waterID) {
        //     this.waterVisibilityID++;
        //     this.prevWaterID = this.waterID;
        //   }
        // }

        const cur = c.collider;
        if (c.mesh) {
          this.waterID = c.mesh.uuid;
          if (!this.processedWaterIDs.includes(this.waterID) && cur.intersectsBox(this.playerBox_)) {
            this.processedWaterIDs.push(this.waterID);
            var newStamina = this.stamina_ + 25;
            newStamina = Math.min(newStamina, 100)
            this.stamina_ = newStamina;
            this.params_.water.ToggleVisible();
          }
        } else {
          console.error('Cannot read property "uuid" of undefined (reading "c.mesh.uuid")');
        }
      }

      //if player collides with soda
      for (let c of soda) {
        const cur = c.collider;
        if (c.mesh) {
          this.sodaID = c.mesh.uuid;
          if (!this.processedSodaIDs.includes(this.sodaID) && cur.intersectsBox(this.playerBox_)) {
            this.processedSodaIDs.push(this.sodaID);
            var newStamina = this.stamina_ + 20;
            newStamina = Math.min(newStamina, 100)
            this.stamina_ = newStamina;
            this.params_.soda.ToggleVisible();
            this.sugarDrinks++
            if(this.sugarDrinks == 3) {
              console.log(this.stamina_)
              newStamina = this.stamina_/2
              console.log(newStamina)
 
              this.stamina_ = newStamina;
              this.sugarDrinks = 0
            }
          }
        } else {
          console.error('Cannot read property "uuid" of undefined (reading "c.mesh.uuid")');
        }
      }

      //if player collides with fruit drink
      for (let c of fruitDrink) {
        const cur = c.collider;
        if (c.mesh) {
          this.fruitID = c.mesh.uuid;
          if (!this.processedFruitIDs.includes(this.fruitID) && cur.intersectsBox(this.playerBox_)) {
            this.processedFruitIDs.push(this.fruitID);
            var newStamina = this.stamina_ + 20;
            newStamina = Math.min(newStamina, 100)
            this.stamina_ = newStamina;
            this.params_.fruitDrink.ToggleVisible();
            this.sugarDrinks++
            if(this.sugarDrinks == 3) {
              console.log(this.stamina_)

              newStamina = this.stamina_/2
              console.log(newStamina)

              this.stamina_ = newStamina;
              this.sugarDrinks = 0
            }
          }
        } else {
          console.error('Cannot read property "uuid" of undefined (reading "c.mesh.uuid")');
        }
      }
    }


    //player movement with swipe gestures
    SwipeLeft() {
  
      if (this.position_.z <= 0) {
        this.position_.z = (Math.round(this.position_.z * 10) / 10) + this.leftMovementSpeed;
        if (this.position_.z <= -3) {
          this.position_.z = -3
          this.keys_.left = false;
        }

      } else if (this.position_.z <= 3) {
        this.position_.z = (Math.round(this.position_.z * 10) / 10) + this.leftMovementSpeed;
        if (this.position_.z == 0) {
          this.keys_.left = false;
        }
      } else if (this.position_.z == -3) {
        return;
      }
      var baileyWoo = document.getElementById("bailey-woo");
      baileyWoo.play();
    }


    SwipeRight() {
      if (this.position_.z >= 0) {
        this.position_.z = (Math.round(this.position_.z * 10) / 10) + this.rightMovementSpeed;
        if (this.position_.z >= 3) {
          this.position_.z = 3
          this.keys_.right = false;
        }
      } else if (this.position_.z >= -3) {
        this.position_.z = (Math.round(this.position_.z * 10) / 10) + this.rightMovementSpeed;
        if (this.position_.z == 0) {
          this.keys_.right = false;
        }
      } else if (this.position_.z == 3) {
        return;
      }
      var baileyWoo = document.getElementById("bailey-woo");
      baileyWoo.play();
    }


    SwipeUp(timeElapsed) {
      if (this.position_.y == 0.0) {
        this.velocity_ = 30;
        this.inAir_ = true;
        var baileyYay = document.getElementById("bailey-yay");
        baileyYay.play();
      }
      if (this.inAir_) {
        const acceleration = -75 * timeElapsed;
        this.position_.y += timeElapsed * (this.velocity_ + acceleration * 0.5);
        this.position_.y = Math.max(this.position_.y, 0.0);
        this.velocity_ += acceleration;
        this.velocity_ = Math.max(this.velocity_, -100);
      }
    }

    SwipeDown(timeElapsed) {
      if (this.position_.y == 0.0) {
        this.velocity_ = 10;
        this.sliding_ = true;
      }
      if (this.sliding_) {
        const acceleration = -25 * timeElapsed;
        this.position_.y -= timeElapsed * (this.velocity_ + acceleration * 0.5);
        this.position_.y = Math.min(this.position_.y, 0.0);
        this.position_.y = Math.max(this.position_.y, -1.0);
        this.velocity_ += acceleration;
        this.velocity_ = Math.max(this.velocity_, -100);
      }
    }


    Update(timeElapsed) {
      //player movement with keyboard controls
      if (this.keys_.space && this.position_.y == 0.0) {
        this.SwipeUp(timeElapsed)

      }
      if (this.keys_.down && this.position_.y == 0.0) {
        this.SwipeDown(timeElapsed)
      }

      if (!this.inAir_) {
        if (this.keys_.left) {
          this.UpdateAnimations_()

          if (!this.keys_.right) {
            this.SwipeLeft()
          }
        }
        if (this.keys_.right) {
          this.SwipeRight()

        }
      }

      //jump and slide calculation.
      if (this.inAir_) {
        const acceleration = -75 * timeElapsed;

        this.position_.y += timeElapsed * (this.velocity_ + acceleration * 0.5);
        this.position_.y = Math.max(this.position_.y, 0.0);

        this.velocity_ += acceleration;
        this.velocity_ = Math.max(this.velocity_, -100);
      }

      if (this.sliding_) {
        const acceleration = -25 * timeElapsed;

        this.position_.y -= timeElapsed * (this.velocity_ + acceleration * 0.5);
        this.position_.y = Math.min(this.position_.y, 0.0);
        this.position_.y = Math.max(this.position_.y, -1.0);

        this.velocity_ += acceleration;
        this.velocity_ = Math.max(this.velocity_, -100);
      }


      if (this.position_.y == 0.0) {
        this.inAir_ = false;

      }
      if (this.position_.y <= 0.0 && this.sliding_ == true) {
        if (this.position_.y == 0) {
          this.sliding_ = false
        }
      }

      if (this.mesh_) {
        this.mixer_.update(timeElapsed);
        this.mesh_.position.copy(this.position_);
        this.CheckCollisions_();

      }

      //update stamina
      this.UpdateStamina_(timeElapsed);

    }

    // Stamina
    UpdateStamina_(timeElapsed) {
      this.stamina_ -= timeElapsed * 5
      const staminaText = (Math.round(this.stamina_ * 10) / 10).toLocaleString(
        'en-US', { minimumIntegerDigits: 3, useGrouping: false });

      document.getElementById("stamina").style.width = staminaText + "%"
      if (this.stamina_ <= 0) {
        this.gameOver = true
      }
    }
  };

  return {
    Player: Player,
  };
})();