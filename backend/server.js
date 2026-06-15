const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const SAVES_DIR = path.join(__dirname, '../saves');
if (!fs.existsSync(SAVES_DIR)) fs.mkdirSync(SAVES_DIR, { recursive: true });

app.post('/api/save', (req, res) => {
    const { sessionId, data } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'No sessionId' });
    fs.writeFileSync(path.join(SAVES_DIR, `${sessionId}.json`), JSON.stringify(data, null, 2));
    res.json({ success: true });
});

app.get('/api/load/:sessionId', (req, res) => {
    const filePath = path.join(SAVES_DIR, `${req.params.sessionId}.json`);
    if (fs.existsSync(filePath)) {
        res.json(JSON.parse(fs.readFileSync(filePath, 'utf8')));
    } else {
        res.json(null);
    }
});

function getLocalAIResponse(message) {
    const m = message.toLowerCase();
    

    if (m.includes('умереть') || m.includes('покончить') || m.includes('не хочу жить') || 
        m.includes('умру') || m.includes('смерть') || m.includes('суицид') || 
        m.includes('режу себя') || m.includes('self-harm')) {
        return "🚨 СРОЧНАЯ ПОМОЩЬ! 🚨\n\n" +
               "Пожалуйста, немедленно позвоните по одному из номеров:\n\n" +
               "📞 112 — единая служба спасения (скорая помощь)\n" +
               "📞 8-800-200-0-122 — круглосуточная линия психологической поддержки\n\n" +
               "Вы не одни. Пожалуйста, обратитесь за помощью прямо сейчас.";
    }
    

    if (m.includes('дыхание') || m.includes('как успокоиться') || m.includes('тревога')) {
        return "🌬️ Техника «Дыхание квадрат»:\n\n" +
               "• Вдох на 4 счёта\n" +
               "• Задержка дыхания на 4 счёта\n" +
               "• Выдох на 4 счёта\n" +
               "• Задержка на 4 счёта\n\n" +
               "Повторите 5-10 раз. Это поможет снизить тревогу и вернуть контроль над телом.";
    }
    
    if (m.includes('заземление') || m.includes('grounding') || m.includes('отвлечься')) {
        return "🌍 Техника «5-4-3-2-1»:\n\n" +
               "Назовите:\n" +
               "• 5 предметов, которые вы видите вокруг\n" +
               "• 4 звука, которые вы слышите\n" +
               "• 3 тактильных ощущения (что вы чувствуете кожей)\n" +
               "• 2 запаха вокруг\n" +
               "• 1 вкус (даже глоток воды)\n\n" +
               "Это упражнение вернёт вас в «здесь и сейчас».";
    }
    
    if (m.includes('контейнер') || m.includes('мысль')) {
        return "📦 Техника «Контейнер для мыслей»:\n\n" +
               "Представьте металлический ящик с плотной крышкой. Положите туда тревожную мысль. Закройте крышку и отодвиньте ящик в угол. Вы можете вернуться к этой мысли позже, если захотите. А сейчас — вы в безопасности.";
    }
    
    if (m.includes('объелся') || m.includes('объелась') || m.includes('переел') || 
        m.includes('переела') || m.includes('срыв') || m.includes('сорвалась') || m.includes('сорвался')) {
        return "🤝 Срывы — это часть выздоровления.\n\n" +
               "Вы не сделали ничего плохого. Вы не провалились. Вы просто человек.\n\n" +
               "Давайте сделаем паузу:\n" +
               "1. Глубоко вдохните 3 раза\n" +
               "2. Следующий приём пищи будет обычным\n" +
               "3. Не пытайтесь «отработать» или голодать завтра\n\n" +
               "Завтра — новый день. Вы справитесь.";
    }
    

    if (m.includes('толстая') || m.includes('толстый') || m.includes('боюсь поправиться') || 
        m.includes('страх веса') || m.includes('поправлюсь') || m.includes('вес')) {
        return "💭 Страх набрать вес — это симптом РПП, а не реальность.\n\n" +
               "Ваше тело нуждается в питании. Страх — это голос болезни, а не голос истины.\n\n" +
               "Попробуйте прямо сейчас сказать себе:\n" +
               "«Я имею право на еду. Моё тело заслуживает заботы.»\n\n" +
               "А затем — техника заземления, чтобы вернуться в реальность.";
    }
    
    if (m.includes('стыд') || m.includes('вина') || m.includes('противно') || 
        m.includes('мерзко') || m.includes('отвратительно')) {
        return "💚 Чувство вины после еды — это симптом, а не правда.\n\n" +
               "Вы не сделали ничего плохого. Еда — это не преступление.\n\n" +
               "Попробуйте сказать себе:\n" +
               "«Я разрешаю себе есть. Моё тело нуждается в энергии. Я не обязана(ен) быть идеальной(ым).»\n\n" +
               "Вы заслуживаете доброты, особенно от самого себя.";
    }
    

    if (m.includes('никогда не выздоровею') || m.includes('безнадежно') || 
        m.includes('бесполезно') || m.includes('не могу') || m.includes('нет сил')) {
        return "🌱 Мысли «никогда» и «безнадёжно» — это ловушка РПП.\n\n" +
               "Выздоровление возможно. Маленькие шаги имеют огромное значение.\n\n" +
               "Что вы можете сделать прямо сейчас, чтобы позаботиться о себе?\n" +
               "• Выпить стакан воды\n" +
               "• Съесть маленькое печенье\n" +
               "• Просто посидеть и подышать 2 минуты\n\n" +
               "Один маленький шаг. Прямо сейчас. Вы справитесь.";
    }
    
  
    if (m.includes('тревог') || m.includes('страх') || m.includes('боюсь') || 
        m.includes('волнуюсь') || m.includes('паника') || m.includes('нервы')) {
        return "🌿 Тревога — это сигнал тела, но не приказ.\n\n" +
               "Попробуйте дыхание «Квадрат»:\n" +
               "🌬️ Вдох на 4 счёта\n" +
               "⏸️ Задержка на 4 счёта\n" +
               "🌬️ Выдох на 4 счёта\n" +
               "⏸️ Задержка на 4 счёта\n\n" +
               "Повторите 5-10 раз. Просто дышите. Всё будет хорошо.";
    }
    

    if (m.includes('голод') || m.includes('есть хочу') || m.includes('кушать') || 
        m.includes('проголодал') || m.includes('хочу есть')) {
        return "🍎 Голод — это естественный сигнал тела.\n\n" +
               "При РПП мы часто разучились ему доверять. Но ваше тело не врёт.\n\n" +
               "Съешьте что-то маленькое прямо сейчас — без оценки «хорошо/плохо». Просто как эксперимент.\n" +
               "Банан, печенье, ложка риса, стакан йогурта.\n\n" +
               "Вы имеете право утолить голод.";
    }
    

    if (m.includes('один') || m.includes('одна') || m.includes('никто не понимает') || 
        m.includes('никому не нужен') || m.includes('поддержка') || m.includes('помощь')) {
        return "💝 Вы не одиноки.\n\n" +
               "То, что вы здесь и пишете — уже большой и смелый шаг.\n" +
               "Я с вами. В этом сообществе есть люди, которые понимают.\n\n" +
               "Расскажите подробнее, что сейчас происходит? Ваши чувства важны.";
    }
    
  
    if (m.includes('привет') || m.includes('здравствуй') || m.includes('добрый день') || 
        m.includes('здравствуйте') || m.includes('хай') || m.includes('hello')) {
        return "🌤️ Здравствуйте!\n\n" +
               "Я ИИ-психолог. Я здесь, чтобы поддержать вас.\n\n" +
               "Расскажите, что вас тревожит сегодня? Я слушаю без осуждения.\n\n" +
               "Помните: я не заменяю врача, но я рядом.";
    }
    
 
    if (m.includes('кпт') || m.includes('когнитивно') || m.includes('автоматические мысли')) {
        return "📝 КПТ-упражнение для работы с мыслями:\n\n" +
               "1. Запишите мысль, которая вас мучает\n" +
               "2. Найдите 2 доказательства ЗА эту мысль\n" +
               "3. Найдите 2 доказательства ПРОТИВ этой мысли\n" +
               "4. Сформулируйте более сбалансированную, реалистичную мысль\n\n" +
               "Пример: «Я толстая» → «Моё тело имеет нормальный вес, просто РПП искажает восприятие».";
    }
    

    const defaultResponses = [
        "🌿 Я слышу вас. Расскажите подробнее, что происходит. Ваши чувства важны.",
        "💙 Спасибо, что делитесь. Каждый разговор — это шаг. Что сейчас для вас самое трудное?",
        "🤍 Я здесь, чтобы поддержать. Расскажите больше о том, что вы чувствуете прямо сейчас?",
        "✨ Вы не одиноки. Продолжайте делиться — я слушаю без осуждения."
    ];
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// ГИБРИДНЫЙ ИИ 
const OPENROUTER_API_KEY = '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';

app.post('/api/ai/chat', async (req, res) => {
    const { message, sessionId } = req.body;
    console.log(`[AI] ${sessionId}: ${message.substring(0, 100)}`);
    
    // Проверка кризисных ключевых слов(л окально, для скорости)
    const m = message.toLowerCase();
    if (m.includes('умереть') || m.includes('покончить') || m.includes('не хочу жить') || 
        m.includes('умру') || m.includes('смерть') || m.includes('суицид')) {
        return res.json({ 
            type: 'crisis', 
            response: getLocalAIResponse(message)
        });
    }
    
    // Попытка использовать OpenRouter (обычно перегружен, я проверила, к сожалению)
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.3-70b-instruct:free',
                messages: [
                    { 
                        role: 'system', 
                        content: 'Ты — поддерживающий ИИ-психолог, специализирующийся на расстройствах пищевого поведения (РПП). Ты не ставишь диагнозы, не назначаешь лечение, но даёшь эмпатичную поддержку, предлагаешь техники заземления и дыхания, направляешь к специалистам. Твои ответы короткие, тёплые, на русском языке. Всегда отвечай на русском языке.' 
                    },
                    { role: 'user', content: message }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        
        if (!data.error && data.choices && data.choices[0]) {
            console.log(`✅ OpenRouter успешно ответил`);
            return res.json({ type: 'normal', response: data.choices[0].message.content });
        }
        
        console.log(`⚠️ OpenRouter error: ${data.error?.message || 'unknown'}, используем локальный ИИ`);
        
    } catch (error) {
        console.log(`⚠️ OpenRouter недоступен: ${error.message}, используем локальный ИИ`);
    }
    
    // Если OpenRouter не ответил — используется локальный ИИ
    const localResponse = getLocalAIResponse(message);
    return res.json({ type: 'normal', response: localResponse });
});

//ОБЩИЙ ЧАТ
let chatMessages = [
    { id: 1, author: "Спокойствие", text: "Сегодня удалось позавтракать без тревоги", userId: "system", time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) },
    { id: 2, author: "Тишина", text: "Это прекрасно! Я тоже делаю маленькие шаги", userId: "system", time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) },
    { id: 3, author: "Лучик", text: "Поддерживаю вас обоих. Мы справимся", userId: "system", time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }
];

