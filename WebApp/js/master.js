// マスタ情報管理モジュール

class MasterDataManager {
        // スキル系統管理
        addSkillSystem(value) {
            if (!this.masterConfig.skillSystems) this.masterConfig.skillSystems = [];
            if (!this.masterConfig.skillSystems.includes(value)) {
                this.masterConfig.skillSystems.push(value);
                this.saveMasterConfig();
                return true;
            }
            return false;
        }

        removeSkillSystem(value) {
            if (!this.masterConfig.skillSystems) return;
            this.masterConfig.skillSystems = this.masterConfig.skillSystems.filter(s => s !== value);
            this.saveMasterConfig();
        }

        moveSkillSystem(index, direction) {
            const systems = this.masterConfig.skillSystems;
            if (!systems) return;
            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= systems.length) return;
            [systems[index], systems[newIndex]] = [systems[newIndex], systems[index]];
            this.saveMasterConfig();
        }
    constructor() {
        this.masterConfig = this.loadMasterConfig();
    }

    // マスタ設定を読み込み
    loadMasterConfig() {
        const saved = localStorage.getItem('masterConfig');
        let config;
        if (saved) {
            try {
                config = JSON.parse(saved);
            } catch (e) {
                // パース失敗時は初期化
                config = null;
            }
            // 必須フィールドがなければ初期化
            if (!config || typeof config !== 'object' || !Array.isArray(config.characterStats) || !config.levelUpConfig) {
                config = null;
            }
        }
        if (config) {
            // 新規追加項目のデフォルト値を設定
            if (!config.jobBonuses) config.jobBonuses = {};
            if (!config.raceBonuses) config.raceBonuses = {};
            if (!config.levelUpConfig) {
                config.levelUpConfig = {
                    hp: 10,
                    mp: 5,
                    attack: 1,
                    defense: 1,
                    speed: 1,
                    luck: 1
                };
            }
            return config;
        }

        // デフォルト設定
        // キャラクターステータスをmonsterFieldsに追加
        const characterStats = [
            { id: 'hp', label: 'HP', type: 'number', required: false, system: true },
            { id: 'mp', label: 'MP', type: 'number', required: false, system: true },
            { id: 'attack', label: '攻撃力', type: 'number', required: false, system: true },
            { id: 'defense', label: '防御力', type: 'number', required: false, system: true },
            { id: 'speed', label: '素早さ', type: 'number', required: false, system: true },
            { id: 'luck', label: '運', type: 'number', required: false, system: true }
        ];
        return {
            monsterFields: [
                { id: 'name', label: '名前', type: 'text', required: true, system: true },
                { id: 'danger', label: '危険度', type: 'select', required: true, system: true },
                { id: 'rarity', label: 'レア度', type: 'select', required: true, system: true },
                ...characterStats
            ],
            itemFields: [
                { id: 'name', label: '名前', type: 'text', required: true, system: true },
                { id: 'type', label: '種類', type: 'select', required: true, system: true },
                { id: 'rarity', label: 'レアリティ', type: 'select', required: true, system: true }
            ],
            itemEffectTypes: [
                '回復', '強化', '弱化', '攻撃', '防御', 'その他'
            ],
            itemEffectTargets: [
                'HP', 'MP', '攻撃力', '防御力', '素早さ', '運', '使用対象', '使用箇所'
            ],
            characterJobs: ['戦士', '魔法使い', '僧侶', '盗賊', '騎士', '弓使い', '召喚士'],
            characterRaces: ['人間', 'エルフ', 'ドワーフ', '獣人', 'ドラゴニュート', '天使', '悪魔'],
            characterElements: ['無', '火', '水', '風', '土', '光', '闇', '雷', '氷'],
            characterStats: [
                { id: 'hp', label: 'HP', defaultValue: 100, system: true },
                { id: 'mp', label: 'MP', defaultValue: 50, system: true },
                { id: 'attack', label: '攻撃力', defaultValue: 10, system: true },
                { id: 'defense', label: '防御力', defaultValue: 10, system: true },
                { id: 'speed', label: '素早さ', defaultValue: 10, system: true },
                { id: 'luck', label: '運', defaultValue: 10, system: true }
            ],
            skillSystems: [
                '物理魔法', '精神魔法', '系統外魔法', '補助魔法',
                '斬撃系', '打撃系', '刺突系', '気力系', '強化系'
            ],
            workGenres: ['ファンタジー', 'SF', 'ミステリー', 'ホラー', '恋愛', '冒険', '歴史', '現代', 'その他'],
            timeOfDay: ['早朝', '朝', '午前', '昼', '午後', '夕方', '夜', '深夜', '不明'],
            monsterRarities: ['☆', '★', '★★', '★★★', '★★★★', '★★★★★', '★★★★★★'],
            itemRarities: ['コモン', 'アンコモン', 'レア', 'エピック', 'レジェンド', 'ミシック', 'イモータル', 'レガリア', 'ディヴァイン'],
            dangerLevels: ['極低', '低', '中', '高', '極高'],
            itemTypes: ['消耗品', '素材', '装備', 'カード', 'スキルオーブ', 'その他'],
            jobBonuses: {},
            raceBonuses: {},
            levelUpConfig: {
                hp: 10,
                mp: 5,
                attack: 1,
                defense: 1,
                speed: 1,
                luck: 1
            }
        };
    }

    // マスタ設定を保存
    saveMasterConfig() {
        localStorage.setItem('masterConfig', JSON.stringify(this.masterConfig));
        this.updateAllSelects();
    }

    // モンスター項目を追加
    addMonsterField(label, type) {
        const id = 'custom_' + Date.now();
        this.masterConfig.monsterFields.push({
            id,
            label,
            type,
            required: false,
            system: false
        });
        this.saveMasterConfig();
        return id;
    }

    // アイテム項目を追加
    addItemField(label, type) {
        const id = 'custom_' + Date.now();
        this.masterConfig.itemFields.push({
            id,
            label,
            type,
            required: false,
            system: false
        });
        this.saveMasterConfig();
        return id;
    }

    // 項目を削除
    removeMonsterField(id) {
        const field = this.masterConfig.monsterFields.find(f => f.id === id);
        if (field && field.system) {
            alert('システム項目は削除できません');
            return false;
        }
        this.masterConfig.monsterFields = this.masterConfig.monsterFields.filter(f => f.id !== id);
        this.saveMasterConfig();
        return true;
    }

    removeItemField(id) {
        const field = this.masterConfig.itemFields.find(f => f.id === id);
        if (field && field.system) {
            alert('システム項目は削除できません');
            return false;
        }
        this.masterConfig.itemFields = this.masterConfig.itemFields.filter(f => f.id !== id);
        this.saveMasterConfig();
        return true;
    }

    // レアリティ管理
    addMonsterRarity(value) {
        if (!this.masterConfig.monsterRarities.includes(value)) {
            this.masterConfig.monsterRarities.push(value);
            this.saveMasterConfig();
            return true;
        }
        return false;
    }

    removeMonsterRarity(value) {
        this.masterConfig.monsterRarities = this.masterConfig.monsterRarities.filter(r => r !== value);
        this.saveMasterConfig();
    }

    addItemRarity(value) {
        if (!this.masterConfig.itemRarities.includes(value)) {
            this.masterConfig.itemRarities.push(value);
            this.saveMasterConfig();
            return true;
        }
        return false;
    }

    removeItemRarity(value) {
        this.masterConfig.itemRarities = this.masterConfig.itemRarities.filter(r => r !== value);
        this.saveMasterConfig();
    }

    // 危険度管理
    addDangerLevel(value) {
        if (!this.masterConfig.dangerLevels.includes(value)) {
            this.masterConfig.dangerLevels.push(value);
            this.saveMasterConfig();
            return true;
        }
        return false;
    }

    removeDangerLevel(value) {
        this.masterConfig.dangerLevels = this.masterConfig.dangerLevels.filter(d => d !== value);
        this.saveMasterConfig();
    }

    // アイテム種類管理
    addItemType(value) {
        if (!this.masterConfig.itemTypes.includes(value)) {
            this.masterConfig.itemTypes.push(value);
            this.saveMasterConfig();
            return true;
        }
        return false;
    }

    removeItemType(value) {
        this.masterConfig.itemTypes = this.masterConfig.itemTypes.filter(t => t !== value);
        this.saveMasterConfig();
    }

    // キャラクター職業管理
    addCharacterJob(value) {
        if (!this.masterConfig.characterJobs) this.masterConfig.characterJobs = [];
        if (!this.masterConfig.characterJobs.includes(value)) {
            this.masterConfig.characterJobs.push(value);
            this.saveMasterConfig();
            return true;
        }
        return false;
    }

    removeCharacterJob(value) {
        if (!this.masterConfig.characterJobs) return;
        this.masterConfig.characterJobs = this.masterConfig.characterJobs.filter(j => j !== value);
        this.saveMasterConfig();
    }

    // キャラクター種族管理
    addCharacterRace(value) {
        if (!this.masterConfig.characterRaces) this.masterConfig.characterRaces = [];
        if (!this.masterConfig.characterRaces.includes(value)) {
            this.masterConfig.characterRaces.push(value);
            this.saveMasterConfig();
            return true;
        }
        return false;
    }

    removeCharacterRace(value) {
        if (!this.masterConfig.characterRaces) return;
        this.masterConfig.characterRaces = this.masterConfig.characterRaces.filter(r => r !== value);
        this.saveMasterConfig();
    }

    // キャラクター属性管理
    addCharacterElement(value) {
        if (!this.masterConfig.characterElements) this.masterConfig.characterElements = [];
        if (!this.masterConfig.characterElements.includes(value)) {
            this.masterConfig.characterElements.push(value);
            this.saveMasterConfig();
            return true;
        }
        return false;
    }

    removeCharacterElement(value) {
        if (!this.masterConfig.characterElements) return;
        this.masterConfig.characterElements = this.masterConfig.characterElements.filter(e => e !== value);
        this.saveMasterConfig();
    }

    // キャラクターステータス項目管理
    addCharacterStat(label, defaultValue = 10) {
        if (!this.masterConfig.characterStats) this.masterConfig.characterStats = [];
        if (!this.masterConfig.monsterFields) this.masterConfig.monsterFields = [];
        const id = 'custom_stat_' + Date.now();
        // キャラクター用
        this.masterConfig.characterStats.push({
            id,
            label,
            defaultValue: parseInt(defaultValue),
            system: false
        });
        // モンスター用にも同じID・ラベル・type=numberで追加
        this.masterConfig.monsterFields.push({
            id,
            label,
            type: 'number',
            required: false,
            system: false
        });
        this.saveMasterConfig();
        return id;
    }

    removeCharacterStat(id) {
        if (!this.masterConfig.characterStats) return false;
        const stat = this.masterConfig.characterStats.find(s => s.id === id);
        if (stat && stat.system) {
            alert('システムステータスは削除できません');
            return false;
        }
        this.masterConfig.characterStats = this.masterConfig.characterStats.filter(s => s.id !== id);
        this.saveMasterConfig();
        return true;
    }

    updateCharacterStat(id, label, defaultValue) {
        if (!this.masterConfig.characterStats) return false;
        const stat = this.masterConfig.characterStats.find(s => s.id === id);
        if (stat) {
            stat.label = label;
            stat.defaultValue = parseInt(defaultValue);
            this.saveMasterConfig();
            return true;
        }
        return false;
    }

    // すべてのセレクトボックスを更新
    updateAllSelects() {
                // スキル系統セレクト更新
                const skillSystemSelects = document.querySelectorAll('select#skillSystem, select[data-field="skillSystem"]');
                skillSystemSelects.forEach(select => {
                    const currentValue = select.value;
                    select.innerHTML = '<option value="">-- 系統を選択 --</option>' +
                        (this.masterConfig.skillSystems || []).map(s => `<option value="${s}">${s}</option>`).join('');
                    if (currentValue) select.value = currentValue;
                });
        // 危険度セレクト更新
        const dangerSelects = document.querySelectorAll('select[data-field="danger"]');
        dangerSelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = this.masterConfig.dangerLevels.map(d => 
                `<option value="${d}">${d}</option>`
            ).join('');
            if (currentValue) select.value = currentValue;
        });

        // モンスターレアリティセレクト更新
        const monsterRaritySelects = document.querySelectorAll('select[data-field="monsterRarity"]');
        monsterRaritySelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = this.masterConfig.monsterRarities.map(r => 
                `<option value="${r}">${r}</option>`
            ).join('');
            if (currentValue) select.value = currentValue;
        });

        // アイテムレアリティセレクト更新
        const itemRaritySelects = document.querySelectorAll('select[data-field="itemRarity"]');
        itemRaritySelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = this.masterConfig.itemRarities.map(r => 
                `<option value="${r}">${r}</option>`
            ).join('');
            if (currentValue) select.value = currentValue;
        });

        // アイテム種類セレクト更新
        const itemTypeSelects = document.querySelectorAll('select[data-field="itemType"]');
        itemTypeSelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = this.masterConfig.itemTypes.map(t => 
                `<option value="${t}">${t}</option>`
            ).join('');
            if (currentValue) select.value = currentValue;
        });
    }
}

