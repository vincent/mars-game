/*jshint strict: false, onevar: false, indent:4 */
/*global exports: true, require: true, THREE: true, Stats: true, requestAnimationFrame: true */

var Recast       = require('recastjs');
var inherits     = require('inherits');
var EventEmitter = require('EventEmitter');

var Mars = function (options) {

    var self      = this;

    this.player   = options.player;
    this.agents   = {};

    this.scene    = new THREE.Scene();
    this.camera   = new THREE.OrthographicCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.terrain  = null;
    this.recast   = new Recast();

    document.body.appendChild(this.renderer.domElement);

    this.on('ready', function () {
        self.initPlayer();
        self.animate();
    });

    this.recast.vent.on('update', this.updateAgents);
};

inherits(Mars, EventEmitter);

Mars.prototype.initPlayer = function() {
    
    this.recast.addAgent();
};

Mars.prototype.initMap = function(map) {

    var self = this;
    var loader = new THREE.OBJMTLLoader();

    var objFile = 'maps/' + map + '.obj';
    var mtlFile = 'maps/' + map + '.mtl';

    loader.load(objFile, mtlFile, function(object){

        self.terrain = object;
        self.scene.add(object);

        this.recast.OBJLoader(objFile, this.recast.cb(function(){

            // offmeshs, ...

            self.recast.build();
            self.recast.initCrowd(1000, 1.0);    

            self.emit('ready');
        }));
    });
};

Mars.prototype.animate = function() {

    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
};

Mars.prototype.updateAgents = function(agents) {

    for (var i = 0; i < agents.length; i++) {
        var recastAgent = agents[i];
        var ourAgent    = this.agents[recastAgent.idx];

        var angle = Math.atan2(- recastAgent.velocity.z, recastAgent.velocity.x);
        if (Math.abs(ourAgent.rotation.y - angle) > 0) {
            ourAgent.rotation.y = angle;
        }
        
        ourAgent.position.set(
            recastAgent.position.x, 
            recastAgent.position.y, 
            recastAgent.position.z
        );
    }
};
