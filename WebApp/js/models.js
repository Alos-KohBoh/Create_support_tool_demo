// データモデルクラス
class Monster {
    constructor(id, name, dangerLevel, rarity, dropItems = [], imageUrl = '', description = '', exp = 0, statsObj = {}) {
        this.id = id || this.generateId();
        this.name = name;
        this.dangerLevel = dangerLevel;
        this.rarity = rarity;
        this.dropItems = dropItems;
        this.imageUrl = imageUrl;
        this.description = description;
        this.exp = exp || 0; // 経験値を追加
        // ステータス値はbaseStatsとして必ず保持
        this.baseStats = { ...statsObj };
        // 互換性のため個別プロパティにも展開（旧データや直接参照用）
        if (statsObj && typeof statsObj === 'object') {
            Object.keys(statsObj).forEach(k => {
                this[k] = statsObj[k];
            });
        }
    }

    generateId() {
        return 'monster_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

class Item {
    constructor(id, name, type, rarity, imageUrl = '', description = '', effect = '', tags = []) {
        this.id = id || this.generateId();
        this.name = name;
        this.type = type;
        this.rarity = rarity;
        this.imageUrl = imageUrl;
        this.description = description;
        this.effect = effect;
        this.tags = tags || []; // タグ配列
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

// スキルクラス
class Skill {
    constructor(id, name, costType = '', costValue = 0, target = '', description = '', parentId = '', childIds = [], system = '') {
        this.id = id || this.generateId();
        this.name = name;
        this.costType = costType; // 消費項目（例: MP, アイテム, 回数など）
        this.costValue = costValue; // 消費値
        this.target = target; // 対象（単体/全体/自分/味方/敵など）
        this.description = description;
        this.parentId = parentId || '';
        this.childIds = Array.isArray(childIds) ? childIds : [];
        this.system = system || '';
    }
    generateId() {
        return 'skill_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// データストレージクラス
class DataStorage {
    constructor(projectManager = null) {
        this.projectManager = projectManager;
        this.monsters = [];
        this.items = [];
        this.skills = [];
        // 系統マスタ
        this.skillSystems = [
            '物理魔法', '精神魔法', '系統外魔法', '補助魔法',
            '斬撃系', '打撃系', '刺突系', '気力系', '強化系'
        ];
        // 既存データ読込
        this.loadSkillsFromLocalStorage();
        this.loadFromLocalStorage();
        // 初回起動時にサンプルデータを追加
        if (this.monsters.length === 0 || this.items.length === 0) {
            this.initSampleData();
        }
        if (this.skills.length === 0) {
            this.initSampleSkills();
        }
    }


    // localStorageキーのプレフィックスを取得
    getKeyPrefix() {
        if (this.projectManager && this.projectManager.currentProjectId) {
            return this.projectManager.getProjectDataPrefix(this.projectManager.currentProjectId);
        }
        return 'rpg_';
    }

    // 一意ID生成
    generateId(prefix = 'skill') {
        return prefix + '_' + Math.random().toString(36).substr(2, 9);
    }

    // スキル初期データ
    initSampleSkills() {
        const fire = new Skill(this.generateId(), 'ファイア', 'MP', 5, '敵単体', '小さな火球で攻撃する');
        const heal = new Skill(this.generateId(), 'ヒール', 'MP', 4, '味方単体', '味方1人のHPを小回復');
        this.skills = [fire, heal];
        this.saveSkillsToLocalStorage();
    }


    // スキル追加
    addSkill(skill) {
        if (!skill.id) skill.id = this.generateId();
        this.skills.push(skill);
        // 親スキルがあれば親のchildIdsに追加
        if (skill.parentId) {
            const parent = this.skills.find(s => s.id === skill.parentId);
            if (parent && !parent.childIds.includes(skill.id)) {
                parent.childIds.push(skill.id);
            }
        }
        this.saveSkillsToLocalStorage();
    }

    // スキル更新
    updateSkill(skill) {
        const idx = this.skills.findIndex(s => s.id === skill.id);
        if (idx !== -1) {
            // 親子関係の更新
            const oldParentId = this.skills[idx].parentId;
            if (oldParentId && oldParentId !== skill.parentId) {
                // 古い親から子IDを削除
                const oldParent = this.skills.find(s => s.id === oldParentId);
                if (oldParent) {
                    oldParent.childIds = oldParent.childIds.filter(cid => cid !== skill.id);
                }
            }
            if (skill.parentId) {
                const newParent = this.skills.find(s => s.id === skill.parentId);
                if (newParent && !newParent.childIds.includes(skill.id)) {
                    newParent.childIds.push(skill.id);
                }
            }
            this.skills[idx] = skill;
            this.saveSkillsToLocalStorage();
        }
    }

    // スキル削除
    deleteSkill(skillId) {
        // 親のchildIdsからも削除
        const skill = this.skills.find(s => s.id === skillId);
        if (skill && skill.parentId) {
            const parent = this.skills.find(s => s.id === skill.parentId);
            if (parent) {
                parent.childIds = parent.childIds.filter(cid => cid !== skillId);
            }
        }
        // 子スキルの親IDもクリア
        if (skill && skill.childIds && skill.childIds.length > 0) {
            skill.childIds.forEach(cid => {
                const child = this.skills.find(s => s.id === cid);
                if (child) child.parentId = '';
            });
        }
        this.skills = this.skills.filter(s => s.id !== skillId);
        this.saveSkillsToLocalStorage();
    }

    // スキル全取得
    getAllSkills() {
        return this.skills;
    }

    // スキル保存
    saveSkillsToLocalStorage() {
        try {
            localStorage.setItem(this.getStorageKey('skills'), JSON.stringify(this.skills));
        } catch (e) {
            console.error('スキル保存エラー:', e);
        }
    }

    // スキル読込
    loadSkillsFromLocalStorage() {
        try {
            const skillsData = localStorage.getItem(this.getStorageKey('skills'));
            if (skillsData) {
                const parsed = JSON.parse(skillsData);
                this.skills = parsed.map(s => {
                    // IDがなければ生成
                    if (!s.id) s.id = this.generateId();
                    return new Skill(
                        s.id, s.name, s.costType, s.costValue, s.target, s.description,
                        s.parentId || '', s.childIds || [], s.system || ''
                    );
                });
            }
        } catch (e) {
            console.error('スキル読込エラー:', e);
        }
    }

    // キーを生成
    getStorageKey(key) {
        return this.getKeyPrefix() + key;
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
            localStorage.setItem(this.getStorageKey('monsters'), JSON.stringify(this.monsters));
            localStorage.setItem(this.getStorageKey('items'), JSON.stringify(this.items));
        } catch (e) {
            console.error('データ保存エラー:', e);
        }
    }

    loadFromLocalStorage() {
        try {
            const monstersData = localStorage.getItem(this.getStorageKey('monsters'));
            const itemsData = localStorage.getItem(this.getStorageKey('items'));

            if (monstersData) {
                const parsed = JSON.parse(monstersData);
                this.monsters = parsed.map(m => {
                    // baseStatsがあればそれを優先、なければ従来通り
                    let statsObj = {};
                    if (m.baseStats && typeof m.baseStats === 'object') {
                        statsObj = { ...m.baseStats };
                    } else if (window && window.masterManager && window.masterManager.masterConfig && window.masterManager.masterConfig.characterStats) {
                        window.masterManager.masterConfig.characterStats.forEach(stat => {
                            if (m[stat.id] !== undefined) statsObj[stat.id] = m[stat.id];
                        });
                    } else {
                        ['hp','mp','attack','defense','speed','luck'].forEach(id => {
                            if (m[id] !== undefined) statsObj[id] = m[id];
                        });
                    }
                    return new Monster(
                        m.id, m.name, m.dangerLevel || m.danger, m.rarity, 
                        m.dropItems.map(d => new DropItem(d.itemName, d.probability)), 
                        m.imageUrl || '', m.description || '', m.exp || 0, statsObj
                    );
                });
            }

            if (itemsData) {
                const parsed = JSON.parse(itemsData);
                this.items = parsed.map(i => 
                    new Item(i.id, i.name, i.type, i.rarity, i.imageUrl || '', i.description || '', i.effect || '', i.tags || [])
                );
            }
        } catch (e) {
            console.error('データ読み込みエラー:', e);
        }
    }

    clearAll() {
        this.monsters = [];
        this.items = [];
        localStorage.removeItem(this.getStorageKey('monsters'));
        localStorage.removeItem(this.getStorageKey('items'));
        
        // プロジェクト固有のデータもクリア
        const prefix = this.getKeyPrefix();
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix) && !key.includes('project_') && !key.includes('auto_backup')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }
}

// バックアップ管理クラス
class BackupManager {
    constructor() {
        this.autoBackupInterval = null;
        this.autoBackupEnabled = this.getAutoBackupSetting();
        this.autoBackupIntervalMinutes = this.getAutoBackupInterval();
        
        if (this.autoBackupEnabled) {
            this.startAutoBackup();
        }
    }

    // 自動バックアップ設定を取得
    getAutoBackupSetting() {
        const setting = localStorage.getItem('rpg_auto_backup_enabled');
        return setting === null ? true : setting === 'true';
    }

    // 自動バックアップ間隔を取得（分）
    getAutoBackupInterval() {
        const interval = localStorage.getItem('rpg_auto_backup_interval');
        return interval ? parseInt(interval) : 30; // デフォルト30分
    }

    // 自動バックアップ設定を保存
    setAutoBackupSetting(enabled, intervalMinutes) {
        this.autoBackupEnabled = enabled;
        this.autoBackupIntervalMinutes = intervalMinutes;
        localStorage.setItem('rpg_auto_backup_enabled', enabled);
        localStorage.setItem('rpg_auto_backup_interval', intervalMinutes);
        
        if (enabled) {
            this.startAutoBackup();
        } else {
            this.stopAutoBackup();
        }
    }

    // 自動バックアップ開始
    startAutoBackup() {
        this.stopAutoBackup(); // 既存のタイマーをクリア
        
        const intervalMs = this.autoBackupIntervalMinutes * 60 * 1000;
        this.autoBackupInterval = setInterval(() => {
            this.createAutoBackup();
        }, intervalMs);
        
        console.log(`自動バックアップを開始しました（${this.autoBackupIntervalMinutes}分間隔）`);
    }

    // 自動バックアップ停止
    stopAutoBackup() {
        if (this.autoBackupInterval) {
            clearInterval(this.autoBackupInterval);
            this.autoBackupInterval = null;
            console.log('自動バックアップを停止しました');
        }
    }

    // 自動バックアップ作成
    createAutoBackup() {
        try {
            const backupData = this.getAllData();
            const timestamp = new Date().toISOString();
            
            // localStorageに最新の自動バックアップを保存
            localStorage.setItem('rpg_auto_backup_latest', JSON.stringify({
                timestamp,
                data: backupData
            }));
            
            console.log('自動バックアップを作成しました:', timestamp);
        } catch (e) {
            console.error('自動バックアップ作成エラー:', e);
        }
    }

    // 手動バックアップ（ファイルダウンロード）
    createManualBackup() {
        try {
            const backupData = this.getAllData();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `rpg_backup_${timestamp}.json`;
            
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (e) {
            console.error('手動バックアップ作成エラー:', e);
            return false;
        }
    }

    // すべてのデータを取得
    getAllData() {
        const data = {};
        
        // localStorageからすべてのRPG関連データを取得
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('rpg_')) {
                try {
                    const value = localStorage.getItem(key);
                    data[key] = JSON.parse(value);
                } catch (e) {
                    // JSON以外のデータはそのまま保存
                    data[key] = localStorage.getItem(key);
                }
            }
        }
        
        return data;
    }

    // バックアップからリストア
    restoreBackup(backupData) {
        try {
            // 既存のRPG関連データをクリア
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('rpg_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // バックアップデータを復元
            Object.keys(backupData).forEach(key => {
                const value = backupData[key];
                if (typeof value === 'object') {
                    localStorage.setItem(key, JSON.stringify(value));
                } else {
                    localStorage.setItem(key, value);
                }
            });
            
            return true;
        } catch (e) {
            console.error('バックアップリストアエラー:', e);
            return false;
        }
    }

    // ファイルからバックアップをリストア
    restoreFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const backupData = JSON.parse(e.target.result);
                    const success = this.restoreBackup(backupData);
                    if (success) {
                        resolve(true);
                    } else {
                        reject(new Error('リストアに失敗しました'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('ファイル読み込みエラー'));
            reader.readAsText(file);
        });
    }

    // 最新の自動バックアップを取得
    getLatestAutoBackup() {
        const backup = localStorage.getItem('rpg_auto_backup_latest');
        return backup ? JSON.parse(backup) : null;
    }

    // バックアップ情報を取得
    getBackupInfo() {
        const latestAutoBackup = this.getLatestAutoBackup();
        const dataSize = new Blob([JSON.stringify(this.getAllData())]).size;
        
        return {
            autoBackupEnabled: this.autoBackupEnabled,
            autoBackupInterval: this.autoBackupIntervalMinutes,
            lastBackupTime: latestAutoBackup ? new Date(latestAutoBackup.timestamp).toLocaleString('ja-JP') : null,
            dataSize: (dataSize / 1024).toFixed(2) + ' KB'
        };
    }

    // 自動バックアップが有効か確認
    isAutoBackupEnabled() {
        return this.autoBackupEnabled;
    }

    // 自動バックアップを有効/無効にする
    setAutoBackupEnabled(enabled) {
        this.autoBackupEnabled = enabled;
        localStorage.setItem('rpg_auto_backup_enabled', enabled);
        
        if (enabled) {
            this.startAutoBackup();
        } else {
            this.stopAutoBackup();
        }
    }

    // 自動バックアップ間隔を設定
    setAutoBackupInterval(intervalMinutes) {
        this.autoBackupIntervalMinutes = intervalMinutes;
        localStorage.setItem('rpg_auto_backup_interval', intervalMinutes);
        
        // 自動バックアップが有効な場合は再起動
        if (this.autoBackupEnabled) {
            this.startAutoBackup();
        }
    }
}

// プロジェクト管理クラス
class ProjectManager {
    constructor() {
        this.currentProjectId = this.getCurrentProjectId();
        this.projects = this.loadProjects();
        
        // 初回起動時にデフォルトプロジェクトを作成
        if (this.projects.length === 0) {
            this.createProject('デフォルトプロジェクト', '最初のRPGプロジェクト');
        }
    }

    // プロジェクトID生成
    generateProjectId() {
        return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 現在のプロジェクトIDを取得
    getCurrentProjectId() {
        return localStorage.getItem('rpg_current_project') || null;
    }

    // 現在のプロジェクトIDを設定
    setCurrentProjectId(projectId) {
        this.currentProjectId = projectId;
        localStorage.setItem('rpg_current_project', projectId);
    }

    // プロジェクト一覧を読み込み
    loadProjects() {
        const projectsJson = localStorage.getItem('rpg_projects');
        return projectsJson ? JSON.parse(projectsJson) : [];
    }

    // プロジェクト一覧を保存
    saveProjects() {
        localStorage.setItem('rpg_projects', JSON.stringify(this.projects));
    }

    // プロジェクトを作成
    createProject(name, description = '') {
        const projectId = this.generateProjectId();
        const project = {
            id: projectId,
            name: name,
            description: description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.projects.push(project);
        this.saveProjects();
        
        // 最初のプロジェクトの場合は自動的に選択
        if (this.projects.length === 1) {
            this.setCurrentProjectId(projectId);
        }
        
        return project;
    }

    // プロジェクトを取得
    getProject(projectId) {
        return this.projects.find(p => p.id === projectId);
    }

    // 現在のプロジェクトを取得
    getCurrentProject() {
        if (!this.currentProjectId) return null;
        return this.getProject(this.currentProjectId);
    }

    // プロジェクト一覧を取得
    getAllProjects() {
        return this.projects;
    }

    // プロジェクトを更新
    updateProject(projectId, name, description) {
        const project = this.getProject(projectId);
        if (project) {
            project.name = name;
            project.description = description;
            project.updatedAt = new Date().toISOString();
            this.saveProjects();
            return true;
        }
        return false;
    }

    // プロジェクトを削除
    deleteProject(projectId) {
        // プロジェクトのデータをすべて削除
        this.clearProjectData(projectId);
        
        // プロジェクト情報を削除
        this.projects = this.projects.filter(p => p.id !== projectId);
        this.saveProjects();
        
        // 削除したプロジェクトが現在のプロジェクトだった場合
        if (this.currentProjectId === projectId) {
            // 別のプロジェクトがあれば切り替え
            if (this.projects.length > 0) {
                this.switchProject(this.projects[0].id);
            } else {
                // プロジェクトがなくなった場合は新規作成
                const newProject = this.createProject('デフォルトプロジェクト', '新しいRPGプロジェクト');
                this.switchProject(newProject.id);
            }
        }
        
        return true;
    }

    // プロジェクトを切り替え
    switchProject(projectId) {
        const project = this.getProject(projectId);
        if (!project) return false;
        
        // 現在のプロジェクトIDを設定
        this.setCurrentProjectId(projectId);
        
        return true;
    }

    // プロジェクトのデータキープレフィックスを取得
    getProjectDataPrefix(projectId) {
        return `rpg_project_${projectId}_`;
    }

    // プロジェクトのデータをすべて削除
    clearProjectData(projectId) {
        const prefix = this.getProjectDataPrefix(projectId);
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    // プロジェクトのデータをエクスポート
    exportProjectData(projectId) {
        const prefix = this.getProjectDataPrefix(projectId);
        const projectData = {
            project: this.getProject(projectId),
            data: {}
        };
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                try {
                    const value = localStorage.getItem(key);
                    projectData.data[key] = JSON.parse(value);
                } catch (e) {
                    projectData.data[key] = localStorage.getItem(key);
                }
            }
        }
        
        return projectData;
    }

    // プロジェクトのデータをインポート
    importProjectData(projectData) {
        // プロジェクト情報を作成
        const project = this.createProject(
            projectData.project.name + ' (インポート)',
            projectData.project.description
        );
        
        // データをインポート
        const oldPrefix = this.getProjectDataPrefix(projectData.project.id);
        const newPrefix = this.getProjectDataPrefix(project.id);
        
        Object.keys(projectData.data).forEach(key => {
            const newKey = key.replace(oldPrefix, newPrefix);
            const value = projectData.data[key];
            
            if (typeof value === 'object') {
                localStorage.setItem(newKey, JSON.stringify(value));
            } else {
                localStorage.setItem(newKey, value);
            }
        });
        
        return project;
    }
}

// タグ管理クラス
class TagManager {
    constructor() {
        this.tags = this.loadTags();
    }

    // タグ一覧をlocalStorageから読み込み
    loadTags() {
        const saved = localStorage.getItem('rpg_tags');
        return saved ? JSON.parse(saved) : [];
    }

    // タグ一覧をlocalStorageに保存
    saveTags() {
        localStorage.setItem('rpg_tags', JSON.stringify(this.tags));
    }

    // タグを追加
    addTag(tagName, color = '#3498db') {
        const tag = {
            id: 'tag_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: tagName,
            color: color,
            createdAt: new Date().toISOString()
        };
        
        this.tags.push(tag);
        this.saveTags();
        return tag;
    }

    // タグを削除
    deleteTag(tagId) {
        this.tags = this.tags.filter(t => t.id !== tagId);
        this.saveTags();
    }

    // タグを更新
    updateTag(tagId, tagName, color) {
        const tag = this.tags.find(t => t.id === tagId);
        if (tag) {
            tag.name = tagName;
            tag.color = color;
            this.saveTags();
        }
    }

    // タグを取得
    getTag(tagId) {
        return this.tags.find(t => t.id === tagId);
    }

    // タグ名でタグを取得
    getTagByName(tagName) {
        return this.tags.find(t => t.name === tagName);
    }

    // 全タグを取得
    getAllTags() {
        return this.tags;
    }

    // タグ名から自動的にタグを取得または作成
    getOrCreateTag(tagName) {
        let tag = this.getTagByName(tagName);
        if (!tag) {
            tag = this.addTag(tagName);
        }
        return tag;
    }

    // タグIDの配列からタグオブジェクトの配列を取得
    getTagsById(tagIds) {
        return tagIds.map(id => this.getTag(id)).filter(t => t);
    }
}
