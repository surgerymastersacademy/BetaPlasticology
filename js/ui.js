// js/ui.js (FINAL VERSION - Dashboard Logic)

import * as dom from './dom.js';
import { appState } from './state.js';
import { applyRolePermissions } from './features/userProfile.js';

/**
 * Handles screen switching and Dashboard/Login layout toggling.
 */
export function showScreen(screenToShow, isGuest = false) {
    if (!screenToShow) return;

    // 1. Close all modals
    const modals = [
        dom.confirmationModal, dom.questionNavigatorModal, dom.imageViewerModal, 
        dom.noteModal, dom.clearLogModal, dom.announcementsModal, 
        dom.userCardModal, dom.messengerModal, dom.osceNavigatorModal, 
        dom.createPlanModal
    ];
    modals.forEach(modal => {
        if (modal && !modal.classList.contains('hidden')) modal.classList.add('hidden');
    });
    if (dom.modalBackdrop) dom.modalBackdrop.classList.add('hidden');

    // 2. Handle Login vs App Layout
    if (screenToShow === dom.loginContainer) {
        if (dom.appLayout) dom.appLayout.classList.add('hidden');
        if (dom.loginWrapper) dom.loginWrapper.classList.remove('hidden');
        // Reset Hash
        history.replaceState(null, null, ' ');
        return; 
    } else {
        if (dom.loginWrapper) dom.loginWrapper.classList.add('hidden');
        if (dom.appLayout) dom.appLayout.classList.remove('hidden');
    }

    // 3. Hide all internal content containers
    const contentScreens = [
        dom.mainMenuContainer, 
        dom.lecturesContainer, 
        dom.qbankContainer, 
        dom.listContainer, 
        dom.quizContainer, 
        dom.activityLogContainer, 
        dom.notesContainer, 
        dom.libraryContainer, 
        dom.leaderboardContainer, 
        dom.osceContainer, 
        dom.osceQuizContainer, 
        dom.learningModeContainer, 
        dom.studyPlannerContainer, 
        dom.theoryContainer,
        dom.matchingContainer
    ];
    
    contentScreens.forEach(screen => {
        if (screen) screen.classList.add('hidden');
    });

    // 4. Show the requested screen
    screenToShow.classList.remove('hidden');

    // 5. Update URL Hash & Sidebar Active State
    const screenId = screenToShow.id;
    let newHash = '';
    
    // Map screens to sidebar button IDs for highlighting
    const navMap = {
        'main-menu-container': 'global-home-btn',
        'lectures-container': 'lectures-btn',
        'qbank-container': 'qbank-btn',
        'learning-mode-container': 'learning-mode-btn',
        'theory-container': 'theory-btn',
        'osce-container': 'osce-btn',
        'matching-container': 'matching-btn',
        'study-planner-container': 'study-planner-btn',
        'library-container': 'library-btn',
        'leaderboard-container': 'leaderboard-btn',
        'messenger-modal': 'messenger-btn' // Messenger is a modal but linked in nav
    };

    updateActiveNav(navMap[screenId]);

    // Set Hash
    switch (screenId) {
        case 'main-menu-container': newHash = 'home'; break;
        case 'lectures-container': newHash = 'lectures'; break;
        case 'qbank-container': newHash = 'qbank'; break;
        case 'osce-container': newHash = 'osce'; break;
        case 'theory-container': newHash = 'theory'; break;
        case 'library-container': newHash = 'library'; break;
        case 'study-planner-container': newHash = 'planner'; break;
        case 'leaderboard-container': newHash = 'leaderboard'; break;
        case 'activity-log-container': newHash = 'activity'; break;
        case 'notes-container': newHash = 'notes'; break;
        case 'quiz-container': newHash = 'quiz'; break; 
        case 'learning-mode-container': newHash = 'learning'; break;
        case 'matching-container': newHash = 'matching'; break;
    }

    if (newHash && window.location.hash !== `#${newHash}`) {
        window.location.hash = newHash; 
    }

    // 6. Header & Permission Logic
    const watermarkOverlay = document.getElementById('watermark-overlay');
    if (!isGuest) {
        if (watermarkOverlay) watermarkOverlay.classList.remove('hidden');
        if (dom.userNameDisplay) dom.userNameDisplay.classList.remove('hidden');
        applyRolePermissions();
    } else {
        if (watermarkOverlay) watermarkOverlay.classList.add('hidden');
    }
}

