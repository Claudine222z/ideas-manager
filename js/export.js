class ExportManager {
    constructor() {
        this.exportFormats = ['pdf', 'txt'];
    }

    // Exportar todos os projetos
    exportAllProjects(format) {
        const projects = app.projects;
        
        if (projects.length === 0) {
            alert('Não há projetos para exportar.');
            return;
        }

        switch (format) {
            case 'pdf':
                this.exportToPDF(projects);
                break;
            case 'txt':
                this.exportToTXT(projects);
                break;
            default:
                console.error('Formato de exportação não suportado:', format);
        }
    }

    // Exportar projeto específico
    exportProject(projectId, format) {
        const project = app.getProject(projectId);
        if (!project) {
            alert('Projeto não encontrado.');
            return;
        }

        switch (format) {
            case 'pdf':
                this.exportToPDF([project]);
                break;
            case 'txt':
                this.exportToTXT([project]);
                break;
            default:
                console.error('Formato de exportação não suportado:', format);
        }
    }

    // Exportar para PDF
    exportToPDF(projects) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            let yPosition = 20;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            const lineHeight = 7;

            // Título do documento
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('Ideas Manager - Minhas Ideias de Programação', margin, yPosition);
            yPosition += lineHeight * 2;

            // Data de exportação
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Exportado em: ${new Date().toLocaleString('pt-BR')}`, margin, yPosition);
            yPosition += lineHeight * 2;

            projects.forEach((project, projectIndex) => {
                // Verificar se precisa de nova página
                if (yPosition > pageHeight - 60) {
                    doc.addPage();
                    yPosition = margin;
                }

                // Título do projeto
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                const titleLines = doc.splitTextToSize(project.title, 170);
                doc.text(titleLines, margin, yPosition);
                yPosition += titleLines.length * lineHeight + 5;

                // Descrição do projeto
                if (project.description) {
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'normal');
                    const descLines = doc.splitTextToSize(project.description, 170);
                    doc.text(descLines, margin, yPosition);
                    yPosition += descLines.length * lineHeight + 5;
                }

                // Tópicos
                if (project.topics.length > 0) {
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text('Tópicos:', margin, yPosition);
                    yPosition += lineHeight + 2;

                    doc.setFont(undefined, 'normal');
                    project.topics.forEach((topic, index) => {
                        // Verificar se precisa de nova página
                        if (yPosition > pageHeight - 40) {
                            doc.addPage();
                            yPosition = margin;
                        }

                        const topicText = `${index + 1}. ${topic.content}`;
                        const topicLines = doc.splitTextToSize(topicText, 165);
                        doc.text(topicLines, margin + 5, yPosition);
                        yPosition += topicLines.length * lineHeight + 3;
                    });
                }

                // Espaço entre projetos
                yPosition += lineHeight;
                
                // Linha separadora (exceto no último projeto)
                if (projectIndex < projects.length - 1) {
                    doc.setDrawColor(200, 200, 200);
                    doc.line(margin, yPosition, 190, yPosition);
                    yPosition += lineHeight * 2;
                }
            });

            // Salvar o PDF
            const fileName = projects.length === 1 
                ? `${this.sanitizeFileName(projects[0].title)}.pdf`
                : `Ideas_Manager_${new Date().toISOString().split('T')[0]}.pdf`;
            
            doc.save(fileName);

        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            alert('Erro ao exportar PDF. Tente novamente.');
        }
    }

    // Exportar para TXT
    exportToTXT(projects) {
        try {
            let content = 'IDEAS MANAGER - MINHAS IDEIAS DE PROGRAMAÇÃO\n';
            content += '='.repeat(50) + '\n\n';
            content += `Exportado em: ${new Date().toLocaleString('pt-BR')}\n\n`;

            projects.forEach((project, index) => {
                content += `${project.title}\n`;
                content += '='.repeat(project.title.length) + '\n\n';

                if (project.description) {
                    content += `Descrição: ${project.description}\n\n`;
                }

                if (project.topics.length > 0) {
                    content += 'Tópicos:\n';
                    project.topics.forEach((topic, topicIndex) => {
                        content += `${topicIndex + 1}. ${topic.content}\n`;
                    });
                    content += '\n';
                }

                content += `Criado em: ${new Date(project.createdAt).toLocaleString('pt-BR')}\n`;
                content += `Atualizado em: ${new Date(project.updatedAt).toLocaleString('pt-BR')}\n`;

                if (index < projects.length - 1) {
                    content += '\n' + '-'.repeat(50) + '\n\n';
                }
            });

            // Criar e baixar arquivo
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            const fileName = projects.length === 1 
                ? `${this.sanitizeFileName(projects[0].title)}.txt`
                : `Ideas_Manager_${new Date().toISOString().split('T')[0]}.txt`;
            
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Erro ao exportar TXT:', error);
            alert('Erro ao exportar TXT. Tente novamente.');
        }
    }

    // Exportar dados para backup JSON
    exportBackup() {
        try {
            const backupData = storage.exportData();
            const blob = new Blob([backupData], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            const fileName = `Ideas_Manager_Backup_${new Date().toISOString().split('T')[0]}.json`;
            
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Erro ao exportar backup:', error);
            alert('Erro ao criar backup. Tente novamente.');
        }
    }

    // Importar dados de backup
    importBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const success = storage.importData(e.target.result);
                    if (success) {
                        app.loadProjects();
                        app.renderProjects();
                        resolve(true);
                    } else {
                        reject(new Error('Formato de arquivo inválido'));
                    }
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file);
        });
    }

    // Limpar nome do arquivo
    sanitizeFileName(fileName) {
        return fileName
            .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
            .replace(/\s+/g, '_') // Substitui espaços por underscore
            .substring(0, 50); // Limita o tamanho
    }

    // Mostrar modal de exportação
    showExportModal() {
        const modal = this.createExportModal();
        document.body.appendChild(modal);
        modal.classList.add('active');
    }

    // Criar modal de exportação
    createExportModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'exportModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Exportar Projetos</h2>
                    <button class="close-btn" onclick="exportManager.closeExportModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="export-section">
                        <h3>Exportar Documentos</h3>
                        <p class="text-secondary mb-2">Exporte seus projetos em formato legível</p>
                        <div class="export-options">
                            <button class="btn btn-primary export-option" onclick="exportManager.exportAllProjects('pdf')">
                                <i class="fas fa-file-pdf"></i> Exportar como PDF
                            </button>
                            <button class="btn btn-primary export-option" onclick="exportManager.exportAllProjects('txt')">
                                <i class="fas fa-file-alt"></i> Exportar como TXT
                            </button>
                        </div>
                    </div>
                    
                    <div class="export-section">
                        <h3>Backup de Dados</h3>
                        <p class="text-secondary mb-2">Faça backup ou restaure seus dados</p>
                        <div class="export-options">
                            <button class="btn btn-success export-option" onclick="exportManager.exportBackup()">
                                <i class="fas fa-download"></i> Fazer Backup
                            </button>
                            <label class="btn btn-warning export-option" for="importFile">
                                <i class="fas fa-upload"></i> Restaurar Backup
                                <input type="file" id="importFile" accept=".json" style="display: none;" onchange="exportManager.handleImport(event)">
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="exportManager.closeExportModal()">Fechar</button>
                </div>
            </div>
        `;

        return modal;
    }

    // Fechar modal de exportação
    closeExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    // Lidar com importação de arquivo
    async handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            await this.importBackup(file);
            alert('Backup restaurado com sucesso!');
            this.closeExportModal();
        } catch (error) {
            console.error('Erro ao importar:', error);
            alert('Erro ao restaurar backup: ' + error.message);
        }

        // Limpar input
        event.target.value = '';
    }

    // Gerar relatório de estatísticas
    generateStatsReport() {
        const projects = app.projects;
        const totalProjects = projects.length;
        const totalTopics = projects.reduce((sum, project) => sum + project.topics.length, 0);
        const totalWords = projects.reduce((sum, project) => {
            return sum + project.topics.reduce((topicSum, topic) => {
                return topicSum + (topic.content.trim() ? topic.content.trim().split(/\s+/).length : 0);
            }, 0);
        }, 0);

        const oldestProject = projects.reduce((oldest, project) => {
            return new Date(project.createdAt) < new Date(oldest.createdAt) ? project : oldest;
        }, projects[0]);

        const newestProject = projects.reduce((newest, project) => {
            return new Date(project.createdAt) > new Date(newest.createdAt) ? project : newest;
        }, projects[0]);

        return {
            totalProjects,
            totalTopics,
            totalWords,
            averageTopicsPerProject: totalProjects > 0 ? (totalTopics / totalProjects).toFixed(1) : 0,
            averageWordsPerProject: totalProjects > 0 ? (totalWords / totalProjects).toFixed(0) : 0,
            oldestProject: oldestProject ? {
                title: oldestProject.title,
                date: new Date(oldestProject.createdAt).toLocaleDateString('pt-BR')
            } : null,
            newestProject: newestProject ? {
                title: newestProject.title,
                date: new Date(newestProject.createdAt).toLocaleDateString('pt-BR')
            } : null
        };
    }

    // Exportar relatório de estatísticas
    exportStats() {
        const stats = this.generateStatsReport();
        
        let content = 'IDEAS MANAGER - RELATÓRIO DE ESTATÍSTICAS\n';
        content += '='.repeat(45) + '\n\n';
        content += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
        
        content += 'RESUMO GERAL:\n';
        content += `--------------\n`;
        content += `Total de Projetos: ${stats.totalProjects}\n`;
        content += `Total de Tópicos: ${stats.totalTopics}\n`;
        content += `Total de Palavras: ${stats.totalWords}\n`;
        content += `Média de Tópicos por Projeto: ${stats.averageTopicsPerProject}\n`;
        content += `Média de Palavras por Projeto: ${stats.averageWordsPerProject}\n\n`;

        if (stats.oldestProject) {
            content += `Projeto mais antigo: ${stats.oldestProject.title} (${stats.oldestProject.date})\n`;
        }
        if (stats.newestProject) {
            content += `Projeto mais recente: ${stats.newestProject.title} (${stats.newestProject.date})\n`;
        }

        // Criar e baixar arquivo
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `Ideas_Manager_Stats_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Instância global do gerenciador de exportação
const exportManager = new ExportManager();