const FORBIDDEN_WORDS = [
    'диета', 'диеты', 'голодание', 'голодаю', 'ккал', 'калории', 'кг', 'похудеть',
    'сбросить вес', 'тощая', 'дрыщ', 'вес', 'жир', 'анорексия', 'булимия',
    'умру', 'умираю', 'умереть', 'покончить с собой', 'суицид',
    'рвота', 'слабительное', 'клизма', 'толстая', 'толстый'
];

app.get('/api/chat/messages', (req, res) => {
    res.json(chatMessages);
});

app.post('/api/chat/message', (req, res) => {
    const { author, text, userId } = req.body;
    const lowerText = text.toLowerCase();
    
    for (let word of FORBIDDEN_WORDS) {
        if (lowerText.includes(word)) {
            console.log(`🚫 Блокировка: "${word}" от ${author}`);
            return res.status(403).json({ error: `❌ Сообщение содержит запрещённое слово: "${word}"` });
        }
    }
    
    const newMessage = {
        id: Date.now(),
        author,
        text: text.substring(0, 500),
        userId,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    
    chatMessages.push(newMessage);
    if (chatMessages.length > 100) chatMessages.shift();
    res.json(newMessage);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`
    ═══════════════════════════════════════════════════
    EaseMind сервер запущен!
    Откройте: http://localhost:${PORT}
    ═══════════════════════════════════════════════════
    `);
});
