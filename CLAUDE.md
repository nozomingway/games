# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このリポジトリは、弾幕シューティングゲーム「永夜幻映 ～兎封伝～」のWebベースの実装です。HTML5 Canvas とJavaScriptを使用して開発されています。

## プロジェクト構造

- `/docs/shorting/` - GitHub Pagesでホスティングされるゲーム本体
  - `index.html` - ゲームのメインHTML
  - `game.js` - ゲームロジック実装
  - 画像・音声アセット (background.png, player.png, enemy.png, boss.png, bgm.mp3等)
- `/shorting/` - 開発用ディレクトリ（同一の内容）

## 開発コマンド

このプロジェクトは純粋なHTML/JavaScript/CSSで構成されており、ビルドツールは使用していません。

### ローカルでのテスト
```bash
# Python 3でローカルサーバーを起動
cd docs/shorting
python3 -m http.server 8000

# またはNode.jsのhttp-serverを使用
npx http-server docs/shorting
```

### デプロイ
GitHub Pagesで自動的にホスティングされます。`main`ブランチの`docs/`ディレクトリが公開されます。

## ゲームアーキテクチャ

### 主要コンポーネント
- **Canvas描画システム**: 500x750pxのキャンバスでゲーム画面を描画
- **ゲームループ**: requestAnimationFrameを使用した60FPSのゲームループ
- **エンティティシステム**: プレイヤー、敵、弾丸、ボスなどのゲームオブジェクト管理
- **会話システム**: ゲーム開始時とボス戦前の会話シーン実装
- **衝突判定**: 円形の当たり判定によるコリジョン検出

### 操作方法
- 矢印キー: 移動
- Z: ショット
- X: ボム（スペルカード）
- Shift: 低速移動

## 注意事項
- 画像アセットの読み込みに失敗した場合、デフォルトの図形で表示されるフォールバック機能あり
- BGMの自動再生はブラウザのポリシーにより制限される場合があるため、ユーザーインタラクション後に再生開始