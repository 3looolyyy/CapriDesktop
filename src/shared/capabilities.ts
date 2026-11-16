/**
 * Everything Capri can do, in one place: what it is, how to ask for it in each of her languages, where
 * it lives in the app and on which systems it works. Her help answers ("how do I make you stay still?",
 * "what can you do?"), the Help tab in Settings and the manual the model gets all come from here.
 *
 * The example phrases ("say") are real commands: scripts/test-capabilities.mjs checks that each one
 * triggers its command, so this file can't drift from what she actually understands. In the texts,
 * {say} and {say2} become the first and second example, and {hotkey:action} the user's own key.
 */
import type { HotkeyAction } from './hotkeys'

export type HelpLang = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'ru' | 'ja' | 'ko' | 'zh'
export const HELP_LANGS: HelpLang[] = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ru', 'ja', 'ko', 'zh']

export type CapabilityCategory = 'move' | 'voice' | 'screen' | 'gaming' | 'party' | 'music' | 'pc' | 'memory' | 'create' | 'app'

/** How the example phrases are recognized, for the test: a phrase list in spoken-commands, or a command */
export type CapabilityCheck = 'hold' | 'move' | 'watch' | 'stopWatch' | 'apps' | 'version'

export interface Capability {
  id: string
  category: CapabilityCategory
  /** Systems it works on (all when missing) */
  platforms?: ('win32' | 'linux' | 'darwin')[]
  /** The English commands the examples turn into (command-translations), {x}/{w} for the free part */
  commands?: string[]
  check?: CapabilityCheck
  /** Example phrases per language; the first one is the one she quotes */
  say: Partial<Record<HelpLang, string[]>>
  /** Words that only mean this feature of hers: enough on their own in a help question (no accents) */
  keywords: string[]
  /**
   * Words that also mean other things ("app", "version", "music"): they count only when the question
   * is about her ("how do I hide you?"), so "how do I update node?" isn't taken for a help question
   */
  generic?: string[]
  /** [title, how to use it] per language */
  text: Record<HelpLang, [string, string]>
}

export const CATEGORY_TITLES: Record<CapabilityCategory, Record<HelpLang, string>> = {
  move: { en: 'Moving around', es: 'Moverme', pt: 'Me mexer', fr: 'Me déplacer', de: 'Bewegung', it: 'Muovermi', ru: 'Движение', ja: '動き', ko: '움직임', zh: '移动' },
  voice: { en: 'Talking', es: 'Hablar', pt: 'Conversar', fr: 'Parler', de: 'Sprechen', it: 'Parlare', ru: 'Разговор', ja: '会話', ko: '대화', zh: '对话' },
  screen: { en: 'Your screen', es: 'Tu pantalla', pt: 'Sua tela', fr: 'Ton écran', de: 'Dein Bildschirm', it: 'Il tuo schermo', ru: 'Твой экран', ja: '画面', ko: '화면', zh: '你的屏幕' },
  gaming: { en: 'Gaming', es: 'Gaming', pt: 'Jogos', fr: 'Jeux', de: 'Gaming', it: 'Giochi', ru: 'Игры', ja: 'ゲーム', ko: '게임', zh: '游戏' },
  party: { en: 'Watching together', es: 'Ver juntos', pt: 'Assistir juntos', fr: 'Regarder ensemble', de: 'Zusammen schauen', it: 'Guardare insieme', ru: 'Смотреть вместе', ja: '一緒に見る', ko: '같이 보기', zh: '一起看' },
  music: { en: 'Music', es: 'Música', pt: 'Música', fr: 'Musique', de: 'Musik', it: 'Musica', ru: 'Музыка', ja: '音楽', ko: '음악', zh: '音乐' },
  pc: { en: 'Your PC', es: 'Tu PC', pt: 'Seu PC', fr: 'Ton PC', de: 'Dein PC', it: 'Il tuo PC', ru: 'Твой ПК', ja: 'PC操作', ko: 'PC', zh: '你的电脑' },
  memory: { en: 'Memory and macros', es: 'Memoria y macros', pt: 'Memória e macros', fr: 'Mémoire et macros', de: 'Gedächtnis und Makros', it: 'Memoria e macro', ru: 'Память и макросы', ja: '記憶とマクロ', ko: '기억과 매크로', zh: '记忆和宏' },
  create: { en: 'Drawing', es: 'Dibujar', pt: 'Desenhar', fr: 'Dessiner', de: 'Zeichnen', it: 'Disegnare', ru: 'Рисование', ja: 'お絵描き', ko: '그림', zh: '画画' },
  app: { en: 'The app', es: 'La app', pt: 'O app', fr: "L'appli", de: 'Die App', it: "L'app", ru: 'Приложение', ja: 'アプリ', ko: '앱', zh: '应用' }
}

