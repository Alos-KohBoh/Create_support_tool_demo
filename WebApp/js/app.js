// メインアプリケーション
class App {
    constructor() {
        this.dataStorage = new DataStorage();
        this.simulator = new DropSimulator();
        this.uiManager = new UIManager();
        this.bagManager = new BagManager();
        this.characterManager = new CharacterManager();
        this.workManager = new WorkManager();
        this.plotManager = new PlotManager();
        this.navigationManager = new NavigationManager();
        this.selectedMonster = null;
        this.addedItemsToBAG = new Set(); // 追加済みアイテムを追跡
        this.editingCharacterId = null;
        this.editingWorkId = null;
        this.editingChapterId = null;
        this.editingSceneId = null;
        this.editingTimelineEventId = null;
        
        // マスタマネージャー初期化
        masterManager = new MasterDataManager();
        masterUI = new MasterUI(masterManager);
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupImageUploadListeners();
        this.loadMonsterSelect();
        this.setupTabs();
        this.setupSubTabs();
        this.setupFilters();
        
        // モーダルのセレクトボックスを初期化
        this.initializeModalSelects();
        
        // 鞄UIを初期化
        this.updateBagDisplay();
        
        // キャラクター一覧を表示
        this.renderCharacterList();
        
        // 作品一覧を表示
        this.renderWorkList();
        
        // プロット一覧を表示
        this.renderChapterList();
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

        // アイテム追加ボタン
        document.getElementById('addItemBtn').addEventListener('click', () => {
            this.uiManager.showModal('itemModal');
        });

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
                const section = btn.closest('.section-screen');
                
                if (!section) return;

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
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');

                // すべてのタブを非アクティブに
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // 選択されたタブをアクティブに
                btn.classList.add('active');
                document.getElementById(tabName).classList.add('active');
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
        
        // 結果表示
        this.uiManager.displayResults(stats, trialCount);
        this.uiManager.displayLog(results);
        
        // 期待値も自動計算
        this.calculateExpectedValues();
        
        // グラフ更新
        this.uiManager.displayChart(stats, this.simulator.expectedValues);

        // 鞄に入れるボタンを表示
        const addResultsToBagBtn = document.getElementById('addResultsToBag');
        if (addResultsToBagBtn) {
            addResultsToBagBtn.style.display = 'block';
            addResultsToBagBtn.disabled = false;
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
        
        // 鞄に入れるボタンを非表示・リセット
        const addResultsToBagBtn = document.getElementById('addResultsToBag');
        if (addResultsToBagBtn) {
            addResultsToBagBtn.style.display = 'none';
            addResultsToBagBtn.disabled = false;
            addResultsToBagBtn.textContent = 'すべて鞄に入れる';
        }
    }

    // モンスター保存
    saveMonster() {
        const name = document.getElementById('monsterName').value.trim();
        const danger = document.getElementById('monsterDangerInput').value;
        const rarity = document.getElementById('monsterRarityInput').value;
        const imageUrl = document.getElementById('monsterImageUrl').value.trim();
        const description = document.getElementById('monsterDescription').value.trim();
        const editId = document.getElementById('saveMonster').dataset.editId;

        if (!name) {
            alert('モンスター名を入力してください');
            return;
        }

        if (editId) {
            // 編集モード
            const monster = this.dataStorage.getMonsterById(editId);
            if (monster) {
                monster.name = name;
                monster.dangerLevel = danger;
                monster.rarity = rarity;
                monster.imageUrl = imageUrl;
                monster.description = description;
                this.dataStorage.updateMonster(monster);
                alert('モンスター情報を更新しました');
            }
            delete document.getElementById('saveMonster').dataset.editId;
        } else {
            // 新規追加モード
            const monster = new Monster(null, name, danger, rarity, [], imageUrl, description);
            this.dataStorage.addMonster(monster);
            alert('モンスターを追加しました');
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
            alert('アイテムを追加しました');
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
        const monster = this.dataStorage.getMonsterById(monsterId);
        if (!monster) return;

        document.getElementById('monsterName').value = monster.name;
        document.getElementById('monsterDangerInput').value = monster.dangerLevel;
        document.getElementById('monsterRarityInput').value = monster.rarity;
        document.getElementById('monsterImageUrl').value = monster.imageUrl || '';
        document.getElementById('monsterDescription').value = monster.description || '';
        
        // 既存モンスターの編集モード
        document.getElementById('saveMonster').dataset.editId = monsterId;
        this.uiManager.showModal('monsterModal');
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
                    masterManager.masterConfig = importData.masterConfig;
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
        
        if (!bagItemsList || !currentCount || !maxCapacity) return;
        
        const items = this.bagManager.getItemsList();
        const count = this.bagManager.getCurrentCount();
        const max = this.bagManager.maxCapacity;
        
        currentCount.textContent = count;
        maxCapacity.textContent = max;
        
        if (items.length === 0) {
            bagItemsList.innerHTML = '<div class="empty-message">鞄は空です</div>';
            return;
        }
        
        bagItemsList.innerHTML = items.map(item => `
            <div class="bag-item">
                <div class="bag-item-name">${item.name}</div>
                <div class="bag-item-quantity">${item.quantity}個</div>
                <div class="bag-item-actions">
                    <button onclick="app.showItemModal('${item.name}', ${item.quantity})">操作</button>
                </div>
            </div>
        `).join('');
    }

    // 鞄をクリア
    clearBag() {
        if (!confirm('鞄の中身をすべて削除しますか?')) return;
        
        this.bagManager.clearBag();
        this.updateBagDisplay();
        alert('鞄をクリアしました');
    }

    // 鞄設定を表示
    showBagSettings() {
        document.getElementById('bagCapacity').value = this.bagManager.maxCapacity;
        this.uiManager.showModal('bagSettingsModal');
    }

    // 鞄設定を保存
    saveBagSettings() {
        const capacity = parseInt(document.getElementById('bagCapacity').value);
        
        if (isNaN(capacity) || capacity < 1) {
            alert('容量は1以上の数値を入力してください');
            return;
        }
        
        const currentCount = this.bagManager.getCurrentCount();
        if (capacity < currentCount) {
            alert(`現在の所持数(${currentCount}個)より小さい容量には設定できません`);
            return;
        }
        
        this.bagManager.setMaxCapacity(capacity);
        this.updateBagDisplay();
        this.uiManager.hideModal('bagSettingsModal');
        alert('鞄の容量を変更しました');
    }

    // アイテム追加モーダルを表示
    showAddItemModal() {
        const select = document.getElementById('bagItemSelect');
        const items = this.dataStorage.items;
        
        select.innerHTML = items.map(item => 
            `<option value="${item.name}">${item.name}</option>`
        ).join('');
        
        document.getElementById('bagItemQuantity').value = 1;
        this.uiManager.showModal('bagItemModal');
    }

    // 鞄にアイテムを追加
    addItemToBag() {
        const itemName = document.getElementById('bagItemSelect').value;
        const quantity = parseInt(document.getElementById('bagItemQuantity').value);
        
        if (!itemName) {
            alert('アイテムを選択してください');
            return;
        }
        
        if (isNaN(quantity) || quantity < 1) {
            alert('数量は1以上を入力してください');
            return;
        }
        
        const result = this.bagManager.addItem(itemName, quantity);
        
        if (result.overflow > 0) {
            alert(`${result.added}個追加しました。${result.overflow}個があふれました。`);
        } else {
            alert(`${itemName}を${quantity}個追加しました`);
        }
        
        this.updateBagDisplay();
        this.uiManager.hideModal('bagItemModal');
    }

    // アイテム操作モーダルを表示
    showItemModal(itemName, currentQuantity) {
        document.getElementById('currentItemName').textContent = itemName;
        document.getElementById('currentItemQuantity').textContent = currentQuantity;
        document.getElementById('itemOperationQuantity').value = 1;
        document.getElementById('itemOperationQuantity').max = currentQuantity;
        
        // モーダルにアイテム名を保存
        document.getElementById('bagItemOperationModal').dataset.itemName = itemName;
        
        this.uiManager.showModal('bagItemOperationModal');
    }

    // アイテムを使う
    useItemFromBag() {
        const modal = document.getElementById('bagItemOperationModal');
        const itemName = modal.dataset.itemName;
        const quantity = parseInt(document.getElementById('itemOperationQuantity').value);
        
        if (isNaN(quantity) || quantity < 1) {
            alert('数量は1以上を入力してください');
            return;
        }
        
        const result = this.bagManager.useItem(itemName, quantity);
        
        if (result.success) {
            alert(`${itemName}を${quantity}個使用しました`);
            this.updateBagDisplay();
            this.uiManager.hideModal('bagItemOperationModal');
        } else {
            alert(result.message);
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

        const result = this.bagManager.addGachaResults(remainingResults);
        this.updateBagDisplay();
        
        // すべてのアイテムボタンを無効化
        const allButtons = document.querySelectorAll('[id^="addToBag_"]');
        allButtons.forEach(btn => {
            btn.disabled = true;
            btn.textContent = '追加済み';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-secondary');
        });
        
        // すべてのアイテムを追加済みとしてマーク
        this.lastGachaResults.forEach(result => {
            this.addedItemsToBAG.add(result.itemName);
        });
        
        // すべて入れるボタンを無効化
        const addResultsToBagBtn = document.getElementById('addResultsToBag');
        if (addResultsToBagBtn) {
            addResultsToBagBtn.disabled = true;
            addResultsToBagBtn.textContent = '追加済み';
        }
        
        if (result.totalOverflow > 0) {
            alert(`残りのガチャ結果を鞄に追加しました。\n追加: ${result.totalAdded}個\nあふれ: ${result.totalOverflow}個\n\n容量を超えたアイテム:\n${Object.entries(result.overflow).map(([name, qty]) => `${name}: ${qty}個`).join('\n')}`);
        } else {
            alert(`残りのガチャ結果を鞄に追加しました (${result.totalAdded}個)`);
        }
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
        document.getElementById('characterSkills').value = '';
        document.getElementById('characterImage').value = '';
        
        // マスタ設定から選択肢を更新
        this.updateCharacterFormSelects();
        
        // ステータスフィールドを生成
        this.generateCharacterStatsFields();
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

    generateCharacterStatsFields() {
        const container = document.getElementById('characterStatsFields');
        if (!container) return;
        
        const stats = masterManager.masterConfig.characterStats || [];
        container.innerHTML = stats.map(stat => `
            <div class="form-group">
                <label for="characterStat_${stat.id}">${stat.label}</label>
                <input type="number" id="characterStat_${stat.id}" class="form-control character-stat-input" 
                       data-stat-id="${stat.id}" value="${stat.defaultValue}" min="0">
            </div>
        `).join('');
    }

    saveCharacter() {
        const name = document.getElementById('characterName').value.trim();
        if (!name) {
            alert('キャラクター名を入力してください');
            return;
        }

        const dialoguesText = document.getElementById('characterDialogues').value.trim();
        const skillsText = document.getElementById('characterSkills').value.trim();

        // 動的ステータスを収集
        const stats = {};
        document.querySelectorAll('.character-stat-input').forEach(input => {
            const statId = input.dataset.statId;
            stats[statId] = parseInt(input.value) || 0;
        });

        const characterData = {
            name,
            job: document.getElementById('characterJob').value,
            race: document.getElementById('characterRace').value,
            element: document.getElementById('characterElement').value,
            level: parseInt(document.getElementById('characterLevel').value) || 1,
            stats, // 動的ステータス
            personality: document.getElementById('characterPersonality').value.trim(),
            background: document.getElementById('characterBackground').value.trim(),
            dialogues: dialoguesText ? dialoguesText.split('\n').filter(d => d.trim()) : [],
            skills: skillsText ? skillsText.split('\n').filter(s => s.trim()) : [],
            imageUrl: document.getElementById('characterImage').value.trim()
        };

        if (this.editingCharacterId) {
            // 編集
            this.characterManager.updateCharacter(this.editingCharacterId, characterData);
        } else {
            // 新規追加
            const character = {
                id: this.characterManager.generateId(),
                ...characterData
            };
            this.characterManager.addCharacter(character);
        }

        this.uiManager.hideModal('characterModal');
        this.renderCharacterList();
    }

    renderCharacterList() {
        const container = document.getElementById('characterListView');
        if (!container) return;

        const characters = this.characterManager.getAllCharacters();

        if (characters.length === 0) {
            container.innerHTML = '<div class="empty-message">キャラクターが登録されていません</div>';
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

            html += `
                <div class="data-card">
                    ${character.imageUrl ? `<img src="${character.imageUrl}" alt="${character.name}" class="data-card-image">` : ''}
                    <div class="data-card-content">
                        <h3 class="data-card-title">${character.name}</h3>
                        <div class="data-card-badges">
                            ${character.job ? `<span class="badge badge-info">${character.job}</span>` : ''}
                            ${character.race ? `<span class="badge badge-secondary">${character.race}</span>` : ''}
                            ${character.element ? `<span class="badge badge-warning">${character.element}</span>` : ''}
                            <span class="badge badge-primary">Lv.${character.level}</span>
                        </div>
                        <div class="character-stats">
                            ${statsHtml}
                        </div>
                        ${character.personality ? `<p class="character-personality"><strong>性格:</strong> ${character.personality}</p>` : ''}
                        ${character.skills.length > 0 ? `<p class="character-skills"><strong>スキル:</strong> ${character.skills.join(', ')}</p>` : ''}
                        <div class="data-card-actions">
                            <button class="btn btn-primary btn-sm" onclick="app.editCharacter('${character.id}')">編集</button>
                            <button class="btn btn-danger btn-sm" onclick="app.deleteCharacter('${character.id}')">削除</button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    editCharacter(id) {
        const character = this.characterManager.getCharacter(id);
        if (!character) return;

        this.editingCharacterId = id;
        
        document.getElementById('characterName').value = character.name;
        document.getElementById('characterLevel').value = character.level;
        document.getElementById('characterPersonality').value = character.personality;
        document.getElementById('characterBackground').value = character.background;
        document.getElementById('characterDialogues').value = character.dialogues.join('\n');
        document.getElementById('characterSkills').value = character.skills.join('\n');
        document.getElementById('characterImage').value = character.imageUrl || '';

        // マスタ設定から選択肢を更新
        this.updateCharacterFormSelects();
        
        // 選択値を設定
        document.getElementById('characterJob').value = character.job;
        document.getElementById('characterRace').value = character.race;
        document.getElementById('characterElement').value = character.element;
        
        // ステータスフィールドを生成して値を設定
        this.generateCharacterStatsFields();
        Object.keys(character.stats).forEach(statId => {
            const input = document.getElementById(`characterStat_${statId}`);
            if (input) {
                input.value = character.stats[statId];
            }
        });

        this.uiManager.showModal('characterModal');
    }

    deleteCharacter(id) {
        if (!confirm('このキャラクターを削除しますか?')) return;
        
        this.characterManager.deleteCharacter(id);
        this.renderCharacterList();
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
}

// アプリケーション起動
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    window.app = app; // グローバルアクセス用
});

