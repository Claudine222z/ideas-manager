class App {
    constructor() {
        this.projects = [];
        this.currentEditingProject = null;
        this.init();
    }

    // Inicializar aplicação
    init() {
        this.loadProjects();
        this.setupEventListeners();
        this.renderProjects();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Botão novo projeto
        document.getElementById('newProjectBtn').addEventListener('click', () => {
            this.showProjectModal();
        });

        // Botão exportar
        document.getElementById('exportBtn').addEventListener('click', () => {
            exportManager.showExportModal();
        });

        // Modal de projeto
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeProjectModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeProjectModal();
        });

        document.getElementById('saveProjectBtn').addEventListener('click', () => {
            this.saveProject();
        });

        // Fechar modal clicando fora
        document.getElementById('projectModal').addEventListener('click', (e) => {
            if (e.target.id === 'projectModal') {
                this.closeProjectModal();
            }
        });

        // Tecla ESC para fechar modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeProjectModal();
                exportManager.closeExportModal();
                if (topicManager.currentProject) {
                    topicManager.closeTopicModal();
                }
            }
        });

        // Event delegation para botões dinâmicos
        document.addEventListener('click', (e) => {
            this.handleDynamicClicks(e);
        });
    }

    // Lidar com cliques em elementos dinâmicos
    handleDynamicClicks(e) {
        const target = e.target.closest('button');
        if (!target) return;

        // Editar projeto
        if (target.classList.contains('edit-project-btn')) {
            const projectId = target.dataset.projectId;
            this.showProjectModal(projectId);
        }

        // Excluir projeto
        if (target.classList.contains('delete-project-btn')) {
            const projectId = target.dataset.projectId;
            this.deleteProject(projectId);
        }

        // Adicionar tópico
        if (target.classList.contains('add-topic-btn')) {
            const projectId = target.dataset.projectId;
            topicManager.showTopicModal(projectId);
        }

        // Editar tópico
        if (target.classList.contains('edit-topic-btn')) {
            const topicId = target.dataset.topicId;
            const projectId = target.closest('.project-card').dataset.projectId;
            topicManager.showTopicModal(projectId, topicId);
        }

        // Excluir tópico
        if (target.classList.contains('delete-topic-btn')) {
            const topicId = target.dataset.topicId;
            const projectId = target.closest('.project-card').dataset.projectId;
            topicManager.deleteTopic(projectId, topicId);
        }
    }

    // Carregar projetos do storage
    loadProjects() {
        const projectsData = storage.loadProjects();
        this.projects = projectsData.map(data => {
            const project = new Project(data.id, data.title, data.description);
            project.topics = data.topics.map(topicData => Topic.fromJSON(topicData));
            project.createdAt = data.createdAt;
            project.updatedAt = data.updatedAt;
            return project;
        });
    }

    // Salvar projetos no storage
    saveProjects() {
        const projectsData = this.projects.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            topics: project.topics.map(topic => topic.toJSON()),
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
        }));
        storage.saveProjects(projectsData);
    }

    // Obter projeto por ID
    getProject(projectId) {
        return this.projects.find(project => project.id === projectId);
    }

    // Renderizar projetos
    renderProjects() {
        const container = document.getElementById('projectsContainer');
        
        if (this.projects.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = this.projects
            .map(project => project.toHTML())
            .join('');

        // Configurar drag and drop para cada projeto
        this.projects.forEach(project => {
            topicManager.setupTopicSorting(project.id);
        });
    }

    // Estado vazio
    getEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-lightbulb"></i>
                <h3>Nenhum projeto criado ainda</h3>
                <p>Comece criando seu primeiro projeto de programação!</p>
                <button class="btn btn-primary mt-2" onclick="app.showProjectModal()">
                    <i class="fas fa-plus"></i> Criar Primeiro Projeto
                </button>
            </div>
        `;
    }

    // Mostrar modal de projeto
    showProjectModal(projectId = null) {
        this.currentEditingProject = projectId;
        const modal = document.getElementById('projectModal');
        const modalTitle = document.getElementById('modalTitle');
        const projectTitle = document.getElementById('projectTitle');
        const projectDescription = document.getElementById('projectDescription');

        // Limpar formulário
        projectTitle.value = '';
        projectDescription.value = '';

        if (projectId) {
            // Editando projeto existente
            const project = this.getProject(projectId);
            if (project) {
                modalTitle.textContent = 'Editar Projeto';
                projectTitle.value = project.title;
                projectDescription.value = project.description;
            }
        } else {
            // Criando novo projeto
            modalTitle.textContent = 'Novo Projeto';
        }

        modal.classList.add('active');
        projectTitle.focus();
    }

    // Fechar modal de projeto
    closeProjectModal() {
        const modal = document.getElementById('projectModal');
        modal.classList.remove('active');
        this.currentEditingProject = null;
    }

    // Salvar projeto
    saveProject() {
        const title = document.getElementById('projectTitle').value.trim();
        const description = document.getElementById('projectDescription').value.trim();

        if (!title) {
            alert('Por favor, adicione um título ao projeto.');
            document.getElementById('projectTitle').focus();
            return;
        }

        if (this.currentEditingProject) {
            // Editando projeto existente
            const project = this.getProject(this.currentEditingProject);
            if (project) {
                project.update(title, description);
            }
        } else {
            // Criando novo projeto
            const project = new Project(null, title, description);
            this.projects.unshift(project); // Adiciona no início da lista
        }

        this.saveProjects();
        this.renderProjects();
        this.closeProjectModal();

        // Mostrar feedback
        this.showNotification(
            this.currentEditingProject ? 'Projeto atualizado com sucesso!' : 'Projeto criado com sucesso!',
            'success'
        );
    }

    // Excluir projeto
    deleteProject(projectId) {
        const project = this.getProject(projectId);
        if (!project) return;

        const confirmMessage = `Tem certeza que deseja excluir o projeto "${project.title}"?\n\nEsta ação não pode ser desfeita.`;
        
        if (confirm(confirmMessage)) {
            this.projects = this.projects.filter(p => p.id !== projectId);
            this.saveProjects();
            this.renderProjects();
            this.showNotification('Projeto excluído com sucesso!', 'success');
        }
    }

    // Duplicar projeto
    duplicateProject(projectId) {
        const originalProject = this.getProject(projectId);
        if (!originalProject) return;

        const duplicatedProject = new Project(
            null,
            `${originalProject.title} (Cópia)`,
            originalProject.description
        );

        // Duplicar tópicos
        originalProject.topics.forEach(topic => {
            const duplicatedTopic = topic.clone();
            duplicatedProject.addTopic(duplicatedTopic);
        });

        this.projects.unshift(duplicatedProject);
        this.saveProjects();
        this.renderProjects();
        this.showNotification('Projeto duplicado com sucesso!', 'success');
    }

    // Buscar projetos
    searchProjects(query) {
        if (!query.trim()) {
            this.renderProjects();
            return;
        }

        const filteredProjects = this.projects.filter(project => {
            const titleMatch = project.title.toLowerCase().includes(query.toLowerCase());
            const descriptionMatch = project.description.toLowerCase().includes(query.toLowerCase());
            const topicsMatch = project.topics.some(topic => 
                topic.content.toLowerCase().includes(query.toLowerCase())
            );
            
            return titleMatch || descriptionMatch || topicsMatch;
        });

        this.renderFilteredProjects(filteredProjects, query);
    }

    // Renderizar projetos filtrados
    renderFilteredProjects(projects, query) {
        const container = document.getElementById('projectsContainer');
        
        if (projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Nenhum resultado encontrado</h3>
                    <p>Não foram encontrados projetos para "${query}"</p>
                    <button class="btn btn-secondary mt-2" onclick="app.clearSearch()">
                        <i class="fas fa-times"></i> Limpar Busca
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = projects
            .map(project => project.toHTML())
            .join('');

        // Configurar drag and drop para cada projeto
        projects.forEach(project => {
            topicManager.setupTopicSorting(project.id);
        });
    }

    // Limpar busca
    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        this.renderProjects();
    }

    // Mostrar notificação
    showNotification(message, type = 'info') {
        // Remover notificação existente
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Criar nova notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remover após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Obter ícone da notificação
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }

    // Exportar projeto específico
    exportProject(projectId, format) {
        exportManager.exportProject(projectId, format);
    }

    // Obter estatísticas da aplicação
    getAppStats() {
        return exportManager.generateStatsReport();
    }

    // Limpar todos os dados
    clearAllData() {
        const confirmMessage = 'ATENÇÃO: Esta ação irá excluir TODOS os seus projetos!\n\nEsta ação não pode ser desfeita. Tem certeza que deseja continuar?';
        
        if (confirm(confirmMessage)) {
            const doubleConfirm = prompt('Digite "EXCLUIR TUDO" para confirmar:');
            if (doubleConfirm === 'EXCLUIR TUDO') {
                this.projects = [];
                storage.clearAll();
                this.renderProjects();
                this.showNotification('Todos os dados foram excluídos!', 'success');
            } else {
                this.showNotification('Operação cancelada.', 'info');
            }
        }
    }

    // Verificar se há mudanças não salvas
    hasUnsavedChanges() {
        // Esta função pode ser expandida para detectar mudanças não salvas
        return false;
    }

    // Salvar automaticamente (pode ser chamado periodicamente)
    autoSave() {
        if (this.hasUnsavedChanges()) {
            this.saveProjects();
        }
    }

    // Configurar salvamento automático
    setupAutoSave() {
        // Salvar automaticamente a cada 30 segundos
        setInterval(() => {
            this.autoSave();
        }, 30000);
    }

    // Adicionar barra de busca ao header
    addSearchBar() {
        const headerActions = document.querySelector('.header-actions');
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <div class="search-input-container">
                <i class="fas fa-search search-icon"></i>
                <input type="text" id="searchInput" placeholder="Buscar projetos..." class="search-input">
                <button class="search-clear" id="clearSearch" style="display: none;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        headerActions.insertBefore(searchContainer, headerActions.firstChild);

        // Event listeners para busca
        const searchInput = document.getElementById('searchInput');
        const clearButton = document.getElementById('clearSearch');

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.trim()) {
                clearButton.style.display = 'block';
                this.searchProjects(query);
            } else {
                clearButton.style.display = 'none';
                this.renderProjects();
            }
        });

        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            clearButton.style.display = 'none';
            this.renderProjects();
            searchInput.focus();
        });
    }

    // Inicializar recursos adicionais
    initializeAdditionalFeatures() {
        this.addSearchBar();
        this.setupAutoSave();
        
        // Adicionar atalhos de teclado
        this.setupKeyboardShortcuts();
    }

    // Configurar atalhos de teclado
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N = Novo projeto
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.showProjectModal();
            }

            // Ctrl/Cmd + S = Salvar (se modal estiver aberto)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                const projectModal = document.getElementById('projectModal');
                if (projectModal.classList.contains('active')) {
                    e.preventDefault();
                    this.saveProject();
                }
            }

            // Ctrl/Cmd + F = Focar na busca
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    e.preventDefault();
                    searchInput.focus();
                }
            }
        });
    }
}

// Inicializar aplicação quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    
    // Inicializar recursos adicionais após um pequeno delay
    setTimeout(() => {
        app.initializeAdditionalFeatures();
    }, 100);
});

// Adicionar estilos para busca e notificações
const additionalStyles = `
    .search-container {
        margin-right: 1rem;
    }

    .search-input-container {
        position: relative;
        display: flex;
        align-items: center;
    }

    .search-input {
        padding: 0.75rem 2.5rem 0.75rem 2.5rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        font-size: 0.9rem;
        width: 250px;
        transition: var(--transition);
    }

    .search-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .search-icon {
        position: absolute;
        left: 0.75rem;
        color: var(--text-secondary);
        z-index: 1;
    }

    .search-clear {
        position: absolute;
        right: 0.5rem;
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 50%;
        transition: var(--transition);
    }

    .search-clear:hover {
        background: var(--bg-color);
        color: var(--text-primary);
    }

    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1001;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    }

    .notification-content {
        background: var(--card-bg);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        border-left: 4px solid var(--primary-color);
    }

    .notification-success .notification-content {
        border-left-color: var(--success-color);
    }

    .notification-error .notification-content {
        border-left-color: var(--danger-color);
    }

    .notification-warning .notification-content {
        border-left-color: var(--warning-color);
    }

    .notification-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.25rem;
        margin-left: auto;
        border-radius: 50%;
        transition: var(--transition);
    }

    .notification-close:hover {
        background: var(--bg-color);
        color: var(--text-primary);
    }

    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @media (max-width: 768px) {
        .search-input {
            width: 200px;
        }
        
        .notification {
            left: 10px;
            right: 10px;
            max-width: none;
        }
    }

    @media (max-width: 480px) {
        .search-container {
            order: 3;
            width: 100%;
            margin: 0.5rem 0 0 0;
        }
        
        .search-input {
            width: 100%;
        }
    }
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
