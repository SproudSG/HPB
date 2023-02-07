import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/FBXLoader.js';


export const water = (() => {

  class DrinksObject {
    constructor(params) {
      this.position = new THREE.Vector3(0, 0, 0);
      this.quaternion = new THREE.Quaternion();
      this.scale = 1.0;
      this.drinks_ = []
      this.collider = new THREE.Box3();
      this.params_ = params;
      this.LoadModel_();

    }

    //load the drinks
    LoadModel_() {

      const loader = new FBXLoader();
      loader.load('./resources/Creatures/FBX/fly.fbx', (fbx) => {
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

  class DrinksManager {
    constructor(params) {
      this.objects_ = [];
      this.unused_ = [];
      this.speed_ = 12;
      this.params_ = params;
      this.counter_ = 0;
      this.spawn_ = 0;
    }

    GetColliders() {
      return this.objects_;
    }

    ToggleVisible(){
      this.objects_[0].mesh.visible = false;
    }

    SpawnObj_(position) {
      let obj = null;
      if (this.counter_ == 0) {
        this.counter_ = 1;
        if (this.unused_.length > 0) {
          obj = this.unused_.pop();
          obj.mesh.visible = true;
        } else {
          obj = new DrinksObject(this.params_);
        }

        const MAX_DISTANCE_X = 100;

        // code below to set where the object is facing
        /*
        obj.quaternion.setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2.0);
          */


        obj.position.x = 50 + Math.random() * MAX_DISTANCE_X //+ offset;
        obj.position.z = position
        obj.scale = 0.01;

        this.objects_.push(obj);
      }

    }


    Update(timeElapsed) {
      this.SpawnObj_(this.params_.position)
      this.UpdateColliders_(timeElapsed);

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

  };

  return {
    DrinksManager: DrinksManager,
  };
})();