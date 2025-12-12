// メディアライブラリ管理
class MediaLibrary {
    constructor() {
        this.images = this.loadFromLocalStorage();
    }

    // LocalStorageから読み込み
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('rpg_media_library');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('メディアライブラリ読み込みエラー:', e);
            return [];
        }
    }

    // LocalStorageに保存
    saveToLocalStorage() {
        try {
            localStorage.setItem('rpg_media_library', JSON.stringify(this.images));
        } catch (e) {
            console.error('メディアライブラリ保存エラー:', e);
            if (e.name === 'QuotaExceededError') {
                alert('ストレージ容量が不足しています。不要な画像を削除してください。');
            }
        }
    }

    // 画像を追加
    addImage(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('画像ファイルを選択してください'));
                return;
            }

            // ファイルサイズチェック（5MB以下）
            if (file.size > 5 * 1024 * 1024) {
                reject(new Error('画像サイズは5MB以下にしてください'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const image = {
                    id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    dataUrl: e.target.result,
                    uploadDate: new Date().toISOString(),
                    size: file.size
                };

                this.images.push(image);
                this.saveToLocalStorage();
                resolve(image);
            };

            reader.onerror = () => {
                reject(new Error('ファイル読み込みエラー'));
            };

            reader.readAsDataURL(file);
        });
    }

    // URLから画像を追加
    addImageFromUrl(url, name) {
        return new Promise((resolve, reject) => {
            if (!url) {
                reject(new Error('URLを入力してください'));
                return;
            }

            const image = {
                id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: name || url.split('/').pop() || 'URL画像',
                dataUrl: url,
                uploadDate: new Date().toISOString(),
                size: 0,
                isUrl: true
            };

            this.images.push(image);
            this.saveToLocalStorage();
            resolve(image);
        });
    }

    // 画像を削除
    deleteImage(id) {
        this.images = this.images.filter(img => img.id !== id);
        this.saveToLocalStorage();
    }

    // すべての画像を取得
    getAllImages() {
        return this.images;
    }

    // IDで画像を取得
    getImageById(id) {
        return this.images.find(img => img.id === id);
    }

    // エクスポート用データ取得
    getExportData() {
        return this.images;
    }

    // インポート
    importData(images) {
        if (Array.isArray(images)) {
            this.images = images;
            this.saveToLocalStorage();
        }
    }

    // ストレージ使用量を取得（バイト）
    getStorageSize() {
        const json = JSON.stringify(this.images);
        return new Blob([json]).size;
    }

    // ストレージ使用量を人間が読める形式で取得
    getStorageSizeFormatted() {
        const bytes = this.getStorageSize();
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}
