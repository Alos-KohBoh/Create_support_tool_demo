// UI管理クラス
class UIManager {
    constructor() {
        this.currentChart = null;
    }

    // 確率を見やすく表示する
    formatProbability(probability) {
        const percent = probability * 100;
        
        if (percent >= 10) {
            // 10%以上: 1桁表示
            return `${percent.toFixed(1)}%`;
        } else if (percent >= 1) {
            // 1%以上: 2桁表示
            return `${percent.toFixed(2)}%`;
        } else if (percent >= 0.1) {
            // 0.1%以上: 3桁表示
            return `${percent.toFixed(3)}%`;
        } else if (percent >= 0.01) {
            // 0.01%以上: 小数4桁 + レアリティ表記
            return `${percent.toFixed(4)}% <span style="color: var(--warning-color); font-size: 0.85em;">(激レア)</span>`;
        } else if (percent >= 0.001) {
            // 0.001%以上: 小数5桁 + レアリティ表記
            return `${percent.toFixed(5)}% <span style="color: var(--danger-color); font-size: 0.85em;">(超激レア)</span>`;
        } else if (percent >= 0.0001) {
            // 0.0001%以上: 分数表記 + 伝説表記
            const denominator = Math.round(1 / probability);
            return `<span style="color: var(--danger-color);">1/${this.formatNumber(denominator)}</span> <span style="font-size: 0.85em;">(伝説級)</span>`;
        } else if (percent >= 0.00001) {
            // 0.00001%以上: 分数表記 + 神話表記
            const denominator = Math.round(1 / probability);
            return `<span style="color: var(--secondary-color); font-weight: bold;">1/${this.formatNumber(denominator)}</span> <span style="font-size: 0.85em;">(神話級)</span>`;
        } else {
            // それ以下: 噂レベル
            const denominator = Math.round(1 / probability);
            return `<span style="color: var(--text-secondary); font-weight: bold;">1/${this.formatNumber(denominator)}</span> <span style="font-size: 0.85em; font-style: italic;">(噂の域)</span>`;
        }
    }

    // 大きな数値を見やすく表示（カンマ区切り）
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // モンスター選択を更新
    updateMonsterSelect(monsters, selectElement) {
        selectElement.innerHTML = '<option value="">-- モンスターを選択 --</option>';
        
        monsters.forEach(monster => {
            const option = document.createElement('option');
            option.value = monster.id;
            option.textContent = monster.name;
            selectElement.appendChild(option);
        });
    }

