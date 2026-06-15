let currentUser = null;
let isLoggedIn = false;
let sessionId = null;
let chatMessages = [];
let aiHistory = [];

function generateSessionId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function showPage(pageId) {
    // Скрываем всё
    const landing = document.getElementById('landing');
    const dashboard = document.getElementById('dashboard');
    const pages = document.querySelectorAll('.page');
    
    if (landing) landing.classList.add('hidden');
    if (dashboard) dashboard.classList.remove('active');
    pages.forEach(page => page.classList.remove('active'));
    
    // Показываем нужное
    if (pageId === 'landing') {
        if (landing) landing.classList.remove('hidden');
    } else if (pageId === 'dashboard') {
        if (dashboard) dashboard.classList.add('active');
    } else {
        const page = document.getElementById(pageId);
        if (page) page.classList.add('active');
    }
}

async function saveToServer() {
    if (!sessionId || !currentUser) return;
    try {
        await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sessionId, 
                data: { 
                    nickname: currentUser.nickname, 
                    chatMessages, 
                    aiHistory 
                } 
            })
        });
    } catch(e) { 
        console.error('Save error:', e); 
    }
}

async function loadChatMessages() {
    try {
        const res = await fetch('/api/chat/messages');
        chatMessages = await res.json();
        renderChat();
    } catch(e) { 
        console.error('Load chat error:', e); 
    }
}

async function sendChatMessage() {
    if (!isLoggedIn) { 
        alert('Пожалуйста, войдите'); 
        startLogin(); 
        return; 
    }
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) { 
        alert('Введите сообщение'); 
        return; 
    }

    try {
        const res = await fetch('/api/chat/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                author: currentUser.nickname, 
                text, 
                userId: sessionId 
            })
        });
        if (res.status === 403) { 
            const err = await res.json(); 
            alert(err.error); 
        } else { 
            input.value = ''; 
            await loadChatMessages(); 
        }
    } catch(e) { 
        alert('Ошибка отправки'); 
    }
}

function renderChat() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    if (!chatMessages.length) { 
        container.innerHTML = '<div class="empty-chat">✨ Пока нет сообщений ✨</div>'; 
        return; 
    }
    container.innerHTML = '';
    chatMessages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.userId === sessionId ? 'message-user' : 'message-bot'}`;
        div.innerHTML = `<strong>${msg.author}</strong> ${msg.time || ''}<br>${escapeHtml(msg.text)}`;
        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
}

function renderAIChat() {
    const container = document.getElementById('aiMessages');
    if (!container) return;
    container.innerHTML = '';
    aiHistory.forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.role === 'user' ? 'message-user' : 'message-bot'}`;
        div.innerHTML = escapeHtml(msg.text);
        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function sendAIMessage() {
    if (!isLoggedIn) { 
        alert('Пожалуйста, войдите'); 
        startLogin(); 
        return; 
    }
    const input = document.getElementById('aiInput');
    const text = input.value.trim();
    if (!text) { 
        alert('Введите сообщение'); 
        return; 
    }
    
    aiHistory.push({ role: 'user', text });
    renderAIChat();
    input.value = '';
    
    try {
        const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, sessionId })
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Ошибка сервера');
        }
        
        const data = await res.json();
        aiHistory.push({ role: 'bot', text: data.response });
        renderAIChat();
        await saveToServer();
        
    } catch(e) {
        console.error('AI error:', e);
        aiHistory.push({ role: 'bot', text: '❌ Ошибка соединения с ИИ. Попробуйте позже.' });
        renderAIChat();
    }
}


function startLogin() {
    // Показываем скрининг перед входом
    showScreening();
}

function showScreening() {
    const container = document.getElementById('screeningQuestions');
    if (!container) return;
    
    const questions = [
        "У вас были мысли о том, чтобы причинить себе вред?",
        "Вы наносите себе повреждения (порезы, удары, ожоги)?",
        "У вас были мысли о смерти или что жизнь не имеет смысла?",
        "Сегодня вы вообще не ели и не пили воду?",
        "Вы чувствуете сильную слабость, головокружение?",
        "Вы не можете остановить рвоту или приём слабительных прямо сейчас?"
    ];
    container.innerHTML = '';
    questions.forEach((q, i) => {
        const div = document.createElement('div');
        div.className = 'screening-question';
        div.innerHTML = `<p>${i+1}. ${q}</p>
            <div class="radio-group">
                <label><input type="radio" name="screen${i}" value="yes"> Да</label>
                <label><input type="radio" name="screen${i}" value="no" checked> Нет</label>
            </div>`;
        container.appendChild(div);
    });
    
    const modal = document.getElementById('screeningModal');
    if (modal) modal.classList.add('active');
}

