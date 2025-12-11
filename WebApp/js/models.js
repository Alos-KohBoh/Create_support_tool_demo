// データモデルクラス
class Monster {
    constructor(id, name, dangerLevel, rarity, dropItems = [], imageUrl = '', description = '') {
        this.id = id || this.generateId();
        this.name = name;
        this.dangerLevel = dangerLevel;
        this.rarity = rarity;
        this.dropItems = dropItems;
        this.imageUrl = imageUrl;
        this.description = description;
    }

    generateId() {
        return 'monster_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

class Item {
    constructor(id, name, type, rarity, imageUrl = '', description = '', effect = '') {
        this.id = id || this.generateId();
        this.name = name;
        this.type = type;
        this.rarity = rarity;
        this.imageUrl = imageUrl;
        this.description = description;
        this.effect = effect;
    }

    generateId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

class DropItem {
    constructor(itemName, probability) {
        this.itemName = itemName;
        this.probability = probability;
    }
}

class DropResult {
    constructor(trialNumber, itemName) {
        this.trialNumber = trialNumber;
        this.itemName = itemName;
    }
}

// データストレージクラス
class DataStorage {
    constructor() {
        this.monsters = [];
        this.items = [];
        this.loadFromLocalStorage();
        
        // 初回起動時にサンプルデータを追加
        if (this.monsters.length === 0) {
            this.initSampleData();
        }
    }

    initSampleData() {
        // サンプルアイテム（実際のExcelデータに基づく）
        const slimeJelly = new Item(null, 'スライムゼリー', '素材', 'コモン');
        const slimeCore = new Item(null, 'スライムの核', '魔石', 'アンコモン');
        const lesserPotion = new Item(null, 'レッサーポーション', '消耗品', 'コモン');
        const slimeCard = new Item(null, 'スライムのカード', '召喚札', 'レア');
        const warehouse = new Item(null, '保管庫', 'スキルオーブ', 'エピック');
        
        const lesserWolfFur = new Item(null, 'レッサーウルフの毛', '素材', 'コモン');
        const lesserWolfBone = new Item(null, 'レッサーウルフの骨', '素材', 'レア');
        const beastStone = new Item(null, '獣石(レッサーウルフ)', '魔石', 'レア');
        const lesserWolfCard = new Item(null, 'レッサーウルフのカード', '召喚札', 'アンコモン');
        const perception = new Item(null, '感知', 'スキルオーブ', 'ハイレア');
        
        const hornRabbitFur = new Item(null, '角ウサギの毛皮', '素材', 'コモン');
        const rabbitMeat = new Item(null, 'ウサギの肉', '素材', 'アンコモン');
        const beastStoneRabbit = new Item(null, '獣石(ホーンラビット)', '魔石', 'レア');
        const hornRabbitCard = new Item(null, 'ホーンラビットのカード', '召喚札', 'レア');
        const rabbitKnife = new Item(null, 'ラビットナイフ', '武器', 'ハイレア');

        this.items = [slimeJelly, slimeCore, lesserPotion, slimeCard, warehouse,
                      lesserWolfFur, lesserWolfBone, beastStone, lesserWolfCard, perception,
                      hornRabbitFur, rabbitMeat, beastStoneRabbit, hornRabbitCard, rabbitKnife];

        // サンプルモンスター（実際のExcelデータに基づく）
        const slime = new Monster(null, 'スライム', '低', '☆', [
            new DropItem('スライムゼリー', 0.8),
            new DropItem('スライムの核', 0.1),
            new DropItem('レッサーポーション', 0.5),
            new DropItem('スライムのカード', 0.02),
            new DropItem('保管庫', 0.00000001)  // 0.000001% (100万分の1)
        ]);

        const lesserWolf = new Monster(null, 'レッサーウルフ', '低', '☆', [
            new DropItem('レッサーウルフの毛', 0.7),
            new DropItem('レッサーウルフの骨', 0.1),
            new DropItem('獣石(レッサーウルフ)', 0.1),
            new DropItem('レッサーウルフのカード', 0.01),
            new DropItem('感知', 0.0000002)  // 0.00002% (500万分の1)
        ]);

        const hornRabbit = new Monster(null, 'ホーンラビット', '極低', '☆', [
            new DropItem('角ウサギの毛皮', 0.7),
            new DropItem('ウサギの肉', 0.4),
            new DropItem('獣石(ホーンラビット)', 0.01),
            new DropItem('ホーンラビットのカード', 0.03),
            new DropItem('ラビットナイフ', 0.0001)  // 0.01% (1万分の1)
        ]);

        this.monsters = [slime, lesserWolf, hornRabbit];
        this.saveToLocalStorage();
    }

    addMonster(monster) {
        this.monsters.push(monster);
        this.saveToLocalStorage();
    }

    addItem(item) {
        this.items.push(item);
        this.saveToLocalStorage();
    }

    getMonsterById(id) {
        return this.monsters.find(m => m.id === id);
    }

    getItemById(id) {
        return this.items.find(i => i.id === id);
    }

    updateMonster(monster) {
        const index = this.monsters.findIndex(m => m.id === monster.id);
        if (index !== -1) {
            this.monsters[index] = monster;
            this.saveToLocalStorage();
        }
    }

    updateItem(item) {
        const index = this.items.findIndex(i => i.id === item.id);
        if (index !== -1) {
            this.items[index] = item;
            this.saveToLocalStorage();
        }
    }

    deleteMonster(id) {
        this.monsters = this.monsters.filter(m => m.id !== id);
        this.saveToLocalStorage();
    }

    deleteItem(id) {
        this.items = this.items.filter(i => i.id !== id);
        // モンスターのドロップテーブルからも削除
        this.monsters.forEach(monster => {
            monster.dropItems = monster.dropItems.filter(drop => {
                const item = this.items.find(i => i.name === drop.itemName);
                return item !== undefined;
            });
        });
        this.saveToLocalStorage();
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('rpg_monsters', JSON.stringify(this.monsters));
            localStorage.setItem('rpg_items', JSON.stringify(this.items));
        } catch (e) {
            console.error('データ保存エラー:', e);
        }
    }

    loadFromLocalStorage() {
        try {
            const monstersData = localStorage.getItem('rpg_monsters');
            const itemsData = localStorage.getItem('rpg_items');

            if (monstersData) {
                const parsed = JSON.parse(monstersData);
                this.monsters = parsed.map(m => 
                    new Monster(m.id, m.name, m.dangerLevel || m.danger, m.rarity, 
                        m.dropItems.map(d => new DropItem(d.itemName, d.probability)), 
                        m.imageUrl || '', m.description || '')
                );
            }

            if (itemsData) {
                const parsed = JSON.parse(itemsData);
                this.items = parsed.map(i => 
                    new Item(i.id, i.name, i.type, i.rarity, i.imageUrl || '', i.description || '', i.effect || '')
                );
            }
        } catch (e) {
            console.error('データ読み込みエラー:', e);
        }
    }

    clearAll() {
        this.monsters = [];
        this.items = [];
        localStorage.removeItem('rpg_monsters');
        localStorage.removeItem('rpg_items');
    }
}
