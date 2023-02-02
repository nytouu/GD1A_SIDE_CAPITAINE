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

    scoreText=this.add.text(16,16,'score: 0',{
        fontSize:'32px',
        fill:'#000',
    });
    // show score text
    stars = this.physics.add.group({
        key: 'star', repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });
    // every star bounces differently
    stars.children.iterate(function (child)
    {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });
    // colliders for stars
    this.physics.add.collider(stars, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);

    // colliders for bombs
    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);

    this.input.gamepad.once('connected', function (pad)
    {
        controller = pad;
    })

}

function collectStar(player, star)
{
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0)
    {
        stars.children.iterate(function (child)
        {
            child.enableBody(true, child.x, 0, true, true);
        });

        // spawn bomb on the side where the player is not there
        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) :
        Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;
    }
}

function hitBomb(player)
{
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;
}

function update()
{
    if (gameOver){return;}

    // handle keyboard events
    if (cursors.left.isDown || controller.left)
    {
        player.setVelocityX(-280);
        player.anims.play('left', true);
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(280);
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
