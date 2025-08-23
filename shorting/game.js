const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 600;

// 画像のスムージングを有効化（アンチエイリアシング）
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

const game = {
    score: 0,
    lives: 3,
    bombs: 3,
    gameOver: false,
    paused: false,
    frameCount: 0,
    started: false,  // ゲーム開始フラグを追加
    inDialogue: false,  // 会話中フラグ
    bossDialogueShown: false  // ボス会話を表示済みか
};

const playerImage = new Image();
playerImage.src = 'player.png';
let imageLoaded = false;

playerImage.onload = function() {
    imageLoaded = true;
};

playerImage.onerror = function() {
    console.log('プレイヤー画像が読み込めませんでした。デフォルトの図形で表示します。');
    imageLoaded = false;
};

const backgroundImage = new Image();
backgroundImage.src = 'background.png';
let bgImageLoaded = false;
let bgScrollY = 0;

backgroundImage.onload = function() {
    bgImageLoaded = true;
};

backgroundImage.onerror = function() {
    console.log('背景画像が読み込めませんでした。デフォルトの背景で表示します。');
    bgImageLoaded = false;
};

// 敵キャラ画像の読み込み
const enemyImage = new Image();
enemyImage.src = 'enemy.png';
let enemyImageLoaded = false;

enemyImage.onload = function() {
    enemyImageLoaded = true;
    console.log('敵画像が読み込まれました');
};

enemyImage.onerror = function() {
    console.log('敵画像が読み込めませんでした。デフォルトの図形で表示します。');
    enemyImageLoaded = false;
};

// ボス画像の読み込み
const bossImage = new Image();
bossImage.src = 'boss.png';
let bossImageLoaded = false;

bossImage.onload = function() {
    bossImageLoaded = true;
    console.log('ボス画像が読み込まれました');
};

bossImage.onerror = function() {
    console.log('ボス画像が読み込めませんでした。デフォルトの図形で表示します。');
    bossImageLoaded = false;
};

const bgm = new Audio('bgm.mp3');
bgm.loop = true;
bgm.volume = 0.1;

bgm.addEventListener('canplaythrough', function() {
    console.log('BGMが読み込まれました');
});

bgm.addEventListener('error', function() {
    console.log('BGMが読み込めませんでした');
});

function playBGM() {
    bgm.play().catch(function(error) {
        console.log('BGM再生エラー:', error);
    });
}

function stopBGM() {
    bgm.pause();
    bgm.currentTime = 0;
}

