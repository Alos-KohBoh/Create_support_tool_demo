// 出力・公開機能（PDF、HTML、統計グラフ）

class OutputManager {
    constructor() {
        this.charts = {};
    }

    // ==========================
    // PDF出力機能
    // ==========================

    async generatePDF(workId, options = {}) {
        const work = this.getWorkData(workId);
        if (!work) {
            throw new Error('作品が見つかりません');
        }

        // jsPDFライブラリが必要（実装時に追加）
        // ここではダミー実装
        const pdfContent = this.generatePDFContent(work, options);
        
        // 実際の実装では、jsPDFを使用してPDF生成
        // const doc = new jsPDF();
        // doc.text(pdfContent, 10, 10);
        // doc.save(`${work.title}.pdf`);

        // ダミー実装：テキストファイルとして出力
        const blob = new Blob([pdfContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${work.title}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        return true;
    }

    generatePDFContent(work, options) {
        let content = '';
        
        // タイトルページ
        content += `${'='.repeat(50)}\n`;
        content += `${work.work.title}\n`;
        content += `ジャンル: ${work.work.genre}\n`;
        content += `作成日: ${new Date(work.work.createdAt).toLocaleDateString('ja-JP')}\n`;
        content += `${'='.repeat(50)}\n\n`;

        // あらすじ
        if (work.work.summary) {
            content += `【あらすじ】\n${work.work.summary}\n\n`;
        }

        // キャラクター情報
        if (options.includeCharacters && work.characters && work.characters.length > 0) {
            content += `${'='.repeat(50)}\n`;
            content += `登場人物\n`;
            content += `${'='.repeat(50)}\n\n`;
            
            work.characters.forEach(char => {
                content += `【${char.name}】\n`;
                if (char.race) content += `種族: ${char.race}\n`;
                if (char.job) content += `職業: ${char.job}\n`;
                if (char.personality) content += `性格: ${char.personality}\n`;
                if (char.background) content += `背景: ${char.background}\n`;
                content += `\n`;
            });
        }

        // 本文
        content += `${'='.repeat(50)}\n`;
        content += `本文\n`;
        content += `${'='.repeat(50)}\n\n`;

        work.chapters.sort((a, b) => a.order - b.order).forEach(chapter => {
            content += `\n${'─'.repeat(40)}\n`;
            content += `第${chapter.order}章: ${chapter.title}\n`;
            content += `${'─'.repeat(40)}\n\n`;
            
            if (chapter.description) {
                content += `${chapter.description}\n\n`;
            }

            const scenes = work.scenes.filter(s => s.chapterId === chapter.id)
                .sort((a, b) => a.order - b.order);
            
            scenes.forEach(scene => {
                content += `◆ ${scene.title}\n\n`;
                if (scene.content) {
                    content += `${scene.content}\n\n`;
                }
            });
        });

        // 統計情報
        if (options.includeAnalytics) {
            const totalWords = work.scenes.reduce((sum, scene) => 
                sum + (scene.content ? scene.content.length : 0), 0);
            
            content += `\n${'='.repeat(50)}\n`;
            content += `統計情報\n`;
            content += `${'='.repeat(50)}\n`;
            content += `総章数: ${work.chapters.length}\n`;
            content += `総シーン数: ${work.scenes.length}\n`;
            content += `総文字数: ${totalWords.toLocaleString()}\n`;
        }

        return content;
    }

    // ==========================
    // HTML公開機能
    // ==========================

    generateHTML(workId, options = {}) {
        const work = this.getWorkData(workId);
        if (!work) {
            throw new Error('作品が見つかりません');
        }

        const htmlContent = this.generateHTMLContent(work, options);
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${work.work.title}.html`;
        a.click();
        URL.revokeObjectURL(url);

        return true;
    }

    generateHTMLContent(work, options) {
        let html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(work.work.title)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Noto Serif JP', serif;
            line-height: 1.8;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .title-page {
            text-align: center;
            padding: 60px 0;
            border-bottom: 2px solid #333;
            margin-bottom: 40px;
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
        }
        .genre {
            color: #666;
            font-size: 1.1em;
        }
        .summary {
            padding: 30px;
            background: #f9f9f9;
            border-left: 4px solid #4CAF50;
            margin-bottom: 40px;
        }
        .characters {
            margin-bottom: 40px;
        }
        .character {
            margin-bottom: 30px;
            padding: 20px;
            background: #fafafa;
            border-radius: 8px;
        }
        .character-name {
            font-size: 1.3em;
            font-weight: bold;
            color: #4CAF50;
            margin-bottom: 10px;
        }
        .chapter {
            margin-bottom: 60px;
        }
        .chapter-title {
            font-size: 1.8em;
            padding: 20px 0;
            border-bottom: 2px solid #ddd;
            margin-bottom: 30px;
        }
        .scene {
            margin-bottom: 40px;
        }
        .scene-title {
            font-size: 1.3em;
            color: #666;
            margin-bottom: 15px;
        }
        .scene-content {
            text-indent: 1em;
            margin-bottom: 20px;
        }
        .stats {
            margin-top: 60px;
            padding: 30px;
            background: #f0f0f0;
            border-radius: 8px;
        }
        @media print {
            body {
                background: white;
            }
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="title-page">
            <h1>${this.escapeHtml(work.work.title)}</h1>
            <p class="genre">${this.escapeHtml(work.work.genre)}</p>
        </div>
`;

        // あらすじ
        if (work.work.summary) {
            html += `        <div class="summary">
            <h2>あらすじ</h2>
            <p>${this.escapeHtml(work.work.summary)}</p>
        </div>
`;
        }

        // キャラクター情報
        if (options.includeCharacters && work.characters && work.characters.length > 0) {
            html += `        <div class="characters">
            <h2>登場人物</h2>
`;
            work.characters.forEach(char => {
                html += `            <div class="character">
                <div class="character-name">${this.escapeHtml(char.name)}</div>
`;
                if (char.race) html += `                <p>種族: ${this.escapeHtml(char.race)}</p>\n`;
                if (char.job) html += `                <p>職業: ${this.escapeHtml(char.job)}</p>\n`;
                if (char.personality) html += `                <p>性格: ${this.escapeHtml(char.personality)}</p>\n`;
                if (char.background) html += `                <p>背景: ${this.escapeHtml(char.background)}</p>\n`;
                html += `            </div>
`;
            });
            html += `        </div>
`;
        }

        // 本文
        work.chapters.sort((a, b) => a.order - b.order).forEach(chapter => {
            html += `        <div class="chapter">
            <h2 class="chapter-title">第${chapter.order}章: ${this.escapeHtml(chapter.title)}</h2>
`;
            
            if (chapter.description) {
                html += `            <p>${this.escapeHtml(chapter.description)}</p>\n`;
            }

            const scenes = work.scenes.filter(s => s.chapterId === chapter.id)
                .sort((a, b) => a.order - b.order);
            
            scenes.forEach(scene => {
                html += `            <div class="scene">
                <h3 class="scene-title">◆ ${this.escapeHtml(scene.title)}</h3>
`;
                if (scene.content) {
                    const paragraphs = scene.content.split('\n').filter(p => p.trim());
                    paragraphs.forEach(p => {
                        html += `                <p class="scene-content">${this.escapeHtml(p)}</p>\n`;
                    });
                }
                html += `            </div>
`;
            });
            html += `        </div>
`;
        });

        // 統計情報
        if (options.includeAnalytics) {
            const totalWords = work.scenes.reduce((sum, scene) => 
                sum + (scene.content ? scene.content.length : 0), 0);
            
            html += `        <div class="stats">
            <h2>統計情報</h2>
            <p>総章数: ${work.chapters.length}</p>
            <p>総シーン数: ${work.scenes.length}</p>
            <p>総文字数: ${totalWords.toLocaleString()}</p>
        </div>
`;
        }

        html += `    </div>
</body>
</html>`;

        return html;
    }

    // ==========================
    // プレビュー機能
    // ==========================

    previewWork(workId, options = {}) {
        const work = this.getWorkData(workId);
        if (!work) {
            throw new Error('作品が見つかりません');
        }

        const htmlContent = this.generateHTMLContent(work, options);
        
        // 新しいウィンドウで開く
        const newWindow = window.open('', '_blank');
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    }

    // ==========================
    // 統計グラフ機能
    // ==========================

    renderStatisticsGraphs(workId) {
        const work = this.getWorkData(workId);
        if (!work) {
            throw new Error('作品が見つかりません');
        }

        // 既存のグラフを破棄
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};

        // 章別文字数グラフ
        this.renderChapterWordsChart(work);
        
        // キャラクター登場回数グラフ
        this.renderCharacterAppearanceChart(work);
        
        // 執筆進捗グラフ
        this.renderProgressChart(work);
        
        // 章別シーン数グラフ
        this.renderChapterScenesChart(work);
    }

    renderChapterWordsChart(work) {
        const ctx = document.getElementById('chapterWordsChart');
        if (!ctx) return;

        const chapters = work.chapters.sort((a, b) => a.order - b.order);
        const labels = chapters.map(c => c.title);
        const data = chapters.map(chapter => {
            const scenes = work.scenes.filter(s => s.chapterId === chapter.id);
            return scenes.reduce((sum, scene) => sum + (scene.content ? scene.content.length : 0), 0);
        });

        this.charts.chapterWords = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '文字数',
                    data: data,
                    backgroundColor: 'rgba(76, 175, 80, 0.6)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderCharacterAppearanceChart(work) {
        const ctx = document.getElementById('characterAppearanceChart');
        if (!ctx) return;

        const appearances = {};
        work.scenes.forEach(scene => {
            if (scene.characters) {
                scene.characters.forEach(charId => {
                    appearances[charId] = (appearances[charId] || 0) + 1;
                });
            }
        });

        const sortedChars = Object.entries(appearances)
            .map(([charId, count]) => {
                const char = work.characters.find(c => c.id === charId);
                return { name: char ? char.name : '不明', count: count };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // 上位10名

        this.charts.characterAppearance = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: sortedChars.map(c => c.name),
                datasets: [{
                    label: '登場回数',
                    data: sortedChars.map(c => c.count),
                    backgroundColor: 'rgba(33, 150, 243, 0.6)',
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderProgressChart(work) {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;

        const statuses = {
            'not-started': 0,
            'in-progress': 0,
            'completed': 0
        };

        work.chapters.forEach(chapter => {
            statuses[chapter.status] = (statuses[chapter.status] || 0) + 1;
        });

        this.charts.progress = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['未着手', '執筆中', '完了'],
                datasets: [{
                    data: [statuses['not-started'], statuses['in-progress'], statuses['completed']],
                    backgroundColor: [
                        'rgba(158, 158, 158, 0.6)',
                        'rgba(255, 152, 0, 0.6)',
                        'rgba(76, 175, 80, 0.6)'
                    ],
                    borderColor: [
                        'rgba(158, 158, 158, 1)',
                        'rgba(255, 152, 0, 1)',
                        'rgba(76, 175, 80, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    }

    renderChapterScenesChart(work) {
        const ctx = document.getElementById('chapterScenesChart');
        if (!ctx) return;

        const chapters = work.chapters.sort((a, b) => a.order - b.order);
        const labels = chapters.map(c => c.title);
        const data = chapters.map(chapter => {
            return work.scenes.filter(s => s.chapterId === chapter.id).length;
        });

        this.charts.chapterScenes = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'シーン数',
                    data: data,
                    backgroundColor: 'rgba(156, 39, 176, 0.2)',
                    borderColor: 'rgba(156, 39, 176, 1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // ==========================
    // ユーティリティ
    // ==========================

    getWorkData(workId) {
        const works = JSON.parse(localStorage.getItem('rpg_works') || '[]');
        const work = works.find(w => w.id === workId);
        
        if (!work) return null;

        const chapters = JSON.parse(localStorage.getItem('rpg_chapters') || '[]')
            .filter(c => c.workId === workId);
        
        const scenes = JSON.parse(localStorage.getItem('rpg_scenes') || '[]')
            .filter(s => chapters.some(c => c.id === s.chapterId));
        
        const characters = JSON.parse(localStorage.getItem('rpg_characters') || '[]')
            .filter(char => char.workId === workId);

        return {
            work: work,
            chapters: chapters,
            scenes: scenes,
            characters: characters
        };
    }

    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}
