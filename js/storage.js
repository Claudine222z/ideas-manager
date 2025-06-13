class Storage {
    constructor() {
        this.storageKey = 'ideasManager_projects';
    }

    // Salvar projetos no localStorage
    saveProjects(projects) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(projects));
            return true;
        } catch (error) {
            console.error('Erro ao salvar projetos:', error);
            return false;
        }
    }

    // Carregar projetos do localStorage
    loadProjects() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
            return [];
        }
    }

    // Limpar todos os dados
    clearAll() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
            return false;
        }
    }

    // Verificar se há dados salvos
    hasData() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    // Exportar dados para backup
    exportData() {
        const projects = this.loadProjects();
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            projects: projects
        };
        return JSON.stringify(exportData, null, 2);
    }

    // Importar dados de backup
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.projects && Array.isArray(data.projects)) {
                this.saveProjects(data.projects);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }
}

// Instância global do storage
const storage = new Storage();
