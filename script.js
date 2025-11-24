/* ==========================================================================
   DADOS JSON
   ========================================================================== */
let articleData = [];

/* ==========================================================================
   POSICIONAMENTO DINÂMICO
   ========================================================================== */

const positions = {
    1: [
        { top: "10%", left: "50%", transform: "translateX(-50%) scale(1.1)" }
    ],
    2: [
        { top: "20%", left: "5%", transform: "perspective(800px) rotateY(15deg) scale(1)" },
        { top: "20%", right: "5%", transform: "perspective(800px) rotateY(-15deg) scale(1)" }
    ],
    3: [
        { top: "0%", left: "5%", transform: "perspective(800px) rotateY(15deg) scale(0.9)" },
        { top: "5%", right: "5%", transform: "perspective(800px) rotateY(-15deg) scale(0.9)" },
        { bottom: "10%", left: "50%", transform: "translateX(-50%) scale(0.9)" }
    ]
};


const fibonacciOrder = [1, 2, 3, 4, 5, 6, 7, 8];
const cardContainer = document.querySelector('.card-container');
const bgAudio = document.getElementById('bg-audio');
const jumpscareAudio = document.getElementById('jumpscare-audio');

let isAudioStarted = false;

/* ==========================================================================
   VARIÁVEIS DE ESTADO
   ========================================================================== */

const TOTAL_CARDS = fibonacciOrder.length; 
let cardsRevealedCount = 0; 
const REVEAL_SEQUENCE = [1, 1, 2, 3, 1]; 
let currentCycle = 1;
let sequenceIndex = 0;
const FLASH_WORDS = [
    "NIHIL", 
    "CARCOSA",
    "YELLOW SIGN", 
    "ACHTUNG", 
    "未定"
];

/* ==========================================================================
   FUNÇÕES
   ========================================================================== */

function createCard(id, position) {
    const article = articleData.find(item => item.id === id);

    if (article) {
        const newFragment = document.createElement('div');
        newFragment.className = article.class ? `text-fragment ${article.class}` : 'text-fragment';

        const pos = position;
        if (pos) {
            newFragment.style.top = pos.top || "auto";
            newFragment.style.left = pos.left || "auto";
            newFragment.style.right = pos.right || "auto";
            newFragment.style.bottom = pos.bottom || "auto";
            newFragment.style.transform = pos.transform || "";
        }

        let finalContent = '';
        // Verifica se o conteúdo é um array (nova estrutura) ou uma string (antiga)
        if (Array.isArray(article.content)) {
            // Constrói o conteúdo como uma única string com quebras de linha,
            // em vez de múltiplos elementos <p>. Isso é crucial para o efeito de digitação.
            finalContent = article.content.map(block => {
                let blockText = '';
                block.parts.forEach(part => {
                    if (part.style === 'damaged') {
                        blockText += `<span class="damaged-text">${part.text}</span>`;
                    } else {
                        blockText += part.text;
                    }
                });
                return blockText;
            }).join('<br>'); // Usa uma única quebra de linha.
        } else {
            // Lógica antiga para retrocompatibilidade e para os cards que não foram alterados
            finalContent = article.content.replace(/\n/g, '<br>');
        }

        // Para o card 7, a lógica de substituição de placeholders continua a mesma,
        // mas agora ela opera sobre o conteúdo já processado (seja string ou HTML gerado).
        if (id === 7) {
            finalContent = executeLaplaceDemon(finalContent);
        }

        const linkTexto = article.linkText || "Acessar Referência";

        // A estrutura agora é sempre a mesma, com o conteúdo dentro de um único <p>.
        newFragment.innerHTML = `
            <h2 data-text="${article.title}">${article.title}</h2>
            <p class="card-content">${finalContent}</p>
            <a href="${article.link}" target="_blank">${linkTexto}</a>
        `;
        
        cardContainer.appendChild(newFragment);
    }
}