class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.width = 60;  // より適切なサイズに調整
        this.height = 60;  // より適切なサイズに調整
        this.speed = 5;
        this.slowSpeed = 2;
        this.isSlow = false;
        this.bullets = [];
        this.shootCooldown = 0;
        this.invulnerable = 0;
        this.hitboxRadius = 3;
        this.entryAnimation = false;  // エントリーアニメーション中かどうか
        this.entryStartY = canvas.height + 50;  // 画面外の開始位置
        this.entryTargetY = canvas.height - 100;  // 目標位置
        this.entrySpeed = 3;  // エントリー速度
    }

    update() {
        // エントリーアニメーション中の処理
        if (this.entryAnimation) {
            if (this.y > this.entryTargetY) {
                this.y -= this.entrySpeed;
                if (this.y <= this.entryTargetY) {
                    this.y = this.entryTargetY;
                    this.entryAnimation = false;
                    this.invulnerable = 60;  // エントリー後の無敵時間
                }
            }
            return;  // エントリー中は他の操作を受け付けない
        }

        const speed = this.isSlow ? this.slowSpeed : this.speed;

        if (keys.ArrowLeft && this.x > this.width/2) {
            this.x -= speed;
        }
        if (keys.ArrowRight && this.x < canvas.width - this.width/2) {
            this.x += speed;
        }
        if (keys.ArrowUp && this.y > this.height/2) {
            this.y -= speed;
        }
        if (keys.ArrowDown && this.y < canvas.height - this.height/2) {
            this.y += speed;
        }

        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        if (keys.z && this.shootCooldown === 0) {
            this.shoot();
            this.shootCooldown = 4;
        }

        if (keys.x && game.bombs > 0 && !keys.xPressed) {
            this.useBomb();
            keys.xPressed = true;
        }

        if (this.invulnerable > 0) {
            this.invulnerable--;
        }

        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= 15;
            return bullet.y > -10;
        });
    }

    shoot() {
        this.bullets.push({
            x: this.x,
            y: this.y - 10,
            width: 4,
            height: 12
        });
    }

    useBomb() {
        game.bombs--;
        enemies.length = 0;
        enemyBullets.length = 0;
        this.invulnerable = 180;

        for (let i = 0; i < 30; i++) {
            particles.push(new Particle(
                this.x + Math.random() * 20 - 10,
                this.y + Math.random() * 20 - 10,
                Math.random() * Math.PI * 2,
                Math.random() * 5 + 2,
                '#ffffff',
                60
            ));
        }
    }

    draw() {
        ctx.save();

        if (imageLoaded && playerImage.complete) {
            ctx.drawImage(
                playerImage,
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        } else {
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.height/2);
            ctx.lineTo(this.x - this.width/2, this.y + this.height/2);
            ctx.lineTo(this.x, this.y + this.height/3);
            ctx.lineTo(this.x + this.width/2, this.y + this.height/2);
            ctx.closePath();
            ctx.fill();
        }

        if (this.isSlow) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.hitboxRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();

        ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            ctx.fillRect(bullet.x - bullet.width/2, bullet.y, bullet.width, bullet.height);
        });
    }

    hit() {
        if (this.invulnerable === 0) {
            game.lives--;
            this.invulnerable = 180;
            this.x = canvas.width / 2;

            // リスポーン時もエントリーアニメーション
            this.y = this.entryStartY;
            this.entryAnimation = true;

            if (game.lives <= 0) {
                game.gameOver = true;
            }
        }
    }

    // エントリーアニメーションを開始
    startEntry() {
        this.y = this.entryStartY;
        this.entryAnimation = true;
    }
}

class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = type === 'boss' ? 80 : 32;  // ボスは大きく、通常敵は適度なサイズ
        this.height = type === 'boss' ? 80 : 32;
        this.hp = type === 'boss' ? 150 : 2;  // HP調整（ボス強化、雑魚は少し弱く）
        this.shootCooldown = 0;
        this.movePattern = Math.random() * Math.PI * 2;
        this.speed = type === 'boss' ? 1.5 : 2.5;  // 移動速度を上げる
    }

    update() {
        if (this.type === 'basic') {
            this.movePattern += 0.05;
            this.x += Math.sin(this.movePattern) * 2;
            this.y += this.speed;
        } else if (this.type === 'boss') {
            this.movePattern += 0.02;
            this.x = canvas.width/2 + Math.sin(this.movePattern) * 100;
            if (this.y < 100) {
                this.y += this.speed;
            }
        }

        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        if (this.shootCooldown === 0) {
            this.shoot();
            // 発射頻度を上げる（ボス：10→8、雑魚：60→40）
            this.shootCooldown = this.type === 'boss' ? 8 : 40;
        }
    }

    shoot() {
        if (this.type === 'basic') {
            // 雑魚敵は3方向散弾
            for (let i = -1; i <= 1; i++) {
                const angle = Math.PI / 2 + (i * Math.PI / 6); // 中央と左右30度
                const speed = 4;
                enemyBullets.push(new EnemyBullet(
                    this.x,
                    this.y + 10,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                ));
            }
        } else if (this.type === 'boss') {
            // ボスは12方向に増やして密度を上げる
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 / 12) * i + game.frameCount * 0.02;
                enemyBullets.push(new EnemyBullet(
                    this.x,
                    this.y,
                    Math.cos(angle) * 3,
                    Math.sin(angle) * 3,
                    'spiral'
                ));
            }
        }
    }

    draw() {
        ctx.save();

        if (this.type === 'boss') {
            // ボス画像の描画
            if (bossImageLoaded && bossImage.complete) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(
                    bossImage,
                    Math.floor(this.x - this.width / 2),
                    Math.floor(this.y - this.height / 2),
                    this.width,
                    this.height
                );
            } else {
                // デフォルトのボス表示
                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
            }

            // ボスのHPバー
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(50, 10, canvas.width - 100, 8);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(50, 10, (canvas.width - 100) * (this.hp / 100), 8);
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(50, 10, canvas.width - 100, 8);
        } else {
            // 通常敵の画像描画
            if (enemyImageLoaded && enemyImage.complete) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(
                    enemyImage,
                    Math.floor(this.x - this.width / 2),
                    Math.floor(this.y - this.height / 2),
                    this.width,
                    this.height
                );
            } else {
                // デフォルトの敵表示
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
            }
        }

        ctx.restore();
    }

    takeDamage(damage = 1) {
        this.hp -= damage;
        particles.push(new Particle(this.x, this.y, Math.random() * Math.PI * 2, 3, '#ffff00', 20));

        if (this.hp <= 0) {
            game.score += this.type === 'boss' ? 1000 : 100;

            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(
                    this.x + Math.random() * 20 - 10,
                    this.y + Math.random() * 20 - 10,
                    Math.random() * Math.PI * 2,
                    Math.random() * 3 + 1,
                    this.type === 'boss' ? '#ff00ff' : '#00ff00',
                    30
                ));
            }
            return true;
        }
        return false;
    }
}