function submitScreening() {
    let hasCrisis = false;
    for (let i = 0; i < 6; i++) {
        const selected = document.querySelector(`input[name="screen${i}"]:checked`);
        if (selected && selected.value === 'yes') hasCrisis = true;
    }
    
    const modal = document.getElementById('screeningModal');
    if (modal) modal.classList.remove('active');

    if (hasCrisis) {
        const crisisModal = document.getElementById('crisisModal');
        if (crisisModal) crisisModal.classList.add('active');
        const overrideBtn = document.getElementById('crisisOverrideBtn');
        if (overrideBtn) overrideBtn.disabled = false;
    } else {
        // Показываем модалку входа
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.classList.add('active');
    }
}

function completeRegistration() {
    const nick = document.getElementById('nicknameInput').value.trim();
    if (!nick || nick.length < 2) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) errorDiv.style.display = 'block';
        return;
    }
    
    sessionId = generateSessionId();
    currentUser = { nickname: nick };
    isLoggedIn = true;
    
    localStorage.setItem('easeMind_session', sessionId);
    localStorage.setItem('easeMind_user', JSON.stringify(currentUser));
    
    const loginModal = document.getElementById('loginModal');
    if (loginModal) loginModal.classList.remove('active');
    
    const usernameSpan = document.getElementById('username');
    if (usernameSpan) usernameSpan.innerText = nick;
    
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    
    const chatLocked = document.getElementById('chatLocked');
    const aiLocked = document.getElementById('aiLocked');
    if (chatLocked) chatLocked.classList.remove('locked-card');
    if (aiLocked) aiLocked.classList.remove('locked-card');
    
    if (aiHistory.length === 0) {
        aiHistory = [{ role: 'bot', text: 'Здравствуйте. Я ИИ-психолог. Расскажите, что вас тревожит?' }];
        renderAIChat();
    }
    
    saveToServer();
    loadChatMessages();
    showPage('dashboard');
}

function logout() {
    currentUser = null;
    isLoggedIn = false;
    sessionId = null;
    
    localStorage.removeItem('easeMind_session');
    localStorage.removeItem('easeMind_user');
    
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    
    const chatLocked = document.getElementById('chatLocked');
    const aiLocked = document.getElementById('aiLocked');
    if (chatLocked) chatLocked.classList.add('locked-card');
    if (aiLocked) aiLocked.classList.add('locked-card');
    
    showPage('landing');
}


function renderTest() {
    const container = document.getElementById('testQuestions');
    if (!container) return;
    
    const questions = [
        "Я боюсь набрать вес даже при нормальном питании",
        "Я пропускаю приёмы пищи, чтобы контролировать вес",
        "После еды я испытываю сильное чувство вины или стыда",
        "Я ем очень много за короткое время и чувствую, что не могу остановиться",
        "Моя самооценка сильно зависит от того, сколько я вешу",
        "Я вызываю у себя рвоту или принимаю слабительные для контроля веса",
        "Я постоянно думаю о еде, калориях и весе",
        "Я избегаю продуктов, которые считаю «вредными»",
        "Я чувствую дискомфорт, когда ем в присутствии других",
        "Я строго соблюдаю диеты и режим питания",
        "Я ощущаю давление, чтобы есть меньше",
        "Я чувствую, что еда контролирует мою жизнь",
        "После переедания я чувствую отвращение к себе",
        "Я сравниваю свой вес и фигуру с другими",
        "Я считаю, что моя фигура слишком крупная",
        "Я использую физические упражнения как способ сжечь калории",
        "Я чувствую вину, если не могу заниматься спортом",
        "Я ем тайно, чтобы никто не видел",
        "Я чувствую, что другие считают меня слишком полным",
        "Я постоянно взвешиваюсь и измеряю объёмы",
        "Я чувствую, что моя жизнь зависит от моего веса",
        "Я испытываю сильный стресс перед приёмом пищи",
        "Я стараюсь есть как можно меньше",
        "Я пью много воды, чтобы заглушить голод",
        "Я чувствую, что не заслуживаю есть",
        "Мои мысли о еде мешают мне жить нормальной жизнью"
    ];
    
    container.innerHTML = '';
    questions.forEach((q, i) => {
        const div = document.createElement('div');
        div.className = 'test-question';
        div.innerHTML = `
            <p><strong>${q}</strong></p>
            <div class="test-options">
                <label><input type="radio" name="test${i}" value="1"> Никогда</label>
                <label><input type="radio" name="test${i}" value="2"> Редко</label>
                <label><input type="radio" name="test${i}" value="3"> Иногда</label>
                <label><input type="radio" name="test${i}" value="4"> Часто</label>
                <label><input type="radio" name="test${i}" value="5"> Всегда</label>
            </div>
        `;
        container.appendChild(div);
    });
}