// マスタ管理UI
class MasterUI {
            renderSkillSystems() {
                const container = document.getElementById('skillSystemList');
                if (!container) return;
                const systems = this.masterManager.masterConfig.skillSystems || [];
                container.innerHTML = systems.map((system, index) => `
                    <div class="skill-system-item">
                        <div class="field-info">
                            <span class="field-value">${system}</span>
                        </div>
                        <div class="field-actions">
                            <button class="btn btn-secondary btn-sm" onclick="masterUI.moveSkillSystem(${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
                            <button class="btn btn-secondary btn-sm" onclick="masterUI.moveSkillSystem(${index}, 1)" ${index === systems.length - 1 ? 'disabled' : ''}>↓</button>
                            <button class="btn btn-danger btn-sm" onclick="masterUI.removeSkillSystem('${system}')">削除</button>
                        </div>
                    </div>
                `).join('');
            }
        // 成長値編集UIを描画
        renderLevelUpConfig() {
            const levelUpConfig = this.masterManager.masterConfig.levelUpConfig || {};
            const stats = this.masterManager.masterConfig.characterStats || [];
            // 共通成長値のみ表示
            const levelUpDiv = document.getElementById('levelUpConfigFields');
            if (levelUpDiv) {
                let html = '<h4>共通成長値</h4>';
                html += '<div class="levelup-fields-row">';
                stats.forEach(stat => {
                    html += `<div class="form-group" style="display:inline-block;margin-right:10px;">
                        <label>${stat.label}</label>
                        <input type="number" class="form-control" name="levelUp_${stat.id}" value="${levelUpConfig[stat.id] ?? 1}" style="width:70px;display:block;">
                    </div>`;
                });
                html += '</div>';
                levelUpDiv.innerHTML = html;
            }
        }
    constructor(masterManager) {
        this.masterManager = masterManager;
        this.initializeEventListeners();
        this.render();
    }

