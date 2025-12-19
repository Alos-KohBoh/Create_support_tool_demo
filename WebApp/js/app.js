class App {
        // データ一覧エクスポート（テキスト/CSV/Markdown）
        exportListData(target, format) {
            const escape = (s) => (s == null ? '' : String(s).replace(/\r?\n/g, ' '));
            // データ取得
            let data = [];
            let headers = [];
            let rows = [];
            if (target === 'characters' || target === 'all') {
                const chars = this.characterManager.getAllCharacters();
                headers = ['名前','レベル','職業','種族','属性','性格','スキル','説明','タグ'];
                chars.forEach(c => {
                    const skillNames = (Array.isArray(c.skills) && this.dataStorage.getAllSkills) ? c.skills.map(id => {
                        const s = this.dataStorage.getAllSkills().find(s => s.id === id); return s ? s.name : id;
                    }) : [];
                    rows.push([
                        c.name, c.level, c.job, c.race, c.element, c.personality,
                        skillNames.join(','), c.description, (c.tags||[]).join(',')
                    ]);
                });
                if (target !== 'all') data = rows;
            }
            if (target === 'monsters' || target === 'all') {
                const monsters = this.dataStorage.monsters;
                const mHeaders = ['名前','危険度','レア度','経験値','スキル','説明','画像URL','ドロップ'];
                const mRows = monsters.map(m => {
                    const skillNames = (Array.isArray(m.skills) && this.dataStorage.getAllSkills) ? m.skills.map(id => {
                        const s = this.dataStorage.getAllSkills().find(s => s.id === id); return s ? s.name : id;
                    }) : [];
                    const drops = (m.dropItems||[]).map(d => `${d.itemName}(${d.probability})`).join(', ');
                    return [m.name, m.dangerLevel||m.danger, m.rarity, m.exp, skillNames.join(','), m.description, m.imageUrl, drops];
                });
                if (target === 'all') {
                    data.push('【モンスター一覧】');
                    data.push(mHeaders);
                    data = data.concat(mRows);
                } else {
                    headers = mHeaders;
                    data = mRows;
                }
            }
            if (target === 'items' || target === 'all') {
                const items = this.dataStorage.items;
                const iHeaders = ['名前','種類','レア度','効果','説明','画像URL','タグ'];
                const iRows = items.map(i => [i.name, i.type, i.rarity, i.effect, i.description, i.imageUrl, (i.tags||[]).join(',')]);
                if (target === 'all') {
                    data.push('【アイテム一覧】');
                    data.push(iHeaders);
                    data = data.concat(iRows);
                } else {
                    headers = iHeaders;
                    data = iRows;
                }
            }
            // 形式ごとに出力
            if (format === 'csv') {
                let csv = '';
                if (target !== 'all') csv += headers.join(',') + '\n';
                data.forEach(row => {
                    if (Array.isArray(row)) {
                        csv += row.map(v => '"' + escape(v).replace(/"/g,'""') + '"').join(',') + '\n';
                    } else {
                        csv += row + '\n';
                    }
                });
                return csv;
            } else if (format === 'md') {
                let md = '';
                if (target === 'all') {
                    let section = '';
                    data.forEach(row => {
                        if (typeof row === 'string') {
                            if (section) md += '\n';
                            md += `### ${row.replace(/[【】]/g,'')}`;
                            section = row;
                        } else if (Array.isArray(row)) {
                            if (section) {
                                md += '\n| ' + row.join(' | ') + ' |';
                            } else {
                                md += '\n| ' + row.join(' | ') + ' |';
                            }
                        }
                    });
                } else {
                    md += '| ' + headers.join(' | ') + ' |\n|'+ headers.map(()=> '---').join('|') + '|\n';
                    data.forEach(row => {
                        md += '| ' + row.map(escape).join(' | ') + ' |\n';
                    });
                }
                return md;
            } else {
                // テキスト
                let txt = '';
                if (target === 'all') {
                    data.forEach(row => {
                        if (typeof row === 'string') {
                            txt += '\n' + row + '\n';
                        } else if (Array.isArray(row)) {
                            txt += row.join(' / ') + '\n';
                        }
                    });
                } else {
                    txt += headers.join(' / ') + '\n';
                    data.forEach(row => {
                        txt += row.map(escape).join(' / ') + '\n';
                    });
                }
                return txt;
            }
        }
        // エクスポートUIイベント連携
        setupExportUI() {
            const exportBtn = document.getElementById('exportDataBtn');
            const preview = document.getElementById('exportDataPreview');
            const targetSel = document.getElementById('exportDataTarget');
            const formatSel = document.getElementById('exportDataFormat');
            const copyBtn = document.getElementById('copyExportDataBtn');
            const saveBtn = document.getElementById('saveExportDataBtn');
            if (!exportBtn || !preview || !targetSel || !formatSel || !copyBtn || !saveBtn) return;
            let lastData = '';
            exportBtn.onclick = () => {
                const target = targetSel.value;
                const format = formatSel.value;
                const data = this.exportListData(target, format);
                lastData = data;
                preview.textContent = data;
                preview.style.display = 'block';
            };
            copyBtn.onclick = () => {
                if (lastData) {
                    navigator.clipboard.writeText(lastData);
                    alert('クリップボードにコピーしました');
                }
            };
            saveBtn.onclick = () => {
                if (lastData) {
                    const blob = new Blob([lastData], {type: 'text/plain'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const ext = formatSel.value === 'csv' ? 'csv' : (formatSel.value === 'md' ? 'md' : 'txt');
                    a.download = `rpg_export_${targetSel.value}_${new Date().toISOString().slice(0,10)}.${ext}`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            };
        }
    // ...existing code...
    // ==========================
    // モンスター用スキル管理UI
    // ==========================
    setupMonsterSkillUI(selectedSkills = []) {
        let skills = this.dataStorage.getAllSkills();
        const dropdown = document.getElementById('monsterSkillSelect');
        const addBtn = document.getElementById('addMonsterSkillBtn');
        const freeAddBtn = document.getElementById('addMonsterSkillFreeBtn');
        const list = document.getElementById('monsterSkillsList');
        if (!dropdown || !addBtn || !freeAddBtn || !list) return;
        // スキル一覧をプルダウンに
        if (!skills || skills.length === 0) {
            this.dataStorage.loadSkillsFromLocalStorage();
            skills = this.dataStorage.getAllSkills();
        }
        dropdown.innerHTML = '<option value="">-- スキルを選択 --</option>' + (skills && skills.length > 0 ? skills.map(s => `<option value="${s.id}">${s.name}</option>`).join('') : '');
        // 追加済みリストを描画
        const allSkillIds = [...selectedSkills];
        // 子スキルも展開
        const expandWithChildren = (id, arr) => {
            if (!arr.includes(id)) arr.push(id);
            const skill = skills.find(s => s.id === id);
            if (skill && skill.childIds && skill.childIds.length > 0) {
                skill.childIds.forEach(cid => expandWithChildren(cid, arr));
            }
        };
        let expandedSkillIds = [];
        allSkillIds.forEach(id => expandWithChildren(id, expandedSkillIds));
        // 重複除去
        expandedSkillIds = [...new Set(expandedSkillIds)];
        // リスト描画
        list.innerHTML = expandedSkillIds.map(id => {
            const skill = skills.find(s => s.id === id);
            return skill ? `<li>${skill.name} <button type="button" class="btn btn-xs btn-danger" data-skill-id="${id}">削除</button></li>` : '';
        }).join('');
        // 削除ボタン
        list.querySelectorAll('button[data-skill-id]').forEach(btn => {
            btn.onclick = () => {
                const removeId = btn.getAttribute('data-skill-id');
                const idx = selectedSkills.indexOf(removeId);
                if (idx !== -1) selectedSkills.splice(idx, 1);
                this.setupMonsterSkillUI(selectedSkills);
            };
        });
        // 追加ボタン
        addBtn.onclick = () => {
            const selId = dropdown.value;
            if (selId && !selectedSkills.includes(selId)) {
                selectedSkills.push(selId);
                this.setupMonsterSkillUI(selectedSkills);
            }
        };
        // 新規追加ボタン（スキルモーダル流用）
        freeAddBtn.onclick = () => {
            this.showSkillModal();
            const saveSkillBtn = document.getElementById('saveSkillBtn');
            if (saveSkillBtn) {
                const oldHandler = saveSkillBtn._monsterSkillHandler;
                if (oldHandler) {
                    saveSkillBtn.removeEventListener('click', oldHandler);
                }
                const handler = () => {
                    this.saveSkillFromModal();
                    setTimeout(() => {
                        this.setupMonsterSkillUI(selectedSkills);
                    }, 200);
                    saveSkillBtn.removeEventListener('click', handler);
                };
                saveSkillBtn.addEventListener('click', handler);
                saveSkillBtn._monsterSkillHandler = handler;
            }
        };
        window._editingMonsterSkills = selectedSkills;
    }
                    // ==========================
                    // スキル管理機能
                    // ==========================
                    renderSkillList() {
                        const container = document.getElementById('skillListView');
                        if (!container) return;
                        const skills = this.dataStorage.getAllSkills();
                        if (!skills || skills.length === 0) {
                            container.innerHTML = '<div class="empty-message">スキルが登録されていません</div>';
                            return;
                        }
                        // 親→子のツリー構造で表示
                        let html = '<div class="data-grid">';
                        // 親スキル（parentIdが空）を抽出
                        const renderSkillTree = (skill, indent = 0) => {
                            html += `
                                <div class="data-card" style="margin-left:${indent * 32}px;">
                                    <div class="data-card-content">
                                        <h3 class="data-card-title">${skill.name}</h3>
                                        <div class="data-card-badges">
                                            ${skill.costType ? `<span class="badge badge-info">${skill.costType}:${skill.costValue}</span>` : ''}
                                            ${skill.target ? `<span class="badge badge-secondary">${skill.target}</span>` : ''}
                                        </div>
                                        <div class="skill-description">${skill.description ? skill.description : ''}</div>
                                        <div class="data-card-actions">
                                            <button class="btn btn-primary btn-sm" onclick="app.editSkill('${skill.id}')">編集</button>
                                            <button class="btn btn-danger btn-sm" onclick="app.deleteSkill('${skill.id}')">削除</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                            // 子スキルを再帰的に表示
                            if (skill.childIds && skill.childIds.length > 0) {
                                skill.childIds.forEach(cid => {
                                    const child = skills.find(s => s.id === cid);
                                    if (child) renderSkillTree(child, indent + 1);
                                });
                            }

                    // データエクスポートUI初期化
                    this.setupExportUI();
                        };
                        // ルート（親なし）スキルのみから開始
                        skills.filter(s => !s.parentId).forEach(rootSkill => {
                            renderSkillTree(rootSkill, 0);
                        });
                        html += '</div>';
                        container.innerHTML = html;
                    }

                    showSkillModal(editSkill = null) {
        // 先にモーダルを表示してDOMを確実に生成
        this.uiManager.showModal('skillModal');

        // 必要な要素を再取得
        const select = document.getElementById('skillCostTypeSelect');
        const free = document.getElementById('skillCostTypeFree');
        const skillModalTitle = document.getElementById('skillModalTitle');
        const skillIdInput = document.getElementById('skillId');
        const skillNameInput = document.getElementById('skillName');
        const skillCostValueInput = document.getElementById('skillCostValue');
        const skillTargetInput = document.getElementById('skillTarget');
        const skillDescriptionInput = document.getElementById('skillDescription');
        const parentSelect = document.getElementById('skillParentSelect');
        if (!select || !free || !skillModalTitle || !skillIdInput || !skillNameInput || !skillCostValueInput || !skillTargetInput || !skillDescriptionInput) return;

        // ステータス項目をセレクトに反映
        select.innerHTML = '<option value="">-- ステータスから選択 --</option>';
        if (window.masterManager && window.masterManager.masterConfig.characterStats) {
            window.masterManager.masterConfig.characterStats.forEach(stat => {
                select.innerHTML += `<option value="${stat.label}">${stat.label}</option>`;
            });
        }
        skillModalTitle.textContent = editSkill ? 'スキル編集' : 'スキル追加';
        skillIdInput.value = editSkill ? editSkill.id : '';
        skillNameInput.value = editSkill ? editSkill.name : '';
        // 消費項目（セレクト＋自由記述）
        if (editSkill && editSkill.costType) {
            // ステータスリストにあればセレクト、なければ自由記述
            let found = false;
            if (window.masterManager && window.masterManager.masterConfig.characterStats) {
                found = window.masterManager.masterConfig.characterStats.some(stat => stat.label === editSkill.costType);
            }
            select.value = found ? editSkill.costType : '';
            free.value = found ? '' : editSkill.costType;
        } else {
            select.value = '';
            free.value = '';
        }
        skillCostValueInput.value = editSkill ? editSkill.costValue : 0;
        skillTargetInput.value = editSkill ? editSkill.target : '';
        skillDescriptionInput.value = editSkill ? editSkill.description : '';
        // 親スキルセレクト
        if (parentSelect) {
            parentSelect.innerHTML = '<option value="">-- 親スキルなし --</option>';
            const skills = this.dataStorage.getAllSkills();
            const selfId = editSkill ? editSkill.id : '';
            skills.forEach(skill => {
                if (skill.id === selfId) return; // 自分自身は選択不可
                const opt = document.createElement('option');
                opt.value = skill.id;
                opt.textContent = skill.name;
                if (editSkill && editSkill.parentId && editSkill.parentId === skill.id) opt.selected = true;
                parentSelect.appendChild(opt);
            });
        }
                    }

                    editSkill(skillId) {
                        const skill = this.dataStorage.getAllSkills().find(s => s.id === skillId);
                        if (!skill) return;
                        this.showSkillModal(skill);
                    }

                    deleteSkill(skillId) {
                        if (!confirm('このスキルを削除しますか？')) return;
                        this.dataStorage.deleteSkill(skillId);
                        this.renderSkillList();
                    }
                    // ==========================
                    // スキル管理イベントリスナー
                    // ==========================
                    setupSkillEventListeners() {
                        const addSkillBtn = document.getElementById('addSkillBtn');
                        if (addSkillBtn) {
                            addSkillBtn.addEventListener('click', () => {
                                this.showSkillModal();
                            });
                        }
                        // 保存ボタン
                        const saveSkillBtn = document.getElementById('saveSkillBtn');
                        if (saveSkillBtn) {
                            saveSkillBtn.addEventListener('click', () => {
                                this.saveSkillFromModal();
                            });
                        }
                        // モーダルのキャンセル・閉じる
                        document.querySelectorAll('#skillModal .close-modal').forEach(elem => {
                            elem.addEventListener('click', () => {
                                this.uiManager.hideModal('skillModal');
                            });
                        });
                    }

                    saveSkillFromModal() {
                        const id = document.getElementById('skillId').value;
                        const name = document.getElementById('skillName').value.trim();
                        // 消費項目（セレクト優先、なければ自由記述）
                        const costTypeSel = document.getElementById('skillCostTypeSelect').value.trim();
                        const costTypeFree = document.getElementById('skillCostTypeFree').value.trim();
                        const costType = costTypeSel || costTypeFree;
                        const costValue = Number(document.getElementById('skillCostValue').value) || 0;
                        const target = document.getElementById('skillTarget').value.trim();
                        const description = document.getElementById('skillDescription').value.trim();
                        const parentId = document.getElementById('skillParentSelect').value;
                        if (!name) {
                            alert('スキル名は必須です');
                            return;
                        }
                        if (id) {
                            // 既存スキルの更新
                            const old = this.dataStorage.getAllSkills().find(s => s.id === id);
                            const updated = new Skill(id, name, costType, costValue, target, description, parentId, old ? old.childIds : []);
                            this.dataStorage.updateSkill(updated);
                        } else {
                            // 新規追加
                            const skill = new Skill(null, name, costType, costValue, target, description, parentId, []);
                            this.dataStorage.addSkill(skill);
                        }
                        this.uiManager.hideModal('skillModal');
                        this.renderSkillList();
                    }
                // 鞄クリア機能
                clearBag() {
                    const bagCharacterSelect = document.getElementById('bagCharacterSelect');
                    const selectedCharId = bagCharacterSelect ? bagCharacterSelect.value : '';
                    const target = selectedCharId
                        ? (this.characterManager.getCharacterById(selectedCharId)?.name + 'の鞄')
                        : '倉庫';
                    if (!confirm(`${target}を本当にクリアしますか？（元に戻せません）`)) return;
                    if (selectedCharId) {
                        // キャラクター鞄
                        const character = this.characterManager.getCharacterById(selectedCharId);
                        if (character) {
                            character.bagItems = {};
                            this.characterManager.updateCharacter(character.id, character);
                        }
                    } else {
                        // 倉庫
                        this.bagManager.items = {};
                        this.bagManager.saveToLocalStorage();
                    }
                    this.updateBagDisplay();
                    alert('鞄をクリアしました');
                }

                // 鞄設定（未実装）
                showBagSettings() {
                    alert('鞄設定機能は未実装です');
                }

                // アイテム追加（未実装）
                showAddItemModal() {
                    alert('鞄へのアイテム追加機能は未実装です');
                }
            // レベル履歴ダイアログ（仮実装）
            viewLevelHistory(id) {
                alert('レベル履歴表示機能は未実装です。キャラクターID: ' + id);
            }
        // モンスター用ステータス入力欄を生成
        generateMonsterStatsFields(monster = null) {
            const container = document.getElementById('monsterStatsFields');
            if (!container || !window.masterManager) return;
            const stats = window.masterManager.masterConfig.characterStats || [];
            container.innerHTML = stats.map(stat => {
                // 必ずbaseStatsのみを参照
                let value = '';
                if (monster && monster.baseStats && monster.baseStats[stat.id] !== undefined) {
                    value = monster.baseStats[stat.id];
                } else if (stat.defaultValue !== undefined) {
                    value = stat.defaultValue;
                }
                return `
                <div class="form-group">
                    <label for="monsterStat_${stat.id}">${stat.label}</label>
                    <input 
                        type="number" 
                        id="monsterStat_${stat.id}"
                        name="${stat.id}"
                        class="form-control monster-stat-input" 
                        data-stat-id="${stat.id}"
                        value="${value}"
                        min="0"
                        title="${stat.label}"
                        placeholder="${stat.label}"
                    >
                </div>
                `;
            }).join('');

            // 編集モード時: input変更で即時保存
            if (monster && monster.id) {
                stats.forEach(stat => {
                    const input = document.getElementById(`monsterStat_${stat.id}`);
                    if (input) {
                        input.addEventListener('input', (e) => {
                            const val = parseInt(e.target.value) || 0;
                            monster[stat.id] = val;
                            // ステータス即時保存
                            if (window.app && window.app.dataStorage) {
                                window.app.dataStorage.updateMonster(monster);
                            }
                        });
                    }
                });
            } else {
                // 新規追加モード: 一時的なmonsterオブジェクトをwindowに保持し、input変更で値を反映
                if (!window._newMonsterStats) window._newMonsterStats = {};
                stats.forEach(stat => {
                    const input = document.getElementById(`monsterStat_${stat.id}`);
                    if (input) {
                        input.addEventListener('input', (e) => {
                            const val = parseInt(e.target.value) || 0;
                            window._newMonsterStats[stat.id] = val;
                        });
                        // 初期値も反映
                        window._newMonsterStats[stat.id] = parseInt(input.value) || 0;
                    }
                });
            }
        }
    constructor() {
        // プロジェクトマネージャーを先に初期化
        this.projectManager = new ProjectManager();
        
        // データストレージにプロジェクトマネージャーを渡す
        this.dataStorage = new DataStorage(this.projectManager);
        this.simulator = new DropSimulator();
        this.uiManager = new UIManager();
        this.bagManager = new BagManager();
        this.characterManager = new CharacterManager();
        this.workManager = new WorkManager();
        this.plotManager = new PlotManager();
        this.mediaLibrary = new MediaLibrary();
        this.navigationManager = new NavigationManager();
        this.backupManager = new BackupManager();
        this.tagManager = new TagManager();
        this.relationshipManager = new RelationshipManager();
        this.collaborationManager = new CollaborationManager();
        this.outputManager = new OutputManager();
        this.templateManager = new TemplateManager();
        this.worldMapManager = new WorldMapManager();
        this.selectedMonster = null;
        this.addedItemsToBAG = new Set(); // 追加済みアイテムを追跡
        this.lastGachaExp = 0; // 最後のガチャで獲得した経験値
        this.expAdded = false; // 経験値が追加済みかどうか
        this.editingCharacterId = null;
        this.editingWorkId = null;
        this.editingChapterId = null;
        this.editingSceneId = null;
        this.editingTimelineEventId = null;
        this.currentImageInputId = null; // メディアライブラリから画像を選択する際のターゲット入力フィールド
        
        // マスタマネージャー初期化
        masterManager = new MasterDataManager();
        masterUI = new MasterUI(masterManager);

        // グローバル参照を明示的にセット
        if (typeof window !== 'undefined') {
            window.app = this;
            window.masterManager = masterManager;
        }

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSkillEventListeners();
        this.setupImageUploadListeners();
        this.loadMonsterSelect();
        this.setupTabs();
        this.setupSubTabs();
        this.setupFilters();
        
        // モーダルのセレクトボックスを初期化
        this.initializeModalSelects();
        
        // 鞄UIを初期化
        this.updateBagDisplay();
        // スキル一覧を初期表示
        this.renderSkillList();
        // キャラクター一覧を表示
        this.renderCharacterList();
        
        // 関係性リストを表示
        this.renderRelationshipList();
        
        // 作品一覧を表示
        this.renderWorkList();
        
        // プロット一覧を表示
        this.renderChapterList();
        
        // シーンカード表示を初期化
        this.renderSceneCards();
        
        // プロット分析を表示
        this.renderPlotAnalytics();

        // AI機能を初期化
        this.initializeAIFeatures();

        // コラボレーション機能を初期化
        this.initializeCollaborationFeatures();

        // 出力・公開機能を初期化
        this.initializeOutputFeatures();

        // テンプレート機能を初期化
        this.initializeTemplateFeatures();

        // ワールドマップ機能を初期化
        this.initializeWorldMapFeatures();

        // バックアップ情報を更新
        this.updateBackupInfo();

        // バックアップ設定を読み込み
        const autoBackupEnabled = this.backupManager.isAutoBackupEnabled();
        const autoBackupInterval = this.backupManager.getAutoBackupInterval();
        const enabledCheckbox = document.getElementById('autoBackupEnabled');
        const intervalInput = document.getElementById('autoBackupInterval');
        if (enabledCheckbox) {
            enabledCheckbox.checked = autoBackupEnabled;
        }
        if (intervalInput) {
            intervalInput.value = autoBackupInterval;
        }

        // プロジェクト選択を更新
        this.updateProjectSelect();
    }

    // モーダルのセレクトボックスを初期化
    initializeModalSelects() {
        if (this.uiManager && masterManager) {
            this.uiManager.updateMonsterModalSelects();
            this.uiManager.updateItemModalSelects();
        }
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // モンスター選択
        document.getElementById('monsterSelect').addEventListener('change', (e) => {
            const monsterId = e.target.value;
            this.selectedMonster = this.dataStorage.getMonsterById(monsterId);
            this.uiManager.displayMonsterInfo(this.selectedMonster);
            this.toggleSimulationButtons();
        });
        // レベル変更時にステータス再表示
        const monsterLevelInput = document.getElementById('monsterLevel');
        if (monsterLevelInput) {
            monsterLevelInput.addEventListener('input', () => {
                this.uiManager.displayMonsterInfo(this.selectedMonster);
            });
        }

        // ガチャ開始ボタン
        document.getElementById('runSimulation').addEventListener('click', () => {
            this.runSimulation();
        });

        // 期待値計算ボタン
        document.getElementById('calculateExpected').addEventListener('click', () => {
            this.calculateExpectedValues();
        });

        // 結果クリアボタン
        document.getElementById('clearResults').addEventListener('click', () => {
            this.clearResults();
        });

        // モンスター追加ボタン
        document.getElementById('addMonsterBtn').addEventListener('click', () => {
            this.uiManager.showModal('monsterModal');
        });

        // --- window.app, window.masterManagerのグローバル参照を必ず再バインド ---
        if (typeof window !== 'undefined') {
            window.app = this;
            if (typeof masterManager !== 'undefined') {
                window.masterManager = masterManager;
            }
        }

        // アイテム追加ボタン
        document.getElementById('addItemBtn').addEventListener('click', () => {
            this.uiManager.showModal('itemModal');
        });

        // 自動バックアップ設定ボタン
        const saveBackupSettings = document.getElementById('saveBackupSettings');
        if (saveBackupSettings) {
            saveBackupSettings.addEventListener('click', () => {
                this.saveBackupSettings();
            });
        }

        // プロジェクト関連ボタン
        const currentProjectSelect = document.getElementById('currentProjectSelect');
        if (currentProjectSelect) {
            currentProjectSelect.addEventListener('change', (e) => {
                this.switchProject(e.target.value);
            });
        }

        const newProjectBtn = document.getElementById('newProjectBtn');
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => {
                this.showProjectModal(true);
            });
        }

        const editProjectBtn = document.getElementById('editProjectBtn');
        if (editProjectBtn) {
            editProjectBtn.addEventListener('click', () => {
                this.showProjectModal(false);
            });
        }

        const deleteProjectBtn = document.getElementById('deleteProjectBtn');
        if (deleteProjectBtn) {
            deleteProjectBtn.addEventListener('click', () => {
                this.deleteProject();
            });
        }

        const exportProjectBtn = document.getElementById('exportProjectBtn');
        if (exportProjectBtn) {
            exportProjectBtn.addEventListener('click', () => {
                this.exportProject();
            });
        }

        const importProjectBtn = document.getElementById('importProjectBtn');
        if (importProjectBtn) {
            importProjectBtn.addEventListener('click', () => {
                document.getElementById('importProjectInput').click();
            });
        }

        const importProjectInput = document.getElementById('importProjectInput');
        if (importProjectInput) {
            importProjectInput.addEventListener('change', (e) => {
        
            // window.app, window.masterManagerに明示的にバインド（グローバル参照保証）
            if (typeof window !== 'undefined') {
                window.app = this;
                window.masterManager = masterManager;
            }
                this.importProject(e.target.files[0]);
            });
        }

        const saveProject = document.getElementById('saveProject');
        if (saveProject) {
            saveProject.addEventListener('click', () => {
                this.saveProjectInfo();
            });
        }

        // 手動バックアップ作成ボタン
        const createBackupBtn = document.getElementById('createBackupBtn');
        if (createBackupBtn) {
            createBackupBtn.addEventListener('click', () => {
                this.createManualBackup();
            });
        }

        // バックアップ復元ボタン
        const restoreBackupBtn = document.getElementById('restoreBackupBtn');
        if (restoreBackupBtn) {
            restoreBackupBtn.addEventListener('click', () => {
                document.getElementById('restoreBackupInput').click();
            });
        }

        // バックアップファイル選択
        const restoreBackupInput = document.getElementById('restoreBackupInput');
        if (restoreBackupInput) {
            restoreBackupInput.addEventListener('change', (e) => {
                this.restoreFromBackup(e.target.files[0]);
            });
        }

        // データリセットボタン
        document.getElementById('resetDataBtn').addEventListener('click', () => {
            if (confirm('すべてのデータをリセットしてサンプルデータを再読み込みしますか？')) {
                this.resetAllData();
            }
        });

        // エクスポートボタン
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        // インポートボタン
        document.getElementById('importDataBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        // --- デバッグ: window.app, window.app.editMonsterの存在をログ出力 ---
        if (typeof window !== 'undefined') {
            console.log('window.app:', window.app);
            console.log('window.app.editMonster:', window.app && window.app.editMonster);
        }

        // ファイル選択
        document.getElementById('importFileInput').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // 鞄関連ボタン
        document.getElementById('clearBagBtn').addEventListener('click', () => {
            this.clearBag();
        });

        document.getElementById('bagSettingsBtn').addEventListener('click', () => {
            this.showBagSettings();
        });

        document.getElementById('saveBagSettings').addEventListener('click', () => {
            this.saveBagSettings();
        });

        document.getElementById('addBagItemBtn').addEventListener('click', () => {
            this.showAddItemModal();
        });

        document.getElementById('addBagItem').addEventListener('click', () => {
            this.addItemToBag();
        });

        document.getElementById('addResultsToBag').addEventListener('click', () => {
            this.addResultsToBag();
        });

        const addExpBtn = document.getElementById('addExpToCharacter');
        if (addExpBtn) {
            addExpBtn.addEventListener('click', () => {
                this.addGachaExpToCharacter();
            });
        }

        document.getElementById('useBagItem').addEventListener('click', () => {
            this.useItemFromBag();
        });

        document.getElementById('removeBagItem').addEventListener('click', () => {
            this.removeItemFromBag();
        });

        // モンスター保存
        document.getElementById('saveMonster').addEventListener('click', () => {
            this.saveMonster();
        });

        // アイテム保存
        document.getElementById('saveItem').addEventListener('click', () => {
            this.saveItem();
        });

        // ドロップ保存
        document.getElementById('saveDrops').addEventListener('click', () => {
            this.saveDrops();
        });

        // キャラクターフィルター
        const characterJobFilter = document.getElementById('characterJobFilter');
        if (characterJobFilter) {
            characterJobFilter.addEventListener('change', () => this.filterCharacterList());
        }

        const characterRaceFilter = document.getElementById('characterRaceFilter');
        if (characterRaceFilter) {
            characterRaceFilter.addEventListener('change', () => this.filterCharacterList());
        }

        const characterTagFilter = document.getElementById('characterTagFilter');
        if (characterTagFilter) {
            characterTagFilter.addEventListener('change', () => this.filterCharacterList());
        }

        const clearCharacterFilter = document.getElementById('clearCharacterFilter');
        if (clearCharacterFilter) {
            clearCharacterFilter.addEventListener('click', () => {
                if (characterJobFilter) characterJobFilter.value = '';
                if (characterRaceFilter) characterRaceFilter.value = '';
                if (characterTagFilter) characterTagFilter.value = '';
                this.renderCharacterList();
            });
        }

        // キャラクター追加ボタン
        const addCharacterBtn = document.getElementById('addCharacterBtn');
        if (addCharacterBtn) {
            addCharacterBtn.addEventListener('click', () => {
                this.editingCharacterId = null;
                this.clearCharacterForm();
                this.uiManager.showModal('characterModal');
            });
        }

        // キャラクター保存ボタン
        const saveCharacterBtn = document.getElementById('saveCharacter');
        if (saveCharacterBtn) {
            saveCharacterBtn.addEventListener('click', () => {
                this.saveCharacter();
            });
        }

        // キャラクターレベル変更時の自動計算
        const characterLevel = document.getElementById('characterLevel');
        if (characterLevel) {
            characterLevel.addEventListener('change', () => {
                this.updateStatsForLevel();
                this.updateBonusPointsForLevel();
            });
        }

        // 関係性追加ボタン
        const addRelationshipBtn = document.getElementById('addRelationshipBtn');
        if (addRelationshipBtn) {
            addRelationshipBtn.addEventListener('click', () => {
                this.editingRelationshipId = null;
                this.showRelationshipModal();
            });
        }

        // 関係性保存ボタン
        const saveRelationshipBtn = document.getElementById('saveRelationship');
        if (saveRelationshipBtn) {
            saveRelationshipBtn.addEventListener('click', () => {
                this.saveRelationship();
            });
        }

        // 関係性の強さスライダー
        const relationshipStrength = document.getElementById('relationshipStrength');
        if (relationshipStrength) {
            relationshipStrength.addEventListener('input', (e) => {
                const valueSpan = document.getElementById('relationshipStrengthValue');
                if (valueSpan) {
                    valueSpan.textContent = e.target.value;
                }
            });
        }

        // プロット管理イベントリスナー
        const addChapterBtn = document.getElementById('addChapterBtn');
        if (addChapterBtn) {
            addChapterBtn.addEventListener('click', () => {
                this.editingChapterId = null;
                this.clearChapterForm();
                this.uiManager.showModal('chapterModal');
            });
        }

        const saveChapterBtn = document.getElementById('saveChapter');
        if (saveChapterBtn) {
            saveChapterBtn.addEventListener('click', () => {
                this.saveChapter();
            });
        }

        const saveSceneBtn = document.getElementById('saveScene');
        if (saveSceneBtn) {
            saveSceneBtn.addEventListener('click', () => {
                this.saveScene();
            });
        }

        // 作品管理イベントリスナー
        const addWorkBtn = document.getElementById('addWorkBtn');
        if (addWorkBtn) {
            addWorkBtn.addEventListener('click', () => {
                this.editingWorkId = null;
                this.clearWorkForm();
                this.uiManager.showModal('workModal');
            });
        }

        const saveWorkBtn = document.getElementById('saveWork');
        if (saveWorkBtn) {
            saveWorkBtn.addEventListener('click', () => {
                this.saveWork();
            });
        }

        // タイムラインイベント追加ボタン
        const addTimelineEventBtn = document.getElementById('addTimelineEventBtn');
        if (addTimelineEventBtn) {
            addTimelineEventBtn.addEventListener('click', () => {
                this.editingTimelineEventId = null;
                this.clearTimelineEventForm();
                this.uiManager.showModal('timelineEventModal');
            });
        }

        const saveTimelineEventBtn = document.getElementById('saveTimelineEvent');
        if (saveTimelineEventBtn) {
            saveTimelineEventBtn.addEventListener('click', () => {
                this.saveTimelineEvent();
            });
        }

        // シーンカードフィルター
        const sceneCardChapterFilter = document.getElementById('sceneCardChapterFilter');
        if (sceneCardChapterFilter) {
            sceneCardChapterFilter.addEventListener('change', () => {
                this.renderSceneCards();
            });
        }

        // モーダル閉じる
        document.querySelectorAll('.close, .close-modal').forEach(elem => {
            elem.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.uiManager.hideModal(modal.id);
                }
            });
        });

        // モーダル外クリックで閉じる
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.uiManager.hideModal(modal.id);
                }
            });
        });

        // ドロップモンスター選択
        document.getElementById('dropMonsterSelect').addEventListener('change', (e) => {
            const monsterId = e.target.value;
            if (monsterId) {
                this.loadDropItemsForMonster(monsterId);
            } else {
                document.getElementById('dropItemsContainer').style.display = 'none';
            }
        });

        // ドロップアイテム追加
        document.getElementById('addDropItem').addEventListener('click', () => {
            this.addDropItemRow();
        });

        document.getElementById('createNewItemFromDrop').addEventListener('click', () => {
            this.createNewItemFromDrop();
        });
    }

    // 画像アップロード機能の設定
    setupImageUploadListeners() {
        // キャラクター画像選択ボタン
        const charImageBtn = document.getElementById('char-image-select-btn');
        if (charImageBtn) {
            charImageBtn.addEventListener('click', () => {
                this.currentImageInputId = 'characterImage';
                this.uiManager.showModal('imageSelectModal');
            });
        }

        // シーン画像選択ボタン
        const sceneImageBtn = document.getElementById('scene-image-select-btn');
        if (sceneImageBtn) {
            sceneImageBtn.addEventListener('click', () => {
                this.currentImageInputId = 'sceneImage';
                this.uiManager.showModal('imageSelectModal');
            });
        }

        // タイムラインイベント画像選択ボタン
        const timelineImageBtn = document.getElementById('timeline-image-select-btn');
        if (timelineImageBtn) {
            timelineImageBtn.addEventListener('click', () => {
                this.currentImageInputId = 'timelineEventImage';
                this.uiManager.showModal('imageSelectModal');
            });
        }

        // 画像アップロードタブ切り替え
        document.querySelectorAll('.image-upload-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                
                // タブボタンのアクティブ化
                document.querySelectorAll('.image-upload-tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // タブコンテンツの表示切替
                document.querySelectorAll('.image-upload-tab').forEach(t => t.classList.remove('active'));
                document.getElementById(`${tab}-tab`).classList.add('active');
            });
        });

        // URL指定
        const confirmImageUrlBtn = document.getElementById('confirmImageUrl');
        if (confirmImageUrlBtn) {
            confirmImageUrlBtn.addEventListener('click', () => {
                const url = document.getElementById('imageUrlInput').value.trim();
                if (url && this.currentImageInputId) {
                    document.getElementById(this.currentImageInputId).value = url;
                    this.uiManager.hideModal('imageSelectModal');
                    document.getElementById('imageUrlInput').value = '';
                }
            });
        }

        // ファイルアップロード
        const imageFileInput = document.getElementById('imageFileInput');
        if (imageFileInput) {
            imageFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && this.currentImageInputId) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const base64 = event.target.result;
                        document.getElementById(this.currentImageInputId).value = base64;
                        this.uiManager.hideModal('imageSelectModal');
                        e.target.value = '';
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // メディアライブラリから選択
        const selectFromLibraryBtn = document.getElementById('selectFromLibrary');
        if (selectFromLibraryBtn) {
            selectFromLibraryBtn.addEventListener('click', () => {
                this.showMediaLibrary();
            });
        }

        // メディアライブラリに追加
        const addToLibraryBtn = document.getElementById('addToLibrary');
        if (addToLibraryBtn) {
            addToLibraryBtn.addEventListener('click', () => {
                const file = document.getElementById('libraryImageFile').files[0];
                const name = document.getElementById('libraryImageName').value.trim();
                
                if (!file) {
                    alert('画像ファイルを選択してください');
                    return;
                }
                
                if (!name) {
                    alert('画像名を入力してください');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = event.target.result;
                    this.mediaLibrary.addImage(name, base64);
                    this.showMediaLibrary();
                    document.getElementById('libraryImageFile').value = '';
                    document.getElementById('libraryImageName').value = '';
                    alert('メディアライブラリに追加しました');
                };
                reader.readAsDataURL(file);
            });
        }
    }

    // メディアライブラリ表示
    showMediaLibrary() {
        const container = document.getElementById('mediaLibraryGrid');
        if (!container) return;
        
        container.innerHTML = '';
        
        const images = this.mediaLibrary.getAllImages();
        
        if (images.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">画像がありません</p>';
            return;
        }
        
        images.forEach(img => {
            const item = document.createElement('div');
            item.className = 'media-item';
            item.innerHTML = `
                <img src="${img.data}" alt="${img.name}">
                <div class="media-item-name">${img.name}</div>
                <div class="media-item-actions">
                    <button onclick="app.selectMediaImage('${img.id}')" class="btn-primary btn-sm">選択</button>
                    <button onclick="app.deleteMediaImage('${img.id}')" class="btn-danger btn-sm">削除</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // メディアライブラリから画像を選択
    selectMediaImage(imageId) {
        if (this.currentImageInputId) {
            const image = this.mediaLibrary.getImage(imageId);
            if (image) {
                document.getElementById(this.currentImageInputId).value = image.data;
                this.uiManager.hideModal('imageSelectModal');
            }
        }
    }

    // メディアライブラリから画像を削除
    deleteMediaImage(imageId) {
        if (confirm('この画像を削除しますか？')) {
            this.mediaLibrary.deleteImage(imageId);
            this.showMediaLibrary();
        }
    }

    // タブ機能の設定
    setupTabs() {
        // メインタブ（各セクション内のタブ）
        document.querySelectorAll('.main-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                // .section-screen または .plot-screen のどちらかを親として取得
                const section = btn.closest('.section-screen') || btn.closest('.plot-screen');
                
                if (!section) {
                    console.error('Section not found for tab:', tabName);
                    return;
                }

                // 同じセクション内のタブボタンとコンテンツを取得
                const tabBtns = section.querySelectorAll('.main-tab-btn');
                const tabContents = section.querySelectorAll('.main-tab-content');

                // すべて非アクティブ化
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => {
                    c.classList.remove('active');
                    c.style.display = 'none';
                });

                // 選択されたタブをアクティブ化
                btn.classList.add('active');
                const targetContent = section.querySelector(`#${tabName}`);
                if (targetContent) {
                    targetContent.classList.add('active');
                    targetContent.style.display = 'block';
                } else {
                    console.error('Target content not found:', tabName);
                }

                // 世界観タブがクリックされた時に世界観設定を読み込む
                if (tabName === 'worldmap-content') {
                    setTimeout(() => this.loadWorldSetting(), 100);
                }

                // コメントタブがクリックされた時にコメント一覧を更新
                if (tabName === 'comments-content') {
                    setTimeout(() => this.renderComments(), 100);
                }

                // シミュレーションセクションの場合の特別処理
                if (section.id === 'simulation-section') {
                    const resultsSection = document.getElementById('resultsSection');
                    const mainElement = section.querySelector('main');
                    
                    if (tabName === 'simulation') {
                        if (resultsSection) resultsSection.classList.remove('hidden');
                        if (mainElement) mainElement.classList.remove('single-column');
                    } else {
                        if (resultsSection) resultsSection.classList.add('hidden');
                        if (mainElement) mainElement.classList.add('single-column');
                    }

                    // 鞄タブの場合
                    if (tabName === 'bag') {
                        this.updateBagDisplay();
                    }
                }

                // データ作成・管理セクションの場合
                if (section.id === 'data-section') {
                    if (tabName === 'characters') {
                        this.renderCharacterList();
                    } else if (tabName === 'monsters' || tabName === 'items') {
                        this.refreshDataLists();
                    }
                }

                // プロットセクションの場合
                if (section.id === 'plot-section') {
                    if (tabName === 'chapters-content') {
                        this.renderChapterList();
                    } else if (tabName === 'timeline-content') {
                        this.renderTimelineView();
                    }
                }
            });
        });

        // 結果タブ（シミュレーション結果表示用）
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                const resultsSection = btn.closest('.results-section');
                
                if (!resultsSection) {
                    console.error('Results section not found for tab:', tabName);
                    return;
                }

                // 同じ結果セクション内のタブボタンとコンテンツを取得
                const tabBtns = resultsSection.querySelectorAll('.tab-btn');
                const tabContents = resultsSection.querySelectorAll('.tab-content');

                // すべてのタブを非アクティブに
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // 選択されたタブをアクティブに
                btn.classList.add('active');
                const targetContent = resultsSection.querySelector(`#${tabName}`);
                if (targetContent) {
                    targetContent.classList.add('active');
                } else {
                    console.error('Target content not found:', tabName);
                }
            });
        });
    }

    // サブタブ機能の設定
    setupSubTabs() {
        const subTabBtns = document.querySelectorAll('.sub-tab-btn');
        const subTabContents = document.querySelectorAll('.sub-tab-content');

        subTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-subtab');

                subTabBtns.forEach(b => b.classList.remove('active'));
                subTabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                document.getElementById(tabName).classList.add('active');
            });
        });
    }

    // フィルター機能の設定
    setupFilters() {
        // モンスターフィルター
        const monsterNameFilter = document.getElementById('monsterNameFilter');
        const monsterDangerFilter = document.getElementById('monsterDangerFilter');
        const monsterRarityFilter = document.getElementById('monsterRarityFilter');
        const clearMonsterFilter = document.getElementById('clearMonsterFilter');

        if (monsterNameFilter) {
            monsterNameFilter.addEventListener('input', () => this.applyMonsterFilter());
        }
        if (monsterDangerFilter) {
            monsterDangerFilter.addEventListener('change', () => this.applyMonsterFilter());
        }
        if (monsterRarityFilter) {
            monsterRarityFilter.addEventListener('change', () => this.applyMonsterFilter());
        }
        if (clearMonsterFilter) {
            clearMonsterFilter.addEventListener('click', () => {
                monsterNameFilter.value = '';
                monsterDangerFilter.value = '';
                monsterRarityFilter.value = '';
                this.applyMonsterFilter();
            });
        }

        // アイテムフィルター
        const itemNameFilter = document.getElementById('itemNameFilter');
        const itemTypeFilter = document.getElementById('itemTypeFilter');
        const itemRarityFilter = document.getElementById('itemRarityFilter');
        const clearItemFilter = document.getElementById('clearItemFilter');

        if (itemNameFilter) {
            itemNameFilter.addEventListener('input', () => this.applyItemFilter());
        }
        if (itemTypeFilter) {
            itemTypeFilter.addEventListener('change', () => this.applyItemFilter());
        }
        if (itemRarityFilter) {
            itemRarityFilter.addEventListener('change', () => this.applyItemFilter());
        }
        if (clearItemFilter) {
            clearItemFilter.addEventListener('click', () => {
                itemNameFilter.value = '';
                itemTypeFilter.value = '';
                itemRarityFilter.value = '';
                this.applyItemFilter();
            });
        }

        // フィルターセレクトボックスを初期化
        this.updateFilterSelects();
    }

    // モンスターフィルターを適用
    applyMonsterFilter() {
        const nameFilter = document.getElementById('monsterNameFilter').value.toLowerCase();
        const dangerFilter = document.getElementById('monsterDangerFilter').value;
        const rarityFilter = document.getElementById('monsterRarityFilter').value;

        const filteredMonsters = this.dataStorage.monsters.filter(monster => {
            const nameMatch = !nameFilter || monster.name.toLowerCase().includes(nameFilter);
            const dangerMatch = !dangerFilter || monster.dangerLevel === dangerFilter;
            const rarityMatch = !rarityFilter || monster.rarity === rarityFilter;
            return nameMatch && dangerMatch && rarityMatch;
        });

        this.uiManager.renderMonsterList(filteredMonsters);
    }

    // アイテムフィルターを適用
    applyItemFilter() {
        const nameFilter = document.getElementById('itemNameFilter').value.toLowerCase();
        const typeFilter = document.getElementById('itemTypeFilter').value;
        const rarityFilter = document.getElementById('itemRarityFilter').value;

        const filteredItems = this.dataStorage.items.filter(item => {
            const nameMatch = !nameFilter || item.name.toLowerCase().includes(nameFilter);
            const typeMatch = !typeFilter || item.type === typeFilter;
            const rarityMatch = !rarityFilter || item.rarity === rarityFilter;
            return nameMatch && typeMatch && rarityMatch;
        });

        this.uiManager.renderItemList(filteredItems);
    }

    // フィルターセレクトボックスを更新
    updateFilterSelects() {
        // モンスター危険度
        const monsterDangerFilter = document.getElementById('monsterDangerFilter');
        if (monsterDangerFilter && masterManager) {
            const dangers = masterManager.masterConfig.dangerLevels;
            monsterDangerFilter.innerHTML = '<option value="">危険度: すべて</option>' +
                dangers.map(d => `<option value="${d}">${d}</option>`).join('');
        }

        // モンスターレアリティ
        const monsterRarityFilter = document.getElementById('monsterRarityFilter');
        if (monsterRarityFilter && masterManager) {
            const rarities = masterManager.masterConfig.monsterRarities;
            monsterRarityFilter.innerHTML = '<option value="">レア度: すべて</option>' +
                rarities.map(r => `<option value="${r}">${r}</option>`).join('');
        }

        // アイテム種類
        const itemTypeFilter = document.getElementById('itemTypeFilter');
        if (itemTypeFilter && masterManager) {
            const types = masterManager.masterConfig.itemTypes;
            itemTypeFilter.innerHTML = '<option value="">種類: すべて</option>' +
                types.map(t => `<option value="${t}">${t}</option>`).join('');
        }

        // アイテムレアリティ
        const itemRarityFilter = document.getElementById('itemRarityFilter');
        if (itemRarityFilter && masterManager) {
            const rarities = masterManager.masterConfig.itemRarities;
            itemRarityFilter.innerHTML = '<option value="">レア度: すべて</option>' +
                rarities.map(r => `<option value="${r}">${r}</option>`).join('');
        }
    }

    // モンスター選択を読み込み
    loadMonsterSelect() {
        const select = document.getElementById('monsterSelect');
        this.uiManager.updateMonsterSelect(this.dataStorage.monsters, select);
        
        const dropSelect = document.getElementById('dropMonsterSelect');
        this.uiManager.updateMonsterSelect(this.dataStorage.monsters, dropSelect);
    }

    // シミュレーションボタンの有効/無効切り替え
    toggleSimulationButtons() {
        const hasMonster = this.selectedMonster !== null;
        document.getElementById('runSimulation').disabled = !hasMonster;
        document.getElementById('calculateExpected').disabled = !hasMonster;
    }

    // ガチャシミュレーション実行
    runSimulation() {
        if (!this.selectedMonster) return;

        const trialCount = parseInt(document.getElementById('trialCount').value);
        const monsterLevel = parseInt(document.getElementById('monsterLevel').value) || 1;
        
        if (trialCount <= 0 || trialCount > 100000) {
            alert('試行回数は1〜100000の範囲で入力してください');
            return;
        }

        // シミュレーション実行
        const { results, counts } = this.simulator.runSimulation(this.selectedMonster, trialCount, monsterLevel);
        const stats = this.simulator.getStatistics(trialCount);

        // 結果を保持し、追加済みアイテムをリセット
        this.lastGachaResults = results;
        this.addedItemsToBAG = new Set();
        
        // 経験値計算：シミュレーション画面で設定したモンスターレベルに応じて変化
        // レベル1の場合は基礎経験値のみ、レベル2以上は（基礎経験値 × 1.1）× モンスターレベル
        const baseExp = this.selectedMonster.exp || 0;
        let totalExp;
        if (monsterLevel === 1) {
            // レベル1の場合は基礎経験値をそのまま獲得
            totalExp = baseExp * trialCount;
        } else {
            // レベル2以上の場合は（基礎経験値 × 1.1）× モンスターレベル × 試行回数
            totalExp = (baseExp * 1.1) * monsterLevel * trialCount;
        }
        this.lastGachaExp = Math.floor(totalExp);
        this.expAdded = false;
        
        // 結果表示
        this.uiManager.displayResults(stats, trialCount);
        this.uiManager.displayLog(results);
        
        // 期待値も自動計算
        this.calculateExpectedValues();
        
        // グラフ更新
        this.uiManager.displayChart(stats, this.simulator.expectedValues);

        // 鞄に入れるボタンと経験値獲得ボタンを表示
        const addResultsToBagBtn = document.getElementById('addResultsToBag');
        if (addResultsToBagBtn) {
            addResultsToBagBtn.style.display = 'block';
            addResultsToBagBtn.disabled = false;
            addResultsToBagBtn.textContent = 'すべて鞄に入れる';
        }

        const addExpBtn = document.getElementById('addExpToCharacter');
        if (addExpBtn && this.lastGachaExp > 0) {
            addExpBtn.style.display = 'block';
            addExpBtn.disabled = false;
            addExpBtn.textContent = `経験値を獲得 (${this.lastGachaExp})`;
        }

        // 集計結果タブに切り替え
        document.querySelector('.tab-btn[data-tab="results"]').click();
    }

    // 期待値計算
    calculateExpectedValues() {
        if (!this.selectedMonster) return;

        const trialCount = parseInt(document.getElementById('trialCount').value);
        const monsterLevel = parseInt(document.getElementById('monsterLevel').value) || 1;
        const expectedValues = this.simulator.calculateExpectedValues(this.selectedMonster, trialCount, monsterLevel);
        
        this.uiManager.displayExpectedValues(expectedValues, trialCount);
    }

    // 結果クリア
    clearResults() {
        this.simulator.clearResults();
        this.uiManager.clearAllResults();
        this.lastGachaResults = null;
        this.addedItemsToBAG = new Set();
        this.lastGachaExp = 0;
        this.expAdded = false;
        
        // 鞄に入れるボタンを非表示・リセット
        const addResultsToBagBtn = document.getElementById('addResultsToBag');
        if (addResultsToBagBtn) {
            addResultsToBagBtn.style.display = 'none';
            addResultsToBagBtn.disabled = false;
            addResultsToBagBtn.textContent = 'すべて鞄に入れる';
        }

        // 経験値獲得ボタンを非表示・リセット
        const addExpBtn = document.getElementById('addExpToCharacter');
        if (addExpBtn) {
            addExpBtn.style.display = 'none';
            addExpBtn.disabled = false;
        }
    }

    // モンスター保存
    saveMonster() {
        const name = document.getElementById('monsterName').value.trim();
        const danger = document.getElementById('monsterDangerInput').value;
        const rarity = document.getElementById('monsterRarityInput').value;
        const imageUrl = document.getElementById('monsterImageUrl').value.trim();
        const description = document.getElementById('monsterDescription').value.trim();
        const exp = parseInt(document.getElementById('monsterExp').value) || 0;
        const editId = document.getElementById('saveMonster').dataset.editId;

        if (!name) {
            alert('モンスター名を入力してください');
            return;
        }

        // ステータス値取得（monster-stat-inputクラスの全inputを保存）
        let baseStats = {};
        const statInputs = document.querySelectorAll('.monster-stat-input');
        statInputs.forEach(input => {
            const statId = input.dataset.statId || input.name;
            baseStats[statId] = parseInt(input.value) || 0;
        });
        if (editId) {
            // 編集モード
            const old = this.dataStorage.getMonsterById(editId);
            if (old) {
                // 既存のドロップや他プロパティも引き継ぐ
                const updatedMonster = new Monster(
                    old.id,
                    name,
                    danger,
                    rarity,
                    old.dropItems || [],
                    imageUrl,
                    description,
                    exp,
                    baseStats
                );
                    // スキル保存
                    updatedMonster.skills = Array.isArray(window._editingMonsterSkills) ? [...window._editingMonsterSkills] : [];
                this.dataStorage.updateMonster(updatedMonster);
                alert('モンスター情報を更新しました');
            }
            delete document.getElementById('saveMonster').dataset.editId;
        } else {
            // 新規追加モード
            if (window._newMonsterStats) {
                baseStats = {...window._newMonsterStats};
            } else {
                statInputs.forEach(input => {
                    const statId = input.dataset.statId || input.name;
                    baseStats[statId] = parseInt(input.value) || 0;
                });
            }
            const monster = new Monster(null, name, danger, rarity, [], imageUrl, description, exp);
            monster.baseStats = { ...baseStats };
                // スキル保存
                monster.skills = Array.isArray(window._editingMonsterSkills) ? [...window._editingMonsterSkills] : [];
            this.dataStorage.addMonster(monster);
            alert('モンスターを追加しました');
            window._newMonsterStats = {};
        }
        this.loadMonsterSelect();
        this.refreshDataLists();
        this.uiManager.hideModal('monsterModal');
        // フォームクリア
        document.getElementById('monsterName').value = '';
        document.getElementById('monsterImageUrl').value = '';
        document.getElementById('monsterDescription').value = '';
    }

    // アイテム保存
    saveItem() {
        const name = document.getElementById('itemName').value.trim();
        const type = document.getElementById('itemType').value;
        const rarity = document.getElementById('itemRarity').value;
        const imageUrl = document.getElementById('itemImageUrl').value.trim();
        const description = document.getElementById('itemDescription').value.trim();
        const effect = document.getElementById('itemEffect').value.trim();
        const editId = document.getElementById('saveItem').dataset.editId;

        if (!name) {
            alert('アイテム名を入力してください');
            return;
        }

        if (editId) {
            // 編集モード
            const item = this.dataStorage.getItemById(editId);
            if (item) {
                item.name = name;
                item.type = type;
                item.rarity = rarity;
                item.imageUrl = imageUrl;
                item.description = description;
                item.effect = effect;
                this.dataStorage.updateItem(item);
                alert('アイテム情報を更新しました');
            }
            delete document.getElementById('saveItem').dataset.editId;
        } else {
            // 新規追加モード
            const item = new Item(null, name, type, rarity, imageUrl, description, effect);
            this.dataStorage.addItem(item);
            // ドロップ追加モードならドロップリストにも追加
            if (window._dropItemAddMode) {
                const monsterId = document.getElementById('dropMonsterSelect').value;
                const monster = this.dataStorage.getMonsterById(monsterId);
                if (monster) {
                    monster.dropItems.push(new DropItem(item.name, 0));
                    this.loadDropItemsForMonster(monsterId);
                }
                alert(`アイテム「${item.name}」を作成し、ドロップリストに追加しました`);
                window._dropItemAddMode = false;
            } else {
                alert('アイテムを追加しました');
            }
        }

        this.refreshDataLists();
        this.uiManager.hideModal('itemModal');

        // フォームクリア
        document.getElementById('itemName').value = '';
        document.getElementById('itemImageUrl').value = '';
        document.getElementById('itemDescription').value = '';
        document.getElementById('itemEffect').value = '';
    }

    // ドロップ管理を開く
    openDropManagement() {
        this.loadMonsterSelect();
        this.uiManager.showModal('dropModal');
    }

    // モンスターのドロップアイテムを読み込み
    loadDropItemsForMonster(monsterId) {
        const monster = this.dataStorage.getMonsterById(monsterId);
        if (!monster) return;

        document.getElementById('dropItemsContainer').style.display = 'block';
        const container = document.getElementById('dropItemsList');
        this.uiManager.updateDropItemsList(monster, this.dataStorage.items, container);

        this.setupDropItemsListeners();
    }

    // ドロップアイテムのリスナー設定
    setupDropItemsListeners() {
        // アイテム選択変更
        document.querySelectorAll('.drop-item-select').forEach(select => {
            select.addEventListener('change', (e) => {
                this.updateDropItem(e.target);
            });
        });

        // 確率入力変更
        document.querySelectorAll('.drop-prob-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.updateDropItem(e.target);
            });
        });

        // 削除ボタン
        document.querySelectorAll('.remove-drop-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removeDropItem(parseInt(e.target.dataset.index));
            });
        });
    }

    // ドロップアイテム行を追加
    addDropItemRow() {
        const monsterId = document.getElementById('dropMonsterSelect').value;
        const monster = this.dataStorage.getMonsterById(monsterId);
        
        if (!monster) return;

        monster.dropItems.push(new DropItem('', 0));
        this.loadDropItemsForMonster(monsterId);
    }

    // 新規アイテムを作成してドロップに追加
    createNewItemFromDrop() {
        // itemModalを流用して新規アイテム作成
        window._dropItemAddMode = true;
        // 入力欄を初期化
        document.getElementById('itemName').value = '';
        document.getElementById('itemType').value = '';
        document.getElementById('itemRarity').value = '';
        document.getElementById('itemImageUrl').value = '';
        document.getElementById('itemDescription').value = '';
        document.getElementById('itemEffect').value = '';
        this.uiManager.showModal('itemModal');
    }

    // ドロップアイテムの更新
    updateDropItem(element) {
        const index = parseInt(element.dataset.index);
        const monsterId = document.getElementById('dropMonsterSelect').value;
        const monster = this.dataStorage.getMonsterById(monsterId);

        if (!monster || !monster.dropItems[index]) return;

        const row = element.closest('.drop-item-config');
        const itemName = row.querySelector('.drop-item-select').value;
        const probability = parseFloat(row.querySelector('.drop-prob-input').value) / 100;

        monster.dropItems[index].itemName = itemName;
        monster.dropItems[index].probability = probability;

        this.uiManager.updateTotalProbability(monster);
    }

    // ドロップアイテムの削除
    removeDropItem(index) {
        const monsterId = document.getElementById('dropMonsterSelect').value;
        const monster = this.dataStorage.getMonsterById(monsterId);

        if (!monster) return;

        monster.dropItems.splice(index, 1);
        this.loadDropItemsForMonster(monsterId);
    }

    // ドロップ設定を保存
    saveDrops() {
        const monsterId = document.getElementById('dropMonsterSelect').value;
        const monster = this.dataStorage.getMonsterById(monsterId);

        if (!monster) return;

        // 空のアイテム名がないかチェック
        const hasEmpty = monster.dropItems.some(item => !item.itemName);
        if (hasEmpty) {
            alert('すべてのドロップアイテムを選択してください');
            return;
        }

        // 確率の合計情報を表示
        const total = monster.dropItems.reduce((sum, item) => sum + item.probability, 0);
        let message = 'ドロップテーブルを保存しました';
        if (total < 1.0) {
            message += '\n(合計確率: ' + (total * 100).toFixed(1) + '% - 何もドロップしない可能性があります)';
        } else if (total > 1.0) {
            message += '\n(合計確率: ' + (total * 100).toFixed(1) + '% - 複数アイテムがドロップする可能性があります)';
        }

        this.dataStorage.updateMonster(monster);
        this.uiManager.hideModal('dropModal');
        
        // 選択中のモンスターを更新
        if (this.selectedMonster && this.selectedMonster.id === monster.id) {
            this.selectedMonster = monster;
            this.uiManager.displayMonsterInfo(this.selectedMonster);
        }

        alert(message);
    }

    // データリセット
    resetAllData() {
        this.dataStorage.clearAll();
        this.dataStorage.initSampleData();
        this.loadMonsterSelect();
        this.selectedMonster = null;
        this.uiManager.displayMonsterInfo(null);
        this.toggleSimulationButtons();
        this.clearResults();
        this.refreshDataLists();
        alert('データをリセットしました。サンプルデータを再読み込みしました。');
        location.reload(); // ページをリロード
    }

    // バックアップ設定を保存
    saveBackupSettings() {
        const enabled = document.getElementById('autoBackupEnabled').checked;
        const interval = parseInt(document.getElementById('autoBackupInterval').value);

        if (interval < 5 || interval > 1440) {
            alert('バックアップ間隔は5分から1440分（24時間）の範囲で設定してください。');
            return;
        }

        this.backupManager.setAutoBackupEnabled(enabled);
        this.backupManager.setAutoBackupInterval(interval);

        if (enabled) {
            this.backupManager.startAutoBackup();
            alert(`自動バックアップを有効にしました。\n間隔: ${interval}分`);
        } else {
            this.backupManager.stopAutoBackup();
            alert('自動バックアップを無効にしました。');
        }

        this.updateBackupInfo();
    }

    // プロジェクト管理メソッド
    updateProjectSelect() {
        const select = document.getElementById('currentProjectSelect');
        if (!select) return;

        select.innerHTML = '';
        const projects = this.projectManager.getAllProjects();
        
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            if (project.id === this.projectManager.currentProjectId) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        this.updateProjectInfo();
    }

    updateProjectInfo() {
        const infoText = document.getElementById('projectInfoText');
        if (!infoText) return;

        const project = this.projectManager.getCurrentProject();
        if (project) {
            let text = '';
            text += `プロジェクト名: ${project.name}\n`;
            text += `説明: ${project.description || 'なし'}\n`;
            text += `作成日: ${new Date(project.createdAt).toLocaleString('ja-JP')}\n`;
            text += `更新日: ${new Date(project.updatedAt).toLocaleString('ja-JP')}`;
            infoText.textContent = text;
        } else {
            infoText.textContent = 'プロジェクトが選択されていません。';
        }
    }

    showProjectModal(isNew) {
        const modal = document.getElementById('projectModal');
        const title = document.getElementById('projectModalTitle');
        const nameInput = document.getElementById('projectName');
        const descInput = document.getElementById('projectDescription');

        if (isNew) {
            title.textContent = '新しいプロジェクト';
            nameInput.value = '';
            descInput.value = '';
        } else {
            const project = this.projectManager.getCurrentProject();
            if (!project) {
                alert('プロジェクトが選択されていません。');
                return;
            }
            title.textContent = 'プロジェクト編集';
            nameInput.value = project.name;
            descInput.value = project.description || '';
        }

        this.uiManager.showModal('projectModal');
    }

    saveProjectInfo() {
        const nameInput = document.getElementById('projectName');
        const descInput = document.getElementById('projectDescription');
        const title = document.getElementById('projectModalTitle');

        const name = nameInput.value.trim();
        const description = descInput.value.trim();

        if (!name) {
            alert('プロジェクト名を入力してください。');
            return;
        }

        if (title.textContent === '新しいプロジェクト') {
            // 新規作成
            const project = this.projectManager.createProject(name, description);
            this.projectManager.switchProject(project.id);
            alert('新しいプロジェクトを作成しました。');
        } else {
            // 編集
            const projectId = this.projectManager.currentProjectId;
            this.projectManager.updateProject(projectId, name, description);
            alert('プロジェクト情報を更新しました。');
        }

        this.uiManager.hideModal('projectModal');
        this.updateProjectSelect();
    }

    switchProject(projectId) {
        if (!confirm('プロジェクトを切り替えますか？ページがリロードされます。')) {
            // キャンセルされた場合は選択をリセット
            const select = document.getElementById('currentProjectSelect');
            if (select) {
                select.value = this.projectManager.currentProjectId;
            }
            return;
        }

        this.projectManager.switchProject(projectId);
        location.reload();
    }

    deleteProject() {
        const project = this.projectManager.getCurrentProject();
        if (!project) {
            alert('プロジェクトが選択されていません。');
            return;
        }

        const projectName = project.name;
        if (!confirm(`プロジェクト「${projectName}」を削除しますか？\nすべてのデータが失われます。`)) {
            return;
        }

        if (!confirm('本当に削除しますか？この操作は取り消せません。')) {
            return;
        }

        this.projectManager.deleteProject(project.id);
        alert('プロジェクトを削除しました。ページをリロードします。');
        location.reload();
    }

    exportProject() {
        const project = this.projectManager.getCurrentProject();
        if (!project) {
            alert('プロジェクトが選択されていません。');
            return;
        }

        try {
            const projectData = this.projectManager.exportProjectData(project.id);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `project_${project.name}_${timestamp}.json`;

            const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('プロジェクトをエクスポートしました。');
        } catch (error) {
            console.error('プロジェクトエクスポートエラー:', error);
            alert('プロジェクトのエクスポートに失敗しました。');
        }
    }

    importProject(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                const project = this.projectManager.importProjectData(projectData);
                alert(`プロジェクト「${project.name}」をインポートしました。`);
                this.updateProjectSelect();
            } catch (error) {
                console.error('プロジェクトインポートエラー:', error);
                alert('プロジェクトのインポートに失敗しました。');
            }
        };
        reader.readAsText(file);
    }

    // 手動バックアップを作成
    createManualBackup() {
        try {
            this.backupManager.createManualBackup();
            alert('バックアップファイルをダウンロードしました。');
            this.updateBackupInfo();
        } catch (error) {
            console.error('バックアップ作成エラー:', error);
            alert('バックアップの作成に失敗しました。');
        }
    }

    // バックアップから復元
    restoreFromBackup(file) {
        if (!file) return;

        if (!confirm('現在のデータはすべて上書きされます。バックアップから復元しますか？')) {
            return;
        }

        this.backupManager.restoreFromFile(file).then(() => {
            alert('バックアップからデータを復元しました。ページをリロードします。');
            location.reload();
        }).catch(error => {
            console.error('バックアップ復元エラー:', error);
            alert('バックアップの復元に失敗しました。');
        });
    }

    // バックアップ情報を更新
    updateBackupInfo() {
        const info = this.backupManager.getBackupInfo();
        const infoText = document.getElementById('backupInfoText');
        
        if (infoText) {
            let text = '';
            text += `自動バックアップ: ${info.autoBackupEnabled ? '有効' : '無効'}\n`;
            text += `バックアップ間隔: ${info.autoBackupInterval}分\n`;
            text += `最終バックアップ: ${info.lastBackupTime || 'なし'}\n`;
            text += `データサイズ: ${info.dataSize}`;
            infoText.textContent = text;
        }
    }

    // データ一覧を更新
    refreshDataLists() {
        try {
            this.uiManager.renderMonsterList(this.dataStorage.monsters);
            this.uiManager.renderItemList(this.dataStorage.items);
            this.updateFilterSelects();
        } catch (error) {
            console.error('データ一覧の更新エラー:', error);
        }
    }

    // 特定モンスターのドロップ編集を開く
    openDropManagementForMonster(monsterId) {
        this.uiManager.showModal('dropModal');
        const select = document.getElementById('dropMonsterSelect');
        select.value = monsterId;
        this.loadDropItemsForMonster(monsterId);
    }

    // モンスター編集
    editMonster(monsterId) {
        console.log('[editMonster] 呼び出し: ', monsterId);
        const monster = this.dataStorage.getMonsterById(monsterId);
        if (!monster) {
            console.log('[editMonster] monsterが見つかりません', monsterId);
            return;
        }

        const nameInput = document.getElementById('monsterName');
        if (!nameInput) { console.log('[editMonster] monsterName inputが見つかりません'); return; }
        nameInput.value = monster.name;

        const dangerInput = document.getElementById('monsterDangerInput');
        if (!dangerInput) { console.log('[editMonster] monsterDangerInputが見つかりません'); return; }
        dangerInput.value = monster.dangerLevel;

        const rarityInput = document.getElementById('monsterRarityInput');
        if (!rarityInput) { console.log('[editMonster] monsterRarityInputが見つかりません'); return; }
        rarityInput.value = monster.rarity;

        const imageInput = document.getElementById('monsterImageUrl');
        if (!imageInput) { console.log('[editMonster] monsterImageUrlが見つかりません'); return; }
        imageInput.value = monster.imageUrl || '';

        const descInput = document.getElementById('monsterDescription');
        if (!descInput) { console.log('[editMonster] monsterDescriptionが見つかりません'); return; }
        descInput.value = monster.description || '';

        const expInput = document.getElementById('monsterExp');
        if (!expInput) { console.log('[editMonster] monsterExpが見つかりません'); return; }
        expInput.value = monster.exp || 0;

        // ステータス欄も反映
        const saveBtn = document.getElementById('saveMonster');
        if (!saveBtn) { console.log('[editMonster] saveMonsterボタンが見つかりません'); return; }
        saveBtn.dataset.editId = monsterId;

        console.log('[editMonster] input値セット完了');

        this.uiManager.showModal('monsterModal');
        console.log('[editMonster] showModal(monsterModal)呼び出し');
            window._editingMonsterSkills = Array.isArray(monster.skills) ? [...monster.skills] : [];
            this.setupMonsterSkillUI(window._editingMonsterSkills);
        // ステータス欄を値入りで上書き（baseStatsのみ）
        this.generateMonsterStatsFields(monster);
    }

    // アイテム編集
    editItem(itemId) {
        const item = this.dataStorage.getItemById(itemId);
        if (!item) return;

        document.getElementById('itemName').value = item.name;
        document.getElementById('itemType').value = item.type;
        document.getElementById('itemRarity').value = item.rarity;
        document.getElementById('itemImageUrl').value = item.imageUrl || '';
        document.getElementById('itemDescription').value = item.description || '';
        document.getElementById('itemEffect').value = item.effect || '';
        
        // 既存アイテムの編集モード
        document.getElementById('saveItem').dataset.editId = itemId;
        this.uiManager.showModal('itemModal');
    }

    // モンスター削除
    deleteMonster(monsterId) {
        this.dataStorage.deleteMonster(monsterId);
        this.loadMonsterSelect();
        this.refreshDataLists();
        
        if (this.selectedMonster && this.selectedMonster.id === monsterId) {
            this.selectedMonster = null;
            this.uiManager.displayMonsterInfo(null);
            this.toggleSimulationButtons();
        }
    }

    // アイテム削除
    deleteItem(itemId) {
        this.dataStorage.deleteItem(itemId);
        this.refreshDataLists();
    }

    // データをエクスポート
    exportData() {
        try {
            const exportData = {
                version: '2.1',
                exportDate: new Date().toISOString(),
                monsters: this.dataStorage.monsters,
                items: this.dataStorage.items,
                characters: this.characterManager.getAllCharacters(),
                works: this.workManager.getAllWorks(),
                plotChapters: this.plotManager.getAllChapters(),
                plotScenes: this.plotManager.getAllScenes(),
                plotTimeline: this.plotManager.getAllTimelineEvents(),
                bag: this.bagManager.getBagData(),
                masterConfig: masterManager.masterConfig
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            const filename = `rpg_creative_data_${new Date().toISOString().split('T')[0]}.json`;
            link.download = filename;
            link.click();
            
            URL.revokeObjectURL(url);
            alert('データをエクスポートしました');
        } catch (error) {
            console.error('エクスポートエラー:', error);
            alert('エクスポートに失敗しました');
        }
    }

    // データをインポート
    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // バージョンチェック
                if (!importData.version) {
                    throw new Error('無効なデータ形式です');
                }

                // 確認ダイアログ
                const confirmMsg = `データをインポートしますか？\n\n` +
                    `モンスター: ${importData.monsters?.length || 0}件\n` +
                    `アイテム: ${importData.items?.length || 0}件\n` +
                    `キャラクター: ${importData.characters?.length || 0}件\n` +
                    `作品: ${importData.works?.length || 0}件\n` +
                    `章: ${importData.plotChapters?.length || 0}件\n` +
                    `シーン: ${importData.plotScenes?.length || 0}件\n` +
                    `タイムライン: ${importData.plotTimeline?.length || 0}件\n` +
                    `鞄のアイテム: ${importData.bag?.items?.length || 0}種類\n\n` +
                    `現在のデータは上書きされます。`;
                
                if (!confirm(confirmMsg)) {
                    document.getElementById('importFileInput').value = '';
                    return;
                }

                // データを復元
                if (importData.monsters) {
                    this.dataStorage.monsters = importData.monsters.map(m =>
                        new Monster(m.id, m.name, m.dangerLevel, m.rarity,
                            m.dropItems.map(d => new DropItem(d.itemName, d.probability)),
                            m.imageUrl, m.description)
                    );
                }

                if (importData.items) {
                    this.dataStorage.items = importData.items.map(i =>
                        new Item(i.id, i.name, i.type, i.rarity, i.imageUrl, i.description, i.effect)
                    );
                }

                if (importData.characters) {
                    this.characterManager.characters = importData.characters;
                    Character.saveToLocalStorage(this.characterManager.characters);
                }

                if (importData.works) {
                    this.workManager.works = importData.works;
                    this.workManager.saveWorks();
                }

                if (importData.plotChapters) {
                    this.plotManager.chapters = importData.plotChapters;
                    this.plotManager.saveChapters();
                }

                if (importData.plotScenes) {
                    this.plotManager.scenes = importData.plotScenes;
                    this.plotManager.saveScenes();
                }

                if (importData.plotTimeline) {
                    this.plotManager.timelineEvents = importData.plotTimeline;
                    this.plotManager.saveTimelineEvents();
                }

                if (importData.bag) {
                    this.bagManager.restoreBagData(importData.bag);
                }

                if (importData.masterConfig) {
                    // 必須フィールドがなければ補完
                    const def = (new MasterDataManager()).loadMasterConfig();
                    const imported = importData.masterConfig;
                    // characterStats
                    if (!Array.isArray(imported.characterStats)) imported.characterStats = def.characterStats;
                    // levelUpConfig
                    if (!imported.levelUpConfig) imported.levelUpConfig = def.levelUpConfig;
                    // jobBonuses
                    if (!imported.jobBonuses) imported.jobBonuses = def.jobBonuses;
                    // raceBonuses
                    if (!imported.raceBonuses) imported.raceBonuses = def.raceBonuses;
                    masterManager.masterConfig = imported;
                    masterManager.saveMasterConfig();
                }

                // 保存して更新
                this.dataStorage.saveToLocalStorage();
                this.loadMonsterSelect();
                this.refreshDataLists();
                this.renderCharacterList();
                this.renderWorkList();
                this.updateBagDisplay();
                this.selectedMonster = null;
                this.uiManager.displayMonsterInfo(null);
                this.toggleSimulationButtons();
                
                // マスタUIも更新
                if (masterUI) {
                    masterUI.render();
                }

                alert('データをインポートしました');
                document.getElementById('importFileInput').value = '';
            } catch (error) {
                console.error('インポートエラー:', error);
                alert('インポートに失敗しました: ' + error.message);
                document.getElementById('importFileInput').value = '';
            }
        };

        reader.onerror = () => {
            alert('ファイルの読み込みに失敗しました');
            document.getElementById('importFileInput').value = '';
        };

        reader.readAsText(file);
    }

    // 鞄表示を更新
    updateBagDisplay() {
        const bagItemsList = document.getElementById('bagItemsList');
        const currentCount = document.getElementById('currentCount');
        const maxCapacity = document.getElementById('maxCapacity');
        const bagCharacterSelect = document.getElementById('bagCharacterSelect');
        const bagTitle = document.getElementById('bagTitle');
        const nameFilterInput = document.getElementById('bagItemNameFilter');
        const typeFilterSelect = document.getElementById('bagItemTypeFilter');
        const rarityFilterSelect = document.getElementById('bagItemRarityFilter');
        const clearFilterBtn = document.getElementById('clearBagItemFilter');

        if (!bagItemsList || !currentCount || !maxCapacity || !bagCharacterSelect || !bagTitle) return;

        // プルダウンをキャラクター一覧＋倉庫で再生成
        const allCharacters = this.characterManager.getAllCharacters();
        const prevValue = bagCharacterSelect.value;
        bagCharacterSelect.innerHTML = '<option value="">-- 倉庫（共通） --</option>' +
            allCharacters.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        if ([...bagCharacterSelect.options].some(opt => opt.value === prevValue)) {
            bagCharacterSelect.value = prevValue;
        }

        // 種類・レア度の選択肢をマスタデータからセット
        if (window.masterManager && window.masterManager.masterConfig) {
            const types = window.masterManager.masterConfig.itemTypes || [];
            const rarities = window.masterManager.masterConfig.itemRarities || [];
            if (typeFilterSelect) {
                const prev = typeFilterSelect.value;
                typeFilterSelect.innerHTML = '<option value="">種類: すべて</option>' + types.map(t => `<option value="${t}">${t}</option>`).join('');
                if ([...typeFilterSelect.options].some(opt => opt.value === prev)) typeFilterSelect.value = prev;
            }
            if (rarityFilterSelect) {
                const prev = rarityFilterSelect.value;
                rarityFilterSelect.innerHTML = '<option value="">レア度: すべて</option>' + rarities.map(r => `<option value="${r}">${r}</option>`).join('');
                if ([...rarityFilterSelect.options].some(opt => opt.value === prev)) rarityFilterSelect.value = prev;
            }
        }

        // 選択キャラID
        const selectedCharId = bagCharacterSelect.value;
        let items = [];
        let count = 0;
        let max = this.bagManager.maxCapacity;
        if (selectedCharId) {
            // 個人鞄
            const character = this.characterManager.getCharacterById(selectedCharId);
            if (character && character.bagItems) {
                items = Object.entries(character.bagItems);
                count = items.reduce((sum, [, qty]) => sum + qty, 0);
                bagTitle.textContent = `${character.name}の鞄`;
            } else {
                bagTitle.textContent = '鞄';
            }
        } else {
            // 共通倉庫
            items = Object.entries(this.bagManager.items);
            count = this.bagManager.getCurrentCount();
            bagTitle.textContent = '倉庫';
        }
        currentCount.textContent = count;
        maxCapacity.textContent = max;

        // アイテム情報取得用（name→Itemオブジェクト）
        const itemMap = {};
        if (this.dataStorage && this.dataStorage.items) {
            this.dataStorage.items.forEach(item => { itemMap[item.name] = item; });
        }

        // フィルター値取得
        const nameFilter = nameFilterInput ? nameFilterInput.value.trim().toLowerCase() : '';
        const typeFilter = typeFilterSelect ? typeFilterSelect.value : '';
        const rarityFilter = rarityFilterSelect ? rarityFilterSelect.value : '';

        // フィルター適用
        const filteredItems = items.filter(([name, qty]) => {
            const item = itemMap[name] || {};
            if (nameFilter && !name.toLowerCase().includes(nameFilter)) return false;
            if (typeFilter && item.type !== typeFilter) return false;
            if (rarityFilter && item.rarity !== rarityFilter) return false;
            return true;
        });

        // アイテムリスト描画
        if (filteredItems.length === 0) {
            bagItemsList.innerHTML = '<div class="empty-message">鞄は空です</div>';
        } else {
            bagItemsList.innerHTML = filteredItems.map(([name, qty]) => {
                const item = itemMap[name] || {};
                const type = item.type ? `<span class=\"bag-item-type\">[${item.type}]</span> ` : '';
                const rarity = item.rarity ? `<span class=\"bag-item-rarity\">(${item.rarity})</span> ` : '';
                return `<div class=\"bag-item-row\">${type}${rarity}<span class=\"bag-item-name\">${name}</span> × <span class=\"bag-item-qty\">${qty}</span></div>`;
            }).join('');
        }

        // イベントリスナー（多重登録防止）
        bagCharacterSelect.removeEventListener('_bagChange', bagCharacterSelect._bagChangeHandler || (()=>{}));
        bagCharacterSelect._bagChangeHandler = () => this.updateBagDisplay();
        bagCharacterSelect.addEventListener('change', bagCharacterSelect._bagChangeHandler);

        // フィルターイベント
        if (nameFilterInput && !nameFilterInput._bagInputHandler) {
            nameFilterInput._bagInputHandler = () => this.updateBagDisplay();
            nameFilterInput.addEventListener('input', nameFilterInput._bagInputHandler);
        }
        if (typeFilterSelect && !typeFilterSelect._bagChangeHandler) {
            typeFilterSelect._bagChangeHandler = () => this.updateBagDisplay();
            typeFilterSelect.addEventListener('change', typeFilterSelect._bagChangeHandler);
        }
        if (rarityFilterSelect && !rarityFilterSelect._bagChangeHandler) {
            rarityFilterSelect._bagChangeHandler = () => this.updateBagDisplay();
            rarityFilterSelect.addEventListener('change', rarityFilterSelect._bagChangeHandler);
        }
        if (clearFilterBtn && !clearFilterBtn._bagClickHandler) {
            clearFilterBtn._bagClickHandler = () => {
                if (nameFilterInput) nameFilterInput.value = '';
                if (typeFilterSelect) typeFilterSelect.value = '';
                if (rarityFilterSelect) rarityFilterSelect.value = '';
                this.updateBagDisplay();
            };
            clearFilterBtn.addEventListener('click', clearFilterBtn._bagClickHandler);
        }
    }

    // アイテムを削除
    removeItemFromBag() {
        const modal = document.getElementById('bagItemOperationModal');
        const itemName = modal.dataset.itemName;
        const quantity = parseInt(document.getElementById('itemOperationQuantity').value);
        
        if (isNaN(quantity) || quantity < 1) {
            alert('数量は1以上を入力してください');
            return;
        }
        
        if (!confirm(`${itemName}を${quantity}個削除しますか?`)) return;
        
        const result = this.bagManager.removeItem(itemName, quantity);
        
        if (result.success) {
            alert(`${itemName}を${quantity}個削除しました`);
            this.updateBagDisplay();
            this.uiManager.hideModal('bagItemOperationModal');
        } else {
            alert(result.message);
        }
    }

    // ガチャ結果を鞄に追加
    addResultsToBag() {
        if (!this.lastGachaResults || this.lastGachaResults.length === 0) {
            alert('追加するガチャ結果がありません');
            return;
        }

        // すでに追加済みのアイテムを除外
        const remainingResults = this.lastGachaResults.filter(
            result => !this.addedItemsToBAG.has(result.itemName)
        );

        if (remainingResults.length === 0) {
            alert('すべてのアイテムは既に追加済みです');
            return;
        }

        // キャラクター選択取得
        const selectedCharId = document.getElementById('simulationCharacterSelect').value;
        // アイテム集計
        const itemCounts = {};
        remainingResults.forEach(r => {
            if (r.itemName && r.itemName !== 'なし') {
                itemCounts[r.itemName] = (itemCounts[r.itemName] || 0) + 1;
            }
        });
        if (selectedCharId) {
            // 個人鞄
            const character = this.characterManager.getCharacterById(selectedCharId);
            if (!character) {
                alert('キャラクターが見つかりません');
                return;
            }
            for (const [itemName, quantity] of Object.entries(itemCounts)) {
                if (!character.bagItems) character.bagItems = {};
                character.bagItems[itemName] = (character.bagItems[itemName] || 0) + quantity;
            }
            this.characterManager.updateCharacter(character.id, character);
            // キャラクターリストを更新
            if (typeof this.renderCharacterList === 'function') {
                this.renderCharacterList();
            }
        } else {
            // 共通倉庫
            for (const [itemName, quantity] of Object.entries(itemCounts)) {
                this.bagManager.addItem(itemName, quantity);
            }
            this.updateBagDisplay();
        }
        alert('すべてのアイテムを鞄に追加しました');
    }

    // 特定のアイテムを鞄に追加
    addSpecificItemToBag(itemName, quantity, buttonId) {
        // すでに追加済みの場合は何もしない
        if (this.addedItemsToBAG.has(itemName)) {
            return;
        }
        
        const result = this.bagManager.addItem(itemName, quantity);
        this.updateBagDisplay();
        
        // 追加済みとしてマーク
        this.addedItemsToBAG.add(itemName);
        
        // ボタンを無効化
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = true;
            button.textContent = '追加済み';
            button.classList.remove('btn-success');
            button.classList.add('btn-secondary');
        }
        
        // すべて追加済みかチェック
        const stats = this.simulator.getStatistics(parseInt(document.getElementById('trialCount').value));
        if (this.addedItemsToBAG.size >= stats.length) {
            const addResultsToBagBtn = document.getElementById('addResultsToBag');
            if (addResultsToBagBtn) {
                addResultsToBagBtn.disabled = true;
                addResultsToBagBtn.textContent = '追加済み';
            }
        }
    }

    // ==========================
    // キャラクター機能
    // ==========================

    clearCharacterForm() {
            document.getElementById('characterName').value = '';
            document.getElementById('characterLevel').value = '1';
            document.getElementById('characterPersonality').value = '';
            document.getElementById('characterBackground').value = '';
            document.getElementById('characterDialogues').value = '';
            document.getElementById('characterImage').value = '';
            document.getElementById('characterTags').value = '';
            // スキル欄UI初期化と編集状態リセット
            window._editingCharacterSkills = [];
            this.setupCharacterSkillUI([]);
            // マスタ設定から選択肢を更新
            this.updateCharacterFormSelects();
            // ステータスフィールドを生成
            this.generateCharacterStatsFields();
            // ボーナスポイントUIを初期化
            this.initializeBonusAllocationUI();
            // ボーナスポイントセクションを非表示（レベル1なので）
            const bonusSection = document.getElementById('bonusPointsSection');
            if (bonusSection) {
                bonusSection.style.display = 'none';
            }
            const remainingPoints = document.getElementById('remainingBonusPoints');
            if (remainingPoints) {
                remainingPoints.textContent = '0';
            }
    }

    // キャラクター編集モーダルのスキル欄UIセットアップ
    setupCharacterSkillUI(selectedSkills = []) {
        // スキル配列の中身を確認
        let skills = this.dataStorage.getAllSkills();
        console.log('setupCharacterSkillUI: skills', skills);
        const dropdown = document.getElementById('characterSkillSelect');
        const addBtn = document.getElementById('addCharacterSkillBtn');
        const freeAddBtn = document.getElementById('addCharacterSkillFreeBtn');
        const list = document.getElementById('characterSkillList');
        if (!dropdown || !addBtn || !freeAddBtn || !list) return;
        // スキル一覧をプルダウンに
        if (!skills || skills.length === 0) {
            this.dataStorage.loadSkillsFromLocalStorage();
            skills = this.dataStorage.getAllSkills();
            console.log('setupCharacterSkillUI: reload skills', skills);
        }
        dropdown.innerHTML = '<option value="">-- スキルを選択 --</option>' + (skills && skills.length > 0 ? skills.map(s => `<option value="${s.id}">${s.name}</option>`).join('') : '');
        // 追加済みリストを描画
        const allSkillIds = [...selectedSkills];
        // 子スキルも展開
        const expandWithChildren = (id, arr) => {
            if (!arr.includes(id)) arr.push(id);
            const skill = skills.find(s => s.id === id);
            if (skill && skill.childIds && skill.childIds.length > 0) {
                skill.childIds.forEach(cid => expandWithChildren(cid, arr));
            }
        };
        let expandedSkillIds = [];
        allSkillIds.forEach(id => expandWithChildren(id, expandedSkillIds));
        // 重複除去
        expandedSkillIds = [...new Set(expandedSkillIds)];
        // リスト描画
        list.innerHTML = expandedSkillIds.map(id => {
            const skill = skills.find(s => s.id === id);
            return skill ? `<li>${skill.name} <button type="button" class="btn btn-xs btn-danger" data-skill-id="${id}">削除</button></li>` : '';
        }).join('');
        // 削除ボタン
        list.querySelectorAll('button[data-skill-id]').forEach(btn => {
            btn.onclick = () => {
                const removeId = btn.getAttribute('data-skill-id');
                const idx = selectedSkills.indexOf(removeId);
                if (idx !== -1) selectedSkills.splice(idx, 1);
                this.setupCharacterSkillUI(selectedSkills);
            };
        });
        // 追加ボタン
        addBtn.onclick = () => {
            const selId = dropdown.value;
            if (selId && !selectedSkills.includes(selId)) {
                selectedSkills.push(selId);
                this.setupCharacterSkillUI(selectedSkills);
            }
        };

        // 新規追加ボタン（スキルモーダル流用）
        freeAddBtn.onclick = () => {
            // スキル追加モーダルを開く
            this.showSkillModal();
            // 保存ボタンの一時的なフック
            const saveSkillBtn = document.getElementById('saveSkillBtn');
            if (saveSkillBtn) {
                // 既存のイベントを一時保存
                const oldHandler = saveSkillBtn._characterSkillHandler;
                if (oldHandler) {
                    saveSkillBtn.removeEventListener('click', oldHandler);
                }
                // 新しいハンドラ
                const handler = () => {
                    // 通常の保存処理
                    this.saveSkillFromModal();
                    // スキルリストを再取得してプルダウンを更新
                    setTimeout(() => {
                        this.setupCharacterSkillUI(selectedSkills);
                    }, 200);
                    // 一度だけ実行
                    saveSkillBtn.removeEventListener('click', handler);
                    // 既存のハンドラがあれば再登録
                    if (oldHandler) {
                        saveSkillBtn.addEventListener('click', oldHandler);
                    }
                };
                saveSkillBtn.addEventListener('click', handler);
                saveSkillBtn._characterSkillHandler = handler;
            }
        };
        // 外部から参照できるようwindowに一時保存
        window._editingCharacterSkills = selectedSkills;
    }

    updateCharacterFormSelects() {
        const jobSelect = document.getElementById('characterJob');
        const raceSelect = document.getElementById('characterRace');
        const elementSelect = document.getElementById('characterElement');
        
        if (jobSelect) {
            jobSelect.innerHTML = '<option value="">選択してください</option>' +
                (masterManager.masterConfig.characterJobs || []).map(j => `<option value="${j}">${j}</option>`).join('');
        }
        
        if (raceSelect) {
            raceSelect.innerHTML = '<option value="">選択してください</option>' +
                (masterManager.masterConfig.characterRaces || []).map(r => `<option value="${r}">${r}</option>`).join('');
        }
        
        if (elementSelect) {
            elementSelect.innerHTML = '<option value="">選択してください</option>' +
                (masterManager.masterConfig.characterElements || []).map(e => `<option value="${e}">${e}</option>`).join('');
        }
    }

    // characterStatsObj: {statId: value} を受け取り、基礎値をinput欄に反映
    generateCharacterStatsFields(characterStatsObj = {}) {
        const container = document.getElementById('characterStatsFields');
        if (!container) return;
        const stats = masterManager.masterConfig.characterStats || [];
        // 入力欄（基礎値）
        container.innerHTML = stats.map(stat => {
            const value = (characterStatsObj[stat.id] !== undefined)
                ? characterStatsObj[stat.id]
                : (stat.defaultValue !== undefined ? stat.defaultValue : 0);
            return `
                <div class="form-group">
                    <label for="characterStat_${stat.id}">${stat.label}</label>
                    <input type="number" id="characterStat_${stat.id}" class="form-control character-stat-input" 
                        data-stat-id="${stat.id}" value="${value}" min="0">
                </div>
            `;
        }).join('');

        // 最終値表示欄を追加
        const finalStatsDivId = 'characterFinalStatsFields';
        let finalStatsDiv = document.getElementById(finalStatsDivId);
        if (!finalStatsDiv) {
            finalStatsDiv = document.createElement('div');
            finalStatsDiv.id = finalStatsDivId;
            finalStatsDiv.className = 'final-stats-fields';
            container.parentNode.insertBefore(finalStatsDiv, container.nextSibling);
        }
        this.updateCharacterFinalStatsView();

        // 入力欄・レベル・職業・種族変更時に最終値再計算
        stats.forEach(stat => {
            const input = document.getElementById(`characterStat_${stat.id}`);
            if (input) {
                input.addEventListener('input', () => this.updateCharacterFinalStatsView());
            }
        });
        ['characterLevel','characterJob','characterRace'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.updateCharacterFinalStatsView());
            }
        });
    }

    // レベル・補正込みの最終値を計算・表示
    updateCharacterFinalStatsView() {
        const stats = masterManager.masterConfig.characterStats || [];
        const levelUpConfig = masterManager.masterConfig.levelUpConfig || {};
        const jobBonuses = masterManager.masterConfig.jobBonuses || {};
        const raceBonuses = masterManager.masterConfig.raceBonuses || {};
        const job = document.getElementById('characterJob')?.value || '';
        const race = document.getElementById('characterRace')?.value || '';
        const level = parseInt(document.getElementById('characterLevel')?.value) || 1;
        // 入力値（基礎値）
        const baseStats = {};
        stats.forEach(stat => {
            const input = document.getElementById(`characterStat_${stat.id}`);
            baseStats[stat.id] = input ? (parseInt(input.value) || 0) : 0;
        });
        // ボーナス加算
        let allocatedBonus = {};
        if (this.editingCharacterId) {
            const existingCharacter = this.characterManager.getCharacter(this.editingCharacterId);
            allocatedBonus = existingCharacter?.allocatedBonus || {};
        }
        // 最終値計算
        const finalStats = {};
        stats.forEach(stat => {
            const baseValue = baseStats[stat.id] || 0;
            const levelUpValue = levelUpConfig[stat.id] || 1;
            const jobBonus = (jobBonuses[job] && jobBonuses[job][stat.id]) || 0;
            const raceBonus = (raceBonuses[race] && raceBonuses[race][stat.id]) || 0;
            const totalLevelUpValue = levelUpValue + jobBonus + raceBonus;
            const levelUps = level - 1;
            let value = baseValue + (totalLevelUpValue * levelUps);
            // ボーナスポイント加算
            const points = allocatedBonus[stat.id] || 0;
            const rates = { hp: 10, mp: 5 };
            const rate = rates[stat.id] || 1;
            value += points * rate;
            finalStats[stat.id] = value;
        });
        // 表示
        const finalStatsDiv = document.getElementById('characterFinalStatsFields');
        if (finalStatsDiv) {
            finalStatsDiv.innerHTML = '<h5>最終ステータス（レベル・補正込み/編集不可）</h5>' +
                stats.map(stat => `<div><strong>${stat.label}:</strong> ${finalStats[stat.id]}</div>`).join('');
        }
    }

    saveCharacter() {
        const name = document.getElementById('characterName').value.trim();
        if (!name) {
            alert('キャラクター名を入力してください');
            return;
        }

        const dialoguesText = document.getElementById('characterDialogues').value.trim();
        // スキルはwindow._editingCharacterSkillsから取得
        let selectedSkills = Array.isArray(window._editingCharacterSkills) ? window._editingCharacterSkills : [];
        const tagsText = document.getElementById('characterTags').value.trim();

        // 動的ステータス（基礎値）のみを収集
        const stats = {};
        document.querySelectorAll('.character-stat-input').forEach(input => {
            const statId = input.dataset.statId;
            stats[statId] = parseInt(input.value) || 0;
        });

        // タグを配列に変換
        const tags = tagsText ? tagsText.split(',').map(t => t.trim()).filter(t => t) : [];

        const level = parseInt(document.getElementById('characterLevel').value) || 1;
        const job = document.getElementById('characterJob').value;
        const race = document.getElementById('characterRace').value;

        // ボーナスポイントからの加算を適用
        let allocatedBonus = {};
        if (this.editingCharacterId) {
            const existingCharacter = this.characterManager.getCharacter(this.editingCharacterId);
            allocatedBonus = existingCharacter.allocatedBonus || {};
        }

        const characterData = {
            name,
            job: job,
            race: race,
            element: document.getElementById('characterElement').value,
            level: level,
            stats: stats, // 基礎値のみ保存
            personality: document.getElementById('characterPersonality').value.trim(),
            background: document.getElementById('characterBackground').value.trim(),
            dialogues: dialoguesText ? dialoguesText.split('\n').filter(d => d.trim()) : [],
            skills: selectedSkills,
            imageUrl: document.getElementById('characterImage').value.trim(),
            tags: tags,
            allocatedBonus: allocatedBonus
        };

        if (this.editingCharacterId) {
            // 編集
            const existingCharacter = this.characterManager.getCharacter(this.editingCharacterId);
            // レベルが変更された場合、ボーナスポイントを再計算
            if (existingCharacter && existingCharacter.level !== level) {
                characterData.bonusPoints = (existingCharacter.bonusPoints || 0) + ((level - existingCharacter.level) * 5);
            } else {
                characterData.bonusPoints = existingCharacter ? existingCharacter.bonusPoints : 0;
            }
            // Characterインスタンスで保存
            const updatedCharacter = new Character(
                this.editingCharacterId,
                characterData.name,
                characterData.job,
                characterData.race,
                characterData.element,
                characterData.level,
                characterData.stats,
                characterData.personality,
                characterData.background,
                characterData.dialogues,
                characterData.skills,
                characterData.imageUrl,
                characterData.bagItems || {},
                characterData.tags,
                characterData.exp || 0,
                characterData.levelHistory || [],
                characterData.bonusPoints || 0,
                characterData.allocatedBonus || {}
            );
            this.characterManager.updateCharacter(this.editingCharacterId, updatedCharacter);
        } else {
            // 新規追加：レベルに応じてボーナスポイントを計算
            const bonusPoints = (level - 1) * 5;
            const newId = this.characterManager.generateId();
            const character = new Character(
                newId,
                characterData.name,
                characterData.job,
                characterData.race,
                characterData.element,
                characterData.level,
                characterData.stats,
                characterData.personality,
                characterData.background,
                characterData.dialogues,
                characterData.skills,
                characterData.imageUrl,
                characterData.bagItems || {},
                characterData.tags,
                characterData.exp || 0,
                characterData.levelHistory || [],
                bonusPoints,
                characterData.allocatedBonus || {}
            );
            this.characterManager.addCharacter(character);
        }

        this.uiManager.hideModal('characterModal');
        this.renderCharacterList();
        this.updateCharacterTagFilter(); // タグフィルターを更新
        this.updateSimulationCharacterSelect(); // シミュレーションのキャラクター選択を更新
    }

    renderCharacterList() {
        const container = document.getElementById('characterListView');
        if (!container) return;

        const characters = this.characterManager.getAllCharacters();

        if (characters.length === 0) {
            container.innerHTML = '<div class="empty-message">キャラクターが登録されていません</div>';
            return;
        }

        // ステータスリストを取得
        const statsList = masterManager && masterManager.masterConfig && masterManager.masterConfig.characterStats ? masterManager.masterConfig.characterStats : [];

        // スキル欄UIの初期化は不要（個別編集時のみ）

        let html = '<div class="data-grid">';
        characters.forEach(character => {
            // ステータス表示を「最終値」で計算
            const statsHtml = statsList.map((stat, index) => {
                // 基礎値
                const base = (character.stats && character.stats[stat.id] != null) ? character.stats[stat.id] : (stat.defaultValue != null ? stat.defaultValue : 0);
                // レベル・職業・種族補正
                const masterConfig = (typeof masterManager !== 'undefined' && masterManager && masterManager.masterConfig) ? masterManager.masterConfig : {};
                const levelUpConfig = masterConfig.levelUpConfig || {};
                const jobBonuses = masterConfig.jobBonuses || {};
                const raceBonuses = masterConfig.raceBonuses || {};
                const level = character.level != null ? character.level : 1;
                const levelUpValue = levelUpConfig[stat.id] != null ? levelUpConfig[stat.id] : 1;
                const jobBonus = (character.job && jobBonuses[character.job] && jobBonuses[character.job][stat.id]) ? jobBonuses[character.job][stat.id] : 0;
                const raceBonus = (character.race && raceBonuses[character.race] && raceBonuses[character.race][stat.id]) ? raceBonuses[character.race][stat.id] : 0;
                const totalLevelUpValue = levelUpValue + jobBonus + raceBonus;
                const levelUps = level - 1;
                let value = base + (totalLevelUpValue * levelUps);
                // ボーナスポイント加算
                const allocatedBonus = character.allocatedBonus || {};
                const points = allocatedBonus[stat.id] != null ? allocatedBonus[stat.id] : 0;
                const rates = { hp: 10, mp: 5 };
                const rate = rates[stat.id] || 1;
                value += points * rate;
                return `<div class="stat-col"><strong>${stat.label}:</strong> ${value}</div>`;
            }).reduce((acc, cur, index) => {
                if (index % 3 === 0) {
                    return acc + `</div><div class="stat-row">${cur}`;
                }
                return acc + cur;
            }, '<div class="stat-row">') + '</div>';

            // タグ表示
            const tagsHtml = Array.isArray(character.tags) && character.tags.length > 0 
                ? `<div class="tags">${character.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
                : '';

            // 経験値バー
            const expProgress = character.getExpProgress();
            const requiredExp = character.getRequiredExpForNextLevel();
            const expBarHtml = `
                <div class="exp-bar-container">
                    <div class="exp-label">EXP: ${character.exp} / ${requiredExp}</div>
                    <div class="exp-bar">
                        <div class="exp-bar-fill" style="width: ${expProgress}%"></div>
                    </div>
                </div>
            `;

            // スキル名を安全に取得
            let skillNames = [];
            if (Array.isArray(character.skills) && character.skills.length > 0) {
                const allSkills = (this.dataStorage && typeof this.dataStorage.getAllSkills === 'function') ? this.dataStorage.getAllSkills() : [];
                character.skills.forEach(id => {
                    if (!id) return;
                    const skill = allSkills.find(s => s.id === id);
                    if (skill && skill.name) {
                        skillNames.push(skill.name);
                    } else if (typeof id === 'string' && id.trim() !== '') {
                        skillNames.push(id); // 自由記述や旧データ
                    }
                });
            }
            html += `
                <div class="data-card">
                    ${character.imageUrl ? `<img src="${character.imageUrl}" alt="${character.name}" class="data-card-image">` : ''}
                    <div class="data-card-content">
                        <h3 class="data-card-title">${character.name || '(名前未設定)'}</h3>
                        <div class="data-card-badges">
                            ${character.job ? `<span class="badge badge-info">${character.job}</span>` : ''}
                            ${character.race ? `<span class="badge badge-secondary">${character.race}</span>` : ''}
                            ${character.element ? `<span class="badge badge-warning">${character.element}</span>` : ''}
                            <span class="badge badge-primary">Lv.${character.level}</span>
                        </div>
                        ${expBarHtml}
                        ${character.bonusPoints > 0 ? `<div class="bonus-points-display"><span class="badge badge-success">ボーナスポイント: ${character.bonusPoints}</span></div>` : ''}
                        <div class="character-stats">
                            ${statsHtml}
                        </div>
                        ${character.personality ? `<p class="character-personality"><strong>性格:</strong> ${character.personality}</p>` : ''}
                        <p class="character-skills"><strong>スキル:</strong> ${skillNames.length > 0 ? skillNames.join(', ') : 'なし'}</p>
                        ${tagsHtml}
                        <div class="data-card-actions">
                            <button class="btn btn-success btn-sm" onclick="app.addExpToCharacter('${character.id}')">経験値追加</button>
                            <button class="btn btn-info btn-sm" onclick="app.viewLevelHistory('${character.id}')">履歴</button>
                            <button class="btn btn-primary btn-sm" onclick="app.editCharacter('${character.id}')">編集</button>
                            <button class="btn btn-danger btn-sm" onclick="app.deleteCharacter('${character.id}')">削除</button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        
        // タグフィルターを更新
        this.updateCharacterTagFilter();
    }

    editCharacter(id) {

        const character = this.characterManager.getCharacter(id);
        if (!character) return;
        // スキル編集状態をリセットし、キャラクターのスキルをセット
        let selectedSkills = [];
        if (character.skills && Array.isArray(character.skills)) {
            selectedSkills = [...character.skills];
        }
        window._editingCharacterSkills = selectedSkills;
        this.setupCharacterSkillUI(selectedSkills);

        this.editingCharacterId = id;
        
        console.log('editCharacter - character:', character);
        console.log('editCharacter - level:', character.level);
        console.log('editCharacter - bonusPoints before:', character.bonusPoints);
        
        // ボーナスポイントの整合性チェック
        const totalPointsFromLevel = (character.level - 1) * 5;
        const usedPoints = Object.values(character.allocatedBonus || {}).reduce((sum, val) => sum + val, 0);
        const expectedBonusPoints = totalPointsFromLevel - usedPoints;
        
        console.log('totalPointsFromLevel:', totalPointsFromLevel);
        console.log('usedPoints:', usedPoints);
        console.log('expectedBonusPoints:', expectedBonusPoints);
        
        // 既存キャラクターにbonusPointsがない、または不整合がある場合は再計算
        if (character.bonusPoints === undefined || character.bonusPoints === null || 
            character.bonusPoints !== expectedBonusPoints) {
            character.bonusPoints = expectedBonusPoints;
            character.allocatedBonus = character.allocatedBonus || {};
            console.log('editCharacter - recalculated bonusPoints:', character.bonusPoints);
            this.characterManager.updateCharacter(character.id, character);
        }
        
        console.log('editCharacter - bonusPoints after:', character.bonusPoints);
        
        const nameEl = document.getElementById('characterName');
        if (nameEl) nameEl.value = character.name;
        const levelEl = document.getElementById('characterLevel');
        if (levelEl) levelEl.value = character.level;
        const personalityEl = document.getElementById('characterPersonality');
        if (personalityEl) personalityEl.value = character.personality;
        const backgroundEl = document.getElementById('characterBackground');
        if (backgroundEl) backgroundEl.value = character.background;
        const dialoguesEl = document.getElementById('characterDialogues');
        if (dialoguesEl) dialoguesEl.value = character.dialogues.join('\n');
        const skillsEl = document.getElementById('characterSkills');
        if (skillsEl) skillsEl.value = character.skills.join('\n');
        const imageEl = document.getElementById('characterImage');
        if (imageEl) imageEl.value = character.imageUrl || '';
        const tagsEl = document.getElementById('characterTags');
        if (tagsEl) tagsEl.value = character.tags ? character.tags.join(', ') : '';

        // マスタ設定から選択肢を更新
        this.updateCharacterFormSelects();
        
        // 選択値を設定
        const jobEl = document.getElementById('characterJob');
        if (jobEl) jobEl.value = character.job;
        const raceEl = document.getElementById('characterRace');
        if (raceEl) raceEl.value = character.race;
        const elementEl = document.getElementById('characterElement');
        if (elementEl) elementEl.value = character.element;
        
        // ステータスフィールドを基礎値で生成
        this.generateCharacterStatsFields(character.stats);

        // ボーナスポイント振り分けUIを表示
        this.showBonusAllocation(character);

        this.uiManager.showModal('characterModal');
    }

    // ボーナスポイント振り分けUIを初期化
    initializeBonusAllocationUI() {
        console.log('initializeBonusAllocationUI called');
        const allocationFields = document.getElementById('bonusAllocationFields');
        if (!allocationFields) {
            console.error('bonusAllocationFields not found');
            return;
        }

        const stats = masterManager.masterConfig.characterStats || [];
        console.log('stats:', stats);
        let html = '<div class="bonus-allocation-grid">';
        
        stats.forEach(stat => {
            const rates = { hp: 10, mp: 5 };
            const rate = rates[stat.id] || 1;
            html += `
                <div class="bonus-allocation-row">
                    <label>${stat.label} (+${rate}/pt)</label>
                    <div class="bonus-controls">
                        <button type="button" class="btn btn-sm btn-secondary" onclick="app.allocateBonus('${stat.id}', -1)">-</button>
                        <span id="bonus_${stat.id}" class="bonus-value">0</span>
                        <button type="button" class="btn btn-sm btn-primary" onclick="app.allocateBonus('${stat.id}', 1)">+</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        console.log('Generated HTML length:', html.length);
        console.log('Generated HTML:', html);
        allocationFields.innerHTML = html;
        console.log('allocationFields.innerHTML after set:', allocationFields.innerHTML.substring(0, 200));
    }

    // ボーナスポイント振り分けUIを表示
    showBonusAllocation(character) {
        console.log('=== showBonusAllocation START ===');
        console.log('character:', character);
        console.log('character.bonusPoints:', character.bonusPoints);
        
        const bonusSection = document.getElementById('bonusPointsSection');
        const remainingPoints = document.getElementById('remainingBonusPoints');
        const allocationFields = document.getElementById('bonusAllocationFields');

        console.log('bonusSection found:', !!bonusSection);
        console.log('remainingPoints found:', !!remainingPoints);
        console.log('allocationFields found:', !!allocationFields);

        if (!bonusSection || !remainingPoints || !allocationFields) {
            console.error('Bonus elements not found');
            return;
        }

        // UIがまだ生成されていない場合は生成
        console.log('allocationFields.innerHTML:', allocationFields.innerHTML.length);
        if (!allocationFields.innerHTML || allocationFields.innerHTML.length < 100) {
            console.log('Initializing bonus allocation UI...');
            this.initializeBonusAllocationUI();
        }

        // ボーナスポイントがない、かつ振り分け済みもない場合
        const hasAllocated = character.allocatedBonus && Object.keys(character.allocatedBonus).length > 0;
        const totalPoints = (character.level - 1) * 5; // 総ボーナスポイント
        
        console.log('Check bonusPoints:', character.bonusPoints, 'Type:', typeof character.bonusPoints);
        console.log('hasAllocated:', hasAllocated);
        console.log('totalPoints:', totalPoints);
        
        // レベル1で振り分けもない場合のみ非表示
        if (totalPoints <= 0 && !hasAllocated) {
            console.log('Hiding bonus section (level 1, no allocation)');
            bonusSection.style.display = 'none';
            return;
        }

        console.log('Showing bonus section');
        bonusSection.style.display = 'block';
        remainingPoints.textContent = character.bonusPoints || 0;

        // 既に割り振られたボーナスを表示に反映
        console.log('allocatedBonus:', character.allocatedBonus);
        Object.keys(character.allocatedBonus || {}).forEach(statId => {
            const bonusDisplay = document.getElementById(`bonus_${statId}`);
            if (bonusDisplay) {
                bonusDisplay.textContent = character.allocatedBonus[statId] || 0;
            }
        });
        console.log('=== showBonusAllocation END ===');
    }

    // ボーナスポイント振り分け処理
    allocateBonus(statId, points) {
        let character;
        
        if (this.editingCharacterId) {
            // 編集モード
            character = this.characterManager.getCharacter(this.editingCharacterId);
            if (!character) {
                console.error('Character not found');
                return;
            }
            
            // Characterインスタンスでない場合は再インスタンス化
            if (!(character instanceof Character)) {
                character = new Character(
                    character.id, character.name, character.job, character.race, character.element,
                    character.level, character.stats, character.personality, character.background,
                    character.dialogues, character.skills, character.imageUrl, character.bagItems,
                    character.tags, character.exp, character.levelHistory,
                    character.bonusPoints, character.allocatedBonus
                );
            }
        } else {
            // 新規作成モード：現在の入力値から一時的なキャラクターを作成
            const level = parseInt(document.getElementById('characterLevel').value) || 1;
            const bonusPoints = (level - 1) * 5;
            
            // 現在のステータスを収集
            const stats = {};
            document.querySelectorAll('.character-stat-input').forEach(input => {
                stats[input.dataset.statId] = parseInt(input.value) || 0;
            });
            
            character = {
                bonusPoints: bonusPoints,
                allocatedBonus: {},
                stats: stats
            };
        }

        if (points > 0 && character.bonusPoints < points) {
            alert('ボーナスポイントが不足しています');
            return;
        }

        const bonusDisplay = document.getElementById(`bonus_${statId}`);
        const currentBonus = parseInt(bonusDisplay.textContent) || 0;

        if (points < 0 && currentBonus <= 0) {
            return; // これ以上減らせない
        }

        // ボーナス適用（手動で実装）
        const rates = { hp: 10, mp: 5 };
        const rate = rates[statId] || 1;
        
        // ステータスを加算
        character.stats[statId] = (character.stats[statId] || 0) + (points * rate);
        
        // ボーナスポイントを減算
        character.bonusPoints -= points;
        
        // 振り分け履歴を記録
        if (!character.allocatedBonus) character.allocatedBonus = {};
        character.allocatedBonus[statId] = (character.allocatedBonus[statId] || 0) + points;

        // 表示更新
        bonusDisplay.textContent = currentBonus + points;
        document.getElementById('remainingBonusPoints').textContent = character.bonusPoints;
        
        // ステータス値更新
        const statInput = document.getElementById(`characterStat_${statId}`);
        if (statInput) {
            statInput.value = character.stats[statId];
        }

        // キャラクターを保存（編集モードのみ）
        if (this.editingCharacterId) {
            this.characterManager.updateCharacter(character.id, character);
        }
    }

    // ボーナスポイントをリセット
    resetBonusPoints() {
        if (!confirm('ボーナスポイントの振り分けをリセットしますか？')) {
            return;
        }

        if (this.editingCharacterId) {
            const character = this.characterManager.getCharacter(this.editingCharacterId);
            if (!character) return;

            // レベルから総ボーナスポイントを計算
            const totalPoints = (character.level - 1) * 5;
            
            // ボーナスポイントをリセット
            character.bonusPoints = totalPoints;
            character.allocatedBonus = {};
            
            // ステータスを再計算
            const masterConfig = JSON.parse(localStorage.getItem('masterConfig') || '{}');
            const levelUpConfig = masterConfig.levelUpConfig || {};
            const characterStats = masterConfig.characterStats || [];
            const jobBonuses = masterConfig.jobBonuses || {};
            const raceBonuses = masterConfig.raceBonuses || {};
            
            characterStats.forEach(stat => {
                const baseValue = stat.defaultValue || 0;
                const levelUpValue = levelUpConfig[stat.id] || 1;
                const jobBonus = (jobBonuses[character.job] && jobBonuses[character.job][stat.id]) || 0;
                const raceBonus = (raceBonuses[character.race] && raceBonuses[character.race][stat.id]) || 0;
                const totalLevelUpValue = levelUpValue + jobBonus + raceBonus;
                
                const levelUps = character.level - 1;
                character.stats[stat.id] = baseValue + (totalLevelUpValue * levelUps);
            });
            
            // 保存
            this.characterManager.updateCharacter(character.id, character);
            
            // UI更新
            document.getElementById('remainingBonusPoints').textContent = character.bonusPoints;
            
            // 振り分け表示をリセット
            characterStats.forEach(stat => {
                const bonusDisplay = document.getElementById(`bonus_${stat.id}`);
                if (bonusDisplay) {
                    bonusDisplay.textContent = '0';
                }
                // ステータス入力欄は上書きしない
            });
            
            alert('ボーナスポイントをリセットしました');
        }
    }

    // レベル変更時にステータスを自動計算
    updateStatsForLevel() {
        const level = parseInt(document.getElementById('characterLevel').value) || 1;
        
        // マスターデータからデフォルト値とレベルアップ設定を取得
        const masterConfig = JSON.parse(localStorage.getItem('masterConfig') || '{}');
        const levelUpConfig = masterConfig.levelUpConfig || {};
        const characterStats = masterConfig.characterStats || [];
        
        console.log('levelUpConfig:', levelUpConfig);
        console.log('characterStats:', characterStats);
        
        // 入力欄は一切上書きしない。最終値は表示専用欄で再計算・表示する。
        if (typeof this.updateCharacterFinalStatsView === 'function') {
            this.updateCharacterFinalStatsView();
        }
    }

    // レベル変更時にボーナスポイントを更新
    updateBonusPointsForLevel() {
        const level = parseInt(document.getElementById('characterLevel').value) || 1;
        const remainingPointsDisplay = document.getElementById('remainingBonusPoints');
        const bonusSection = document.getElementById('bonusPointsSection');
        
        // UIが初期化されていない場合は初期化
        const allocationFields = document.getElementById('bonusAllocationFields');
        if (!allocationFields || !allocationFields.innerHTML) {
            this.initializeBonusAllocationUI();
        }
        
        if (this.editingCharacterId) {
            // 編集モードの場合は現在のキャラクターから計算
            const character = this.characterManager.getCharacter(this.editingCharacterId);
            if (character) {
                const levelDiff = level - character.level;
                const newBonusPoints = (character.bonusPoints || 0) + (levelDiff * 5);
                if (remainingPointsDisplay) {
                    remainingPointsDisplay.textContent = Math.max(0, newBonusPoints);
                }
                if (bonusSection) {
                    bonusSection.style.display = newBonusPoints > 0 ? 'block' : 'none';
                }
            }
        } else {
            // 新規作成の場合はレベルから計算
            const bonusPoints = (level - 1) * 5;
            if (remainingPointsDisplay) {
                remainingPointsDisplay.textContent = bonusPoints;
            }
            
            // ボーナスセクションの表示/非表示
            if (bonusSection) {
                bonusSection.style.display = bonusPoints > 0 ? 'block' : 'none';
            }
        }
    }

    // 関係性追加ボタン
    showRelationshipModal() {
        // キャラクター選択肢を更新
        this.updateRelationshipCharacterSelects();
        
        // フォームをクリア
        document.getElementById('relationship1').value = '';
        document.getElementById('relationship2').value = '';
        document.getElementById('relationshipType').value = '';
        document.getElementById('relationshipStrength').value = '50';
        document.getElementById('relationshipStrengthValue').textContent = '50';
        document.getElementById('relationshipDescription').value = '';
        
        const title = document.getElementById('relationshipModalTitle');
        if (title) {
            title.textContent = this.editingRelationshipId ? '関係性を編集' : '関係性を追加';
        }
        
        this.uiManager.showModal('relationshipModal');
    }

    updateRelationshipCharacterSelects() {
        const select1 = document.getElementById('relationship1');
        const select2 = document.getElementById('relationship2');
        
        if (!select1 || !select2) return;
        
        const characters = this.characterManager.getAllCharacters();
        
        [select1, select2].forEach(select => {
            select.innerHTML = '<option value="">-- キャラクターを選択 --</option>';
            characters.forEach(character => {
                const option = document.createElement('option');
                option.value = character.id;
                option.textContent = character.name;
                select.appendChild(option);
            });
        });
    }

    saveRelationship() {
        const char1 = document.getElementById('relationship1').value;
        const char2 = document.getElementById('relationship2').value;
        const type = document.getElementById('relationshipType').value;
        const strength = parseInt(document.getElementById('relationshipStrength').value);
        const description = document.getElementById('relationshipDescription').value.trim();

        if (!char1 || !char2) {
            alert('両方のキャラクターを選択してください。');
            return;
        }

        if (char1 === char2) {
            alert('異なるキャラクターを選択してください。');
            return;
        }

        if (!type) {
            alert('関係性のタイプを選択してください。');
            return;
        }

        // 既存の関係性をチェック
        const existing = this.relationshipManager.getRelationshipBetween(char1, char2);
        if (existing && !this.editingRelationshipId) {
            alert('この2人の関係性は既に登録されています。');
            return;
        }

        const relationshipData = {
            characterId1: char1,
            characterId2: char2,
            relationshipType: type,
            strength: strength,
            description: description
        };

        if (this.editingRelationshipId) {
            this.relationshipManager.updateRelationship(this.editingRelationshipId, relationshipData);
        } else {
            const relationship = new CharacterRelationship(
                this.relationshipManager.generateId(),
                char1,
                char2,
                type,
                strength,
                description
            );
            this.relationshipManager.addRelationship(relationship);
        }

        this.uiManager.hideModal('relationshipModal');
        this.renderRelationshipList();
    }

    renderRelationshipList() {
        const container = document.getElementById('relationshipListView');
        if (!container) return;

        const relationships = this.relationshipManager.getAllRelationships();

        if (relationships.length === 0) {
            container.innerHTML = '<div class="empty-message">関係性が登録されていません</div>';
            return;
        }

        let html = '<div class="relationship-grid">';
        relationships.forEach(rel => {
            const char1 = this.characterManager.getCharacter(rel.characterId1);
            const char2 = this.characterManager.getCharacter(rel.characterId2);

            if (!char1 || !char2) return;

            const strengthColor = rel.strength >= 75 ? '#28a745' : 
                                 rel.strength >= 50 ? '#ffc107' : 
                                 rel.strength >= 25 ? '#fd7e14' : '#dc3545';

            html += `
                <div class="relationship-card">
                    <div class="relationship-characters">
                        <div class="relationship-char">
                            ${char1.imageUrl ? `<img src="${char1.imageUrl}" alt="${char1.name}">` : ''}
                            <span>${char1.name}</span>
                        </div>
                        <div class="relationship-arrow">
                            <span class="relationship-type">${rel.relationshipType}</span>
                            <div class="relationship-strength-bar">
                                <div class="relationship-strength-fill" style="width: ${rel.strength}%; background: ${strengthColor};"></div>
                            </div>
                            <span class="relationship-strength-text">${rel.strength}%</span>
                        </div>
                        <div class="relationship-char">
                            ${char2.imageUrl ? `<img src="${char2.imageUrl}" alt="${char2.name}">` : ''}
                            <span>${char2.name}</span>
                        </div>
                    </div>
                    ${rel.description ? `<p class="relationship-description">${rel.description}</p>` : ''}
                    <div class="relationship-actions">
                        <button class="btn btn-primary btn-sm" onclick="app.editRelationship('${rel.id}')">編集</button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteRelationship('${rel.id}')">削除</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    editRelationship(id) {
        const relationship = this.relationshipManager.getRelationship(id);
        if (!relationship) return;

        this.editingRelationshipId = id;
        
        document.getElementById('relationship1').value = relationship.characterId1;
        document.getElementById('relationship2').value = relationship.characterId2;
        document.getElementById('relationshipType').value = relationship.relationshipType;
        document.getElementById('relationshipStrength').value = relationship.strength;
        document.getElementById('relationshipStrengthValue').textContent = relationship.strength;
        document.getElementById('relationshipDescription').value = relationship.description || '';

        this.showRelationshipModal();
    }

    deleteRelationship(id) {
        if (!confirm('この関係性を削除しますか?')) return;
        
        this.relationshipManager.deleteRelationship(id);
        this.renderRelationshipList();
    }

    // ==========================
    // プロット管理機能
    // ==========================
    updateCharacterTagFilter() {
        const select = document.getElementById('characterTagFilter');
        if (!select) return;

        const characters = this.characterManager.getAllCharacters();
        const allTags = new Set();
        
        characters.forEach(character => {
            if (character.tags) {
                character.tags.forEach(tag => allTags.add(tag));
            }
        });

        select.innerHTML = '<option value="">タグ: すべて</option>';
        Array.from(allTags).sort().forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            select.appendChild(option);
        });
    }

    // シミュレーションのキャラクター選択を更新
    updateSimulationCharacterSelect() {
        const select = document.getElementById('simulationCharacterSelect');
        if (!select) return;

        const characters = this.characterManager.getAllCharacters();
        
        select.innerHTML = '<option value="">-- 倉庫（共通） --</option>';
        characters.forEach(character => {
            const option = document.createElement('option');
            option.value = character.id;
            option.textContent = `${character.name} (Lv.${character.level})`;
            select.appendChild(option);
        });
    }

    // キャラクターリストのフィルタリング
    filterCharacterList() {
        const jobFilter = document.getElementById('characterJobFilter')?.value || '';
        const raceFilter = document.getElementById('characterRaceFilter')?.value || '';
        const tagFilter = document.getElementById('characterTagFilter')?.value || '';

        const characters = this.characterManager.getAllCharacters();
        const filtered = characters.filter(character => {
            if (jobFilter && character.job !== jobFilter) return false;
            if (raceFilter && character.race !== raceFilter) return false;
            if (tagFilter && (!character.tags || !character.tags.includes(tagFilter))) return false;
            return true;
        });

        // フィルター結果を表示
        this.renderFilteredCharacterList(filtered);
    }

    renderFilteredCharacterList(characters) {
        const container = document.getElementById('characterListView');
        if (!container) return;

        if (characters.length === 0) {
            container.innerHTML = '<div class="empty-message">条件に一致するキャラクターがありません</div>';
            return;
        }

        const statsList = masterManager.masterConfig.characterStats || [];

        let html = '<div class="data-grid">';
        characters.forEach(character => {
            // ステータス表示を生成
            const statsHtml = statsList.map((stat, index) => {
                const value = character.stats[stat.id] || stat.defaultValue;
                return `<span>${stat.label}: ${value}</span>`;
            }).reduce((acc, cur, index) => {
                if (index % 3 === 0) {
                    return acc + `</div><div class="stat-row">${cur}`;
                }
                return acc + cur;
            }, '<div class="stat-row">') + '</div>';

            // タグ表示
            const tagsHtml = character.tags && character.tags.length > 0 
                ? `<div class="tags">${character.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
                : '';

            html += `
                <div class="data-card">
                    ${character.imageUrl ? `<img src="${character.imageUrl}" alt="${character.name}" class="data-card-image">` : ''}
                    <h3>${character.name}</h3>
                    <p><strong>職業:</strong> ${character.job || 'なし'}</p>
                    <p><strong>種族:</strong> ${character.race || 'なし'}</p>
                    <p><strong>属性:</strong> ${character.element || 'なし'}</p>
                    <p><strong>レベル:</strong> ${character.level}</p>
                    <div class="stat-display">
                        ${statsHtml}
                    </div>
                    ${tagsHtml}
                    <p><strong>性格:</strong> ${character.personality || 'なし'}</p>
                    <div class="button-group">
                        <button class="btn btn-primary btn-sm" onclick="app.editCharacter('${character.id}')">編集</button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteCharacter('${character.id}')">削除</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    // ==========================
    // プロット管理機能
    // ==========================

    clearChapterForm() {
        document.getElementById('chapterTitle').value = '';
        document.getElementById('chapterDescription').value = '';
        document.getElementById('chapterStatus').value = 'not-started';
    }

    saveChapter() {
        const title = document.getElementById('chapterTitle').value.trim();
        if (!title) {
            alert('章タイトルを入力してください');
            return;
        }

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            alert('作品を選択してください');
            return;
        }

        const chapterData = {
            title,
            description: document.getElementById('chapterDescription').value.trim(),
            status: document.getElementById('chapterStatus').value,
            workId: currentWork.id
        };

        if (this.editingChapterId) {
            this.plotManager.updateChapter(this.editingChapterId, chapterData);
        } else {
            const chapters = this.plotManager.getChaptersByWorkId(currentWork.id);
            const chapter = {
                id: this.plotManager.generateChapterId(),
                ...chapterData,
                order: chapters.length + 1,
                scenes: []
            };
            this.plotManager.addChapter(chapter);
        }

        this.uiManager.hideModal('chapterModal');
        this.renderChapterList();
    }

    renderChapterList() {
        const container = document.getElementById('chapterListView');
        if (!container) return;

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            container.innerHTML = '<div class="empty-message">作品を選択してください</div>';
            return;
        }

        const chapters = this.plotManager.getChaptersByWorkId(currentWork.id);

        if (chapters.length === 0) {
            container.innerHTML = '<div class="empty-message">章が作成されていません</div>';
            return;
        }

        let html = '';
        chapters.forEach((chapter, index) => {
            const scenes = this.plotManager.getScenesByChapter(chapter.id);
            const statusLabel = { 'not-started': '未着手', 'in-progress': '執筆中', 'completed': '完了' };
            const statusClass = { 'not-started': 'badge-secondary', 'in-progress': 'badge-warning', 'completed': 'badge-success' };

            html += `
                <div class="chapter-card" data-chapter-id="${chapter.id}">
                    <div class="chapter-header">
                        <div class="chapter-info">
                            <h3>第${index + 1}章: ${chapter.title}</h3>
                            <span class="badge ${statusClass[chapter.status]}">${statusLabel[chapter.status]}</span>
                            <span class="badge badge-info">${scenes.length}シーン</span>
                        </div>
                        <div class="chapter-actions">
                            <button class="btn btn-sm btn-secondary" onclick="app.moveChapter('${chapter.id}', -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
                            <button class="btn btn-sm btn-secondary" onclick="app.moveChapter('${chapter.id}', 1)" ${index === chapters.length - 1 ? 'disabled' : ''}>↓</button>
                            <button class="btn btn-sm btn-primary" onclick="app.editChapter('${chapter.id}')">編集</button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteChapter('${chapter.id}')">削除</button>
                        </div>
                    </div>
                    ${chapter.description ? `<p class="chapter-description">${chapter.description}</p>` : ''}
                    
                    <div class="chapter-scenes-section">
                        <div class="scenes-header">
                            <h4>シーン</h4>
                            <button class="btn btn-sm btn-success" onclick="app.addSceneToChapter('${chapter.id}')">
                                + シーンを追加
                            </button>
                        </div>
                        ${scenes.length > 0 ? `
                            <ul class="scene-list">
                                ${scenes.map((scene, sIndex) => `
                                    <li class="scene-item">
                                        <div class="scene-info">
                                            <span class="scene-number">${sIndex + 1}</span>
                                            <span class="scene-title">${scene.title}</span>
                                            ${scene.location ? `<span class="scene-meta">📍 ${scene.location}</span>` : ''}
                                            ${scene.timeOfDay ? `<span class="scene-meta">⏰ ${scene.timeOfDay}</span>` : ''}
                                            ${scene.characters.length > 0 ? `<span class="scene-meta">👥 ${scene.characters.length}人</span>` : ''}
                                        </div>
                                        <div class="scene-actions">
                                            <button class="btn btn-xs btn-secondary" onclick="app.moveScene('${scene.id}', -1)" ${sIndex === 0 ? 'disabled' : ''}>↑</button>
                                            <button class="btn btn-xs btn-secondary" onclick="app.moveScene('${scene.id}', 1)" ${sIndex === scenes.length - 1 ? 'disabled' : ''}>↓</button>
                                            <button class="btn btn-xs btn-primary" onclick="app.editScene('${scene.id}')">編集</button>
                                            <button class="btn btn-xs btn-danger" onclick="app.deleteScene('${scene.id}')">削除</button>
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : '<p class="empty-scene-message">シーンがありません</p>'}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    editChapter(id) {
        const chapter = this.plotManager.getChapter(id);
        if (!chapter) return;

        this.editingChapterId = id;
        document.getElementById('chapterTitle').value = chapter.title;
        document.getElementById('chapterDescription').value = chapter.description;
        document.getElementById('chapterStatus').value = chapter.status;

        this.uiManager.showModal('chapterModal');
    }

    deleteChapter(id) {
        if (!confirm('この章とすべてのシーンを削除しますか?')) return;
        
        this.plotManager.deleteChapter(id);
        this.renderChapterList();
    }

    moveChapter(id, direction) {
        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) return;

        const chapters = this.plotManager.getChaptersByWorkId(currentWork.id);
        const index = chapters.findIndex(c => c.id === id);
        
        if (index === -1) return;
        if ((direction === -1 && index === 0) || (direction === 1 && index === chapters.length - 1)) return;

        const newIndex = index + direction;
        [chapters[index].order, chapters[newIndex].order] = [chapters[newIndex].order, chapters[index].order];
        
        this.plotManager.saveChapters();
        this.renderChapterList();
        this.renderSceneCards(); // シーンカードも更新
    }

    // ==========================
    // シーンカード機能
    // ==========================

    renderSceneCards() {
        const container = document.getElementById('sceneCardsView');
        const filterSelect = document.getElementById('sceneCardChapterFilter');
        
        if (!container) return;

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            container.innerHTML = '<div class="empty-message">作品を選択してください</div>';
            return;
        }

        // フィルター選択肢を更新
        if (filterSelect) {
            const chapters = this.plotManager.getChaptersByWorkId(currentWork.id);
            filterSelect.innerHTML = '<option value="">すべての章</option>';
            chapters.forEach(chapter => {
                const option = document.createElement('option');
                option.value = chapter.id;
                option.textContent = chapter.title;
                filterSelect.appendChild(option);
            });
        }

        const selectedChapterId = filterSelect ? filterSelect.value : '';
        let scenes = [];

        if (selectedChapterId) {
            scenes = this.plotManager.getScenesByChapterId(selectedChapterId);
        } else {
            const chapters = this.plotManager.getChaptersByWorkId(currentWork.id);
            chapters.forEach(chapter => {
                const chapterScenes = this.plotManager.getScenesByChapterId(chapter.id);
                scenes = scenes.concat(chapterScenes);
            });
        }

        if (scenes.length === 0) {
            container.innerHTML = '<div class="empty-message">シーンが作成されていません</div>';
            return;
        }

        let html = '<div class="scene-cards-grid">';
        scenes.forEach(scene => {
            const chapter = this.plotManager.getChapter(scene.chapterId);
            const chapterTitle = chapter ? chapter.title : '不明';

            // 登場キャラクター
            const characterNames = scene.characters.map(charId => {
                const char = this.characterManager.getCharacter(charId);
                return char ? char.name : '不明';
            }).join(', ');

            // 文字数
            const wordCount = scene.content ? scene.content.length : 0;

            html += `
                <div class="scene-card" draggable="true" data-scene-id="${scene.id}">
                    <div class="scene-card-header">
                        <h4>${scene.title}</h4>
                        <span class="scene-card-chapter">${chapterTitle}</span>
                    </div>
                    <div class="scene-card-body">
                        ${scene.location ? `<p class="scene-location">📍 ${scene.location}</p>` : ''}
                        ${scene.timeOfDay ? `<p class="scene-time">🕐 ${scene.timeOfDay}</p>` : ''}
                        ${characterNames ? `<p class="scene-characters">👤 ${characterNames}</p>` : ''}
                        <p class="scene-word-count">${wordCount}文字</p>
                        ${scene.content ? `<p class="scene-preview">${scene.content.substring(0, 100)}...</p>` : ''}
                    </div>
                    <div class="scene-card-actions">
                        <button class="btn btn-primary btn-sm" onclick="app.editScene('${scene.id}')">編集</button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteScene('${scene.id}')">削除</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    // ==========================
    // プロット分析機能
    // ==========================

    renderPlotAnalytics() {
        const container = document.getElementById('plotAnalyticsView');
        if (!container) return;

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            container.innerHTML = '<div class="empty-message">作品を選択してください</div>';
            return;
        }

        const chapters = this.plotManager.getChaptersByWorkId(currentWork.id);
        let totalScenes = 0;
        let totalWords = 0;
        const characterAppearances = {};

        // 統計を計算
        chapters.forEach(chapter => {
            const scenes = this.plotManager.getScenesByChapterId(chapter.id);
            totalScenes += scenes.length;

            scenes.forEach(scene => {
                if (scene.content) {
                    totalWords += scene.content.length;
                }

                // キャラクター登場回数を集計
                scene.characters.forEach(charId => {
                    if (!characterAppearances[charId]) {
                        characterAppearances[charId] = 0;
                    }
                    characterAppearances[charId]++;
                });
            });
        });

        // キャラクター登場回数をソート
        const sortedCharacters = Object.entries(characterAppearances)
            .map(([charId, count]) => {
                const char = this.characterManager.getCharacter(charId);
                return { name: char ? char.name : '不明', count: count };
            })
            .sort((a, b) => b.count - a.count);

        // HTML生成
        let html = '<div class="analytics-grid">';

        // 基本統計
        html += `
            <div class="analytics-card">
                <h3>基本統計</h3>
                <div class="analytics-stats">
                    <div class="analytics-stat">
                        <span class="stat-label">章数</span>
                        <span class="stat-value">${chapters.length}</span>
                    </div>
                    <div class="analytics-stat">
                        <span class="stat-label">シーン数</span>
                        <span class="stat-value">${totalScenes}</span>
                    </div>
                    <div class="analytics-stat">
                        <span class="stat-label">総文字数</span>
                        <span class="stat-value">${totalWords.toLocaleString()}</span>
                    </div>
                    <div class="analytics-stat">
                        <span class="stat-label">平均シーン長</span>
                        <span class="stat-value">${totalScenes > 0 ? Math.floor(totalWords / totalScenes).toLocaleString() : 0}</span>
                    </div>
                </div>
            </div>
        `;

        // キャラクター登場回数
        html += `
            <div class="analytics-card">
                <h3>キャラクター登場回数</h3>
                <div class="character-appearances">
                    ${sortedCharacters.length > 0 ? sortedCharacters.map(char => `
                        <div class="appearance-item">
                            <span class="appearance-name">${char.name}</span>
                            <div class="appearance-bar-container">
                                <div class="appearance-bar" style="width: ${(char.count / totalScenes) * 100}%"></div>
                            </div>
                            <span class="appearance-count">${char.count}回</span>
                        </div>
                    `).join('') : '<p>キャラクターが登場していません</p>'}
                </div>
            </div>
        `;

        // 章別統計
        html += `
            <div class="analytics-card analytics-card-wide">
                <h3>章別統計</h3>
                <table class="analytics-table">
                    <thead>
                        <tr>
                            <th>章</th>
                            <th>シーン数</th>
                            <th>文字数</th>
                            <th>ステータス</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        chapters.forEach(chapter => {
            const scenes = this.plotManager.getScenesByChapterId(chapter.id);
            let chapterWords = 0;
            scenes.forEach(scene => {
                if (scene.content) chapterWords += scene.content.length;
            });

            const statusLabel = {
                'not-started': '未着手',
                'in-progress': '執筆中',
                'completed': '完了'
            }[chapter.status] || chapter.status;

            html += `
                <tr>
                    <td>${chapter.title}</td>
                    <td>${scenes.length}</td>
                    <td>${chapterWords.toLocaleString()}</td>
                    <td><span class="status-badge status-${chapter.status}">${statusLabel}</span></td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        html += '</div>';

        container.innerHTML = html;
    }

    // ==========================
    // AI連携機能
    // ==========================

    initializeAIFeatures() {
        // プロット生成ボタン
        const generatePlotBtn = document.getElementById('generatePlotBtn');
        if (generatePlotBtn) {
            generatePlotBtn.addEventListener('click', () => this.generatePlotSuggestions());
        }

        // 台詞生成ボタン
        const generateDialogueBtn = document.getElementById('generateDialogueBtn');
        if (generateDialogueBtn) {
            generateDialogueBtn.addEventListener('click', () => this.generateDialogueSuggestions());
        }

        // 矛盾チェックボタン
        const checkConsistencyBtn = document.getElementById('checkConsistencyBtn');
        if (checkConsistencyBtn) {
            checkConsistencyBtn.addEventListener('click', () => this.checkConsistency());
        }

        // キャラクター選択肢を更新
        this.updateDialogueCharacterSelect();
    }

    updateDialogueCharacterSelect() {
        const select = document.getElementById('dialogueCharacterSelect');
        if (!select) return;

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) return;

        const characters = this.characterManager.getCharactersByWorkId(currentWork.id);
        
        select.innerHTML = '<option value="">-- キャラクターを選択 --</option>';
        characters.forEach(char => {
            const option = document.createElement('option');
            option.value = char.id;
            option.textContent = char.name;
            select.appendChild(option);
        });
    }

    async generatePlotSuggestions() {
        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            alert('作品を選択してください');
            return;
        }

        const promptInput = document.getElementById('plotPrompt');
        const userPrompt = promptInput ? promptInput.value : '';

        // ローディング表示
        const btn = document.getElementById('generatePlotBtn');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳ 生成中...';

        try {
            // AI APIを呼び出す（ここではダミーデータを返す）
            const suggestions = await this.callPlotGenerationAPI(currentWork, userPrompt);
            
            // 結果を表示
            const resultBox = document.getElementById('plotSuggestions');
            const contentDiv = document.getElementById('plotSuggestionsContent');
            
            if (resultBox && contentDiv) {
                contentDiv.innerHTML = suggestions.map((suggestion, index) => `
                    <div class="suggestion-item">
                        <h5>案 ${index + 1}: ${suggestion.title}</h5>
                        <p>${suggestion.description}</p>
                        <button class="btn btn-success btn-sm" onclick="app.applySuggestionAsChapter(${index})">
                            この案を章として追加
                        </button>
                    </div>
                `).join('');
                resultBox.style.display = 'block';
            }
        } catch (error) {
            alert('プロット生成中にエラーが発生しました: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    async callPlotGenerationAPI(work, userPrompt) {
        // 実際のAI API呼び出しに置き換えられます
        // ここではダミーデータを返します
        return new Promise((resolve) => {
            setTimeout(() => {
                const chapters = this.plotManager.getChaptersByWorkId(work.id);
                const lastChapter = chapters.length > 0 ? chapters[chapters.length - 1].title : '序章';
                
                resolve([
                    {
                        title: `${lastChapter}からの展開`,
                        description: `${userPrompt ? userPrompt + 'を踏まえ、' : ''}主人公が新たな試練に直面する。仲間との絆が試される場面で、過去の秘密が明らかになる。`
                    },
                    {
                        title: '転機となる出来事',
                        description: '予期せぬ出来事により、物語が大きく動き出す。敵だと思っていた人物の本当の目的が判明し、主人公は重大な決断を迫られる。'
                    },
                    {
                        title: 'クライマックスへの布石',
                        description: '物語の核心に迫る重要な情報が明らかになる。主人公は最終決戦に向けて準備を整え、仲間たちとの絆を深める。'
                    }
                ]);
            }, 1500);
        });
    }

    applySuggestionAsChapter(index) {
        const contentDiv = document.getElementById('plotSuggestionsContent');
        if (!contentDiv) return;

        const suggestionItems = contentDiv.querySelectorAll('.suggestion-item');
        if (!suggestionItems[index]) return;

        const title = suggestionItems[index].querySelector('h5').textContent.replace(/^案 \d+: /, '');
        const description = suggestionItems[index].querySelector('p').textContent;

        // 章として追加
        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) return;

        const chapters = this.plotManager.getChaptersByWorkId(currentWork.id);
        const newOrder = chapters.length > 0 ? Math.max(...chapters.map(c => c.order)) + 1 : 1;

        const newChapter = {
            id: 'chapter_' + Date.now(),
            workId: currentWork.id,
            title: title,
            description: description,
            order: newOrder,
            status: 'not-started',
            createdAt: new Date().toISOString()
        };

        this.plotManager.addChapter(newChapter);
        this.renderChapterList();
        
        alert('章として追加しました！');
    }

    async generateDialogueSuggestions() {
        const characterSelect = document.getElementById('dialogueCharacterSelect');
        const situationInput = document.getElementById('dialogueSituation');

        if (!characterSelect || !situationInput) return;

        const characterId = characterSelect.value;
        const situation = situationInput.value;

        if (!characterId) {
            alert('キャラクターを選択してください');
            return;
        }

        if (!situation.trim()) {
            alert('状況・シチュエーションを入力してください');
            return;
        }

        const character = this.characterManager.getCharacter(characterId);
        if (!character) return;

        // ローディング表示
        const btn = document.getElementById('generateDialogueBtn');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳ 生成中...';

        try {
            // AI APIを呼び出す（ここではダミーデータを返す）
            const suggestions = await this.callDialogueGenerationAPI(character, situation);
            
            // 結果を表示
            const resultBox = document.getElementById('dialogueSuggestions');
            const contentDiv = document.getElementById('dialogueSuggestionsContent');
            
            if (resultBox && contentDiv) {
                contentDiv.innerHTML = suggestions.map((dialogue, index) => `
                    <div class="dialogue-suggestion">
                        <span class="dialogue-number">${index + 1}.</span>
                        <p class="dialogue-text">"${dialogue}"</p>
                        <button class="btn btn-secondary btn-sm" onclick="app.copyDialogue('${dialogue.replace(/'/g, "\\'")}')">
                            📋 コピー
                        </button>
                    </div>
                `).join('');
                resultBox.style.display = 'block';
            }
        } catch (error) {
            alert('台詞生成中にエラーが発生しました: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    async callDialogueGenerationAPI(character, situation) {
        // 実際のAI API呼び出しに置き換えられます
        return new Promise((resolve) => {
            setTimeout(() => {
                const personality = character.personality || '真面目で誠実';
                resolve([
                    `${situation}だからこそ、私は諦めない。`,
                    `こんな時だからこそ、${personality}な私らしく行動しよう。`,
                    `${situation}...でも、仲間を信じている。`,
                    `まさか${situation}とはね。でも、やるしかない。`,
                    `${character.name}として、${situation}に立ち向かう！`
                ]);
            }, 1500);
        });
    }

    copyDialogue(dialogue) {
        navigator.clipboard.writeText(dialogue).then(() => {
            alert('台詞をクリップボードにコピーしました');
        }).catch(err => {
            console.error('コピーに失敗しました:', err);
        });
    }

    async checkConsistency() {
        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            alert('作品を選択してください');
            return;
        }

        // ローディング表示
        const btn = document.getElementById('checkConsistencyBtn');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳ チェック中...';

        try {
            // AI APIを呼び出す（ここではダミーチェックを実行）
            const issues = await this.callConsistencyCheckAPI(currentWork);
            
            // 結果を表示

            const resultBox = document.getElementById('consistencyResults');
            const contentDiv = document.getElementById('consistencyResultsContent');
            
            if (resultBox && contentDiv) {
                if (issues.length === 0) {
                    contentDiv.innerHTML = `
                        <div class="consistency-success">
                            <p>✅ 明らかな矛盾は検出されませんでした。</p>
                        </div>
                    `;
                } else {
                    contentDiv.innerHTML = issues.map((issue, index) => `
                        <div class="consistency-issue ${issue.severity}">
                            <h5>${issue.severity === 'high' ? '⚠️' : 'ℹ️'} ${issue.title}</h5>
                            <p>${issue.description}</p>
                            ${issue.locations ? `<p class="issue-location">場所: ${issue.locations.join(', ')}</p>` : ''}
                        </div>
                    `).join('');
                }
                resultBox.style.display = 'block';
            }
        } catch (error) {
            alert('矛盾チェック中にエラーが発生しました: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    async callConsistencyCheckAPI(work) {
        // 実際のAI API呼び出しに置き換えられます
        return new Promise((resolve) => {
            setTimeout(() => {
                const chapters = this.plotManager.getChaptersByWorkId(work.id);
                const characters = this.characterManager.getCharactersByWorkId(work.id);
                
                const issues = [];

                // ダミーチェック: キャラクター設定の確認
                if (characters.length > 0) {
                    const incompleteChars = characters.filter(c => !c.personality || !c.background);
                    if (incompleteChars.length > 0) {
                        issues.push({
                            severity: 'low',
                            title: 'キャラクター設定の不足',
                            description: `${incompleteChars.map(c => c.name).join(', ')}の性格や背景設定が不足しています。`,
                            locations: ['キャラクター管理画面']
                        });
                    }
                }

                // ダミーチェック: 章の進行確認
                if (chapters.length > 3) {
                    const inProgressChapters = chapters.filter(c => c.status === 'in-progress');
                    if (inProgressChapters.length > 2) {
                        issues.push({
                            severity: 'low',
                            title: '同時執筆中の章が多い',
                            description: `${inProgressChapters.length}つの章が同時に執筆中です。集中して完成させることをお勧めします。`,
                            locations: chapters.map(c => c.title)
                        });
                    }
                }

                resolve(issues);
            }, 2000);
        });
    }

    // ==========================
    // コラボレーション機能
    // ==========================

    initializeCollaborationFeatures() {
        // 作品共有関連
        const shareWorkSelect = document.getElementById('shareWorkSelect');
        if (shareWorkSelect) {
            this.updateShareWorkSelect();
        }

        const generateShareLinkBtn = document.getElementById('generateShareLinkBtn');
        if (generateShareLinkBtn) {
            generateShareLinkBtn.addEventListener('click', () => this.generateShareLink());
        }

        const exportWorkBtn = document.getElementById('exportWorkBtn');
        if (exportWorkBtn) {
            exportWorkBtn.addEventListener('click', () => this.exportWork());
        }

        const importSharedWorkBtn = document.getElementById('importSharedWorkBtn');
        if (importSharedWorkBtn) {
            importSharedWorkBtn.addEventListener('click', () => {
                document.getElementById('importSharedWorkInput').click();
            });
        }

        const importSharedWorkInput = document.getElementById('importSharedWorkInput');
        if (importSharedWorkInput) {
            importSharedWorkInput.addEventListener('change', (e) => this.importSharedWork(e));
        }

        // コメント関連
        const commentChapterSelect = document.getElementById('commentChapterSelect');
        if (commentChapterSelect) {
            commentChapterSelect.addEventListener('change', () => this.updateCommentSceneSelect());
        }

        const addCommentBtn = document.getElementById('addCommentBtn');
        if (addCommentBtn) {
            addCommentBtn.addEventListener('click', () => this.addComment());
        }

        // 変更履歴関連
        const historyTypeFilter = document.getElementById('historyTypeFilter');
        const historyActionFilter = document.getElementById('historyActionFilter');
        
        if (historyTypeFilter) {
            historyTypeFilter.addEventListener('change', () => this.renderHistory());
        }
        
        if (historyActionFilter) {
            historyActionFilter.addEventListener('change', () => this.renderHistory());
        }

        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }
    }

    updateShareWorkSelect() {
        const select = document.getElementById('shareWorkSelect');
        if (!select) return;

        const works = this.workManager.getAllWorks();
        
        select.innerHTML = '<option value="">-- 作品を選択 --</option>';
        works.forEach(work => {
            const option = document.createElement('option');
            option.value = work.id;
            option.textContent = work.title;
            select.appendChild(option);
        });
    }

    generateShareLink() {
        const select = document.getElementById('shareWorkSelect');
        if (!select) return;

        const workId = select.value;
        if (!workId) {
            alert('作品を選択してください');
            return;
        }

        const shareLink = this.collaborationManager.generateShareLink(workId);
        
        const resultBox = document.getElementById('shareLinkResult');
        const linkInput = document.getElementById('shareLinkInput');
        
        if (resultBox && linkInput) {
            linkInput.value = shareLink;
            resultBox.style.display = 'block';
        }
    }

    copyShareLink() {
        const linkInput = document.getElementById('shareLinkInput');
        if (!linkInput) return;

        linkInput.select();
        navigator.clipboard.writeText(linkInput.value).then(() => {
            alert('共有リンクをクリップボードにコピーしました');
        }).catch(err => {
            console.error('コピーに失敗しました:', err);
        });
    }

    exportWork() {
        const select = document.getElementById('shareWorkSelect');
        if (!select) return;

        const workId = select.value;
        if (!workId) {
            alert('作品を選択してください');
            return;
        }

        const workData = this.collaborationManager.exportWork(workId);
        if (!workData) {
            alert('作品データの取得に失敗しました');
            return;
        }

        const blob = new Blob([JSON.stringify(workData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${workData.work.title}_export.json`;
        a.click();
        URL.revokeObjectURL(url);

        alert('作品をエクスポートしました');
    }

    importSharedWork(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const newWorkId = this.collaborationManager.importSharedWork(data);
                
                this.renderWorkList();
                alert('作品をインポートしました！');
                
                // インポートした作品を開く
                this.workManager.setCurrentWork(newWorkId);
                this.openWork(newWorkId);
            } catch (error) {
                alert('インポートに失敗しました: ' + error.message);
            }
        };
        reader.readAsText(file);

        // ファイル選択をリセット
        event.target.value = '';
    }

    updateCommentSceneSelect() {
        const chapterSelect = document.getElementById('commentChapterSelect');
        const sceneSelect = document.getElementById('commentSceneSelect');
        
        if (!chapterSelect || !sceneSelect) return;

        const chapterId = chapterSelect.value;
        
        sceneSelect.innerHTML = '<option value="">-- 全体コメント --</option>';
        
        if (chapterId) {
            const scenes = this.plotManager.getScenesByChapterId(chapterId);
            scenes.forEach(scene => {
                const option = document.createElement('option');
                option.value = scene.id;
                option.textContent = scene.title;
                sceneSelect.appendChild(option);
            });
        }
    }

    updateCommentChapterSelect() {
        const select = document.getElementById('commentChapterSelect');
        if (!select) return;

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            select.innerHTML = '<option value="">-- 章を選択 --</option>';
            return;
        }

        const chapters = this.plotManager.getChaptersByWorkId(currentWork.id);
        
        select.innerHTML = '<option value="">-- 章を選択 --</option>';
        chapters.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter.id;
            option.textContent = chapter.title;
            select.appendChild(option);
        });
    }

    addComment() {
        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            alert('作品を選択してください');
            return;
        }

        const chapterSelect = document.getElementById('commentChapterSelect');
        const sceneSelect = document.getElementById('commentSceneSelect');
        const textInput = document.getElementById('commentText');
        const authorInput = document.getElementById('commentAuthor');

        if (!chapterSelect || !textInput) return;

        const chapterId = chapterSelect.value;
        const sceneId = sceneSelect ? sceneSelect.value : null;
        const text = textInput.value.trim();
        const author = authorInput ? authorInput.value.trim() : '';

        if (!chapterId) {
            alert('章を選択してください');
            return;
        }

        if (!text) {
            alert('コメントを入力してください');
            return;
        }

        this.collaborationManager.addComment(currentWork.id, chapterId, sceneId, text, author);
        
        // フォームをクリア
        textInput.value = '';
        if (authorInput) authorInput.value = '';
        
        // コメント一覧を更新
        this.renderComments();
        
        alert('コメントを追加しました');
    }

    renderComments() {
        const container = document.getElementById('commentsView');
        if (!container) return;

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            container.innerHTML = '<div class="empty-message">作品を選択してください</div>';
            return;
        }

        const comments = this.collaborationManager.getComments(currentWork.id);

        if (comments.length === 0) {
            container.innerHTML = '<div class="empty-message">コメントがまだありません</div>';
            return;
        }

        let html = '';
        comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(comment => {
            const chapter = this.plotManager.getChapter(comment.chapterId);
            const chapterTitle = chapter ? chapter.title : '不明な章';
            
            let targetInfo = chapterTitle;
            if (comment.sceneId) {
                const scene = this.plotManager.getScene(comment.sceneId);
                targetInfo += ` > ${scene ? scene.title : '不明なシーン'}`;
            }

            html += `
                <div class="comment-item ${comment.resolved ? 'resolved' : ''}">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author}</span>
                        <span class="comment-target">${targetInfo}</span>
                        <span class="comment-time">${this.collaborationManager.formatTimestamp(comment.createdAt)}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                    <div class="comment-actions">
                        ${!comment.resolved ? `
                            <button class="btn btn-success btn-sm" onclick="app.resolveComment('${comment.id}')">
                                ✓ 解決済み
                            </button>
                        ` : '<span class="resolved-badge">✓ 解決済み</span>'}
                        <button class="btn btn-danger btn-sm" onclick="app.deleteComment('${comment.id}')">
                            削除
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    resolveComment(commentId) {
        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) return;

        this.collaborationManager.resolveComment(currentWork.id, commentId);
        this.renderComments();
    }

    deleteComment(commentId) {
        if (!confirm('このコメントを削除しますか？')) return;

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) return;

        this.collaborationManager.deleteComment(currentWork.id, commentId);
        this.renderComments();
    }

    recordChange(type, action, targetId, targetName, details) {
        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) return;

        this.collaborationManager.recordChange(currentWork.id, type, action, targetId, targetName, details);
    }

    renderHistory() {
        const container = document.getElementById('historyView');
        if (!container) return;

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            container.innerHTML = '<div class="empty-message">作品を選択してください</div>';
            return;
        }

        const typeFilter = document.getElementById('historyTypeFilter')?.value || '';
        const actionFilter = document.getElementById('historyActionFilter')?.value || '';

        const history = this.collaborationManager.getFilteredHistory(currentWork.id, typeFilter, actionFilter);

        if (history.length === 0) {
            container.innerHTML = '<div class="empty-message">変更履歴がありません</div>';
            return;
        }

        const actionLabels = {
            'create': '作成',
            'update': '更新',
            'delete': '削除'
        };

        const typeLabels = {
            'chapter': '章',
            'scene': 'シーン',
            'character': 'キャラクター'
        };

        let html = '';
        history.forEach(change => {
            const actionLabel = actionLabels[change.action] || change.action;
            const typeLabel = typeLabels[change.type] || change.type;

            html += `
                <div class="history-item action-${change.action}">
                    <div class="history-header">
                        <span class="history-action">${actionLabel}</span>
                        <span class="history-type">${typeLabel}</span>
                        <span class="history-time">${this.collaborationManager.formatTimestamp(change.timestamp)}</span>
                    </div>
                    <div class="history-detail">
                        <strong>${change.targetName}</strong>
                        ${change.details && Object.keys(change.details).length > 0 ? 
                            `<div class="history-changes">${JSON.stringify(change.details)}</div>` : ''}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    clearHistory() {
        if (!confirm('すべての変更履歴を削除しますか？この操作は取り消せません。')) return;

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) return;

        this.collaborationManager.clearHistory(currentWork.id);
        this.renderHistory();
        
        alert('変更履歴をクリアしました');
    }

    // ==========================
    // 出力・公開機能
    // ==========================

    initializeOutputFeatures() {
        // 作品選択肢を更新
        this.updateOutputWorkSelect();
        this.updateStatsWorkSelect();

        // PDF出力ボタン
        const generatePDFBtn = document.getElementById('generatePDFBtn');
        if (generatePDFBtn) {
            generatePDFBtn.addEventListener('click', () => this.generatePDF());
        }

        // HTML出力ボタン
        const generateHTMLBtn = document.getElementById('generateHTMLBtn');
        if (generateHTMLBtn) {
            generateHTMLBtn.addEventListener('click', () => this.generateHTML());
        }

        // プレビューボタン
        const previewWorkBtn = document.getElementById('previewWorkBtn');
        if (previewWorkBtn) {
            previewWorkBtn.addEventListener('click', () => this.previewWork());
        }

        // 統計グラフ表示ボタン
        const showStatsBtn = document.getElementById('showStatsBtn');
        if (showStatsBtn) {
            showStatsBtn.addEventListener('click', () => this.showStatistics());
        }
    }

    updateOutputWorkSelect() {
        const select = document.getElementById('outputWorkSelect');
        if (!select) return;

        const works = this.workManager.getAllWorks();
        
        select.innerHTML = '<option value="">-- 作品を選択 --</option>';
        works.forEach(work => {
            const option = document.createElement('option');
            option.value = work.id;
            option.textContent = work.title;
            select.appendChild(option);
        });
    }

    updateStatsWorkSelect() {
        const select = document.getElementById('statsWorkSelect');
        if (!select) return;

        const works = this.workManager.getAllWorks();
        
        select.innerHTML = '<option value="">-- 作品を選択 --</option>';
        works.forEach(work => {
            const option = document.createElement('option');
            option.value = work.id;
            option.textContent = work.title;
            select.appendChild(option);
        });
    }

    getOutputOptions() {
        return {
            includeCharacters: document.getElementById('includeCharacters')?.checked || false,
            includeImages: document.getElementById('includeImages')?.checked || false,
            includeAnalytics: document.getElementById('includeAnalytics')?.checked || false
        };
    }

    async generatePDF() {
        const select = document.getElementById('outputWorkSelect');
        if (!select) return;

        const workId = select.value;
        if (!workId) {
            alert('作品を選択してください');
            return;
        }

        const options = this.getOutputOptions();

        try {
            await this.outputManager.generatePDF(workId, options);
            alert('PDFを生成しました（テキスト形式）');
        } catch (error) {
            alert('PDF生成中にエラーが発生しました: ' + error.message);
        }
    }

    async generateHTML() {
        const select = document.getElementById('outputWorkSelect');
        if (!select) return;

        const workId = select.value;
        if (!workId) {
            alert('作品を選択してください');
            return;
        }

        const options = this.getOutputOptions();

        try {
            await this.outputManager.generateHTML(workId, options);
            alert('HTML公開用ファイルを生成しました');
        } catch (error) {
            alert('HTML生成中にエラーが発生しました: ' + error.message);
        }
    }

    previewWork() {
        const select = document.getElementById('outputWorkSelect');
        if (!select) return;

        const workId = select.value;
        if (!workId) {
            alert('作品を選択してください');
            return;
        }

        const options = this.getOutputOptions();

        try {
            this.outputManager.previewWork(workId, options);
        } catch (error) {
            alert('プレビュー表示中にエラーが発生しました: ' + error.message);
        }
    }

    showStatistics() {
        const select = document.getElementById('statsWorkSelect');
        if (!select) return;

        const workId = select.value;
        if (!workId) {
            alert('作品を選択してください');
            return;
        }

        const graphsContainer = document.getElementById('statsGraphs');
        if (!graphsContainer) return;

        try {
            this.outputManager.renderStatisticsGraphs(workId);
            graphsContainer.style.display = 'block';
        } catch (error) {
            alert('統計グラフ表示中にエラーが発生しました: ' + error.message);
            console.error(error);
        }
    }

    // ==========================
    // テンプレート機能
    // ==========================

    initializeTemplateFeatures() {
        // キャラクターテンプレート選択肢を更新
        this.updateCharacterTemplateSelect();
        this.updateChapterTemplateWorkSelect();

        // キャラクターテンプレート保存ボタン
        const saveCharTmplBtn = document.getElementById('saveCharacterTemplateBtn');
        if (saveCharTmplBtn) {
            saveCharTmplBtn.addEventListener('click', () => this.saveCharacterTemplate());
        }

        // キャラクターテンプレート読み込みボタン
        const loadCharTmplBtn = document.getElementById('loadCharacterTemplateBtn');
        if (loadCharTmplBtn) {
            loadCharTmplBtn.addEventListener('click', () => this.loadCharacterTemplate());
        }

        // 章テンプレート保存ボタン
        const saveChapTmplBtn = document.getElementById('saveChapterTemplateBtn');
        if (saveChapTmplBtn) {
            saveChapTmplBtn.addEventListener('click', () => this.saveChapterTemplate());
        }

        // 章テンプレート読み込みボタン
        const loadChapTmplBtn = document.getElementById('loadChapterTemplateBtn');
        if (loadChapTmplBtn) {
            loadChapTmplBtn.addEventListener('click', () => this.loadChapterTemplate());
        }

        // テンプレート一覧を表示
        this.renderCharacterTemplates();
        this.renderChapterTemplates();
    }

    updateCharacterTemplateSelect() {
        const select = document.getElementById('characterTemplateSelect');
        if (!select) return;

        const characters = this.characterManager.getAllCharacters();
        
        select.innerHTML = '<option value="">-- キャラクターを選択 --</option>';
        characters.forEach(char => {
            const option = document.createElement('option');
            option.value = char.id;
            option.textContent = char.name;
            select.appendChild(option);
        });
    }

    updateChapterTemplateWorkSelect() {
        const select = document.getElementById('chapterTemplateWork');
        if (!select) return;

        const works = this.workManager.getAllWorks();
        
        select.innerHTML = '<option value="">-- 作品を選択 --</option>';
        works.forEach(work => {
            const option = document.createElement('option');
            option.value = work.id;
            option.textContent = work.title;
            select.appendChild(option);
        });
    }

    saveCharacterTemplate() {
        const select = document.getElementById('characterTemplateSelect');
        if (!select) return;

        const characterId = select.value;
        if (!characterId) {
            alert('キャラクターを選択してください');
            return;
        }

        const character = this.characterManager.getCharacter(characterId);
        if (!character) return;

        const templateName = prompt('テンプレート名を入力してください:', character.name + 'テンプレート');
        if (!templateName) return;

        try {
            this.templateManager.saveCharacterTemplate(character, templateName);
            alert('テンプレートを保存しました');
            this.renderCharacterTemplates();
        } catch (error) {
            alert('テンプレート保存中にエラーが発生しました: ' + error.message);
        }
    }

    loadCharacterTemplate() {
        const templates = this.templateManager.getCharacterTemplates();
        if (templates.length === 0) {
            alert('保存されているテンプレートがありません');
            return;
        }

        // テンプレート選択ダイアログ（簡易版）
        const templateNames = templates.map((t, i) => `${i + 1}. ${t.name}`).join('\\n');
        const input = prompt(`テンプレートを選択してください:\\n${templateNames}\\n\\n番号を入力:`);
        
        if (!input) return;
        
        const index = parseInt(input) - 1;
        if (index < 0 || index >= templates.length) {
            alert('無効な番号です');
            return;
        }

        const template = templates[index];
        const newName = prompt('新しいキャラクター名を入力してください:', template.name.replace('テンプレート', ''));
        if (!newName) return;

        try {
            const newCharacter = this.templateManager.applyCharacterTemplate(template.id, newName);
            this.characterManager.addCharacter(newCharacter);
            this.renderCharacterList();
            alert('テンプレートからキャラクターを作成しました');
        } catch (error) {
            alert('テンプレート適用中にエラーが発生しました: ' + error.message);
        }
    }

    renderCharacterTemplates() {
        const container = document.getElementById('characterTemplates');
        if (!container) return;

        const templates = this.templateManager.getCharacterTemplates();
        
        if (templates.length === 0) {
            container.innerHTML = '<p class="empty-message">保存されているテンプレートがありません</p>';
            return;
        }

        let html = '';
        templates.forEach(template => {
            html += `
                <div class="template-item">
                    <span class="template-name">${template.name}</span>
                    <span class="template-date">${new Date(template.createdAt).toLocaleDateString('ja-JP')}</span>
                    <button class="btn btn-danger btn-sm" onclick="app.deleteCharacterTemplate('${template.id}')">
                        削除
                    </button>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    deleteCharacterTemplate(templateId) {
        if (!confirm('このテンプレートを削除しますか？')) return;

        this.templateManager.deleteCharacterTemplate(templateId);
        this.renderCharacterTemplates();
        alert('テンプレートを削除しました');
    }

    saveChapterTemplate() {
        const select = document.getElementById('chapterTemplateWork');
        if (!select) return;

        const workId = select.value;
        if (!workId) {
            alert('作品を選択してください');
            return;
        }

        const templateName = prompt('テンプレート名を入力してください:', '章構成テンプレート');
        if (!templateName) return;

        try {
            this.templateManager.saveChapterTemplate(workId, templateName);
            alert('章構成テンプレートを保存しました');
            this.renderChapterTemplates();
        } catch (error) {
            alert('テンプレート保存中にエラーが発生しました: ' + error.message);
        }
    }

    loadChapterTemplate() {
        const templates = this.templateManager.getChapterTemplates();
        if (templates.length === 0) {
            alert('保存されているテンプレートがありません');
            return;
        }

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            alert('作品を選択してください');
            return;
        }

        // テンプレート選択ダイアログ
        const templateNames = templates.map((t, i) => `${i + 1}. ${t.name} (${t.data.length}章)`).join('\\n');
        const input = prompt(`テンプレートを選択してください:\\n${templateNames}\\n\\n番号を入力:`);
        
        if (!input) return;
        
        const index = parseInt(input) - 1;
        if (index < 0 || index >= templates.length) {
            alert('無効な番号です');
            return;
        }

        const template = templates[index];

        try {
            this.templateManager.applyChapterTemplate(template.id, currentWork.id);
            this.renderChapterList();
            alert('章構成テンプレートを適用しました');
        } catch (error) {
            alert('テンプレート適用中にエラーが発生しました: ' + error.message);
        }
    }

    renderChapterTemplates() {
        const container = document.getElementById('chapterTemplates');
        if (!container) return;

        const templates = this.templateManager.getChapterTemplates();
        
        if (templates.length === 0) {
            container.innerHTML = '<p class="empty-message">保存されているテンプレートがありません</p>';
            return;
        }

        let html = '';
        templates.forEach(template => {
            html += `
                <div class="template-item">
                    <span class="template-name">${template.name} (${template.data.length}章)</span>
                    <span class="template-date">${new Date(template.createdAt).toLocaleDateString('ja-JP')}</span>
                    <button class="btn btn-danger btn-sm" onclick="app.deleteChapterTemplate('${template.id}')">
                        削除
                    </button>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    deleteChapterTemplate(templateId) {
        if (!confirm('このテンプレートを削除しますか？')) return;

        this.templateManager.deleteChapterTemplate(templateId);
        this.renderChapterTemplates();
        alert('テンプレートを削除しました');
    }

    // ==========================
    // ワールドマップ機能
    // ==========================

    initializeWorldMapFeatures() {
        // 場所追加ボタン
        const addLocationBtn = document.getElementById('addLocationBtn');
        if (addLocationBtn) {
            addLocationBtn.addEventListener('click', () => this.addLocation());
        }

        // フィルター
        const locationTypeFilter = document.getElementById('locationTypeFilter');
        if (locationTypeFilter) {
            locationTypeFilter.addEventListener('change', () => this.renderLocations());
        }

        const locationSearchInput = document.getElementById('locationSearchInput');
        if (locationSearchInput) {
            locationSearchInput.addEventListener('input', () => this.renderLocations());
        }

        // 場所一覧を表示
        this.renderLocations();
    }

    addLocation() {
        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            alert('作品を選択してください');
            return;
        }

        const name = prompt('場所の名前を入力してください:');
        if (!name) return;

        const types = ['city', 'dungeon', 'nature', 'building', 'other'];
        const typeLabels = ['都市', 'ダンジョン', '自然', '建物', 'その他'];
        const typeInput = prompt(`タイプを選択してください:\\n${typeLabels.map((l, i) => `${i + 1}. ${l}`).join('\\n')}\\n\\n番号を入力:`);
        
        const typeIndex = parseInt(typeInput) - 1;
        const type = (typeIndex >= 0 && typeIndex < types.length) ? types[typeIndex] : 'other';

        const description = prompt('説明を入力してください（任意）:', '');

        try {
            const location = {
                workId: currentWork.id,
                name: name,
                type: type,
                description: description || ''
            };

            this.worldMapManager.addLocation(location);
            this.renderLocations();
            alert('場所を追加しました');
        } catch (error) {
            alert('場所追加中にエラーが発生しました: ' + error.message);
        }
    }

    renderLocations() {
        const container = document.getElementById('locationsList');
        if (!container) return;

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            container.innerHTML = '<div class="empty-message">作品を選択してください</div>';
            return;
        }

        const typeFilter = document.getElementById('locationTypeFilter')?.value || '';
        const searchQuery = document.getElementById('locationSearchInput')?.value || '';

        let locations = this.worldMapManager.getLocationsByWorkId(currentWork.id);

        // フィルター適用
        if (typeFilter) {
            locations = locations.filter(l => l.type === typeFilter);
        }

        if (searchQuery) {
            locations = this.worldMapManager.searchLocations(currentWork.id, searchQuery);
            if (typeFilter) {
                locations = locations.filter(l => l.type === typeFilter);
            }
        }

        if (locations.length === 0) {
            container.innerHTML = '<div class="empty-message">場所が登録されていません</div>';
            return;
        }

        const typeLabels = {
            'city': '🏙️ 都市',
            'dungeon': '🏰 ダンジョン',
            'nature': '🌲 自然',
            'building': '🏛️ 建物',
            'other': '📍 その他'
        };

        let html = '';
        locations.forEach(location => {
            const connectedCount = location.connectedTo.length;
            
            html += `
                <div class="location-card">
                    <div class="location-header">
                        <h4>${location.name}</h4>
                        <span class="location-type">${typeLabels[location.type] || location.type}</span>
                    </div>
                    <div class="location-body">
                        ${location.description ? `<p>${location.description}</p>` : ''}
                        <p class="location-connections">接続: ${connectedCount}箇所</p>
                    </div>
                    <div class="location-actions">
                        <button class="btn btn-primary btn-sm" onclick="app.editLocation('${location.id}')">
                            編集
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteLocation('${location.id}')">
                            削除
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    editLocation(locationId) {
        const location = this.worldMapManager.getLocation(locationId);
        if (!location) return;

        const newName = prompt('場所の名前:', location.name);
        if (!newName) return;

        const newDescription = prompt('説明:', location.description);

        try {
            this.worldMapManager.updateLocation(locationId, {
                name: newName,
                description: newDescription || ''
            });
            this.renderLocations();
            alert('場所を更新しました');
        } catch (error) {
            alert('更新中にエラーが発生しました: ' + error.message);
        }
    }

    deleteLocation(locationId) {
        if (!confirm('この場所を削除しますか？')) return;

        try {
            this.worldMapManager.deleteLocation(locationId);
            this.renderLocations();
            alert('場所を削除しました');
        } catch (error) {
            alert('削除中にエラーが発生しました: ' + error.message);
        }
    }

    // ==========================
    // 世界観設定機能
    // ==========================

    loadWorldSetting() {
        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) return;

        const worldSettingText = document.getElementById('worldSettingText');
        const lastUpdate = document.getElementById('worldSettingLastUpdate');
        
        if (!worldSettingText) return;
        
        if (worldSettingText) {
            const storageKey = `worldsetting_${currentWork.id}`;
            const data = localStorage.getItem(storageKey);
            
            if (data) {
                try {
                    const saved = JSON.parse(data);
                    worldSettingText.value = saved.text || '';
                    if (lastUpdate && saved.updatedAt) {
                        lastUpdate.textContent = new Date(saved.updatedAt).toLocaleString('ja-JP');
                    }
                } catch (e) {
                    worldSettingText.value = '';
                }
            } else {
                worldSettingText.value = '';
                if (lastUpdate) {
                    lastUpdate.textContent = '未保存';
                }
            }
        }

        // 保存ボタンのイベントリスナー
        const saveBtn = document.getElementById('saveWorldSettingBtn');
        if (saveBtn && !saveBtn.hasAttribute('data-listener')) {
            saveBtn.setAttribute('data-listener', 'true');
            saveBtn.addEventListener('click', () => this.saveWorldSetting());
        }
    }

    saveWorldSetting() {
        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            alert('作品を選択してください');
            return;
        }

        const worldSettingText = document.getElementById('worldSettingText');
        const lastUpdate = document.getElementById('worldSettingLastUpdate');
        
        if (!worldSettingText) return;

        const storageKey = `worldsetting_${currentWork.id}`;
        const data = {
            text: worldSettingText.value,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(storageKey, JSON.stringify(data));
        
        if (lastUpdate) {
            lastUpdate.textContent = new Date(data.updatedAt).toLocaleString('ja-JP');
        }

        alert('世界観設定を保存しました');
    }

    // シーン管理
    addSceneToChapter(chapterId) {
        this.editingSceneId = null;
        this.clearSceneForm();
        this.updateSceneChapterSelect();
        this.updateSceneCharacterSelect();
        
        // 章を事前選択
        document.getElementById('sceneChapter').value = chapterId;
        
        this.uiManager.showModal('sceneModal');
    }

    clearSceneForm() {
        document.getElementById('sceneTitle').value = '';
        document.getElementById('sceneLocation').value = '';
        document.getElementById('sceneTimeOfDay').value = '';
        document.getElementById('sceneContent').value = '';
        document.getElementById('sceneNotes').value = '';
        document.getElementById('sceneImage').value = '';
        
        // マルチセレクトをクリア
        const select = document.getElementById('sceneCharacters');
        for (let i = 0; i < select.options.length; i++) {
            select.options[i].selected = false;
        }
    }

    updateSceneChapterSelect() {
        const select = document.getElementById('sceneChapter');
        if (!select) return;

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            select.innerHTML = '<option value="">作品を選択してください</option>';
            return;
        }

        const chapters = this.plotManager.getChaptersByWorkId(currentWork.id);
        select.innerHTML = '<option value="">-- 章を選択 --</option>' +
            chapters.map((c, i) => `<option value="${c.id}">第${i + 1}章: ${c.title}</option>`).join('');
    }

    updateSceneCharacterSelect() {
        const select = document.getElementById('sceneCharacters');
        if (!select) return;

        const characters = this.characterManager.getAllCharacters();
        select.innerHTML = characters.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    saveScene() {
        const chapterId = document.getElementById('sceneChapter').value;
        const title = document.getElementById('sceneTitle').value.trim();
        
        if (!chapterId) {
            alert('章を選択してください');
            return;
        }
        if (!title) {
            alert('シーンタイトルを入力してください');
            return;
        }

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            alert('作品を選択してください');
            return;
        }

        // 選択されたキャラクターIDを取得
        const select = document.getElementById('sceneCharacters');
        const selectedCharacters = Array.from(select.selectedOptions).map(opt => opt.value);

        const sceneData = {
            chapterId,
            title,
            location: document.getElementById('sceneLocation').value.trim(),
            timeOfDay: document.getElementById('sceneTimeOfDay').value.trim(),
            characters: selectedCharacters,
            content: document.getElementById('sceneContent').value.trim(),
            notes: document.getElementById('sceneNotes').value.trim(),
            imageUrl: document.getElementById('sceneImage').value.trim(),
            workId: currentWork.id
        };

        if (this.editingSceneId) {
            this.plotManager.updateScene(this.editingSceneId, sceneData);
        } else {
            const scenes = this.plotManager.getScenesByChapter(chapterId);
            const scene = {
                id: this.plotManager.generateSceneId(),
                ...sceneData,
                order: scenes.length + 1
            };
            this.plotManager.addScene(scene);
        }

        this.uiManager.hideModal('sceneModal');
        this.renderChapterList();
    }

    renderSceneList() {
        const container = document.getElementById('sceneListView');
        if (!container) return;

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            container.innerHTML = '<div class="empty-message">作品を選択してください</div>';
            return;
        }

        const scenes = this.plotManager.getScenesByWorkId(currentWork.id);

        if (scenes.length === 0) {
            container.innerHTML = '<div class="empty-message">シーンが作成されていません</div>';
            return;
        }

        let html = '<div class="scene-cards">';
        scenes.forEach(scene => {
            const chapter = this.plotManager.getChapter(scene.chapterId);
            const chapterTitle = chapter ? chapter.title : '不明';
            const characters = scene.characters.map(cId => {
                const char = this.characterManager.getCharacter(cId);
                return char ? char.name : '';
            }).filter(n => n).join(', ');

            html += `
                <div class="scene-card">
                    <h3>${scene.title}</h3>
                    <div class="scene-meta">
                        <span class="badge badge-info">${chapterTitle}</span>
                        ${scene.location ? `<span class="badge badge-secondary">📍 ${scene.location}</span>` : ''}
                        ${scene.timeOfDay ? `<span class="badge badge-warning">🕐 ${scene.timeOfDay}</span>` : ''}
                    </div>
                    ${characters ? `<p><strong>登場キャラクター:</strong> ${characters}</p>` : ''}
                    ${scene.content ? `<p class="scene-content">${scene.content.substring(0, 150)}${scene.content.length > 150 ? '...' : ''}</p>` : ''}
                    <div class="scene-card-actions">
                        <button class="btn btn-sm btn-primary" onclick="app.editScene('${scene.id}')">編集</button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteScene('${scene.id}')">削除</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    editScene(id) {
        const scene = this.plotManager.getScene(id);
        if (!scene) return;

        this.editingSceneId = id;
        
        this.updateSceneChapterSelect();
        this.updateSceneCharacterSelect();

        document.getElementById('sceneChapter').value = scene.chapterId;
        document.getElementById('sceneTitle').value = scene.title;
        document.getElementById('sceneLocation').value = scene.location;
        document.getElementById('sceneTimeOfDay').value = scene.timeOfDay;
        document.getElementById('sceneContent').value = scene.content;
        document.getElementById('sceneNotes').value = scene.notes;
        document.getElementById('sceneImage').value = scene.imageUrl || '';

        // マルチセレクトで選択
        const select = document.getElementById('sceneCharacters');
        for (let i = 0; i < select.options.length; i++) {
            select.options[i].selected = scene.characters.includes(select.options[i].value);
        }

        this.uiManager.showModal('sceneModal');
    }

    deleteScene(id) {
        if (!confirm('このシーンを削除しますか?')) return;
        
        this.plotManager.deleteScene(id);
        this.renderChapterList();
    }

    moveScene(id, direction) {
        const scene = this.plotManager.getScene(id);
        if (!scene) return;

        const scenes = this.plotManager.getScenesByChapter(scene.chapterId);
        const index = scenes.findIndex(s => s.id === id);
        
        if (index === -1) return;
        if ((direction === -1 && index === 0) || (direction === 1 && index === scenes.length - 1)) return;

        const newIndex = index + direction;
        [scenes[index].order, scenes[newIndex].order] = [scenes[newIndex].order, scenes[index].order];
        
        this.plotManager.saveScenes();
        this.renderChapterList();
    }

    // ===========================================
    // 作品管理機能
    // ===========================================

    renderWorkList() {
        const listView = document.getElementById('workListView');
        if (!listView) return;

        const works = this.workManager.getAllWorks();

        if (works.length === 0) {
            listView.innerHTML = '<div class="empty-message">作品が作成されていません</div>';
            return;
        }

        listView.innerHTML = works.map(work => `
            <div class="data-item work-item" data-id="${work.id}">
                <div class="work-header">
                    <h3>${work.title}</h3>
                    ${work.genre ? `<span class="badge badge-secondary">${work.genre}</span>` : ''}
                </div>
                ${work.description ? `<p class="work-description">${work.description}</p>` : ''}
                <div class="work-meta">
                    <small>作成: ${new Date(work.createdAt).toLocaleDateString()}</small>
                    <small>更新: ${new Date(work.updatedAt).toLocaleDateString()}</small>
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-primary" onclick="app.selectWork('${work.id}')"><svg style="width:14px;height:14px;margin-right:4px" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>開く</button>
                    <button class="btn btn-sm btn-secondary" onclick="app.editWork('${work.id}')">編集</button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteWork('${work.id}')">削除</button>
                </div>
            </div>
        `).join('');
    }

    selectWork(id) {
        const work = this.workManager.setCurrentWork(id);
        if (work) {
            this.showChapterEditScreen();
        }
    }

    showChapterEditScreen() {
        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) return;

        // 作品一覧画面を非表示
        document.getElementById('work-list-screen').style.display = 'none';
        // 章管理画面を表示
        document.getElementById('chapter-edit-screen').style.display = 'block';
        
        // ヘッダー情報を更新
        document.getElementById('currentWorkTitle').textContent = currentWork.title;
        const genreBadge = document.getElementById('currentWorkGenre');
        if (currentWork.genre) {
            genreBadge.textContent = currentWork.genre;
            genreBadge.style.display = 'inline-block';
        } else {
            genreBadge.style.display = 'none';
        }

        // 章タブをデフォルトで選択
        document.querySelectorAll('.main-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.main-tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        const chaptersBtn = document.querySelector('.main-tab-btn[data-tab="chapters-content"]');
        const chaptersContent = document.getElementById('chapters-content');
        if (chaptersBtn) chaptersBtn.classList.add('active');
        if (chaptersContent) {
            chaptersContent.classList.add('active');
            chaptersContent.style.display = 'block';
        }

        // 章一覧を表示
        this.renderChapterList();

        // 世界観設定を読み込み
        this.loadWorldSetting();

        // コメント一覧を表示
        this.renderComments();

        // コメント用セレクトボックスを更新
        this.updateCommentChapterSelect();
    }

    backToWorkList() {
        // 章管理画面を非表示
        document.getElementById('chapter-edit-screen').style.display = 'none';
        // 作品一覧画面を表示
        document.getElementById('work-list-screen').style.display = 'block';
    }

    clearWorkForm() {
        document.getElementById('workTitle').value = '';
        document.getElementById('workDescription').value = '';
        this.updateWorkGenreSelect();
    }

    updateWorkGenreSelect() {
        const select = document.getElementById('workGenre');
        if (select && masterManager) {
            const genres = masterManager.masterConfig.workGenres || [];
            select.innerHTML = '<option value="">-- ジャンルを選択 --</option>' +
                genres.map(g => `<option value="${g}">${g}</option>`).join('');
        }
    }

    saveWork() {
        const title = document.getElementById('workTitle').value.trim();
        if (!title) {
            alert('作品タイトルを入力してください');
            return;
        }

        const genre = document.getElementById('workGenre').value.trim();
        const description = document.getElementById('workDescription').value.trim();

        if (this.editingWorkId) {
            // 編集
            this.workManager.updateWork(this.editingWorkId, title, genre, description);
        } else {
            // 新規作成
            this.workManager.addWork(title, genre, description);
        }

        this.renderWorkList();
        this.uiManager.hideModal('workModal');
        this.editingWorkId = null;
    }

    editWork(id) {
        const work = this.workManager.getWorkById(id);
        if (!work) return;

        this.editingWorkId = id;
        document.getElementById('workTitle').value = work.title;
        document.getElementById('workDescription').value = work.description || '';
        
        // ジャンルセレクトを更新してから値を設定
        this.updateWorkGenreSelect();
        document.getElementById('workGenre').value = work.genre || '';

        this.uiManager.showModal('workModal');
    }

    deleteWork(id) {
        const work = this.workManager.getWorkById(id);
        if (!work) return;

        if (!confirm(`作品「${work.title}」を削除しますか？\n紐づく章とシーンも削除されます。`)) return;

        // 作品に紐づく章とシーンを削除
        const chapters = this.plotManager.getChaptersByWorkId(id);
        chapters.forEach(chapter => {
            this.plotManager.deleteChapter(chapter.id);
        });

        this.workManager.deleteWork(id);
        this.renderWorkList();
        this.updateCurrentWorkInfo();
    }

    // ===========================================
    // タイムライン管理機能
    // ===========================================

    clearTimelineEventForm() {
        document.getElementById('timelineEventTitle').value = '';
        document.getElementById('timelineEventTimestamp').value = '';
        document.getElementById('timelineEventDescription').value = '';
        document.getElementById('timelineEventImage').value = '';
        this.updateTimelineEventSelects();
    }

    updateTimelineEventSelects() {
        // 章セレクトを更新
        const chapterSelect = document.getElementById('timelineEventChapter');
        if (chapterSelect) {
            const currentWork = this.workManager.getCurrentWork();
            if (currentWork) {
                const chapters = this.plotManager.getChaptersByWorkId(currentWork.id);
                chapterSelect.innerHTML = '<option value="">-- 章を選択（任意）--</option>' +
                    chapters.map((c, i) => `<option value="${c.id}">第${i + 1}章: ${c.title}</option>`).join('');
            } else {
                chapterSelect.innerHTML = '<option value="">-- 章を選択（任意）--</option>';
            }
        }

        // 時間帯セレクトを更新
        const timeSelect = document.getElementById('timelineEventTimeOfDay');
        if (timeSelect && masterManager) {
            const times = masterManager.masterConfig.timeOfDay || [];
            timeSelect.innerHTML = '<option value="">-- 時間帯を選択（任意）--</option>' +
                times.map(t => `<option value="${t}">${t}</option>`).join('');
        }
    }

    saveTimelineEvent() {
        const title = document.getElementById('timelineEventTitle').value.trim();
        if (!title) {
            alert('イベントタイトルを入力してください');
            return;
        }

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            alert('作品を選択してください');
            return;
        }

        const eventData = {
            title,
            chapterId: document.getElementById('timelineEventChapter').value,
            timeOfDay: document.getElementById('timelineEventTimeOfDay').value,
            timestamp: document.getElementById('timelineEventTimestamp').value.trim(),
            description: document.getElementById('timelineEventDescription').value.trim(),
            imageUrl: document.getElementById('timelineEventImage').value.trim(),
            workId: currentWork.id,
            relatedScenes: [],
            relatedCharacters: []
        };

        if (this.editingTimelineEventId) {
            this.plotManager.updateTimelineEvent(this.editingTimelineEventId, eventData);
        } else {
            const event = {
                id: this.plotManager.generateTimelineId(),
                ...eventData
            };
            this.plotManager.addTimelineEvent(event);
        }

        this.uiManager.hideModal('timelineEventModal');
        this.renderTimelineView();
    }

    renderTimelineView() {
        const container = document.getElementById('timelineView');
        if (!container) return;

        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            container.innerHTML = '<div class="empty-message">作品を選択してください</div>';
            return;
        }

        const events = this.plotManager.getAllTimelineEvents().filter(e => e.workId === currentWork.id);

        if (events.length === 0) {
            container.innerHTML = '<div class="empty-message">タイムラインイベントが作成されていません</div>';
            return;
        }

        let html = '<div class="timeline-events">';
        events.forEach(event => {
            html += `
                <div class="timeline-event-card" data-event-id="${event.id}">
                    <div class="timeline-event-header">
                        <div class="timeline-event-info">
                            <h3>${event.title}</h3>
                            ${event.chapterId ? `<span class="badge badge-info">${this.getChapterLabel(event.chapterId)}</span>` : ''}
                            ${event.timeOfDay ? `<span class="badge badge-warning">⏰ ${event.timeOfDay}</span>` : ''}
                            ${event.timestamp ? `<span class="timeline-timestamp">📅 ${event.timestamp}</span>` : ''}
                        </div>
                        <div class="timeline-event-actions">
                            <button class="btn btn-sm btn-primary" onclick="app.editTimelineEvent('${event.id}')">編集</button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteTimelineEvent('${event.id}')">削除</button>
                        </div>
                    </div>
                    ${event.description ? `<p class="timeline-event-description">${event.description}</p>` : ''}
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    editTimelineEvent(id) {
        const event = this.plotManager.getTimelineEvent(id);
        if (!event) return;

        this.editingTimelineEventId = id;
        
        // セレクトを更新してから値を設定
        this.updateTimelineEventSelects();
        
        document.getElementById('timelineEventTitle').value = event.title;
        document.getElementById('timelineEventChapter').value = event.chapterId || '';
        document.getElementById('timelineEventTimeOfDay').value = event.timeOfDay || '';
        document.getElementById('timelineEventTimestamp').value = event.timestamp || '';
        document.getElementById('timelineEventDescription').value = event.description || '';
        document.getElementById('timelineEventImage').value = event.imageUrl || '';

        this.uiManager.showModal('timelineEventModal');
    }

    getChapterLabel(chapterId) {
        const chapter = this.plotManager.getChapter(chapterId);
        if (!chapter) return '';
        
        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) return chapter.title;
        
        const chapters = this.plotManager.getChaptersByWorkId(currentWork.id);
        const index = chapters.findIndex(c => c.id === chapterId);
        return index >= 0 ? `第${index + 1}章: ${chapter.title}` : chapter.title;
    }

    deleteTimelineEvent(id) {
        if (!confirm('このタイムラインイベントを削除しますか?')) return;
        
        this.plotManager.deleteTimelineEvent(id);
        this.renderTimelineView();
    }

    // プロット出力（テキストコピー）
    exportPlotToText() {
        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            alert('作品が選択されていません');
            return;
        }

        const text = this.generatePlotText(currentWork);
        
        // クリップボードにコピー
        navigator.clipboard.writeText(text).then(() => {
            alert('プロットをクリップボードにコピーしました');
        }).catch(err => {
            console.error('コピーに失敗しました:', err);
            alert('コピーに失敗しました');
        });
    }

    // プロット出力（ファイルダウンロード）
    exportPlotToFile() {
        const currentWork = this.workManager.getCurrentWork();
        if (!currentWork) {
            alert('作品が選択されていません');
            return;
        }

        const text = this.generatePlotText(currentWork);
        
        // ファイルダウンロード
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentWork.title}_プロット.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // プロットテキスト生成
    generatePlotText(work) {
        let text = `【作品プロット】\n`;
        text += `==========================================\n\n`;
        text += `作品名: ${work.title}\n`;
        text += `ジャンル: ${work.genre || '未設定'}\n`;
        text += `テーマ: ${work.theme || '未設定'}\n`;
        text += `概要: ${work.summary || '未設定'}\n`;
        text += `\n==========================================\n\n`;

        // キャラクター一覧
        const characters = this.characterManager.getCharactersByWorkId(work.id);
        if (characters.length > 0) {
            text += `【登場人物】\n`;
            text += `------------------------------------------\n`;
            characters.forEach(char => {
                text += `\n■ ${char.name}`;
                if (char.nameReading) text += ` (${char.nameReading})`;
                text += `\n`;
                if (char.age) text += `　年齢: ${char.age}\n`;
                if (char.gender) text += `　性別: ${char.gender}\n`;
                if (char.role) text += `　役割: ${char.role}\n`;
                if (char.personality) text += `　性格: ${char.personality}\n`;
                if (char.appearance) text += `　外見: ${char.appearance}\n`;
                if (char.background) text += `　背景: ${char.background}\n`;
                if (char.notes) text += `　備考: ${char.notes}\n`;
            });
            text += `\n==========================================\n\n`;
        }

        // 章・シーン構成
        const chapters = this.plotManager.getChaptersByWorkId(work.id);
        if (chapters.length > 0) {
            text += `【章・シーン構成】\n`;
            text += `------------------------------------------\n`;
            
            chapters.forEach(chapter => {
                text += `\n【${chapter.title}】\n`;
                if (chapter.summary) text += `概要: ${chapter.summary}\n`;
                
                const scenes = this.plotManager.getScenesByChapterId(chapter.id);
                if (scenes.length > 0) {
                    text += `\n`;
                    scenes.forEach((scene, index) => {
                        text += `　${index + 1}. ${scene.title}\n`;
                        if (scene.location) text += `　　場所: ${scene.location}\n`;
                        if (scene.characters) text += `　　登場: ${scene.characters}\n`;
                        if (scene.content) text += `　　内容: ${scene.content}\n`;
                        if (scene.notes) text += `　　備考: ${scene.notes}\n`;
                        text += `\n`;
                    });
                }
            });
            text += `==========================================\n\n`;
        }

        // タイムラインイベント
        const events = this.plotManager.getTimelineEventsByWorkId(work.id);
        if (events.length > 0) {
            text += `【タイムライン】\n`;
            text += `------------------------------------------\n`;
            
            events.forEach(event => {
                text += `\n[${event.date || '日時未設定'}] ${event.title}\n`;
                if (event.description) text += `${event.description}\n`;
                if (event.characters) text += `関連: ${event.characters}\n`;
            });
            text += `\n==========================================\n\n`;
        }

        text += `出力日時: ${new Date().toLocaleString('ja-JP')}\n`;
        

        return text;
    }
} // ← Appクラスの閉じカッコを追加

// アプリケーション起動
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    window.app = app; // グローバルアクセス用
});