function revealNextCards() {
    if (cardsRevealedCount >= TOTAL_CARDS) {
        triggerSpiralSequence();
        return; 
    }

    let cardsToReveal = REVEAL_SEQUENCE[sequenceIndex] || 0;
    
    if (cardsRevealedCount + cardsToReveal > TOTAL_CARDS) {
        cardsToReveal = TOTAL_CARDS - cardsRevealedCount;
    }

    // Limpa o container e adiciona a classe de contagem
    cardContainer.innerHTML = '';
    cardContainer.className = `card-container card-count-${cardsToReveal}`;

    const effectType = sequenceIndex; // 0, 1, 2, 3, 4
    
    for (let i = 0; i < cardsToReveal; i++) {
        const positionSet = positions[cardsToReveal] || positions[1];
        const cardPosition = positionSet[i];
        const nextIndex = cardsRevealedCount + i;
        if (nextIndex < TOTAL_CARDS) {
            const cardId = fibonacciOrder[nextIndex];
            // A função createCard agora não mostra o card, apenas o cria.
            createCard(cardId, cardPosition); 
        }
    }


    // Aplica os efeitos de aparição com base na etapa (sequenceIndex)
    const fragments = cardContainer.querySelectorAll('.text-fragment');
    fragments.forEach((fragment, i) => {
        const content = fragment.querySelector('.card-content');
        const originalHTML = content.innerHTML;

        switch (effectType) {
            case 0: // 1. Só aparece
                fragment.style.transition = 'none';
                fragment.style.opacity = '1';
                break;
            case 1: // 2. Máquina de escrever
                fragment.style.opacity = '1';
                // CORREÇÃO: A lógica agora lida com tags HTML para não "digitá-las".
                const htmlToType = content.innerHTML;
                content.innerHTML = '';
                let htmlIndex = 0;
                const typingInterval = setInterval(() => {
                    if (htmlIndex < htmlToType.length) {
                        // Se encontrar uma tag HTML (como <br> ou <span>), insere a tag inteira de uma vez.
                        if (htmlToType[htmlIndex] === '<') {
                            const tagEndIndex = htmlToType.indexOf('>', htmlIndex);
                            if (tagEndIndex !== -1) {
                                content.innerHTML += htmlToType.substring(htmlIndex, tagEndIndex + 1);
                                htmlIndex = tagEndIndex;
                            }
                        } else {
                            content.innerHTML += htmlToType.charAt(htmlIndex);
                        }
                        htmlIndex++;
                    } else {
                        clearInterval(typingInterval);
                    }
                }, 15); // Velocidade da digitação
                break;
            case 3: // 4. Súbito, um após o outro
                setTimeout(() => {
                    fragment.style.transition = 'none';
                    fragment.style.opacity = '1';
                }, i * 200); // Atraso de 200ms entre cada um
                break;
            case 4: // 5. Scramble
                fragment.style.opacity = '1';
                scrambleText(content, 1500);
                break;
            case 2: // 3. Deixa como está (fade-in) - Default
            default:
                setTimeout(() => {
                    fragment.style.opacity = '1';
                }, 50);
                break;
        }
    });


    cardsRevealedCount += cardsToReveal;
    sequenceIndex++;
}


function executeLaplaceDemon(contentString) {
    const now = new Date();
    const horaAtual = now.toLocaleTimeString();
    const dataAtual = now.toLocaleDateString();
    const segundosFuturos = Math.floor(Math.random() * 6) + 5; 
    const tempoFuturo = new Date(now.getTime() + (segundosFuturos * 1000));
    const horaPrevista = tempoFuturo.toLocaleTimeString();
    const nextTitle = "A INTERFACE";

    // A função agora apenas retorna a string processada
    return contentString
        .replace('[HORA_ATUAL]', horaAtual)
        .replace('[DATA_ATUAL]', dataAtual)
        .replace('[SEGUNDOS_PROXIMA_ACAO]', segundosFuturos)
        .replace('[HORA_PREVISTA]', horaPrevista)
        .replace('[PROXIMO_TITULO]', nextTitle);
}