function updateActiveNav(activeBtnId) {
    // Remove 'active' class from all sidebar links
    const allLinks = document.querySelectorAll('.sidebar-link');
    allLinks.forEach(link => {
        link.classList.remove('active', 'bg-slate-700', 'text-white');
        link.classList.add('text-slate-300');
    });

    // Remove 'active-nav-link' from bottom nav
    const bottomLinks = document.querySelectorAll('#bottom-nav button');
    bottomLinks.forEach(btn => {
        btn.classList.remove('active-nav-link', 'text-blue-600');
        btn.classList.add('text-slate-400');
    });

    if (activeBtnId) {
        // Update Sidebar
        const sidebarBtn = document.getElementById(activeBtnId);
        if (sidebarBtn && sidebarBtn.classList.contains('sidebar-link')) {
            sidebarBtn.classList.add('active', 'bg-slate-700', 'text-white');
            sidebarBtn.classList.remove('text-slate-300');
        }

        // Update Bottom Nav (Match by checking onclick attribute or similar, simplified here)
        // Since bottom nav uses same IDs in onclick logic, we highlight based on index or similar logic
        // For simplicity, we check if the button click target matches
    }
}

// --- Modal & Helper Functions ---

export function showConfirmationModal(title, text, onConfirm) {
    if (!dom.confirmationModal) return;
    appState.modalConfirmAction = onConfirm;
    const titleEl = dom.confirmationModal.querySelector('#modal-title');
    const textEl = dom.confirmationModal.querySelector('#modal-text');
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    dom.confirmationModal.classList.remove('hidden');
    if (dom.modalBackdrop) dom.modalBackdrop.classList.remove('hidden');
}

export function showImageModal(src) {
    if (!dom.imageViewerModal || !dom.modalImage) return;
    if (dom.modalBackdrop) dom.modalBackdrop.classList.remove('hidden');
    dom.imageViewerModal.classList.remove('hidden');
    dom.modalImage.src = src;
}

export function renderBooks() {
    if (!dom.libraryList) return;
    dom.libraryList.innerHTML = '';
    if (!appState.mcqBooks || appState.mcqBooks.length === 0) {
        dom.libraryList.innerHTML = `<p class="text-center text-slate-500">No books found in the library.</p>`;
        return;
    }
    appState.mcqBooks.forEach(book => {
        if (!book.Book || !book.Link) return;
        const bookElement = document.createElement('a');
        bookElement.href = book.Link;
        bookElement.target = '_blank';
        bookElement.className = 'flex items-start p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200';
        
        let iconHtml;
        if (book.icon && (book.icon.startsWith('http://') || book.icon.startsWith('https://'))) {
            iconHtml = `<img src="${book.icon}" alt="${book.Book}" class="w-12 h-12 rounded-lg object-cover mr-4 bg-slate-100">`;
        } else {
            iconHtml = `<div class="w-12 h-12 flex items-center justify-center bg-orange-100 rounded-lg mr-4 text-orange-600 text-xl"><i class="${book.icon || 'fas fa-book'}"></i></div>`;
        }
        
        bookElement.innerHTML = `
            ${iconHtml}
            <div class="flex-1">
                <h3 class="font-bold text-slate-800 text-base">${book.Book}</h3>
                <p class="text-slate-500 text-xs mt-1 line-clamp-2">${book.Description || 'No description available.'}</p>
            </div>
            <i class="fas fa-external-link-alt text-slate-300 ml-2"></i>
        `;
        dom.libraryList.appendChild(bookElement);
    });
}

export function renderLeaderboard(top10, currentUserRank) {
    if (!dom.leaderboardList || !dom.currentUserRankDiv) return;
    dom.leaderboardList.innerHTML = '';
    dom.currentUserRankDiv.innerHTML = '';
    
    if (currentUserRank) {
        dom.currentUserRankDiv.innerHTML = `
            <div class="p-4 bg-blue-600 text-white rounded-xl shadow-lg mb-6 flex items-center justify-between">
                <div>
                    <p class="text-blue-200 text-xs font-bold uppercase tracking-wider">Your Rank</p>
                    <div class="flex items-center mt-1">
                        <span class="text-3xl font-bold mr-3">#${currentUserRank.rank}</span>
                        <span class="font-medium">${currentUserRank.name} (You)</span>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold">${currentUserRank.score}</p>
                    <p class="text-blue-200 text-xs">Points</p>
                </div>
            </div>`;
    }
    
    if (!top10 || top10.length === 0) {
        dom.leaderboardList.innerHTML = `<div class="text-center p-8 text-slate-400"><i class="fas fa-trophy text-4xl mb-2 opacity-20"></i><p>Leaderboard is empty.</p></div>`;
        return;
    }

    top10.forEach((user, index) => {
        const rank = user.rank;
        let rankBadge = `<span class="font-bold text-slate-500 w-8 text-center">#${rank}</span>`;
        let rowClass = "bg-white border border-slate-100";
        
        if (rank === 1) { 
            rankBadge = `<div class="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center"><i class="fas fa-crown"></i></div>`;
            rowClass = "bg-gradient-to-r from-yellow-50 to-white border-yellow-200";
        } else if (rank === 2) {
            rankBadge = `<div class="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center"><i class="fas fa-medal"></i></div>`;
        } else if (rank === 3) {
            rankBadge = `<div class="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center"><i class="fas fa-medal"></i></div>`;
        }

        const userElement = document.createElement('div');
        userElement.className = `flex items-center p-4 rounded-xl mb-3 shadow-sm ${rowClass}`;
        userElement.innerHTML = `
            <div class="mr-4">${rankBadge}</div>
            <div class="flex-1">
                <p class="font-bold text-slate-800">${user.name}</p>
            </div>
            <div class="font-mono font-bold text-blue-600">${user.score}</div>
        `;
        dom.leaderboardList.appendChild(userElement);
    });
}