class EnemyBullet {
    constructor(x, y, vx, vy, type = 'normal') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        this.radius = type === 'spiral' ? 6 : 4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.type === 'spiral') {
            this.vx *= 1.01;
            this.vy *= 1.01;
        }
    }

    draw() {
        if (this.type === 'spiral') {
            // ボスの弾を桜の花びらに
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // 回転アニメーション
            ctx.rotate(Date.now() * 0.002 + this.x);
            
            // 桜の花びらを描画（5枚）
            for (let i = 0; i < 5; i++) {
                ctx.rotate(Math.PI * 2 / 5);
                ctx.beginPath();
                
                // 花びらの形状
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(-3, -8, 0, -10);
                ctx.quadraticCurveTo(3, -8, 0, 0);
                
                // ピンクのグラデーション
                const gradient = ctx.createRadialGradient(0, -5, 0, 0, -5, 8);
                gradient.addColorStop(0, '#ffb3d9');
                gradient.addColorStop(1, '#ff66b3');
                ctx.fillStyle = gradient;
                ctx.fill();
                
                // 花びらの輪郭
                ctx.strokeStyle = '#ff99cc';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
            
            // 中心の花芯
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffff99';
            ctx.fill();
            
            ctx.restore();
        } else {
            // 雑魚敵の弾を人参に
            ctx.save();
            
            // 人参の本体（オレンジ色の三角形）
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + 8);  // 先端（下向き）
            ctx.lineTo(this.x - 4, this.y - 4);  // 左上
            ctx.lineTo(this.x + 4, this.y - 4);  // 右上
            ctx.closePath();
            ctx.fill();
            
            // 人参の葉っぱ（緑色）
            ctx.fillStyle = '#00cc00';
            ctx.fillRect(this.x - 3, this.y - 6, 6, 3);
            
            // 葉っぱのディテール
            ctx.fillStyle = '#009900';
            ctx.fillRect(this.x - 1, this.y - 7, 2, 2);
            
            ctx.restore();
        }
    }
}

class Particle {
    constructor(x, y, angle, speed, color, life) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.color = color;
        this.life = life;
        this.maxLife = life;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life--;
    }

    draw() {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
        ctx.globalAlpha = 1;
    }
}

const player = new Player();
let enemies = [];
let enemyBullets = [];
let particles = [];
let stars = [];

for (let i = 0; i < 50; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 2 + 0.5,
        size: Math.random() * 2
    });
}

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    z: false,
    x: false,
    xPressed: false,
    Shift: false
};

document.addEventListener('keydown', (e) => {
    // 会話中の処理
    if (game.inDialogue) {
        if (e.key === 'z') {
            dialogueSystem.next();
            e.preventDefault();
        }
        return;
    }

    if (e.key in keys) {
        keys[e.key] = true;
        e.preventDefault();
    }

    if (e.key === 'Shift') {
        player.isSlow = true;
    }

    if (e.key === 'Enter' && game.gameOver) {
        resetGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
        e.preventDefault();
    }

    if (e.key === 'Shift') {
        player.isSlow = false;
    }

    if (e.key === 'x') {
        keys.xPressed = false;
    }
});