function submitTest() {
    let score = 0;
    let answered = true;
    for (let i = 0; i < 26; i++) {
        const selected = document.querySelector(`input[name="test${i}"]:checked`);
        if (selected) score += parseInt(selected.value);
        else answered = false;
    }
    if (!answered) { 
        alert('Пожалуйста, ответьте на все 26 вопросов'); 
        return; 
    }
    
    const resultDiv = document.getElementById('testResult');
    if (score <= 30) {
        resultDiv.innerHTML = '<strong>✅ Низкий риск</strong><br>У вас нет явных признаков РПП.';
    } else if (score <= 60) {
        resultDiv.innerHTML = '<strong>🟡 Умеренный риск</strong><br>Рекомендуется консультация психолога.';
    } else {
        resultDiv.innerHTML = '<strong>🔴 Высокий риск</strong><br>Настоятельно рекомендуем обратиться к психиатру.';
    }
}

const resourcesData = [
    { title: "«Интуитивное питание» — Светлана Бронникова", link: "https://flibusta.su/book/299-intuitivnoe-pitanie-kak-perestat-bespokoitsya-o-ede-i-pohudet/read/" },
    { title: "«Диеты не работают» — Роберт Шварц", link: "https://www.rulit.me/books/diety-ne-rabotayut-read-91987-1.html" }
];

function renderResources() {
    const container = document.getElementById('resourcesList');
    if (!container) return;
    container.innerHTML = resourcesData.map(r => `
        <div class="resource-item">
            <span><strong>${escapeHtml(r.title)}</strong><br><span style="color:#757F99">📚 Книга</span></span>
            <button class="btn-outline" style="padding:6px 16px" onclick="window.open('${r.link}', '_blank')">Читать</button>
        </div>
    `).join('');
}


function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                const activeTab = document.getElementById(`tab-${tab}`);
                if (activeTab) activeTab.classList.add('active');
            });
        });
    }
}

function initNavigation() {
    // Карточки на лендинге
    document.querySelectorAll('.info-card').forEach(card => {
        card.addEventListener('click', () => {
            const page = card.dataset.page;
            if (page === 'what-is-ed') showPage('whatIsEdPage');
            else if (page === 'test') { showPage('testPage'); renderTest(); }
            else if (page === 'selfhelp') showPage('selfhelpPage');
            else if (page === 'resources') { showPage('resourcesPage'); renderResources(); }
            else if (page === 'family') showPage('familyPage');
        });
    });
    
    // Карточки на дашборде
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', () => {
            const feature = card.dataset.feature;
            if ((feature === 'chat' || feature === 'ai') && !isLoggedIn) {
                alert('🔒 Для доступа к чату и ИИ-психологу необходимо войти.');
                return;
            }
            if (feature === 'chat') { showPage('chatPage'); loadChatMessages(); }
            else if (feature === 'ai') { showPage('aiPage'); renderAIChat(); }
            else if (feature === 'what-is-ed') showPage('whatIsEdPage');
            else if (feature === 'test') { showPage('testPage'); renderTest(); }
            else if (feature === 'selfhelp') showPage('selfhelpPage');
            else if (feature === 'resources') { showPage('resourcesPage'); renderResources(); }
            else if (feature === 'family') showPage('familyPage');
        });
    });
    
    // Кнопки "Назад"
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (isLoggedIn) showPage('dashboard');
            else showPage('landing');
        });
    });
}


function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.remove('active'));
}