export function updateWatermark() {
    const user = appState.currentUser;
    const watermarkOverlay = document.getElementById('watermark-overlay');
    if (!watermarkOverlay) return;
    if (!user || user.Role === 'Guest') { watermarkOverlay.classList.add('hidden'); return; }
    
    const date = new Date().toLocaleDateString('en-GB');
    watermarkOverlay.innerHTML = `
        <div class="fixed bottom-4 right-4 opacity-30 pointer-events-none flex flex-col items-end text-slate-900 z-50">
             <img src="https://pub-fb0d46cb77cb4e22b5863540fe118da4.r2.dev/Plasticology%202025%20Logo%20white%20outline.png" class="h-8 mb-1 invert">
             <span class="text-[10px] font-bold uppercase tracking-widest">${user.Name}</span>
             <span class="text-[10px]">${date}</span>
        </div>
    `;
}

export function displayAnnouncement() {
    const banner = document.getElementById('announcement-banner');
    if (!banner) return;
    if (!appState.allAnnouncements || !appState.allAnnouncements.length) { banner.classList.add('hidden'); return; }
    
    const latestAnnouncement = appState.allAnnouncements[0];
    const seenAnnouncementId = localStorage.getItem('seenAnnouncementId');
    if (seenAnnouncementId === latestAnnouncement.UniqueID) { banner.classList.add('hidden'); return; }
    
    banner.innerHTML = `
        <div class="bg-indigo-600 text-white p-4 rounded-xl shadow-lg flex items-start gap-3 relative overflow-hidden">
            <div class="bg-white/20 p-2 rounded-lg"><i class="fas fa-bullhorn"></i></div>
            <div class="flex-1 z-10">
                <h4 class="font-bold text-sm uppercase tracking-wide text-indigo-200">New Update</h4>
                <p class="text-sm font-medium mt-1">${latestAnnouncement.UpdateMessage}</p>
            </div>
            <button id="close-announcement-btn" class="text-indigo-200 hover:text-white"><i class="fas fa-times"></i></button>
        </div>
    `;
    banner.classList.remove('hidden');
    
    const closeBtn = document.getElementById('close-announcement-btn');
    if(closeBtn) { 
        closeBtn.addEventListener('click', () => { 
            banner.classList.add('hidden'); 
            localStorage.setItem('seenAnnouncementId', latestAnnouncement.UniqueID); 
        }); 
    }
}

export function showAnnouncementsModal() {
    if (!dom.announcementsList || !dom.announcementsModal) return;
    dom.announcementsList.innerHTML = '';
    
    if (!appState.allAnnouncements || appState.allAnnouncements.length === 0) {
        dom.announcementsList.innerHTML = `<p class="text-center text-slate-500 py-8">All caught up! No new announcements.</p>`;
    } else {
        appState.allAnnouncements.forEach(ann => {
            const annItem = document.createElement('div');
            annItem.className = 'p-4 bg-slate-50 rounded-lg border border-slate-100 mb-3';
            const date = new Date(ann.TimeStamp).toLocaleDateString('en-GB');
            annItem.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">UPDATE</span>
                    <span class="text-xs text-slate-400">${date}</span>
                </div>
                <p class="text-slate-700 text-sm leading-relaxed">${ann.UpdateMessage}</p>
            `;
            dom.announcementsList.appendChild(annItem);
        });
    }
    if (dom.modalBackdrop) dom.modalBackdrop.classList.remove('hidden');
    dom.announcementsModal.classList.remove('hidden');
}

export function populateFilterOptions(containerElement, items, inputNamePrefix, counts) {
    if (!containerElement) return;
    containerElement.innerHTML = '';
    if (!items || items.length === 0) { containerElement.innerHTML = `<p class="text-slate-400 text-xs p-2">No options available.</p>`; return; }
    
    items.forEach(item => {
        if (!item) return;
        const div = document.createElement('label');
        div.className = 'flex items-center p-2 hover:bg-slate-100 rounded cursor-pointer transition-colors';
        const safeId = `${inputNamePrefix}-${item.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const count = counts ? (counts[item] || 0) : 0;
        
        div.innerHTML = `
            <input id="${safeId}" name="${inputNamePrefix}" value="${item}" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
            <span class="ml-2 text-sm text-slate-700 font-medium flex-1 truncate">${item}</span>
            ${count > 0 ? `<span class="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded ml-2">${count}</span>` : ''}
        `;
        containerElement.appendChild(div);
    });
}

export function formatTime(seconds) {
    if (isNaN(seconds) || seconds === null || seconds === undefined) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}
