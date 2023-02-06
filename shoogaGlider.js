import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import { math } from './math.js';

import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/FBXLoader.js';


export const shoogaGlider = (() => {

  const START_POS = 100;
  const START_POS2 = -4;

  class ShoogaGliderObject {
    constructor(params) {
      this.position = new THREE.Vector3(0, 0, 0);
      this.quaternion = new THREE.Quaternion();
      this.scale = 1.0;
      this.collider = new THREE.Box3();
      this.params_ = params;
      this.LoadModel_();

    }

    LoadModel_() {

      const loader = new FBXLoader();
      loader.load('./resources/Creatures/FBX/crow.fbx', (fbx) => {
        this.mesh = fbx;
        this.params_.scene.add(this.mesh);

      });

    }

    UpdateCollider_() {
      this.collider.setFromObject(this.mesh);
    }

    Update() {
      if (!this.mesh) {
        return;
      }
      this.mesh.position.copy(this.position);
      this.mesh.quaternion.copy(this.quaternion);
      this.mesh.scale.setScalar(this.scale);
      this.UpdateCollider_();
    }
  }

  class ShoogaGliderManager {
    constructor(params) {
      this.objects_ = [];
      this.unused_ = [];
      this.speed_ = 52;
      this.params_ = params;
      this.counter_ = 0;
      this.spawn_ = 0;
    }

    //used in player.js to check for player and monster collision
    GetColliders() {
      return this.objects_;
    }

    SpawnObj_(timeElapsed) {

      this.spawn_ += timeElapsed * 10.0;

      console.log()

      const progress = Math.round(this.spawn_)

      if (progress == 100 || progress == 200 || progress == 300 || progress == 400) {

        let obj = null;

        if (this.unused_.length > 0) {
          obj = this.unused_.pop();
          obj.mesh.visible = true;
        } else {
          obj = new ShoogaGliderObject(this.params_);
        }

        const MAX_DISTANCE_X = 100;
        const MAX_DISTANCE_Z = 6;

        // code below to set where the object is facing
        /*
        obj.quaternion.setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2.0);
          */


        obj.position.x = START_POS + Math.random() * MAX_DISTANCE_X;
        obj.position.z = START_POS2 + Math.random() * MAX_DISTANCE_Z;
        obj.position.y -= timeElapsed ;
        obj.scale = 0.02;
        this.objects_.push(obj);

        if (this.objects_.length > 1) {
          while (this.objects_.length != 1) {
            this.objects_.pop();
            console.log(this.objects_.length)
          }
        }
      }

    }


    Update(timeElapsed) {
      this.SpawnObj_(timeElapsed);
      this.UpdateColliders_(timeElapsed);
    }

    //sets the speed of the spawned monsters
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
  };

  return {
    ShoogaGliderManager: ShoogaGliderManager,
  };
})();