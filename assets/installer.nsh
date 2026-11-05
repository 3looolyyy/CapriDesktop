; Cyberpunk 2077 look for the NSIS installer (included by electron-builder, see electron-builder.yml).
; Colors and texts are defined in customWelcomePage because it is inserted before any other page,
; which is where MUI2 reads its interface settings. The texts are LangStrings declared in
; customHeader, which runs after the languages are loaded.

!macro customWelcomePage
  !define MUI_BGCOLOR "0A0A0F"
  !define MUI_TEXTCOLOR "FCEE0A"
  !define MUI_INSTFILESPAGE_COLORS "FCEE0A 0A0A0F"
  !define MUI_INSTFILESPAGE_PROGRESSBAR "colored"
  !define MUI_WELCOMEPAGE_TITLE "$(capriWelcomeTitle)"
  !define MUI_WELCOMEPAGE_TEXT "$(capriWelcomeText)"
  !define MUI_FINISHPAGE_TITLE "$(capriFinishTitle)"
  !define MUI_FINISHPAGE_TEXT "$(capriFinishText)"
  !define MUI_FINISHPAGE_RUN_TEXT "$(capriFinishRun)"
  !insertmacro MUI_PAGE_WELCOME
!macroend

; Same finish page electron-builder builds by default, plus a show callback: the "run Capri" checkbox
; is drawn by the Windows theme, which ignores MUI_TEXTCOLOR and left its text dark on the dark
; background. Dropping the theme on that one control lets SetCtlColors paint it.
!macro customFinishPage
  Function StartApp
    ${if} ${isUpdated}
      StrCpy $1 "--updated"
    ${else}
      StrCpy $1 ""
    ${endif}
    ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
  FunctionEnd

  !define MUI_FINISHPAGE_RUN
  !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW capriFinishShow
  !insertmacro MUI_PAGE_FINISH

  ; Defined after the page because MUI_PAGE_FINISH is what declares $mui.FinishPage.Run
  Function capriFinishShow
    StrCpy $0 $mui.FinishPage.Run
    System::Call 'UxTheme::SetWindowTheme(p r0, w "", w "")'
    SetCtlColors $0 "FCEE0A" "0A0A0F"
  FunctionEnd
!macroend

!macro customUnWelcomePage
  !define MUI_BGCOLOR "0A0A0F"
  !define MUI_TEXTCOLOR "FF003C"
  !define MUI_INSTFILESPAGE_COLORS "FF003C 0A0A0F"
  !define MUI_INSTFILESPAGE_PROGRESSBAR "colored"
  !define MUI_WELCOMEPAGE_TITLE "$(capriUnTitle)"
  !define MUI_WELCOMEPAGE_TEXT "$(capriUnText)"
  !define MUI_FINISHPAGE_TITLE "$(capriUnFinishTitle)"
  !define MUI_FINISHPAGE_TEXT "$(capriUnFinishText)"
  !insertmacro MUI_UNPAGE_WELCOME
!macroend

; Only when the user uninstalls by hand: an update also runs the old uninstaller, and it must keep everything.
; cyber-companion is left out on purpose: it's the data of whoever runs her from source too.
!macro customUnInstall
  ${ifNot} ${isUpdated}
    IfSilent capriKeepData
    MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 "$(capriUnDeleteData)" IDNO capriKeepData
    SetShellVarContext current
    RMDir /r "$APPDATA\capridesktop"
    RMDir /r "$APPDATA\Cyber Companion"
    capriKeepData:
  ${endIf}
!macroend

