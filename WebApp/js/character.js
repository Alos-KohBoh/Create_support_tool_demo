// キャラクタークラス
class Character {
    constructor(id, name, job = '', race = '', element = '', level = 1, 
                stats = {}, personality = '', background = '', dialogues = [], skills = [], imageUrl = '', bagItems = {}, tags = [], exp = 0, levelHistory = []) {
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
    }

    // 経験値を追加してレベルアップをチェック
    addExp(amount) {
        this.exp += amount;
        const requiredExp = this.getRequiredExpForNextLevel();
        
        if (this.exp >= requiredExp) {
            this.levelUp();
            return true; // レベルアップした
        }
        return false; // レベルアップしなかった
    }

    // 次のレベルに必要な経験値を計算
    getRequiredExpForNextLevel() {
        // 基本式: 100 * (level ^ 1.5)
        return Math.floor(100 * Math.pow(this.level, 1.5));
    }

    // レベルアップ処理
    levelUp() {
        const oldStats = { ...this.stats };
        this.level++;
        this.exp = 0; // 経験値リセット（余剰分は破棄）
        
        // レベルアップ履歴を記録
        this.levelHistory.push({
            level: this.level,
            oldStats: oldStats,
            newStats: { ...this.stats },
            timestamp: new Date().toISOString()
        });
    }

    // 経験値の進捗率を取得（0-100）
    getExpProgress() {
        const required = this.getRequiredExpForNextLevel();
        return Math.floor((this.exp / required) * 100);
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
            c.levelHistory || []
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
            this.characters[index] = { ...this.characters[index], ...updatedData };
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
