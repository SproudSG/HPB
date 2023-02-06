import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/FBXLoader.js';


export const drinks = (() => {




  class DrinksObject {
    constructor(params) {
      this.position = new THREE.Vector3(0, -2, 0);
      this.quaternion = new THREE.Quaternion();
      this.scale = 1.0;
      this.collider = new THREE.Box3();

      this.params_ = params;
      this.LoadModel_();

    }

    shuffleArray(array) {
      let currentIndex = array.length, temporaryValue, randomIndex;

      while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    }

    LoadModel_() {
      const texLoader = new THREE.TextureLoader();
      //const texture = texLoader.load('./resources/DesertPack/Blend/Textures/Ground.png');
      //texture.encoding = THREE.sRGBEncoding;

      const drinks = [
        "coke.fbx"
      ];


      const randomizedDrinks = this.shuffleArray(drinks)

      const randomIndex = Math.floor(Math.random() * drinks.length);
      const fileName = drinks[randomIndex];

      const fbxLoader = new FBXLoader();
      const objects = [];
      fbxLoader.setPath('./resources/Creatures/FBX/');

      const loadModels = (model1, model2, model3) => {
        fbxLoader.load(model1, object => {
          objects.push(object);
          object.scale.set(0.01, 0.01, 0.01);
          this.params_.scene.add(object);
        });

        fbxLoader.load(model2, object => {
          objects.push(object);
          object.scale.set(0.01, 0.01, 0.01);

          this.params_.scene.add(object);
        });

        fbxLoader.load(model3, object => {
          objects.push(object);
          object.scale.set(0.01, 0.01, 0.01);

          this.params_.scene.add(object);
        });
      };

      loadModels(drinks[0], drinks[1], drinks[2]);


      const loader = new FBXLoader();
      loader.setPath('./resources/Creatures/FBX/');
      loader.load(drinks[0], (fbx) => {
        this.mesh = fbx;
        this.params_.scene.add(this.mesh);

      });

    }

    UpdateCollider_() {
      this.collider.setFromObject(this.mesh);
    }

    Update(timeElapsed) {
      if (!this.mesh) {
        return;
      }
      this.mesh.position.copy(this.position);
      this.mesh.quaternion.copy(this.quaternion);
      this.mesh.scale.setScalar(this.scale);
      this.UpdateCollider_();
    }
  }

  class DrinksManager {
    constructor(params) {
      this.objects_ = [];
      this.unused_ = [];
      this.speed_ = 52;
      this.params_ = params;
      this.progress_ = 0.0;
      this.stamina_ = 100;
      this.counter_ = 0;
      this.spawn_ = 0;
      this.separationDistance_ = SEPARATION_DISTANCE;
    }

    GetColliders() {
      return this.objects_;
    }

    LastObjectPosition_() {
      if (this.objects_.length == 0) {
        return SEPARATION_DISTANCE;
      }

      return this.objects_[this.objects_.length - 1].position.x;

    }

    SpawnObj_(scale, offset) {
      let obj = null;

      if (this.unused_.length > 0) {
        obj = this.unused_.pop();
        obj.mesh.visible = true;
      } else {
        obj = new DrinksObject(this.params_);
      }
      //obj = new WorldObject(this.params_);
      const MAX_DISTANCE_X = 100;
      const MAX_DISTANCE_Z = 6;

      // code below to set where the object is facing
      /*
      obj.quaternion.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2.0);
        */
      

      obj.position.x = START_POS + Math.random() * MAX_DISTANCE_X //+ offset;
      obj.position.z = START_POS2 + Math.random() * MAX_DISTANCE_Z// + offset;
      obj.scale = scale * 0.01;
      this.objects_.push(obj);
    }

    // SpawnCluster_() {
    //   const scaleIndex = math.rand_int(0, 1);
    //   const scales = [1, 0.5];
    //   const ranges = [1, 2];
    //   const scale = scales[scaleIndex];
    //   //const numObjects = math.rand_int(1, ranges[scaleIndex]);
    //   const numObjects = 3;

    //   for (let i = 0; i < numObjects; ++i) {
    //     const offset = i * 1 * scale;
    //     this.SpawnObj_(1, offset);
    //   }
    // }

    MaybeSpawn_() {
      const closest = this.LastObjectPosition_();
      if (Math.abs(START_POS - closest) > this.separationDistance_) {
        this.SpawnObj_(1, 1);
        this.separationDistance_ = math.rand_range(SEPARATION_DISTANCE, SEPARATION_DISTANCE * 1.5);
      }
    }

    Update(timeElapsed) {
      this.MaybeSpawn_();
      this.UpdateColliders_(timeElapsed);
      this.UpdateStamina_(timeElapsed);
      this.UpdateProgression_(timeElapsed);
    }

    UpdateColliders_(timeElapsed) {
      const invisible = [];
      const visible = [];

      for (let obj of this.objects_) {
        obj.position.x -= timeElapsed * this.speed_;

        if (obj.position.x < -20) {
          invisible.push(obj);
          obj.mesh.visible = false;
        } else {
          visible.push(obj);
        }

        obj.Update(timeElapsed);
      }

      this.objects_ = visible;
      this.unused_.push(...invisible);
    }

    //Progression + Stamina
    UpdateProgression_(timeElapsed) {
      this.progress_ += timeElapsed * 10.0;

      const scoreText = (Math.round((this.progress_ * 10) / 10)).toLocaleString(
        'en-US', { minimumIntegerDigits: 5, useGrouping: false }) / 5;
      document.getElementById('runner').style.left = scoreText * 4.1 + 'px';

      if (this.progress_ >= 500) {
        document.dispatchEvent(new CustomEvent('score-over'));
      }
    }

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
    DrinksManager: DrinksManager,
  };
})();