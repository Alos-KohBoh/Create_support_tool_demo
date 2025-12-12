// ガチャシミュレーションエンジン
class DropSimulator {
    constructor() {
        this.dropResults = [];
        this.itemCounts = {};
        this.expectedValues = {};
    }

    // レベルマルチプライヤー計算
    // レベル1: 100% (1.0倍), レベル10以上: 300% (3.0倍) ※上限
    calculateLevelMultiplier(level) {
        if (level < 1) level = 1;
        if (level >= 10) return 3.0;
        // レベル1から10まで線形に1.0倍から3.0倍へ増加
        return 1.0 + (level - 1) * (2.0 / 9);
    }

    // ガチャシミュレーション実行
    runSimulation(monster, trialCount, level = 1) {
        this.dropResults = [];
        this.itemCounts = {};
        
        const levelMultiplier = this.calculateLevelMultiplier(level);

        // 各アイテムのカウントを初期化
        monster.dropItems.forEach(item => {
            this.itemCounts[item.itemName] = 0;
        });

        // シミュレーション実行
        for (let i = 1; i <= trialCount; i++) {
            const droppedItems = this.simulateSingleDrop(monster, levelMultiplier);
            
            // 各ドロップアイテムを記録
            if (droppedItems.length === 0) {
                // 何もドロップしなかった場合
                this.dropResults.push(new DropResult(i, 'なし'));
            } else {
                droppedItems.forEach(itemName => {
                    this.dropResults.push(new DropResult(i, itemName));
                    if (this.itemCounts[itemName] !== undefined) {
                        this.itemCounts[itemName]++;
                    }
                });
            }
        }

        return {
            results: this.dropResults,
            counts: this.itemCounts
        };
    }

    // 単一ドロップのシミュレーション
    // 各アイテムを独立して判定し、複数ドロップや無ドロップに対応
    simulateSingleDrop(monster, levelMultiplier = 1.0) {
        const droppedItems = [];

        // 各アイテムごとに独立して判定
        for (const dropItem of monster.dropItems) {
            let probability = dropItem.probability * levelMultiplier;
            
            // 確率が100%を超える場合、複数個ドロップの可能性
            while (probability > 0) {
                if (probability >= 1.0) {
                    // 100%以上なので確定ドロップ
                    droppedItems.push(dropItem.itemName);
                    probability -= 1.0;
                } else {
                    // 残りの確率で判定
                    if (Math.random() < probability) {
                        droppedItems.push(dropItem.itemName);
                    }
                    break;
                }
            }
        }

        return droppedItems;
    }

    // 期待値計算
    calculateExpectedValues(monster, trialCount, level = 1) {
        this.expectedValues = {};
        
        const levelMultiplier = this.calculateLevelMultiplier(level);

        monster.dropItems.forEach(dropItem => {
            this.expectedValues[dropItem.itemName] = dropItem.probability * levelMultiplier * trialCount;
        });

        return this.expectedValues;
    }

    // 統計情報取得
    getStatistics(trialCount) {
        const stats = [];
        
        for (const [itemName, count] of Object.entries(this.itemCounts)) {
            const percentage = ((count / trialCount) * 100).toFixed(2);
            stats.push({
                itemName,
                count,
                percentage
            });
        }

        // カウントの降順でソート
        stats.sort((a, b) => b.count - a.count);
        
        return stats;
    }

    // 期待値との比較
    compareWithExpected(trialCount) {
        const comparison = [];

        for (const [itemName, actualCount] of Object.entries(this.itemCounts)) {
            const expected = this.expectedValues[itemName] || 0;
            const difference = actualCount - expected;
            const diffPercentage = expected > 0 ? ((difference / expected) * 100).toFixed(2) : 0;

            comparison.push({
                itemName,
                actualCount,
                expectedCount: expected.toFixed(2),
                difference: difference.toFixed(2),
                diffPercentage
            });
        }

        return comparison;
    }

    // 結果クリア
    clearResults() {
        this.dropResults = [];
        this.itemCounts = {};
        this.expectedValues = {};
    }
}
