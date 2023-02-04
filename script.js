var config =
{
    type: Phaser.AUTO,
    width: 1280, height: 720,
    physics:
    {
        default: 'arcade',
        arcade:
        {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene:
    {
        preload: preload,
        create: create,
        update: update
    },
    input:
    {
        gamepad: true
    }
};
new Phaser.Game(config);

function preload()
{
    this.load.image('background', 'assets/background.png');
    this.load.image('parallax1', 'assets/parallax1.png');
    this.load.image('parallax2', 'assets/parallax2.png');
    this.load.image('tileset', 'assets/tileset.png')
    this.load.image('water_tile', 'assets/water.png')
    this.load.spritesheet('perso','assets/chara.png',
                { frameWidth: 32, frameHeight: 64 });
    this.load.spritesheet('bat','assets/bat.png',
                { frameWidth: 28, frameHeight: 28 });
    this.load.spritesheet('lifebar','assets/lifebar.png',
                { frameWidth: 144, frameHeight: 32 });
    this.load.tilemapTiledJSON("map", "assets/level.json");
}


var platforms;
var player;
var cursors;
var game_over = false;
var controller = false;
var can_wall_jump = true;
var can_jump = true;
var input_locked = false;
var physics;

const XSPEED = 200;
const YSPEED = 310;
const BAT1_X = 432;
const BAT1_Y = 1364;
const TILE_SIZE = 32;
const MAP_SIZE = 1600;

function create()
{
    physics = this.physics;

    this.add.image(MAP_SIZE / 2, MAP_SIZE / 2, 'background');
    parallax2 = this.add.image(MAP_SIZE / 2, MAP_SIZE / 2, 'parallax2');
    parallax1 = this.add.image(MAP_SIZE / 2, MAP_SIZE / 2, 'parallax1');

    const level_map = this.add.tilemap("map");
    const tileset = level_map.addTilesetImage(
        "tilset",
        "tileset"
    );
    const layer_platforms = level_map.createLayer(
        "platforms",
        tileset
    );
    const layer_spikes = level_map.createLayer(
        "spikes",
        tileset
    );
    // const layer_water = level_map.createLayer(
    //     "water",
    //     tileset
    // );

    player = physics.add.sprite(25, 1260, 'perso');
    player.setSize(24,58).setOffset(4,6);
    player.can_get_hit = true;
    player.can_jump = true;
    player.can_wall_jump = true;
    player.hp = 5;

    bat1 = physics.add.sprite(BAT1_X, BAT1_Y, 'bat');
    bat1.body.allowGravity = false;
    bat1.setVelocityY(-100);
    bat1.alive = true;
    bat1.can_get_hit = true;

    lifebar = physics.add.sprite(240, 100, 'lifebar');
    lifebar.body.allowGravity = false;
    lifebar.setScrollFactor(0,0);

    layer_platforms.setCollisionByProperty({ is_solid: true });
    layer_spikes.setCollisionByProperty({ is_spike: true });
    // layer_water.setCollisionByProperty({ is_water: true });
    player.setCollideWorldBounds(true);

    physics.add.collider(player, layer_platforms);
    physics.add.collider(player, layer_spikes, damage_player, null, this);
    // physics.add.overlap(player, layer_water, hit_water, null, this);
    physics.add.overlap(player, bat1, hit_bat, null, this);

    physics.world.setBounds(0, 0, MAP_SIZE, MAP_SIZE);
    this.cameras.main.setBounds(0, 0, MAP_SIZE, MAP_SIZE);

    this.cameras.main.startFollow(player);
    this.cameras.main.setZoom(1.25);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('perso', {start:11,end:20}),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'perso', frame: 10 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('perso', {start:0,end:9}),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'wing',
        frames: this.anims.generateFrameNumbers('bat', {start:0,end:3}),
        frameRate: 10,
        repeat: -1
    });
    bat1.anims.play('wing', true);

    this.anims.create({
        key: 'life5',
        frames: [ { key: 'lifebar', frame: 0 } ],
        frameRate: 1,
        repeat: 0
    });
    this.anims.create({
        key: 'life4',
        frames: [ { key: 'lifebar', frame: 1 } ],
        frameRate: 1,
        repeat: 0
    });
    this.anims.create({
        key: 'life3',
        frames: [ { key: 'lifebar', frame: 2 } ],
        frameRate: 1,
        repeat: 0
    });
    this.anims.create({
        key: 'life2',
        frames: [ { key: 'lifebar', frame: 3 } ],
        frameRate: 1,
        repeat: 0
    });
    this.anims.create({
        key: 'life1',
        frames: [ { key: 'lifebar', frame: 4 } ],
        frameRate: 1,
        repeat: 0
    });
    this.anims.create({
        key: 'life0',
        frames: [ { key: 'lifebar', frame: 5 } ],
        frameRate: 1,
        repeat: 0
    });
    lifebar.anims.play('life5', true);

    cursors = this.input.keyboard.createCursorKeys();

    this.input.gamepad.once('connected', function (pad)
    {
        controller = pad;
    })
}

