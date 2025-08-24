const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 画面サイズを1.25倍に拡大
canvas.width = 500;
canvas.height = 750;

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
bgm.volume = 0.5;

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
        this.speed = 2;
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

        // マウス操作が有効な場合はマウス位置に追従、そうでなければキーボード操作
        if (mouse.isActive) {
            // マウス位置に向かって移動（スムーズな移動のため速度制限）
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 1) { // 1ピクセル以内なら移動しない
                const moveX = (dx / distance) * Math.min(this.speed, distance);
                const moveY = (dy / distance) * Math.min(this.speed, distance);
                
                // 画面境界チェック
                const newX = Math.max(this.width/2, Math.min(canvas.width - this.width/2, this.x + moveX));
                const newY = Math.max(this.height/2, Math.min(canvas.height - this.height/2, this.y + moveY));
                
                this.x = newX;
                this.y = newY;
            }
        } else {
            // キーボード操作（フォールバック）
            const speed = this.speed;

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
        }

        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        if (this.shootCooldown === 0) {
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
        // ボス以外の敵のみ削除
        enemies = enemies.filter(enemy => enemy.type === 'boss');
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

        // プレイヤーの当たり判定を常に表示
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.hitboxRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // 主人公の弾を桜の花びらに
        this.bullets.forEach(bullet => {
            ctx.save();
            ctx.translate(bullet.x, bullet.y);

            // 回転アニメーション
            ctx.rotate(Date.now() * 0.003 + bullet.x);

            // 小さめの桜の花びらを描画（5枚）
            for (let i = 0; i < 5; i++) {
                ctx.rotate(Math.PI * 2 / 5);
                ctx.beginPath();

                // 花びらの形状（小さめ）
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(-2, -5, 0, -6);
                ctx.quadraticCurveTo(2, -5, 0, 0);

                // ピンクのグラデーション
                const gradient = ctx.createRadialGradient(0, -3, 0, 0, -3, 5);
                gradient.addColorStop(0, '#ffb3d9');
                gradient.addColorStop(1, '#ff66b3');
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            // 中心の花芯
            ctx.beginPath();
            ctx.arc(0, 0, 1, 0, Math.PI * 2);
            ctx.fillStyle = '#ffff99';
            ctx.fill();

            ctx.restore();
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
        this.maxHp = type === 'boss' ? 150 : 2;  // 最大HP保存
        this.shootCooldown = 0;
        this.movePattern = Math.random() * Math.PI * 2;
        this.speed = type === 'boss' ? 1.5 : 2.5;  // 移動速度を上げる
        this.attackPhase = 0;  // ボスの攻撃フェーズ
        this.phaseCooldown = 0;  // フェーズ変更のクールダウン
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

            // HPに応じてフェーズ変更
            const hpRatio = this.hp / this.maxHp;
            if (hpRatio > 0.66) {
                this.attackPhase = 0;  // フェーズ1
            } else if (hpRatio > 0.33) {
                this.attackPhase = 1;  // フェーズ2
            } else {
                this.attackPhase = 2;  // フェーズ3（最終）
            }

            // フェーズ変更時のクールダウン管理
            if (this.phaseCooldown > 0) {
                this.phaseCooldown--;
            }
        }

        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        if (this.shootCooldown === 0) {
            this.shoot();
            // 発射頻度（時間経過で雑魚も早くなる、ボスはフェーズごとに変更）
            const difficultyLevel = Math.floor(game.frameCount / 600);
            const basicCooldown = Math.max(30, 60 - difficultyLevel * 5);

            if (this.type === 'boss') {
                // フェーズごとに発射間隔を変更
                if (this.attackPhase === 0) {
                    this.shootCooldown = 20;  // フェーズ1: ゆっくり
                } else if (this.attackPhase === 1) {
                    this.shootCooldown = 15;  // フェーズ2: 普通
                } else {
                    this.shootCooldown = 10;  // フェーズ3: 高速
                }
            } else {
                this.shootCooldown = basicCooldown;
            }
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
            // ボスの攻撃パターンをフェーズごとに変更
            if (this.attackPhase === 0) {
                // フェーズ1: 基本の螺旋弾幕
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i + game.frameCount * 0.03;
                    const startRadius = 50;
                    enemyBullets.push(new EnemyBullet(
                        this.x + Math.cos(angle) * startRadius,
                        this.y + Math.sin(angle) * startRadius + 20,
                        Math.cos(angle) * 2,
                        Math.sin(angle) * 2,
                        'spiral'
                    ));
                }
            } else if (this.attackPhase === 1) {
                // フェーズ2: 十字弾幕＋螺旋
                // 十字方向の弾
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI / 2) * i;
                    enemyBullets.push(new EnemyBullet(
                        this.x, this.y + 20,
                        Math.cos(angle) * 4,
                        Math.sin(angle) * 4,
                        'cross'
                    ));
                }
                // 螺旋弾も追加
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 / 6) * i + game.frameCount * 0.05;
                    const startRadius = 40;
                    enemyBullets.push(new EnemyBullet(
                        this.x + Math.cos(angle) * startRadius,
                        this.y + Math.sin(angle) * startRadius + 20,
                        Math.cos(angle) * 1.5,
                        Math.sin(angle) * 1.5,
                        'spiral'
                    ));
                }
            } else if (this.attackPhase === 2) {
                // フェーズ3: 全方向大量弾幕（最終攻撃）
                for (let i = 0; i < 16; i++) {
                    const angle = (Math.PI * 2 / 16) * i + game.frameCount * 0.02;
                    const startRadius = 60;
                    const speed = 2.5;
                    enemyBullets.push(new EnemyBullet(
                        this.x + Math.cos(angle) * startRadius,
                        this.y + Math.sin(angle) * startRadius + 20,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        'spiral'
                    ));
                }
                // プレイヤー狙い弾も追加
                const playerAngle = Math.atan2(player.y - this.y, player.x - this.x);
                for (let i = -1; i <= 1; i++) {
                    const angle = playerAngle + (i * Math.PI / 8);
                    enemyBullets.push(new EnemyBullet(
                        this.x, this.y + 20,
                        Math.cos(angle) * 3,
                        Math.sin(angle) * 3,
                        'aimed'
                    ));
                }
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

                // 画像の元のサイズを取得
                const imgWidth = bossImage.naturalWidth;
                const imgHeight = bossImage.naturalHeight;

                // アスペクト比を保持してスケール計算
                let drawWidth = this.width;
                let drawHeight = this.height;

                if (imgWidth > 0 && imgHeight > 0) {
                    const imgAspect = imgWidth / imgHeight;
                    const targetAspect = this.width / this.height;

                    if (imgAspect > targetAspect) {
                        // 画像が横長の場合、幅を基準にする
                        drawHeight = this.width / imgAspect;
                    } else {
                        // 画像が縦長の場合、高さを基準にする
                        drawWidth = this.height * imgAspect;
                    }
                }

                ctx.drawImage(
                    bossImage,
                    Math.floor(this.x - drawWidth / 2),
                    Math.floor(this.y - drawHeight / 2),
                    drawWidth,
                    drawHeight
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
        // 弾の種類によって当たり判定を調整
        if (type === 'spiral') {
            this.radius = 6;
        } else if (type === 'cross') {
            this.radius = 7;  // 十字弾は少し大きい
        } else if (type === 'aimed') {
            this.radius = 5;  // 狙い弾は小さい
        } else {
            this.radius = 4;  // 通常弾
        }
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
        if (this.type === 'spiral' || this.type === 'cross' || this.type === 'aimed') {
            // ボスの弾を星型に
            ctx.save();
            ctx.translate(this.x, this.y);

            // 弾の種類別の見た目と回転速度
            let outerRadius, innerRadius, colors, rotationSpeed;

            if (this.type === 'spiral') {
                // 螺旋弾: 黄色の星
                outerRadius = 10;
                innerRadius = 4;
                colors = ['#ffff99', '#ffd700', '#ff9900'];
                rotationSpeed = 0.004;
            } else if (this.type === 'cross') {
                // 十字弾: 青い大きな星
                outerRadius = 12;
                innerRadius = 5;
                colors = ['#99ccff', '#0080ff', '#0066cc'];
                rotationSpeed = 0.006;
            } else if (this.type === 'aimed') {
                // 狙い弾: 赤い小さな星
                outerRadius = 8;
                innerRadius = 3;
                colors = ['#ff9999', '#ff4444', '#cc0000'];
                rotationSpeed = 0.008;
            }

            ctx.rotate(Date.now() * rotationSpeed + this.x);

            // 星型を描画
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const angle = (Math.PI * 2 / 10) * i - Math.PI / 2;
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();

            // グラデーション
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius);
            gradient.addColorStop(0, colors[0]);
            gradient.addColorStop(0.5, colors[1]);
            gradient.addColorStop(1, colors[2]);
            ctx.fillStyle = gradient;
            ctx.fill();

            // 星の輪郭
            ctx.strokeStyle = colors[1];
            ctx.lineWidth = 1;
            ctx.stroke();

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
};

// マウス位置を追跡
const mouse = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    isActive: false
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


    if (e.key === 'Enter' && game.gameOver) {
        resetGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
        e.preventDefault();
    }


    if (e.key === 'x') {
        keys.xPressed = false;
    }
});