function scrambleText(el, duration = 1200) {
    // Salva o HTML original para restaurá-lo no final, preservando tags como <span>.
    const originalHTML = el.innerHTML;
    
    // Cria um nó temporário para extrair o texto puro sem destruir o original.
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = originalHTML;
    const originalText = tempDiv.textContent || "";

    const chars = '!<>-_\\/[]{}—=+*^?#';
    let start = null;
    const len = originalText.length;

    // Limpa o elemento para começar a animação.
    el.innerHTML = '';

    function step(ts) {
        if (!start) start = ts;
        const progress = (ts - start) / duration;

        if (progress >= 1) {
            el.innerHTML = originalHTML; // Animação concluída, restaura o HTML original.
            return;
        }

        let scrambledText = '';
        for (let i = 0; i < len; i++) {
            // Se o caractere original for um espaço, mantém o espaço para legibilidade.
            if (originalText[i] === ' ' || originalText[i] === '\n' || originalText[i] === '\t') {
                scrambledText += originalText[i];
            } else {
                // Decide se mostra o caractere original ou um aleatório com base no progresso.
                if (Math.random() < progress * 1.5) { // O fator 1.5 acelera a revelação
                    scrambledText += originalText[i];
                } else {
                    scrambledText += chars[Math.floor(Math.random() * chars.length)];
                }
            }
        }
        el.textContent = scrambledText; // Atualiza o texto visível.
        requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function triggerSpiralSequence() {
    if (document.querySelector('.spiral-sequence')) return;

    cardContainer.innerHTML = '';

    const spiralCard = document.createElement('div');
    spiralCard.className = 'text-fragment spiral-sequence';
    spiralCard.style.opacity = '1';

    const spiralAscii = `
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@%#*+=-:.......:........:-........:=#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@%+-:....:............:-::...::*#=-..........:+-.:*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@*......=...........:..... .......:..-+-::.=.....:.:......+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@=........................::-=+***+--:...:+..:....:.........=@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@*.:......::-=+*#%%@@@@@@@@@@@@@@@@@@@@@@@#+=.............::..=@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%*.:..:.-.:.....-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#=............#@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=............+@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+............%@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%....:.....#=#@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-..:.-.:.::.%@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@%%###%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+.:..:-=+..-@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@%=:..................:-=#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*..-.......*@@@@@@@@@@@@@@@
    @@@@@@@@@@@@=....:......................  ...+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+.....:...:@@@@@@@@@@@@@@
    @@@@@@@@@%:........=....:.........:................+#@@@@@@@@@@@@@@@@@@@@@@@@=....-....+@@@@@@@@@@@@
    @@@@@@@@=.........:.:::.-=++**++=-:.:.....:.... .  .....-=#@@@@@@@@@@@@@@@@@@@@-.::......%@@@@@@@@@@
    @@@@@@@:...:....=#%@@@@@@@@@@@@@@@@@@@@%+:.:..................-%@@@@@@@@@@@@@@@@@.........=@@@@@@@@@
    @@@@@@-......*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#:.:-:.:=............=@@@@@@@@@@@@@@@*.........#@@@@@@@
    @@@@@*:.....=@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=:.......:......-.-:=@@@@@@@@@@@@@@-:.......-%@@@@@
    @@@@#......:@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%=...:::....:=:-...:%@@@@@@@@@@@@#........:-@@@@
    @@@@:......@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=....:.::-+==:--%@@@@@@@@@@@@:.........*@@
    @@@+......-@@@@@@@@@@@@@@@@@@@@@@%*=-::-+#@@@@@@@@@@@@@@@@@@@@%-......:-=-.-@@@@@@@@@@@@*.........=@
    @@@:......%@@@@@@@@@@@@@@@@@@*-............:@@@@@@@@@@@@@@@@@@@@@@#...:......%@@@@@@@@@@@%.........*
    @@%....  :@@@@@@@@@@@@@@@@#:...............:@@@@@@@@@@@@@@@@@@@@@@@@@-.       %@@@@@@@@@@@#........=
    @@-....  =@@@@@@@@@@@@@@=....:-..........-@@@@@@@@@@@@@@@@@@@@@@@@@@@@#...    .@@@@@@@@@@@@-.. ....+
    @@.......+@@@@@@@@@@@@*....:...-#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%.......*@@@@@@@@@@@:.....:.%
    @%.......*@@@@@@@@@@@-.......*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+......+@@@@@@@@@@*...::..+@
    @%..-::..*@@@@@@@@@@*.-.....%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*......*@@@@@@@@@+.::....-@@
    @%..=-:-.+@@@@@@@@@@=......=@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*......:@@@@@@@@@:....:..:@@@
    @%..--:..-@@@@@@@@@@+:......+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#+:.......:@@@@@@@@=........=@@@@
    @@.:.=-+..@@@@@@@@@@@-:.....:.-%@@@@@@@@@@@@@@@@@@@@@@@@@@@@*=-.............#@@@@@@@=.........*@@@@@
    @@-+.-+...+@@@@@@@@@@@:...........:#@@@@@@@@@@@@@@@@@*:.....-:.:..........%@@@@@@@:..........@@@@@@@
    @@=.::.-:..@@@@@@@@@@@@#:.......:..:..-.:.......:..........:..........:*@@@@@@@%:.........:#@@@@@@@@
    @@@:::.....-@@@@@@@@@@@@@@=......::....:...:...:......:.:.........:+%@@@@@@@@*::......:::+@@@@@@@@@@
    @@@-.....:..+@@@@@@@@@@@@@@@@%=.....-:-:.::.............:....-*%@@@@@@@@@@@=.....-.::#*+@@@@@@@@@@@@
    @@@@....-.:..*@@@@@@@@@@@@@@@@@@@@@*:.::-.-...........-*@@@@@@@@@@@@@@@@@.....  .....=@@@@@@@@@@@@@@
    @@@@*...:.:...+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+.......  ...*@@@@@@@@@@@@@@@@
    @@@@@+:.-:.....-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-::.......  :%@@@@@@@@@@@@@@@@@@
    @@@@@@=:.:......:%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*.:.==-......-@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@*.....:...:.%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+...:::..::....*@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@%:.-.... ....+%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%#*=....:.:-*=--:...:%@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@#.:.............-==++**#*++==---:::.........::.......-+#==--*%@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@*:........:....................:...........:...-.:..:*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@*:..........................:-...:.......:-*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@%#*+=--:.............:-===**#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    `;

    spiralCard.innerHTML = `
        <pre class="spiral-ascii">${spiralAscii}</pre>
        <p class="spiral-question">ΘΕΛΕΤΕ ΝΑ ΜΠΕΙΤΕ ΣΤΗ ΣΠΙΡΑΛ;</p>
        <div class="spiral-options">
            <span id="spiral-yes">Θετικό
</span>
            <span id="spiral-no">Αρνητικό</span>
        </div>
    `;

    cardContainer.appendChild(spiralCard);

    document.getElementById('spiral-no').addEventListener('click', (e) => {
        e.stopPropagation();

        // Simula o "crash" do site
        if (bgAudio) bgAudio.pause();
        if (timestampInterval) clearInterval(timestampInterval);

        // 1. Remove a espiral da tela.
        cardContainer.innerHTML = '';
        document.body.style.pointerEvents = 'none'; // Desativa todos os cliques futuros

        // 2. Cria um único container para a cena final, que será controlado pelo CSS.
        const blackScreen = document.createElement('div');
        blackScreen.className = 'black-screen-fade';
        blackScreen.innerHTML = `<p class="final-message">NON-EXISTENTIAM APPRECIARE</p>`;
        document.body.appendChild(blackScreen);
    });

    document.getElementById('spiral-yes').addEventListener('click', (e) => {
        e.stopPropagation(); // Impede que o clique propague para o body e pule um card.

        let cycleCounter = document.getElementById('cycle-counter');
        if (!cycleCounter) {
            cycleCounter = document.createElement('div');
            cycleCounter.id = 'cycle-counter';
            document.body.appendChild(cycleCounter);
        }
        currentCycle++;
        cycleCounter.textContent = currentCycle;
        
        // Reinicia o jogo
        cardsRevealedCount = 0;
        sequenceIndex = 0;
        revealNextCards();
    });
}

function triggerNumenoJumpscare() {
    if (document.getElementById('numeno-jumpscare')) return;

    if (jumpscareAudio) jumpscareAudio.play();

    // Adiciona a classe para chacoalhar a tela inteira
    document.body.classList.add('screen-shake');

    const jumpscareDiv = document.createElement('div');
    jumpscareDiv.id = 'numeno-jumpscare';
    jumpscareDiv.style.position = 'fixed';
    jumpscareDiv.style.top = '0'; jumpscareDiv.style.left = '0';
    jumpscareDiv.style.width = '100%'; jumpscareDiv.style.height = '100%';
    jumpscareDiv.style.backgroundColor = '#d0e429'; 
    jumpscareDiv.style.zIndex = '99';
    jumpscareDiv.style.display = 'flex';
    jumpscareDiv.style.alignItems = 'center';
    jumpscareDiv.style.justifyContent = 'center';
    jumpscareDiv.style.pointerEvents = 'none';
    jumpscareDiv.style.opacity = '0'; 
    jumpscareDiv.style.transition = 'opacity 0.1s ease-in-out';
    
    jumpscareDiv.innerHTML = `
        <h1 class="shaking-text" style="font-size: 5vw; color: black; text-align: center;">VOCÊ NÃO ACESSARÁ O NÚMENO</h1>
    `;
    
    document.body.appendChild(jumpscareDiv);

    requestAnimationFrame(() => {
        setTimeout(() => { jumpscareDiv.style.opacity = '1'; }, 10);
    });
    
    setTimeout(() => {
        jumpscareDiv.style.opacity = '0';
        // Remove a classe do body quando o jumpscare termina
        document.body.classList.remove('screen-shake');
        setTimeout(() => { jumpscareDiv.remove(); }, 150);
    }, 1200);
}

function triggerFlash() {
    if (jumpscareAudio) {
        jumpscareAudio.playbackRate = 2.5; // 150% mais rápido para o flash
        jumpscareAudio.currentTime = 0;
        jumpscareAudio.play();
    }

    const flashDiv = document.createElement('div');
    flashDiv.style.position = 'fixed';
    flashDiv.style.top = '0'; flashDiv.style.left = '0';
    flashDiv.style.width = '100%'; flashDiv.style.height = '100%';
    flashDiv.style.backgroundColor = '#d0e429';
    flashDiv.style.zIndex = '99';
    flashDiv.style.display = 'flex';
    flashDiv.style.alignItems = 'center';
    flashDiv.style.justifyContent = 'center';
    flashDiv.style.pointerEvents = 'none';
    
    const randomWord = FLASH_WORDS[Math.floor(Math.random() * FLASH_WORDS.length)];

    flashDiv.innerHTML = `<h1 style="font-size: 8vw; color: black; font-family: 'IM Fell English SC';">${randomWord}</h1>`;
    
    document.body.appendChild(flashDiv);
    setTimeout(() => { flashDiv.remove(); }, 150);
}

function triggerNoNumenJumpscare() {
    if (document.getElementById('no-numen-jumpscare')) return;

    if (jumpscareAudio) {
        jumpscareAudio.playbackRate = 2.0; // Mantido em 100% mais rápido para o jumpscare da busca
        jumpscareAudio.currentTime = 0;
        jumpscareAudio.play();
    }

    document.body.classList.add('screen-shake-vigorous');

    const jumpscareDiv = document.createElement('div');
    jumpscareDiv.id = 'no-numen-jumpscare';
    jumpscareDiv.style.position = 'fixed';
    jumpscareDiv.style.top = '0'; jumpscareDiv.style.left = '0';
    jumpscareDiv.style.width = '100%'; jumpscareDiv.style.height = '100%';
    jumpscareDiv.style.backgroundColor = '#d0e429';
    jumpscareDiv.style.zIndex = '99';
    jumpscareDiv.style.display = 'flex';
    jumpscareDiv.style.alignItems = 'center';
    jumpscareDiv.style.justifyContent = 'center';
    jumpscareDiv.style.pointerEvents = 'none';
    jumpscareDiv.style.opacity = '0';
    jumpscareDiv.style.transition = 'opacity 0.1s ease-in-out';

    jumpscareDiv.innerHTML = `
        <h1 class="shaking-text-vigorous" style="font-size: 5vw; color: black; text-align: center;">ПРАВДА НЕ НАЙДЕНА</h1>
    `;

    document.body.appendChild(jumpscareDiv);

    requestAnimationFrame(() => {
        setTimeout(() => { jumpscareDiv.style.opacity = '1'; }, 10);
    });

    /* ==========================================================================
       INICIALIZAÇÃO FINAL
       ========================================================================== */
       
    let timestampInterval;
    setTimeout(() => {
        jumpscareDiv.style.opacity = '0';
        document.body.classList.remove('screen-shake-vigorous');
        setTimeout(() => { jumpscareDiv.remove(); }, 150);
    }, 800); // Reduzido para 800ms para um efeito mais rápido
}

// MODIFICADO: A função foi reescrita para criar um timestamp "impossível".
function updateTimestamp() {
    const timestampEl = document.querySelector('.vhs-timestamp');
    if (!timestampEl) return;

    // 1. Pega a data e hora atuais.
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();

    // 2. Calcula os valores "impossíveis" sem deixar o tempo "virar".
    const impossibleHour = currentHour + 25;
    const impossibleMinute = currentMinute + 70;
    const impossibleSecond = currentSecond + 70;

    // 3. Monta a string final com a data estática e a hora impossível.
    timestampEl.textContent = `Feb 31, 9119, ${impossibleHour}:${impossibleMinute}:${impossibleSecond}`;
}

async function initializeApp() {
    // CORREÇÃO: Garante que cardContainer seja pego do DOM depois de carregado.

    try {
        const response = await fetch('data.json');
        articleData = await response.json();
    } catch (error) {
        console.error("Failed to load article data:", error);
        // Handle error, maybe show a message to the user
        return;
    }
    
    sequenceIndex = 0; // Reset sequence on load

    document.body.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('a')) {
            return;
        }

        if (!isAudioStarted && bgAudio) {
            bgAudio.volume = 0.3;
            const playPromise = bgAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Audio playback failed:", error);
                });
            }
            isAudioStarted = true;
        }

        revealNextCards();
        if (Math.random() < 0.20) triggerFlash(); // A chance foi ajustada para 20%
    });

    // Adiciona o elemento do timestamp ao corpo do documento se ele não existir.
    // Isso garante que o script funcione mesmo que o elemento não esteja no HTML.
    if (!document.querySelector('.vhs-timestamp')) {
        const timestampEl = document.createElement('div');
        timestampEl.className = 'vhs-timestamp';
        document.body.appendChild(timestampEl);
    }

    // Inicia a atualização do timestamp.
    updateTimestamp();
    timestampInterval = setInterval(updateTimestamp, 1000);

    // Create and append the search bar
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
        <div id="search-suggestions"></div>
        <input type="text" id="eerie-search-bar" />
    `;
    document.body.appendChild(searchContainer);

    const searchInput = document.getElementById('eerie-search-bar');
    const suggestionsContainer = document.getElementById('search-suggestions');
    const suggestions = ["NO", "NÃO", "NEIN", "いいえ", "НЕТ"];

    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim() !== '') {
            suggestionsContainer.innerHTML = suggestions.map(s => `<div>${s}</div>`).join('');
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            triggerNoNumenJumpscare();
            searchInput.value = '';
            suggestionsContainer.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);
