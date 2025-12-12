// コラボレーション機能（作品共有、コメント、変更履歴）

class CollaborationManager {
    constructor() {
        this.storageKeyPrefix = 'rpg_collab_';
    }

    // ==========================
    // 作品共有機能
    // ==========================

    generateShareLink(workId) {
        // 実際の実装では、サーバー上で共有リンクを生成する
        // ここではダミーのリンクを生成
        const shareId = this.generateShareId();
        const workData = this.exportWork(workId);
        
        // ローカルストレージに共有データを保存
        localStorage.setItem(`${this.storageKeyPrefix}share_${shareId}`, JSON.stringify(workData));
        
        // 共有リンクを生成（実際はサーバーのURLになる）
        return `${window.location.origin}${window.location.pathname}?share=${shareId}`;
    }

    generateShareId() {
        return 'share_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    exportWork(workId) {
        // 作品データを取得
        const works = JSON.parse(localStorage.getItem('rpg_works') || '[]');
        const work = works.find(w => w.id === workId);
        
        if (!work) return null;

        // 関連する章とシーンを取得
        const chapters = JSON.parse(localStorage.getItem('rpg_chapters') || '[]')
            .filter(c => c.workId === workId);
        
        const scenes = JSON.parse(localStorage.getItem('rpg_scenes') || '[]')
            .filter(s => chapters.some(c => c.id === s.chapterId));
        
        // 関連するキャラクターを取得
        const characters = JSON.parse(localStorage.getItem('rpg_characters') || '[]')
            .filter(char => char.workId === workId);

        return {
            work: work,
            chapters: chapters,
            scenes: scenes,
            characters: characters,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }

    importSharedWork(data) {
        if (!data || !data.work) {
            throw new Error('無効な共有データです');
        }

        // 新しいIDを生成（重複を避ける）
        const oldWorkId = data.work.id;
        const newWorkId = 'work_' + Date.now();
        
        // 作品をインポート
        data.work.id = newWorkId;
        data.work.title += ' (共有)';
        const works = JSON.parse(localStorage.getItem('rpg_works') || '[]');
        works.push(data.work);
        localStorage.setItem('rpg_works', JSON.stringify(works));

        // 章をインポート（IDマッピングを作成）
        const chapterIdMap = {};
        const chapters = JSON.parse(localStorage.getItem('rpg_chapters') || '[]');
        data.chapters.forEach(chapter => {
            const oldChapterId = chapter.id;
            const newChapterId = 'chapter_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            chapterIdMap[oldChapterId] = newChapterId;
            
            chapter.id = newChapterId;
            chapter.workId = newWorkId;
            chapters.push(chapter);
        });
        localStorage.setItem('rpg_chapters', JSON.stringify(chapters));

        // シーンをインポート
        const scenes = JSON.parse(localStorage.getItem('rpg_scenes') || '[]');
        data.scenes.forEach(scene => {
            scene.id = 'scene_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            scene.chapterId = chapterIdMap[scene.chapterId] || scene.chapterId;
            scenes.push(scene);
        });
        localStorage.setItem('rpg_scenes', JSON.stringify(scenes));

        // キャラクターをインポート
        if (data.characters && data.characters.length > 0) {
            const characters = JSON.parse(localStorage.getItem('rpg_characters') || '[]');
            data.characters.forEach(char => {
                char.id = 'char_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
                char.workId = newWorkId;
                characters.push(char);
            });
            localStorage.setItem('rpg_characters', JSON.stringify(characters));
        }

        return newWorkId;
    }

    // ==========================
    // コメント・レビュー機能
    // ==========================

    addComment(workId, chapterId, sceneId, text, author) {
        const comments = this.getComments(workId);
        
        const newComment = {
            id: 'comment_' + Date.now(),
            workId: workId,
            chapterId: chapterId,
            sceneId: sceneId || null,
            text: text,
            author: author || '匿名',
            createdAt: new Date().toISOString(),
            resolved: false
        };

        comments.push(newComment);
        this.saveComments(workId, comments);
        
        return newComment;
    }

    getComments(workId) {
        const key = `${this.storageKeyPrefix}comments_${workId}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    saveComments(workId, comments) {
        const key = `${this.storageKeyPrefix}comments_${workId}`;
        localStorage.setItem(key, JSON.stringify(comments));
    }

    getCommentsByChapter(workId, chapterId) {
        const comments = this.getComments(workId);
        return comments.filter(c => c.chapterId === chapterId);
    }

    getCommentsByScene(workId, sceneId) {
        const comments = this.getComments(workId);
        return comments.filter(c => c.sceneId === sceneId);
    }

    resolveComment(workId, commentId) {
        const comments = this.getComments(workId);
        const comment = comments.find(c => c.id === commentId);
        if (comment) {
            comment.resolved = true;
            comment.resolvedAt = new Date().toISOString();
            this.saveComments(workId, comments);
        }
    }

    deleteComment(workId, commentId) {
        let comments = this.getComments(workId);
        comments = comments.filter(c => c.id !== commentId);
        this.saveComments(workId, comments);
    }

    // ==========================
    // 変更履歴機能
    // ==========================

    recordChange(workId, type, action, targetId, targetName, details) {
        const history = this.getHistory(workId);
        
        const change = {
            id: 'change_' + Date.now(),
            workId: workId,
            type: type, // 'chapter', 'scene', 'character'
            action: action, // 'create', 'update', 'delete'
            targetId: targetId,
            targetName: targetName,
            details: details || {},
            timestamp: new Date().toISOString()
        };

        history.push(change);
        
        // 最大1000件まで保存
        if (history.length > 1000) {
            history.shift();
        }
        
        this.saveHistory(workId, history);
        
        return change;
    }

    getHistory(workId) {
        const key = `${this.storageKeyPrefix}history_${workId}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    saveHistory(workId, history) {
        const key = `${this.storageKeyPrefix}history_${workId}`;
        localStorage.setItem(key, JSON.stringify(history));
    }

    getFilteredHistory(workId, typeFilter, actionFilter) {
        let history = this.getHistory(workId);
        
        if (typeFilter) {
            history = history.filter(h => h.type === typeFilter);
        }
        
        if (actionFilter) {
            history = history.filter(h => h.action === actionFilter);
        }
        
        return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    clearHistory(workId) {
        const key = `${this.storageKeyPrefix}history_${workId}`;
        localStorage.removeItem(key);
    }

    // ==========================
    // ユーティリティ
    // ==========================

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'たった今';
        if (diffMins < 60) return `${diffMins}分前`;
        if (diffHours < 24) return `${diffHours}時間前`;
        if (diffDays < 7) return `${diffDays}日前`;
        
        return date.toLocaleDateString('ja-JP');
    }
}
