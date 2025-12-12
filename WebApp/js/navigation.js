// ナビゲーション管理
class NavigationManager {
    constructor() {
        this.currentSection = 'home';
        this.init();
    }

    init() {
        // ホーム画面のカードクリックイベント
        document.querySelectorAll('.home-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // 戻るボタンイベント
        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const backTo = e.currentTarget.dataset.back;
                if (backTo === 'home') {
                    this.showHome();
                }
            });
        });

        // 初期表示: ホーム画面
        this.showHome();
    }

    showHome() {
        this.currentSection = 'home';
        document.getElementById('homeScreen').style.display = 'block';
        document.getElementById('simulation-section').style.display = 'none';
        document.getElementById('data-section').style.display = 'none';
        document.getElementById('plot-section').style.display = 'none';
    }

    showSection(sectionId) {
        this.currentSection = sectionId;
        document.getElementById('homeScreen').style.display = 'none';
        document.getElementById('simulation-section').style.display = sectionId === 'simulation-section' ? 'block' : 'none';
        document.getElementById('data-section').style.display = sectionId === 'data-section' ? 'block' : 'none';
        document.getElementById('plot-section').style.display = sectionId === 'plot-section' ? 'block' : 'none';

        // セクション内のタブをリセットとデータ読み込み
        if (sectionId === 'simulation-section') {
            this.activateTab('simulation');
        } else if (sectionId === 'data-section') {
            this.activateTab('characters');
            // データ一覧を初期表示
            if (window.app) {
                window.app.refreshDataLists();
            }
        } else if (sectionId === 'plot-section') {
            // 作品一覧を表示
            if (window.app) {
                window.app.renderWorkList();
            }
        }
    }

    activateTab(tabId) {
        const section = document.querySelector('.section-screen:not([style*="display: none"])');
        if (!section) return;

        // タブボタンのアクティブ化
        section.querySelectorAll('.main-tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // タブコンテンツの表示切替
        section.querySelectorAll('.main-tab-content').forEach(content => {
            if (content.id === tabId) {
                content.classList.add('active');
                content.style.display = 'block';
            } else {
                content.classList.remove('active');
                content.style.display = 'none';
            }
        });
    }
}
