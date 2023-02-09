import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

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
      this.mixer = null;
      this.actions = [];
    }

    // load the monster
    LoadModel_() {

      const loader = new FBXLoader();
      loader.load('./resources/Creatures/FBX/monster.fbx', (fbx) => {
        this.mesh = fbx;

        //sets the texture
        fbx.traverse((child) => {
          if (child.isMesh) {

            child.material.map = new THREE.TextureLoader().load('./resources/Creatures/textures/monster_albedo.jpg');

          }
        });

        //add model to the scene
        this.params_.scene.add(this.mesh);

        // Extract the animation clips from the fbx file
        const animations = fbx.animations;
        if (animations && animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.mesh);
          for (let i = 0; i < animations.length; i++) {
            const animation = animations[i];
            const action = this.mixer.clipAction(animation);
            this.actions.push(action);
          }
        }
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

      // play animation 
      if (this.mixer) {
        // Play the first animation in the list of actions
        if (this.actions.length > 0) {
          this.actions[0].play();
        }
        this.mixer.update(timeElapsed);
      }
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

      const progress = Math.round(this.spawn_)

      if (progress == 50 || progress == 200 || progress == 300 || progress == 400) {

        let obj = null;

        if (this.unused_.length > 0) {
          obj = this.unused_.pop();
          obj.mesh.visible = true;
        } else {
          obj = new ShoogaGliderObject(this.params_);
        }

        const MAX_DISTANCE_X = 100;
        const MAX_DISTANCE_Z = 1;

        // code below to set where the object is facing

        obj.quaternion.setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), -Math.PI / 2);


        //set shooga glider position abnd scale
        obj.position.x = START_POS + Math.random() * MAX_DISTANCE_X;
        obj.position.z = START_POS2 + Math.random() * MAX_DISTANCE_Z;
        obj.position.y = 4;
        obj.scale = 0.03;


        this.objects_.push(obj);

        //if more than one is generated, pop them so only one exists.
        if (this.objects_.length > 1) {
          while (this.objects_.length != 1) {
            this.objects_.pop();
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