function update()
{
    if (game_over){return;}

    xcamera = this.cameras.main.worldView.x;
    ycamera = this.cameras.main.worldView.y;

    parallax1.x = (((MAP_SIZE / 2) * (xcamera / MAP_SIZE) - 200) * 0.04) + (MAP_SIZE / 2);
    parallax1.y = (((MAP_SIZE / 2) * (ycamera / MAP_SIZE) - 200) * 0.04) + (MAP_SIZE / 2);
    parallax2.x = (((MAP_SIZE / 2) * (xcamera / MAP_SIZE) - 200) * 0.08) + (MAP_SIZE / 2);
    parallax2.y = (((MAP_SIZE / 2) * (ycamera / MAP_SIZE) - 200) * 0.08) + (MAP_SIZE / 2);

    /*
    if ((player.x > (TILE_SIZE*27) && player.x < (TILE_SIZE*31)) &&
        (player.y > (TILE_SIZE*34) && player.y < (TILE_SIZE*38)))
        // overlap won't work
        // corresponds to coords of the water tiles
    {
        hit_water();
        console.log("in water")
        // still doesn't work
    }
    else
    {
        xspeed = 200;
        yspeed = 310;
    }
    */

    if (cursors.left.isDown || controller.left)
    {
        player.setVelocityX(-XSPEED);
        player.anims.play('left', true);
    }
    else if (cursors.right.isDown || controller.right)
    {
        player.setVelocityX(XSPEED);
        player.anims.play('right', true);
    }
    else
    {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (player.can_jump && (cursors.up.isDown || controller.A))
    {
        player.can_jump = false;
        player.setVelocityY(-YSPEED);
    }

    if (player.can_wall_jump && (cursors.up.isDown || controller.A) && player.body.blocked.right)
        wall_jump("left");

    if (player.can_wall_jump && (cursors.up.isDown || controller.A) && player.body.blocked.left)
        wall_jump("right");

    if (player.body.blocked.down)
        player.can_jump = true;


    if (bat1.y > BAT1_Y + 100)
        bat1.setVelocityY(-100);
    if (bat1.y < BAT1_Y)
        bat1.setVelocityY(100);
}


function lock_input()
{
    input_locked = false;
}

function cd_wall_jump()
{
    player.can_wall_jump = true;
}

function cd_can_get_hit()
{
    player.can_get_hit = true;
    bat1.can_get_hit = true;
    if (!game_over)
        player.setTint(0xffffff);
}

function wall_jump(side)
{
    if (side == "left")
        direction = -1;
    else if (side == "right")
        direction = 1;

    player.can_wall_jump = false;
    input_locked = true;

    setTimeout(cd_wall_jump, 500);
    setTimeout(lock_input, 200);

    player.setVelocityY(-YSPEED);
    player.setVelocityX(XSPEED * direction);
}

function kill_player()
{
    player.anims.play('turn');
    game_over = true;
    player.setTint(0xff0000);
    physics.pause();
}

function hit_bat()
{
    if (player.x < bat1.x && bat1.alive && bat1.can_get_hit)
    {
        bat1.alive = false;

        bat1.setTint(0xff0000);
        this.tweens.add({
            targets: bat1,
            alpha: 0,
            duration: 2000,
            ease: 'Power2'
        }, this);
    }
    else if (bat1.alive)
    {
        damage_player();
    }
}

function damage_player()
{
    if (player.can_get_hit)
    {
        player.can_get_hit = false;
        bat1.can_get_hit = false;
        player.setTint(0xff0000);
        player.hp -= 1;
        if (player.hp <= 0)
            kill_player();
        setTimeout(cd_can_get_hit, 1000)
    }

    switch (player.hp)
    {
        case 5:
            lifebar.anims.play('life5', true);
            break;
        case 4:
            lifebar.anims.play('life4', true);
            break;
        case 3:
            lifebar.anims.play('life3', true);
            break;
        case 2:
            lifebar.anims.play('life2', true);
            break;
        case 1:
            lifebar.anims.play('life1', true);
            break;
        case 0:
            lifebar.anims.play('life0', true);
            break;
    }
}

function hit_water()
{
    XSPEED = 100;
    YSPEED = 300;
}