    initializeEventListeners() {
                // スキル系統追加
                document.getElementById('addSkillSystemBtn')?.addEventListener('click', () => {
                    this.showAddValueModal('skillSystem', 'スキル系統');
                });
        // モンスター項目追加
        document.getElementById('addMonsterFieldBtn')?.addEventListener('click', () => {
            this.showAddFieldModal('monster');
        });

        // アイテム項目追加
        document.getElementById('addItemFieldBtn')?.addEventListener('click', () => {
            this.showAddFieldModal('item');
        });

        // レアリティ追加
        document.getElementById('addMonsterRarityBtn')?.addEventListener('click', () => {
            this.showAddValueModal('monsterRarity', 'モンスターレアリティ');
        });

        document.getElementById('addItemRarityBtn')?.addEventListener('click', () => {
            this.showAddValueModal('itemRarity', 'アイテムレアリティ');
        });

        // 危険度追加
        document.getElementById('addDangerLevelBtn')?.addEventListener('click', () => {
            this.showAddValueModal('dangerLevel', '危険度');
        });

        // アイテム種類追加
        document.getElementById('addItemTypeBtn')?.addEventListener('click', () => {
            this.showAddValueModal('itemType', 'アイテム種類');
        });

        // キャラクター職業追加
        document.getElementById('addCharacterJobBtn')?.addEventListener('click', () => {
            this.showAddValueModal('characterJob', '職業');
        });

        // キャラクター種族追加
        document.getElementById('addCharacterRaceBtn')?.addEventListener('click', () => {
            this.showAddValueModal('characterRace', '種族');
        });

        // キャラクター属性追加
        document.getElementById('addCharacterElementBtn')?.addEventListener('click', () => {
            this.showAddValueModal('characterElement', '属性');
        });

        // キャラクターステータス項目追加
        document.getElementById('addCharacterStatBtn')?.addEventListener('click', () => {
            this.showAddStatModal();
        });
    }

