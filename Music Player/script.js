let musicLibrary = [];
let currentTrackIndex = -1;
let audioElement;
let playlists = {};
let currentTab = 'player';

function setupAudioElement() {
    audioElement = new Audio();
    audioElement.addEventListener('ended', playNextTrack);
    audioElement.addEventListener('timeupdate', updateSeekBar);
    audioElement.addEventListener('loadedmetadata', () => {
        document.getElementById('duration').textContent = formatTime(audioElement.duration);
    });

    document.getElementById('seekBar').addEventListener('input', seekTrack);
}

function updateSeekBar() {
    const seekBar = document.getElementById('seekBar');
    const currentTimeSpan = document.getElementById('currentTime');
    
    seekBar.value = (audioElement.currentTime / audioElement.duration) * 100 || 0;
    currentTimeSpan.textContent = formatTime(audioElement.currentTime);
}

function seekTrack() {
    const seekBar = document.getElementById('seekBar');
    audioElement.currentTime = (seekBar.value / 100) * audioElement.duration;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function handleKeyboardControls(event) {
    if (document.activeElement.tagName !== 'INPUT') {
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                togglePlayStop();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                playPreviousTrack();
                break;
            case 'ArrowRight':
                event.preventDefault();
                playNextTrack();
                break;
            case 'ArrowUp':
                event.preventDefault();
                playNextTrack();
                break;
            case 'ArrowDown':
                event.preventDefault();
                playPreviousTrack();
                break;
            case 'Enter':
                event.preventDefault();
                triggerFileInput();
                break;
            case 'Backspace':
                event.preventDefault();
                if (currentTrackIndex !== -1) {
                    removeTrack(currentTrackIndex);
                }
                break;
            case 'Tab':
                event.preventDefault();
                switchToNextTab();
                break;
            case 'KeyM':
                event.preventDefault();
                toggleMute();
                break;
            case 'KeyS':
                event.preventDefault();
                toggleShuffle();
                break;
            case 'KeyR':
                event.preventDefault();
                toggleRepeat();
                break;
            case 'KeyP':
                event.preventDefault();
                switchTab('playlists');
                break;
            case 'Escape':
                event.preventDefault();
                switchTab('player');
                break;
        }
    }
}

function togglePlayStop() {
    if (audioElement.paused) {
        audioElement.play();
        updatePlayPauseButton(true);
        document.querySelector('.player').classList.add('expanded');
    } else {
        audioElement.pause();
        updatePlayPauseButton(false);
        document.querySelector('.player').classList.remove('expanded');
    }
}

function updatePlayPauseButton(isPlaying) {
    const playPauseBtn = document.getElementById('playPauseBtn');
    playPauseBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
}

function playNextTrack() {
    if (musicLibrary.length > 0) {
        currentTrackIndex = (currentTrackIndex + 1) % musicLibrary.length;
        loadAndPlayTrack(musicLibrary[currentTrackIndex]);
    }
}

function playPreviousTrack() {
    if (musicLibrary.length > 0) {
        currentTrackIndex = (currentTrackIndex - 1 + musicLibrary.length) % musicLibrary.length;
        loadAndPlayTrack(musicLibrary[currentTrackIndex]);
    }
}

function loadAndPlayTrack(track) {
    audioElement.src = URL.createObjectURL(track.file);
    audioElement.play();
    updatePlayPauseButton(true);
    updateNowPlaying(track.name);
    updateTrackList();
}

function updateNowPlaying(trackName) {
    document.getElementById('nowPlaying').textContent = trackName;
}

function setupUploadButton() {
    const uploadButton = document.getElementById('uploadButton');
    uploadButton.addEventListener('click', triggerFileInput);
}

function triggerFileInput() {
    document.getElementById('fileInput').click();
}

function handleFileUpload(event) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('audio/')) {
            const track = {
                name: file.name,
                file: file
            };
            musicLibrary.push(track);
        }
    }
    updateTrackList();
}

function updateTrackList() {
    const trackListElement = document.getElementById('trackList');
    trackListElement.innerHTML = '';
    musicLibrary.forEach((track, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="track-name">${track.name}</span>
            <button class="remove-button" aria-label="Remove track">×</button>
        `;
        li.querySelector('.track-name').onclick = () => playTrack(index);
        li.querySelector('.remove-button').onclick = (e) => {
            e.stopPropagation();
            removeTrack(index);
        };
        if (index === currentTrackIndex) {
            li.classList.add('current-track');
        }
        trackListElement.appendChild(li);
    });
}

function removeTrack(index) {
    musicLibrary.splice(index, 1);
    if (currentTrackIndex === index) {
        // If the current track is removed, stop playback
        audioElement.pause();
        currentTrackIndex = -1;
    } else if (currentTrackIndex > index) {
        // Adjust currentTrackIndex if a track before it was removed
        currentTrackIndex--;
    }
    updateTrackList();
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
}

function switchToNextTab() {
    const tabs = ['player', 'playlists'];
    const currentIndex = tabs.indexOf(currentTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    switchTab(tabs[nextIndex]);
}

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.style.display = 'none');
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).style.display = 'block';
    
    currentTab = tabName;
}

function setupPlaylistManagement() {
    document.getElementById('savePlaylist').addEventListener('click', savePlaylist);
}

function savePlaylist() {
    const playlistName = document.getElementById('playlistName').value.trim();
    if (playlistName && musicLibrary.length > 0) {
        playlists[playlistName] = [...musicLibrary];
        updatePlaylistList();
        document.getElementById('playlistName').value = '';
        alert(`Playlist "${playlistName}" saved!`);
    } else {
        alert('Please enter a playlist name and ensure there are tracks in the library.');
    }
}

function updatePlaylistList() {
    const playlistList = document.getElementById('playlistList');
    playlistList.innerHTML = '';
    for (const [name, tracks] of Object.entries(playlists)) {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="playlist-name">${name} (${tracks.length} tracks)</span>
            <div class="playlist-buttons">
                <button class="load-playlist">Load</button>
                <button class="delete-playlist">Delete</button>
            </div>
        `;
        li.querySelector('.load-playlist').addEventListener('click', () => loadPlaylist(name));
        li.querySelector('.delete-playlist').addEventListener('click', () => deletePlaylist(name));
        playlistList.appendChild(li);
    }
}

function loadPlaylist(name) {
    if (confirm(`Load playlist "${name}"? This will replace your current tracklist.`)) {
        musicLibrary = [...playlists[name]];
        currentTrackIndex = -1;
        updateTrackList();
        switchTab('player');
    }
}

function deletePlaylist(name) {
    if (confirm(`Are you sure you want to delete playlist "${name}"?`)) {
        delete playlists[name];
        updatePlaylistList();
    }
}

function toggleMute() {
    audioElement.muted = !audioElement.muted;
    // Update UI to reflect mute state
}

function toggleShuffle() {
    // Implement shuffle functionality
}

function toggleRepeat() {
    // Implement repeat functionality
}

// Add this to your initialization code
document.addEventListener('DOMContentLoaded', () => {
    setupAudioElement();
    setupUploadButton();
    setupPlaylistManagement();
    setupTabs();
    document.addEventListener('keydown', handleKeyboardControls);
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('playPauseBtn').addEventListener('click', togglePlayStop);
});