// 预设的RSS源
const presetRssSources = [
    {
        name: "3DM游戏新闻",
        url: "https://rsshub-k7m9.zeabur.app/3dmgame/news",
        isPreset: true
    },
    {
        name: "游民星空PC新闻",
        url: "https://rsshub-k7m9.zeabur.app/gamersky/news/pc",
        isPreset: true
    },
    {
        name: "Mobile Gamer",
        url: "https://mobilegamer.biz/feed",
        isPreset: true
    },
    {
        name: "游戏矩阵",
        url: "https://shouyoujz.com/feed",
        isPreset: true
    },
    {
        name: "GamesIndustry.biz",
        url: "https://www.gamesindustry.biz/feed",
        isPreset: true
    },
    {
        name: "GameDeveloper",
        url: "https://www.gamedeveloper.com/rss.xml",
        isPreset: true
    },
    {
        name: "Pocket Gamer",
        url: "https://www.pocketgamer.com/news/pga-winners-cosy-games-warcraft-rumble/index.rss",
        isPreset: true
    }
];

// 初始化页面
function init() {
    // 获取当前存储的所有RSS源
    let allRssSources = [];
    const localStorageKey = 'allRssSources';
    
    try {
        const storedSources = localStorage.getItem(localStorageKey);
        if (storedSources) {
            allRssSources = JSON.parse(storedSources);
        } else {
            // 初始化存储，包含所有预设源和自定义源
            allRssSources = [...presetRssSources, ...getSavedRssSources()];
            localStorage.setItem(localStorageKey, JSON.stringify(allRssSources));
        }
    } catch (e) {
        console.error('Failed to load RSS sources from localStorage:', e);
        allRssSources = [...presetRssSources, ...getSavedRssSources()];
    }
    
    // 移除导航栏渲染
    renderAllRssSources(allRssSources);
    setupModalEvents();
    setupSliderFunctionality();
}

document.addEventListener('DOMContentLoaded', init);

// 从本地存储获取保存的RSS源
function getSavedRssSources() {
    const saved = localStorage.getItem('customRssSources');
    return saved ? JSON.parse(saved) : [];
}

// 保存RSS源到本地存储
function saveRssSources(sources) {
    localStorage.setItem('customRssSources', JSON.stringify(sources));
}

// 渲染新闻源导航栏
function renderRssNavigation(rssSources) {
    // 检查是否已存在导航栏，如果存在则先移除
    const existingNav = document.querySelector('.rss-navigation');
    if (existingNav) {
        existingNav.remove();
    }
    
    // 创建导航容器
    const navContainer = document.createElement('div');
    navContainer.className = 'rss-navigation';
    
    // 添加"全部"按钮
    const allBtn = document.createElement('button');
    allBtn.className = 'nav-btn active';
    allBtn.dataset.filter = 'all';
    allBtn.textContent = '全部';
    navContainer.appendChild(allBtn);
    
    // 为每个RSS源创建导航按钮
    rssSources.forEach(source => {
        const navBtn = document.createElement('button');
        navBtn.className = 'nav-btn';
        navBtn.dataset.filter = source.url;
        navBtn.textContent = source.name;
        navContainer.appendChild(navBtn);
    });
    
    // 添加到页面顶部
    const header = document.querySelector('header');
    // 简单地添加到header的末尾，避免insertBefore的问题
    header.appendChild(navContainer);
}

