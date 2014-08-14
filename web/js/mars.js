/*jshint strict: false, onevar: false, indent:4 */
/*global exports: true, require: true, THREE: true, Stats: true, requestAnimationFrame: true */

var Arena = require('threearena').Arena;
// var Robot = require('./robot');

var stemkoski = require('threearena/lib/particles/stemkoski_ParticleEngine');

var Mars = function (options) {

  var self = this;

  self.arena = new Arena({
    container: document.getElementById('game-container'),

    quality: 1,

    navmeshType: 'tiled',

    fogNear: 20,
    fogFar: 430,
    
    lightAmbientColor: '#525252',
    lightPointColor: '#363ec0',
    lightPointIntensity: 4,
    lightPointDistance: 210,
    lightPointAngle: 0.5,
    lightPointOffset: {
      x: -20,
      y:  20,
      z:  20
    },

    lightDirectionalColor: '#d96839',
    lightDirectionalIntensity: 4,
    lightDirectionalDistance: 1000,

    crowdMinDestinationChange: 0.05,
    crowdMinSpeedAnimation: 0.05,
    crowdMinSpeedRotation: 0.5,

  });

  self.arena.setTerrain('/mars-gamedata/maps/' + options.map + '.obj', {
    minimap: '/mars-gamedata/maps/simplest/minimap.png',

    cellSize: 0.3,          // nav mesh cell size (.8 > 2)
    cellHeight: 0.08,        // nav mesh cell height (.5 > 1)
    agentHeight: 1.8,       // character height (1.2 => 2)
    agentRadius: 0.4,       // character radius (.5 > 2)
    agentMaxClimb: 2.0,     // max units character can jump (1 > 5)
    agentMaxSlope: 30.0,    // max degre character can climb (20 > 40)

    diffuse: 0xffee00,
    specular: 0,
    shininess: 0,
    shading: THREE.FlatShading
  });

  function initSkybox () {
    var urls = [
      '0004.png',
      '0002.png',
      '0006.png',
      '0005.png',
      '0001.png',
      '0003.png'
    ];

    var cubemap = THREE.ImageUtils.loadTextureCube(urls); // load textures
    cubemap.format = THREE.RGBFormat;

    var shader = THREE.ShaderLib.cube; // init cube shader from built-in lib
    shader.uniforms.tCube.value = cubemap; // apply textures to shader

    // create shader material
    var skyBoxMaterial = new THREE.ShaderMaterial( {
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: shader.uniforms,
      depthWrite: false,
      side: THREE.BackSide
    });

    // create skybox mesh
    var skybox = new THREE.Mesh(
      new THREE.CubeGeometry(1000, 1000, 1000),
      skyBoxMaterial
    );

    self.arena.scene.add(skybox);
  }

  /* */
  self.arena.addCharacter(function(done){
    var robot, loader = new THREE.JSONLoader();
    loader.load('/mars-gamedata/models/spidbot.js', function (geometry, materials) {

      function ensureLoop ( animation ) {
        for ( var i = 0; i < animation.hierarchy.length; i ++ ) {
          var bone = animation.hierarchy[ i ];
          var first = bone.keys[ 0 ];
          var last = bone.keys[ bone.keys.length - 1 ];
          last.pos = first.pos;
          last.rot = first.rot;
          last.scl = first.scl;
        }
      }

      function ensureSkinning ( materials ) {
        for ( var i = 0; i < materials.length; i ++ ) {
          var m = materials[ i ];
          m.skinning = true;
          m.morphTargets = true;
          m.wrapAround = true;
        }
      }

      var character = new THREE.SkinnedMesh(geometry, new THREE.MeshFaceMaterial(materials));

      ensureLoop( character.geometry.animation );
      ensureSkinning( character.material.materials );

      /*
      // add animation data to the animation handler
      THREE.AnimationHandler.add(character.geometry.animation);

      // create animation
      character.walkAnimation = new THREE.Animation(
        character,
        'Armature.001Action',
        THREE.AnimationHandler.CATMULLROM
      );
      */

      character.walkAnimation = new THREE.Animation(character, geometry.animation);

      self.arena.on('update', function (arena) {
        THREE.AnimationHandler.update(arena.delta);
          var time = Date.now() * 0.01;
          character.morphTargetInfluences[ 1 ] = 2 + Math.sin( time ) / 2;
          character.morphTargetInfluences[ 2 ] = 2 + Math.sin( time ) / 2;
          // character.morphTargetInfluences[ 3 ] = Math.sin( time ) / 10 - 0.06;
          // character.morphTargetInfluences[ 4 ] = ( 0.8 + Math.sin( 3 * time ) ) / 2;
          // character.morphTargetInfluences[ 5 ] = ( 0.8 + Math.cos( 5 * time ) ) / 2;
          // character.morphTargetInfluences[ 5 ] = ( 1 + Math.sin( 2 * time ) ) / 2;
          // character.morphTargetInfluences[ 6 ] = ( 1 + Math.cos( 4 * time ) ) / 2;
          // character.morphTargetInfluences[ 4 ] = ( 1 + Math.sin( 2 * time ) ) / 2;
      });

      character.setAnimation = function () {
        character.walkAnimation.play();
      };

      var placableObject1 = function(){
        return new THREE.Mesh(
          new THREE.BoxGeometry(10, 10, 10),
          new THREE.MeshBasicMaterial({ color: 'blue' })
        );
      };

      var placableObject2;
      var loader = new THREE.JSONLoader();
      loader.load('/mars-gamedata/models/biodome.js', function (object, materials) {
        for (var i = 0; i < materials.length; i++) {
          materials[i].shading = THREE.FlatShading;
        }
        placableObject2 = new THREE.Mesh(object, new THREE.MeshFaceMaterial(materials));
        placableObject2.scale.set(10, 10, 10);

        robot.learnSpell(Arena.Spells.PlaceObject, {
          object:placableObject2,
          maxRange: 50,
          events: {
            start: function (target) {
              var aura = new stemkoski.ParticleEngine();
              aura.setValues({
                positionStyle  : stemkoski.Type.CUBE,
                positionBase   : new THREE.Vector3( 0, 1, 0 ),
                positionSpread : new THREE.Vector3( 1, 2, 1 ),

                velocityStyle  : stemkoski.Type.CUBE,
                velocityBase   : new THREE.Vector3( 0, 1, 0 ),
                velocitySpread : new THREE.Vector3( 3, 2, 3 ), 

                angleBase               : 10,
                angleSpread             : 720,
                angleVelocityBase       : 30,
                angleVelocitySpread     : 2,
                
                particleTexture : THREE.ImageUtils.loadTexture( '/gamedata/textures/waterparticle.png' ),

                sizeBase   : 5.0,
                sizeSpread : 2.0,
                opacityTween : new stemkoski.Tween([0.0, 1.0, 1.1, 2.0, 2.1, 3.0, 3.1, 4.0, 4.1, 5.0, 5.1, 6.0, 6.1],
                                         [0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 1.0, 1.0, 0.2] ),       
                colorBase   : new THREE.Vector3(0.8, 0.8, 1), // H,S,L
                colorSpread : new THREE.Vector3(0.1, 0.0, 0),

                particlesPerSecond : 50,
                particleDeathAge   : 6.1,   
                emitterDeathAge    : Infinity
              });
              aura.initialize();
              self.arena.scene.add(aura.particleMesh);
              // aura.particleMesh.scale.set(0.1, 0.1, 0.1);
              aura.particleMesh.position.copy(target.position);
              self.arena.on('update', function(game){
                aura.update(game.delta);
              });
            }
          }
        });  
      });

      robot = new Arena.Characters.Dummy({
        object: character,
        radius: 1,
        maxSpeed: 5,
        maxAcceleration: 5.0,
        onLoad: function(){
          // this.scale.set(0.2, 0.2, 0.2);
          self.arena.asPlayer(this);
          done(this);
        }
      });
    });
  });
  /* */

  self.arena.on('set:terrain', function(){

    self.arena.init(function(arena){
      arena.run();
    });
  });

};


window.Mars = Mars;