export const CAPABILITIES: Capability[] = [
  {
    id: 'hold-still',
    category: 'move',
    check: 'hold',
    say: {
      en: ['stay still'], es: ['quedate quieta'], pt: ['fica quieta'], fr: ['ne bouge pas'], de: ['bleib stehen'], it: ['stai ferma'],
      ru: ['не двигайся'], ja: ['動かないで'], ko: ['움직이지 마'], zh: ['别动']
    },
    keywords: ['stay still', 'stand still', 'hold still', 'keep still', 'stop walking around', 'walking around', 'wander', 'roam', 'quedes quieta', 'quieta', 'dejes de caminar', 'fique parada', 'fica parada', 'ficar parada', 'ficar quieta', 'stillhalten', 'stillzuhalten', 'still zu halten', 'stare ferma', 'stia ferma', 'не двигалась', 'じっと', '歩き回', '가만히', '돌아다니', '别动', '不要动', '走来走去', '乱动'],
    generic: ['stop moving', 'stop walking', 'moving around', 'quieto', 'muevas', 'moverte', 'moviendo', 'camines', 'caminando', 'se mexer', 'parar de andar', 'immobile', 'bouge', 'bouger', 'stehen bleib', 'herumlaufen', 'beweg', 'muoverti', 'стояла', 'не ходила', 'двигаться', '動かない', '움직이지', '待着'],
    text: {
      en: ['Stay still or roam', 'Tell me {say} and I stop wandering and stay right there. When you want me walking around again, say "you can move".'],
      es: ['Quedarme quieta o pasear', 'Decime {say} y dejo de caminar, me quedo ahí. Cuando quieras que vuelva a pasear, decime "ya podés moverte".'],
      pt: ['Ficar parada ou passear', 'Me diga {say} e eu paro de andar e fico ali. Quando quiser que eu volte a passear, diga "pode se mexer".'],
      fr: ['Rester immobile ou me balader', 'Dis-moi {say} et j\'arrête de me promener, je reste là. Pour que je recommence à marcher, dis "tu peux bouger".'],
      de: ['Stillhalten oder herumlaufen', 'Sag mir {say} und ich höre auf herumzulaufen und bleibe genau dort. Wenn ich wieder laufen soll, sag "du kannst dich bewegen".'],
      it: ['Stare ferma o passeggiare', 'Dimmi {say} e smetto di girare, resto lì. Quando vuoi che torni a camminare, dimmi "puoi muoverti".'],
      ru: ['Стоять на месте или гулять', 'Скажи мне {say}, и я перестану ходить и останусь на месте. Чтобы я снова гуляла, скажи «можешь двигаться».'],
      ja: ['じっとする・歩き回る', '{say}と言えば、歩くのをやめてその場にいるよ。また歩いてほしい時は「動いていいよ」って言ってね。'],
      ko: ['가만히 있기 / 돌아다니기', '{say}라고 말하면 돌아다니지 않고 그 자리에 있을게. 다시 돌아다니게 하려면 "움직여도 돼"라고 말해줘.'],
      zh: ['待着别动 / 到处走', '对我说{say}，我就不再走来走去，待在原地。想让我再走动，就说“可以动了”。']
    }
  },
  {
    id: 'size-monitor',
    category: 'move',
    say: {},
    keywords: ['your size', 'make you bigger', 'make you smaller', 'resize you', 'tu tamano', 'agrandarte', 'achicarte', 'seu tamanho', 'ta taille', 'deine grosse', 'tua dimensione', 'твой размер'],
    generic: ['which monitor', 'other monitor', 'mas grande', 'mas chica', 'mas pequena', 'otro monitor', 'que monitor', 'maior', 'menor', 'outro monitor', 'plus grande', 'plus petite', 'autre ecran', 'grosser', 'kleiner', 'anderen monitor', 'piu grande', 'piu piccola', 'altro monitor', 'больше', 'меньше', 'другой монитор', 'サイズ', '大きく', '小さく', 'モニター', '크기', '크게', '작게', '모니터', '大小', '变大', '变小', '显示器'],
    text: {
      en: ['Size and monitor', 'Hold Ctrl and turn the mouse wheel over me to make me bigger or smaller. Which monitor I live on is in Settings > Capri.'],
      es: ['Tamaño y monitor', 'Mantené Ctrl y girá la rueda del mouse encima mío para agrandarme o achicarme. En qué monitor vivo se elige en Configuración > Capri.'],
      pt: ['Tamanho e monitor', 'Segure Ctrl e gire a roda do mouse em cima de mim para me aumentar ou diminuir. Em qual monitor eu fico está em Configurações > Capri.'],
      fr: ['Taille et écran', 'Maintiens Ctrl et tourne la molette de la souris sur moi pour m\'agrandir ou me rapetisser. L\'écran où je vis se choisit dans Paramètres > Capri.'],
      de: ['Größe und Monitor', 'Halte Strg und dreh das Mausrad über mir, um mich größer oder kleiner zu machen. Auf welchem Monitor ich lebe, stellst du unter Einstellungen > Capri ein.'],
      it: ['Dimensione e monitor', 'Tieni premuto Ctrl e gira la rotella del mouse sopra di me per ingrandirmi o rimpicciolirmi. Il monitor su cui vivo si sceglie in Impostazioni > Capri.'],
      ru: ['Размер и монитор', 'Зажми Ctrl и покрути колёсико мыши надо мной, чтобы сделать меня больше или меньше. На каком мониторе я живу, выбирается в Настройки > Capri.'],
      ja: ['サイズとモニター', '私の上でCtrlを押しながらマウスホイールを回すと、大きくしたり小さくしたりできるよ。どのモニターにいるかは設定 > Capriで選べるよ。'],
      ko: ['크기와 모니터', '내 위에서 Ctrl을 누른 채 마우스 휠을 돌리면 나를 키우거나 줄일 수 있어. 어느 모니터에 있을지는 설정 > Capri에서 고를 수 있어.'],
      zh: ['大小和显示器', '在我身上按住 Ctrl 滚动鼠标滚轮，就能把我变大或变小。我待在哪个显示器上，可以在设置 > Capri 里选。']
    }
  },
  {
    id: 'away',
    category: 'move',
    say: {},
    keywords: [],
    generic: ['hide', 'away', 'disappear', 'go away', 'leave me', 'escond', 'ocult', 'desaparec', 'esconder', 'sumir', 'cacher', 'disparai', 'verstecken', 'verschwind', 'nascond', 'sparire', 'спрят', 'исчез', '隠れ', '消え', '숨', '사라', '隐藏', '躲', '消失'],
    text: {
      en: ['Send me away', 'Press {hotkey:away} and I hide and stay quiet; press it again, or use Show Capri in the tray, to bring me back.'],
      es: ['Mandarme a descansar', 'Apretá {hotkey:away} y me escondo y me quedo callada; apretalo de nuevo, o usá Mostrar Capri en la bandeja, para que vuelva.'],
      pt: ['Me mandar sumir', 'Aperte {hotkey:away} e eu me escondo e fico quieta; aperte de novo, ou use Mostrar Capri na bandeja, para eu voltar.'],
      fr: ['M\'envoyer me cacher', 'Appuie sur {hotkey:away} et je me cache en silence ; appuie à nouveau, ou utilise Afficher Capri dans la barre des tâches, pour me faire revenir.'],
      de: ['Mich wegschicken', 'Drück {hotkey:away} und ich verstecke mich und bin still; drück es nochmal oder nutze Capri anzeigen im Tray, um mich zurückzuholen.'],
      it: ['Mandarmi via', 'Premi {hotkey:away} e mi nascondo in silenzio; premilo di nuovo, o usa Mostra Capri nella barra, per farmi tornare.'],
      ru: ['Отправить меня отдохнуть', 'Нажми {hotkey:away}, и я спрячусь и буду молчать; нажми ещё раз или выбери «Показать Capri» в трее, чтобы я вернулась.'],
      ja: ['隠れてもらう', '{hotkey:away}を押すと隠れて静かにしてるよ。もう一度押すか、トレイの「Capriを表示」で戻ってくるね。'],
      ko: ['숨겨두기', '{hotkey:away}를 누르면 숨어서 조용히 있을게. 다시 누르거나 트레이의 Capri 보이기를 쓰면 돌아올게.'],
      zh: ['让我躲起来', '按 {hotkey:away}，我就躲起来不出声；再按一次，或在托盘里点“显示 Capri”，我就回来。']
    }
  },
  {
    id: 'talk',
    category: 'voice',
    say: {},
    keywords: ['push to talk', 'hey capri', 'talk to you', 'speak to you', 'talk with you', 'hablarte', 'hablar con vos', 'hablar contigo', 'falar com voce', 'te parler', 'mit dir sprechen', 'parlarti', 'parlare con te', 'говорить с тобой', '話しかけ', '말 걸', '和你说话', '跟你说话'],
    generic: ['microphone', 'mic', 'listen to me', 'microfono', 'me escuches', 'escucharme', 'microfone', 'me ouvir', 'micro', 'm ecouter', 'mikrofon', 'mir zuhoren', 'microfono', 'ascoltarmi', 'микрофон', 'меня слушала', 'マイク', '聞いて', '마이크', '너한테 말', '麦克风'],
    text: {
      en: ['Talk to me', 'Hold {hotkey:talk} and speak, then let go. {hotkey:listen} keeps me listening so you can just say "Hey Capri", and {hotkey:chat} opens the chat to type. You can change the keys in Settings > TTS.'],
      es: ['Hablarme', 'Mantené {hotkey:talk} y hablá, después soltá. {hotkey:listen} me deja escuchando para que solo digas "Hey Capri", y {hotkey:chat} abre el chat para escribir. Las teclas se cambian en Configuración > TTS.'],
      pt: ['Falar comigo', 'Segure {hotkey:talk} e fale, depois solte. {hotkey:listen} me deixa ouvindo para você só dizer "Hey Capri", e {hotkey:chat} abre o chat para digitar. As teclas mudam em Configurações > TTS.'],
      fr: ['Me parler', 'Maintiens {hotkey:talk} et parle, puis relâche. {hotkey:listen} me garde à l\'écoute pour que tu dises juste "Hey Capri", et {hotkey:chat} ouvre le chat pour écrire. Les touches se changent dans Paramètres > TTS.'],
      de: ['Mit mir sprechen', 'Halte {hotkey:talk} gedrückt und sprich, dann loslassen. {hotkey:listen} lässt mich zuhören, damit du einfach "Hey Capri" sagen kannst, und {hotkey:chat} öffnet den Chat zum Tippen. Die Tasten änderst du unter Einstellungen > TTS.'],
      it: ['Parlarmi', 'Tieni premuto {hotkey:talk} e parla, poi lascia. {hotkey:listen} mi tiene in ascolto così basta dire "Hey Capri", e {hotkey:chat} apre la chat per scrivere. I tasti si cambiano in Impostazioni > TTS.'],
      ru: ['Поговорить со мной', 'Зажми {hotkey:talk} и говори, потом отпусти. {hotkey:listen} оставляет меня слушать, чтобы ты просто сказал «Hey Capri», а {hotkey:chat} открывает чат. Клавиши меняются в Настройки > TTS.'],
      ja: ['話しかける', '{hotkey:talk}を押しながら話して、離してね。{hotkey:listen}で聞きっぱなしにすれば「Hey Capri」と言うだけでいいし、{hotkey:chat}でチャットが開くよ。キーは設定 > TTSで変えられるよ。'],
      ko: ['나에게 말하기', '{hotkey:talk}를 누른 채 말하고 떼면 돼. {hotkey:listen}를 누르면 계속 들어서 "Hey Capri"라고만 하면 되고, {hotkey:chat}는 채팅을 열어. 키는 설정 > TTS에서 바꿀 수 있어.'],
      zh: ['和我说话', '按住 {hotkey:talk} 说话，说完松开。{hotkey:listen} 让我一直听着，你只要说“Hey Capri”；{hotkey:chat} 打开聊天框打字。按键可以在设置 > TTS 里改。']
    }
  },
  {
    id: 'language',
    category: 'voice',
    commands: ['talk in {x}'],
    say: {
      en: ['talk in French'], es: ['habla en inglés'], pt: ['fala em inglês'], fr: ['parle en anglais'], de: ['sprich englisch'], it: ['parla in inglese'],
      ru: ['говори по-английски'], ja: ['英語で話して'], ko: ['영어로 말해줘'], zh: ['用英语说话']
    },
    keywords: [],
    generic: ['language', 'languages', 'idioma', 'idiomas', 'lengua', 'lingua', 'langue', 'sprache', 'язык', '言語', '언어', '语言'],
    text: {
      en: ['Change my language', 'Tell me {say} (any of my ten languages) and I switch. The language I hear, speak and write in can also be fixed in Settings > Language.'],
      es: ['Cambiar mi idioma', 'Decime {say} (cualquiera de mis diez idiomas) y cambio. El idioma en que escucho, hablo y escribo también se fija en Configuración > Idioma.'],
      pt: ['Mudar meu idioma', 'Me diga {say} (qualquer um dos meus dez idiomas) e eu troco. O idioma em que ouço, falo e escrevo também pode ser fixado em Configurações > Idioma.'],
      fr: ['Changer ma langue', 'Dis-moi {say} (n\'importe laquelle de mes dix langues) et je change. La langue dans laquelle j\'écoute, parle et écris se règle aussi dans Paramètres > Langue.'],
      de: ['Meine Sprache ändern', 'Sag mir {say} (eine meiner zehn Sprachen) und ich wechsle. In welcher Sprache ich höre, spreche und schreibe, legst du auch unter Einstellungen > Sprache fest.'],
      it: ['Cambiare la mia lingua', 'Dimmi {say} (una qualsiasi delle mie dieci lingue) e cambio. La lingua in cui ascolto, parlo e scrivo si può fissare anche in Impostazioni > Lingua.'],
      ru: ['Сменить мой язык', 'Скажи мне {say} (любой из моих десяти языков), и я переключусь. Язык, на котором я слушаю, говорю и пишу, можно закрепить в Настройки > Язык.'],
      ja: ['言語を変える', '{say}と言えば切り替えるよ（10か国語どれでもOK）。聞く・話す・書く言語は設定 > 言語で固定もできるよ。'],
      ko: ['언어 바꾸기', '{say}라고 하면 바꿀게(내 열 가지 언어 중 아무거나). 듣고 말하고 쓰는 언어는 설정 > 언어에서 고정할 수도 있어.'],
      zh: ['切换语言', '对我说{say}（我的十种语言都行），我就切换。我听、说、写用的语言也可以在设置 > 语言里固定。']
    }
  },
  {
    id: 'watch-screen',
    category: 'screen',
    check: 'watch',
    say: {
      en: ['watch my screen'], es: ['mirá mi pantalla'], pt: ['olha minha tela'], fr: ['regarde mon ecran'], de: ['schau dir meinen bildschirm an'], it: ['guarda il mio schermo'],
      ru: ['посмотри на мой экран'], ja: ['画面を見て'], ko: ['내 화면 봐줘'], zh: ['看我的屏幕']
    },
    keywords: ['watch my screen', 'see my screen', 'look at my screen', 'screen watch', 'mires mi pantalla', 'mire mi pantalla', 'veas mi pantalla', 'vea mi pantalla', 'olhar minha tela', 'olhe minha tela', 'regardes mon ecran', 'regarder mon ecran', 'meinen bildschirm ansehen', 'meinen bildschirm anschauen', 'guardare il mio schermo', 'guardi il mio schermo', 'смотрела мой экран', 'смотреть мой экран', '画面を見て', '내 화면', '看我的屏幕'],
    generic: ['watch the screen', 'see what i', 'mirar la pantalla', 'ver la pantalla', 'ver mi pantalla', 'mirar mi pantalla', 'minha tela', 'mon ecran', 'bildschirm', 'mio schermo', 'экран', '画面', '화면', '屏幕'],
    text: {
      en: ['Watch your screen', 'Tell me {say} and I watch what you play or watch and react to it live; "stop watching" turns it off. On Windows and Linux it needs a vision model in Ollama (Settings > AI & models offers one).'],
      es: ['Mirar tu pantalla', 'Decime {say} y miro lo que jugás o mirás y reacciono en vivo; "dejá de mirar" lo apaga. En Windows y Linux necesita un modelo de visión en Ollama (Configuración > IA y modelos te ofrece uno).'],
      pt: ['Olhar sua tela', 'Me diga {say} e eu acompanho o que você joga ou assiste e reajo ao vivo; "para de olhar" desliga. No Windows e Linux precisa de um modelo de visão no Ollama (Configurações > IA e modelos oferece um).'],
      fr: ['Regarder ton écran', 'Dis-moi {say} et je regarde ce que tu joues ou regardes en réagissant en direct ; "arrête de regarder" l\'éteint. Sur Windows et Linux, il faut un modèle de vision dans Ollama (Paramètres > IA et modèles en propose un).'],
      de: ['Deinen Bildschirm ansehen', 'Sag mir {say} und ich schaue live mit, was du spielst oder ansiehst, und reagiere darauf; "hör auf zu schauen" schaltet es aus. Unter Windows und Linux braucht es ein Vision-Modell in Ollama (Einstellungen > KI & Modelle bietet eins an).'],
      it: ['Guardare il tuo schermo', 'Dimmi {say} e guardo quello che giochi o guardi reagendo dal vivo; "smetti di guardare" lo spegne. Su Windows e Linux serve un modello di visione in Ollama (Impostazioni > IA e modelli ne propone uno).'],
      ru: ['Смотреть твой экран', 'Скажи мне {say}, и я буду смотреть, во что ты играешь или что смотришь, и реагировать вживую; «хватит смотреть» выключает. На Windows и Linux нужна модель зрения в Ollama (Настройки > ИИ и модели предложат её).'],
      ja: ['画面を見る', '{say}と言えば、遊んでるものや見てるものをリアルタイムで見てリアクションするよ。「見るのをやめて」で終わり。WindowsとLinuxではOllamaに画像が見えるモデルが必要だよ（設定 > AIとモデルで入れられるよ）。'],
      ko: ['화면 보기', '{say}라고 하면 네가 하는 게임이나 보는 걸 실시간으로 보면서 반응할게. "그만 봐"라고 하면 꺼. Windows와 Linux에서는 Ollama에 비전 모델이 필요해(설정 > AI 및 모델에서 받을 수 있어).'],
      zh: ['看你的屏幕', '对我说{say}，我就实时看你在玩或在看的东西并做出反应；说“别看了”就关掉。在 Windows 和 Linux 上需要 Ollama 里有视觉模型（设置 > AI 与模型里可以装）。']
    }
  },
  {
    id: 'scanner',
    category: 'screen',
    commands: ['open scanner'],
    say: {
      en: ['open scanner'], fr: ['ouvre le scanner'], de: ['öffne den scanner'], it: ['apri lo scanner'], pt: ['abre o scanner'],
      ru: ['открой сканер'], ja: ['スキャナーを開いて'], ko: ['스캐너 열어줘'], zh: ['打开扫描仪'], es: ['abrí el scanner']
    },
    keywords: ['learn a drawing', 'aprender un dibujo', 'aprendas un dibujo'],
    generic: ['scanner', 'scan', 'escanea', 'escanear', 'escaneo', 'scann', 'scanne', 'scansiona', 'сканер', 'скан', 'スキャン', '스캔', '扫描'],
    text: {
      en: ['Scan something', 'Say {say}, drag the frame over what you want to show me and say "scan". I tell you what I see, and I can learn drawings and logos so I recognize them next time.'],
      es: ['Escanear algo', 'Decime {say}, arrastrá el marco sobre lo que me quieras mostrar y decí "escaneá". Te digo qué veo, y puedo aprender dibujos y logos para reconocerlos la próxima.'],
      pt: ['Escanear algo', 'Diga {say}, arraste a moldura sobre o que quer me mostrar e diga "escaneia". Eu digo o que vejo, e posso aprender desenhos e logos para reconhecer na próxima vez.'],
      fr: ['Scanner quelque chose', 'Dis {say}, place le cadre sur ce que tu veux me montrer et dis "scanne". Je te dis ce que je vois, et je peux apprendre des dessins et des logos pour les reconnaître la prochaine fois.'],
      de: ['Etwas scannen', 'Sag {say}, zieh den Rahmen über das, was du mir zeigen willst, und sag "scannen". Ich sage dir, was ich sehe, und kann Zeichnungen und Logos lernen, um sie wiederzuerkennen.'],
      it: ['Scansionare qualcosa', 'Di\' {say}, trascina la cornice su quello che vuoi mostrarmi e di\' "scansiona". Ti dico cosa vedo, e posso imparare disegni e loghi per riconoscerli la prossima volta.'],
      ru: ['Сканировать', 'Скажи {say}, наведи рамку на то, что хочешь показать, и скажи «сканируй». Я скажу, что вижу, и могу запоминать рисунки и логотипы, чтобы узнавать их потом.'],
      ja: ['スキャンする', '{say}と言って、見せたいものに枠を合わせて「スキャン」と言ってね。何が見えるか教えるし、絵やロゴを覚えて次から見分けられるよ。'],
      ko: ['스캔하기', '{say}라고 하고 보여주고 싶은 곳에 틀을 맞춘 뒤 "스캔"이라고 해줘. 뭐가 보이는지 말해주고, 그림이나 로고를 배워서 다음에 알아볼 수 있어.'],
      zh: ['扫描东西', '说{say}，把框拖到你想给我看的东西上，再说“扫描”。我会告诉你看到了什么，还能学会图画和标志，下次就认得。']
    }
  },
  {
    id: 'gaming-mode',
    category: 'gaming',
    commands: ['turn on gaming mode'],
    say: {
      en: ['turn on gaming mode'], es: ['activá el modo gaming'], pt: ['ativa o modo jogo'], fr: ['active le mode gaming'], de: ['aktiviere den spielmodus'],
      it: ['attiva la modalità gioco'], ru: ['включи игровой режим'], ja: ['ゲームモードにして'], ko: ['게임 모드 켜줘'], zh: ['打开游戏模式']
    },
    keywords: ['gaming mode', 'game mode', 'gamemode', 'modo gaming', 'modo juego', 'modo gamer', 'modo jogo', 'mode gaming', 'mode jeu', 'spielmodus', 'gaming modus', 'modalita gioco', 'игровой режим', 'ゲームモード', '게임 모드', '游戏模式'],
    generic: [],
    text: {
      en: ['Gaming mode', 'Press {hotkey:gaming} or tell me {say}: I shrink to eye mode in a corner so I don\'t cover your game, and still react. "turn off gaming mode" (or the same key) brings me back.'],
      es: ['Modo gaming', 'Apretá {hotkey:gaming} o decime {say}: me achico en modo ojos en una esquina para no taparte el juego, y sigo reaccionando. "desactivá el modo gaming" (o la misma tecla) me devuelve.'],
      pt: ['Modo jogo', 'Aperte {hotkey:gaming} ou me diga {say}: eu encolho no modo olhos num canto para não cobrir o jogo e continuo reagindo. "desativa o modo jogo" (ou a mesma tecla) me traz de volta.'],
      fr: ['Mode gaming', 'Appuie sur {hotkey:gaming} ou dis-moi {say} : je me réduis en mode yeux dans un coin pour ne pas cacher ton jeu, et je continue de réagir. "désactive le mode gaming" (ou la même touche) me ramène.'],
      de: ['Spielmodus', 'Drück {hotkey:gaming} oder sag mir {say}: Ich schrumpfe im Augenmodus in eine Ecke, damit ich dein Spiel nicht verdecke, und reagiere weiter. "deaktiviere den spielmodus" (oder dieselbe Taste) holt mich zurück.'],
      it: ['Modalità gioco', 'Premi {hotkey:gaming} o dimmi {say}: mi rimpicciolisco in modalità occhi in un angolo per non coprire il gioco, e continuo a reagire. "disattiva la modalità gioco" (o lo stesso tasto) mi riporta indietro.'],
      ru: ['Игровой режим', 'Нажми {hotkey:gaming} или скажи {say}: я уменьшусь до режима глаз в углу, чтобы не закрывать игру, и продолжу реагировать. «выключи игровой режим» (или та же клавиша) вернёт меня.'],
      ja: ['ゲームモード', '{hotkey:gaming}を押すか{say}と言ってね。ゲームの邪魔にならないよう隅で目だけのモードになって、リアクションは続けるよ。「ゲームモードをオフにして」（または同じキー）で戻るよ。'],
      ko: ['게임 모드', '{hotkey:gaming}를 누르거나 {say}라고 해줘. 게임을 가리지 않게 구석에서 눈 모드로 작아지고, 반응은 계속해. "게임 모드 꺼줘"(또는 같은 키)로 돌아와.'],
      zh: ['游戏模式', '按 {hotkey:gaming} 或对我说{say}：我会缩成角落里的眼睛模式，不挡你的游戏，照样会有反应。说“关闭游戏模式”（或按同一个键）我就回来。']
    }
  },
  {
    id: 'game-commentary',
    category: 'gaming',
    commands: ['game commentary off', 'game commentary on'],
    say: {
      en: ['game commentary off', 'game commentary on'], fr: ['coupe les commentaires de jeu', 'active les commentaires de jeu'], de: ['spielkommentare aus', 'spielkommentare an'],
      it: ['disattiva i commenti di gioco', 'attiva i commenti di gioco'], pt: ['desativa os comentarios de jogo', 'ativa os comentarios de jogo'],
      ru: ['выключи игровые комментарии', 'включи игровые комментарии'], ja: ['ゲーム実況をオフにして', 'ゲーム実況をオンにして'], ko: ['게임 해설 꺼줘', '게임 해설 켜줘'], zh: ['关闭游戏解说', '开启游戏解说'],
      es: ['silencia los juegos', 'activá los comentarios de juegos']
    },
    keywords: ['comment on my game', 'react to my game', '実況', '해설', '解说'],
    generic: ['commentary', 'quiet during', 'comentario', 'comentarios', 'silencia', 'commentaire', 'kommentar', 'commento', 'commenti', 'комментар'],
    text: {
      en: ['Game reactions', 'I react to League, VALORANT and Cyberpunk on my own while you play. Say {say} for silence and {say2} to bring my comments back.'],
      es: ['Reacciones en juegos', 'Reacciono sola al LoL, VALORANT y Cyberpunk mientras jugás. Decí {say} para que me calle y {say2} para que vuelva a comentar.'],
      pt: ['Reações nos jogos', 'Eu reajo sozinha a LoL, VALORANT e Cyberpunk enquanto você joga. Diga {say} para eu ficar quieta e {say2} para eu voltar a comentar.'],
      fr: ['Réactions en jeu', 'Je réagis toute seule à LoL, VALORANT et Cyberpunk pendant que tu joues. Dis {say} pour le silence et {say2} pour que je recommence.'],
      de: ['Spielreaktionen', 'Ich reagiere von selbst auf LoL, VALORANT und Cyberpunk, während du spielst. Sag {say} für Ruhe und {say2}, damit ich wieder kommentiere.'],
      it: ['Reazioni ai giochi', 'Reagisco da sola a LoL, VALORANT e Cyberpunk mentre giochi. Di\' {say} per il silenzio e {say2} per farmi tornare a commentare.'],
      ru: ['Реакции в играх', 'Я сама реагирую на LoL, VALORANT и Cyberpunk, пока ты играешь. Скажи {say}, чтобы я молчала, и {say2}, чтобы я снова комментировала.'],
      ja: ['ゲームのリアクション', 'LoL、VALORANT、Cyberpunkを遊んでる間、自分からリアクションするよ。静かにしてほしい時は{say}、また実況してほしい時は{say2}って言ってね。'],
      ko: ['게임 리액션', '네가 LoL, VALORANT, Cyberpunk를 할 때 알아서 반응해. 조용히 하려면 {say}, 다시 해설하려면 {say2}라고 해줘.'],
      zh: ['游戏反应', '你玩 LoL、VALORANT 和 Cyberpunk 时我会自己做出反应。想让我安静就说{say}，想让我继续解说就说{say2}。']
    }
  },
  {
    id: 'valorant',
    category: 'gaming',
    platforms: ['win32'],
    commands: ['find a valorant match', 'lock {w} in valorant'],
    say: {
      en: ['find a valorant match', 'lock Jett in valorant'], fr: ['cherche une partie de valorant', 'lock Jett dans valorant'], de: ['suche ein valorant spiel', 'wähle Jett in valorant'],
      it: ['cerca una partita di valorant', 'scegli Jett in valorant'], pt: ['procura uma partida de valorant', 'lock Jett no valorant'],
      ru: ['найди игру в валоранте', 'залочь Jett в валоранте'], ja: ['ヴァロでマッチを探して', 'ヴァロでJettをロックして'], ko: ['발로란트 매치 찾아줘', '발로란트에서 Jett 락해줘'],
      zh: ['瓦罗兰特找一局', '在瓦罗兰特里选Jett'], es: ['buscá partida de valorant', 'lockeá a Jett en valorant']
    },
    keywords: [],
    generic: ['valorant', 'valo', 'jett', 'agent select', 'lock an agent', 'lockear', 'agente de valorant', 'валорант', 'ヴァロ', '발로란트', '瓦罗兰特'],
    text: {
      en: ['VALORANT', 'With VALORANT open, say {say} to queue (I understand competitive, unrated, swiftplay...) and {say2} to lock an agent. I also react to your rounds.'],
      es: ['VALORANT', 'Con VALORANT abierto, decí {say} para entrar a la cola (entiendo competitiva, normal, rápida...) y {say2} para lockear un agente. También reacciono a tus rondas.'],
      pt: ['VALORANT', 'Com o VALORANT aberto, diga {say} para entrar na fila (entendo competitivo, sem ranque, swiftplay...) e {say2} para travar um agente. Também reajo às suas rodadas.'],
      fr: ['VALORANT', 'Avec VALORANT ouvert, dis {say} pour lancer la file (je comprends compétitif, non classé, swiftplay...) et {say2} pour verrouiller un agent. Je réagis aussi à tes manches.'],
      de: ['VALORANT', 'Mit offenem VALORANT sag {say} für die Warteschlange (ich verstehe Gewertet, Ungewertet, Swiftplay...) und {say2}, um einen Agenten zu locken. Ich reagiere auch auf deine Runden.'],
      it: ['VALORANT', 'Con VALORANT aperto, di\' {say} per entrare in coda (capisco competitiva, non classificata, swiftplay...) e {say2} per bloccare un agente. Reagisco anche ai tuoi round.'],
      ru: ['VALORANT', 'Когда VALORANT открыт, скажи {say}, чтобы встать в очередь (понимаю рейтинг, обычную, swiftplay...), и {say2}, чтобы залочить агента. Ещё я реагирую на твои раунды.'],
      ja: ['VALORANT', 'VALORANTを開いた状態で{say}と言えばキューに入るよ（コンペ、アンレート、スイフトプレイ…わかるよ）。{say2}でエージェントをロック。ラウンドにもリアクションするよ。'],
      ko: ['VALORANT', 'VALORANT를 켜둔 상태에서 {say}라고 하면 대기열에 들어가(경쟁전, 일반전, 신속플레이... 다 알아). {say2}로 요원을 락해. 라운드에도 반응할게.'],
      zh: ['VALORANT', '打开 VALORANT 后，说{say}就开始排队（竞技、非排位、快速模式我都懂），说{say2}就锁定特工。我也会对你的每回合做出反应。']
    }
  },
  {
    id: 'league',
    category: 'gaming',
    platforms: ['win32'],
    commands: ['find a match', 'turn on auto accept'],
    say: {
      en: ['find a match', 'turn on auto accept'], fr: ['cherche une partie', 'active l acceptation automatique'], de: ['suche ein spiel', 'aktiviere auto accept'],
      it: ['cerca una partita', 'attiva l accettazione automatica'], pt: ['procura uma partida', 'ativa o aceitar automatico'], ru: ['найди игру', 'включи автопринятие'],
      ja: ['マッチを探して', '自動承諾をオンにして'], ko: ['매치 찾아줘', '자동 수락 켜줘'], zh: ['找一局', '开启自动接受'], es: ['buscá partida', 'activá el auto aceptar']
    },
    keywords: [],
    generic: ['league', 'league of legends', 'champion select', 'champ select', 'auto accept', 'auto aceptar', 'campeon', 'champion', 'campeao', 'campione', 'чемпион', 'лига легенд', 'リーグ', 'チャンピオン', '챔피언', '英雄联盟'],
    text: {
      en: ['League of Legends', 'With the League client open, say {say} to queue and {say2} so I accept the match for you. In champ select, "pick Ahri" or "ban Yasuo" work too.'],
      es: ['League of Legends', 'Con el cliente del LoL abierto, decí {say} para entrar a la cola y {say2} para que acepte la partida por vos. En la selección también funcionan "elegí a Ahri" o "baneá a Yasuo".'],
      pt: ['League of Legends', 'Com o cliente do LoL aberto, diga {say} para entrar na fila e {say2} para eu aceitar a partida por você. Na seleção, "escolhe Ahri" ou "bane Yasuo" também funcionam.'],
      fr: ['League of Legends', 'Avec le client de LoL ouvert, dis {say} pour lancer la file et {say2} pour que j\'accepte la partie à ta place. En sélection, "choisis Ahri" ou "bannis Yasuo" marchent aussi.'],
      de: ['League of Legends', 'Mit offenem LoL-Client sag {say} für die Warteschlange und {say2}, damit ich das Spiel für dich annehme. In der Champion-Auswahl gehen auch "wähle Ahri" oder "banne Yasuo".'],
      it: ['League of Legends', 'Con il client di LoL aperto, di\' {say} per entrare in coda e {say2} così accetto la partita per te. Nella selezione funzionano anche "scegli Ahri" o "banna Yasuo".'],
      ru: ['League of Legends', 'Когда клиент LoL открыт, скажи {say}, чтобы встать в очередь, и {say2}, чтобы я принимала игру за тебя. В выборе чемпиона работают «выбери Ahri» или «забань Yasuo».'],
      ja: ['League of Legends', 'LoLのクライアントを開いて{say}と言えばキューに入るよ。{say2}でマッチを代わりに承諾するね。チャンピオン選択では「Ahriをピックして」「Yasuoをバンして」もOK。'],
      ko: ['League of Legends', '롤 클라이언트를 켜고 {say}라고 하면 대기열에 들어가. {say2}라고 하면 매치를 대신 수락해줄게. 챔피언 선택에서는 "Ahri 픽해줘", "Yasuo 밴해줘"도 돼.'],
      zh: ['英雄联盟', '打开英雄联盟客户端后，说{say}就开始排队，说{say2}我就帮你接受对局。选英雄时也可以说“选择Ahri”或“ban掉Yasuo”。']
    }
  },
  {
    id: 'clip',
    category: 'gaming',
    platforms: ['win32', 'linux'],
    commands: ['clip that'],
    say: {
      en: ['clip that'], es: ['clipeá eso'], fr: ['clippe ça'], de: ['clip das'], it: ['clippa questo'], pt: ['clipa isso'], ru: ['сделай клип'], ja: ['クリップして'], ko: ['클립 따줘'], zh: ['剪辑一下']
    },
    keywords: ['clip that', 'clipea', 'clipear', 'clipee', 'clipar', 'clipper', 'clippen', 'clippare'],
    generic: ['clip', 'instant replay', 'replay', 'highlight', 'клип', 'クリップ', '클립', '剪辑', '精彩'],
    text: {
      en: ['Clip a play', 'Say {say} right after a good play and I save the last moments with your instant replay (NVIDIA ShadowPlay or Xbox Game Bar; on Linux I press F8 for your recorder).'],
      es: ['Clipear una jugada', 'Decí {say} justo después de una buena jugada y guardo los últimos momentos con tu repetición instantánea (NVIDIA ShadowPlay o Xbox Game Bar; en Linux aprieto F8 para tu grabador).'],
      pt: ['Clipar uma jogada', 'Diga {say} logo depois de uma boa jogada e eu salvo os últimos momentos com seu replay instantâneo (NVIDIA ShadowPlay ou Xbox Game Bar; no Linux eu aperto F8 para o seu gravador).'],
      fr: ['Clipper une action', 'Dis {say} juste après une belle action et j\'enregistre les derniers instants avec ta relecture instantanée (NVIDIA ShadowPlay ou Xbox Game Bar ; sous Linux, j\'appuie sur F8 pour ton enregistreur).'],
      de: ['Einen Clip speichern', 'Sag {say} direkt nach einem guten Spielzug und ich speichere die letzten Momente mit deinem Instant Replay (NVIDIA ShadowPlay oder Xbox Game Bar; unter Linux drücke ich F8 für deinen Recorder).'],
      it: ['Clippare un\'azione', 'Di\' {say} subito dopo una bella azione e salvo gli ultimi momenti con il tuo replay istantaneo (NVIDIA ShadowPlay o Xbox Game Bar; su Linux premo F8 per il tuo registratore).'],
      ru: ['Сохранить клип', 'Скажи {say} сразу после классного момента, и я сохраню последние секунды через мгновенный повтор (NVIDIA ShadowPlay или Xbox Game Bar; на Linux я нажимаю F8 для твоей программы записи).'],
      ja: ['クリップを保存', 'いいプレイの直後に{say}と言えば、インスタントリプレイ（NVIDIA ShadowPlayかXbox Game Bar、LinuxならレコーダーのF8）で直前の場面を保存するよ。'],
      ko: ['클립 저장', '멋진 플레이 직후에 {say}라고 하면 인스턴트 리플레이(NVIDIA ShadowPlay나 Xbox Game Bar, Linux에서는 녹화 프로그램용 F8)로 방금 장면을 저장해.'],
      zh: ['保存精彩片段', '打出好操作后马上说{say}，我就用即时回放（NVIDIA ShadowPlay 或 Xbox Game Bar；在 Linux 上我会替你的录制软件按 F8）保存刚才的画面。']
    }
  },
  {
    id: 'youtube-party',
    category: 'party',
    commands: ["let's watch youtube together", 'you choose'],
    say: {
      en: ["let's watch youtube together", 'you choose'], es: ['veamos youtube juntos', 'elegí vos'], fr: ['regardons youtube ensemble', 'choisis toi'], de: ['lass uns zusammen youtube schauen', 'du entscheidest'],
      it: ['guardiamo youtube insieme', 'scegli tu'], pt: ['vamos assistir youtube juntos', 'escolhe você'], ru: ['давай посмотрим ютуб вместе', 'выбери сама'],
      ja: ['一緒にyoutubeを見よう', 'あなたが選んで'], ko: ['같이 유튜브 보자', '네가 골라'], zh: ['一起看youtube', '你来选']
    },
    keywords: ['watch party', 'watch together', 'ver juntos', 'veamos juntos', 'mirar juntos', 'assistir juntos', 'regarder ensemble', 'zusammen schauen', 'guardare insieme', 'смотреть вместе', '一緒に見', '같이 보', '一起看'],
    generic: ['youtube', 'yt', 'ютуб', '油管'],
    text: {
      en: ['YouTube together', 'Say {say}: I open YouTube, scroll your feed with you and suggest videos. Say {say2} and I pick one myself; then I watch and react with you.'],
      es: ['YouTube juntos', 'Decí {say}: abro YouTube, recorro tu feed con vos y te propongo videos. Decí {say2} y elijo yo; después lo miro y reacciono con vos.'],
      pt: ['YouTube juntos', 'Diga {say}: eu abro o YouTube, rolo seu feed com você e sugiro vídeos. Diga {say2} e eu escolho; depois assisto e reajo com você.'],
      fr: ['YouTube ensemble', 'Dis {say} : j\'ouvre YouTube, je parcours ton fil avec toi et je propose des vidéos. Dis {say2} et j\'en choisis une moi-même ; ensuite je regarde et je réagis avec toi.'],
      de: ['Zusammen YouTube', 'Sag {say}: Ich öffne YouTube, scrolle mit dir durch deinen Feed und schlage Videos vor. Sag {say2} und ich suche selbst eins aus; dann schaue ich mit dir und reagiere.'],
      it: ['YouTube insieme', 'Di\' {say}: apro YouTube, scorro il tuo feed con te e ti propongo video. Di\' {say2} e ne scelgo uno io; poi lo guardo e reagisco con te.'],
      ru: ['YouTube вместе', 'Скажи {say}: я открою YouTube, полистаю ленту вместе с тобой и предложу видео. Скажи {say2}, и я выберу сама; потом смотрю и реагирую вместе с тобой.'],
      ja: ['一緒にYouTube', '{say}と言えばYouTubeを開いて、一緒にフィードを見ながら動画をおすすめするよ。{say2}と言えば私が選ぶね。そのあと一緒に見てリアクションするよ。'],
      ko: ['같이 유튜브', '{say}라고 하면 유튜브를 열고 같이 피드를 보면서 영상을 추천해줄게. {say2}라고 하면 내가 고를게. 그다음 같이 보면서 반응할게.'],
      zh: ['一起看 YouTube', '说{say}：我打开 YouTube，和你一起刷推荐并给你推荐视频。说{say2}我就自己挑一个，然后陪你一起看、一起反应。']
    }
  },
  {
    id: 'tiktok-party',
    category: 'party',
    commands: ["let's watch tiktok together"],
    say: {
      en: ["let's watch tiktok together"], es: ['veamos tiktoks'], fr: ['regardons tiktok ensemble'], de: ['lass uns zusammen tiktok schauen'], it: ['guardiamo tiktok insieme'],
      pt: ['vamos assistir tiktok juntos'], ru: ['давай посмотрим тикток вместе'], ja: ['一緒にtiktokを見よう'], ko: ['같이 틱톡 보자'], zh: ['一起看tiktok']
    },
    keywords: [],
    generic: ['tiktok', 'tik tok', 'tiktoks', 'reels', 'тикток', 'ティックトック', '틱톡', '抖音'],
    text: {
      en: ['TikTok together', 'Say {say}: I comment on each TikTok and move on when it ends. Say "next" to skip and "like" to drop a like.'],
      es: ['TikTok juntos', 'Decí {say}: comento cada TikTok y paso al siguiente cuando termina. Decí "siguiente" para saltear y "dale like" para darle like.'],
      pt: ['TikTok juntos', 'Diga {say}: eu comento cada TikTok e passo para o próximo quando acaba. Diga "próximo" para pular e "curtir" para dar like.'],
      fr: ['TikTok ensemble', 'Dis {say} : je commente chaque TikTok et je passe au suivant à la fin. Dis "suivant" pour passer et "like" pour liker.'],
      de: ['Zusammen TikTok', 'Sag {say}: Ich kommentiere jedes TikTok und gehe weiter, wenn es endet. Sag "nächstes" zum Überspringen und "like" für ein Like.'],
      it: ['TikTok insieme', 'Di\' {say}: commento ogni TikTok e passo al successivo quando finisce. Di\' "prossimo" per saltare e "like" per mettere like.'],
      ru: ['TikTok вместе', 'Скажи {say}: я комментирую каждое видео и листаю дальше, когда оно заканчивается. Скажи «следующее», чтобы пропустить, и «лайк», чтобы поставить лайк.'],
      ja: ['一緒にTikTok', '{say}と言えば、TikTokを一本ずつコメントして、終わったら次に行くよ。「次」でスキップ、「いいね」でいいねするね。'],
      ko: ['같이 틱톡', '{say}라고 하면 틱톡마다 코멘트하고 끝나면 다음으로 넘어가. "다음"이라고 하면 넘기고 "좋아요"라고 하면 좋아요를 눌러.'],
      zh: ['一起刷 TikTok', '说{say}：我会点评每条 TikTok，播完就切到下一条。说“下一个”跳过，说“点赞”就点个赞。']
    }
  },
  {
    id: 'music',
    category: 'music',
    commands: ['play {x} on spotify', 'skip song', 'pause the music'],
    say: {
      en: ['play Daft Punk on spotify', 'skip song'], es: ['pone Daft Punk en spotify', 'pasa la canción'], fr: ['joue Daft Punk sur spotify', 'chanson suivante'],
      de: ['spiele Daft Punk auf spotify', 'nächstes lied'], it: ['metti Daft Punk su spotify', 'prossima canzone'], pt: ['toca Daft Punk no spotify', 'proxima musica'],
      ru: ['включи Daft Punk на spotify', 'следующая песня'], ja: ['spotifyでDaft Punkを再生して', '次の曲'], ko: ['스포티파이에서 Daft Punk 틀어줘', '다음 곡'], zh: ['在spotify上播放Daft Punk', '下一首']
    },
    keywords: ['play music', 'put on music', 'poner musica', 'pongo musica', 'pongas musica', 'tocar musica', 'mettre de la musique', 'musik abspielen', 'mettere musica', 'включить музыку', '音楽をかけ', '음악 틀', '放音乐', '播放音乐'],
    generic: ['music', 'song', 'songs', 'spotify', 'playlist', 'youtube music', 'musica', 'cancion', 'canciones', 'cancao', 'musique', 'chanson', 'musik', 'lied', 'canzone', 'музык', 'песн', '音楽', '曲', '음악', '노래', '音乐', '歌'],
    text: {
      en: ['Play music', 'Say {say} (or YouTube Music) and I put it on; {say2}, "pause the music" and "previous track" work too. The default platform is in Settings > TTS.'],
      es: ['Poner música', 'Decí {say} (o YouTube Music) y lo pongo; {say2}, "pausá la música" y "anterior" también funcionan. La plataforma por defecto está en Configuración > TTS.'],
      pt: ['Tocar música', 'Diga {say} (ou YouTube Music) e eu coloco; {say2}, "pausa a música" e "música anterior" também funcionam. A plataforma padrão fica em Configurações > TTS.'],
      fr: ['Mettre de la musique', 'Dis {say} (ou YouTube Music) et je lance ; {say2}, "mets la musique en pause" et "chanson précédente" marchent aussi. La plateforme par défaut est dans Paramètres > TTS.'],
      de: ['Musik abspielen', 'Sag {say} (oder YouTube Music) und ich lege los; {say2}, "pausiere die musik" und "vorheriges lied" gehen auch. Die Standardplattform steht unter Einstellungen > TTS.'],
      it: ['Mettere musica', 'Di\' {say} (o YouTube Music) e la metto; anche {say2}, "metti in pausa la musica" e "canzone precedente" funzionano. La piattaforma predefinita è in Impostazioni > TTS.'],
      ru: ['Включить музыку', 'Скажи {say} (или YouTube Music), и я включу; {say2}, «поставь музыку на паузу» и «предыдущая песня» тоже работают. Платформа по умолчанию — в Настройки > TTS.'],
      ja: ['音楽をかける', '{say}（YouTube Musicでも）と言えばかけるよ。{say2}、「音楽を止めて」、「前の曲」も使えるよ。いつものサービスは設定 > TTSで選べるよ。'],
      ko: ['음악 틀기', '{say}(YouTube Music도 돼)라고 하면 틀어줄게. {say2}, "음악 멈춰줘", "이전 곡"도 돼. 기본 플랫폼은 설정 > TTS에 있어.'],
      zh: ['放音乐', '说{say}（YouTube Music 也行）我就播放；{say2}、“暂停音乐”、“上一首”也都可以。默认平台在设置 > TTS 里。']
    }
  },
  {
    id: 'apps',
    category: 'pc',
    check: 'apps',
    say: {
      en: ['what apps do you know'], es: ['qué apps conocés'], pt: ['quais apps voce conhece'], fr: ['quelles applis connais tu'], de: ['welche apps kennst du'], it: ['quali app conosci'],
      ru: ['какие приложения ты знаешь'], ja: ['どのアプリを知ってる'], ko: ['어떤 앱 알아'], zh: ['你知道哪些应用']
    },
    keywords: ['open discord', 'open chrome', 'open steam'],
    generic: ['app', 'apps', 'application', 'applications', 'program', 'programs', 'aplicacion', 'aplicaciones', 'programa', 'programas', 'aplicativo', 'appli', 'applis', 'programme', 'programm', 'applicazione', 'приложени', 'программ', 'アプリ', '앱', '应用', '程序'],
    text: {
      en: ['Open and close apps', 'Say "open Discord" or "close Chrome" and I do it. Ask {say} to hear the list, and add your own in Settings > Apps.'],
      es: ['Abrir y cerrar apps', 'Decí "abrí Discord" o "cerrá Chrome" y lo hago. Preguntame {say} para escuchar la lista, y sumá las tuyas en Configuración > Apps.'],
      pt: ['Abrir e fechar apps', 'Diga "abre o Discord" ou "fecha o Chrome" e eu faço. Pergunte {say} para ouvir a lista, e adicione os seus em Configurações > Apps.'],
      fr: ['Ouvrir et fermer des applis', 'Dis "ouvre Discord" ou "ferme Chrome" et je le fais. Demande {say} pour entendre la liste, et ajoute les tiennes dans Paramètres > Apps.'],
      de: ['Apps öffnen und schließen', 'Sag "öffne Discord" oder "schließe Chrome" und ich mache es. Frag {say}, um die Liste zu hören, und füge eigene unter Einstellungen > Apps hinzu.'],
      it: ['Aprire e chiudere app', 'Di\' "apri Discord" o "chiudi Chrome" e lo faccio. Chiedimi {say} per sentire la lista, e aggiungi le tue in Impostazioni > App.'],
      ru: ['Открывать и закрывать приложения', 'Скажи «открой Discord» или «закрой Chrome», и я сделаю. Спроси {say}, чтобы услышать список, а свои добавь в Настройки > Приложения.'],
      ja: ['アプリを開く・閉じる', '「Discordを開いて」「Chromeを閉じて」と言えばやるよ。{say}と聞けば一覧を教えるし、自分のアプリは設定 > アプリで追加できるよ。'],
      ko: ['앱 열고 닫기', '"디스코드 열어줘", "크롬 닫아줘"라고 하면 해줄게. {say}라고 물으면 목록을 알려주고, 앱은 설정 > 앱에서 추가할 수 있어.'],
      zh: ['打开和关闭应用', '说“打开Discord”或“关闭Chrome”我就照做。问我{say}可以听到列表，自己的应用可以在设置 > 应用里添加。']
    }
  },
  {
    id: 'web-search',
    category: 'pc',
    commands: ['search the web for {x}'],
    say: {
      en: ['search the web for cyberpunk mods'], es: ['busca en internet mods de cyberpunk'], fr: ['cherche mods cyberpunk sur internet'], de: ['suche im internet nach cyberpunk mods'],
      it: ['cerca su internet mod di cyberpunk'], pt: ['pesquisa na internet mods de cyberpunk'], ru: ['найди в интернете моды для cyberpunk'],
      ja: ['cyberpunkのmodをネットで検索して'], ko: ['인터넷에서 사이버펑크 모드 검색해줘'], zh: ['在网上搜索赛博朋克模组']
    },
    keywords: ['search the web', 'web search', 'buscar en internet', 'busques en internet'],
    generic: ['google', 'look up online', 'internet', 'googlear', 'pesquisar na internet', 'sur internet', 'im internet', 'su internet', 'в интернете', 'ネットで検索', '인터넷', '网上搜索', '上网'],
    text: {
      en: ['Search the web', 'Say {say} and I open the search in your browser.'],
      es: ['Buscar en internet', 'Decí {say} y abro la búsqueda en tu navegador.'],
      pt: ['Pesquisar na internet', 'Diga {say} e eu abro a pesquisa no seu navegador.'],
      fr: ['Chercher sur internet', 'Dis {say} et j\'ouvre la recherche dans ton navigateur.'],
      de: ['Im Internet suchen', 'Sag {say} und ich öffne die Suche in deinem Browser.'],
      it: ['Cercare su internet', 'Di\' {say} e apro la ricerca nel tuo browser.'],
      ru: ['Искать в интернете', 'Скажи {say}, и я открою поиск в браузере.'],
      ja: ['ネットで検索', '{say}と言えば、ブラウザで検索を開くよ。'],
      ko: ['인터넷 검색', '{say}라고 하면 브라우저에서 검색을 열어줄게.'],
      zh: ['上网搜索', '说{say}，我就在浏览器里打开搜索。']
    }
  },
  {
    id: 'files',
    category: 'pc',
    say: { en: ['make a text file called notes'], es: ['creá un archivo de texto llamado notas'] },
    keywords: [],
    generic: ['text file', 'homework', 'create a file', 'make a file', 'archivo de texto', 'crear un archivo', 'tarea', 'arquivo de texto', 'tarefa', 'fichier texte', 'devoir', 'textdatei', 'hausaufgabe', 'file di testo', 'compiti', 'текстовый файл', 'домашк', 'テキストファイル', '宿題', '텍스트 파일', '숙제', '文本文件', '作业'],
    text: {
      en: ['Files and homework', 'Say {say} and I create it on your Desktop. I can also read, edit or solve a plain-text file: "do my homework in file tarea.txt".'],
      es: ['Archivos y tareas', 'Decí {say} y lo creo en tu Escritorio. También leo, edito o resuelvo un archivo de texto: "hacé mi tarea del archivo tarea.txt".'],
      pt: ['Arquivos e tarefas', 'Diga "make a text file called notes" e eu crio na sua Área de Trabalho. Também leio, edito ou resolvo um arquivo de texto simples.'],
      fr: ['Fichiers et devoirs', 'Dis "make a text file called notes" et je le crée sur ton Bureau. Je peux aussi lire, modifier ou résoudre un fichier texte.'],
      de: ['Dateien und Hausaufgaben', 'Sag "make a text file called notes" und ich lege sie auf deinem Desktop an. Ich kann auch einfache Textdateien lesen, bearbeiten oder lösen.'],
      it: ['File e compiti', 'Di\' "make a text file called notes" e lo creo sul Desktop. Posso anche leggere, modificare o risolvere un file di testo.'],
      ru: ['Файлы и домашка', 'Скажи «make a text file called notes», и я создам его на Рабочем столе. Ещё я умею читать, править и решать обычные текстовые файлы.'],
      ja: ['ファイルと宿題', '「make a text file called notes」と言えばデスクトップに作るよ。テキストファイルを読んだり、直したり、解いたりもできるよ。'],
      ko: ['파일과 숙제', '"make a text file called notes"라고 하면 바탕화면에 만들어줄게. 일반 텍스트 파일을 읽고, 고치고, 풀어줄 수도 있어.'],
      zh: ['文件和作业', '说“make a text file called notes”，我就在桌面上创建。我还能读、改或解答纯文本文件。']
    }
  },
  {
    id: 'memory',
    category: 'memory',
    commands: ['remember that {x}', 'what do you remember about me'],
    say: {
      en: ['remember that my favorite game is Cyberpunk', 'what do you remember about me'], es: ['acordate de que mi juego favorito es Cyberpunk', 'qué recordás de mí'],
      fr: ['souviens toi que mon jeu préféré est Cyberpunk', 'qu est ce que tu sais de moi'], de: ['merk dir dass mein Lieblingsspiel Cyberpunk ist', 'was weißt du uber mich'],
      it: ['ricorda che il mio gioco preferito è Cyberpunk', 'cosa ricordi di me'], pt: ['lembra que meu jogo favorito é Cyberpunk', 'o que voce lembra de mim'],
      ru: ['запомни что моя любимая игра Cyberpunk', 'что ты помнишь обо мне'], ja: ['好きなゲームはCyberpunkって覚えておいて', '私について何を覚えてる'],
      ko: ['제일 좋아하는 게임은 Cyberpunk라는 거 기억해줘', '나에 대해 뭘 기억해'], zh: ['请记住我最喜欢的游戏是Cyberpunk', '你记得我什么']
    },
    keywords: ['remember about me', 'your memory', 'tu memoria', 'sua memoria', 'ta memoire', 'dein gedachtnis', 'tua memoria', 'твоя память'],
    generic: ['remember that', 'remember things', 'forget that', 'recuerdes', 'acordarte', 'acuerdes', 'olvides', 'lembrar de', 'te souvenir', 'dir merken', 'ricordarti', 'запомнила', 'запомнить', '覚えて', '記憶', '기억해', '기억', '记住', '记忆'],
    text: {
      en: ['Remember things', 'Say {say} and I keep it. Ask {say2} to hear it back, or "forget that..." to delete it.'],
      es: ['Recordar cosas', 'Decí {say} y me lo guardo. Preguntame {say2} para escucharlo, o "olvidate de que..." para borrarlo.'],
      pt: ['Lembrar coisas', 'Diga {say} e eu guardo. Pergunte {say2} para ouvir de volta, ou "esquece que..." para apagar.'],
      fr: ['Me souvenir de choses', 'Dis {say} et je le garde. Demande {say2} pour l\'entendre, ou "oublie que..." pour l\'effacer.'],
      de: ['Mir Dinge merken', 'Sag {say} und ich behalte es. Frag {say2}, um es zu hören, oder "vergiss dass...", um es zu löschen.'],
      it: ['Ricordare le cose', 'Di\' {say} e lo tengo a mente. Chiedi {say2} per sentirlo, o "dimentica che..." per cancellarlo.'],
      ru: ['Запоминать', 'Скажи {say}, и я запомню. Спроси {say2}, чтобы услышать, или «забудь что...», чтобы удалить.'],
      ja: ['覚えておく', '{say}と言えば覚えておくよ。{say2}と聞けば教えるし、「…のことは忘れて」で消せるよ。'],
      ko: ['기억하기', '{say}라고 하면 기억해둘게. {say2}라고 물으면 알려주고, "...는 잊어줘"라고 하면 지울게.'],
      zh: ['记住事情', '说{say}我就记下来。问{say2}可以听我说回来，说“忘掉……”就删掉。']
    }
  },
  {
    id: 'macros',
    category: 'memory',
    commands: ['list macros'],
    say: {
      en: ['list macros'], fr: ['liste mes macros'], de: ['zeig meine makros'], it: ['elenca le mie macro'], pt: ['lista minhas macros'], ru: ['покажи мои макросы'],
      ja: ['マクロを見せて'], ko: ['매크로 보여줘'], zh: ['显示我的宏'], es: ['mostrame los macros']
    },
    keywords: ['when i say', 'cuando diga', 'quando eu disser', 'quand je dis', 'wenn ich sage', 'quando dico'],
    generic: ['macro', 'macros', 'routine', 'shortcut phrase', 'rutina', 'макрос', 'マクロ', '매크로', '宏'],
    text: {
      en: ['Macros', 'Teach me a routine: "when I say game time, open League and play my playlist". Say the phrase and I do it all. {say} shows the ones you saved.'],
      es: ['Macros', 'Enseñame una rutina: "cuando diga hora de jugar, abrí el LoL y poné mi playlist". Decís la frase y hago todo. {say} te muestra los que guardaste.'],
      pt: ['Macros', 'Me ensine uma rotina: "when I say game time, open League and play my playlist". Diga a frase e eu faço tudo. {say} mostra as que você salvou.'],
      fr: ['Macros', 'Apprends-moi une routine : "when I say game time, open League and play my playlist". Dis la phrase et je fais tout. {say} montre celles que tu as enregistrées.'],
      de: ['Makros', 'Bring mir eine Routine bei: "when I say game time, open League and play my playlist". Sag den Satz und ich mache alles. {say} zeigt deine gespeicherten.'],
      it: ['Macro', 'Insegnami una routine: "when I say game time, open League and play my playlist". Di\' la frase e faccio tutto. {say} mostra quelle salvate.'],
      ru: ['Макросы', 'Научи меня сценарию: «when I say game time, open League and play my playlist». Скажи фразу, и я всё сделаю. {say} покажет сохранённые.'],
      ja: ['マクロ', '「when I say game time, open League and play my playlist」みたいにルーティンを教えてね。そのフレーズを言えば全部やるよ。{say}で保存したものを見せるよ。'],
      ko: ['매크로', '"when I say game time, open League and play my playlist"처럼 루틴을 가르쳐줘. 그 말을 하면 다 해줄게. {say}라고 하면 저장한 걸 보여줘.'],
      zh: ['宏', '教我一个流程：“when I say game time, open League and play my playlist”。你说出那句话，我就全部做完。{say}可以查看保存的宏。']
    }
  },
  {
    id: 'draw',
    category: 'create',
    platforms: ['win32'],
    commands: ['draw {x}'],
    say: {
      en: ['draw a cat'], es: ['dibujá un gato'], fr: ['dessine un chat'], de: ['zeichne eine katze'], it: ['disegna un gatto'], pt: ['desenha um gato'], ru: ['нарисуй кота'],
      ja: ['猫を描いて'], ko: ['고양이 그려줘'], zh: ['画一个猫']
    },
    keywords: [],
    generic: ['draw', 'paint', 'drawing', 'dibuj', 'pinta', 'desenh', 'dessin', 'zeichn', 'malen', 'disegn', 'рису', '描', '絵', '그려', '그림', '画'],
    text: {
      en: ['Draw in Paint', 'Say {say} and I open Paint and draw it myself, hands off the mouse while I work.'],
      es: ['Dibujar en Paint', 'Decí {say} y abro Paint y lo dibujo yo, sin que toques el mouse mientras trabajo.'],
      pt: ['Desenhar no Paint', 'Diga {say} e eu abro o Paint e desenho sozinha; não mexa no mouse enquanto trabalho.'],
      fr: ['Dessiner dans Paint', 'Dis {say} et j\'ouvre Paint pour le dessiner moi-même ; ne touche pas la souris pendant que je travaille.'],
      de: ['In Paint zeichnen', 'Sag {say} und ich öffne Paint und zeichne es selbst; Finger weg von der Maus, während ich arbeite.'],
      it: ['Disegnare in Paint', 'Di\' {say} e apro Paint e lo disegno io; non toccare il mouse mentre lavoro.'],
      ru: ['Рисовать в Paint', 'Скажи {say}, и я открою Paint и нарисую сама; не трогай мышь, пока я рисую.'],
      ja: ['ペイントで描く', '{say}と言えばペイントを開いて自分で描くよ。描いてる間はマウスに触らないでね。'],
      ko: ['그림판에 그리기', '{say}라고 하면 그림판을 열고 내가 직접 그려. 그리는 동안 마우스는 건드리지 마.'],
      zh: ['用画图画画', '说{say}，我就打开画图自己画；我画的时候别碰鼠标哦。']
    }
  },
  {
    id: 'updates',
    category: 'app',
    check: 'version',
    say: {
      en: ['what version are you'], es: ['qué versión tenés'], pt: ['qual versao voce'], fr: ['quelle version es tu'], de: ['welche version bist du'], it: ['che versione sei'],
      ru: ['какая у тебя версия'], ja: ['どのバージョン'], ko: ['무슨 버전'], zh: ['什么版本']
    },
    keywords: [],
    generic: ['update', 'version', 'new version', 'whats new', 'actualiz', 'version', 'novedades', 'atualiz', 'versao', 'mise a jour', 'aktualis', 'aggiorn', 'versione', 'обнов', 'верси', 'アップデート', 'バージョン', '업데이트', '버전', '更新', '版本'],
    text: {
      en: ['Updates', 'Ask {say} and I tell you; "update yourself" installs the latest version and "what\'s new?" tells you what changed.'],
      es: ['Actualizaciones', 'Preguntame {say} y te digo; "actualizate" instala la última versión y "¿qué hay de nuevo?" te cuenta qué cambió.'],
      pt: ['Atualizações', 'Pergunte {say} e eu digo; "se atualiza" instala a versão mais nova e "o que há de novo?" conta o que mudou.'],
      fr: ['Mises à jour', 'Demande {say} et je te le dis ; "mets toi à jour" installe la dernière version et "quoi de neuf ?" raconte ce qui a changé.'],
      de: ['Updates', 'Frag {say} und ich sag es dir; "aktualisiere dich" installiert die neueste Version und "was ist neu?" erzählt, was sich geändert hat.'],
      it: ['Aggiornamenti', 'Chiedi {say} e te lo dico; "aggiornati" installa l\'ultima versione e "cosa c\'è di nuovo?" ti racconta cosa è cambiato.'],
      ru: ['Обновления', 'Спроси {say}, и я скажу; «обновись» установит последнюю версию, а «что нового?» расскажет, что изменилось.'],
      ja: ['アップデート', '{say}と聞けば教えるよ。「アップデートして」で最新版を入れて、「何が新しい？」で変わったことを話すね。'],
      ko: ['업데이트', '{say}라고 물으면 알려줄게. "업데이트해"라고 하면 최신 버전을 설치하고, "뭐가 새로워?"라고 하면 바뀐 걸 알려줘.'],
      zh: ['更新', '问{say}我就告诉你；说“更新一下”会安装最新版本，问“有什么新功能？”我就讲讲改了什么。']
    }
  },
  {
    id: 'brain',
    category: 'app',
    say: {},
    keywords: ['your brain', 'change your model', 'ollama', 'tu cerebro', 'cambiar el modelo'],
    generic: ['brain', 'ai model', 'change model', 'api key', 'cloud provider', 'cerebro', 'cambiar modelo', 'cerebro', 'trocar o modelo', 'cerveau', 'changer de modele', 'gehirn', 'modell wechseln', 'cervello', 'cambiare modello', 'мозг', 'сменить модель', '頭脳', 'モデルを変え', '두뇌', '모델 바꾸', '大脑', '换模型'],
    text: {
      en: ['My brain', 'My brain is the AI model I think with: a local one in Ollama, a cloud provider with your key, or an AI app you already use. Choose it in Settings > AI & models; Benchmark shows which one is fastest on your PC.'],
      es: ['Mi cerebro', 'Mi cerebro es el modelo de IA con el que pienso: uno local en Ollama, un proveedor en la nube con tu key, o una app de IA que ya uses. Se elige en Configuración > IA y modelos; Benchmark te muestra cuál es más rápido en tu PC.'],
      pt: ['Meu cérebro', 'Meu cérebro é o modelo de IA com que eu penso: um local no Ollama, um provedor na nuvem com sua chave, ou um app de IA que você já usa. Escolha em Configurações > IA e modelos; o Benchmark mostra qual é mais rápido no seu PC.'],
      fr: ['Mon cerveau', 'Mon cerveau, c\'est le modèle d\'IA avec lequel je pense : un modèle local dans Ollama, un fournisseur cloud avec ta clé, ou une appli d\'IA que tu utilises déjà. Choisis-le dans Paramètres > IA et modèles ; Benchmark montre lequel est le plus rapide sur ton PC.'],
      de: ['Mein Gehirn', 'Mein Gehirn ist das KI-Modell, mit dem ich denke: ein lokales in Ollama, ein Cloud-Anbieter mit deinem Schlüssel oder eine KI-App, die du schon nutzt. Wähle es unter Einstellungen > KI & Modelle; Benchmark zeigt, welches auf deinem PC am schnellsten ist.'],
      it: ['Il mio cervello', 'Il mio cervello è il modello di IA con cui penso: uno locale in Ollama, un provider cloud con la tua chiave, o un\'app di IA che usi già. Si sceglie in Impostazioni > IA e modelli; Benchmark mostra quale è più veloce sul tuo PC.'],
      ru: ['Мой мозг', 'Мой мозг — это модель ИИ, которой я думаю: локальная в Ollama, облачный провайдер с твоим ключом или ИИ-приложение, которым ты уже пользуешься. Выбери в Настройки > ИИ и модели; Бенчмарк покажет, какая быстрее на твоём ПК.'],
      ja: ['私の頭脳', '頭脳は私が考えるためのAIモデルだよ。Ollamaのローカルモデル、キーを使うクラウド、またはいつも使ってるAIアプリ。設定 > AIとモデルで選んでね。ベンチマークでPCに一番速いものがわかるよ。'],
      ko: ['내 두뇌', '내 두뇌는 내가 생각할 때 쓰는 AI 모델이야. Ollama의 로컬 모델, 네 키를 쓰는 클라우드, 또는 이미 쓰는 AI 앱이 있어. 설정 > AI 및 모델에서 고르고, 벤치마크로 네 PC에서 제일 빠른 걸 확인해.'],
      zh: ['我的大脑', '我的大脑就是我用来思考的 AI 模型：Ollama 里的本地模型、用你的密钥的云服务，或你已经在用的 AI 应用。在设置 > AI 与模型里选择；基准测试会告诉你哪个在你电脑上最快。']
    }
  },
  {
    id: 'bug-report',
    category: 'app',
    say: {},
    keywords: ['bug report', 'report a bug', 'report a problem', 'report an issue', 'reportar un bug', 'reportar un problema', 'reporte de bug', 'relatorio de bug', 'signaler un bug', 'rapport de bug', 'fehlerbericht', 'segnalare un bug', 'отчёт об ошибке', 'バグレポート', '버그 리포트', '错误报告'],
    generic: ['your logs', 'logs', 'crash', 'tus logs', 'reportar um bug', 'fehler melden', 'segnalazione', 'сообщить об ошибке', 'логи', 'バグ報告', 'ログ', '버그 신고', '로그', '报告错误', '日志'],
    text: {
      en: ['Report a problem', 'If something breaks, open Settings and press "Copy bug report": it copies my logs and your system info (no keys) so you can paste them in a GitHub issue or send them to the developer. Settings > Logs shows everything live.'],
      es: ['Reportar un problema', 'Si algo falla, abrí Configuración y apretá "Copiar reporte de bug": copia mis logs y la info de tu sistema (sin keys) para que lo pegues en un issue de GitHub o se lo mandes al desarrollador. Configuración > Logs muestra todo en vivo.'],
      pt: ['Reportar um problema', 'Se algo der errado, abra Configurações e aperte "Copiar relatório de bug": copia meus logs e as informações do seu sistema (sem chaves) para colar numa issue do GitHub ou enviar ao desenvolvedor. Configurações > Logs mostra tudo ao vivo.'],
      fr: ['Signaler un problème', 'Si quelque chose casse, ouvre les Paramètres et appuie sur "Copier le rapport de bug" : ça copie mes logs et les infos de ton système (sans clés) pour une issue GitHub ou pour le développeur. Paramètres > Logs montre tout en direct.'],
      de: ['Ein Problem melden', 'Wenn etwas kaputtgeht, öffne die Einstellungen und drück "Fehlerbericht kopieren": Das kopiert meine Logs und deine Systeminfos (ohne Schlüssel) für ein GitHub-Issue oder den Entwickler. Einstellungen > Logs zeigt alles live.'],
      it: ['Segnalare un problema', 'Se qualcosa si rompe, apri le Impostazioni e premi "Copia segnalazione bug": copia i miei log e le info del tuo sistema (senza chiavi) da incollare in una issue su GitHub o inviare allo sviluppatore. Impostazioni > Log mostra tutto dal vivo.'],
      ru: ['Сообщить о проблеме', 'Если что-то сломалось, открой Настройки и нажми «Скопировать отчёт об ошибке»: он копирует мои логи и сведения о системе (без ключей), чтобы вставить в issue на GitHub или отправить разработчику. Настройки > Логи показывают всё вживую.'],
      ja: ['問題を報告する', '何か壊れたら、設定を開いて「バグレポートをコピー」を押してね。ログとシステム情報（キーなし）をコピーするから、GitHubのIssueに貼るか開発者に送って。設定 > ログでリアルタイムに見られるよ。'],
      ko: ['문제 신고하기', '뭔가 고장 나면 설정을 열고 "버그 리포트 복사"를 눌러. 내 로그와 시스템 정보(키 제외)를 복사하니까 GitHub 이슈에 붙이거나 개발자에게 보내줘. 설정 > 로그에서 실시간으로 볼 수 있어.'],
      zh: ['报告问题', '如果出了问题，打开设置点“复制错误报告”：会复制我的日志和你的系统信息（不含密钥），贴到 GitHub Issue 或发给开发者。设置 > 日志可以实时查看。']
    }
  }
]