// 渲染所有RSS源
function renderAllRssSources(sources) {
    const grid = document.querySelector('.rss-grid');
    grid.innerHTML = '';
    
    if (sources.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div>📰</div>
                <p>暂无RSS源，请点击上方按钮添加</p>
            </div>
        `;
        return;
    }
    
    sources.forEach(source => {
        const rssGroup = document.createElement('div');
        // 为所有RSS源添加删除按钮，不区分预设和自定义
        rssGroup.className = `rss-group ${source.isPreset ? 'preset' : ''}`;
        rssGroup.dataset.url = source.url;
        
        // 创建RSS组的HTML内容，为所有RSS源添加删除按钮
        const deleteButton = '<button class="delete-rss" title="删除RSS源">×</button>';
        
        // 创建带滑块的内容区域
        rssGroup.innerHTML = `
            <div class="rss-header">
                ${source.name}
                ${deleteButton}
            </div>
            <div class="rss-slider-container">
                <div class="rss-slider">
                    <div class="loading-item">
                        <div class="news-item-content">
                            <div class="news-title loading-placeholder">加载中...</div>
                        </div>
                    </div>
                </div>
                <div class="slider-indicator">正在加载RSS内容...</div>
            </div>
        `;
        
        grid.appendChild(rssGroup);
        
        // 异步加载RSS数据
        fetchRssData(source.url).then(newsItems => {
            // 限制最多20个新闻
            newsItems = newsItems.slice(0, 20);
            
            // 渲染新闻列表
            const slider = rssGroup.querySelector('.rss-slider');
            const indicator = rssGroup.querySelector('.slider-indicator');
            
            if (newsItems.length > 0) {
                slider.innerHTML = newsItems.map(item => `
                    <div class="news-item">
                        <div class="news-item-content">
                            <a class="news-title" href="${item.link || '#'}" target="_blank" rel="noopener noreferrer">${item.title}</a>
                            ${item.time ? `<span class="news-time">${item.time}</span>` : ''}
                        </div>
                    </div>
                `).join('');
                
                if (newsItems.length > 5) {
                    indicator.textContent = '向上滑动查看更多';
                } else {
                    indicator.textContent = '';
                }
            } else {
                slider.innerHTML = `
                    <div class="empty-item">
                        <div class="news-item-content">
                            <div class="news-title">无法加载RSS内容</div>
                        </div>
                    </div>
                `;
                indicator.textContent = '';
            }
        }).catch(error => {
            console.error(`Failed to fetch RSS data for ${source.name}:`, error);
            const slider = rssGroup.querySelector('.rss-slider');
            const indicator = rssGroup.querySelector('.slider-indicator');
            
            slider.innerHTML = `
                <div class="empty-item">
                    <div class="news-item-content">
                        <div class="news-title">加载RSS内容失败</div>
                    </div>
                </div>
            `;
            indicator.textContent = '';
        });
    });
    
    // 设置删除按钮事件
    setupDeleteButtons();
    
    // 设置滑动功能
    setupSliderFunctionality();
}

// 获取RSS数据的函数
async function fetchRssData(url) {
    try {
        // 使用RSS2JSON服务来绕过跨域限制
        const rss2jsonApi = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
        
        const response = await fetch(rss2jsonApi);
        const data = await response.json();
        
        // 检查响应是否包含items
        if (data.items && Array.isArray(data.items)) {
            return data.items.map(item => ({
                title: item.title || '无标题',
                time: formatDate(item.pubDate) || '',
                link: item.link || ''
            }));
        } else {
            throw new Error('Invalid RSS response');
        }
    } catch (error) {
        console.error('Error fetching RSS data:', error);
        
        // 如果主API失败，尝试使用另一个备选API
        try {
            const alternateApi = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            const response = await fetch(alternateApi);
            const data = await response.json();
            
            if (data.contents) {
                // 简单解析XML内容
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(data.contents, "text/xml");
                const items = xmlDoc.querySelectorAll('item, entry');
                
                if (items.length > 0) {
                    return Array.from(items).map(item => {
                        // 尝试获取标题
                        let title = '无标题';
                        const titleEl = item.querySelector('title');
                        if (titleEl && titleEl.textContent) {
                            title = titleEl.textContent;
                        }
                        
                        // 尝试获取链接
                        let link = '';
                        const linkEl = item.querySelector('link');
                        if (linkEl && linkEl.textContent) {
                            link = linkEl.textContent;
                        }
                        // 检查是否有href属性
                        if (!link && linkEl && linkEl.getAttribute('href')) {
                            link = linkEl.getAttribute('href');
                        }
                        
                        // 尝试获取发布时间
                        let pubDate = '';
                        const pubDateEl = item.querySelector('pubDate, published, updated');
                        if (pubDateEl && pubDateEl.textContent) {
                            pubDate = formatDate(pubDateEl.textContent);
                        }
                        
                        return { title, time: pubDate, link };
                    });
                }
            }
        } catch (altError) {
            console.error('Error with alternate API:', altError);
        }
        
        // 如果两个API都失败，返回空数组
        return [];
    }
}

// 格式化日期函数
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return '';
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
        console.error('Error formatting date:', e);
        return '';
    }
}

// 设置删除按钮事件
function setupDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-rss');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const rssGroup = button.closest('.rss-group');
            const url = rssGroup.dataset.url;
            
            // 获取当前存储的所有RSS源
            let currentAllSources = [];
            const localStorageKey = 'allRssSources';
            
            try {
                const storedSources = localStorage.getItem(localStorageKey);
                if (storedSources) {
                    currentAllSources = JSON.parse(storedSources);
                } else {
                    currentAllSources = [...presetRssSources, ...getSavedRssSources()];
                }
            } catch (e) {
                console.error('Failed to load RSS sources from localStorage:', e);
                currentAllSources = [...presetRssSources, ...getSavedRssSources()];
            }
            
            // 更新当前存储的所有RSS源
            const updatedAllSources = currentAllSources.filter(source => source.url !== url);
            localStorage.setItem(localStorageKey, JSON.stringify(updatedAllSources));
            
            // 从自定义源存储中移除（如果是自定义源）
            const isPreset = currentAllSources.find(source => source.url === url)?.isPreset || false;
            if (!isPreset) {
                const savedSources = getSavedRssSources();
                const updatedSavedSources = savedSources.filter(source => source.url !== url);
                saveRssSources(updatedSavedSources);
            }
            
            // 重新渲染
            // 移除导航栏相关的重新渲染
            renderAllRssSources(updatedAllSources);
            
            // 更新RSS源列表
            updateRssSourcesList();
        });
    });
}

// 设置导航栏筛选事件
function setupNavigationFilter() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const rssGroups = document.querySelectorAll('.rss-group');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有按钮的active状态
            navButtons.forEach(btn => btn.classList.remove('active'));
            // 为当前点击的按钮添加active状态
            button.classList.add('active');
            
            const filter = button.dataset.filter;
            
            // 筛选RSS组
            rssGroups.forEach(group => {
                if (filter === 'all' || group.dataset.url === filter) {
                    group.style.display = 'block';
                } else {
                    group.style.display = 'none';
                }
            });
        });
    });
}

// 渲染RSS源列表
function updateRssSourcesList() {
    const allRssList = document.getElementById('allRssList');
    
    if (!allRssList) return;
    
    // 获取保存的自定义RSS源
    const savedSources = getSavedRssSources();
    
    // 获取当前存储的所有RSS源（包括已删除的预设源）
    let currentAllSources = [];
    const localStorageKey = 'allRssSources';
    
    try {
        const storedSources = localStorage.getItem(localStorageKey);
        if (storedSources) {
            currentAllSources = JSON.parse(storedSources);
        } else {
            // 初始化存储，包含所有预设源和自定义源
            currentAllSources = [...presetRssSources, ...savedSources];
            localStorage.setItem(localStorageKey, JSON.stringify(currentAllSources));
        }
    } catch (e) {
        console.error('Failed to load RSS sources from localStorage:', e);
        currentAllSources = [...presetRssSources, ...savedSources];
    }
    
    if (currentAllSources.length === 0) {
        allRssList.innerHTML = '<div class="empty-list">暂无RSS源</div>';
    } else {
        allRssList.innerHTML = currentAllSources.map(source => {
            const isPreset = source.isPreset || presetRssSources.some(preset => preset.url === source.url);
            return `
                <div class="rss-source-item ${isPreset ? 'preset' : ''}">
                    <div class="rss-source-info">
                        <div class="rss-source-name">
                            ${source.name}
                            ${isPreset ? '<span class="preset-tag">预设</span>' : ''}
                        </div>
                        <div class="rss-source-url">${source.url}</div>
                    </div>
                    <button class="delete-source-btn" data-url="${source.url}" data-is-preset="${isPreset}">删除</button>
                </div>
            `;
        }).join('');
        
        // 添加删除按钮事件
        const deleteButtons = allRssList.querySelectorAll('.delete-source-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const url = button.dataset.url;
                const isPreset = button.dataset.isPreset === 'true';
                
                // 更新当前存储的所有RSS源
                const updatedAllSources = currentAllSources.filter(source => source.url !== url);
                localStorage.setItem(localStorageKey, JSON.stringify(updatedAllSources));
                
                // 如果是自定义源，也从自定义源存储中移除
                if (!isPreset) {
                    const updatedSavedSources = savedSources.filter(source => source.url !== url);
                    saveRssSources(updatedSavedSources);
                }
                
                // 重新渲染
                // 移除导航栏相关的重新渲染
                renderAllRssSources(updatedAllSources);
                updateRssSourcesList();
            });
        });
    }
}

// 设置模态框事件
function setupModalEvents() {
    const modal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const closeBtn = document.getElementsByClassName('close')[0];
    const saveBtn = document.getElementById('saveRssBtn');
    const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
    
    // 打开模态框
    settingsBtn.addEventListener('click', () => {
        // 更新RSS源列表
        updateRssSourcesList();
        // 显示模态框
        modal.style.display = 'block';
    });
    
    // 刷新RSS数据
    refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('refreshing');
        refreshAllRss().then(() => {
            setTimeout(() => {
                refreshBtn.classList.remove('refreshing');
            }, 500);
        }).catch(() => {
            refreshBtn.classList.remove('refreshing');
        });
    });
    
    // 关闭模态框
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // 保存新的RSS源
        saveBtn.addEventListener('click', () => {
            const name = document.getElementById('rssName').value.trim();
            const url = document.getElementById('rssUrl').value.trim();
            
            if (!name || !url) {
                alert('请输入RSS源名称和URL');
                return;
            }
            
            // 验证URL格式
            try {
                new URL(url);
            } catch (e) {
                alert('请输入有效的URL格式');
                return;
            }
            
            // 获取当前存储的所有RSS源
            let allRssSources = [];
            const localStorageKey = 'allRssSources';
            
            try {
                const storedSources = localStorage.getItem(localStorageKey);
                if (storedSources) {
                    allRssSources = JSON.parse(storedSources);
                }
            } catch (e) {
                console.error('Failed to load RSS sources from localStorage:', e);
            }
            
            // 检查是否已存在
            const exists = allRssSources.some(source => source.url === url);
            if (exists) {
                alert('该RSS源已存在');
                return;
            }
            
            // 添加到自定义源存储
            const savedSources = getSavedRssSources();
            const newSource = { name, url, isPreset: false };
            savedSources.push(newSource);
            saveRssSources(savedSources);
            
            // 添加到所有源存储
            if (allRssSources.length === 0) {
                allRssSources = [...presetRssSources, newSource];
            } else {
                allRssSources.push(newSource);
            }
            localStorage.setItem(localStorageKey, JSON.stringify(allRssSources));
            
            // 重新渲染
            renderAllRssSources(allRssSources);
            
            // 更新RSS源列表
            updateRssSourcesList();
            
            // 清空输入
            document.getElementById('rssName').value = '';
            document.getElementById('rssUrl').value = '';
            
            // 显示成功提示
            alert('RSS源添加成功！');
        });
    
    // 恢复默认设置
        resetDefaultsBtn.addEventListener('click', () => {
            if (confirm('确定要恢复默认设置吗？这将删除所有已添加和已删除的RSS源，恢复到原始预设列表。')) {
                // 清除本地存储中的自定义RSS源和所有RSS源
                localStorage.removeItem('customRssSources');
                localStorage.removeItem('allRssSources');
                
                // 重新渲染
                renderAllRssSources(presetRssSources);
                
                // 更新RSS源列表
                updateRssSourcesList();
                
                alert('已恢复默认设置！');
            }
        });
}

// 刷新所有RSS源数据
async function refreshAllRss() {
    // 获取当前存储的所有RSS源
    let allRssSources = [];
    const localStorageKey = 'allRssSources';
    
    try {
        const storedSources = localStorage.getItem(localStorageKey);
        if (storedSources) {
            allRssSources = JSON.parse(storedSources);
        } else {
            // 初始化存储，包含所有预设源和自定义源
            allRssSources = [...presetRssSources, ...getSavedRssSources()];
            localStorage.setItem(localStorageKey, JSON.stringify(allRssSources));
        }
    } catch (e) {
        console.error('Failed to load RSS sources from localStorage:', e);
        allRssSources = [...presetRssSources, ...getSavedRssSources()];
    }
    
    // 移除旧的导航栏（如果存在）
    const oldNav = document.querySelector('.rss-navigation');
    if (oldNav) {
        oldNav.remove();
    }
    
    renderAllRssSources(allRssSources);
}

// 设置滑动功能
function setupSliderFunctionality() {
    const sliders = document.querySelectorAll('.rss-slider');
    
    sliders.forEach(slider => {
        // 记录初始触摸位置和滚动位置
        let startY = 0;
        let startScrollY = 0;
        
        // 触摸开始事件
        slider.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            startScrollY = slider.scrollTop;
        });
        
        // 触摸移动事件
        slider.addEventListener('touchmove', (e) => {
            const currentY = e.touches[0].clientY;
            const diff = startY - currentY;
            slider.scrollTop = startScrollY + diff;
        });
        
        // 鼠标滚轮事件（桌面端支持）
        slider.addEventListener('wheel', (e) => {
            e.preventDefault();
            slider.scrollTop += e.deltaY;
        });
    });
}

// 添加键盘快捷键支持
document.addEventListener('keydown', (e) => {
    // Ctrl+R 刷新所有RSS源
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        refreshAllRss();
    }
    
    // Esc 关闭模态框
    if (e.key === 'Escape') {
        const modal = document.getElementById('settingsModal');
        if (modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    }
});