function resetGame() {
    game.score = 0;
    game.lives = 3;
    game.bombs = 3;
    game.gameOver = false;
    game.frameCount = 0;
    game.started = true;  // ゲーム再開
    game.bossDialogueShown = false;  // ボス会話フラグをリセット

    player.x = canvas.width / 2;
    player.bullets = [];
    player.invulnerable = 0;

    // リセット時もエントリーアニメーション
    player.startEntry();

    enemies = [];
    enemyBullets = [];
    particles = [];

    playBGM();
}

function spawnEnemy() {
    // 敵の出現頻度を上げる（60→30フレームごと）
    if (game.frameCount % 30 === 0) {
        enemies.push(new Enemy(
            Math.random() * (canvas.width - 40) + 20,
            -20,
            'basic'
        ));
    }
    
    // 追加で横から出現する敵（45フレームごと）
    if (game.frameCount % 45 === 0 && game.frameCount > 120) {
        const side = Math.random() < 0.5 ? -20 : canvas.width + 20;
        enemies.push(new Enemy(
            side,
            100 + Math.random() * 200,
            'basic'
        ));
    }

    // ボス出現タイミング（会話シーンを挟む）- 少し早める
    if (game.frameCount % 480 === 0 && enemies.filter(e => e.type === 'boss').length === 0 && !game.bossDialogueShown) {
        // 会話シーンを開始
        dialogueSystem.start(dialogueSystem.getBossDialogue());
    }
}

function checkCollisions() {
    player.bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (Math.abs(bullet.x - enemy.x) < enemy.width/2 + bullet.width/2 &&
                Math.abs(bullet.y - enemy.y) < enemy.height/2 + bullet.height/2) {

                player.bullets.splice(bulletIndex, 1);

                if (enemy.takeDamage()) {
                    enemies.splice(enemyIndex, 1);
                }
            }
        });
    });

    if (player.invulnerable === 0) {
        enemyBullets.forEach((bullet) => {
            const dx = bullet.x - player.x;
            const dy = bullet.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < player.hitboxRadius + bullet.radius) {
                player.hit();
            }
        });
    }
}

function updateGame() {
    // 背景のスクロールは常に実行（スタート画面でも動かす）
    bgScrollY += 1;
    if (bgScrollY > canvas.height) {
        bgScrollY = 0;
    }

    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = -10;
            star.x = Math.random() * canvas.width;
        }
    });

    if (!game.started) {
        return;  // ゲームが開始されていない場合はここで終了
    }

    // 会話中は更新を停止
    if (game.inDialogue) {
        return;
    }

    if (!game.gameOver) {
        game.frameCount++;

        player.update();

        enemies = enemies.filter(enemy => {
            enemy.update();
            return enemy.y < canvas.height + 50;
        });

        enemyBullets = enemyBullets.filter(bullet => {
            bullet.update();
            return bullet.x > -20 && bullet.x < canvas.width + 20 &&
                   bullet.y > -20 && bullet.y < canvas.height + 20;
        });

        particles = particles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });

        spawnEnemy();
        checkCollisions();

        document.getElementById('score').textContent = game.score;
        document.getElementById('lives').textContent = game.lives;
        document.getElementById('bombs').textContent = game.bombs;
    }
}