/** "Control+Alt+M" -> "Ctrl+Alt+M", arrows as arrows; on a Mac, Super is Cmd and Alt is Option */
export function prettyHotkey(accelerator: string, platform = 'win32'): string {
  const mac = platform === 'darwin'
  const names: Record<string, string> = { Control: 'Ctrl', Super: mac ? 'Cmd' : 'Win', Alt: mac ? 'Option' : 'Alt', Up: '↑', Down: '↓', Left: '←', Right: '→', Return: 'Enter' }
  return accelerator
    .split('+')
    .map((part) => names[part] ?? part)
    .join('+')
}

const quote = (lang: HelpLang, phrase: string): string => (lang === 'ja' ? `「${phrase}」` : lang === 'zh' ? `“${phrase}”` : `"${phrase}"`)

/** The capability's how-to text in a language, with its examples and the user's keys filled in */
export function capabilityHowTo(cap: Capability, lang: HelpLang, hotkeys: Partial<Record<HotkeyAction, string>> = {}, platform = 'win32'): string {
  const say = cap.say[lang] ?? cap.say.en ?? []
  return cap.text[lang][1]
    .replace('{say}', say[0] ? quote(lang, say[0]) : '')
    .replace('{say2}', say[1] ? quote(lang, say[1]) : '')
    .replace(/\{hotkey:(\w+)\}/g, (_m, action: HotkeyAction) => (hotkeys[action] ? prettyHotkey(hotkeys[action] as string, platform) : action))
}

export const capabilityAvailable = (cap: Capability, platform: string): boolean => !cap.platforms || (cap.platforms as string[]).includes(platform)

export function asHelpLang(lang: string | null | undefined): HelpLang {
  const short = String(lang || '').slice(0, 2).toLowerCase()
  return (HELP_LANGS as string[]).includes(short) ? (short as HelpLang) : 'en'
}