    render() {
        this.renderSkillSystems();
        this.renderMonsterFields();
        this.renderItemFields();
        this.renderMonsterRarities();
        this.renderItemRarities();
        this.renderDangerLevels();
        this.renderItemTypes();
        this.renderItemEffectTypes();
        this.renderItemEffectTargets();
        this.renderCharacterJobs();
        this.renderCharacterRaces();
        this.renderCharacterElements();
        this.renderCharacterStats();
        this.renderJobBonuses();
        this.renderRaceBonuses();
        this.renderLevelUpConfig();
        // ドラッグ&ドロップイベントを設定
        this.setupDragAndDrop();
    }

    renderItemEffectTypes() {
        const container = document.getElementById('itemEffectTypeList');
        if (!container) return;
        const types = this.masterManager.masterConfig.itemEffectTypes || [];
        container.innerHTML = types.map((type, index) => `
            <div class="item-effect-type-item">
                <span class="field-value">${type}</span>
                <div class="field-actions">
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveItemEffectType(${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveItemEffectType(${index}, 1)" ${index === types.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn btn-danger btn-sm" onclick="masterUI.removeItemEffectType('${type}')">削除</button>
                </div>
            </div>
        `).join('');
    }

    renderItemEffectTargets() {
        const container = document.getElementById('itemEffectTargetList');
        if (!container) return;
        const targets = this.masterManager.masterConfig.itemEffectTargets || [];
        container.innerHTML = targets.map((target, index) => `
            <div class="item-effect-target-item">
                <span class="field-value">${target}</span>
                <div class="field-actions">
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveItemEffectTarget(${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveItemEffectTarget(${index}, 1)" ${index === targets.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn btn-danger btn-sm" onclick="masterUI.removeItemEffectTarget('${target}')">削除</button>
                </div>
            </div>
        `).join('');
    }

