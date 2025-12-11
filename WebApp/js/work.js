// 作品管理クラス
class Work {
    constructor(id, title, genre = '', description = '', createdAt = new Date()) {
        this.id = id;
        this.title = title;
        this.genre = genre;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = new Date();
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            genre: this.genre,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(json) {
        return new Work(
            json.id,
            json.title,
            json.genre,
            json.description,
            new Date(json.createdAt)
        );
    }
}

// 作品管理マネージャー
class WorkManager {
    constructor() {
        this.works = [];
        this.currentWorkId = null;
        this.loadFromLocalStorage();
    }

    // 作品を追加
    addWork(title, genre, description) {
        const id = Date.now().toString();
        const work = new Work(id, title, genre, description);
        this.works.push(work);
        this.saveToLocalStorage();
        return work;
    }

    // 作品を更新
    updateWork(id, title, genre, description) {
        const work = this.getWorkById(id);
        if (work) {
            work.title = title;
            work.genre = genre;
            work.description = description;
            work.updatedAt = new Date();
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    // 作品を削除
    deleteWork(id) {
        const index = this.works.findIndex(w => w.id === id);
        if (index !== -1) {
            this.works.splice(index, 1);
            // 現在選択中の作品が削除された場合
            if (this.currentWorkId === id) {
                this.currentWorkId = null;
                localStorage.removeItem('currentWorkId');
            }
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    // IDで作品を取得
    getWorkById(id) {
        return this.works.find(w => w.id === id);
    }

    // 全作品を取得
    getAllWorks() {
        return this.works.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    // 現在の作品を設定
    setCurrentWork(id) {
        const work = this.getWorkById(id);
        if (work) {
            this.currentWorkId = id;
            localStorage.setItem('currentWorkId', id);
            return work;
        }
        return null;
    }

    // 現在の作品を取得
    getCurrentWork() {
        if (this.currentWorkId) {
            return this.getWorkById(this.currentWorkId);
        }
        return null;
    }

    // 現在の作品をクリア
    clearCurrentWork() {
        this.currentWorkId = null;
        localStorage.removeItem('currentWorkId');
    }

    // LocalStorageに保存
    saveToLocalStorage() {
        const data = this.works.map(w => w.toJSON());
        localStorage.setItem('works', JSON.stringify(data));
    }

    // saveWorks()エイリアス（互換性のため）
    saveWorks() {
        this.saveToLocalStorage();
    }

    // LocalStorageから読み込み
    loadFromLocalStorage() {
        const data = localStorage.getItem('works');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.works = parsed.map(w => Work.fromJSON(w));
            } catch (e) {
                console.error('Failed to load works:', e);
                this.works = [];
            }
        }

        // 現在の作品IDを読み込み
        const currentId = localStorage.getItem('currentWorkId');
        if (currentId && this.getWorkById(currentId)) {
            this.currentWorkId = currentId;
        }
    }
}