function bindButtons() {
    // Кнопка "Начать путь" на лендинге
    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.onclick = startLogin;
    
    // Кнопка "Вход" в шапке
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.onclick = startLogin;
    
    // Кнопка "Выход"
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.onclick = logout;
    
    // Кнопка "Горячая линия"
    const hotlineBtn = document.getElementById('hotlineBtn');
    if (hotlineBtn) hotlineBtn.onclick = () => {
        const modal = document.getElementById('hotlineModal');
        if (modal) modal.classList.add('active');
    };
    
    // Закрыть горячую линию
    const closeHotline = document.getElementById('closeHotline');
    if (closeHotline) closeHotline.onclick = () => {
        const modal = document.getElementById('hotlineModal');
        if (modal) modal.classList.remove('active');
    };
    
    // Отправить сообщение в чат
    const sendChat = document.getElementById('sendChat');
    if (sendChat) sendChat.onclick = sendChatMessage;
    
    // Отправить сообщение ИИ
    const sendAI = document.getElementById('sendAI');
    if (sendAI) sendAI.onclick = sendAIMessage;
    
    // Enter в чатах
    const chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });
    
    const aiInput = document.getElementById('aiInput');
    if (aiInput) aiInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendAIMessage(); });
    
    // Кнопка отправки скрининга
    const submitScreeningBtn = document.getElementById('submitScreening');
    if (submitScreeningBtn) submitScreeningBtn.onclick = submitScreening;
    
    // Кнопка отправки ника
    const submitNickname = document.getElementById('submitNickname');
    if (submitNickname) submitNickname.onclick = completeRegistration;
    
    // Кнопка "Позвонить 112" в кризисной модалке
    const crisisCallBtn = document.getElementById('crisisCallBtn');
    if (crisisCallBtn) crisisCallBtn.onclick = () => window.location.href = 'tel:112';
    
    // Чекбокс "Всё равно войти"
    const crisisOverride = document.getElementById('crisisOverride');
    const crisisOverrideBtn = document.getElementById('crisisOverrideBtn');
    if (crisisOverride && crisisOverrideBtn) {
        crisisOverride.addEventListener('change', (e) => {
            crisisOverrideBtn.disabled = !e.target.checked;
        });
        crisisOverrideBtn.onclick = () => {
            const modal = document.getElementById('crisisModal');
            if (modal) modal.classList.remove('active');
            const loginModal = document.getElementById('loginModal');
            if (loginModal) loginModal.classList.add('active');
        };
    }
    
    // Закрытие кризисной модалки
    const closeCrisisModal = document.getElementById('closeCrisisModal');
    if (closeCrisisModal) closeCrisisModal.onclick = () => {
        const modal = document.getElementById('crisisModal');
        if (modal) modal.classList.remove('active');
    };
    
    // Кнопка "Узнать результат" теста
    const submitTestBtn = document.getElementById('submitTest');
    if (submitTestBtn) submitTestBtn.onclick = submitTest;
    
    // Кнопка настроения
    document.querySelectorAll('.mood-option').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.mood === 'crisis') {
                const modal = document.getElementById('hotlineModal');
                if (modal) modal.classList.add('active');
            } else {
                alert('🌿 Спасибо, что делитесь своим состоянием');
            }
        });
    });
    
    // Скрытие кризисного баннера
    const hideCrisisBanner = document.getElementById('hideCrisisBanner');
    if (hideCrisisBanner) hideCrisisBanner.onclick = () => {
        const banner = document.getElementById('crisisBanner');
        if (banner) banner.style.display = 'none';
    };
}


async function loadFromStorage() {
    const savedSession = localStorage.getItem('easeMind_session');
    const savedUser = localStorage.getItem('easeMind_user');
    if (savedSession && savedUser) {
        sessionId = savedSession;
        currentUser = JSON.parse(savedUser);
        isLoggedIn = true;
        try {
            const res = await fetch(`/api/load/${sessionId}`);
            const data = await res.json();
            if (data) {
                if (data.chatMessages) chatMessages = data.chatMessages;
                if (data.aiHistory) aiHistory = data.aiHistory;
            }
        } catch(e) {
            console.error('Load error:', e);
        }
        const usernameSpan = document.getElementById('username');
        if (usernameSpan) usernameSpan.innerText = currentUser.nickname;
        
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        
        const chatLocked = document.getElementById('chatLocked');
        const aiLocked = document.getElementById('aiLocked');
        if (chatLocked) chatLocked.classList.remove('locked-card');
        if (aiLocked) aiLocked.classList.remove('locked-card');
        
        showPage('dashboard');
    }
    if (aiHistory.length === 0) {
        aiHistory = [{ role: 'bot', text: 'Здравствуйте. Я ИИ-психолог. Расскажите, что вас тревожит?' }];
        renderAIChat();
    }
    await loadChatMessages();
}


document.addEventListener('DOMContentLoaded', () => {
    bindButtons();
    initNavigation();
    initTabs();
    renderResources();
    renderTest();
    loadFromStorage();
    
    // Закрытие модалок при клике вне
    window.onclick = (e) => {
        if (e.target.classList && e.target.classList.contains('modal')) {
            closeAllModals();
        }
    };
}); 