var config =
{
    type: Phaser.AUTO,
    width: 800, height: 600,
    physics:
    {
        default: 'arcade',
        arcade:
        {
            gravity: { y: 800 },
            debug: true
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
    // load assets
    this.load.image('background', 'assets/background.png');
    this.load.image('tileset', 'assets/tileset.png')
    this.load.spritesheet('perso','assets/chara.png',
                { frameWidth: 32, frameHeight: 64 });
    this.load.tilemapTiledJSON("map", "assets/leveld.json");
}

var platforms;
var player;
var cursors;
var gameOver = false;
var controller = false;
var speed = 280;

function create()
{
    this.add.image(800, 800, 'background');

    // import from tiled
    const levelMap = this.add.tilemap("map");
    const tileset = levelMap.addTilesetImage(
        "tilset",
        "tileset"
    );
    const platforms = levelMap.createLayer(
        "platforms",
        tileset
    );

    // add player
    player = this.physics.add.sprite(25, 1260, 'perso');
    player.onWall = false;
    player.canJump = true;

    // collisions
    this.physics.add.collider(player, platforms);
    platforms.setCollisionByProperty({ isSolid: true });
    // platforms.setCollisionByProperty({ isSpike: true });
    player.setCollideWorldBounds(true);

    // set world bounds
    this.physics.world.setBounds(0, 0, 1600, 1600);
    // configure camera bounds
    this.cameras.main.setBounds(0, 0, 1600, 1600);
    // camlera follows player
    this.cameras.main.startFollow(player);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.setRoundPixels(false);

    // player animations
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

    cursors = this.input.keyboard.createCursorKeys();

    this.input.gamepad.once('connected', function (pad)
    {
        controller = pad;
    })

}

function update()
{
    if (gameOver){return;}

    // handle keyboard events
    if (cursors.left.isDown || controller.left)
    {
        player.setVelocityX(-speed);
        player.anims.play('left', true);
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(speed);
        player.anims.play('right', true);
    }
    else
    {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.canJump && (player.body.blocked.down || player.onWall))
    {
        player.setVelocityY(-300);
        if (player.onWall)
        {
            // player.setVelocityX(-300);
            player.body.velocity.x *= -5
        }
        player.canJump = false;
        player.onWall = false;
    }
    if (player.body.blocked.down)
    {
        player.canJump = true;
        player.onWall = false;
    }
    else if (player.body.blocked.right || player.body.blocked.left)
    {
        player.onWall = true;
        // console.log(player.body.velocity)
    }
}
