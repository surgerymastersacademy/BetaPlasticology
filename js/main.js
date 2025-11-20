// js/main.js (FINAL FULL VERSION - FIXED SETTINGS & PLANNER)

import { appState } from './state.js';
import * as dom from './dom.js';
import * as ui from './ui.js';
import * as utils from './utils.js';
import { fetchContentData, logTheoryActivity } from './api.js';
import { handleLogin, handleLogout, showUserCardModal, handleSaveProfile, showMessengerModal, handleSendMessageBtn, checkPermission, toggleProfileEditMode } from './features/userProfile.js';
import {
    handleMockExamStart, handleStartSimulation, triggerEndQuiz, handleNextQuestion, handlePreviousQuestion, startSearchedQuiz, handleQBankSearch, updateChapterFilter, startFreeTest, startIncorrectQuestionsQuiz, startBookmarkedQuestionsQuiz,
    toggleBookmark, toggleFlag, showHint, showQuestionNavigator, startQuizBrowse, restartCurrentQuiz, reviewIncorrectAnswers, startSimulationReview
} from './features/quiz.js';
import { renderLectures, fetchAndShowLastActivity } from './features/lectures.js';
import { startOsceSlayer, startCustomOsce, endOsceQuiz, handleOsceNext, handleOscePrevious, showOsceNavigator } from './features/osce.js';
import { showStudyPlannerScreen, handleCreatePlan } from './features/planner.js';
import { showLearningModeBrowseScreen, handleLearningSearch, handleLearningNext, handleLearningPrevious, startLearningBrowse, startLearningMistakes, startLearningBookmarked } from './features/learningMode.js';
import { showActivityLog, renderFilteredLog } from './features/activityLog.js';
import { showNotesScreen, renderNotes, handleSaveNote } from './features/notes.js';
import { showLeaderboardScreen } from './features/leaderboard.js';
import { showTheoryMenuScreen } from './features/theory.js';
import { showRegistrationModal, hideRegistrationModal, handleRegistrationSubmit } from './features/registration.js';
import { showMatchingMenu, handleStartMatchingExam, checkCurrentSetAnswers, handleNextMatchingSet } from './features/matching.js';
import { checkAndTriggerOnboarding, startTour, nextTourStep, endTour } from './features/onboarding.js';

// --- Helper: Safe Event Listener ---
function safeListen(element, event, handler) {
    if (element) {
        element.addEventListener(event, handler);
    }
}

// --- Main Menu (Dashboard) ---
export function showMainMenuScreen() {
    ui.showScreen(dom.mainMenuContainer);
    appState.navigationHistory = [showMainMenuScreen];
    ui.displayAnnouncement();
    
    // Load Dashboard Stats (Last Activity)
    fetchAndShowLastActivity();
    
    // Check for Tour
    setTimeout(() => {
        checkAndTriggerOnboarding();
    }, 1000);
}

// --- Note Modal Handler ---
export function openNoteModal(type, itemId, itemTitle) {
    appState.currentNote = { type, itemId, itemTitle };
    let existingNote;

    if (type === 'quiz') {
        existingNote = appState.userQuizNotes.find(n => n.QuizID === itemId);
    } else if (type === 'lecture') {
        existingNote = appState.userLectureNotes.find(n => n.LectureID === itemId);
    } else if (type === 'theory') {
        const log = appState.userTheoryLogs.find(l => l.Question_ID === itemId);
        existingNote = log ? { NoteText: log.Notes } : null;
    }

    if(dom.noteModalTitle) dom.noteModalTitle.textContent = `Note on: ${itemTitle.substring(0, 40)}...`;
    if(dom.noteTextarea) dom.noteTextarea.value = existingNote ? existingNote.NoteText : '';
    if(dom.modalBackdrop) dom.modalBackdrop.classList.remove('hidden');
    if(dom.noteModal) dom.noteModal.classList.remove('hidden');
}

