// キャラクタークラス
class Character {
    constructor(id, name, job = '', race = '', element = '', level = 1, 
                stats = {}, personality = '', background = '', dialogues = [], skills = [], imageUrl = '', bagItems = {}, tags = [], exp = 0, levelHistory = [], bonusPoints = 0, allocatedBonus = {}) {
        this.id = id;
        this.name = name;
        this.job = job;
        this.race = race;
        this.element = element;
        this.level = level;
        this.exp = exp || 0; // 現在の経験値
        this.stats = stats; // 動的ステータス {statId: value}
        this.personality = personality;
        this.background = background;
        this.dialogues = dialogues; // Array of strings
        this.skills = skills; // Array of strings
        this.imageUrl = imageUrl;
        this.bagItems = bagItems; // { itemName: quantity } キャラクター専用鞄
        this.tags = tags || []; // タグ配列
        this.levelHistory = levelHistory || []; // レベルアップ履歴 [{level, stats, timestamp}]
        this.bonusPoints = bonusPoints || 0; // 未振り分けボーナスポイント
        this.allocatedBonus = allocatedBonus || {}; // 振り分け済みボーナス {statId: points}
    }

    // 経験値を追加してレベルアップをチェック
    addExp(amount) {
        this.exp += amount;
        let leveledUp = false;
        
        // 複数レベルアップに対応
        while (this.exp >= this.getRequiredExpForNextLevel()) {
            const requiredExp = this.getRequiredExpForNextLevel();
            this.exp -= requiredExp; // 余剰分を次のレベルに繰り越す
            this.levelUp();
            leveledUp = true;
        }
        
        return leveledUp; // レベルアップしたかどうか
    }

    // 次のレベルに必要な経験値を計算
    getRequiredExpForNextLevel() {
        // 基本式: 100 * (level ^ 1.5)
        return Math.floor(100 * Math.pow(this.level, 1.5));
    }

    // レベルアップ処理
    levelUp() {
        console.log('=== levelUp called ===');
        console.log('Before levelUp - Level:', this.level, 'Stats:', JSON.stringify(this.stats));
        const oldStats = { ...this.stats };
        this.level++;
        // 注意: expは呼び出し側（addExp）で調整されます
        
        // ボーナスポイントを加算
        this.bonusPoints = (this.bonusPoints || 0) + 5;
        
        // マスターデータからレベルアップ設定を取得
        const masterConfig = JSON.parse(localStorage.getItem('masterConfig') || '{}');
        const levelUpConfig = masterConfig.levelUpConfig || {};
        const jobBonuses = masterConfig.jobBonuses || {};
        const raceBonuses = masterConfig.raceBonuses || {};
        
        // 全てのステータスに対してレベルアップ処理を実行
        Object.keys(this.stats).forEach(statId => {
            const baseLevelUp = levelUpConfig[statId] || 1;
            const jobBonus = (jobBonuses[this.job] && jobBonuses[this.job][statId]) || 0;
            const raceBonus = (raceBonuses[this.race] && raceBonuses[this.race][statId]) || 0;
            
            // 基本上昇値 + 職業ボーナス + 種族ボーナス
            const totalIncrease = baseLevelUp + jobBonus + raceBonus;
            this.stats[statId] = (this.stats[statId] || 0) + totalIncrease;
        });
        
        console.log('After stats update:', JSON.stringify(this.stats));
        
        // レベルアップ履歴を記録
        this.levelHistory.push({
            level: this.level,
            oldStats: oldStats,
            newStats: { ...this.stats },
            timestamp: new Date().toISOString()
        });
        console.log('After levelUp - Level:', this.level, 'Stats:', JSON.stringify(this.stats));
        console.log('=== levelUp end ===');
    }

    // 職業ボーナスを取得
    getJobBonus() {
        const masterConfig = JSON.parse(localStorage.getItem('masterConfig') || '{}');
        const jobBonuses = masterConfig.jobBonuses || {};
        return jobBonuses[this.job] || null;
    }

    // 種族ボーナスを取得
    getRaceBonus() {
        const masterConfig = JSON.parse(localStorage.getItem('masterConfig') || '{}');
        const raceBonuses = masterConfig.raceBonuses || {};
        return raceBonuses[this.race] || null;
    }

    // 経験値の進捗率を取得（0-100）
    getExpProgress() {
        const required = this.getRequiredExpForNextLevel();
        return Math.floor((this.exp / required) * 100);
    }

    // ボーナスポイントを振り分ける
    allocateBonusPoint(statId, points) {
        if (this.bonusPoints < points) {
            return false; // ポイント不足
        }

        // ステータスIDに応じた変換レート
        const rates = {
            hp: 10,
            mp: 5
        };
        const rate = rates[statId] || 1;

        // ステータスを加算
        this.stats[statId] = (this.stats[statId] || 0) + (points * rate);
        
        // ボーナスポイントを減算
        this.bonusPoints -= points;
        
        // 振り分け履歴を記録
        this.allocatedBonus[statId] = (this.allocatedBonus[statId] || 0) + points;
        
        return true;
    }

