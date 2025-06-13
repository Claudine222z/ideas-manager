class Topic {
    constructor(id = null, content = '') {
        this.id = id || this.generateId();
        this.content = content;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    generateId() {
        return 'topic_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    update(content) {
        this.content = content;
        this.updatedAt = new Date().toISOString();
    }

    clone() {
        return new Topic(null, this.content);
    }

    isEmpty() {
        return !this.content || this.content.trim() === '';
    }

    getWordCount() {
        return this.content.trim().split(/\s+/).length;
    }

    getCharCount() {
        return this.content.length;
    }

    toJSON() {
        return {
            id: this.id,
            content: this.content,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(data) {
        const topic = new Topic(data.id, data.content);
        topic.createdAt = data.createdAt;
        topic.updatedAt = data.updatedAt;
        return topic;
    }

    toHTML() {
        return `
            <div class="topic-item" data-topic-id="${this.id}">
                <div class="topic-header">
                    <div class="drag-handle">
                        <i class="fas fa-grip-vertical"></i>
                    </div>
                    <div class="topic-actions">
                        <button class="btn btn-small btn-secondary edit-topic-btn" data-topic-id="${this.id}" title="Editar tópico">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-small btn-danger delete-topic-btn" data-topic-id="${this.id}" title="Excluir tópico">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="topic-content">${this.escapeHtml(this.content)}</div>
                <div class="topic-meta">
                    <small class="text-secondary">
                        ${this.getWordCount()} palavras • ${this.getCharCount()} caracteres
                    </small>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toPlainText(index = null) {
        const prefix = index !== null ? `${index + 1}. ` : '• ';
        return `${prefix}${this.content}`;
    }
}

// Classe para gerenciar operações com tópicos
class TopicManager {
    constructor() {
        this.currentEditingTopic = null;
        this.currentProject = null;
    }

    // Criar novo tópico
    createTopic(content = '') {
        return new Topic(null, content);
    }

    // Mostrar modal para adicionar/editar tópico
    showTopicModal(projectId, topicId = null) {
        this.currentProject = projectId;
        this.currentEditingTopic = topicId;

        const modal = this.createTopicModal();
        document.body.appendChild(modal);

        // Se estiver editando, preencher com dados existentes
        if (topicId) {
            const project = app.getProject(projectId);
            const topic = project.topics.find(t => t.id === topicId);
            if (topic) {
                document.getElementById('topicContent').value = topic.content;
                document.getElementById('topicModalTitle').textContent = 'Editar Tópico';
            }
        }

        modal.classList.add('active');
        document.getElementById('topicContent').focus();
    }

    // Criar modal do tópico
    createTopicModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'topicModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="topicModalTitle">Novo Tópico</h2>
                    <button class="close-btn" onclick="topicManager.closeTopicModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="topicForm">
                        <div class="form-group">
                            <label for="topicContent">Conteúdo do Tópico</label>
                            <textarea id="topicContent" rows="4" placeholder="Descreva sua ideia aqui..." required></textarea>
                            <div class="form-meta">
                                <small class="text-secondary">
                                    <span id="topicWordCount">0</span> palavras • 
                                    <span id="topicCharCount">0</span> caracteres
                                </small>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="topicManager.closeTopicModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="topicManager.saveTopic()">Salvar</button>
                </div>
            </div>
        `;

        // Adicionar contador de palavras/caracteres
        const textarea = modal.querySelector('#topicContent');
        textarea.addEventListener('input', this.updateTopicCounter);

        return modal;
    }

    // Atualizar contador de palavras/caracteres
    updateTopicCounter() {
        const content = document.getElementById('topicContent').value;
        const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
        const charCount = content.length;

        document.getElementById('topicWordCount').textContent = wordCount;
        document.getElementById('topicCharCount').textContent = charCount;
    }

    // Salvar tópico
    saveTopic() {
        const content = document.getElementById('topicContent').value.trim();
        
        if (!content) {
            alert('Por favor, adicione conteúdo ao tópico.');
            return;
        }

        const project = app.getProject(this.currentProject);
        
        if (this.currentEditingTopic) {
            // Editando tópico existente
            project.updateTopic(this.currentEditingTopic, content);
        } else {
            // Criando novo tópico
            const topic = this.createTopic(content);
            project.addTopic(topic);
        }

        app.saveProjects();
        app.renderProjects();
        this.closeTopicModal();
    }

    // Fechar modal do tópico
    closeTopicModal() {
        const modal = document.getElementById('topicModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
        
        this.currentEditingTopic = null;
        this.currentProject = null;
    }

    // Excluir tópico
    deleteTopic(projectId, topicId) {
        if (confirm('Tem certeza que deseja excluir este tópico?')) {
            const project = app.getProject(projectId);
            project.removeTopic(topicId);
            app.saveProjects();
            app.renderProjects();
        }
    }

    // Configurar drag and drop para tópicos
    setupTopicSorting(projectId) {
        const container = document.querySelector(`[data-project-id="${projectId}"] .topics-container`);
        if (!container) return;

        new Sortable(container, {
            handle: '.drag-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: (evt) => {
                this.reorderTopics(projectId, evt.oldIndex, evt.newIndex);
            }
        });
    }

    // Reordenar tópicos
    reorderTopics(projectId, oldIndex, newIndex) {
        const project = app.getProject(projectId);
        const topics = [...project.topics];
        const [movedTopic] = topics.splice(oldIndex, 1);
        topics.splice(newIndex, 0, movedTopic);
        
        project.reorderTopics(topics);
        app.saveProjects();
    }
}

// Instância global do gerenciador de tópicos
const topicManager = new TopicManager();