!macro customHeader
  LangString capriWelcomeTitle ${LANG_SPANISHINTERNATIONAL} "Capri se está conectando a tu PC"
  LangString capriWelcomeTitle ${LANG_ENGLISH} "Capri is jacking into your PC"
  LangString capriWelcomeText ${LANG_SPANISHINTERNATIONAL} "Este asistente va a instalar a Capri, Project Capricorn: tu compañera netrunner de escritorio.$\r$\n$\r$\nCuando termine, Capri se presenta, te pregunta cómo llamarte y prepara su voz y su cerebro.$\r$\n$\r$\nAgarrate, choom: se viene el caos."
  LangString capriWelcomeText ${LANG_ENGLISH} "This wizard will install Capri, Project Capricorn: your netrunner desktop companion.$\r$\n$\r$\nWhen it's done, Capri introduces herself, asks what to call you and sets up her voice and brain.$\r$\n$\r$\nBuckle up, choom: chaos incoming."
  LangString capriFinishTitle ${LANG_SPANISHINTERNATIONAL} "Capri está online"
  LangString capriFinishTitle ${LANG_ENGLISH} "Capri is online"
  LangString capriFinishText ${LANG_SPANISHINTERNATIONAL} "La instalación terminó.$\r$\n$\r$\nCapri te está esperando en el escritorio para presentarse."
  LangString capriFinishText ${LANG_ENGLISH} "Installation complete.$\r$\n$\r$\nCapri is waiting on your desktop to introduce herself."
  LangString capriFinishRun ${LANG_SPANISHINTERNATIONAL} "Despertar a Capri ahora"
  LangString capriFinishRun ${LANG_ENGLISH} "Wake Capri up now"
  LangString capriUnTitle ${LANG_SPANISHINTERNATIONAL} "¿Desconectar a Capri?"
  LangString capriUnTitle ${LANG_ENGLISH} "Disconnect Capri?"
  LangString capriUnText ${LANG_SPANISHINTERNATIONAL} "Este asistente va a quitar a Capri de tu PC.$\r$\n$\r$\nTu nombre, los dibujos que aprendió y su configuración quedan guardados por si volvés, choom."
  LangString capriUnText ${LANG_ENGLISH} "This wizard will remove Capri from your PC.$\r$\n$\r$\nYour name, the drawings she learned and her settings stay saved in case you come back, choom."
  LangString capriUnFinishTitle ${LANG_SPANISHINTERNATIONAL} "Link terminado"
  LangString capriUnFinishTitle ${LANG_ENGLISH} "Link terminated"
  LangString capriUnDeleteData ${LANG_SPANISHINTERNATIONAL} "¿Borrar también tus datos de Capri?$\r$\n$\r$\nSe borran tus memorias, ajustes, macros y API keys, y no se puede deshacer. Los modelos de Ollama no se tocan."
  LangString capriUnFinishText ${LANG_SPANISHINTERNATIONAL} "Capri se desconectó de tu PC. Nos vemos en Night City."
  LangString capriUnDeleteData ${LANG_ENGLISH} "Delete your Capri data too?$\r$\n$\r$\nThis deletes your memories, settings, macros and API keys, and can't be undone. Ollama's models aren't touched."
  LangString capriUnFinishText ${LANG_ENGLISH} "Capri has disconnected from your PC. See you in Night City."
  LangString capriWelcomeTitle ${LANG_PORTUGUESEBR} "A Capri está se conectando ao seu PC"
  LangString capriWelcomeText ${LANG_PORTUGUESEBR} "Este assistente vai instalar a Capri, Project Capricorn: sua companheira netrunner de desktop.$\r$\n$\r$\nAo terminar, a Capri se apresenta, pergunta como te chamar e prepara a voz e o cérebro dela.$\r$\n$\r$\nSegura firme, choom: vem caos aí."
  LangString capriFinishTitle ${LANG_PORTUGUESEBR} "A Capri está online"
  LangString capriFinishText ${LANG_PORTUGUESEBR} "A instalação terminou.$\r$\n$\r$\nA Capri está te esperando na área de trabalho para se apresentar."
  LangString capriFinishRun ${LANG_PORTUGUESEBR} "Despertar a Capri agora"
  LangString capriUnTitle ${LANG_PORTUGUESEBR} "Desconectar a Capri?"
  LangString capriUnText ${LANG_PORTUGUESEBR} "Este assistente vai remover a Capri do seu PC.$\r$\n$\r$\nSeu nome, os desenhos que ela aprendeu e as configurações ficam guardados caso você volte, choom."
  LangString capriUnFinishTitle ${LANG_PORTUGUESEBR} "Conexão encerrada"
  LangString capriUnDeleteData ${LANG_PORTUGUESEBR} "Apagar também seus dados da Capri?$\r$\n$\r$\nIsso apaga suas memórias, ajustes, macros e chaves de API, e não pode ser desfeito. Os modelos do Ollama não são afetados."
  LangString capriUnFinishText ${LANG_PORTUGUESEBR} "A Capri se desconectou do seu PC. Até mais em Night City."
  LangString capriWelcomeTitle ${LANG_FRENCH} "Capri se connecte à ton PC"
  LangString capriWelcomeText ${LANG_FRENCH} "Cet assistant va installer Capri, Project Capricorn : ta compagne netrunner de bureau.$\r$\n$\r$\nÀ la fin, Capri se présente, te demande comment t’appeler et prépare sa voix et son cerveau.$\r$\n$\r$\nAccroche-toi, choom : le chaos arrive."
  LangString capriFinishTitle ${LANG_FRENCH} "Capri est en ligne"
  LangString capriFinishText ${LANG_FRENCH} "Installation terminée.$\r$\n$\r$\nCapri t’attend sur le bureau pour se présenter."
  LangString capriFinishRun ${LANG_FRENCH} "Réveiller Capri maintenant"
  LangString capriUnTitle ${LANG_FRENCH} "Déconnecter Capri ?"
  LangString capriUnText ${LANG_FRENCH} "Cet assistant va retirer Capri de ton PC.$\r$\n$\r$\nTon nom, les dessins qu’elle a appris et ses réglages restent enregistrés si tu reviens, choom."
  LangString capriUnFinishTitle ${LANG_FRENCH} "Liaison terminée"
  LangString capriUnDeleteData ${LANG_FRENCH} "Supprimer aussi tes données de Capri ?$\r$\n$\r$\nCela supprime tes souvenirs, réglages, macros et clés API, sans retour possible. Les modèles d'Ollama ne sont pas touchés."
  LangString capriUnFinishText ${LANG_FRENCH} "Capri s’est déconnectée de ton PC. À bientôt à Night City."
  LangString capriWelcomeTitle ${LANG_GERMAN} "Capri verbindet sich mit deinem PC"
  LangString capriWelcomeText ${LANG_GERMAN} "Dieser Assistent installiert Capri, Project Capricorn: deine Netrunner-Begleiterin für den Desktop.$\r$\n$\r$\nDanach stellt Capri sich vor, fragt, wie sie dich nennen soll, und richtet ihre Stimme und ihr Gehirn ein.$\r$\n$\r$\nHalt dich fest, Choom: Das Chaos kommt."
  LangString capriFinishTitle ${LANG_GERMAN} "Capri ist online"
  LangString capriFinishText ${LANG_GERMAN} "Die Installation ist abgeschlossen.$\r$\n$\r$\nCapri wartet auf deinem Desktop, um sich vorzustellen."
  LangString capriFinishRun ${LANG_GERMAN} "Capri jetzt wecken"
  LangString capriUnTitle ${LANG_GERMAN} "Capri trennen?"
  LangString capriUnText ${LANG_GERMAN} "Dieser Assistent entfernt Capri von deinem PC.$\r$\n$\r$\nDein Name, ihre gelernten Zeichnungen und ihre Einstellungen bleiben gespeichert, falls du zurückkommst, Choom."
  LangString capriUnFinishTitle ${LANG_GERMAN} "Verbindung beendet"
  LangString capriUnDeleteData ${LANG_GERMAN} "Auch deine Capri-Daten löschen?$\r$\n$\r$\nDas löscht deine Erinnerungen, Einstellungen, Makros und API-Schlüssel und kann nicht rückgängig gemacht werden. Die Ollama-Modelle bleiben erhalten."
  LangString capriUnFinishText ${LANG_GERMAN} "Capri hat sich von deinem PC getrennt. Wir sehen uns in Night City."
  LangString capriWelcomeTitle ${LANG_ITALIAN} "Capri si sta collegando al tuo PC"
  LangString capriWelcomeText ${LANG_ITALIAN} "Questa procedura installerà Capri, Project Capricorn: la tua compagna netrunner da desktop.$\r$\n$\r$\nAlla fine Capri si presenta, ti chiede come chiamarti e prepara la sua voce e il suo cervello.$\r$\n$\r$\nTieniti forte, choom: arriva il caos."
  LangString capriFinishTitle ${LANG_ITALIAN} "Capri è online"
  LangString capriFinishText ${LANG_ITALIAN} "Installazione completata.$\r$\n$\r$\nCapri ti aspetta sul desktop per presentarsi."
  LangString capriFinishRun ${LANG_ITALIAN} "Sveglia Capri adesso"
  LangString capriUnTitle ${LANG_ITALIAN} "Disconnettere Capri?"
  LangString capriUnText ${LANG_ITALIAN} "Questa procedura rimuoverà Capri dal tuo PC.$\r$\n$\r$\nIl tuo nome, i disegni che ha imparato e le impostazioni restano salvati nel caso tornassi, choom."
  LangString capriUnFinishTitle ${LANG_ITALIAN} "Collegamento terminato"
  LangString capriUnDeleteData ${LANG_ITALIAN} "Eliminare anche i tuoi dati di Capri?$\r$\n$\r$\nVerranno eliminati ricordi, impostazioni, macro e chiavi API, senza possibilità di annullare. I modelli di Ollama non vengono toccati."
  LangString capriUnFinishText ${LANG_ITALIAN} "Capri si è disconnessa dal tuo PC. Ci vediamo a Night City."
  LangString capriWelcomeTitle ${LANG_RUSSIAN} "Капри подключается к твоему ПК"
  LangString capriWelcomeText ${LANG_RUSSIAN} "Этот мастер установит Капри, Project Capricorn: твою спутницу-нетраннера на рабочем столе.$\r$\n$\r$\nПосле этого Капри представится, спросит, как тебя называть, и настроит голос и мозг.$\r$\n$\r$\nДержись, чумба: начинается хаос."
  LangString capriFinishTitle ${LANG_RUSSIAN} "Капри в сети"
  LangString capriFinishText ${LANG_RUSSIAN} "Установка завершена.$\r$\n$\r$\nКапри ждёт на рабочем столе, чтобы представиться."
  LangString capriFinishRun ${LANG_RUSSIAN} "Разбудить Капри"
  LangString capriUnTitle ${LANG_RUSSIAN} "Отключить Капри?"
  LangString capriUnText ${LANG_RUSSIAN} "Этот мастер удалит Капри с твоего ПК.$\r$\n$\r$\nТвоё имя, выученные рисунки и настройки останутся на случай, если вернёшься, чумба."
  LangString capriUnFinishTitle ${LANG_RUSSIAN} "Связь разорвана"
  LangString capriUnDeleteData ${LANG_RUSSIAN} "Удалить и твои данные Капри?$\r$\n$\r$\nБудут удалены воспоминания, настройки, макросы и API-ключи, отменить это нельзя. Модели Ollama не затрагиваются."
  LangString capriUnFinishText ${LANG_RUSSIAN} "Капри отключилась от твоего ПК. Увидимся в Найт-Сити."
  LangString capriWelcomeTitle ${LANG_JAPANESE} "カプリがあなたのPCに接続しています"
  LangString capriWelcomeText ${LANG_JAPANESE} "このウィザードは、デスクトップの相棒ネットランナー、カプリ (Project Capricorn) をインストールします。$\r$\n$\r$\n完了後、カプリが自己紹介し、呼び名を聞いて、声と頭脳を準備します。$\r$\n$\r$\nしっかりつかまって、チューマ。カオスが来るよ。"
  LangString capriFinishTitle ${LANG_JAPANESE} "カプリ、オンライン"
  LangString capriFinishText ${LANG_JAPANESE} "インストールが完了しました。$\r$\n$\r$\nカプリがデスクトップで自己紹介を待っています。"
  LangString capriFinishRun ${LANG_JAPANESE} "今すぐカプリを起こす"
  LangString capriUnTitle ${LANG_JAPANESE} "カプリを切断しますか？"
  LangString capriUnText ${LANG_JAPANESE} "このウィザードはカプリをPCから削除します。$\r$\n$\r$\n名前、覚えた絵、設定は、戻ってきたときのために保存されます、チューマ。"
  LangString capriUnFinishTitle ${LANG_JAPANESE} "リンク終了"
  LangString capriUnDeleteData ${LANG_JAPANESE} "カプリのデータも削除しますか?$\r$\n$\r$\n記憶、設定、マクロ、APIキーが削除され、元に戻せません。Ollamaのモデルはそのまま残ります。"
  LangString capriUnFinishText ${LANG_JAPANESE} "カプリはPCから切断されました。ナイトシティでまた会おう。"
  LangString capriWelcomeTitle ${LANG_KOREAN} "카프리가 PC에 접속하고 있습니다"
  LangString capriWelcomeText ${LANG_KOREAN} "이 마법사는 바탕 화면의 넷러너 동료, 카프리(Project Capricorn)를 설치합니다.$\r$\n$\r$\n설치가 끝나면 카프리가 자기소개를 하고, 호칭을 묻고, 목소리와 두뇌를 준비합니다.$\r$\n$\r$\n꽉 잡아, 추움바. 혼돈이 온다."
  LangString capriFinishTitle ${LANG_KOREAN} "카프리 온라인"
  LangString capriFinishText ${LANG_KOREAN} "설치가 완료되었습니다.$\r$\n$\r$\n카프리가 바탕 화면에서 자기소개를 기다리고 있습니다."
  LangString capriFinishRun ${LANG_KOREAN} "지금 카프리 깨우기"
  LangString capriUnTitle ${LANG_KOREAN} "카프리 연결을 끊을까요?"
  LangString capriUnText ${LANG_KOREAN} "이 마법사는 PC에서 카프리를 제거합니다.$\r$\n$\r$\n이름, 배운 그림, 설정은 돌아올 때를 위해 저장됩니다, 추움바."
  LangString capriUnFinishTitle ${LANG_KOREAN} "연결 종료"
  LangString capriUnDeleteData ${LANG_KOREAN} "카프리 데이터도 삭제할까요?$\r$\n$\r$\n기억, 설정, 매크로, API 키가 삭제되며 되돌릴 수 없습니다. Ollama 모델은 그대로 유지됩니다."
  LangString capriUnFinishText ${LANG_KOREAN} "카프리가 PC에서 연결을 끊었습니다. 나이트 시티에서 만나."
  LangString capriWelcomeTitle ${LANG_SIMPCHINESE} "Capri 正在接入你的电脑"
  LangString capriWelcomeText ${LANG_SIMPCHINESE} "此向导将安装 Capri (Project Capricorn):你的桌面网络行者伙伴。$\r$\n$\r$\n完成后,Capri 会自我介绍,询问如何称呼你,并准备她的声音和大脑。$\r$\n$\r$\n抓紧了,伙计:混乱要来了。"
  LangString capriFinishTitle ${LANG_SIMPCHINESE} "Capri 已上线"
  LangString capriFinishText ${LANG_SIMPCHINESE} "安装完成。$\r$\n$\r$\nCapri 正在桌面上等着向你自我介绍。"
  LangString capriFinishRun ${LANG_SIMPCHINESE} "立即唤醒 Capri"
  LangString capriUnTitle ${LANG_SIMPCHINESE} "断开 Capri?"
  LangString capriUnText ${LANG_SIMPCHINESE} "此向导将从你的电脑上移除 Capri。$\r$\n$\r$\n你的名字、她学会的绘画和设置都会保留,以便你回来,伙计。"
  LangString capriUnFinishTitle ${LANG_SIMPCHINESE} "连接已终止"
  LangString capriUnDeleteData ${LANG_SIMPCHINESE} "同时删除你的 Capri 数据吗?$\r$\n$\r$\n这会删除你的记忆、设置、宏和 API 密钥,且无法撤销。Ollama 的模型不受影响。"
  LangString capriUnFinishText ${LANG_SIMPCHINESE} "Capri 已从你的电脑断开。夜之城再见。"
!macroend
