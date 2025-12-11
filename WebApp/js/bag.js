// 鞄管理クラス
class BagManager {
    constructor() {
        this.items = {}; // { itemName: quantity }
        this.maxCapacity = 1000;
        this.loadFromLocalStorage();
    }

    // LocalStorageから読み込み
    loadFromLocalStorage() {
        try {
            const bagData = localStorage.getItem('rpg_bag');
            if (bagData) {
                const data = JSON.parse(bagData);
                this.items = data.items || {};
                this.maxCapacity = data.maxCapacity || 1000;
            }
        } catch (e) {
            console.error('鞄データ読み込みエラー:', e);
        }
    }

    // LocalStorageに保存
    saveToLocalStorage() {
        try {
            const data = {
                items: this.items,
                maxCapacity: this.maxCapacity
            };
            localStorage.setItem('rpg_bag', JSON.stringify(data));
        } catch (e) {
            console.error('鞄データ保存エラー:', e);
        }
    }

    // 現在の所持数を取得
    getCurrentCount() {
        return Object.values(this.items).reduce((sum, qty) => sum + qty, 0);
    }

    // アイテムを追加
    addItem(itemName, quantity = 1) {
        const currentCount = this.getCurrentCount();
        const availableSpace = this.maxCapacity - currentCount;

        if (availableSpace <= 0) {
            return {
                success: false,
                added: 0,
                message: '鞄が満杯です'
            };
        }

        const addableQuantity = Math.min(quantity, availableSpace);
        
        if (this.items[itemName]) {
            this.items[itemName] += addableQuantity;
        } else {
            this.items[itemName] = addableQuantity;
        }

        this.saveToLocalStorage();

        return {
            success: true,
            added: addableQuantity,
            overflow: quantity - addableQuantity,
            message: addableQuantity < quantity 
                ? `${addableQuantity}個追加しました（${quantity - addableQuantity}個は容量オーバーで追加できませんでした）`
                : `${addableQuantity}個追加しました`
        };
    }

    // アイテムを使用（削除）
    useItem(itemName, quantity = 1) {
        if (!this.items[itemName]) {
            return {
                success: false,
                message: 'アイテムが見つかりません'
            };
        }

        if (this.items[itemName] < quantity) {
            return {
                success: false,
                message: '所持数が不足しています'
            };
        }

        this.items[itemName] -= quantity;
        
        if (this.items[itemName] <= 0) {
            delete this.items[itemName];
        }

        this.saveToLocalStorage();

        return {
            success: true,
            message: `${quantity}個使用しました`
        };
    }

    // アイテムを削除
    removeItem(itemName, quantity = null) {
        if (!this.items[itemName]) {
            return {
                success: false,
                message: 'アイテムが見つかりません'
            };
        }

        const removedQuantity = quantity === null ? this.items[itemName] : Math.min(quantity, this.items[itemName]);
        
        if (quantity === null) {
            delete this.items[itemName];
        } else {
            this.items[itemName] -= quantity;
            if (this.items[itemName] <= 0) {
                delete this.items[itemName];
            }
        }

        this.saveToLocalStorage();

        return {
            success: true,
            message: `${removedQuantity}個削除しました`
        };
    }

    // アイテム一覧を取得（ソート済み）
    getItemsList() {
        return Object.entries(this.items)
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity);
    }

    // 鞄を空にする
    clearBag() {
        this.items = {};
        this.saveToLocalStorage();
    }

    // 容量を設定
    setMaxCapacity(capacity) {
        this.maxCapacity = Math.max(1, capacity);
        this.saveToLocalStorage();
    }

    // ガチャ結果をまとめて追加
    addGachaResults(results) {
        const itemCounts = {};
        
        // 結果を集計
        results.forEach(result => {
            if (result.itemName && result.itemName !== 'なし') {
                itemCounts[result.itemName] = (itemCounts[result.itemName] || 0) + 1;
            }
        });

        const report = {
            added: {},
            overflow: {},
            totalAdded: 0,
            totalOverflow: 0
        };

        // 各アイテムを追加
        for (const [itemName, quantity] of Object.entries(itemCounts)) {
            const result = this.addItem(itemName, quantity);
            report.added[itemName] = result.added;
            if (result.overflow > 0) {
                report.overflow[itemName] = result.overflow;
                report.totalOverflow += result.overflow;
            }
            report.totalAdded += result.added;
        }

        return report;
    }

    // 鞄データを取得（エクスポート用）
    getBagData() {
        return {
            items: this.items,
            maxCapacity: this.maxCapacity
        };
    }

    // 鞄データを復元（インポート用）
    restoreBagData(bagData) {
        if (bagData) {
            this.items = bagData.items || {};
            this.maxCapacity = bagData.maxCapacity || 1000;
            this.saveToLocalStorage();
        }
    }
}

// グローバルインスタンス
let bagManager;