    // モンスター情報表示
    displayMonsterInfo(monster) {
        const infoDiv = document.getElementById('monsterInfo');
        const dangerSpan = document.getElementById('monsterDanger');
        const raritySpan = document.getElementById('monsterRarity');
        const descriptionDiv = document.getElementById('monsterDescriptionDisplay');
        const dropTableDiv = document.getElementById('dropTable');

        if (!monster) {
            infoDiv.style.display = 'none';
            return;
        }

        infoDiv.style.display = 'block';
        dangerSpan.textContent = monster.dangerLevel;
        raritySpan.textContent = monster.rarity;

        // 説明表示
        console.log('Monster description:', monster.description); // デバッグ用
        if (monster.description && monster.description.trim()) {
            descriptionDiv.textContent = monster.description;
            descriptionDiv.style.display = 'block';
            console.log('Description displayed'); // デバッグ用
        } else {
            descriptionDiv.style.display = 'none';
            console.log('No description'); // デバッグ用
        }

        // ドロップテーブル表示
        dropTableDiv.innerHTML = '';
        monster.dropItems.forEach(dropItem => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'drop-item';
            itemDiv.innerHTML = `
                <span class="drop-item-name">${dropItem.itemName}</span>
                <span class="drop-item-prob">${this.formatProbability(dropItem.probability)}</span>
            `;
            dropTableDiv.appendChild(itemDiv);
        });
    }

    // 集計結果表示
    displayResults(stats, trialCount) {
        const resultsContent = document.getElementById('resultsContent');
        
        if (stats.length === 0) {
            resultsContent.innerHTML = '<p class="empty-message">結果がありません</p>';
            return;
        }

        resultsContent.innerHTML = '';
        stats.forEach((stat, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'result-item';
            const buttonId = `addToBag_${index}`;
            itemDiv.innerHTML = `
                <span class="result-name">${stat.itemName}</span>
                <div class="result-actions">
                    <span class="result-value">${stat.count}個</span>
                    <span class="result-percentage">(${stat.percentage}%)</span>
                    <button id="${buttonId}" class="btn-small btn-success" onclick="app.addSpecificItemToBag('${stat.itemName}', ${stat.count}, '${buttonId}')">
                        鞄に入れる
                    </button>
                </div>
            `;
            resultsContent.appendChild(itemDiv);
        });
    }

    // 期待値表示
    displayExpectedValues(expectedValues, trialCount) {
        const expectedContent = document.getElementById('expectedContent');
        
        if (Object.keys(expectedValues).length === 0) {
            expectedContent.innerHTML = '<p class="empty-message">期待値がありません</p>';
            return;
        }

        // 期待値でソート
        const sorted = Object.entries(expectedValues)
            .sort((a, b) => b[1] - a[1]);

        expectedContent.innerHTML = '';
        sorted.forEach(([itemName, expectedCount]) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'result-item';
            itemDiv.innerHTML = `
                <span class="result-name">${itemName}</span>
                <div>
                    <span class="result-value">${expectedCount.toFixed(2)}個</span>
                    <span class="result-percentage">(${((expectedCount / trialCount) * 100).toFixed(1)}%)</span>
                </div>
            `;
            expectedContent.appendChild(itemDiv);
        });
    }

    // ログ表示（最新100件）
    displayLog(dropResults) {
        const logContent = document.getElementById('logContent');
        
        if (dropResults.length === 0) {
            logContent.innerHTML = '<p class="empty-message">ログがありません</p>';
            return;
        }

        logContent.innerHTML = '';
        const recentResults = dropResults.slice(-100).reverse();
        
        recentResults.forEach(result => {
            const logDiv = document.createElement('div');
            logDiv.className = 'log-item';
            logDiv.innerHTML = `
                <span class="log-number">第${result.trialNumber}回</span>
                <span class="log-item-name">${result.itemName}</span>
            `;
            logContent.appendChild(logDiv);
        });
    }

    // グラフ表示
    displayChart(stats, expectedValues) {
        const canvas = document.getElementById('dropChart');
        const ctx = canvas.getContext('2d');

        // 既存のチャートを破棄
        if (this.currentChart) {
            this.currentChart.destroy();
        }

        if (stats.length === 0) {
            return;
        }

        const labels = stats.map(s => s.itemName);
        const actualData = stats.map(s => s.count);
        const expectedData = labels.map(label => expectedValues[label] || 0);

        this.currentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '実際のドロップ数',
                        data: actualData,
                        backgroundColor: 'rgba(76, 175, 80, 0.7)',
                        borderColor: 'rgba(76, 175, 80, 1)',
                        borderWidth: 2
                    },
                    {
                        label: '期待値',
                        data: expectedData,
                        backgroundColor: 'rgba(33, 150, 243, 0.7)',
                        borderColor: 'rgba(33, 150, 243, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#ffffff',
                            font: {
                                size: 14
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'ドロップ数比較（実績 vs 期待値）',
                        color: '#ffffff',
                        font: {
                            size: 16
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#b4b4b4'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#b4b4b4'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    // ドロップアイテム設定UIの更新
    updateDropItemsList(monster, items, container) {
        container.innerHTML = '';

        if (!monster.dropItems) {
            monster.dropItems = [];
        }

        monster.dropItems.forEach((dropItem, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'drop-item-config';
            itemDiv.innerHTML = `
                <select class="form-control drop-item-select" data-index="${index}">
                    <option value="">-- アイテム選択 --</option>
                    ${items.map(item => `
                        <option value="${item.name}" ${item.name === dropItem.itemName ? 'selected' : ''}>
                            ${item.name}
                        </option>
                    `).join('')}
                </select>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                    <input type="number" class="form-control drop-prob-input" 
                           data-index="${index}" 
                           value="${(dropItem.probability * 100).toFixed(10)}" 
                           min="0" max="10000" step="0.00000001" placeholder="確率(%)"
                           title="最小: 0.00000001% (100億分の1) / 最大: 10000% (100倍)">
                    <div class="prob-preview" style="font-size: 0.8em; color: var(--text-secondary); padding: 0 4px;">
                        ${this.formatProbability(dropItem.probability)}
                    </div>
                </div>
                <button class="btn btn-danger remove-drop-item" data-index="${index}">削除</button>
            `;
            container.appendChild(itemDiv);
        });

        // 確率入力の変更イベントを追加してプレビューを更新
        container.querySelectorAll('.drop-prob-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                const probability = parseFloat(e.target.value) / 100;
                const preview = e.target.parentElement.querySelector('.prob-preview');
                if (preview && !isNaN(probability)) {
                    preview.innerHTML = this.formatProbability(probability);
                }
            });
        });

        this.updateTotalProbability(monster);
    }

    // 合計確率の更新
    updateTotalProbability(monster) {
        const total = monster.dropItems.reduce((sum, item) => sum + item.probability, 0);
        const totalSpan = document.getElementById('totalProbability');
        const warningSpan = document.getElementById('probabilityWarning');

        // 見やすい表示（整数部分は整数で、小数部分は必要な桁数のみ）
        const percent = total * 100;
        if (percent >= 1 || percent === 0) {
            totalSpan.textContent = percent.toFixed(2);
        } else {
            // 1%未満の場合は有効桁数を維持
            totalSpan.textContent = percent.toFixed(10).replace(/\.?0+$/, '');
        }

        // 情報表示のみ(警告は表示しない)
        if (total < 1.0) {
            warningSpan.textContent = '💡 何もドロップしない可能性があります';
            warningSpan.style.display = 'inline';
            warningSpan.style.color = 'var(--info-color)';
        } else if (total > 1.0) {
            warningSpan.textContent = '💡 複数アイテムがドロップする可能性があります';
            warningSpan.style.display = 'inline';
            warningSpan.style.color = 'var(--success-color)';
        } else {
            warningSpan.style.display = 'none';
        }
    }

    // モーダル表示
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        
        // マスタ情報を使用してセレクトボックスを更新
        if (modalId === 'monsterModal' && window.masterManager) {
            this.updateMonsterModalSelects();
        } else if (modalId === 'itemModal' && window.masterManager) {
            this.updateItemModalSelects();
        } else if (modalId === 'dropModal' && window.masterManager) {
            this.updateDropModalSelects();
        }
        
        modal.classList.add('show');
    }

    // モンスターモーダルのセレクトボックス更新
    updateMonsterModalSelects() {
        const dangerSelect = document.getElementById('monsterDangerInput');
        const raritySelect = document.getElementById('monsterRarityInput');
        
        if (dangerSelect && masterManager) {
            dangerSelect.innerHTML = masterManager.masterConfig.dangerLevels
                .map(d => `<option value="${d}">${d}</option>`)
                .join('');
        }
        
        if (raritySelect && masterManager) {
            raritySelect.innerHTML = masterManager.masterConfig.monsterRarities
                .map(r => `<option value="${r}">${r}</option>`)
                .join('');
        }
    }

    // アイテムモーダルのセレクトボックス更新
    updateItemModalSelects() {
        const typeSelect = document.getElementById('itemType');
        const raritySelect = document.getElementById('itemRarity');
        
        if (typeSelect && masterManager) {
            typeSelect.innerHTML = masterManager.masterConfig.itemTypes
                .map(t => `<option value="${t}">${t}</option>`)
                .join('');
        }
        
        if (raritySelect && masterManager) {
            raritySelect.innerHTML = masterManager.masterConfig.itemRarities
                .map(r => `<option value="${r}">${r}</option>`)
                .join('');
        }
    }

    // ドロップモーダルのセレクトボックス更新
    updateDropModalSelects() {
        // ドロップモーダル内のアイテムセレクトを更新
        const itemSelects = document.querySelectorAll('#dropModal .drop-item-select');
        itemSelects.forEach(select => {
            const currentValue = select.value;
            // アイテムリストは dataStorage から取得
            if (window.app && window.app.dataStorage) {
                const items = window.app.dataStorage.items;
                select.innerHTML = '<option value="">-- アイテムを選択 --</option>' +
                    items.map(item => `<option value="${item.name}">${item.name}</option>`).join('');
                if (currentValue) select.value = currentValue;
            }
        });
    }

    // モーダル非表示
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
    }

    // 全結果クリア
    clearAllResults() {
        document.getElementById('resultsContent').innerHTML = 
            '<p class="empty-message">ガチャを実行してください</p>';
        document.getElementById('expectedContent').innerHTML = 
            '<p class="empty-message">期待値を計算してください</p>';
        document.getElementById('logContent').innerHTML = 
            '<p class="empty-message">ガチャ履歴がありません</p>';
        
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }
    }

    // モンスター一覧表示
    renderMonsterList(monsters) {
        const container = document.getElementById('monsterListView');
        
        if (!container) {
            console.error('monsterListView要素が見つかりません');
            return;
        }

        if (!monsters || monsters.length === 0) {
            container.innerHTML = '<p class="empty-message">モンスターがありません</p>';
            return;
        }

        try {
            container.innerHTML = monsters.map(monster => {
                const dropItems = monster.dropItems || [];
                const dropItemsHtml = dropItems.length > 0 
                    ? dropItems.map(drop => `
                        <div class="drop-item-row">
                            <span class="item-name">${drop.itemName}</span>
                            <span class="item-prob">${this.formatProbability(drop.probability)}</span>
                        </div>
                    `).join('')
                    : '<p class="empty-message">ドロップ設定なし</p>';

                const imageHtml = monster.imageUrl 
                    ? `<div class="card-image"><img src="${monster.imageUrl}" alt="${monster.name}" onerror="this.parentElement.style.display='none'"></div>`
                    : '';

                const descriptionHtml = monster.description && monster.description.trim()
                    ? `<div class="description-text">${monster.description}</div>`
                    : '';

                return `
                    <div class="monster-card">
                        ${imageHtml}
                        <div class="monster-card-header">
                            <h3>${monster.name}</h3>
                            <div class="monster-badges">
                                <span class="badge badge-danger">${monster.dangerLevel || '不明'}</span>
                                <span class="badge badge-rarity">${monster.rarity || '不明'}</span>
                            </div>
                        </div>
                        ${descriptionHtml}
                        <div class="monster-card-body">
                            <h4>ドロップテーブル</h4>
                            <div class="drop-items-list">
                                ${dropItemsHtml}
                            </div>
                        </div>
                        <div class="monster-card-footer">
                            <button class="btn btn-sm btn-primary edit-monster-drops" data-monster-id="${monster.id}">
                                ドロップ編集
                            </button>
                            <button class="btn btn-sm btn-secondary edit-monster" data-monster-id="${monster.id}">
                                モンスター編集
                            </button>
                            <button class="btn btn-sm btn-danger delete-monster" data-monster-id="${monster.id}">
                                削除
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // イベントリスナー設定
            this.setupMonsterListEvents(monsters);
        } catch (error) {
            console.error('モンスター一覧表示エラー:', error);
            container.innerHTML = '<p class="empty-message">表示エラーが発生しました</p>';
        }
    }

    // アイテム一覧表示
    renderItemList(items) {
        const container = document.getElementById('itemListView');
        
        if (!container) {
            console.error('itemListView要素が見つかりません');
            return;
        }

        if (!items || items.length === 0) {
            container.innerHTML = '<p class="empty-message">アイテムがありません</p>';
            return;
        }

        try {
            container.innerHTML = items.map(item => {
                const imageHtml = item.imageUrl 
                    ? `<div class="card-image"><img src="${item.imageUrl}" alt="${item.name}" onerror="this.parentElement.style.display='none'"></div>`
                    : '';

                const descriptionHtml = item.description && item.description.trim()
                    ? `<div class="description-text">${item.description}</div>`
                    : '';

                const effectHtml = item.effect && item.effect.trim()
                    ? `<div class="effect-text"><strong>効果:</strong> ${item.effect}</div>`
                    : '';

                return `
                    <div class="item-card">
                        ${imageHtml}
                        <div class="item-card-header">
                            <h3>${item.name}</h3>
                            <div class="item-badges">
                                <span class="badge badge-type">${item.type || '不明'}</span>
                                <span class="badge badge-rarity">${item.rarity || '不明'}</span>
                            </div>
                        </div>
                        ${descriptionHtml}
                        ${effectHtml}
                        <div class="item-card-footer">
                            <button class="btn btn-sm btn-secondary edit-item" data-item-id="${item.id}">
                                編集
                            </button>
                            <button class="btn btn-sm btn-danger delete-item" data-item-id="${item.id}">
                                削除
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // イベントリスナー設定
            this.setupItemListEvents(items);
        } catch (error) {
            console.error('アイテム一覧表示エラー:', error);
            container.innerHTML = '<p class="empty-message">表示エラーが発生しました</p>';
        }
    }

    // モンスター一覧のイベント設定
    setupMonsterListEvents(monsters) {
        // ドロップ編集
        document.querySelectorAll('.edit-monster-drops').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const monsterId = e.target.getAttribute('data-monster-id');
                if (window.app) {
                    window.app.openDropManagementForMonster(monsterId);
                }
            });
        });

        // モンスター編集
        document.querySelectorAll('.edit-monster').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const monsterId = e.target.getAttribute('data-monster-id');
                if (window.app) {
                    window.app.editMonster(monsterId);
                }
            });
        });

        // モンスター削除
        document.querySelectorAll('.delete-monster').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const monsterId = e.target.getAttribute('data-monster-id');
                const monster = monsters.find(m => m.id === monsterId);
                if (monster && confirm(`${monster.name}を削除しますか？`)) {
                    if (window.app) {
                        window.app.deleteMonster(monsterId);
                    }
                }
            });
        });
    }

    // アイテム一覧のイベント設定
    setupItemListEvents(items) {
        // アイテム編集
        document.querySelectorAll('.edit-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.getAttribute('data-item-id');
                if (window.app) {
                    window.app.editItem(itemId);
                }
            });
        });

        // アイテム削除
        document.querySelectorAll('.delete-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.getAttribute('data-item-id');
                const item = items.find(i => i.id === itemId);
                if (item && confirm(`${item.name}を削除しますか？`)) {
                    if (window.app) {
                        window.app.deleteItem(itemId);
                    }
                }
            });
        });
    }
}

