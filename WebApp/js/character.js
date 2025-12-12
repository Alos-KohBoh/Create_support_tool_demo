// キャラクタークラス
class Character {
    constructor(id, name, job = '', race = '', element = '', level = 1, 
                stats = {}, personality = '', background = '', dialogues = [], skills = [], imageUrl = '', bagItems = {}) {
        this.id = id;
        this.name = name;
        this.job = job;
        this.race = race;
        this.element = element;
        this.level = level;
        this.stats = stats; // 動的ステータス {statId: value}
        this.personality = personality;
        this.background = background;
        this.dialogues = dialogues; // Array of strings
        this.skills = skills; // Array of strings
        this.imageUrl = imageUrl;
        this.bagItems = bagItems; // { itemName: quantity } キャラクター専用鞄
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
            c.bagItems || {}
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