function drawGame() {
    // 常に背景を描画（スタート画面でも表示）
    if (bgImageLoaded && backgroundImage.complete) {
        const imgHeight = backgroundImage.height;
        const imgWidth = backgroundImage.width;
        const scale = canvas.width / imgWidth;
        const scaledHeight = imgHeight * scale;

        ctx.drawImage(
            backgroundImage,
            0,
            bgScrollY - scaledHeight,
            canvas.width,
            scaledHeight
        );

        ctx.drawImage(
            backgroundImage,
            0,
            bgScrollY,
            canvas.width,
            scaledHeight
        );
    } else {
        ctx.fillStyle = '#000033';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        stars.forEach(star => {
            ctx.globalAlpha = star.size / 2;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        ctx.globalAlpha = 1;
    }

    // ゲーム開始後のみゲームオブジェクトを描画
    if (game.started) {
        particles.forEach(particle => particle.draw());
        enemies.forEach(enemy => enemy.draw());
        enemyBullets.forEach(bullet => bullet.draw());
        player.draw();
    }

    if (game.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 30);

        ctx.font = '24px Arial';
        ctx.fillText(`スコア: ${game.score}`, canvas.width/2, canvas.height/2 + 10);

        ctx.font = '18px Arial';
        ctx.fillText('Enterキーでリスタート', canvas.width/2, canvas.height/2 + 50);
    }
}

function gameLoop() {
    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// スタートボタンのイベントリスナー
document.getElementById('startButton').addEventListener('click', function() {
    // スタート画面を非表示
    document.getElementById('startScreen').classList.add('hidden');
    // ゲーム情報を表示
    document.getElementById('info').style.display = 'block';

    // ゲーム開始
    game.started = true;

    // プレイヤーのエントリーアニメーションを開始
    player.startEntry();

    playBGM();
});

// 会話システム
class DialogueSystem {
    constructor() {
        this.dialogues = [];
        this.currentIndex = 0;
        this.isTyping = false;
        this.typingSpeed = 30; // ミリ秒
        this.currentText = '';
        this.targetText = '';
        this.charIndex = 0;
        this.typingInterval = null;
    }

    // ボス戦前の会話データ
    getBossDialogue() {
        return [
            { speaker: 'ゆえうさぎ', position: 'right', text: 'お姉さま！48時間耐久配信なんて無謀です！全力で止めますわよ！' },
            { speaker: '月見里瑜依', position: 'left', text: 'やだやだやだもん！48時間やりきって、カッコいい大人のお姉さんになるんだから！！！' },
            { speaker: 'ゆえうさぎ', position: 'right', text: '（だめだこいつはやくなんとかしないと...）' }
        ];
    }

    start(dialogues) {
        this.dialogues = dialogues;
        this.currentIndex = 0;
        game.inDialogue = true;
        game.paused = true;

        // 会話シーンを表示
        document.getElementById('dialogueScene').style.display = 'block';

        this.showDialogue(0);
    }

    showDialogue(index) {
        if (index >= this.dialogues.length) {
            this.end();
            return;
        }

        const dialogue = this.dialogues[index];

        // スピーカー名を更新
        document.getElementById('speakerName').textContent = dialogue.speaker;

        // キャラクターの表示を更新
        const leftChar = document.getElementById('leftCharacter');
        const rightChar = document.getElementById('rightCharacter');

        if (dialogue.position === 'left') {
            leftChar.classList.remove('inactive');
            rightChar.classList.add('inactive');
        } else {
            leftChar.classList.add('inactive');
            rightChar.classList.remove('inactive');
        }

        // テキストをタイプライター効果で表示
        this.typeText(dialogue.text);
    }

    typeText(text) {
        const textElement = document.getElementById('dialogueText');

        // 心の声（括弧で囲まれたテキスト）は即座に表示
        if (text.startsWith('（') && text.endsWith('）')) {
            textElement.textContent = text;
            this.isTyping = false;
            this.targetText = text;
            return;
        }

        // 通常のタイプライター効果
        this.isTyping = true;
        this.targetText = text;
        this.currentText = '';
        this.charIndex = 0;

        textElement.textContent = '';

        this.typingInterval = setInterval(() => {
            if (this.charIndex < this.targetText.length) {
                this.currentText += this.targetText[this.charIndex];
                textElement.textContent = this.currentText;
                this.charIndex++;
            } else {
                clearInterval(this.typingInterval);
                this.isTyping = false;
            }
        }, this.typingSpeed);
    }

    next() {
        if (this.isTyping) {
            // タイピング中なら即座に全文表示
            clearInterval(this.typingInterval);
            document.getElementById('dialogueText').textContent = this.targetText;
            this.isTyping = false;
        } else {
            // 次の会話へ
            this.currentIndex++;
            this.showDialogue(this.currentIndex);
        }
    }

    end() {
        game.inDialogue = false;
        game.paused = false;
        document.getElementById('dialogueScene').style.display = 'none';

        // ボス会話が終わったらボスを出現させる
        if (!game.bossDialogueShown) {
            game.bossDialogueShown = true;
            enemies.push(new Enemy(canvas.width / 2, -50, 'boss'));
        }
    }
}

const dialogueSystem = new DialogueSystem();

gameLoop();
