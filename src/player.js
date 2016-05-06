define([
    'phaser'
], function (Phaser) { 
    'use strict';

    var cursors;
    var jumpTimer = 0;

    function Player(game) {
        console.log('Loading Player module');
        this.game = game;
        // Extend Sprite
        Phaser.Sprite.call(this, this.game, 100, 100, 'player');
        // add to stage
        game.add.existing(this);
        // set anchor to middle, bottom
        this.anchor.setTo(0.5, 1);

        this.addAnimations();
        this.createStateMachine();
        this.setProperties();

        // physics and camera stuff
        this.game.physics.enable(this);
        this.body.collideWorldBounds = true;
        // follow the player with lerp
        this.game.camera.follow(this, undefined, 0.1, 0.1);

        // make physics body width smaller so sprite doesn't hang off platforms
        // this means the sprite kinda phases thru wall bounds - may be a better way to handle this
        this.body.setSize(this.width * 0.5, this.height);

        cursors = this.game.input.keyboard.createCursorKeys();
    };

    // Extend Sprite
    Player.prototype = Object.create(Phaser.Sprite.prototype);
    Player.prototype.constructor = Player;
    
    Player.prototype.update = function () {
        // default x velocity to 0 = instant stop
        this.body.velocity.x = 0;

        this.handleInput();
        this.handleAnimation();
    };

    Player.prototype.setProperties = function () {
        this.jumpForce = 220;
        this.runForce = 200;
    };

    Player.prototype.handleInput = function () {
        // set states manually per control - if this gets more complicated may need a more
        // robust state machine implementation
        if (cursors.up.isDown) {
            if (this.state.onGround && !this.state.isJumping) {
                this.body.velocity.y = -this.jumpForce;
                this.state.isJumping = true;
                this.state.longJumpExpired = false;
                this.state.onGround = false;
            } else {
                // long press = longer jump
                if (!this.state.longJumpExpired) {
                    jumpTimer += this.game.time.physicsElapsed;
                    if (jumpTimer > 1) {
                        // long jump timer limit, reset timer and set long jump expired
                        jumpTimer = 0;
                        this.state.longJumpExpired = true;
                    } else {
                        this.body.velocity.y = -this.jumpForce;
                    }
                }                
            }
        } else {
            if (this.state.onGround) {
                if (this.state.isJumping) {
                    // we were jumping, now we're on the ground, reset state
                    jumpTimer = 0;
                    this.state.longJumpExpired = false;
                    this.state.isJumping = false;
                }                
            } else {
                // we're in the air and jump isn't pressed - disable long jump
                // (this could be tweaked for eg double jump)
                this.state.longJumpExpired = true;
            }
        }

        if (cursors.down.isDown) {
            if (this.state.onGround) {
                this.state.isDucking = true;
            }            
        } else {
            this.state.isDucking = false;
        }

        if (cursors.left.isDown && !this.state.isDucking) {
            this.body.velocity.x = -this.runForce;
            this.state.movingLeft = true;
            this.state.movingRight = false;
        } else if (cursors.right.isDown && !this.state.isDucking) {
            this.body.velocity.x = this.runForce;
            this.state.movingRight = true;
            this.state.movingLeft = false;
        } else {
            this.state.movingRight = false;
            this.state.movingLeft = false;
        }

        if (this.body.onFloor()) {
            this.state.onGround = true;
        } else {
            this.state.onGround = false;
            this.state.isJumping = true;
        }
    };

    Player.prototype.handleAnimation = function () {
        if (this.state.onGround) {
            if (this.state.movingLeft) {
                this.animations.play('walk');
                this.scale.setTo(-1, 1);
            } else if (this.state.movingRight) {
                this.animations.play('walk');
                this.scale.setTo(1, 1);
            } else if (this.state.isDucking) {
                this.animations.play('duck');
            } else {
                this.animations.play('idle');
            }
        } else {
            this.animations.play('jump');
            if (this.state.movingLeft) {
                this.scale.setTo(-1, 1);
            } else if (this.state.movingRight) {
                this.scale.setTo(1, 1);
            } 
        }
    };

    Player.prototype.addAnimations = function () {
        this.animations.add('walk', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 30);
        this.animations.add('duck', [11]);
        this.animations.add('idle', [12]);
        this.animations.add('hurt', [13]);
        this.animations.add('jump', [14]);
    };

    Player.prototype.createStateMachine = function () {
        this.state = {
            onGround: false,
            isJumping: false,
            longJumpExpired: false,
            isDucking: false,
            movingLeft: false,
            movingRight: false
        }
    };

    return Player;
});