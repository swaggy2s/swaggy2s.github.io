// 获取DOM元素
const musicPlayer = document.getElementById('music-player');
const playPauseBtn = document.getElementById('play-pause');
const progressBar = document.querySelector('.progress');
const progressContainer = document.querySelector('.progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const lyricItems = document.querySelectorAll('.lyric-item');

// 文字时间点配置（根据音乐时间同步显示文字）
const lyricTimings = [
    { time: 0, index: 0 },    // 开始时显示第一句
    { time: 5, index: 1 },    // 5秒时显示第二句
    { time: 10, index: 2 },   // 10秒时显示第三句
    { time: 15, index: 3 },   // 15秒时显示第四句
    { time: 20, index: 4 }    // 20秒时显示第五句
];

let isPlaying = true;
let updateInterval;

// 格式化时间函数
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// 更新进度条和时间显示
function updateProgress() {
    const { duration, currentTime } = musicPlayer;
    
    if (duration) {
        // 更新进度条
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        
        // 更新时间显示
        currentTimeEl.textContent = formatTime(currentTime);
        if (totalTimeEl) {
            totalTimeEl.textContent = formatTime(duration);
        }
        
        // 更新歌词显示
        // updateLyrics(currentTime);
        
        // 为进度条添加脉冲效果
        if (isPlaying) {
            progressBar.classList.add('pulse-effect');
            setTimeout(() => progressBar.classList.remove('pulse-effect'), 300);
        }
    }
}

// 更新歌词/文字显示
function updateLyrics(currentTime) {
    // 找到当前应该显示的歌词索引
    let currentLyricIndex = 0;
    for (let i = lyricTimings.length - 1; i >= 0; i--) {
        if (currentTime >= lyricTimings[i].time) {
            currentLyricIndex = lyricTimings[i].index;
            break;
        }
    }
    
    // 更新歌词高亮显示
    lyricItems.forEach((item, index) => {
        if (index === currentLyricIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 由于隐藏了滚动条，移除滚动相关代码
}

// 切换播放/暂停状态
function togglePlayPause() {
    if (isPlaying) {
        musicPlayer.pause();
        playPauseBtn.textContent = '播放';
        playPauseBtn.classList.add('paused');
        playPauseBtn.classList.remove('playing');
        clearInterval(updateInterval);
    } else {
        musicPlayer.play().catch(error => {
            console.error('播放失败:', error);
            // 处理浏览器自动播放限制
            showNotification('请点击页面后再尝试播放音乐');
            playPauseBtn.textContent = '播放';
            playPauseBtn.classList.add('paused');
            playPauseBtn.classList.remove('playing');
            isPlaying = false;
            return;
        });
        playPauseBtn.textContent = '暂停';
        playPauseBtn.classList.remove('paused');
        playPauseBtn.classList.add('playing');
        // 开始更新进度条
        updateInterval = setInterval(updateProgress, 1000);
    }
    isPlaying = !isPlaying;
    
    // 添加按钮动画效果
    playPauseBtn.classList.add('active');
    setTimeout(() => playPauseBtn.classList.remove('active'), 200);
}

// 设置音乐播放位置
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = musicPlayer.duration;
    
    musicPlayer.currentTime = (clickX / width) * duration;
    updateProgress();
}

// 音乐元数据加载完成后更新总时长
function onMetadataLoaded() {
    if (totalTimeEl) {
        totalTimeEl.textContent = formatTime(musicPlayer.duration);
    }
}

// 页面加载时的初始化
function init() {
    // 设置事件监听器
    playPauseBtn.addEventListener('click', togglePlayPause);
    progressContainer.addEventListener('click', setProgress);
    musicPlayer.addEventListener('loadedmetadata', onMetadataLoaded);
    musicPlayer.addEventListener('ended', () => {
        playPauseBtn.textContent = '播放';
        isPlaying = false;
        clearInterval(updateInterval);
    });
    
    // 尝试自动播放音乐
    musicPlayer.play().catch(error => {
        console.warn('自动播放被阻止，需要用户交互:', error);
        playPauseBtn.textContent = '播放';
        isPlaying = false;
        clearInterval(updateInterval);
    });
    
    // 初始化进度条更新
    if (isPlaying) {
        updateInterval = setInterval(updateProgress, 1000);
    }
    
    // 添加触摸事件支持（移动端）
    progressContainer.addEventListener('touchstart', handleTouchProgress, { passive: true });
}

// 处理移动端触摸进度条
function handleTouchProgress(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.getBoundingClientRect();
    const clickX = touch.clientX - rect.left;
    const width = rect.width;
    const duration = musicPlayer.duration;
    
    if (duration) {
        musicPlayer.currentTime = (clickX / width) * duration;
        updateProgress();
        
        // 添加触摸反馈效果
        this.classList.add('touch-active');
        setTimeout(() => this.classList.remove('touch-active'), 200);
    }
}

// 添加用户交互事件，用于处理浏览器自动播放策略
function setupUserInteraction() {
    document.addEventListener('click', userInteracted, { once: true });
    document.addEventListener('touchstart', userInteracted, { once: true });
    document.addEventListener('keydown', userInteracted, { once: true });
    
    // 添加键盘快捷键支持
    document.addEventListener('keydown', handleKeydown);
}

// 处理键盘快捷键
function handleKeydown(e) {
    // 空格键：播放/暂停
    if (e.code === 'Space' && !e.target.closest('input, textarea')) {
        e.preventDefault();
        togglePlayPause();
    }
    
    // 左右箭头：快进/快退
    if (e.code === 'ArrowRight') {
        e.preventDefault();
        musicPlayer.currentTime = Math.min(musicPlayer.currentTime + 10, musicPlayer.duration);
        updateProgress();
    }
    
    if (e.code === 'ArrowLeft') {
        e.preventDefault();
        musicPlayer.currentTime = Math.max(musicPlayer.currentTime - 10, 0);
        updateProgress();
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    // 检查是否已存在通知元素
    let notification = document.querySelector('.notification');
    if (notification) {
        document.body.removeChild(notification);
    }
    
    // 创建通知元素
    notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 淡入动画
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 自动关闭
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 用户交互处理函数
function userInteracted() {
    // 尝试播放音乐
    if (!isPlaying) {
        musicPlayer.play().then(() => {
            playPauseBtn.textContent = '暂停';
            isPlaying = true;
            updateInterval = setInterval(updateProgress, 1000);
        }).catch(error => {
            console.error('播放失败:', error);
        });
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    init();
    setupUserInteraction();
    
    // 添加页面可见性变化监听
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 添加强制触摸事件（针对某些移动设备）
    if ('ontouchstart' in window) {
        document.addEventListener('touchstart', handleForceTouchEvents, { passive: true });
    }
});

// 处理页面可见性变化
function handleVisibilityChange() {
    if (document.hidden && isPlaying) {
        // 页面不可见时暂停播放
        musicPlayer.pause();
        playPauseBtn.textContent = '播放';
        playPauseBtn.classList.add('paused');
        playPauseBtn.classList.remove('playing');
        clearInterval(updateInterval);
        isPlaying = false;
    }
}

// 处理强制触摸事件
function handleForceTouchEvents(e) {
    // 这是一个空函数，仅用于触发用户交互
}

// 窗口大小变化时重新调整布局
window.addEventListener('resize', () => {
    // 窗口大小变化时的处理逻辑
});

// 添加错误处理
musicPlayer.addEventListener('error', (e) => {
    console.error('音频播放错误:', e);
    showNotification('音乐加载失败，请检查文件路径', 'error');
    playPauseBtn.textContent = '播放';
    playPauseBtn.classList.add('paused');
    playPauseBtn.classList.remove('playing');
    isPlaying = false;
});

// 添加页面离开提示
window.addEventListener('beforeunload', (e) => {
    if (isPlaying) {
        // 不显示提示，但停止播放
        musicPlayer.pause();
    }
});