// マウスイベントリスナーを追加
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.isActive = true;
});

canvas.addEventListener('mouseenter', (e) => {
    mouse.isActive = true;
});

canvas.addEventListener('mouseleave', (e) => {
    mouse.isActive = false;
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
    // ボスがいる場合は雑魚敵を出現させない
    const hasBoss = enemies.some(e => e.type === 'boss');

    // 時間経過による難易度係数（0から始まって徐々に増加）
    const difficultyLevel = Math.floor(game.frameCount / 600); // 10秒ごとにレベルアップ

    if (!hasBoss) {
        // 基本の敵出現（最初は60フレーム、徐々に早くなる）
        const baseSpawnRate = Math.max(20, 60 - difficultyLevel * 5);
        if (game.frameCount % baseSpawnRate === 0) {
            enemies.push(new Enemy(
                Math.random() * (canvas.width - 40) + 20,
                -20,
                'basic'
            ));
        }

        // レベル2以降：追加で横から出現する敵
        if (difficultyLevel >= 2) {
            const sideSpawnRate = Math.max(30, 60 - difficultyLevel * 3);
            if (game.frameCount % sideSpawnRate === 0) {
                const side = Math.random() < 0.5 ? -20 : canvas.width + 20;
                enemies.push(new Enemy(
                    side,
                    100 + Math.random() * 200,
                    'basic'
                ));
            }
        }

        // レベル4以降：2体同時出現
        if (difficultyLevel >= 4 && game.frameCount % 90 === 0) {
            for (let i = 0; i < 2; i++) {
                enemies.push(new Enemy(
                    (canvas.width / 3) * (i + 1) - 20,
                    -20,
                    'basic'
                ));
            }
        }
    }

    // ボス出現タイミング（約30秒後）
    if (game.frameCount === 1800 && !game.bossDialogueShown) {
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

        // ゲーム画面内にスコア、残機、ボム数を表示
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;

        // スコア表示（左上）
        const scoreText = `スコア: ${game.score}`;
        ctx.strokeText(scoreText, 10, 25);
        ctx.fillText(scoreText, 10, 25);

        // 残機表示（左上、2段目）
        const livesText = `残機: ${game.lives}`;
        ctx.strokeText(livesText, 10, 50);
        ctx.fillText(livesText, 10, 50);

        // ボム数表示（左上、3段目）
        const bombsText = `ボム: ${game.bombs}`;
        ctx.strokeText(bombsText, 10, 75);
        ctx.fillText(bombsText, 10, 75);

        ctx.restore();
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
            { speaker: 'ゆえうさぎ', position: 'right', text: 'ゆえお姉さま！48時間耐久配信なんて無謀です！全力で止めますわよ！' },
            { speaker: '月見里瑜依', position: 'left', text: 'やだやだやだもん！48時間やりきって、カッコいい大人のお姉さんになるんだから！！！' },
            { speaker: 'ゆえうさぎ', position: 'right', text: 'はぁ...\n（だめだはやくなんとかしないと...）' }
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
            // 雑魚敵を全て削除
            enemies = enemies.filter(e => e.type === 'boss');
            enemyBullets = [];  // 雑魚敵の弾も削除
            // ボスを出現させる
            enemies.push(new Enemy(canvas.width / 2, -50, 'boss'));
        }
    }
}

const dialogueSystem = new DialogueSystem();

gameLoop();