    moveItemEffectType(index, direction) {
        const types = this.masterManager.masterConfig.itemEffectTypes;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= types.length) return;
        [types[index], types[newIndex]] = [types[newIndex], types[index]];
        this.masterManager.saveMasterConfig();
        this.render();
    }
    moveItemEffectTarget(index, direction) {
        const targets = this.masterManager.masterConfig.itemEffectTargets;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= targets.length) return;
        [targets[index], targets[newIndex]] = [targets[newIndex], targets[index]];
        this.masterManager.saveMasterConfig();
        this.render();
    }
    removeItemEffectType(type) {
        this.masterManager.masterConfig.itemEffectTypes = this.masterManager.masterConfig.itemEffectTypes.filter(t => t !== type);
        this.masterManager.saveMasterConfig();
        this.render();
    }
    removeItemEffectTarget(target) {
        this.masterManager.masterConfig.itemEffectTargets = this.masterManager.masterConfig.itemEffectTargets.filter(t => t !== target);
        this.masterManager.saveMasterConfig();
        this.render();
    }

    initializeEventListeners() {
        // ...既存...
        // 効果種類追加
        document.getElementById('addItemEffectTypeBtn')?.addEventListener('click', () => {
            this.showAddValueModal('itemEffectType', '効果の種類');
        });
        // 効果箇所追加
        document.getElementById('addItemEffectTargetBtn')?.addEventListener('click', () => {
            this.showAddValueModal('itemEffectTarget', '効果の箇所');
        });
        // ...既存...
        // 既存イベントはそのまま...
        // ...
    }


    setupDragAndDrop() {
        // モンスター項目
        this.setupDragForContainer('monsterFieldsList', 'monsterFields');
        // アイテム項目
        this.setupDragForContainer('itemFieldsList', 'itemFields');
        // モンスターレアリティ
        this.setupDragForContainer('monsterRarityList', 'monsterRarities');
        // アイテムレアリティ
        this.setupDragForContainer('itemRarityList', 'itemRarities');
        // 危険度
        this.setupDragForContainer('dangerLevelList', 'dangerLevels');
        // アイテム種類
        this.setupDragForContainer('itemTypeList', 'itemTypes');
    }

    setupDragForContainer(containerId, configKey) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const items = container.querySelectorAll('.master-field-item, .rarity-item, .danger-item, .item-type-item');
        
        items.forEach((item, index) => {
            item.setAttribute('draggable', 'true');
            item.style.cursor = 'move';
            
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index.toString());
                e.dataTransfer.setData('configKey', configKey);
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                const afterElement = this.getDragAfterElement(container, e.clientY);
                const dragging = container.querySelector('.dragging');
                
                if (afterElement == null) {
                    container.appendChild(dragging);
                } else {
                    container.insertBefore(dragging, afterElement);
                }
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const fromConfigKey = e.dataTransfer.getData('configKey');
                
                if (fromConfigKey !== configKey) return;
                
                const items = Array.from(container.querySelectorAll('.master-field-item, .rarity-item, .danger-item, .item-type-item'));
                const toIndex = items.indexOf(item);
                
                this.reorderItems(configKey, fromIndex, toIndex);
            });
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.master-field-item:not(.dragging), .rarity-item:not(.dragging), .danger-item:not(.dragging), .item-type-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    reorderItems(configKey, fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        
        const config = this.masterManager.masterConfig[configKey];
        const item = config.splice(fromIndex, 1)[0];
        config.splice(toIndex, 0, item);
        
        this.masterManager.saveMasterConfig();
        this.render();
    }

    renderMonsterFields() {
        const container = document.getElementById('monsterFieldsList');
        if (!container) return;
        const fields = this.masterManager.masterConfig.monsterFields;
        if (fields.length === 0) {
            container.innerHTML = '<p class="master-empty">項目がありません</p>';
            return;
        }
        container.innerHTML = fields.map((field, idx) => `
            <div class="master-field-item" data-field-id="${field.id}">
                <div class="field-info">
                    <span class="field-label">${field.label}</span>
                    <span class="field-type">${this.getTypeLabel(field.type)}</span>
                    ${field.required ? '<span class="field-type" style="background: var(--danger-color);">必須</span>' : ''}
                    ${field.system ? '<span class="field-type" style="background: var(--secondary-color);">システム</span>' : ''}
                </div>
                <div class="field-actions">
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveMonsterField(${idx}, -1)" ${idx === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveMonsterField(${idx}, 1)" ${idx === fields.length - 1 ? 'disabled' : ''}>↓</button>
                    ${!field.system ? `<button class="btn btn-danger btn-sm" onclick="masterUI.removeMonsterField('${field.id}')">削除</button>` : ''}
                </div>
            </div>
        `).join('');
    }

    renderItemFields() {
        const container = document.getElementById('itemFieldsList');
        if (!container) return;
        const fields = this.masterManager.masterConfig.itemFields;
        if (fields.length === 0) {
            container.innerHTML = '<p class="master-empty">項目がありません</p>';
            return;
        }
        container.innerHTML = fields.map((field, idx) => `
            <div class="master-field-item" data-field-id="${field.id}">
                <div class="field-info">
                    <span class="field-label">${field.label}</span>
                    <span class="field-type">${this.getTypeLabel(field.type)}</span>
                    ${field.required ? '<span class="field-type" style="background: var(--danger-color);">必須</span>' : ''}
                    ${field.system ? '<span class="field-type" style="background: var(--secondary-color);">システム</span>' : ''}
                </div>
                <div class="field-actions">
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveItemField(${idx}, -1)" ${idx === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveItemField(${idx}, 1)" ${idx === fields.length - 1 ? 'disabled' : ''}>↓</button>
                    ${!field.system ? `<button class="btn btn-danger btn-sm" onclick="masterUI.removeItemField('${field.id}')">削除</button>` : ''}
                </div>
            </div>
        `).join('');
    }

    renderMonsterRarities() {
        const container = document.getElementById('monsterRarityList');
        if (!container) return;
        const rarities = this.masterManager.masterConfig.monsterRarities;
        container.innerHTML = rarities.map((rarity, idx) => `
            <div class="rarity-item">
                <div class="field-info">
                    <span class="field-value">${rarity}</span>
                </div>
                <div class="field-actions">
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveMonsterRarity(${idx}, -1)" ${idx === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveMonsterRarity(${idx}, 1)" ${idx === rarities.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn btn-danger btn-sm" onclick="masterUI.removeMonsterRarity('${rarity}')">削除</button>
                </div>
            </div>
        `).join('');
    }

    renderItemRarities() {
        const container = document.getElementById('itemRarityList');
        if (!container) return;
        const rarities = this.masterManager.masterConfig.itemRarities;
        container.innerHTML = rarities.map((rarity, idx) => `
            <div class="rarity-item">
                <div class="field-info">
                    <span class="field-value">${rarity}</span>
                </div>
                <div class="field-actions">
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveItemRarity(${idx}, -1)" ${idx === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveItemRarity(${idx}, 1)" ${idx === rarities.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn btn-danger btn-sm" onclick="masterUI.removeItemRarity('${rarity}')">削除</button>
                </div>
            </div>
        `).join('');
    }
    moveMonsterField(index, direction) {
        const fields = this.masterManager.masterConfig.monsterFields;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= fields.length) return;
        [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
        this.masterManager.saveMasterConfig();
        this.render();
    }
    moveItemField(index, direction) {
        const fields = this.masterManager.masterConfig.itemFields;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= fields.length) return;
        [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
        this.masterManager.saveMasterConfig();
        this.render();
    }
    moveMonsterRarity(index, direction) {
        const arr = this.masterManager.masterConfig.monsterRarities;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= arr.length) return;
        [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
        this.masterManager.saveMasterConfig();
        this.render();
    }
    moveItemRarity(index, direction) {
        const arr = this.masterManager.masterConfig.itemRarities;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= arr.length) return;
        [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
        this.masterManager.saveMasterConfig();
        this.render();
    }

    renderDangerLevels() {
        const container = document.getElementById('dangerLevelList');
        if (!container) return;

        const levels = this.masterManager.masterConfig.dangerLevels;
        container.innerHTML = levels.map(level => `
            <div class="danger-item">
                <div class="field-info">
                    <span class="field-value">${level}</span>
                </div>
                <div class="field-actions">
                    <button class="btn btn-danger btn-sm" onclick="masterUI.removeDangerLevel('${level}')">削除</button>
                </div>
            </div>
        `).join('');
    }

    renderItemTypes() {
        const container = document.getElementById('itemTypeList');
        if (!container) return;

        const types = this.masterManager.masterConfig.itemTypes;
        container.innerHTML = types.map(type => `
            <div class="item-type-item">
                <div class="field-info">
                    <span class="field-value">${type}</span>
                </div>
                <div class="field-actions">
                    <button class="btn btn-danger btn-sm" onclick="masterUI.removeItemType('${type}')">削除</button>
                </div>
            </div>
        `).join('');
    }

    getTypeLabel(type) {
        const labels = {
            text: 'テキスト',
            number: '数値',
            select: '選択',
            textarea: '長文'
        };
        return labels[type] || type;
    }

    showAddFieldModal(targetType) {
        const label = prompt(`${targetType === 'monster' ? 'モンスター' : 'アイテム'}の項目名を入力してください:`);
        if (!label) return;

        const type = prompt('項目タイプを選択してください:\n1: テキスト\n2: 数値\n3: 選択\n4: 長文', '1');
        const typeMap = { '1': 'text', '2': 'number', '3': 'select', '4': 'textarea' };
        const fieldType = typeMap[type] || 'text';

        if (targetType === 'monster') {
            this.masterManager.addMonsterField(label, fieldType);
        } else {
            this.masterManager.addItemField(label, fieldType);
        }

        this.render();
    }

    showAddValueModal(type, label) {
        const value = prompt(`${label}を入力してください:`);
        if (!value) return;

        let success = false;
        switch (type) {
            case 'monsterRarity':
                success = this.masterManager.addMonsterRarity(value);
                break;
            case 'itemRarity':
                success = this.masterManager.addItemRarity(value);
                break;
            case 'dangerLevel':
                success = this.masterManager.addDangerLevel(value);
                break;
            case 'itemType':
                success = this.masterManager.addItemType(value);
                break;
            case 'characterJob':
                success = this.masterManager.addCharacterJob(value);
                break;
            case 'characterRace':
                success = this.masterManager.addCharacterRace(value);
                break;
            case 'characterElement':
                success = this.masterManager.addCharacterElement(value);
                break;
            case 'skillSystem':
                success = this.masterManager.addSkillSystem(value);
                break;
        }

        if (!success) {
            alert('既に存在します');
        }

        this.render();
    }

    removeSkillSystem(value) {
        if (confirm(`「${value}」を削除しますか？`)) {
            this.masterManager.removeSkillSystem(value);
            this.render();
        }
    }

    showAddStatModal() {
        const label = prompt('ステータス項目名を入力してください（例: 魔力、器用さ）:');
        if (!label) return;

        const defaultValue = prompt('初期値を入力してください:', '10');
        if (defaultValue === null) return;

        this.masterManager.addCharacterStat(label, defaultValue);
        this.render();
    }

    removeMonsterField(id) {
        if (confirm('この項目を削除しますか？')) {
            this.masterManager.removeMonsterField(id);
            this.render();
        }
    }

    removeItemField(id) {
        if (confirm('この項目を削除しますか？')) {
            this.masterManager.removeItemField(id);
            this.render();
        }
    }

    removeMonsterRarity(value) {
        if (confirm(`「${value}」を削除しますか？`)) {
            this.masterManager.removeMonsterRarity(value);
            this.render();
        }
    }

    removeItemRarity(value) {
        if (confirm(`「${value}」を削除しますか？`)) {
            this.masterManager.removeItemRarity(value);
            this.render();
        }
    }

    removeDangerLevel(value) {
        if (confirm(`「${value}」を削除しますか？`)) {
            this.masterManager.removeDangerLevel(value);
            this.render();
        }
    }

    removeItemType(value) {
        if (confirm(`「${value}」を削除しますか？`)) {
            this.masterManager.removeItemType(value);
            this.render();
        }
    }

    // キャラクター関連レンダリング
    renderCharacterJobs() {
        const container = document.getElementById('characterJobList');
        if (!container) return;

        const jobs = this.masterManager.masterConfig.characterJobs || [];
        container.innerHTML = jobs.map((job, index) => `
            <div class="character-job-item">
                <div class="field-info">
                    <span class="field-value">${job}</span>
                </div>
                <div class="field-actions">
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveCharacterJob(${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveCharacterJob(${index}, 1)" ${index === jobs.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn btn-danger btn-sm" onclick="masterUI.removeCharacterJob('${job}')">削除</button>
                </div>
            </div>
        `).join('');
    }

    renderCharacterRaces() {
        const container = document.getElementById('characterRaceList');
        if (!container) return;

        const races = this.masterManager.masterConfig.characterRaces || [];
        container.innerHTML = races.map((race, index) => `
            <div class="character-race-item">
                <div class="field-info">
                    <span class="field-value">${race}</span>
                </div>
                <div class="field-actions">
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveCharacterRace(${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveCharacterRace(${index}, 1)" ${index === races.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn btn-danger btn-sm" onclick="masterUI.removeCharacterRace('${race}')">削除</button>
                </div>
            </div>
        `).join('');
    }

    renderCharacterElements() {
        const container = document.getElementById('characterElementList');
        if (!container) return;

        const elements = this.masterManager.masterConfig.characterElements || [];
        container.innerHTML = elements.map((element, index) => `
            <div class="character-element-item">
                <div class="field-info">
                    <span class="field-value">${element}</span>
                </div>
                <div class="field-actions">
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveCharacterElement(${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveCharacterElement(${index}, 1)" ${index === elements.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn btn-danger btn-sm" onclick="masterUI.removeCharacterElement('${element}')">削除</button>
                </div>
            </div>
        `).join('');
    }

    renderCharacterStats() {
        const container = document.getElementById('characterStatsList');
        if (!container) return;

        const stats = this.masterManager.masterConfig.characterStats || [];
        container.innerHTML = stats.map((stat, index) => `
            <div class="character-stat-item" ${!stat.system ? 'draggable="true"' : ''}>
                <div class="field-info">
                    <span class="field-label">${stat.label}</span>
                    <span class="field-detail">初期値: ${stat.defaultValue}</span>
                    ${stat.system ? '<span class="system-badge">システム</span>' : ''}
                </div>
                <div class="field-actions">
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveCharacterStat(${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn btn-secondary btn-sm" onclick="masterUI.moveCharacterStat(${index}, 1)" ${index === stats.length - 1 ? 'disabled' : ''}>↓</button>
                    ${!stat.system ? `
                        <button class="btn btn-secondary btn-sm" onclick="masterUI.editCharacterStat('${stat.id}', '${stat.label}', ${stat.defaultValue})">編集</button>
                        <button class="btn btn-danger btn-sm" onclick="masterUI.removeCharacterStat('${stat.id}')">削除</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // キャラクター関連削除
    removeCharacterJob(value) {
        if (confirm(`職業「${value}」を削除しますか？`)) {
            this.masterManager.removeCharacterJob(value);
            this.render();
        }
    }

    removeCharacterRace(value) {
        if (confirm(`種族「${value}」を削除しますか？`)) {
            this.masterManager.removeCharacterRace(value);
            this.render();
        }
    }

    removeCharacterElement(value) {
        if (confirm(`属性「${value}」を削除しますか？`)) {
            this.masterManager.removeCharacterElement(value);
            this.render();
        }
    }

    removeCharacterStat(id) {
        if (confirm('このステータス項目を削除しますか？')) {
            if (this.masterManager.removeCharacterStat(id)) {
                this.render();
            }
        }
    }

    editCharacterStat(id, currentLabel, currentValue) {
        const label = prompt('ステータス項目名:', currentLabel);
        if (!label) return;

        const defaultValue = prompt('初期値:', currentValue.toString());
        if (defaultValue === null) return;

        this.masterManager.updateCharacterStat(id, label, defaultValue);
        this.render();
    }

    // 順番入れ替え関数
    moveSkillSystem(index, direction) {
        this.masterManager.moveSkillSystem(index, direction);
        this.render();
    }
    moveCharacterJob(index, direction) {
        const jobs = this.masterManager.masterConfig.characterJobs;
        if (!jobs) return;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= jobs.length) return;
        [jobs[index], jobs[newIndex]] = [jobs[newIndex], jobs[index]];
        this.masterManager.saveMasterConfig();
        this.render();
    }

    moveCharacterRace(index, direction) {
        const races = this.masterManager.masterConfig.characterRaces;
        if (!races) return;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= races.length) return;
        [races[index], races[newIndex]] = [races[newIndex], races[index]];
        this.masterManager.saveMasterConfig();
        this.render();
    }

    moveCharacterElement(index, direction) {
        const elements = this.masterManager.masterConfig.characterElements;
        if (!elements) return;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= elements.length) return;
        [elements[index], elements[newIndex]] = [elements[newIndex], elements[index]];
        this.masterManager.saveMasterConfig();
        this.render();
    }

    moveCharacterStat(index, direction) {
        const stats = this.masterManager.masterConfig.characterStats;
        if (!stats) return;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= stats.length) return;
        [stats[index], stats[newIndex]] = [stats[newIndex], stats[index]];
        this.masterManager.saveMasterConfig();
        this.render();
    }

    // 職業ボーナスをレンダリング
    renderJobBonuses() {
        const container = document.getElementById('jobBonusesList');
        if (!container) return;

        const jobs = this.masterManager.masterConfig.characterJobs || [];
        const stats = this.masterManager.masterConfig.characterStats || [];
        const bonuses = this.masterManager.masterConfig.jobBonuses || {};

        if (jobs.length === 0 || stats.length === 0) {
            container.innerHTML = '<p>職業またはステータスが設定されていません。</p>';
            return;
        }

        let html = '<div class="bonus-table-container">';
        html += '<table class="bonus-table">';
        html += '<thead><tr><th>職業</th>';
        stats.forEach(stat => {
            html += `<th>${stat.label}</th>`;
        });
        html += '</tr></thead><tbody>';

        jobs.forEach(job => {
            html += `<tr><td><strong>${job}</strong></td>`;
            stats.forEach(stat => {
                const currentValue = bonuses[job] && bonuses[job][stat.id] ? bonuses[job][stat.id] : 0;
                html += `<td><input type="number" value="${currentValue}" 
                         onchange="masterUI.updateJobBonus('${job}', '${stat.id}', this.value)" 
                         class="bonus-input"></td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
    }

    // 種族ボーナスをレンダリング
    renderRaceBonuses() {
        const container = document.getElementById('raceBonusesList');
        if (!container) return;

        const races = this.masterManager.masterConfig.characterRaces || [];
        const stats = this.masterManager.masterConfig.characterStats || [];
        const bonuses = this.masterManager.masterConfig.raceBonuses || {};

        if (races.length === 0 || stats.length === 0) {
            container.innerHTML = '<p>種族またはステータスが設定されていません。</p>';
            return;
        }

        let html = '<div class="bonus-table-container">';
        html += '<table class="bonus-table">';
        html += '<thead><tr><th>種族</th>';
        stats.forEach(stat => {
            html += `<th>${stat.label}</th>`;
        });
        html += '</tr></thead><tbody>';

        races.forEach(race => {
            html += `<tr><td><strong>${race}</strong></td>`;
            stats.forEach(stat => {
                const currentValue = bonuses[race] && bonuses[race][stat.id] ? bonuses[race][stat.id] : 0;
                html += `<td><input type="number" value="${currentValue}" 
                         onchange="masterUI.updateRaceBonus('${race}', '${stat.id}', this.value)" 
                         class="bonus-input"></td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
    }

    // 職業ボーナスを更新
    updateJobBonus(job, stat, value) {
        if (!this.masterManager.masterConfig.jobBonuses) {
            this.masterManager.masterConfig.jobBonuses = {};
        }
        if (!this.masterManager.masterConfig.jobBonuses[job]) {
            this.masterManager.masterConfig.jobBonuses[job] = {};
        }
        this.masterManager.masterConfig.jobBonuses[job][stat] = parseInt(value) || 0;
        this.masterManager.saveMasterConfig();
    }

    // 種族ボーナスを更新
    updateRaceBonus(race, stat, value) {
        if (!this.masterManager.masterConfig.raceBonuses) {
            this.masterManager.masterConfig.raceBonuses = {};
        }
        if (!this.masterManager.masterConfig.raceBonuses[race]) {
            this.masterManager.masterConfig.raceBonuses[race] = {};
        }
        this.masterManager.masterConfig.raceBonuses[race][stat] = parseInt(value) || 0;
        this.masterManager.saveMasterConfig();
    }}

// グローバル変数
let masterManager;
let masterUI;