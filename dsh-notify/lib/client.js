// dsh-notify browser bundle. 任务提醒：纯浏览器端，零核心改动、零音频资源。
// 信号源 = 官方 client sessions 列表快照（sessions.list，与官方侧栏同源）：
//   - 任务结束：顶层会话 running 位 true→false（整轮任务结束才翻转）。随后拉
//     session.history 找最近 turn/end 的 reason 区分结束语义（参考社区插件做法）：
//     completed → 完成提示；error → 出错提示（❌ + 独立音色）；aborted（手动停止）
//     → 静默不算完成；blocked → 阻塞提示；其余按完成处理。
//   - 需要审批 / 计划待审 / 等待回答：会话 pendingInteraction 从无到有的边沿
//     （approval / plan-review / question），延迟 2.5s 才响（快速自动决定的不打扰），
//     期间已解决则取消。
// 提醒方式（设置 → 通用 →「任务提醒」折叠行，与「语言」「外观」同级条目；
// localStorage 持久化）：
//   - 提示音：Web Audio 合成音色库（零音频文件）——6 种音色（叮咚/清脆/三连音/
//     闷响/柔和/电子哔），完成/审批/回答/出错四事件各行内嵌音色下拉 + 试听，
//     音量滑条可调；音频上下文在首次点击页面时解锁（浏览器自动播放策略）。
//   - 弹窗：浏览器 Notification；未授权时自动退回页面内右上角悬浮提示
//     （点击提示跳转该会话，8 秒自动消失）。审批待处理时标签页标题附加 ⚠ 标记。
// 打扰规则：完成/出错提醒仅在页面不在前台（隐藏或失焦）时响；审批/回答提醒始终响。
// 安全设计：只读官方快照 + 自身状态机（prevRunning / prevPending），不碰 React 树；
// 卸载完全还原（移除样式/悬浮层/订阅/监听/定时器，恢复标题）。
window.__ModuleLoader__.load({
  id: 'dsh-notify',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    var React = require('react');

    // ── 样式：通用设置折叠行（官方第二层条目样式：无卡片边框、底部分隔线）+ 悬浮提示 ──
    var UI_CSS = [
      // 设置 → 通用 →「任务提醒」行（与官方「语言」「外观」行同款：无边框卡片、底部细线分隔）
      '.dshnotify-rowwrap{border-bottom:1px solid var(--dsw-alias-border-l2);padding:12px 0}',
      '.dshnotify-head{display:flex;align-items:center;justify-content:space-between;width:100%;border:none;background:none;color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;font-size:14px;padding:2px 0}',
      '.dshnotify-head:hover{color:var(--dsw-alias-brand-primary)}',
      '.dshnotify-chevron{transition:transform .15s;color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.dshnotify-chevron.dshnotify-open{transform:rotate(90deg)}',
      '.dshnotify-setbody{display:flex;flex-direction:column;gap:10px;margin-top:8px;padding-top:8px}',
      '.dshnotify-eventrow{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}',
      '.dshnotify-evleft{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;line-height:18px;color:var(--dsw-alias-label-primary)}',
      '.dshnotify-evleft input,.dshnotify-setrow input{accent-color:var(--dsw-alias-brand-primary);cursor:pointer;margin:0}',
      '.dshnotify-evright{display:flex;align-items:center;gap:8px}',
      '.dshnotify-hint{color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.dshnotify-hintline{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:16px}',
      '.dshnotify-select{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:3px 6px;font:inherit;font-size:12px;line-height:18px}',
      '.dshnotify-range{width:110px;accent-color:var(--dsw-alias-brand-primary);cursor:pointer}',
      '.dshnotify-volval{flex:none;width:40px;font-size:12px;color:var(--dsw-alias-label-secondary);text-align:right}',
      '.dshnotify-setrow{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;line-height:18px;color:var(--dsw-alias-label-primary)}',
      '.dshnotify-tests{display:flex;gap:8px;margin-top:2px}',
      '.dshnotify-test{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;padding:4px 12px;cursor:pointer}',
      '.dshnotify-test:hover{border-color:var(--dsw-alias-brand-primary)}',
      // 右上角悬浮提示（body 浮动层，最高层，覆盖审批弹层）
      '.dshnotify-box{position:fixed;top:16px;right:16px;z-index:2147483000;display:flex;flex-direction:column;gap:8px;max-width:340px;pointer-events:none}',
      '.dshnotify-toast{pointer-events:auto;display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:12px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-shadow-lv2);color:var(--dsw-alias-label-primary);cursor:pointer;animation:dshnotify-in .18s ease-out}',
      '.dshnotify-toast.dshnotify-out{opacity:0;transform:translateX(12px);transition:opacity .18s,transform .18s}',
      '.dshnotify-ico{flex:none;font-size:16px;line-height:20px}',
      '.dshnotify-toast.dshnotify-approval .dshnotify-ico{color:var(--dsw-alias-state-error-primary)}',
      '.dshnotify-toast.dshnotify-error .dshnotify-ico{color:var(--dsw-alias-state-error-primary)}',
      '.dshnotify-toast.dshnotify-done .dshnotify-ico{color:var(--dsw-alias-state-success-primary)}',
      '.dshnotify-toast.dshnotify-question .dshnotify-ico{color:var(--dsw-alias-state-warn-primary)}',
      '.dshnotify-txt{flex:1;min-width:0}',
      '.dshnotify-title{font-size:13px;font-weight:600;line-height:18px}',
      '.dshnotify-bodyline{font-size:12px;line-height:16px;color:var(--dsw-alias-label-secondary);margin-top:2px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
      '.dshnotify-x{flex:none;border:none;background:none;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:12px;line-height:16px;padding:0 2px}',
      '.dshnotify-x:hover{color:var(--dsw-alias-label-primary)}',
      '@keyframes dshnotify-in{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}'
    ].join('\n');
    function injectStyles() {
      if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="dsh-notify/ui"]') === null) {
        var tag = document.createElement('style');
        tag.dataset.plugin = 'dsh-notify';
        tag.dataset.pluginCss = 'dsh-notify/ui';
        tag.textContent = UI_CSS;
        document.head.appendChild(tag);
      }
    }
    function clearStaleElements() {
      try {
        var box = document.querySelector('.dshnotify-box');
        if (box !== null) box.remove();
      } catch (e) { /* 忽略 */ }
    }

    // ── 持久化：localStorage（第三方命名空间无法通过 settings RPC 写入）──
    var STORAGE_KEY = 'dsh-notify.settings';
    // 事件开关：done（完成）/ approval（审批）/ question（回答）/ error（出错）/
    // sound（提示音）/ popup（弹窗）；volume 音量；tones 各事件音色
    var DEFAULTS = {
      done: true, approval: true, question: true, error: true,
      sound: true, popup: true,
      awayOnly: false, // 默认前台也提醒；开启后仅页面不在前台时提醒
      volume: 0.5,
      tones: { done: 'ding', approval: 'triple', question: 'soft', error: 'deep' },
    };
    function defaultTones() {
      return { done: 'ding', approval: 'triple', question: 'soft', error: 'deep' };
    }
    function loadSettings() {
      var out = { done: true, approval: true, question: true, error: true, sound: true, popup: true, awayOnly: false, volume: 0.5, tones: defaultTones() };
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw !== null) {
          var parsed = JSON.parse(raw);
          if (parsed !== null && typeof parsed === 'object') {
            // 旧结构兼容：wait 开关拆分为 approval+question（wait 键存在时按它的值迁移）；
            // tones.wait → tones.approval
            if (parsed.done === true) out.done = true;
            if (parsed.approval !== undefined) out.approval = parsed.approval === true;
            else if (parsed.wait !== undefined) out.approval = parsed.wait === true;
            if (parsed.question !== undefined) out.question = parsed.question === true;
            else if (parsed.wait !== undefined) out.question = parsed.wait === true;
            if (parsed.error === true) out.error = true;
            if (parsed.sound === true) out.sound = true;
            if (parsed.popup === true) out.popup = true;
            if (parsed.awayOnly === true) out.awayOnly = true;
            if (typeof parsed.volume === 'number' && parsed.volume >= 0 && parsed.volume <= 1) out.volume = parsed.volume;
            if (parsed.tones !== null && typeof parsed.tones === 'object') {
              var t = parsed.tones;
              if (typeof t.done === 'string' && TONE_SEQS[t.done] !== undefined) out.tones.done = t.done;
              var waitTone = typeof t.wait === 'string' && TONE_SEQS[t.wait] !== undefined ? t.wait : undefined;
              if (typeof t.approval === 'string' && TONE_SEQS[t.approval] !== undefined) out.tones.approval = t.approval;
              else if (waitTone !== undefined) out.tones.approval = waitTone;
              if (typeof t.question === 'string' && TONE_SEQS[t.question] !== undefined) out.tones.question = t.question;
              if (typeof t.error === 'string' && TONE_SEQS[t.error] !== undefined) out.tones.error = t.error;
            }
          }
        }
      } catch (e) { /* 存储不可用 */ }
      volumeLevel = out.volume;
      return out;
    }
    function saveSettings(value) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch (e) { /* 存储不可用 */ }
    }

    // ── 提示音：Web Audio 合成音色库（零音频资源），音量可调 ──
    var audioCtx = null;
    var volumeLevel = 0.5; // apply 时从设置同步；0~1（默认 50%，调整后记住上次的值）
    function ensureAudio() {
      if (audioCtx === null) {
        try {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (typeof AC !== 'undefined') audioCtx = new AC();
        } catch (e) { audioCtx = null; }
      }
      if (audioCtx !== null && audioCtx.state === 'suspended') {
        try { audioCtx.resume(); } catch (e) { /* 忽略 */ }
      }
      return audioCtx;
    }
    function tone(ctx, freq, t0, dur, wave, gainVal) {
      try {
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = wave;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(gainVal, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.05);
      } catch (e) { /* 音频不可用则静默 */ }
    }
    // 音色库：每个音效 = 一串音符（频率/起始偏移/时长/波形/基准增益），
    // 实际增益 = 基准增益 × 音量（volumeLevel）。
    var TONE_SEQS = {
      // 叮咚：上行双音（A5→D6，正弦）—— 任务完成默认
      ding: [ [880, 0, 0.14, 'sine', 0.18], [1174.66, 0.13, 0.24, 'sine', 0.18] ],
      // 清脆：两个短高音（C6→G6，正弦）—— 轻快的确认音
      clear: [ [1046.5, 0, 0.09, 'sine', 0.16], [1567.98, 0.1, 0.14, 'sine', 0.16] ],
      // 三连音：急促三音（E5→C5→E5，三角波）—— 需要审批默认
      triple: [ [659.25, 0, 0.12, 'triangle', 0.2], [523.25, 0.14, 0.12, 'triangle', 0.2], [659.25, 0.28, 0.22, 'triangle', 0.2] ],
      // 闷响：下行双音（G4→D#4，三角波）—— 出错默认
      deep: [ [392, 0, 0.16, 'triangle', 0.2], [311.13, 0.16, 0.24, 'triangle', 0.2] ],
      // 柔和：单音长音（C5，正弦）—— 等待回答/阻塞默认
      soft: [ [523.25, 0, 0.22, 'sine', 0.15] ],
      // 电子哔：两声短哔（B5，正弦）
      beep: [ [987.77, 0, 0.08, 'sine', 0.16], [987.77, 0.12, 0.08, 'sine', 0.16] ],
    };
    var TONE_IDS = ['ding', 'clear', 'triple', 'deep', 'soft', 'beep'];
    // 音色名的 i18n key（zh/en 见 I18N）
    var TONE_NAME_KEYS = { ding: 'toneDing', clear: 'toneClear', triple: 'toneTriple', deep: 'toneDeep', soft: 'toneSoft', beep: 'toneBeep' };
    // ── 中英文界面文本（locale 服务不可用时回落中文）──
    var I18N_NS = 'dsh-notify';
    var I18N = {
      zh: {
        title: '任务提醒',
        done: '任务完成提醒', approval: '需要审批提醒', question: '等待回答提醒', error: '任务出错提醒',
        hintDone: '页面不在前台时提醒，手动停止不提醒', hintAlways: '始终提醒', hintAway: '页面不在前台时提醒',
        sound: '提示音', popup: '通知弹窗', hintPopup: '未授权时自动改用页面内右上角悬浮提示',
        volume: '音量', preview: '试听',
        testToast: '发测试通知', requestPerm: '授权浏览器通知',
        testToastBody: '这是 dsh-notify 的测试通知，点击关闭。',
        awayOnly: '仅页面不在前台时提醒', hintAwayOnly: '关闭后在前台也会提醒',
        hintLine: '「发测试通知」会顺便请求浏览器通知权限；提示音在首次点击页面后解锁（浏览器自动播放策略）。',
        toneDing: '叮咚', toneClear: '清脆', toneTriple: '三连音', toneDeep: '闷响', toneSoft: '柔和', toneBeep: '电子哔',
        notifDone: '任务完成', notifError: '任务出错', notifBlocked: '任务阻塞',
        notifApproval: '需要审批', notifPlanReview: '计划待审', notifQuestion: '等待回答',
        bodyDone: '已完成运行', bodyError: '执行出错', bodyBlocked: '等待你的处理',
        bodyApproval: '正在等待你的处理', bodyQuestion: '向你提了一个问题',
        badge: '需要审批',
      },
      en: {
        title: 'Task alerts',
        done: 'Completion alerts', approval: 'Approval alerts', question: 'Answer alerts', error: 'Error alerts',
        hintDone: 'Only when the page is not in the foreground; manual stops stay silent', hintAlways: 'Always', hintAway: 'Only when the page is not in the foreground',
        sound: 'Sound', popup: 'Popup notifications', hintPopup: 'Falls back to in-page toasts when not authorized',
        volume: 'Volume', preview: 'Preview',
        testToast: 'Send test notification', requestPerm: 'Authorize notifications',
        testToastBody: 'This is a dsh-notify test notification. Click to close.',
        awayOnly: 'Only when the page is not in the foreground', hintAwayOnly: 'When off, alerts also fire while the page is in the foreground',
        hintLine: 'The test button also requests browser notification permission; sounds unlock after the first click on the page (browser autoplay policy).',
        toneDing: 'Ding', toneClear: 'Chime', toneTriple: 'Triple', toneDeep: 'Deep', toneSoft: 'Soft', toneBeep: 'Beep',
        notifDone: 'Task done', notifError: 'Task failed', notifBlocked: 'Task blocked',
        notifApproval: 'Approval needed', notifPlanReview: 'Plan review', notifQuestion: 'Answer needed',
        bodyDone: 'finished running', bodyError: 'encountered an error', bodyBlocked: 'is waiting for you',
        bodyApproval: 'is waiting for your approval', bodyQuestion: 'asked you a question',
        badge: 'Approval needed',
      },
    };
    // 翻译函数：locale 服务可用时由 apply 用 bind() 接管（调用时读当前语言），否则回落中文
    var translate = function (key) {
      var v = I18N.zh[key];
      return v !== undefined ? v : key;
    };
    // 已注册字典的注销器（apply 注册，cleanup 注销；HMR 重载时先注销旧的再注册）
    var localeDisposers = null;
    // 播放一个音色；未知 id 回退默认音色
    function playTone(id) {
      var seq = TONE_SEQS[id];
      if (seq === undefined) seq = TONE_SEQS.ding;
      var ctx = ensureAudio();
      if (ctx === null) return;
      var t = ctx.currentTime + 0.02;
      for (var i = 0; i < seq.length; i++) {
        var s = seq[i];
        tone(ctx, s[0], t + s[1], s[2], s[3], s[4] * volumeLevel);
      }
    }
    // 多条提醒同时到达时，提示音 500ms 节流（悬浮提示不节流）
    var lastSoundAt = 0;
    function throttledPlay(fn) {
      var now = Date.now();
      if (now - lastSoundAt < 500) return;
      lastSoundAt = now;
      fn();
    }

    // ── 弹窗：浏览器 Notification，未授权/不可用退回页面内悬浮提示 ──
    var rootCtx = null; // apply 时写入，供悬浮提示点击跳转会话使用
    var toastBox = null;
    function canNativeNotify() {
      return typeof Notification !== 'undefined' && Notification.permission === 'granted';
    }
    function requestNotifyPermission() {
      if (typeof Notification === 'undefined') return;
      if (Notification.permission === 'granted' || Notification.permission === 'denied') return;
      try {
        var r = Notification.requestPermission();
        if (r !== null && r !== undefined && typeof r.then === 'function') {
          r.then(function () { /* 忽略 */ }, function () { /* 忽略 */ });
        }
      } catch (e) {
        try { Notification.requestPermission(function () { /* 忽略 */ }); } catch (e2) { /* 忽略 */ }
      }
    }
    function showToast(kind, title, body, sessionId) {
      if (typeof document === 'undefined') return;
      if (toastBox === null || !toastBox.isConnected) {
        toastBox = document.createElement('div');
        toastBox.className = 'dshnotify-box';
        document.body.appendChild(toastBox);
      }
      var el = document.createElement('div');
      el.className = 'dshnotify-toast dshnotify-' + kind;
      var icon = document.createElement('div');
      icon.className = 'dshnotify-ico';
      icon.textContent = kind === 'approval' ? '⚠' : kind === 'question' ? '❓' : kind === 'error' ? '✕' : '✓';
      var txt = document.createElement('div');
      txt.className = 'dshnotify-txt';
      var h = document.createElement('div');
      h.className = 'dshnotify-title';
      h.textContent = title;
      var b = document.createElement('div');
      b.className = 'dshnotify-bodyline';
      b.textContent = body;
      txt.appendChild(h);
      txt.appendChild(b);
      var close = document.createElement('button');
      close.className = 'dshnotify-x';
      close.textContent = '✕';
      close.addEventListener('click', function (ev) {
        ev.stopPropagation();
        dismiss();
      });
      el.appendChild(icon);
      el.appendChild(txt);
      el.appendChild(close);
      var dismissed = false;
      var timers = [];
      function dismiss() {
        if (dismissed) return;
        dismissed = true;
        for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
        el.classList.add('dshnotify-out');
        setTimeout(function () {
          if (el.isConnected) el.remove();
        }, 200);
      }
      el.addEventListener('click', function () {
        if (sessionId !== null && sessionId !== undefined) {
          try {
            var sessions = rootCtx !== null ? rootCtx.get('sessions') : undefined;
            if (sessions !== undefined && typeof sessions.open === 'function') sessions.open(sessionId);
          } catch (e) { /* 忽略 */ }
        }
        dismiss();
      });
      timers.push(setTimeout(dismiss, 8000));
      toastBox.appendChild(el);
      // 最多保留 4 条，避免堆积
      while (toastBox.children.length > 4) toastBox.firstElementChild.remove();
    }
    function notify(kind, title, body, sessionId) {
      // 系统通知（已授权时）作为附加通道：可能被系统/浏览器折叠，不能依赖
      if (canNativeNotify()) {
        try {
          var n = new Notification(title, { body: body });
          n.onclick = function () {
            try { window.focus(); } catch (e) { /* 忽略 */ }
            if (sessionId !== null && sessionId !== undefined) {
              try {
                var sessions = rootCtx !== null ? rootCtx.get('sessions') : undefined;
                if (sessions !== undefined && typeof sessions.open === 'function') sessions.open(sessionId);
              } catch (e) { /* 忽略 */ }
            }
            try { n.close(); } catch (e) { /* 忽略 */ }
          };
          setTimeout(function () { try { n.close(); } catch (e) { /* 忽略 */ } }, 15000);
        } catch (e) { /* 构造失败忽略，悬浮提示仍然显示 */ }
      }
      // 页面内右上角悬浮提示：始终显示（最可靠的"弹窗"通道）
      showToast(kind, title, body, sessionId);
    }

    // ── 标签页标题 ⚠ 标记：存在待审批会话时附加，全部解决后还原 ──
    var baseTitle = null;
    var badged = false;
    function setBadge(on) {
      if (on && !badged) {
        badged = true;
        baseTitle = document.title;
        document.title = '⚠ ' + translate('badge') + ' · ' + baseTitle;
      } else if (!on && badged) {
        badged = false;
        document.title = baseTitle;
        baseTitle = null;
      }
    }

    // ── 信号检测：sessions.list 快照边沿状态机 ──
    function displayTitleOf(entry) {
      if (entry.displayTitle !== undefined && entry.displayTitle !== '') return entry.displayTitle;
      if (entry.title !== undefined && entry.title !== '') return entry.title;
      return entry.id;
    }
    // 完成提醒只在页面不在前台（隐藏或失焦）时打扰
    function pageAway() {
      return typeof document === 'undefined' || document.hidden || !document.hasFocus();
    }
    // 审批/回答延迟（毫秒）：快速自动决定的不打扰（参考 dsh-win-notify 的 approvalWaitMs）
    var WAIT_DELAY_MS = 2500;
    // 完成边沿后异步拉会话日志，找最近 turn/end 的 reason（completed/error/aborted/…），
    // 用于区分「手动停止不算完成」「出错单独提示」。拉取失败时保守按完成处理。
    function fetchTurnEndReason(ctx, sessionId) {
      try {
        var connection = ctx.get('connection');
        if (connection === undefined || connection.api === undefined || connection.api.sessions === undefined || connection.api.sessions.history === undefined) return Promise.resolve(undefined);
        return connection.api.sessions.history({ sessionId: sessionId, maxMessages: 50 }).then(function (res) {
          if (res === null || res === undefined || !res.result || res.result.ok !== true || !res.result.value) return undefined;
          var events = res.result.value.events;
          if (!Array.isArray(events)) return undefined;
          for (var i = events.length - 1; i >= 0; i--) {
            var ev = events[i] && events[i].event;
            if (ev !== null && ev !== undefined && ev.type === 'turn/end' && ev.data && ev.data.reason) {
              return ev.data.reason.kind;
            }
          }
          return undefined;
        }).catch(function () { return undefined; });
      } catch (e) { return Promise.resolve(undefined); }
    }
    function createWatcher(ctx, getSettings) {
      var prevRunning = {};  // sessionId -> boolean（仅顶层会话）
      var prevPending = {};  // sessionId -> undefined | 'approval' | 'plan-review' | 'question'
      var pendingTimers = {}; // sessionId -> { kind, timer }（审批/回答延迟通知）
      var unsub = null;
      var started = false;

      function handle(snap) {
        if (snap === null || snap === undefined || snap.byId === undefined) return;
        var byId = snap.byId;
        var seen = {};
        var badge = false;
        for (var id in byId) {
          if (!Object.prototype.hasOwnProperty.call(byId, id)) continue;
          var entry = byId[id];
          seen[id] = true;
          var topLevel = entry.parentId === undefined && entry.origin !== 'subagent';
          // 任务完成：顶层会话 running true→false
          if (topLevel) {
            var rObserved = Object.prototype.hasOwnProperty.call(prevRunning, id);
            var prevR = rObserved ? prevRunning[id] : false;
            if (rObserved && prevR === true && entry.running === false) onCompleted(entry);
            prevRunning[id] = entry.running === true;
          }
          // 待审批/待审/待回答：pendingInteraction 从无到有的边沿（首次观察只记录）
          var p = entry.pendingInteraction;
          var pObserved = Object.prototype.hasOwnProperty.call(prevPending, id);
          if (!pObserved) {
            prevPending[id] = p;
          } else if (prevPending[id] !== p) {
            if (p === 'approval' || p === 'plan-review') scheduleWait(entry, p);
            else if (p === 'question') scheduleWait(entry, 'question');
            else cancelWait(id); // 已解决：取消未触发的延迟通知
            prevPending[id] = p;
          }
          if (p === 'approval' || p === 'plan-review') badge = true;
        }
        for (var old in prevRunning) if (!seen[old]) delete prevRunning[old];
        for (var old2 in prevPending) if (!seen[old2]) { cancelWait(old2); delete prevPending[old2]; }
        setBadge(badge);
      }

      // 延迟通知：审批/回答出现后稍等片刻再响，期间消失则取消（快速自动决定不打扰）。
      // 同类请求防重入；kind 变化（如 approval→plan-review 连续切换）时重建计时器，
      // 避免用旧 kind/旧标题触发。
      function scheduleWait(entry, kind) {
        var title = displayTitleOf(entry);
        var existing = pendingTimers[entry.id];
        if (existing !== undefined) {
          if (existing.kind === kind) return;
          clearTimeout(existing.timer);
        }
        pendingTimers[entry.id] = {
          kind: kind,
          timer: setTimeout(function () {
            delete pendingTimers[entry.id];
            fireWait(entry.id, kind, title);
          }, WAIT_DELAY_MS)
        };
      }
      function cancelWait(id) {
        var existing = pendingTimers[id];
        if (existing !== undefined) {
          clearTimeout(existing.timer);
          delete pendingTimers[id];
        }
      }
      // 审批/回答通知可点击跳转该会话（与完成/出错一致）
      function fireWait(sessionId, kind, title) {
        var s = getSettings();
        if (kind === 'question') {
          if (!s.question) return;
          if (s.sound) throttledPlay(function () { playTone(s.tones.question); });
          if (s.popup) notify('question', translate('notifQuestion'), title + ' ' + translate('bodyQuestion'), sessionId);
          return;
        }
        if (!s.approval) return;
        var label = kind === 'plan-review' ? translate('notifPlanReview') : translate('notifApproval');
        if (s.sound) throttledPlay(function () { playTone(s.tones.approval); });
        if (s.popup) notify('approval', label, title + ' ' + translate('bodyApproval'), sessionId);
      }

      function onCompleted(entry) {
        var s = getSettings();
        // 前台抑制仅在「仅页面不在前台时提醒」开启时生效（默认关闭：前台也提醒）
        if (s.awayOnly === true && !pageAway()) return;
        var title = displayTitleOf(entry);
        // 区分结束语义：手动停止（aborted）静默，出错/阻塞各自独立开关，其余按完成处理。
        // 注意：!done 只作用于 completed 路径——error 有自己的独立开关，不被 done 门控。
        fetchTurnEndReason(ctx, entry.id).then(function (reason) {
          var s2 = getSettings();
          if (reason === 'aborted') return; // 手动停止不算完成（参考 dsh-win-notify / dsh-notify-bark）
          if (reason === 'error') {
            if (!s2.error) return; // 出错提醒独立开关
            if (s2.sound) throttledPlay(function () { playTone(s2.tones.error); });
            if (s2.popup) notify('error', translate('notifError'), title + ' ' + translate('bodyError'), entry.id);
            return;
          }
          if (reason === 'blocked') {
            // 被阻塞（等待 agent 无法独自完成的事）：柔和提示，跟随完成开关
            if (!s2.done) return;
            if (s2.sound) throttledPlay(function () { playTone(s2.tones.question); });
            if (s2.popup) notify('question', translate('notifBlocked'), title + ' ' + translate('bodyBlocked'), entry.id);
            return;
          }
          if (!s2.done) return; // 仅 completed 路径受完成开关控制
          if (s2.sound) throttledPlay(function () { playTone(s2.tones.done); });
          if (s2.popup) notify('done', translate('notifDone'), title + ' ' + translate('bodyDone'), entry.id);
        });
      }

      function start() {
        if (started) return;
        started = true;
        try {
          var sessions = ctx.get('sessions');
          if (sessions !== undefined && sessions.list !== undefined && typeof sessions.list.subscribe === 'function') {
            unsub = sessions.list.subscribe(function () {
              try { handle(sessions.list.getSnapshot()); } catch (e) { /* 忽略 */ }
            });
            handle(sessions.list.getSnapshot()); // 首次观察只记录，不提醒
          }
        } catch (e) { /* 忽略 */ }
      }
      function stop() {
        if (unsub !== null) {
          try { unsub(); } catch (e) { /* 忽略 */ }
          unsub = null;
        }
        for (var id in pendingTimers) cancelWait(id);
        prevRunning = {};
        prevPending = {};
        started = false;
      }
      return { start: start, stop: stop };
    }

    // ── 设置 → 通用 →「任务提醒」折叠行（与「语言」「外观」同级的第二层条目）──
    // 布局：每个事件一行 = 开关 + 说明 + 音色下拉 + 试听（合并成一个部分）；
    // 提示音行 = 开关 + 音量滑条；弹窗行 = 开关；全部文本走中英文翻译。
    function NotifyRow(props) {
      var ctl = props.ctl;
      var tl = props.tl;
      var openState = React.useState(false);
      var tickState = React.useState(0);
      var open = openState[0];
      var setOpen = openState[1];
      var tick = tickState[0];
      var setTick = tickState[1];
      // 语言切换时重渲染（locale 服务存在时）
      React.useEffect(function () {
        if (props.locale !== undefined && typeof props.locale.subscribe === 'function') {
          return props.locale.subscribe(function () { setTick(function (v) { return v + 1; }); });
        }
        return undefined;
      }, []);
      var s = ctl.get();
      function setValue(key, value) {
        var next = {};
        for (var k in s) next[k] = s[k];
        next[key] = value;
        ctl.set(next);
        setTick(tick + 1);
      }
      function setTone(eventKey, toneId) {
        var nextTones = {};
        for (var k in s.tones) nextTones[k] = s.tones[k];
        nextTones[eventKey] = toneId;
        setValue('tones', nextTones);
      }
      function toggle(key) { setValue(key, !s[key]); }
      // 一个事件行：开关 + 说明 + 音色下拉 + 试听
      function eventrow(key, label, hint) {
        var opts = [];
        for (var i = 0; i < TONE_IDS.length; i++) {
          var id = TONE_IDS[i];
          opts.push(React.createElement('option', { key: id, value: id }, tl(TONE_NAME_KEYS[id])));
        }
        return React.createElement('div', { key: key, className: 'dshnotify-eventrow' },
          React.createElement('label', { className: 'dshnotify-evleft' },
            React.createElement('input', {
              type: 'checkbox',
              checked: s[key] === true,
              onChange: function () { toggle(key); }
            }),
            React.createElement('span', null, label),
            hint ? React.createElement('span', { className: 'dshnotify-hint' }, hint) : null
          ),
          React.createElement('span', { className: 'dshnotify-evright' },
            React.createElement('select', {
              className: 'dshnotify-select',
              value: s.tones[key],
              onChange: function (ev) { setTone(key, ev.target.value); }
            }, opts),
            React.createElement('button', {
              className: 'dshnotify-test',
              onClick: function () { ctl.preview(key); }
            }, tl('preview'))
          )
        );
      }
      var body = open ? React.createElement('div', { className: 'dshnotify-setbody' },
        eventrow('done', tl('done'), tl('hintDone')),
        eventrow('approval', tl('approval'), tl('hintAlways')),
        eventrow('question', tl('question'), tl('hintAlways')),
        eventrow('error', tl('error'), tl('hintAway')),
        React.createElement('div', { key: 'sound', className: 'dshnotify-eventrow' },
          React.createElement('label', { className: 'dshnotify-evleft' },
            React.createElement('input', {
              type: 'checkbox',
              checked: s.sound === true,
              onChange: function () { toggle('sound'); }
            }),
            React.createElement('span', null, tl('sound'))
          ),
          React.createElement('span', { className: 'dshnotify-evright' },
            React.createElement('input', {
              type: 'range', min: 0, max: 1, step: 0.05,
              className: 'dshnotify-range',
              value: s.volume,
              onChange: function (ev) { setValue('volume', Number(ev.target.value)); }
            }),
            React.createElement('span', { className: 'dshnotify-volval' }, Math.round(s.volume * 100) + '%')
          )
        ),
        React.createElement('div', { key: 'away', className: 'dshnotify-eventrow' },
          React.createElement('label', { className: 'dshnotify-evleft' },
            React.createElement('input', {
              type: 'checkbox',
              checked: s.awayOnly === true,
              onChange: function () { toggle('awayOnly'); }
            }),
            React.createElement('span', null, tl('awayOnly')),
            React.createElement('span', { className: 'dshnotify-hint' }, tl('hintAwayOnly'))
          ),
          React.createElement('span', { className: 'dshnotify-evright' }, null)
        ),
        React.createElement('label', { key: 'popup', className: 'dshnotify-setrow' },
          React.createElement('input', {
            type: 'checkbox',
            checked: s.popup === true,
            onChange: function () { toggle('popup'); }
          }),
          React.createElement('span', null, tl('popup')),
          React.createElement('span', { className: 'dshnotify-hint' }, tl('hintPopup'))
        ),
        React.createElement('div', { key: 'tests', className: 'dshnotify-tests' },
          React.createElement('button', { className: 'dshnotify-test', onClick: function () { ctl.testToast(); } }, tl('testToast')),
          React.createElement('button', { className: 'dshnotify-test', onClick: function () { ctl.requestPerm(); } }, tl('requestPerm'))
        ),
        React.createElement('div', { key: 'hint', className: 'dshnotify-hintline' }, tl('hintLine'))
      ) : null;
      return React.createElement('div', { className: 'dshnotify-rowwrap' },
        React.createElement('button', {
          className: 'dshnotify-head',
          onClick: function () { setOpen(!open); }
        },
          React.createElement('span', null, tl('title')),
          React.createElement('span', { className: 'dshnotify-chevron' + (open ? ' dshnotify-open' : '') }, '▶')
        ),
        body
      );
    }

    // ── 启动 ──
    function apply(ctx) {
      // HMR 幂等：清掉热重载残留的旧元素
      clearStaleElements();
      injectStyles();
      rootCtx = ctx;
      var settings = loadSettings();
      // 中英文翻译：locale 是硬依赖（inject 声明），apply 时必然就绪；
      // 用 untyped 单语言形式注册（明确支持非合并表命名空间），disposer 随生命周期注销
      var locale = ctx.get('locale');
      var localeUnsub = null;
      if (locale !== undefined && typeof locale.register === 'function' && typeof locale.bind === 'function') {
        try {
          // 若上一次 apply 的字典还挂着（旧 cleanup 未跑），先注销再注册（HMR 重载安全）
          if (localeDisposers !== null) {
            try { localeDisposers(); } catch (e) { /* 忽略 */ }
            localeDisposers = null;
          }
          var dZh = locale.register(I18N_NS, 'zh', I18N.zh);
          var dEn = locale.register(I18N_NS, 'en', I18N.en);
          localeDisposers = function () {
            try { if (dZh) dZh(); } catch (e) { /* 忽略 */ }
            try { if (dEn) dEn(); } catch (e) { /* 忽略 */ }
          };
          var bound = locale.bind(I18N_NS);
          translate = function (key) { return bound(key); };
          if (typeof locale.subscribe === 'function') localeUnsub = locale.subscribe(function () { /* bind 调用时读当前语言，无需缓存 */ });
        } catch (e) { /* locale 注册失败则保留中文回落 */ }
      }
      var controller = {
        get: function () { return settings; },
        set: function (next) {
          settings = next;
          volumeLevel = next.volume;
          saveSettings(next);
        },
        // 试听某场景音色（选择下拉旁的「试听」按钮）
        preview: function (eventKey) {
          ensureAudio();
          playTone(settings.tones[eventKey]);
        },
        testToast: function () {
          requestNotifyPermission();
          showToast('approval', translate('notifApproval'), translate('testToastBody'), null);
        },
        requestPerm: function () {
          requestNotifyPermission();
        }
      };
      try {
        var slots = ctx.get('slots');
        if (slots !== undefined && typeof slots.inject === 'function') {
          // 通用设置页条目：与「语言」(order 0)「外观」(order 10)「Agent 预设」(order 20) 同级，
          // 避开外观(10) 与「个性化外观」(15) 的邻近区域，order 30 独立成项
          slots.inject('settings.general.item', function () {
            return slots.register(
              { name: 'settings.general.item', id: 'dsh-notify', order: 30 },
              function () { return React.createElement(NotifyRow, { ctl: controller, tl: translate, locale: locale }); }
            );
          });
        }
      } catch (e) { /* 设置槽不可用则跳过，核心提醒不受影响 */ }
      var watcher = createWatcher(ctx, function () { return settings; });
      watcher.start();
      // 首次点击页面：解锁音频上下文 + 请求通知权限（浏览器策略要求用户手势）
      var unlock = function () {
        ensureAudio();
        requestNotifyPermission();
        document.removeEventListener('pointerdown', unlock);
      };
      document.addEventListener('pointerdown', unlock);
      ctx.effect(function () {
        return function () {
          watcher.stop();
          document.removeEventListener('pointerdown', unlock);
          if (localeUnsub !== null) { try { localeUnsub(); } catch (e) { /* 忽略 */ } localeUnsub = null; }
          if (localeDisposers !== null) {
            try { localeDisposers(); } catch (e) { /* 忽略 */ }
            localeDisposers = null;
          }
          if (toastBox !== null) {
            toastBox.remove();
            toastBox = null;
          }
          setBadge(false);
          rootCtx = null;
          var st = document.querySelector('style[data-plugin-css="dsh-notify/ui"]');
          if (st !== null) st.remove();
        };
      }, 'dsh-notify: cleanup');
    }

    exports.apply = apply;
    // slots / locale / sessions 是硬依赖：设置行注入 + 中英文词典注册 + 信号检测
    // 都需要它们就绪（sessions 未就绪时静默跳过会导致永不提醒，故声明为硬依赖）
    exports.inject = ['slots', 'locale', 'sessions'];
    return module.exports;
  }
});