// --- Filter Population ---
function populateAllFilters() {
    // 1. QBank Mock Filters
    const allSources = [...new Set(appState.allQuestions.map(q => q.source || 'Uncategorized'))].sort();
    const sourceCounts = appState.allQuestions.reduce((acc, q) => {
        const source = q.source || 'Uncategorized';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {});
    ui.populateFilterOptions(dom.sourceSelectMock, allSources, 'mock-source', sourceCounts);
    updateChapterFilter();

    // 2. Simulation Filters
    ui.populateFilterOptions(dom.sourceSelectSim, allSources, 'sim-source', sourceCounts);
    const allChapters = [...new Set(appState.allQuestions.map(q => q.chapter || 'Uncategorized'))].sort();
    const chapterCounts = appState.allQuestions.reduce((acc, q) => {
        const chapter = q.chapter || 'Uncategorized';
        acc[chapter] = (acc[chapter] || 0) + 1;
        return acc;
    }, {});
    ui.populateFilterOptions(dom.chapterSelectSim, allChapters, 'sim-chapter', chapterCounts);

    if(dom.sourceSelectSim) dom.sourceSelectSim.querySelectorAll('input').forEach(i => i.checked = true);
    if(dom.chapterSelectSim) dom.chapterSelectSim.querySelectorAll('input').forEach(i => i.checked = true);

    // 3. OSCE Filters
    const osceChapters = [...new Set(appState.allOsceCases.map(c => c.Chapter || 'Uncategorized'))].sort();
    const osceSources = [...new Set(appState.allOsceCases.map(c => c.Source || 'Uncategorized'))].sort();
    const osceChapterCounts = appState.allOsceCases.reduce((acc, c) => {
        const chapter = c.Chapter || 'Uncategorized';
        acc[chapter] = (acc[chapter] || 0) + 1;
        return acc;
    }, {});
    const osceSourceCounts = appState.allOsceCases.reduce((acc, c) => {
        const source = c.Source || 'Uncategorized';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {});
    ui.populateFilterOptions(dom.chapterSelectOsce, osceChapters, 'osce-chapter', osceChapterCounts);
    ui.populateFilterOptions(dom.sourceSelectOsce, osceSources, 'osce-source', osceSourceCounts);
}

// --- Routing Logic ---
function handleRouting() {
    if (!appState.currentUser && window.location.hash !== '#login') {
        return;
    }
    const hash = window.location.hash;
    switch(hash) {
        case '#home': showMainMenuScreen(); break;
        case '#lectures': if (checkPermission('Lectures')) { renderLectures(); ui.showScreen(dom.lecturesContainer); } break;
        case '#qbank': if (checkPermission('MCQBank')) ui.showScreen(dom.qbankContainer); break;
        case '#learning': if (checkPermission('LerningMode')) showLearningModeBrowseScreen(); break;
        case '#theory': if (checkPermission('TheoryBank')) showTheoryMenuScreen(); break;
        case '#osce': if (checkPermission('OSCEBank')) ui.showScreen(dom.osceContainer); break;
        case '#library': if (checkPermission('Library')) { ui.renderBooks(); ui.showScreen(dom.libraryContainer); } break;
        case '#planner': if (checkPermission('StudyPlanner')) {
             // Safe Guard for Planner
             try { showStudyPlannerScreen(); } catch(e) { console.error(e); alert("Planner data error. Clear cache."); }
        } break;
        case '#leaderboard': if (checkPermission('LeadersBoard')) showLeaderboardScreen(); break;
        case '#activity': showActivityLog(); break;
        case '#notes': showNotesScreen(); break;
        case '#quiz': 
            if (!appState.currentQuiz.questions || appState.currentQuiz.questions.length === 0) {
                window.location.hash = '#home';
            } else {
                ui.showScreen(dom.quizContainer);
            }
            break;
        case '#matching': showMatchingMenu(); break;
        default: break;
    }
}

// --- Daily Streak ---
function calculateDailyStreak() {
    if (!dom.streakContainer || !dom.streakCount) return;
    const today = new Date().toISOString().split('T')[0];
    const lastVisit = localStorage.getItem('lastVisitDate');
    let streak = parseInt(localStorage.getItem('dailyStreak') || '0');

    if (lastVisit !== today) {
        if (lastVisit) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            if (lastVisit === yesterdayStr) streak++;
            else streak = 1; 
        } else {
            streak = 1;
        }
        localStorage.setItem('lastVisitDate', today);
        localStorage.setItem('dailyStreak', streak);
    }
    dom.streakCount.textContent = streak;
    if (streak > 0) {
        dom.streakContainer.classList.remove('hidden');
        dom.streakContainer.classList.add('flex');
    }
}

// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. SETTINGS INITIALIZATION (FIXED)
    const toggleThemeBtn = document.getElementById('toggle-theme-btn');
    const toggleAnimationBtn = document.getElementById('toggle-animation-btn');
    const loginCanvas = document.getElementById('login-canvas');
    const htmlEl = document.documentElement;

    function initializeSettings() {
        // Theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        htmlEl.className = savedTheme; // Resets any other class

        // Animation
        const savedAnimation = localStorage.getItem('animation') || 'on';
        if (savedAnimation === 'off') {
            htmlEl.classList.add('animation-off');
            if(loginCanvas) loginCanvas.style.display = 'none';
        } else {
            htmlEl.classList.remove('animation-off');
            if(loginCanvas) loginCanvas.style.display = 'block';
        }
    }

    // Theme Button Logic
    safeListen(toggleThemeBtn, 'click', () => {
        if (htmlEl.classList.contains('light')) {
            htmlEl.classList.replace('light', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            htmlEl.classList.replace('dark', 'light');
            if (!htmlEl.classList.contains('light')) htmlEl.classList.add('light'); // Ensure light is present
            htmlEl.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    });

    // Animation Button Logic
    safeListen(toggleAnimationBtn, 'click', () => {
        if (htmlEl.classList.contains('animation-off')) {
            htmlEl.classList.remove('animation-off');
            localStorage.setItem('animation', 'on');
            if(loginCanvas) loginCanvas.style.display = 'block';
        } else {
            htmlEl.classList.add('animation-off');
            localStorage.setItem('animation', 'off');
            if(loginCanvas) loginCanvas.style.display = 'none';
        }
    });

    initializeSettings(); // Run immediately

    // 2. PWA & Routing
    window.addEventListener('hashchange', handleRouting);
    calculateDailyStreak(); 

    // 3. Data Loading
    async function initializeApp() {
        if(dom.loginSubmitBtn) {
            dom.loginSubmitBtn.disabled = true;
            dom.loginSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Connecting...';
        }
        if(dom.freeTestBtn) dom.freeTestBtn.disabled = true;

        const data = await fetchContentData();
        if (data && data.roles && data.questions) {
            appState.allQuestions = utils.parseQuestions(data.questions);
            appState.allFreeTestQuestions = utils.parseQuestions(data.freeTestQuestions);
            appState.groupedLectures = utils.groupLecturesByChapter(data.lectures);
            appState.mcqBooks = data.books || [];
            appState.allAnnouncements = data.announcements || [];
            appState.allOsceCases = utils.parseOsceCases(data.osceCases);
            appState.allOsceQuestions = utils.parseOsceQuestions(data.osceQuestions);
            appState.allRoles = data.roles || [];
            appState.allTheoryQuestions = utils.parseTheoryQuestions(data.theoryQuestions);

            populateAllFilters();
            
            if(dom.loginSubmitBtn) {
                dom.loginSubmitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Log In';
                dom.loginSubmitBtn.disabled = false;
            }
            if(dom.freeTestBtn) dom.freeTestBtn.disabled = false;
        } else {
            if(dom.loginSubmitBtn) dom.loginSubmitBtn.textContent = 'Connection Error';
            if(dom.loginError) {
                dom.loginError.textContent = 'Failed to load content. Please refresh.';
                dom.loginError.classList.remove('hidden');
            }
        }
    }

    // --- EVENT LISTENERS ---
    
    // Tour
    safeListen(dom.helpBtn, 'click', startTour);
    safeListen(dom.startTourBtn, 'click', startTour);
    safeListen(dom.skipTourBtn, 'click', endTour);
    safeListen(dom.tourNextBtn, 'click', nextTourStep);
    safeListen(dom.tourEndBtn, 'click', endTour);

    // Login & Register
    safeListen(dom.loginForm, 'submit', handleLogin);
    safeListen(dom.showRegisterLink, 'click', (e) => { e.preventDefault(); showRegistrationModal(); });
    safeListen(dom.registrationForm, 'submit', handleRegistrationSubmit);
    safeListen(dom.registerCancelBtn, 'click', hideRegistrationModal);
    safeListen(dom.logoutBtn, 'click', handleLogout);
    
    // Navigation
    safeListen(dom.globalHomeBtn, 'click', () => {
        if (appState.currentUser?.Role === 'Guest') { ui.showScreen(dom.loginContainer); appState.currentUser = null; } 
        else { showMainMenuScreen(); }
    });
    
    [dom.lecturesBackBtn, dom.qbankBackBtn, dom.listBackBtn, dom.activityBackBtn, dom.libraryBackBtn, dom.notesBackBtn, dom.leaderboardBackBtn, dom.osceBackBtn, dom.learningModeBackBtn, dom.studyPlannerBackBtn, dom.theoryBackBtn, dom.matchingBackBtn].forEach(btn => {
        safeListen(btn, 'click', () => { if (window.history.length > 1) window.history.back(); else showMainMenuScreen(); });
    });

    // Menu Buttons
    safeListen(dom.lecturesBtn, 'click', () => { if (checkPermission('Lectures')) { renderLectures(); ui.showScreen(dom.lecturesContainer); } });
    safeListen(dom.qbankBtn, 'click', () => { if (checkPermission('MCQBank')) { ui.showScreen(dom.qbankContainer); } });
    safeListen(dom.learningModeBtn, 'click', () => { if (checkPermission('LerningMode')) showLearningModeBrowseScreen(); });
    safeListen(dom.theoryBtn, 'click', () => { if (checkPermission('TheoryBank')) showTheoryMenuScreen(); });
    safeListen(dom.osceBtn, 'click', () => { if (checkPermission('OSCEBank')) { ui.showScreen(dom.osceContainer); } });
    safeListen(dom.libraryBtn, 'click', () => { if (checkPermission('Library')) { ui.renderBooks(); ui.showScreen(dom.libraryContainer); } });
    
    // SAFE GUARDED PLANNER BUTTON (Prevents Crash)
    safeListen(dom.studyPlannerBtn, 'click', async () => { 
        if (checkPermission('StudyPlanner')) {
            try { await showStudyPlannerScreen(); } 
            catch (error) { 
                console.error("Planner Error:", error); 
                alert("Planner data error. Please clear browser cache/local storage.");
                if(dom.studyPlannerLoader) dom.studyPlannerLoader.classList.add('hidden');
            }
        } 
    });

    safeListen(dom.leaderboardBtn, 'click', () => checkPermission('LeadersBoard') && showLeaderboardScreen());
    safeListen(dom.matchingBtn, 'click', () => showMatchingMenu());
    safeListen(dom.freeTestBtn, 'click', startFreeTest);

    // Features
    safeListen(dom.userProfileHeaderBtn, 'click', () => showUserCardModal(false));
    safeListen(dom.editProfileBtn, 'click', () => toggleProfileEditMode(true));
    safeListen(dom.cancelEditProfileBtn, 'click', () => toggleProfileEditMode(false));
    safeListen(dom.saveProfileBtn, 'click', handleSaveProfile);
    safeListen(dom.radioBtn, 'click', () => dom.radioBannerContainer.classList.toggle('open'));
    safeListen(dom.radioCloseBtn, 'click', () => dom.radioBannerContainer.classList.remove('open'));
    safeListen(dom.announcementsBtn, 'click', ui.showAnnouncementsModal);
    safeListen(dom.messengerBtn, 'click', showMessengerModal);
    safeListen(dom.sendMessageBtn, 'click', handleSendMessageBtn);
    safeListen(dom.lectureSearchInput, 'keyup', (e) => renderLectures(e.target.value));
    
    safeListen(dom.notesBtn, 'click', showNotesScreen);
    safeListen(dom.activityLogBtn, 'click', showActivityLog);
    safeListen(dom.logFilterAll, 'click', () => renderFilteredLog('all'));
    safeListen(dom.logFilterQuizzes, 'click', () => renderFilteredLog('quizzes'));
    safeListen(dom.logFilterLectures, 'click', () => renderFilteredLog('lectures'));
    safeListen(dom.notesFilterQuizzes, 'click', () => renderNotes('quizzes'));
    safeListen(dom.notesFilterLectures, 'click', () => renderNotes('lectures'));
    safeListen(dom.notesFilterTheory, 'click', () => renderNotes('theory'));
    safeListen(dom.noteSaveBtn, 'click', () => {
        const { type, itemId } = appState.currentNote;
        if (type === 'theory') {
            logTheoryActivity({ questionId: itemId, Notes: dom.noteTextarea.value });
            if(dom.theoryNoteBtn) dom.theoryNoteBtn.classList.toggle('has-note', dom.noteTextarea.value.length > 0);
             dom.modalBackdrop.classList.add('hidden');
             dom.noteModal.classList.add('hidden');
        } else { handleSaveNote(); }
    });
    safeListen(dom.noteCancelBtn, 'click', () => { dom.noteModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    
    // QBank & Simulation
    safeListen(dom.startMockBtn, 'click', handleMockExamStart);
    safeListen(dom.toggleCustomOptionsBtn, 'click', () => dom.customExamOptions.classList.toggle('visible'));
    safeListen(dom.sourceSelectMock, 'change', updateChapterFilter);
    if(dom.selectAllSourcesMock) safeListen(dom.selectAllSourcesMock, 'change', (e) => {
        dom.sourceSelectMock.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
        updateChapterFilter();
    });
    if(dom.selectAllChaptersMock) safeListen(dom.selectAllChaptersMock, 'change', (e) => {
        dom.chapterSelectMock.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
    });

    // Simulation Listeners
    safeListen(dom.startSimulationBtn, 'click', handleStartSimulation); 
    safeListen(dom.toggleSimulationOptionsBtn, 'click', () => dom.simulationCustomOptions.classList.toggle('hidden'));
    if(dom.selectAllSourcesSim) safeListen(dom.selectAllSourcesSim, 'change', (e) => {
        dom.sourceSelectSim.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
    });
    if(dom.selectAllChaptersSim) safeListen(dom.selectAllChaptersSim, 'change', (e) => {
        dom.chapterSelectSim.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { checkbox.checked = e.target.checked; });
    });

    safeListen(dom.qbankSearchBtn, 'click', handleQBankSearch);
    safeListen(dom.qbankStartSearchQuizBtn, 'click', startSearchedQuiz);
    safeListen(dom.qbankClearSearchBtn, 'click', () => {
        dom.qbankSearchResultsContainer.classList.add('hidden');
        dom.qbankMainContent.classList.remove('hidden');
        dom.qbankSearchInput.value = '';
    });
    safeListen(dom.practiceMistakesBtn, 'click', startIncorrectQuestionsQuiz);
    safeListen(dom.practiceBookmarkedBtn, 'click', startBookmarkedQuestionsQuiz);
    if(dom.browseByChapterBtn) safeListen(dom.browseByChapterBtn, 'click', () => startQuizBrowse('chapter'));
    if(dom.browseBySourceBtn) safeListen(dom.browseBySourceBtn, 'click', () => startQuizBrowse('source'));
    
    const qbankTabs = [dom.qbankTabCreate, dom.qbankTabPractice, dom.qbankTabBrowse];
    qbankTabs.forEach((tab, index) => { 
        safeListen(tab, 'click', () => {
            const panels = [dom.qbankPanelCreate, dom.qbankPanelPractice, dom.qbankPanelBrowse];
            qbankTabs.forEach((t, i) => t && t.classList.toggle('bg-white', i === index));
            panels.forEach((p, i) => p && p.classList.toggle('hidden', i !== index));
            if(dom.qbankMainContent) dom.qbankMainContent.classList.remove('hidden');
            if(dom.qbankSearchResultsContainer) dom.qbankSearchResultsContainer.classList.add('hidden');
        }); 
    });

    safeListen(dom.endQuizBtn, 'click', triggerEndQuiz);
    safeListen(dom.nextSkipBtn, 'click', handleNextQuestion);
    safeListen(dom.previousBtn, 'click', handlePreviousQuestion);
    safeListen(dom.bookmarkBtn, 'click', toggleBookmark);
    safeListen(dom.flagBtn, 'click', toggleFlag);
    safeListen(dom.hintBtn, 'click', showHint);
    safeListen(dom.navigatorBtn, 'click', showQuestionNavigator);
    safeListen(dom.quizNoteBtn, 'click', () => {
        const question = appState.currentQuiz.questions[appState.currentQuiz.currentQuestionIndex];
        if (question) openNoteModal('quiz', question.UniqueID, question.question);
    });
    safeListen(dom.resultsHomeBtn, 'click', showMainMenuScreen);
    safeListen(dom.restartBtn, 'click', () => restartCurrentQuiz());
    safeListen(dom.reviewIncorrectBtn, 'click', () => reviewIncorrectAnswers());
    safeListen(document.getElementById('review-simulation-btn'), 'click', () => startSimulationReview());

    // Matching
    safeListen(dom.startMatchingBtn, 'click', handleStartMatchingExam);
    safeListen(dom.matchingSubmitBtn, 'click', () => checkCurrentSetAnswers());
    safeListen(dom.matchingNextBtn, 'click', handleNextMatchingSet);
    safeListen(dom.endMatchingBtn, 'click', () => { ui.showConfirmationModal('End Test', 'Are you sure?', () => showMatchingMenu()); });

    // OSCE & Others
    safeListen(dom.startOsceSlayerBtn, 'click', startOsceSlayer);
    safeListen(dom.startCustomOsceBtn, 'click', startCustomOsce);
    safeListen(dom.toggleOsceOptionsBtn, 'click', () => dom.customOsceOptions.classList.toggle('visible'));
    safeListen(dom.endOsceQuizBtn, 'click', () => endOsceQuiz(false));
    safeListen(dom.osceNextBtn, 'click', handleOsceNext);
    safeListen(dom.oscePreviousBtn, 'click', handleOscePrevious);
    safeListen(dom.osceNavigatorBtn, 'click', showOsceNavigator);
    
    safeListen(dom.endLearningBtn, 'click', showLearningModeBrowseScreen);
    safeListen(dom.learningNextBtn, 'click', handleLearningNext);
    safeListen(dom.learningPreviousBtn, 'click', handleLearningPrevious);
    safeListen(dom.learningSearchBtn, 'click', handleLearningSearch);
    
    safeListen(dom.showCreatePlanModalBtn, 'click', () => { dom.createPlanModal.classList.remove('hidden'); dom.modalBackdrop.classList.remove('hidden'); });
    safeListen(dom.cancelCreatePlanBtn, 'click', () => { dom.createPlanModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    safeListen(dom.confirmCreatePlanBtn, 'click', handleCreatePlan);
    safeListen(dom.backToPlansDashboardBtn, 'click', () => { dom.activePlanView.classList.add('hidden'); dom.plannerDashboard.classList.remove('hidden'); });

    safeListen(dom.modalCancelBtn, 'click', () => { dom.confirmationModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    safeListen(dom.modalConfirmBtn, 'click', () => { if (appState.modalConfirmAction) { appState.modalConfirmAction(); dom.confirmationModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden');} });
    safeListen(dom.imageViewerCloseBtn, 'click', () => { dom.imageViewerModal.classList.add('hidden'); if(dom.userCardModal.classList.contains('hidden') && dom.createPlanModal.classList.contains('hidden') && dom.announcementsModal.classList.contains('hidden') && dom.messengerModal.classList.contains('hidden')) dom.modalBackdrop.classList.add('hidden');});
    safeListen(dom.announcementsCloseBtn, 'click', () => { dom.announcementsModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    safeListen(dom.userCardCloseBtn, 'click', () => { dom.userCardModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    safeListen(dom.messengerCloseBtn, 'click', () => { dom.messengerModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); if (appState.messengerPollInterval) clearInterval(appState.messengerPollInterval); });
    safeListen(dom.navigatorCloseBtn, 'click', () => { dom.questionNavigatorModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden');});
    safeListen(dom.osceNavigatorCloseBtn, 'click', () => { dom.osceNavigatorModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden');});
    safeListen(dom.clearLogCancelBtn, 'click', () => { dom.clearLogModal.classList.add('hidden'); dom.modalBackdrop.classList.add('hidden'); });
    safeListen(dom.clearLogBtn, 'click', () => { dom.clearLogModal.classList.remove('hidden'); dom.modalBackdrop.classList.remove('hidden'); });

    initializeApp();
});
