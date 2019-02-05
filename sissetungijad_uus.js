
var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {

    game.load.image('bullet', 'bullet.png');
    game.load.image('enemyBullet', 'enemy-bullet.png');
    game.load.spritesheet('invader', 'invader32x32x4.png', 32, 32);
    game.load.image('ship', 'player.png');
    game.load.spritesheet('kaboom', 'explode.png', 128, 128);
    game.load.image('starfield', 'starfield.png');

}

var player;
var aliens;
var bullets;
var bulletTime = 0;
var cursors;
var fireButton;
var explosions;
var starfield;
var score = 0;
var scoreString = '';
var scoreText;
var lives;
var enemyBullet;
var firingTimer = 0;
var stateText;
var livingEnemies = [];
var level=1;
var rows;
var highScore=0;
var highScoreText="";
var finalTime=0;
var alive=true;
var levelTime=0;
var levelCompleted=false;

function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);

    //  Keriv taust
    starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');

    //  Meie kuulid
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(50, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 1);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);

    // Vaenlase kuulid
    enemyBullets = game.add.group();
    enemyBullets.enableBody = true;
    enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    enemyBullets.createMultiple(200, 'enemyBullet');
    enemyBullets.setAll('anchor.x', 0.5);
    enemyBullets.setAll('anchor.y', 1);
    enemyBullets.setAll('outOfBoundsKill', true);
    enemyBullets.setAll('checkWorldBounds', true);

    //  Meie laev
    player = game.add.sprite(400, 500, 'ship');
    player.anchor.setTo(0.5, 0.5);
    game.physics.enable(player, Phaser.Physics.ARCADE);

    //  Vaenlased
    aliens = game.add.group();
    aliens.enableBody = true;
    aliens.physicsBodyType = Phaser.Physics.ARCADE;

    createAliens();

    //  Tulemuse info
    scoreString = 'Tulemus: ';
    scoreText = game.add.text(10, 10, scoreString + score, { font: '26px Arial', fill: '#fff' });

    //  Elud
    lives = game.add.group();
    game.add.text(game.world.width - 100, 10, 'Elusid: ', { font: '26px Arial', fill: '#fff' });
 
    //  Teksti kuvamine (kui tase või mäng on läbi)
    stateText = game.add.text(game.world.centerX,game.world.centerY,' ', { font: '40px Arial', fill: '#fff' });
    stateText.anchor.setTo(0.5, 0.5);
    stateText.visible = false;

    for (var i = 0; i < 3; i++) 
    {
        var ship = lives.create(game.world.width - 100 + (30 * i), 60, 'ship');
        ship.anchor.setTo(0.5, 0.5);
        ship.angle = 90;
        ship.alpha = 0.75;
    }

    //  plahvatused
    explosions = game.add.group();
    explosions.createMultiple(30, 'kaboom');
    explosions.forEach(setupInvader, this);

    //  klaviatuuriklahvide kasutamine
    cursors = game.input.keyboard.createCursorKeys();
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    
}

