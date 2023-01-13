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
    }
};
new Phaser.Game(config);

function preload()
{
    // load assets
    this.load.image('background', 'assets/background.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.image('phaser_tiles', 'assets/tileset.png')
    this.load.spritesheet('perso','assets/perso.png',
                { frameWidth: 32, frameHeight: 48 });
    this.load.tilemapTiledJSON("map", "assets/level.json");
}

var platforms;
var player;
var cursors;
var stars;
var scoreText;
var bombs;
var gameOver = false;
var score = 0;

function create()
{
    this.add.image(780, 805, 'background');

    // import from tiled
    const levelMap = this.add.tilemap("map");
    const tileset = levelMap.addTilesetImage(
        "placeholder",
        "phaser_tiles"
    );
    const platforms = levelMap.createLayer(
        "platerforms",
        tileset
    );

    // add player
    player = this.physics.add.sprite(25, 1260, 'perso');

    // collisions
    this.physics.add.collider(player, platforms);
    platforms.setCollisionByProperty({ estSolide: true });
    platforms.setCollisionByProperty({ isSpike: true });
    player.setCollideWorldBounds(true);

    // set world bounds
    this.physics.world.setBounds(0, 0, 1600, 1600);
    // configure camera bounds
    this.cameras.main.setBounds(0, 0, 1600, 1600);
    // camlera follows player
    this.cameras.main.startFollow(player);
    this.cameras.main.setZoom(1.25);
    this.cameras.main.setRoundPixels(false);

    // player animations
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('perso', {start:0,end:3}),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'perso', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('perso', {start:5,end:8}),
        frameRate: 10,
        repeat: -1
    });

    cursors = this.input.keyboard.createCursorKeys();

    scoreText=this.add.text(16,16,'score: 0',{fontSize:'32px',fill:'#000'});
    // show score text
    stars = this.physics.add.group({
        key: 'star', repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });
    // every star bounces differently
    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });
    // colliders for stars
    this.physics.add.collider(stars, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);

    // colliders for bombs
    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);

}

function collectStar(player, star)
{
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0)
    {
        stars.children.iterate(function (child) {
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
    if (cursors.left.isDown)
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
    if (cursors.up.isDown && player.body.blocked.down)
    {
        player.setVelocityY(-400);
    }
    if (player.body.blocked.up)
    {
        this.cameras.main.shake(100,0.01,0.01)
    }
}