    // LocalStorageから読み込み用
    static loadFromLocalStorage() {
        const saved = localStorage.getItem('characters');
        if (!saved) return [];
        
        const data = JSON.parse(saved);
        return data.map(c => new Character(
            c.id, c.name, c.job || '', c.race || '', c.element || '', c.level || 1,
            c.stats || {},
            c.personality || '', c.background || '', c.dialogues || [], c.skills || [],
            c.imageUrl || '',
            c.bagItems || {},
            c.tags || [],
            c.exp || 0,
            c.levelHistory || [],
            c.bonusPoints || 0,
            c.allocatedBonus || {}
        ));
    }

    // LocalStorageに保存
    static saveToLocalStorage(characters) {
        localStorage.setItem('characters', JSON.stringify(characters));
    }

    // ステータス値を取得
    getStat(statId) {
        return this.stats[statId] || 0;
    }

    // ステータス値を設定
    setStat(statId, value) {
        this.stats[statId] = value;
    }
}

// キャラクター管理クラス
class CharacterManager {
    constructor() {
        this.characters = Character.loadFromLocalStorage();
    }

    addCharacter(character) {
        this.characters.push(character);
        Character.saveToLocalStorage(this.characters);
    }

    updateCharacter(id, updatedData) {
        const index = this.characters.findIndex(c => c.id === id);
        if (index !== -1) {
            // Characterオブジェクトの場合はそのまま置き換え
            if (updatedData instanceof Character) {
                this.characters[index] = updatedData;
            } else {
                // プレーンオブジェクトの場合はプロパティをマージ
                Object.assign(this.characters[index], updatedData);
            }
            Character.saveToLocalStorage(this.characters);
        }
    }

    deleteCharacter(id) {
        this.characters = this.characters.filter(c => c.id !== id);
        Character.saveToLocalStorage(this.characters);
    }

    getCharacter(id) {
        return this.characters.find(c => c.id === id);
    }

    // エイリアス: getCharacterByIdとgetCharacterは同じ
    getCharacterById(id) {
        return this.getCharacter(id);
    }

    getAllCharacters() {
        return this.characters;
    }

    // 作品IDでキャラクターを取得
    getCharactersByWorkId(workId) {
        return this.characters.filter(c => c.workId === workId);
    }

    // キャラクターデータを保存
    saveCharacters() {
        Character.saveToLocalStorage(this.characters);
    }

    getFilteredCharacters(filters) {
        return this.characters.filter(character => {
            if (filters.name && !character.name.toLowerCase().includes(filters.name.toLowerCase())) {
                return false;
            }
            if (filters.job && character.job !== filters.job) {
                return false;
            }
            if (filters.race && character.race !== filters.race) {
                return false;
            }
            return true;
        });
    }

    generateId() {
        return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// キャラクター関係性クラス
class CharacterRelationship {
    constructor(id, characterId1, characterId2, relationshipType = '', strength = 50, description = '') {
        this.id = id;
        this.characterId1 = characterId1; // 関係の主体
        this.characterId2 = characterId2; // 関係の対象
        this.relationshipType = relationshipType; // '友人', '恋人', '敵対', '家族', 'ライバル' など
        this.strength = strength; // 関係の強さ 0-100
        this.description = description; // 関係の詳細説明
    }
}

// 関係性管理クラス
class RelationshipManager {
    constructor() {
        this.relationships = this.loadRelationships();
    }

    loadRelationships() {
        const saved = localStorage.getItem('character_relationships');
        return saved ? JSON.parse(saved) : [];
    }

    saveRelationships() {
        localStorage.setItem('character_relationships', JSON.stringify(this.relationships));
    }

    addRelationship(relationship) {
        this.relationships.push(relationship);
        this.saveRelationships();
    }

    updateRelationship(id, updatedData) {
        const index = this.relationships.findIndex(r => r.id === id);
        if (index !== -1) {
            this.relationships[index] = { ...this.relationships[index], ...updatedData };
            this.saveRelationships();
        }
    }

    deleteRelationship(id) {
        this.relationships = this.relationships.filter(r => r.id !== id);
        this.saveRelationships();
    }

    getRelationship(id) {
        return this.relationships.find(r => r.id === id);
    }

    // 特定キャラクターの関係性を取得
    getRelationshipsForCharacter(characterId) {
        return this.relationships.filter(r => 
            r.characterId1 === characterId || r.characterId2 === characterId
        );
    }

    // 2人のキャラクター間の関係性を取得
    getRelationshipBetween(characterId1, characterId2) {
        return this.relationships.find(r =>
            (r.characterId1 === characterId1 && r.characterId2 === characterId2) ||
            (r.characterId1 === characterId2 && r.characterId2 === characterId1)
        );
    }

    getAllRelationships() {
        return this.relationships;
    }

    generateId() {
        return 'rel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}