function createAliens () { // vaenlaste loomine (10 vaenlast reas, vaenlaste ridade arv sõltub mängutasemest - mida kõrgem tase, seda rohkem vaenlaste ridu)
    rows=level+3;
    for (var y = 0; y < rows; y++)
    {
        for (var x = 0; x < 10; x++)
        {
            var alien = aliens.create(x * 48, y * 50, 'invader');
            alien.anchor.setTo(0.5, 0.5);
            alien.animations.add('fly', [ 0, 1, 2, 3 ], 20, true);
            alien.play('fly');
            alien.body.moves = false;
        }
    }

    aliens.x = 100;
    aliens.y = 50;

    //  liigutatakse vaenlasi ja pigem kogu gruppi kui iga üksikut vaenlast
    var tween = game.add.tween(aliens).to( { x: 200 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    //  kui liigutatakse, kutsutakse esile funktsioon 'descend'
    tween.onLoop.add(descend, this);
}

function createAliens1 () { // vaenlaste loomine (5 vaenlast reas, 4 rida)
    for (var y = 0; y < 4; y++)
        {
            for (var x = 0; x < 5; x++)
            {
                var alien = aliens.create(x*100,y*100, 'invader');
                alien.anchor.setTo(0.5, 0.5);
                alien.scale.setTo(3);
                alien.animations.add('fly', [ 0, 1, 2, 3 ], 20, true);
                alien.play('fly');
                alien.body.moves = false;
            }
        }
    aliens.x = 100;
    aliens.y = 50;

    //  liigutatakse vaenlasi ja pigem kogu gruppi kui iga üksikut vaenlast
    var tween = game.add.tween(aliens).to( { x: 200 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    //  kui liigutatakse, kutsutakse esile funktsioon 'descend'
    tween.onLoop.add(descend, this);
}

function setupInvader (invader) {

    invader.anchor.x = 0.5;
    invader.anchor.y = 0.5;
    invader.animations.add('kaboom');

}

function descend() {

    aliens.y += 10;

}

function update() {

    //  keritakse tausta
    starfield.tilePosition.y += 2;

    if (player.alive)
    {
        //  alustatakse uuesti ja seejärel jälgitakse klahvide liikumist
        player.body.velocity.setTo(0, 0);

        if (cursors.left.isDown)
        {
            player.body.velocity.x = -200;
        }
        else if (cursors.right.isDown)
        {
            player.body.velocity.x = 200;
        }

        //  kui tulistatakse
        if (fireButton.isDown)
        {
            fireBullet();
        }

        if (game.time.now > firingTimer)
        {
            enemyFires();
        }

        // põrkumiste jälgimine
        game.physics.arcade.overlap(bullets, aliens, collisionHandler, null, this);
        game.physics.arcade.overlap(enemyBullets, player, enemyHitsPlayer, null, this);

    }
    
    // kui mäng on läbi, siis 5 sekundit pausi
    if ((game.time.now>(finalTime+5000)) && (!alive)) 
            {
                console.log("olemas!"+finalTime+" "+game.time.now);
                alive=true;
                restart();
            }
    // kui tasem on läbi, siis 3 sekundit pausi
    if ((game.time.now>(levelTime+3000)) && (levelCompleted)) 
            {
                console.log("jätkan mängu! "+finalTime+" "+game.time.now);
                levelCompleted=false;
                restart();
            }

}

function render() {

    // for (var i = 0; i < aliens.length; i++)
    // {
    //     game.debug.body(aliens.children[i]);
    // }

}

function collisionHandler (bullet, alien) {

    //  kui kuul ja vaenlane puutuvad kokku, tapetakse mõlemad
    bullet.kill();
    alien.kill();

    //  suurendatakse tulemust
    score += 20;
    scoreText.text = scoreString + score;

    //  tekitatakse plahvatus
    var explosion = explosions.getFirstExists(false);
    explosion.reset(alien.body.x, alien.body.y);
    explosion.play('kaboom', 30, false, true);

    if (aliens.countLiving() == 0) // kui kõik vaenlased on surnud
     {
        levelTime=game.time.now;
        score += 1000;
        scoreText.text = scoreString + score;
        enemyBullets.callAll('kill',this);
        stateText.text = "       "+level+". tase\n    Sina võitsid!\n Vajuta, et jätkata,\nmuidu on paus 3 s";
        stateText.visible = true;
        level++;
        levelCompleted=true;
        // kui vajutatakse ekraanile, algab mäng otsast peale
        game.input.onTap.addOnce(restart,this);
    }

}

function enemyHitsPlayer (player,bullet) { // kui vaenlane puutub mängijaga kokku'
    
    
    // tapetakse kuul
    bullet.kill();

    live = lives.getFirstAlive();
    
    // kui on elusid, siis üks tapetakse ära

    if (live)
    {
        live.kill();
    }

    //  tekitatakse plahvatus
    var explosion = explosions.getFirstExists(false);
    explosion.reset(player.body.x, player.body.y);
    explosion.play('kaboom', 30, false, true);

    // kui mängija on surnud
    if (lives.countLiving() < 1)
    {
        // lõpetamise aeg (vajalik uuesti alustamiseks)
        finalTime=game.time.now;
        console.log(finalTime);
        player.kill();
        enemyBullets.callAll('kill');
        //parima tulemuse tekst (kui saadud tulemus on parem kui senine)
        if (score>highScore) // kui saadud tulemus on parem senisest parimast
            {
                highScore=score;
                highScoreText="      Tegid uue rekordi!\n";
            }
        else // kui saadud tulemus ei ole parem senisest parimast
            highScoreText="";
        stateText.text="         MÄNG LÄBI! \n        Said "+score+" punkti\n"+highScoreText+"Vajuta, et uuesti alustada,\nmuidu on paus 5 sekundit...";
        stateText.visible = true;
        // mängutasemeks on taaskord 1
        level=1;
        // ei ole elus
        alive=false;
        // kui vajutatakse ekraanile, algab mäng otsast peale
        game.input.onTap.addOnce(restart,this);

    }
}

function enemyFires () { // kui vaenlane tulistab

    //  võetakse esimene vaenlase kuul
    enemyBullet = enemyBullets.getFirstExists(false);

    livingEnemies.length=0;

    aliens.forEachAlive(function(alien){

        // kõik elavad vaenlased pannakse ühte massiivi
        livingEnemies.push(alien);
    });


    if (enemyBullet && livingEnemies.length > 0) // kui on vaenlasi ja neil kuule 
    {
        
        var random=game.rnd.integerInRange(0,livingEnemies.length-1);

        // valitakse juhuslik vaenlane
        var shooter=livingEnemies[random];
        // tulistatakse temalt kuul välja
        enemyBullet.reset(shooter.body.x, shooter.body.y);

        game.physics.arcade.moveToObject(enemyBullet,player,120);
        // tulistamisel arvestatakse mängu tasemega (mida kõrgem tase, seda kiiremaks tulistamine muutub)
        firingTimer = game.time.now + 3000-level*500;
    }

}

function fireBullet () {

    //  piiratakse laskmiskiirust
    if (game.time.now > bulletTime)
    {
        //  võetakse esimene kuul
        bullet = bullets.getFirstExists(false);

        if (bullet)
        {
            //  ja lastakse see välja
            bullet.reset(player.x, player.y + 8);
            bullet.body.velocity.y = -400;
            bulletTime = game.time.now + 200;
        }
    }
 
}

function resetBullet (bullet) {

    //  kuul tapetakse ära
    bullet.kill();

}

function restart () {

    //  alustatakse uue mänguga
    if (lives.countLiving() < 1)
        {
        score= 0;
        scoreText.text = scoreString + score;            
        }    
    // luuakse uued elud
    lives.callAll('revive');
    //  tuuakse vaenlased surmariigist tagasi
    aliens.removeAll();
    // 1. ja 2. taseme vaenlased
    if (level<3)
        {
            createAliens();
        }
    else // kõrgemate mängutasemete vaenlased
        {
            createAliens1();
        }

    // muudatakse mängija uuesti elusaks
    player.revive();
    // kustutatakse tekst
    stateText.visible = false;

}
