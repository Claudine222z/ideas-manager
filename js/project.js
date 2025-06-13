class Project {
    constructor(id = null, title = '', description = '', topics = []) {
        this.id = id || this.generateId();
        this.title = title;
        this.description = description;
        this.topics = topics;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    generateId() {
        return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    update(title, description) {
        this.title = title;
        this.description = description;
        this.updatedAt = new Date().toISOString();
    }

    addTopic(topic) {
        this.topics.push(topic);
        this.updatedAt = new Date().toISOString();
    }

    removeTopic(topicId) {
        this.topics = this.topics.filter(topic => topic.id !== topicId);
        this.updatedAt = new Date().toISOString();
    }

    updateTopic(topicId, content) {
        const topic = this.topics.find(t => t.id === topicId);
        if (topic) {
            topic.content = content;
            topic.updatedAt = new Date().toISOString();
            this.updatedAt = new Date().toISOString();
        }
    }

    reorderTopics(newOrder) {
        this.topics = newOrder;
        this.updatedAt = new Date().toISOString();
    }

    toHTML() {
        const topicsHTML = this.topics.map(topic => `
            <div class="topic-item" data-topic-id="${topic.id}">
                <div class="topic-header">
                    <div class="drag-handle">
                        <i class="fas fa-grip-vertical"></i>
                    </div>
                    <div class="topic-actions">
                        <button class="btn btn-small btn-secondary edit-topic-btn" data-topic-id="${topic.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-small btn-danger delete-topic-btn" data-topic-id="${topic.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="topic-content">${this.escapeHtml(topic.content)}</div>
            </div>
        `).join('');

        return `
            <div class="project-card fade-in" data-project-id="${this.id}">
                <div class="project-header">
                    <div class="project-info">
                        <h3>${this.escapeHtml(this.title)}</h3>
                        ${this.description ? `<p>${this.escapeHtml(this.description)}</p>` : ''}
                    </div>
                    <div class="project-actions">
                        <button class="btn btn-small btn-secondary edit-project-btn" data-project-id="${this.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-small btn-danger delete-project-btn" data-project-id="${this.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="project-body">
                    <div class="topics-container" data-project-id="${this.id}">
                        ${topicsHTML}
                    </div>
                    <button class="add-topic-btn" data-project-id="${this.id}">
                        <i class="fas fa-plus"></i>
                        Adicionar Tópico
                    </button>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toPlainText() {
        let text = `${this.title}\n`;
        text += '='.repeat(this.title.length) + '\n\n';
        
        if (this.description) {
            text += `${this.description}\n\n`;
        }

        if (this.topics.length > 0) {
            text += 'Tópicos:\n';
            this.topics.forEach((topic, index) => {
                text += `${index + 1}. ${topic.content}\n`;
            });
        }

        text += `\nCriado em: ${new Date(this.createdAt).toLocaleString('pt-BR')}\n`;
        text += `Atualizado em: ${new Date(this.updatedAt).toLocaleString('pt-BR')}\n\n`;
        
        return text;
    }
}
