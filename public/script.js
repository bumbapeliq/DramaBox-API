class DramaBoxApp {
    constructor() {
        this.currentPage = 1;
        this.isLoading = false;
        this.currentDrama = null;
        this.currentEpisode = 1;
        
        this.initializeElements();
        this.bindEvents();
        this.loadLatestDramas();
    }

    initializeElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),
            loading: document.getElementById('loading'),
            dramaGrid: document.getElementById('dramaGrid'),
            searchGrid: document.getElementById('searchGrid'),
            searchResults: document.getElementById('searchResults'),
            latestSection: document.getElementById('latestSection'),
            prevPage: document.getElementById('prevPage'),
            nextPage: document.getElementById('nextPage'),
            pageInfo: document.getElementById('pageInfo'),
            videoModal: document.getElementById('videoModal'),
            modalTitle: document.getElementById('modalTitle'),
            closeModal: document.getElementById('closeModal'),
            videoPlayer: document.getElementById('videoPlayer'),
            episodeList: document.getElementById('episodeList')
        };
    }

    bindEvents() {
        this.elements.searchBtn.addEventListener('click', () => this.searchDramas());
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchDramas();
        });
        
        this.elements.prevPage.addEventListener('click', () => this.changePage(-1));
        this.elements.nextPage.addEventListener('click', () => this.changePage(1));
        
        this.elements.closeModal.addEventListener('click', () => this.closeModal());
        this.elements.videoModal.addEventListener('click', (e) => {
            if (e.target === this.elements.videoModal) this.closeModal();
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    showLoading() {
        this.elements.loading.style.display = 'block';
        this.isLoading = true;
    }

    hideLoading() {
        this.elements.loading.style.display = 'none';
        this.isLoading = false;
    }

    async loadLatestDramas() {
        if (this.isLoading) return;
        
        this.showLoading();
        this.elements.searchResults.style.display = 'none';
        this.elements.latestSection.style.display = 'block';

        try {
            const response = await fetch(`/api/latest?page=${this.currentPage}`);
            const dramas = await response.json();
            
            this.renderDramas(dramas, this.elements.dramaGrid);
            this.updatePagination();
        } catch (error) {
            console.error('Error loading dramas:', error);
            this.showError('Gagal memuat drama. Silakan coba lagi.');
        } finally {
            this.hideLoading();
        }
    }

    async searchDramas() {
        const keyword = this.elements.searchInput.value.trim();
        if (!keyword) return;

        if (this.isLoading) return;
        
        this.showLoading();
        this.elements.latestSection.style.display = 'none';
        this.elements.searchResults.style.display = 'block';

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
            const dramas = await response.json();
            
            this.renderDramas(dramas, this.elements.searchGrid);
        } catch (error) {
            console.error('Error searching dramas:', error);
            this.showError('Gagal mencari drama. Silakan coba lagi.');
        } finally {
            this.hideLoading();
        }
    }

    renderDramas(dramas, container) {
        if (!dramas || dramas.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666; grid-column: 1 / -1;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Tidak ada drama ditemukan.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = dramas.map(drama => `
            <div class="drama-card" onclick="app.openDrama('${drama.bookId}', '${this.escapeHtml(drama.title)}', ${drama.chapterCount})">
                <div class="drama-poster">
                    ${drama.coverUrl ? `<img src="${drama.coverUrl}" alt="${this.escapeHtml(drama.title)}" onerror="this.style.display='none'">` : ''}
                    <i class="fas fa-play"></i>
                </div>
                <div class="drama-info">
                    <h3 class="drama-title">${this.escapeHtml(drama.title)}</h3>
                    <div class="drama-meta">
                        <span><i class="fas fa-list"></i> ${drama.chapterCount} Episode</span>
                        <span><i class="fas fa-star"></i> ${drama.score || 'N/A'}</span>
                    </div>
                    <p class="drama-description">${this.escapeHtml(drama.description || 'Deskripsi tidak tersedia.')}</p>
                    <button class="play-btn">
                        <i class="fas fa-play"></i>
                        Tonton Sekarang
                    </button>
                </div>
            </div>
        `).join('');
    }

    async openDrama(bookId, title, chapterCount) {
        this.currentDrama = { bookId, title, chapterCount };
        this.currentEpisode = 1;
        
        this.elements.modalTitle.textContent = title;
        this.elements.videoModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Generate episode list
        this.renderEpisodeList(chapterCount);
        
        // Load first episode
        await this.loadEpisode(bookId, 1);
    }

    renderEpisodeList(chapterCount) {
        const episodes = Array.from({ length: chapterCount }, (_, i) => i + 1);
        
        this.elements.episodeList.innerHTML = episodes.map(episode => `
            <button class="episode-btn ${episode === 1 ? 'active' : ''}" 
                    onclick="app.loadEpisode('${this.currentDrama.bookId}', ${episode})">
                <div style="font-weight: 600;">Episode ${episode}</div>
                <div style="font-size: 0.8rem; opacity: 0.8;">Klik untuk memutar</div>
            </button>
        `).join('');
    }

    async loadEpisode(bookId, episode) {
        try {
            // Update active episode button
            document.querySelectorAll('.episode-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`.episode-btn:nth-child(${episode})`).classList.add('active');
            
            this.currentEpisode = episode;
            
            // Show loading on video
            this.elements.videoPlayer.src = '';
            this.elements.videoPlayer.poster = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1lbXVhdC4uLjwvdGV4dD48L3N2Zz4=';
            
            const response = await fetch(`/api/stream/${bookId}/${episode}`);
            const data = await response.json();
            
            if (data.streamUrl) {
                this.elements.videoPlayer.src = data.streamUrl;
                this.elements.videoPlayer.poster = '';
                this.elements.videoPlayer.load();
            } else {
                throw new Error('Stream URL not found');
            }
        } catch (error) {
            console.error('Error loading episode:', error);
            this.showError('Gagal memuat episode. Silakan coba lagi.');
        }
    }

    closeModal() {
        this.elements.videoModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.elements.videoPlayer.pause();
        this.elements.videoPlayer.src = '';
        this.currentDrama = null;
    }

    changePage(direction) {
        const newPage = this.currentPage + direction;
        if (newPage < 1) return;
        
        this.currentPage = newPage;
        this.loadLatestDramas();
    }

    updatePagination() {
        this.elements.pageInfo.textContent = `Halaman ${this.currentPage}`;
        this.elements.prevPage.disabled = this.currentPage === 1;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(255, 71, 87, 0.3);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize app
const app = new DramaBoxApp();