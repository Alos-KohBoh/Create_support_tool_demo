// テンプレート機能とワールドマップ機能

class TemplateManager {
    constructor() {
        this.storageKey = 'rpg_templates';
    }

    // ==========================
    // キャラクターテンプレート
    // ==========================

    saveCharacterTemplate(character, templateName) {
        const templates = this.getTemplates();
        
        const template = {
            id: 'char_template_' + Date.now(),
            type: 'character',
            name: templateName || character.name + 'テンプレート',
            data: {
                race: character.race,
                job: character.job,
                personality: character.personality,
                background: character.background,
                appearance: character.appearance,
                level: character.level || 1,
                hp: character.hp || 100,
                mp: character.mp || 50,
                attack: character.attack || 10,
                defense: character.defense || 10,
                speed: character.speed || 10
            },
            createdAt: new Date().toISOString()
        };

        templates.push(template);
        this.saveTemplates(templates);
        
        return template;
    }

    getCharacterTemplates() {
        const templates = this.getTemplates();
        return templates.filter(t => t.type === 'character');
    }

    applyCharacterTemplate(templateId, newName) {
        const templates = this.getTemplates();
        const template = templates.find(t => t.id === templateId);
        
        if (!template) {
            throw new Error('テンプレートが見つかりません');
        }

        const newCharacter = {
            id: 'char_' + Date.now(),
            name: newName || template.name.replace('テンプレート', ''),
            ...template.data,
            createdAt: new Date().toISOString()
        };

        return newCharacter;
    }

    deleteCharacterTemplate(templateId) {
        let templates = this.getTemplates();
        templates = templates.filter(t => t.id !== templateId);
        this.saveTemplates(templates);
    }

    // ==========================
    // 章構成テンプレート
    // ==========================

    saveChapterTemplate(workId, templateName) {
        const chapters = JSON.parse(localStorage.getItem('rpg_chapters') || '[]')
            .filter(c => c.workId === workId);
        
        if (chapters.length === 0) {
            throw new Error('章が存在しません');
        }

        const templates = this.getTemplates();
        
        const template = {
            id: 'chapter_template_' + Date.now(),
            type: 'chapter',
            name: templateName || '章構成テンプレート',
            data: chapters.map(chapter => ({
                title: chapter.title,
                description: chapter.description,
                order: chapter.order
            })),
            createdAt: new Date().toISOString()
        };

        templates.push(template);
        this.saveTemplates(templates);
        
        return template;
    }

    getChapterTemplates() {
        const templates = this.getTemplates();
        return templates.filter(t => t.type === 'chapter');
    }

    applyChapterTemplate(templateId, workId) {
        const templates = this.getTemplates();
        const template = templates.find(t => t.id === templateId);
        
        if (!template) {
            throw new Error('テンプレートが見つかりません');
        }

        const chapters = JSON.parse(localStorage.getItem('rpg_chapters') || '[]');
        const newChapters = [];

        template.data.forEach((chapterData, index) => {
            const newChapter = {
                id: 'chapter_' + Date.now() + '_' + index,
                workId: workId,
                title: chapterData.title,
                description: chapterData.description,
                order: chapterData.order,
                status: 'not-started',
                createdAt: new Date().toISOString()
            };
            newChapters.push(newChapter);
            chapters.push(newChapter);
        });

        localStorage.setItem('rpg_chapters', JSON.stringify(chapters));
        
        return newChapters;
    }

    deleteChapterTemplate(templateId) {
        let templates = this.getTemplates();
        templates = templates.filter(t => t.id !== templateId);
        this.saveTemplates(templates);
    }

    // ==========================
    // ストレージ管理
    // ==========================

    getTemplates() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    saveTemplates(templates) {
        localStorage.setItem(this.storageKey, JSON.stringify(templates));
    }
}

class WorldMapManager {
    constructor() {
        this.storageKey = 'rpg_locations';
    }

    // ==========================
    // 場所管理
    // ==========================

    addLocation(location) {
        const locations = this.getLocations();
        
        const newLocation = {
            id: location.id || 'location_' + Date.now(),
            workId: location.workId,
            name: location.name,
            type: location.type || 'other', // city, dungeon, nature, building, other
            description: location.description || '',
            connectedTo: location.connectedTo || [], // 接続されている場所のID配列
            imageUrl: location.imageUrl || '',
            notes: location.notes || '',
            createdAt: new Date().toISOString()
        };

        locations.push(newLocation);
        this.saveLocations(locations);
        
        return newLocation;
    }

    updateLocation(locationId, updates) {
        const locations = this.getLocations();
        const index = locations.findIndex(l => l.id === locationId);
        
        if (index === -1) {
            throw new Error('場所が見つかりません');
        }

        locations[index] = { ...locations[index], ...updates };
        this.saveLocations(locations);
        
        return locations[index];
    }

    deleteLocation(locationId) {
        let locations = this.getLocations();
        
        // この場所への接続を削除
        locations.forEach(loc => {
            loc.connectedTo = loc.connectedTo.filter(id => id !== locationId);
        });
        
        // 場所自体を削除
        locations = locations.filter(l => l.id !== locationId);
        this.saveLocations(locations);
    }

    getLocation(locationId) {
        const locations = this.getLocations();
        return locations.find(l => l.id === locationId);
    }

    getLocationsByWorkId(workId) {
        const locations = this.getLocations();
        return locations.filter(l => l.workId === workId);
    }

    getLocationsByType(workId, type) {
        const locations = this.getLocationsByWorkId(workId);
        return locations.filter(l => l.type === type);
    }

    // 接続管理
    connectLocations(locationId1, locationId2) {
        const locations = this.getLocations();
        const loc1 = locations.find(l => l.id === locationId1);
        const loc2 = locations.find(l => l.id === locationId2);
        
        if (!loc1 || !loc2) {
            throw new Error('場所が見つかりません');
        }

        // 双方向接続
        if (!loc1.connectedTo.includes(locationId2)) {
            loc1.connectedTo.push(locationId2);
        }
        if (!loc2.connectedTo.includes(locationId1)) {
            loc2.connectedTo.push(locationId1);
        }

        this.saveLocations(locations);
    }

    disconnectLocations(locationId1, locationId2) {
        const locations = this.getLocations();
        const loc1 = locations.find(l => l.id === locationId1);
        const loc2 = locations.find(l => l.id === locationId2);
        
        if (loc1) {
            loc1.connectedTo = loc1.connectedTo.filter(id => id !== locationId2);
        }
        if (loc2) {
            loc2.connectedTo = loc2.connectedTo.filter(id => id !== locationId1);
        }

        this.saveLocations(locations);
    }

    getConnectedLocations(locationId) {
        const location = this.getLocation(locationId);
        if (!location) return [];

        const locations = this.getLocations();
        return location.connectedTo.map(id => locations.find(l => l.id === id)).filter(l => l);
    }

    // ==========================
    // ストレージ管理
    // ==========================

    getLocations() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    saveLocations(locations) {
        localStorage.setItem(this.storageKey, JSON.stringify(locations));
    }

    // ==========================
    // 検索・フィルタ
    // ==========================

    searchLocations(workId, query) {
        const locations = this.getLocationsByWorkId(workId);
        if (!query) return locations;

        const lowerQuery = query.toLowerCase();
        return locations.filter(loc => 
            loc.name.toLowerCase().includes(lowerQuery) ||
            (loc.description && loc.description.toLowerCase().includes(lowerQuery))
        );
    }
}
