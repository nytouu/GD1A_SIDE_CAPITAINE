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
    this.load.image('tileset', 'assets/tileset.png')
    this.load.spritesheet('perso','assets/chara.png',
                { frameWidth: 32, frameHeight: 64 });
    this.load.spritesheet('bat','assets/bat.png',
                { frameWidth: 28, frameHeight: 28 });
    this.load.tilemapTiledJSON("map", "assets/leveld.json");
}


var platforms;
var player;
var cursors;
var game_over = false;
var controller = false;
var xspeed = 200;
var yspeed = 310;
var can_wall_jump = true;
var can_jump = true;
var input_locked = false;
var bat1_x = 432;
var bat1_y = 1300;


function lock_input()
{
    input_locked = false;
}

function cd_wall_jump()
{
    can_wall_jump = true;
}

function wall_jump(side)
{
    if (side == "left")
        x = -1;
    else if (side == "right")
        x = 1;

    can_wall_jump = false;
    input_locked = true;
    setTimeout(cd_wall_jump, 500);
    setTimeout(lock_input, 200);
    player.setVelocityY(-yspeed);
    player.setVelocityX(xspeed * x);
}

function kill_player()
{
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    game_over = true;
}

function hit_water()
{
    xspeed /= 2;
    yspeed /= 2;
}

function create()
{
    this.add.image(800, 800, 'background');

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
    const layer_water = level_map.createLayer(
        "water",
        tileset
    );

    hp_text=this.add.text(16,16,'sldkhfhdsfsfj',{fontSize:'32px',fill:'#000'});
    hp_text.setText("hiho");

    player = this.physics.add.sprite(25, 1260, 'perso');
    bat1 = this.physics.add.sprite(bat1_x, bat1_y, 'bat');
    bat1.body.allowGravity = false;

    layer_platforms.setCollisionByProperty({ is_solid: true });
    layer_spikes.setCollisionByProperty({ is_spike: true });
    layer_water.setCollisionByProperty({ is_water: true });
    player.setCollideWorldBounds(true);

    this.physics.add.collider(player, layer_platforms);
    // this.physics.add.collider(player, layer_spikes, hit_spike, null, this);
    this.physics.add.collider(player, layer_water, hit_water, null, this);
    this.physics.add.collider(player, bat1, kill_player, null, this);

    this.physics.world.setBounds(0, 0, 1600, 1600);
    this.cameras.main.setBounds(0, 0, 1600, 1600);

    this.cameras.main.startFollow(player);
    // this.cameras.main.setZoom();

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


    cursors = this.input.keyboard.createCursorKeys();

    this.input.gamepad.once('connected', function (pad)
    {
        controller = pad;
    })

}

function update()
{
    if (game_over){return;}

    if (cursors.left.isDown || controller.left)
    {
        player.setVelocityX(-xspeed);
        player.anims.play('left', true);
    }
    else if (cursors.right.isDown || controller.right)
    {
        player.setVelocityX(xspeed);
        player.anims.play('right', true);
    }
    else
    {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (can_jump && (cursors.up.isDown || controller.A))
    {
        can_jump = false;
        player.setVelocityY(-yspeed);
    }

    if (can_wall_jump && (cursors.up.isDown || controller.A) && player.body.blocked.right)
        wall_jump("left");

    if (can_wall_jump && (cursors.up.isDown || controller.A) && player.body.blocked.left)
        wall_jump("right");

    if (player.body.blocked.down)
        can_jump = true;

    if (bat1.y > bat1_y + 100)
        bat1.y -= 20;
    if (bat1.y < bat1_y)
        bat1.y += 20;
}
