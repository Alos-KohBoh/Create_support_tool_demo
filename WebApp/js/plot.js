// プロットクラス
class Chapter {
    constructor(id, title, order, description = '', status = 'not-started', workId = null) {
        this.id = id;
        this.workId = workId; // 作品ID
        this.title = title;
        this.order = order;
        this.description = description;
        this.status = status; // 'not-started', 'in-progress', 'completed'
        this.scenes = [];
    }
}

class Scene {
    constructor(id, chapterId, title, order, content = '', characters = [], location = '', timeOfDay = '', workId = null) {
        this.id = id;
        this.workId = workId; // 作品ID
        this.chapterId = chapterId;
        this.title = title;
        this.order = order;
        this.content = content;
        this.characters = characters; // Array of character IDs
        this.location = location;
        this.timeOfDay = timeOfDay;
        this.notes = '';
    }
}

class TimelineEvent {
    constructor(id, title, timestamp, description = '', relatedScenes = [], relatedCharacters = [], workId = null) {
        this.id = id;
        this.workId = workId; // 作品ID
        this.title = title;
        this.timestamp = timestamp; // Date or custom timeline marker
        this.description = description;
        this.relatedScenes = relatedScenes; // Array of scene IDs
        this.relatedCharacters = relatedCharacters; // Array of character IDs
    }
}

// プロット管理クラス
class PlotManager {
    constructor() {
        this.chapters = this.loadChapters();
        this.scenes = this.loadScenes();
        this.timelineEvents = this.loadTimelineEvents();
    }

    // Chapters
    loadChapters() {
        const saved = localStorage.getItem('plot_chapters');
        return saved ? JSON.parse(saved) : [];
    }

    saveChapters() {
        localStorage.setItem('plot_chapters', JSON.stringify(this.chapters));
    }

    addChapter(chapter) {
        this.chapters.push(chapter);
        this.saveChapters();
    }

    updateChapter(id, updatedData) {
        const index = this.chapters.findIndex(c => c.id === id);
        if (index !== -1) {
            this.chapters[index] = { ...this.chapters[index], ...updatedData };
            this.saveChapters();
        }
    }

    deleteChapter(id) {
        this.chapters = this.chapters.filter(c => c.id !== id);
        // Delete related scenes
        this.scenes = this.scenes.filter(s => s.chapterId !== id);
        this.saveChapters();
        this.saveScenes();
    }

    getChapter(id) {
        return this.chapters.find(c => c.id === id);
    }

    getAllChapters() {
        return this.chapters.sort((a, b) => a.order - b.order);
    }

    // 作品IDで章を取得
    getChaptersByWorkId(workId) {
        return this.chapters.filter(c => c.workId === workId).sort((a, b) => a.order - b.order);
    }

    // Scenes
    loadScenes() {
        const saved = localStorage.getItem('plot_scenes');
        return saved ? JSON.parse(saved) : [];
    }

    saveScenes() {
        localStorage.setItem('plot_scenes', JSON.stringify(this.scenes));
    }

    addScene(scene) {
        this.scenes.push(scene);
        this.saveScenes();
    }

    updateScene(id, updatedData) {
        const index = this.scenes.findIndex(s => s.id === id);
        if (index !== -1) {
            this.scenes[index] = { ...this.scenes[index], ...updatedData };
            this.saveScenes();
        }
    }

    deleteScene(id) {
        this.scenes = this.scenes.filter(s => s.id !== id);
        this.saveScenes();
    }

    getScene(id) {
        return this.scenes.find(s => s.id === id);
    }

    getScenesByChapter(chapterId) {
        return this.scenes.filter(s => s.chapterId === chapterId).sort((a, b) => a.order - b.order);
    }

    // エイリアス: getScenesByChapterId
    getScenesByChapterId(chapterId) {
        return this.getScenesByChapter(chapterId);
    }

    // 作品IDでシーンを取得
    getScenesByWorkId(workId) {
        return this.scenes.filter(s => s.workId === workId).sort((a, b) => {
            const chapterA = this.getChapter(a.chapterId);
            const chapterB = this.getChapter(b.chapterId);
            if (chapterA && chapterB) {
                if (chapterA.order !== chapterB.order) {
                    return chapterA.order - chapterB.order;
                }
            }
            return a.order - b.order;
        });
    }

    getAllScenes() {
        return this.scenes.sort((a, b) => {
            const chapterA = this.getChapter(a.chapterId);
            const chapterB = this.getChapter(b.chapterId);
            if (chapterA && chapterB) {
                if (chapterA.order !== chapterB.order) {
                    return chapterA.order - chapterB.order;
                }
            }
            return a.order - b.order;
        });
    }

    // Timeline Events
    loadTimelineEvents() {
        const saved = localStorage.getItem('plot_timeline');
        return saved ? JSON.parse(saved) : [];
    }

    saveTimelineEvents() {
        localStorage.setItem('plot_timeline', JSON.stringify(this.timelineEvents));
    }

    addTimelineEvent(event) {
        this.timelineEvents.push(event);
        this.saveTimelineEvents();
    }

    updateTimelineEvent(id, updatedData) {
        const index = this.timelineEvents.findIndex(e => e.id === id);
        if (index !== -1) {
            this.timelineEvents[index] = { ...this.timelineEvents[index], ...updatedData };
            this.saveTimelineEvents();
        }
    }

    deleteTimelineEvent(id) {
        this.timelineEvents = this.timelineEvents.filter(e => e.id !== id);
        this.saveTimelineEvents();
    }

    getTimelineEvent(id) {
        return this.timelineEvents.find(e => e.id === id);
    }

    getAllTimelineEvents() {
        return this.timelineEvents.sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });
    }

    // 作品IDでタイムラインイベントを取得
    getTimelineEventsByWorkId(workId) {
        return this.timelineEvents.filter(e => e.workId === workId).sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });
    }

    // ID Generation
    generateChapterId() {
        return 'chapter_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateSceneId() {
        return 'scene_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateTimelineId() {
        return 'timeline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}
