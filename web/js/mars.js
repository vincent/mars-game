/*jshint strict: false, onevar: false, indent:4 */
/*global exports: true, require: true, THREE: true, Stats: true, requestAnimationFrame: true */

var Arena = require('threearena').Arena;
// var Robot = require('./robot');

var Mars = function (options) {

  var self = this;

  self.arena = new Arena({
    container: document.getElementById('game-container'),

    quality: 1,

    navmeshType: 'tiled',

    fogNear: 20,
    fogFar: 430,

    lightAmbientColor: '#000',
    lightPointColor: '#363ec0',
    lightPointIntensity: 4,
    lightPointDistance: 210,
    lightPointAngle: 0.5,

    lightDirectionalColor: '#d96839',
    lightDirectionalIntensity: 3.5,
    lightDirectionalDistance: 1000,

    crowdMinDestinationChange: 0.05,
    crowdMinSpeedAnimation: 0.05,
    crowdMinSpeedRotation: 0.5,

  });

  self.arena.setTerrain('/gamedata/maps/' + options.map + '.obj', {
    minimap: '/gamedata/maps/simplest/minimap.png',

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
    loader.load('/gamedata/models/spidbot.js', function (geometry, materials) {

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

      robot = new Arena.Characters.Dummy({
        object: character,
        radius: 1,
        maxSpeed: 5,
        maxAcceleration: 5.0,
        onLoad: function(){
          // this.scale.set(0.2, 0.2, 0.2);
          this.learnSpell(Arena.Spells.PlaceObject, { object:placableObject1 });
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