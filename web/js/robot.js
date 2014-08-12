/*jshint strict: false, onevar: false, indent:4 */
/*global exports: true, require: true, THREE: true, Stats: true, requestAnimationFrame: true */

var _ = require('threearena/lodash');
var inherits = require('threearena/inherits');
var Character = require('threearena/character');

exports = Robot;

function Robot (options) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    radius: 3.0,

    maxSpeed: 20,
    maxAcceleration: 10.0,
    separationWeight: 5.0,

    name: 'Robot',
    image: '/gamedata/models/monster/portrait.gif',

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  self.character = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.8),
    new THREE.MeshBasicMaterial({
      color: '#FFEEDD'
    })
  );

  self.character.meshBody = self.character;

  self.character.position.y = 2.5;
  self.character.controls = {};
  self.character.update = self.character.setAnimation = function() { };

  self.add( self.character );

  if (options.onLoad) { options.onLoad.apply(self); }
}

inherits(Robot, Character);

